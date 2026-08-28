using System.Collections.Concurrent;

namespace CosmicFight.Server;

public sealed class CombatEngine
{
    public static readonly HashSet<string> AllowedUpgrades = new(StringComparer.OrdinalIgnoreCase)
    {
        "core", "engines", "weapons", "armor", "sensors", "hull", "fire-protection", "electrical-shielding"
    };

    public static readonly IReadOnlyList<WeaponDefinition> Weapons =
    [
        new("laser", "Laser", 30, 0.95, 0, 0.03, 0.02, "Precise and reliable. Best for finishing critical systems."),
        new("missile", "Missile", 44, 0.80, 11, 0.32, 0.03, "Heavy explosive strike with splash and fire chance."),
        new("scatter", "Scatter", 24, 0.86, 7, 0.10, 0.02, "Wide multi-hit pressure against clustered modules."),
        new("plasma", "Plasma", 36, 0.88, 5, 0.06, 0.42, "Energy strike with a strong chance to short systems.")
    ];

    private readonly ConcurrentDictionary<Guid, BattleState> _battles = new();

    public BattleState CreateAiBattle(PlayerProfile player)
    {
        var seed = Random.Shared.Next();
        var battle = new BattleState
        {
            Id = Guid.NewGuid(),
            PlayerId = player.Id,
            PlayerShip = CreateShip("player", player.DisplayName, "cyan", player.Upgrades),
            EnemyShip = CreateShip("enemy", "Rogue AI", "red", CreateAiUpgrades(player.Upgrades)),
            Rng = new Random(seed)
        };
        battle.Log.Add(new BattleLogEntry(1, "system", "Combat link established. Choose a weapon and target a module.", DateTimeOffset.UtcNow));
        RecalculatePower(battle.PlayerShip);
        RecalculatePower(battle.EnemyShip);
        _battles[battle.Id] = battle;
        return battle;
    }

    public BattleState? GetBattle(Guid id) => _battles.GetValueOrDefault(id);

    public BattleSnapshot Snapshot(BattleState battle) => new(
        battle.Id,
        battle.Turn,
        battle.ActiveSide,
        battle.Status,
        battle.Winner,
        battle.PlayerShip,
        battle.EnemyShip,
        Weapons,
        battle.Log.TakeLast(16).ToArray(),
        battle.StartedAt);

    public void ApplyPlayerAction(BattleState battle, BattleActionRequest request)
    {
        if (battle.Status != "active") throw new InvalidOperationException("Battle already finished");
        if (battle.ActiveSide != "player") throw new InvalidOperationException("It is not your turn");
        if (request.Turn != battle.Turn) throw new InvalidOperationException("Stale turn number");
        var actionId = string.IsNullOrWhiteSpace(request.ClientActionId) ? $"{request.Turn}:{request.Action}:{request.TargetModuleId}" : request.ClientActionId;
        if (!battle.ProcessedActions.Add(actionId)) throw new InvalidOperationException("Duplicate action");

        TickStatuses(battle.PlayerShip, battle, "player");
        if (CheckFinished(battle)) return;

        if (request.Action.Equals("repair", StringComparison.OrdinalIgnoreCase))
        {
            Repair(battle, battle.PlayerShip, request.TargetModuleId, "player");
        }
        else if (request.Action.Equals("fire", StringComparison.OrdinalIgnoreCase))
        {
            var weapon = Weapons.FirstOrDefault(w => w.Id.Equals(request.WeaponId, StringComparison.OrdinalIgnoreCase))
                ?? throw new ArgumentException("Unknown weapon");
            Fire(battle, battle.PlayerShip, battle.EnemyShip, weapon, request.TargetModuleId, "player");
        }
        else
        {
            throw new ArgumentException("Unknown action");
        }

        if (CheckFinished(battle)) return;
        battle.ActiveSide = "enemy";
        AiTurn(battle);
    }

    private static ShipState CreateShip(string id, string name, string accent, IReadOnlyDictionary<string, int> upgrades)
    {
        int Level(string key) => upgrades.GetValueOrDefault(key);
        int Boost(int baseHp, string key) => baseHp + Level(key) * 12;

        var modules = new List<ShipModule>
        {
            new() { Id = "armor-top", Name = "Top Armor", Type = ModuleType.Armor, Hp = Boost(72, "armor"), MaxHp = Boost(72, "armor"), X = 50, Y = 17, Protects = ["core", "sensor"] },
            new() { Id = "sensor", Name = "Sensors", Type = ModuleType.Sensor, Hp = Boost(66, "sensors"), MaxHp = Boost(66, "sensors"), X = 50, Y = 30, Connections = ["core"] },
            new() { Id = "weapon-left", Name = "Port Weapon", Type = ModuleType.Weapon, Hp = Boost(78, "weapons"), MaxHp = Boost(78, "weapons"), X = 25, Y = 43, Connections = ["core", "hull"] },
            new() { Id = "core", Name = "Power Core", Type = ModuleType.Core, Hp = Boost(155, "core"), MaxHp = Boost(155, "core"), X = 50, Y = 48, Connections = ["sensor", "weapon-left", "weapon-right", "engine-left", "engine-right", "hull"] },
            new() { Id = "weapon-right", Name = "Starboard Weapon", Type = ModuleType.Weapon, Hp = Boost(78, "weapons"), MaxHp = Boost(78, "weapons"), X = 75, Y = 43, Connections = ["core", "hull"] },
            new() { Id = "armor-left", Name = "Port Armor", Type = ModuleType.Armor, Hp = Boost(70, "armor"), MaxHp = Boost(70, "armor"), X = 14, Y = 57, Protects = ["weapon-left", "engine-left", "hull"] },
            new() { Id = "hull", Name = "Hull", Type = ModuleType.Hull, Hp = Boost(125, "hull"), MaxHp = Boost(125, "hull"), X = 50, Y = 63, Connections = ["core", "weapon-left", "weapon-right", "engine-left", "engine-right"] },
            new() { Id = "armor-right", Name = "Starboard Armor", Type = ModuleType.Armor, Hp = Boost(70, "armor"), MaxHp = Boost(70, "armor"), X = 86, Y = 57, Protects = ["weapon-right", "engine-right", "sensor"] },
            new() { Id = "engine-left", Name = "Port Engine", Type = ModuleType.Engine, Hp = Boost(88, "engines"), MaxHp = Boost(88, "engines"), X = 33, Y = 80, Connections = ["core", "hull"] },
            new() { Id = "engine-right", Name = "Starboard Engine", Type = ModuleType.Engine, Hp = Boost(88, "engines"), MaxHp = Boost(88, "engines"), X = 67, Y = 80, Connections = ["core", "hull"] }
        };

        return new ShipState
        {
            Id = id,
            Name = name,
            Accent = accent,
            Modules = modules,
            UpgradeLevels = upgrades.ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.OrdinalIgnoreCase)
        };
    }

    private static IReadOnlyDictionary<string, int> CreateAiUpgrades(IReadOnlyDictionary<string, int> player)
    {
        var total = Math.Clamp(player.Values.Sum(), 0, 16);
        var result = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var keys = AllowedUpgrades.ToArray();
        for (var i = 0; i < total; i++)
        {
            var key = keys[i % keys.Length];
            result[key] = Math.Min(5, result.GetValueOrDefault(key) + 1);
        }
        return result;
    }

    private static void Fire(BattleState battle, ShipState attacker, ShipState defender, WeaponDefinition weapon, string targetId, string side)
    {
        var target = defender.Modules.FirstOrDefault(m => m.Id == targetId) ?? throw new ArgumentException("Target module not found");
        if (target.Destroyed) throw new InvalidOperationException("Target module is already destroyed");
        if (!attacker.Modules.Any(m => m.Type == ModuleType.Weapon && !m.Destroyed && m.Powered))
            throw new InvalidOperationException("No functioning powered weapon mount");

        var accuracy = CalculateAccuracy(attacker, weapon);
        if (battle.Rng.NextDouble() > accuracy)
        {
            AddLog(battle, side, $"{attacker.Name}: {weapon.Name} missed {target.Name}.");
            return;
        }

        var damageModifier = 1d + attacker.UpgradeLevels.GetValueOrDefault("weapons") * 0.04;
        if (attacker.Modules.First(m => m.Type == ModuleType.Core).Destroyed) damageModifier *= 0.65;
        var damage = Math.Max(1, (int)Math.Round(weapon.Damage * damageModifier * (0.92 + battle.Rng.NextDouble() * 0.16)));
        var absorbed = ApplyArmor(defender, target, damage, battle, side);
        var direct = Math.Max(1, damage - absorbed);
        ApplyDamage(target, direct);

        if (weapon.Splash > 0)
        {
            var splashTarget = PickConnectedSplash(defender, target, battle.Rng);
            if (splashTarget is not null)
            {
                var splash = Math.Max(1, (int)Math.Round(weapon.Splash * (0.8 + battle.Rng.NextDouble() * 0.4)));
                ApplyDamage(splashTarget, splash);
                AddLog(battle, side, $"Splash hit {splashTarget.Name} for {splash}.");
            }
        }

        var fireResistance = defender.UpgradeLevels.GetValueOrDefault("fire-protection") * 0.06;
        if (!target.Destroyed && battle.Rng.NextDouble() < Math.Max(0, weapon.FireChance - fireResistance))
        {
            target.FireTurns = Math.Max(target.FireTurns, 2);
            AddLog(battle, side, $"{target.Name} caught fire.");
        }
        var shortResistance = defender.UpgradeLevels.GetValueOrDefault("electrical-shielding") * 0.07;
        if (!target.Destroyed && (target.Type is ModuleType.Core or ModuleType.Sensor or ModuleType.Weapon) &&
            battle.Rng.NextDouble() < Math.Max(0, weapon.ShortChance - shortResistance))
        {
            target.ShortTurns = Math.Max(target.ShortTurns, 2);
            AddLog(battle, side, $"{target.Name} suffered an electrical short.");
        }

        AddLog(battle, side, $"{attacker.Name}: {weapon.Name} hit {target.Name} for {direct}{(absorbed > 0 ? $" ({absorbed} absorbed by armor)" : string.Empty)}.");
        if (target.Destroyed)
        {
            AddLog(battle, side, $"{target.Name} destroyed.");
            ApplyCascade(defender, target, battle, side);
        }
        RecalculatePower(defender);
    }

    private static int ApplyArmor(ShipState defender, ShipModule target, int incoming, BattleState battle, string side)
    {
        if (target.Type == ModuleType.Armor) return 0;
        var armor = defender.Modules
            .Where(m => m.Type == ModuleType.Armor && !m.Destroyed && m.Protects.Contains(target.Id))
            .OrderByDescending(m => m.Hp)
            .FirstOrDefault();
        if (armor is null) return 0;
        var protection = 0.48 + defender.UpgradeLevels.GetValueOrDefault("armor") * 0.025;
        var absorbed = Math.Min(armor.Hp, Math.Max(1, (int)Math.Round(incoming * protection)));
        ApplyDamage(armor, absorbed);
        if (armor.Destroyed) AddLog(battle, side, $"{armor.Name} broke while protecting {target.Name}.");
        return absorbed;
    }

    private static ShipModule? PickConnectedSplash(ShipState ship, ShipModule target, Random rng)
    {
        var candidates = target.Connections
            .Select(id => ship.Modules.FirstOrDefault(m => m.Id == id))
            .Where(m => m is not null && !m.Destroyed)
            .Cast<ShipModule>()
            .ToArray();
        if (candidates.Length == 0)
        {
            candidates = ship.Modules.Where(m => !m.Destroyed && m.Id != target.Id).OrderBy(_ => rng.Next()).Take(3).ToArray();
        }
        return candidates.Length == 0 ? null : candidates[rng.Next(candidates.Length)];
    }

    private static void ApplyCascade(ShipState ship, ShipModule destroyed, BattleState battle, string side)
    {
        if (destroyed.Type is not (ModuleType.Core or ModuleType.Hull)) return;
        var baseDamage = destroyed.Type == ModuleType.Core ? 12 : 7;
        foreach (var id in destroyed.Connections.Take(4))
        {
            var linked = ship.Modules.FirstOrDefault(m => m.Id == id && !m.Destroyed);
            if (linked is null) continue;
            var damage = Math.Min(linked.Hp, baseDamage + battle.Rng.Next(0, 5));
            ApplyDamage(linked, damage);
            AddLog(battle, side, $"Cascade damage: {linked.Name} -{damage}.");
        }
    }

    private static void Repair(BattleState battle, ShipState ship, string targetId, string side)
    {
        var target = ship.Modules.FirstOrDefault(m => m.Id == targetId) ?? throw new ArgumentException("Repair target not found");
        if (target.Hp >= target.MaxHp && target.FireTurns == 0 && target.ShortTurns == 0)
            throw new InvalidOperationException("Module does not need repair");
        var cost = target.Destroyed ? 2 : 1;
        if (ship.RepairKits < cost) throw new InvalidOperationException("Not enough repair kits");
        ship.RepairKits -= cost;

        var restore = target.Destroyed ? Math.Max(1, (int)Math.Round(target.MaxHp * 0.28)) : 38;
        target.Hp = Math.Min(target.MaxHp, target.Hp + restore);
        target.FireTurns = 0;
        target.ShortTurns = 0;
        RecalculatePower(ship);
        AddLog(battle, side, $"{ship.Name} repaired {target.Name} for {restore} HP using {cost} kit{(cost == 1 ? string.Empty : "s")}.");
    }

    private static void TickStatuses(ShipState ship, BattleState battle, string side)
    {
        foreach (var module in ship.Modules.Where(m => !m.Destroyed).ToArray())
        {
            if (module.FireTurns > 0)
            {
                var damage = Math.Min(module.Hp, 6);
                ApplyDamage(module, damage);
                module.FireTurns--;
                AddLog(battle, side, $"Fire damaged {module.Name} for {damage}.");
            }
            if (module.ShortTurns > 0) module.ShortTurns--;
        }
        RecalculatePower(ship);
    }

    private static void AiTurn(BattleState battle)
    {
        if (battle.Status != "active") return;
        TickStatuses(battle.EnemyShip, battle, "enemy");
        if (CheckFinished(battle)) return;

        var damaged = battle.EnemyShip.Modules.Where(m => m.Hp > 0 && (m.Hp < m.MaxHp * 0.32 || m.FireTurns > 0 || m.ShortTurns > 0)).ToArray();
        var core = battle.EnemyShip.Modules.First(m => m.Type == ModuleType.Core);
        var hasPoweredWeapon = battle.EnemyShip.Modules.Any(m => m.Type == ModuleType.Weapon && !m.Destroyed && m.Powered);
        if (!hasPoweredWeapon && core.Hp < core.MaxHp && battle.EnemyShip.RepairKits >= (core.Destroyed ? 2 : 1))
        {
            Repair(battle, battle.EnemyShip, core.Id, "enemy");
        }
        else if (battle.EnemyShip.RepairKits > 0 && damaged.Length > 0 && battle.Rng.NextDouble() < 0.25)
        {
            var repairable = damaged.Where(m => !m.Destroyed || battle.EnemyShip.RepairKits >= 2).OrderBy(m => (double)m.Hp / m.MaxHp).First();
            Repair(battle, battle.EnemyShip, repairable.Id, "enemy");
        }
        else
        {
            var weapon = Weapons[battle.Rng.Next(Weapons.Count)];
            var targets = battle.PlayerShip.Modules.Where(m => !m.Destroyed).ToArray();
            var priority = targets.Where(m => m.Type is ModuleType.Weapon or ModuleType.Core or ModuleType.Sensor).ToArray();
            var pool = priority.Length > 0 && battle.Rng.NextDouble() < 0.7 ? priority : targets;
            var target = pool[battle.Rng.Next(pool.Length)];
            Fire(battle, battle.EnemyShip, battle.PlayerShip, weapon, target.Id, "enemy");
        }

        if (CheckFinished(battle)) return;
        battle.Turn++;
        battle.ActiveSide = "player";
    }

    private static double CalculateAccuracy(ShipState attacker, WeaponDefinition weapon)
    {
        double Integrity(ModuleType type)
        {
            var modules = attacker.Modules.Where(m => m.Type == type).ToArray();
            return modules.Length == 0 ? 1 : modules.Average(m => Math.Max(0, m.Hp) / (double)m.MaxHp);
        }
        var sensor = Integrity(ModuleType.Sensor);
        var engines = Integrity(ModuleType.Engine);
        var shortPenalty = attacker.Modules.Any(m => m.Type == ModuleType.Sensor && m.ShortTurns > 0) ? 0.18 : 0;
        var value = weapon.Accuracy * (0.72 + sensor * 0.16 + engines * 0.12) - shortPenalty;
        return Math.Clamp(value, 0.38, 0.98);
    }

    private static void RecalculatePower(ShipState ship)
    {
        var core = ship.Modules.First(m => m.Type == ModuleType.Core);
        foreach (var module in ship.Modules)
        {
            module.Powered = !module.Destroyed && ((module.Type is ModuleType.Armor or ModuleType.Hull or ModuleType.Core) || (!core.Destroyed && core.ShortTurns == 0));
            if (module.ShortTurns > 0 && (module.Type is ModuleType.Weapon or ModuleType.Sensor or ModuleType.Engine)) module.Powered = false;
        }
    }

    private static bool CheckFinished(BattleState battle)
    {
        if (IsDefeated(battle.PlayerShip))
        {
            battle.Status = "finished";
            battle.Winner = "enemy";
            battle.ActiveSide = "none";
            AddLog(battle, "system", "Defeat. Your ship can no longer continue the fight.");
            return true;
        }
        if (IsDefeated(battle.EnemyShip))
        {
            battle.Status = "finished";
            battle.Winner = "player";
            battle.ActiveSide = "none";
            AddLog(battle, "system", "Victory. Enemy combat capability collapsed.");
            return true;
        }
        return false;
    }

    private static bool IsDefeated(ShipState ship)
    {
        var core = ship.Modules.First(m => m.Type == ModuleType.Core);
        var hull = ship.Modules.First(m => m.Type == ModuleType.Hull);
        var physicalWeapons = ship.Modules.Count(m => m.Type == ModuleType.Weapon && !m.Destroyed);
        return ship.Integrity <= 16 ||
               (core.Destroyed && hull.Destroyed) ||
               (physicalWeapons == 0 && ship.RepairKits < 2) ||
               (core.Destroyed && ship.RepairKits < 2);
    }

    private static void ApplyDamage(ShipModule module, int amount) => module.Hp = Math.Max(0, module.Hp - Math.Max(0, amount));

    private static void AddLog(BattleState battle, string kind, string text) =>
        battle.Log.Add(new BattleLogEntry(battle.Turn, kind, text, DateTimeOffset.UtcNow));
}
