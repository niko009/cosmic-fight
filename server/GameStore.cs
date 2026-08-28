using System.Text.Json;
using Npgsql;
using NpgsqlTypes;

namespace CosmicFight.Server;

public sealed class GameStore(NpgsqlDataSource dataSource, ILogger<GameStore> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task EnsureSchemaAsync(CancellationToken cancellationToken = default)
    {
        const string sql = """
        CREATE TABLE IF NOT EXISTS players (
            id uuid PRIMARY KEY,
            provider text NOT NULL,
            external_subject text NULL,
            display_name text NOT NULL,
            email text NULL,
            avatar_url text NULL,
            credits integer NOT NULL DEFAULT 500,
            xp integer NOT NULL DEFAULT 0,
            rating integer NOT NULL DEFAULT 1000,
            victories integer NOT NULL DEFAULT 0,
            defeats integer NOT NULL DEFAULT 0,
            upgrades jsonb NOT NULL DEFAULT '{}'::jsonb,
            loadout jsonb NOT NULL DEFAULT '{}'::jsonb,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );
        ALTER TABLE players ADD COLUMN IF NOT EXISTS loadout jsonb NOT NULL DEFAULT '{}'::jsonb;
        CREATE UNIQUE INDEX IF NOT EXISTS ux_players_provider_subject ON players(provider, external_subject) WHERE external_subject IS NOT NULL;
        CREATE TABLE IF NOT EXISTS match_summaries (
            id uuid PRIMARY KEY, player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
            opponent_name text NOT NULL, result text NOT NULL, turns integer NOT NULL,
            credits_delta integer NOT NULL, xp_delta integer NOT NULL, rating_delta integer NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS ix_match_summaries_player_created ON match_summaries(player_id, created_at DESC);
        """;
        await using var command = dataSource.CreateCommand(sql);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<PlayerProfile> GetOrCreateGuestAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await GetPlayerAsync(id, cancellationToken);
        if (existing is not null) return existing;
        await using var command = dataSource.CreateCommand("INSERT INTO players(id,provider,external_subject,display_name) VALUES (@id,'guest',@subject,'Guest Pilot') ON CONFLICT (id) DO NOTHING;");
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("subject", id.ToString("N"));
        await command.ExecuteNonQueryAsync(cancellationToken);
        return await GetPlayerAsync(id, cancellationToken) ?? throw new InvalidOperationException("Unable to create guest player");
    }

    public async Task<PlayerProfile?> GetPlayerAsync(Guid id, CancellationToken ct = default)
    {
        await using var command = dataSource.CreateCommand("SELECT id,provider,display_name,email,avatar_url,credits,xp,rating,victories,defeats,upgrades::text FROM players WHERE id=@id");
        command.Parameters.AddWithValue("id", id);
        await using var reader = await command.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct) ? ReadPlayer(reader) : null;
    }

    public async Task<ShipLoadout> GetLoadoutAsync(Guid playerId, CancellationToken ct = default)
    {
        await using var command = dataSource.CreateCommand("SELECT loadout::text FROM players WHERE id=@id");
        command.Parameters.AddWithValue("id", playerId);
        var raw = await command.ExecuteScalarAsync(ct) as string;
        if (string.IsNullOrWhiteSpace(raw) || raw == "{}") return ShipLoadout.Default;
        try { return NormalizeLoadout(JsonSerializer.Deserialize<ShipLoadout>(raw, JsonOptions) ?? ShipLoadout.Default); }
        catch { return ShipLoadout.Default; }
    }

    public async Task<ShipLoadout> SaveLoadoutAsync(Guid playerId, SaveLoadoutRequest request, CancellationToken ct = default)
    {
        var normalized = NormalizeLoadout(new ShipLoadout(request.Weapons, request.Modules));
        await using var command = dataSource.CreateCommand("UPDATE players SET loadout=@loadout::jsonb,updated_at=now() WHERE id=@id");
        command.Parameters.AddWithValue("id", playerId);
        command.Parameters.AddWithValue("loadout", JsonSerializer.Serialize(normalized, JsonOptions));
        if (await command.ExecuteNonQueryAsync(ct) == 0) throw new InvalidOperationException("Player not found");
        return normalized;
    }

    public static ShipLoadout NormalizeLoadout(ShipLoadout loadout)
    {
        var defaults = ShipLoadout.Default.Modules.ToDictionary(m => m.Id, StringComparer.OrdinalIgnoreCase);
        var allowedModuleIds = defaults.Keys.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var weapons = (loadout.Weapons ?? [])
            .Where(CombatEngine.AllowedWeapons.Contains)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(2)
            .ToList();
        if (weapons.Count == 0) weapons.Add("laser");

        var incoming = (loadout.Modules ?? [])
            .Where(m => allowedModuleIds.Contains(m.Id))
            .GroupBy(m => m.Id, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.Last())
            .ToDictionary(m => m.Id, StringComparer.OrdinalIgnoreCase);

        void Ensure(string id)
        {
            if (!incoming.ContainsKey(id)) incoming[id] = defaults[id];
        }

        // Core and hull are structural contracts. A ship must also retain one weapon mount and one engine.
        Ensure("core");
        Ensure("hull");
        if (!incoming.Keys.Any(id => id.StartsWith("weapon-", StringComparison.OrdinalIgnoreCase))) Ensure("weapon-left");
        if (!incoming.Keys.Any(id => id.StartsWith("engine-", StringComparison.OrdinalIgnoreCase))) Ensure("engine-left");

        var modules = incoming.Values
            .Select(m => new ModulePlacement(m.Id, Math.Clamp(m.X, 6, 94), Math.Clamp(m.Y, 8, 92)))
            .OrderBy(m => Array.FindIndex(ShipLoadout.Default.Modules.ToArray(), d => d.Id.Equals(m.Id, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        return new(weapons, modules);
    }

    public async Task<PlayerProfile> UpsertGoogleAsync(Guid? currentPlayerId, string subject, string? email, string displayName, string? avatarUrl, CancellationToken ct = default)
    {
        var existing = await FindByExternalIdentityAsync("google", subject, ct);
        if (existing is not null)
        {
            await UpdateGoogleSnapshotAsync(existing.Id, email, displayName, avatarUrl, ct);
            return await GetPlayerAsync(existing.Id, ct) ?? existing;
        }
        if (currentPlayerId is Guid currentId && await GetPlayerAsync(currentId, ct) is { IsGuest: true })
        {
            await using var migrate = dataSource.CreateCommand("UPDATE players SET provider='google',external_subject=@subject,display_name=@name,email=@email,avatar_url=@avatar,updated_at=now() WHERE id=@id AND provider='guest'");
            migrate.Parameters.AddWithValue("id", currentId);
            migrate.Parameters.AddWithValue("subject", subject);
            migrate.Parameters.AddWithValue("name", displayName);
            migrate.Parameters.AddWithValue("email", NpgsqlDbType.Text, (object?)email ?? DBNull.Value);
            migrate.Parameters.AddWithValue("avatar", NpgsqlDbType.Text, (object?)avatarUrl ?? DBNull.Value);
            await migrate.ExecuteNonQueryAsync(ct);
            return await GetPlayerAsync(currentId, ct) ?? throw new InvalidOperationException("Unable to migrate guest profile");
        }

        var id = Guid.NewGuid();
        await using var insert = dataSource.CreateCommand("INSERT INTO players(id,provider,external_subject,display_name,email,avatar_url) VALUES (@id,'google',@subject,@name,@email,@avatar)");
        insert.Parameters.AddWithValue("id", id);
        insert.Parameters.AddWithValue("subject", subject);
        insert.Parameters.AddWithValue("name", displayName);
        insert.Parameters.AddWithValue("email", NpgsqlDbType.Text, (object?)email ?? DBNull.Value);
        insert.Parameters.AddWithValue("avatar", NpgsqlDbType.Text, (object?)avatarUrl ?? DBNull.Value);
        await insert.ExecuteNonQueryAsync(ct);
        return await GetPlayerAsync(id, ct) ?? throw new InvalidOperationException("Unable to create Google player");
    }

    public async Task<PlayerProfile> PurchaseUpgradeAsync(Guid playerId, string upgrade, CancellationToken ct = default)
    {
        var player = await GetPlayerAsync(playerId, ct) ?? throw new InvalidOperationException("Player not found");
        var key = upgrade.Trim().ToLowerInvariant();
        if (!CombatEngine.AllowedUpgrades.Contains(key)) throw new ArgumentException("Unknown upgrade");
        var levels = player.Upgrades.ToDictionary(x => x.Key, x => x.Value, StringComparer.OrdinalIgnoreCase);
        var current = levels.GetValueOrDefault(key);
        if (current >= 5) throw new InvalidOperationException("Upgrade is already at maximum level");
        var cost = 100 * (current + 1);
        if (player.Credits < cost) throw new InvalidOperationException("Not enough credits");
        levels[key] = current + 1;
        await using var command = dataSource.CreateCommand("UPDATE players SET credits=credits-@cost,upgrades=@upgrades::jsonb,updated_at=now() WHERE id=@id");
        command.Parameters.AddWithValue("id", playerId);
        command.Parameters.AddWithValue("cost", cost);
        command.Parameters.AddWithValue("upgrades", JsonSerializer.Serialize(levels, JsonOptions));
        await command.ExecuteNonQueryAsync(ct);
        return await GetPlayerAsync(playerId, ct) ?? throw new InvalidOperationException("Player missing");
    }

    public async Task<PlayerProfile> RecordBattleResultAsync(Guid playerId, string opponent, bool won, int turns, CancellationToken ct = default)
    {
        var credits = won ? 120 : 40;
        var xp = won ? 80 : 25;
        var rating = won ? 18 : -12;
        await using var connection = await dataSource.OpenConnectionAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);
        await using (var update = new NpgsqlCommand("UPDATE players SET credits=credits+@credits,xp=xp+@xp,rating=GREATEST(0,rating+@rating),victories=victories+CASE WHEN @won THEN 1 ELSE 0 END,defeats=defeats+CASE WHEN @won THEN 0 ELSE 1 END,updated_at=now() WHERE id=@id", connection, transaction))
        {
            update.Parameters.AddWithValue("id", playerId);
            update.Parameters.AddWithValue("credits", credits);
            update.Parameters.AddWithValue("xp", xp);
            update.Parameters.AddWithValue("rating", rating);
            update.Parameters.AddWithValue("won", won);
            await update.ExecuteNonQueryAsync(ct);
        }
        await using (var insert = new NpgsqlCommand("INSERT INTO match_summaries(id,player_id,opponent_name,result,turns,credits_delta,xp_delta,rating_delta) VALUES (@id,@playerId,@opponent,@result,@turns,@credits,@xp,@rating)", connection, transaction))
        {
            insert.Parameters.AddWithValue("id", Guid.NewGuid());
            insert.Parameters.AddWithValue("playerId", playerId);
            insert.Parameters.AddWithValue("opponent", opponent);
            insert.Parameters.AddWithValue("result", won ? "victory" : "defeat");
            insert.Parameters.AddWithValue("turns", turns);
            insert.Parameters.AddWithValue("credits", credits);
            insert.Parameters.AddWithValue("xp", xp);
            insert.Parameters.AddWithValue("rating", rating);
            await insert.ExecuteNonQueryAsync(ct);
        }
        await transaction.CommitAsync(ct);
        logger.LogInformation("Settled battle for {PlayerId}: {Result}", playerId, won ? "victory" : "defeat");
        return await GetPlayerAsync(playerId, ct) ?? throw new InvalidOperationException("Player missing after settlement");
    }

    private async Task<PlayerProfile?> FindByExternalIdentityAsync(string provider, string subject, CancellationToken ct)
    {
        await using var command = dataSource.CreateCommand("SELECT id,provider,display_name,email,avatar_url,credits,xp,rating,victories,defeats,upgrades::text FROM players WHERE provider=@provider AND external_subject=@subject");
        command.Parameters.AddWithValue("provider", provider);
        command.Parameters.AddWithValue("subject", subject);
        await using var reader = await command.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct) ? ReadPlayer(reader) : null;
    }

    private async Task UpdateGoogleSnapshotAsync(Guid id, string? email, string displayName, string? avatarUrl, CancellationToken ct)
    {
        await using var command = dataSource.CreateCommand("UPDATE players SET display_name=@name,email=@email,avatar_url=@avatar,updated_at=now() WHERE id=@id");
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("name", displayName);
        command.Parameters.AddWithValue("email", NpgsqlDbType.Text, (object?)email ?? DBNull.Value);
        command.Parameters.AddWithValue("avatar", NpgsqlDbType.Text, (object?)avatarUrl ?? DBNull.Value);
        await command.ExecuteNonQueryAsync(ct);
    }

    private static PlayerProfile ReadPlayer(NpgsqlDataReader reader)
    {
        var upgrades = JsonSerializer.Deserialize<Dictionary<string, int>>(reader.GetString(10), JsonOptions) ?? new();
        return new(
            reader.GetGuid(0), reader.GetString(1), reader.GetString(2),
            reader.IsDBNull(3) ? null : reader.GetString(3),
            reader.IsDBNull(4) ? null : reader.GetString(4),
            reader.GetInt32(5), reader.GetInt32(6), reader.GetInt32(7), reader.GetInt32(8), reader.GetInt32(9), upgrades);
    }
}
