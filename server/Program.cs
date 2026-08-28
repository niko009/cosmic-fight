using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using CosmicFight.Server;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is required");

builder.Services.AddSingleton(NpgsqlDataSource.Create(connectionString));
builder.Services.AddSingleton<GameStore>();
builder.Services.AddSingleton<CombatEngine>();
builder.Services.AddSingleton<PresenceTracker>();
builder.Services.AddHttpClient(nameof(GoogleOAuthService), client => client.Timeout = TimeSpan.FromSeconds(20));
builder.Services.AddSingleton<GoogleOAuthService>();
builder.Services.AddSignalR(options => options.EnableDetailedErrors = false);
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "cf_session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.ExpireTimeSpan = TimeSpan.FromDays(30);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api") || context.Request.Path.StartsWithSegments("/hubs"))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            }
            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("api", limiter =>
    {
        limiter.PermitLimit = 120;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueLimit = 0;
        limiter.AutoReplenishment = true;
    });
    options.AddFixedWindowLimiter("auth", limiter =>
    {
        limiter.PermitLimit = 20;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueLimit = 0;
        limiter.AutoReplenishment = true;
    });
});
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();
app.UseForwardedHeaders();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

await app.Services.GetRequiredService<GameStore>().EnsureSchemaAsync();

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "cosmic-fight",
    at = DateTimeOffset.UtcNow
}));

app.MapGet("/version.json", (IConfiguration configuration) => Results.Ok(new VersionResponse(
    configuration["App:Version"] ?? "0.1.0",
    configuration["App:Commit"] ?? "unknown",
    DateTimeOffset.UtcNow)));

app.MapGet("/api/auth/config", (GoogleOAuthService google) => Results.Ok(new AuthConfig(google.IsConfigured)))
    .RequireRateLimiting("api");

app.MapPost("/api/auth/guest", async (HttpContext context, GameStore store, CancellationToken cancellationToken) =>
{
    if (AuthHelpers.PlayerId(context.User) is Guid existingId && await store.GetPlayerAsync(existingId, cancellationToken) is { } existing)
        return Results.Ok(existing);

    var player = await store.GetOrCreateGuestAsync(Guid.NewGuid(), cancellationToken);
    await AuthHelpers.SignInAsync(context, player);
    return Results.Ok(player);
}).RequireRateLimiting("auth");

app.MapGet("/api/auth/me", async (HttpContext context, GameStore store, CancellationToken cancellationToken) =>
{
    var playerId = AuthHelpers.PlayerId(context.User);
    if (playerId is null) return Results.Unauthorized();
    var player = await store.GetPlayerAsync(playerId.Value, cancellationToken);
    return player is null ? Results.Unauthorized() : Results.Ok(player);
}).RequireRateLimiting("api");

app.MapPost("/api/auth/logout", async (HttpContext context) =>
{
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.NoContent();
}).RequireAuthorization().RequireRateLimiting("auth");

app.MapGet("/auth/google", (HttpContext context, GoogleOAuthService google) =>
{
    if (!google.IsConfigured) return Results.Redirect("/?auth=not-configured");
    return Results.Redirect(google.BuildChallengeUrl(context));
}).RequireRateLimiting("auth");

app.MapGet("/auth/google/callback", async (
    HttpContext context,
    string? code,
    string? state,
    string? error,
    GoogleOAuthService google,
    GameStore store,
    CancellationToken cancellationToken) =>
{
    if (!string.IsNullOrWhiteSpace(error) || string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
        return Results.Redirect("/?auth=cancelled");

    try
    {
        var googleUser = await google.CompleteAsync(context, code, state, cancellationToken);
        var currentPlayerId = AuthHelpers.PlayerId(context.User);
        var player = await store.UpsertGoogleAsync(currentPlayerId, googleUser.Subject, googleUser.Email, googleUser.Name, googleUser.Picture, cancellationToken);
        await AuthHelpers.SignInAsync(context, player);
        return Results.Redirect("/?auth=success");
    }
    catch (Exception exception)
    {
        app.Logger.LogWarning(exception, "Google authentication failed");
        return Results.Redirect("/?auth=failed");
    }
}).RequireRateLimiting("auth");

var api = app.MapGroup("/api").RequireAuthorization().RequireRateLimiting("api");

api.MapGet("/profile", async (HttpContext context, GameStore store, CancellationToken cancellationToken) =>
{
    var player = await store.GetPlayerAsync(AuthHelpers.RequirePlayerId(context.User), cancellationToken);
    return player is null ? Results.NotFound() : Results.Ok(player);
});

api.MapPost("/profile/upgrades", async (HttpContext context, UpgradeRequest request, GameStore store, CancellationToken cancellationToken) =>
{
    try
    {
        var player = await store.PurchaseUpgradeAsync(AuthHelpers.RequirePlayerId(context.User), request.Upgrade, cancellationToken);
        return Results.Ok(player);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }
    catch (InvalidOperationException exception)
    {
        return Results.Conflict(new { error = exception.Message });
    }
});

api.MapPost("/battles/ai", async (HttpContext context, GameStore store, CombatEngine engine, CancellationToken cancellationToken) =>
{
    var player = await store.GetPlayerAsync(AuthHelpers.RequirePlayerId(context.User), cancellationToken);
    if (player is null) return Results.NotFound();
    var battle = engine.CreateAiBattle(player);
    return Results.Ok(engine.Snapshot(battle));
});

api.MapGet("/battles/{battleId:guid}", (HttpContext context, Guid battleId, CombatEngine engine) =>
{
    var battle = engine.GetBattle(battleId);
    if (battle is null || battle.PlayerId != AuthHelpers.RequirePlayerId(context.User)) return Results.NotFound();
    return Results.Ok(engine.Snapshot(battle));
});

api.MapPost("/battles/{battleId:guid}/actions", async (
    HttpContext context,
    Guid battleId,
    BattleActionRequest request,
    CombatEngine engine,
    GameStore store,
    CancellationToken cancellationToken) =>
{
    var battle = engine.GetBattle(battleId);
    if (battle is null || battle.PlayerId != AuthHelpers.RequirePlayerId(context.User)) return Results.NotFound();

    try
    {
        lock (battle)
        {
            engine.ApplyPlayerAction(battle, request);
        }
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }
    catch (InvalidOperationException exception)
    {
        return Results.Conflict(new { error = exception.Message });
    }

    if (battle.Status == "finished" && !battle.Settled)
    {
        lock (battle)
        {
            if (!battle.Settled) battle.Settled = true;
            else return Results.Ok(engine.Snapshot(battle));
        }
        await store.RecordBattleResultAsync(battle.PlayerId, battle.EnemyShip.Name, battle.Winner == "player", battle.Turn, cancellationToken);
    }

    return Results.Ok(engine.Snapshot(battle));
});

api.MapGet("/arena/status", (PresenceTracker presence) => Results.Ok(new { online = presence.OnlineCount, mode = "ai-vertical-slice" }));

app.MapHub<GameHub>("/hubs/game").RequireAuthorization();

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = context =>
    {
        if (context.File.Name is "index.html" or "sw.js")
            context.Context.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
    }
});
app.MapFallbackToFile("index.html");

app.Run();

public static class AuthHelpers
{
    public static Guid? PlayerId(ClaimsPrincipal? principal)
    {
        var raw = principal?.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }

    public static Guid RequirePlayerId(ClaimsPrincipal principal) =>
        PlayerId(principal) ?? throw new UnauthorizedAccessException("Player identity is missing");

    public static Task SignInAsync(HttpContext context, PlayerProfile player)
    {
        var identity = new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, player.Id.ToString()),
            new Claim(ClaimTypes.Name, player.DisplayName),
            new Claim("provider", player.Provider)
        ], CookieAuthenticationDefaults.AuthenticationScheme);
        return context.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = true, ExpiresUtc = DateTimeOffset.UtcNow.AddDays(30) });
    }
}
