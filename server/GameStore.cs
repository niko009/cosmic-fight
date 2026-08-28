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
        var existing=await GetPlayerAsync(id,cancellationToken); if(existing is not null)return existing;
        await using var c=dataSource.CreateCommand("INSERT INTO players(id,provider,external_subject,display_name) VALUES (@id,'guest',@subject,'Guest Pilot') ON CONFLICT (id) DO NOTHING;");
        c.Parameters.AddWithValue("id",id);c.Parameters.AddWithValue("subject",id.ToString("N"));await c.ExecuteNonQueryAsync(cancellationToken);
        return await GetPlayerAsync(id,cancellationToken)??throw new InvalidOperationException("Unable to create guest player");
    }

    public async Task<PlayerProfile?> GetPlayerAsync(Guid id,CancellationToken ct=default)
    {
        await using var c=dataSource.CreateCommand("SELECT id,provider,display_name,email,avatar_url,credits,xp,rating,victories,defeats,upgrades::text FROM players WHERE id=@id");c.Parameters.AddWithValue("id",id);
        await using var r=await c.ExecuteReaderAsync(ct);return await r.ReadAsync(ct)?ReadPlayer(r):null;
    }

    public async Task<ShipLoadout> GetLoadoutAsync(Guid playerId,CancellationToken ct=default)
    {
        await using var c=dataSource.CreateCommand("SELECT loadout::text FROM players WHERE id=@id");c.Parameters.AddWithValue("id",playerId);var raw=await c.ExecuteScalarAsync(ct) as string;
        if(string.IsNullOrWhiteSpace(raw)||raw=="{}")return ShipLoadout.Default;
        try{return NormalizeLoadout(JsonSerializer.Deserialize<ShipLoadout>(raw,JsonOptions)??ShipLoadout.Default);}catch{return ShipLoadout.Default;}
    }

    public async Task<ShipLoadout> SaveLoadoutAsync(Guid playerId,SaveLoadoutRequest request,CancellationToken ct=default)
    {
        var normalized=NormalizeLoadout(new ShipLoadout(request.Weapons,request.Modules));
        await using var c=dataSource.CreateCommand("UPDATE players SET loadout=@loadout::jsonb,updated_at=now() WHERE id=@id");c.Parameters.AddWithValue("id",playerId);c.Parameters.AddWithValue("loadout",JsonSerializer.Serialize(normalized,JsonOptions));
        if(await c.ExecuteNonQueryAsync(ct)==0)throw new InvalidOperationException("Player not found");return normalized;
    }

    public static ShipLoadout NormalizeLoadout(ShipLoadout loadout)
    {
        var allowedModuleIds=ShipLoadout.Default.Modules.Select(m=>m.Id).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var weapons=(loadout.Weapons??[]).Where(CombatEngine.AllowedWeapons.Contains).Distinct(StringComparer.OrdinalIgnoreCase).Take(2).ToList();if(weapons.Count==0)weapons.Add("laser");
        var incoming=(loadout.Modules??[]).Where(m=>allowedModuleIds.Contains(m.Id)).GroupBy(m=>m.Id,StringComparer.OrdinalIgnoreCase).ToDictionary(g=>g.Key,g=>g.Last(),StringComparer.OrdinalIgnoreCase);
        var modules=ShipLoadout.Default.Modules.Select(d=>incoming.TryGetValue(d.Id,out var p)?new ModulePlacement(d.Id,Math.Clamp(p.X,6,94),Math.Clamp(p.Y,8,92)):d).ToList();
        return new(weapons,modules);
    }

    public async Task<PlayerProfile> UpsertGoogleAsync(Guid? currentPlayerId,string subject,string? email,string displayName,string? avatarUrl,CancellationToken ct=default)
    {
        var existing=await FindByExternalIdentityAsync("google",subject,ct);if(existing is not null){await UpdateGoogleSnapshotAsync(existing.Id,email,displayName,avatarUrl,ct);return await GetPlayerAsync(existing.Id,ct)??existing;}
        if(currentPlayerId is Guid currentId&&await GetPlayerAsync(currentId,ct) is {IsGuest:true})
        {
            await using var m=dataSource.CreateCommand("UPDATE players SET provider='google',external_subject=@subject,display_name=@name,email=@email,avatar_url=@avatar,updated_at=now() WHERE id=@id AND provider='guest'");
            m.Parameters.AddWithValue("id",currentId);m.Parameters.AddWithValue("subject",subject);m.Parameters.AddWithValue("name",displayName);m.Parameters.AddWithValue("email",NpgsqlDbType.Text,(object?)email??DBNull.Value);m.Parameters.AddWithValue("avatar",NpgsqlDbType.Text,(object?)avatarUrl??DBNull.Value);await m.ExecuteNonQueryAsync(ct);
            return await GetPlayerAsync(currentId,ct)??throw new InvalidOperationException("Unable to migrate guest profile");
        }
        var id=Guid.NewGuid();await using var i=dataSource.CreateCommand("INSERT INTO players(id,provider,external_subject,display_name,email,avatar_url) VALUES (@id,'google',@subject,@name,@email,@avatar)");
        i.Parameters.AddWithValue("id",id);i.Parameters.AddWithValue("subject",subject);i.Parameters.AddWithValue("name",displayName);i.Parameters.AddWithValue("email",NpgsqlDbType.Text,(object?)email??DBNull.Value);i.Parameters.AddWithValue("avatar",NpgsqlDbType.Text,(object?)avatarUrl??DBNull.Value);await i.ExecuteNonQueryAsync(ct);
        return await GetPlayerAsync(id,ct)??throw new InvalidOperationException("Unable to create Google player");
    }

    public async Task<PlayerProfile> PurchaseUpgradeAsync(Guid playerId,string upgrade,CancellationToken ct=default)
    {
        var p=await GetPlayerAsync(playerId,ct)??throw new InvalidOperationException("Player not found");var key=upgrade.Trim().ToLowerInvariant();if(!CombatEngine.AllowedUpgrades.Contains(key))throw new ArgumentException("Unknown upgrade");
        var levels=p.Upgrades.ToDictionary(x=>x.Key,x=>x.Value,StringComparer.OrdinalIgnoreCase);var current=levels.GetValueOrDefault(key);if(current>=5)throw new InvalidOperationException("Upgrade is already at maximum level");var cost=100*(current+1);if(p.Credits<cost)throw new InvalidOperationException("Not enough credits");levels[key]=current+1;
        await using var c=dataSource.CreateCommand("UPDATE players SET credits=credits-@cost,upgrades=@upgrades::jsonb,updated_at=now() WHERE id=@id");c.Parameters.AddWithValue("id",playerId);c.Parameters.AddWithValue("cost",cost);c.Parameters.AddWithValue("upgrades",JsonSerializer.Serialize(levels,JsonOptions));await c.ExecuteNonQueryAsync(ct);return await GetPlayerAsync(playerId,ct)??throw new InvalidOperationException("Player missing");
    }

    public async Task<PlayerProfile> RecordBattleResultAsync(Guid playerId,string opponent,bool won,int turns,CancellationToken ct=default)
    {
        var credits=won?120:40;var xp=won?80:25;var rating=won?18:-12;await using var conn=await dataSource.OpenConnectionAsync(ct);await using var tx=await conn.BeginTransactionAsync(ct);
        await using(var u=new NpgsqlCommand("UPDATE players SET credits=credits+@credits,xp=xp+@xp,rating=GREATEST(0,rating+@rating),victories=victories+CASE WHEN @won THEN 1 ELSE 0 END,defeats=defeats+CASE WHEN @won THEN 0 ELSE 1 END,updated_at=now() WHERE id=@id",conn,tx))
        {u.Parameters.AddWithValue("id",playerId);u.Parameters.AddWithValue("credits",credits);u.Parameters.AddWithValue("xp",xp);u.Parameters.AddWithValue("rating",rating);u.Parameters.AddWithValue("won",won);await u.ExecuteNonQueryAsync(ct);}
        await using(var i=new NpgsqlCommand("INSERT INTO match_summaries(id,player_id,opponent_name,result,turns,credits_delta,xp_delta,rating_delta) VALUES (@id,@playerId,@opponent,@result,@turns,@credits,@xp,@rating)",conn,tx))
        {i.Parameters.AddWithValue("id",Guid.NewGuid());i.Parameters.AddWithValue("playerId",playerId);i.Parameters.AddWithValue("opponent",opponent);i.Parameters.AddWithValue("result",won?"victory":"defeat");i.Parameters.AddWithValue("turns",turns);i.Parameters.AddWithValue("credits",credits);i.Parameters.AddWithValue("xp",xp);i.Parameters.AddWithValue("rating",rating);await i.ExecuteNonQueryAsync(ct);}
        await tx.CommitAsync(ct);logger.LogInformation("Settled battle for {PlayerId}: {Result}",playerId,won?"victory":"defeat");return await GetPlayerAsync(playerId,ct)??throw new InvalidOperationException("Player missing after settlement");
    }

    private async Task<PlayerProfile?> FindByExternalIdentityAsync(string provider,string subject,CancellationToken ct){await using var c=dataSource.CreateCommand("SELECT id,provider,display_name,email,avatar_url,credits,xp,rating,victories,defeats,upgrades::text FROM players WHERE provider=@provider AND external_subject=@subject");c.Parameters.AddWithValue("provider",provider);c.Parameters.AddWithValue("subject",subject);await using var r=await c.ExecuteReaderAsync(ct);return await r.ReadAsync(ct)?ReadPlayer(r):null;}
    private async Task UpdateGoogleSnapshotAsync(Guid id,string? email,string displayName,string? avatarUrl,CancellationToken ct){await using var c=dataSource.CreateCommand("UPDATE players SET display_name=@name,email=@email,avatar_url=@avatar,updated_at=now() WHERE id=@id");c.Parameters.AddWithValue("id",id);c.Parameters.AddWithValue("name",displayName);c.Parameters.AddWithValue("email",NpgsqlDbType.Text,(object?)email??DBNull.Value);c.Parameters.AddWithValue("avatar",NpgsqlDbType.Text,(object?)avatarUrl??DBNull.Value);await c.ExecuteNonQueryAsync(ct);}
    private static PlayerProfile ReadPlayer(NpgsqlDataReader r){var upgrades=JsonSerializer.Deserialize<Dictionary<string,int>>(r.GetString(10),JsonOptions)??new();return new(r.GetGuid(0),r.GetString(1),r.GetString(2),r.IsDBNull(3)?null:r.GetString(3),r.IsDBNull(4)?null:r.GetString(4),r.GetInt32(5),r.GetInt32(6),r.GetInt32(7),r.GetInt32(8),r.GetInt32(9),upgrades);}
}
