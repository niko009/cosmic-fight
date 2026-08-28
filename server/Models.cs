using System.Text.Json.Serialization;

namespace CosmicFight.Server;

public sealed record PlayerProfile(
    Guid Id,
    string Provider,
    string DisplayName,
    string? Email,
    string? AvatarUrl,
    int Credits,
    int Xp,
    int Rating,
    int Victories,
    int Defeats,
    IReadOnlyDictionary<string, int> Upgrades)
{
    public bool IsGuest => Provider == "guest";
    public int Level => Math.Max(1, 1 + Xp / 250);
}

public sealed record AuthConfig(bool GoogleConfigured);
public sealed record UpgradeRequest(string Upgrade);

public sealed record ModulePlacement(string Id, double X, double Y);
public sealed record ShipLoadout(IReadOnlyList<string> Weapons, IReadOnlyList<ModulePlacement> Modules)
{
    public static ShipLoadout Default => new(
        ["laser", "missile"],
        [
            new("armor-top", 50, 16), new("sensor", 50, 29),
            new("weapon-left", 25, 43), new("core", 50, 48), new("weapon-right", 75, 43),
            new("armor-left", 15, 58), new("hull", 50, 64), new("armor-right", 85, 58),
            new("engine-left", 34, 82), new("engine-right", 66, 82)
        ]);
}
public sealed record SaveLoadoutRequest(IReadOnlyList<string> Weapons, IReadOnlyList<ModulePlacement> Modules);

public sealed record ArenaPlayer(Guid Id, string DisplayName, string? AvatarUrl, int Rating, int Level, int ShipPower, string Status);
public sealed record DuelChallenge(Guid Id, Guid FromPlayerId, string FromName, Guid ToPlayerId, string ToName, DateTimeOffset ExpiresAt, string Status);

public enum ModuleType { Core, Engine, Weapon, Armor, Hull, Sensor }
public enum ModuleCondition { Ok, Damaged, Critical, Destroyed }

public sealed class ShipModule
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ModuleType Type { get; init; }
    public int Hp { get; set; }
    public int MaxHp { get; init; }
    public double X { get; set; }
    public double Y { get; set; }
    public List<string> Connections { get; init; } = [];
    public List<string> Protects { get; init; } = [];
    public int FireTurns { get; set; }
    public int ShortTurns { get; set; }
    public bool Powered { get; set; } = true;
    [JsonIgnore] public bool Destroyed => Hp <= 0;
    public ModuleCondition Condition => Hp <= 0 ? ModuleCondition.Destroyed
        : Hp <= Math.Ceiling(MaxHp * .25) ? ModuleCondition.Critical
        : Hp < MaxHp ? ModuleCondition.Damaged : ModuleCondition.Ok;
}

public sealed class ShipState
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Accent { get; init; }
    public List<ShipModule> Modules { get; init; } = [];
    public List<string> WeaponIds { get; init; } = [];
    public int RepairKits { get; set; } = 3;
    public IReadOnlyDictionary<string, int> UpgradeLevels { get; init; } = new Dictionary<string, int>();
    public int Integrity => (int)Math.Round(100d * Modules.Sum(m => Math.Max(0, m.Hp)) / Math.Max(1, Modules.Sum(m => m.MaxHp)));
}

public sealed record WeaponDefinition(string Id, string Name, int Damage, double Accuracy, int Splash, double FireChance, double ShortChance, string Description);
public sealed record BattleLogEntry(int Turn, string Kind, string Text, DateTimeOffset At);

public sealed class BattleState
{
    public required Guid Id { get; init; }
    public required Guid PlayerId { get; init; }
    public Guid? OpponentPlayerId { get; init; }
    public required ShipState PlayerShip { get; init; }
    public required ShipState EnemyShip { get; init; }
    public int Turn { get; set; } = 1;
    public string ActiveSide { get; set; } = "player";
    public string Status { get; set; } = "active";
    public string? Winner { get; set; }
    public DateTimeOffset StartedAt { get; init; } = DateTimeOffset.UtcNow;
    public List<BattleLogEntry> Log { get; init; } = [];
    [JsonIgnore] public Random Rng { get; init; } = new();
    [JsonIgnore] public HashSet<string> ProcessedActions { get; init; } = [];
    [JsonIgnore] public bool Settled { get; set; }
}

public sealed record BattleActionRequest(int Turn, string Action, string? WeaponId, string TargetModuleId, string? ClientActionId);
public sealed record BattleSnapshot(
    Guid Id, int Turn, string ActiveSide, string Status, string? Winner,
    Guid PlayerOneId, Guid? PlayerTwoId,
    ShipState PlayerShip, ShipState EnemyShip,
    IReadOnlyList<WeaponDefinition> Weapons, IReadOnlyList<BattleLogEntry> Log, DateTimeOffset StartedAt);
public sealed record ViewerBattleSnapshot(string OwnSide, BattleSnapshot Battle);
public sealed record VersionResponse(string Version, string Commit, DateTimeOffset BuiltAt);
