using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.WebUtilities;

namespace CosmicFight.Server;

public sealed class GoogleAuthOptions
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
    public bool IsConfigured => !string.IsNullOrWhiteSpace(ClientId) && !string.IsNullOrWhiteSpace(ClientSecret);
}

public sealed record GoogleUser(string Subject, string? Email, string Name, string? Picture);

public sealed class GoogleOAuthService(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<GoogleOAuthService> logger)
{
    private readonly GoogleAuthOptions _options = configuration.GetSection("Authentication:Google").Get<GoogleAuthOptions>() ?? new();

    public bool IsConfigured => _options.IsConfigured;

    public string BuildChallengeUrl(HttpContext context)
    {
        if (!IsConfigured) throw new InvalidOperationException("Google authentication is not configured");

        var state = Base64Url(RandomNumberGenerator.GetBytes(24));
        var verifier = Base64Url(RandomNumberGenerator.GetBytes(48));
        var challenge = Base64Url(SHA256.HashData(Encoding.ASCII.GetBytes(verifier)));
        var redirectUri = ResolveRedirectUri(context);

        context.Response.Cookies.Append("cf_oauth", $"{state}.{verifier}", new CookieOptions
        {
            HttpOnly = true,
            Secure = context.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            MaxAge = TimeSpan.FromMinutes(10),
            Path = "/auth/google/callback"
        });

        return QueryHelpers.AddQueryString("https://accounts.google.com/o/oauth2/v2/auth", new Dictionary<string, string?>
        {
            ["client_id"] = _options.ClientId,
            ["redirect_uri"] = redirectUri,
            ["response_type"] = "code",
            ["scope"] = "openid email profile",
            ["state"] = state,
            ["code_challenge"] = challenge,
            ["code_challenge_method"] = "S256",
            ["prompt"] = "select_account",
            ["access_type"] = "online"
        });
    }

    public async Task<GoogleUser> CompleteAsync(HttpContext context, string code, string state, CancellationToken cancellationToken)
    {
        if (!IsConfigured) throw new InvalidOperationException("Google authentication is not configured");
        if (!context.Request.Cookies.TryGetValue("cf_oauth", out var temp) || string.IsNullOrWhiteSpace(temp))
            throw new InvalidOperationException("OAuth state cookie is missing");

        var separator = temp.IndexOf('.');
        if (separator <= 0) throw new InvalidOperationException("OAuth state cookie is invalid");
        var expectedState = temp[..separator];
        var verifier = temp[(separator + 1)..];
        context.Response.Cookies.Delete("cf_oauth", new CookieOptions { Path = "/auth/google/callback" });

        if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expectedState), Encoding.UTF8.GetBytes(state)))
            throw new InvalidOperationException("OAuth state mismatch");

        var client = httpClientFactory.CreateClient(nameof(GoogleOAuthService));
        using var tokenResponse = await client.PostAsync("https://oauth2.googleapis.com/token", new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = _options.ClientId,
            ["client_secret"] = _options.ClientSecret,
            ["code"] = code,
            ["code_verifier"] = verifier,
            ["grant_type"] = "authorization_code",
            ["redirect_uri"] = ResolveRedirectUri(context)
        }), cancellationToken);

        var tokenJson = await tokenResponse.Content.ReadAsStringAsync(cancellationToken);
        if (!tokenResponse.IsSuccessStatusCode)
        {
            logger.LogWarning("Google token exchange failed: {Status}", tokenResponse.StatusCode);
            throw new InvalidOperationException("Google token exchange failed");
        }

        using var tokenDocument = JsonDocument.Parse(tokenJson);
        if (!tokenDocument.RootElement.TryGetProperty("access_token", out var accessTokenElement))
            throw new InvalidOperationException("Google access token is missing");
        var accessToken = accessTokenElement.GetString() ?? throw new InvalidOperationException("Google access token is empty");

        using var request = new HttpRequestMessage(HttpMethod.Get, "https://openidconnect.googleapis.com/v1/userinfo");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var userResponse = await client.SendAsync(request, cancellationToken);
        var userJson = await userResponse.Content.ReadAsStringAsync(cancellationToken);
        if (!userResponse.IsSuccessStatusCode) throw new InvalidOperationException("Google userinfo request failed");

        using var userDocument = JsonDocument.Parse(userJson);
        var root = userDocument.RootElement;
        var subject = root.GetProperty("sub").GetString() ?? throw new InvalidOperationException("Google subject is missing");
        var email = root.TryGetProperty("email", out var emailElement) ? emailElement.GetString() : null;
        var name = root.TryGetProperty("name", out var nameElement) ? nameElement.GetString() : null;
        var picture = root.TryGetProperty("picture", out var pictureElement) ? pictureElement.GetString() : null;
        return new GoogleUser(subject, email, string.IsNullOrWhiteSpace(name) ? "Cosmic Pilot" : name!, picture);
    }

    private string ResolveRedirectUri(HttpContext context)
    {
        if (!string.IsNullOrWhiteSpace(_options.RedirectUri)) return _options.RedirectUri;
        return $"{context.Request.Scheme}://{context.Request.Host}/auth/google/callback";
    }

    private static string Base64Url(byte[] value) => WebEncoders.Base64UrlEncode(value);
}
