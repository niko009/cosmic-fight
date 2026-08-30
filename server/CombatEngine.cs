using System.Collections.Concurrent;

namespace CosmicFight.Server;

public sealed class CombatEngine
{
    public static readonly HashSet<string> AllowedUpgrades = new(StringComparer.OrdinalIgnoreCase)
    { "core", "engines", "weapons", "armor", "sensors", "hull", "fire-protection", "electrical-shielding" };

    public static readonly IReadOnlyList<WeaponDefinition> Weapons =
    [
        new("laser", "Laser", 30, .95, 0, .03, .02, "Precise beam. Fastest projectile visual and highest base accuracy."),
        new("missile", "Missile", 44, .80, 11, .32, .03, "Guided explosive missile with splash damage and fire chance."),
        new("scatter", "Scatter", 24, .86, 7, .10, .02, "A burst of kinetic pellets with a wide visual spread."),
        new("plasma", "Plasma", 36, .88, 5, .06, .42, "Slow glowing plasma bolt with a strong electrical-short chance.")
    ];

    public static readonly HashSet<string> AllowedWeapons = Weapons.Select(w => w.Id).ToHashSet(StringComparer.OrdinalIgnoreCase);

    private readonly ConcurrentDictionary<Guid, BattleState> _battles = new();
    public BattleState? GetBattle(Guid id) => _battles.GetValueOrDefault(id);

    public BattleState CreateAiBattle(PlayerProfile player, ShipLoadout loadout)
    {
        var battle = NewBattle(player, loadout, null, null);
        battle.Log.Add(new(1, "system", "Combat link established. Choose a weapon and target a module.", DateTimeOffset.UtcNow));
        _battles[battle.Id] = battle;
        return battle;
    }

    public BattleState CreatePvpBattle(PlayerProfile a, ShipLoadout aLoadout, PlayerProfile b, ShipLoadout bLoadout)
    {
        var battle = NewBattle(a, aLoadout, b, bLoadout);
        battle.Log.Add(new(1, "system", $"Duel started: {a.DisplayName} vs {b.DisplayName}.", DateTimeOffset.UtcNow));
        _battles[battle.Id] = battle;
        return battle;
    }

    private static BattleState NewBattle(PlayerProfile a, ShipLoadout aLoadout, PlayerProfile? b, ShipLoadout? bLoadout)
    {
        var battle = new BattleState
        {
            Id = Guid.NewGuid(),
            PlayerId = a.Id,
            OpponentPlayerId = b?.Id,
            PlayerShip = CreateShip("player", a.DisplayName, "cyan", a.Upgrades, aLoadout),
            EnemyShip = CreateShip("enemy", b?.DisplayName ?? "Rogue AI", "red", b?.Upgrades ?? CreateAiUpgrades(a.Upgrades), bLoadout ?? ShipLoadout.Default),
            Rng = new Random(Random.Shared.Next())
        };
        RecalculatePower(battle.PlayerShip);
        RecalculatePower(battle.EnemyShip);
        return battle;
    }

    public BattleSnapshot Snapshot(BattleState b) => new(
        b.Id, b.Turn, b.ActiveSide, b.Status, b.Winner,
        b.PlayerId, b.OpponentPlayerId,
        b.PlayerShip, b.EnemyShip,
        Weapons,
        b.Log.TakeLast(20).ToArray(),
        b.Effects.TakeLast(12).ToArray(),
        b.StartedAt);

    public ViewerBattleSnapshot ViewerSnapshot(BattleState battle, Guid viewerId)
    {
        var side = viewerId == battle.PlayerId ? "player" : viewerId == battle.OpponentPlayerId ? "enemy" : throw new UnauthorizedAccessException();
        return new(side, Snapshot(battle));
    }

    public void ApplyAiPlayerAction(BattleState battle, BattleActionRequest request)
    {
        if (battle.OpponentPlayerId is not null) throw new InvalidOperationException("This is not an AI battle");
        ResolveAction(battle, "player", request);
        if (battle.Status == "active") AiTurn(battle);
    }

    public void ApplyPvpAction(BattleState battle, Guid actorId, BattleActionRequest request)
    {
        if (battle.OpponentPlayerId is null) throw new InvalidOperationException("This is not a PvP battle");
        var side = actorId == battle.PlayerId ? "player" : actorId == battle.OpponentPlayerId ? "enemy" : throw new UnauthorizedAccessException();
        ResolveAction(battle, side, request);
    }

    private void ResolveAction(BattleState battle, string side, BattleActionRequest request)
    {
        if (battle.Status != "active") throw new InvalidOperationException("Battle already finished");
        if (battle.ActiveSide != side) throw new InvalidOperationException("It is not your turn");
        if (request.Turn != battle.Turn) throw new InvalidOperationException("Stale turn number");

        var actionId = string.IsNullOrWhiteSpace(request.ClientActionId)
            ? $"{side}:{request.Turn}:{request.Action}:{request.TargetModuleId}"
            : request.ClientActionId;
        if (!battle.ProcessedActions.Add(actionId)) throw new InvalidOperationException("Duplicate action");

        var own = side == "player" ? battle.PlayerShip : battle.EnemyShip;
        var foe = side == "player" ? battle.EnemyShip : battle.PlayerShip;
        TickStatuses(own, battle, side);
        if (CheckFinished(battle)) return;

        if (request.Action.Equals("repair", StringComparison.OrdinalIgnoreCase))
        {
            Repair(battle, own, request.TargetModuleId, side);
        }
        else if (request.Action.Equals("fire", StringComparison.OrdinalIgnoreCase))
        {
            var weapon = Weapons.FirstOrDefault(w => w.Id.Equals(request.WeaponId, StringComparison.OrdinalIgnoreCase))
                ?? throw new ArgumentException("Unknown weapon");
            if (!own.WeaponIds.Contains(weapon.Id, StringComparer.OrdinalIgnoreCase))
                throw new InvalidOperationException("Weapon is not equipped");
            Fire(battle, own, foe, weapon, request.TargetModuleId, side);
        }
        else throw new ArgumentException("Unknown action");

        if (CheckFinished(battle)) return;
        battle.ActiveSide = side == "player" ? "enemy" : "player";
        battle.Turn++;
    }

    private void AiTurn(BattleState battle)
    {
        if (battle.Status != "active") return;
        var ship = battle.EnemyShip;
        if (!HasFunctioningWeaponMount(ship))
        {
            var emergencyRepair = FindEmergencyWeaponRepair(ship);
            if (emergencyRepair is not null)
            {
                ResolveAction(battle, "enemy", new(battle.Turn, "repair", null, emergencyRepair.Id, Guid.NewGuid().ToString("N")));
                return;
            }

            CheckFinished(battle);
            return;
        }

        var damaged = ship.Modules.Where(m => m.Hp > 0 && (m.Hp < m.MaxHp * .32 || m.FireTurns > 0 || m.ShortTurns > 0)).ToArray();
        if (ship.RepairKits > 0 && damaged.Length > 0 && battle.Rng.NextDouble() < .25)
        {
            var target = damaged.OrderBy(m => (double)m.Hp / m.MaxHp).First();
            ResolveAction(battle, "enemy", new(battle.Turn, "repair", null, target.Id, Guid.NewGuid().ToString("N")));
            return;
        }

        var targets = battle.PlayerShip.Modules.Where(m => !m.Destroyed).OrderByDescending(m => m.Type switch
        {
            ModuleType.Weapon => 12,
            ModuleType.Core => 11,
            ModuleType.Sensor => 8,
            ModuleType.Engine => 7,
            ModuleType.Armor => 5,
            _ => 4
        }).Take(5).ToArray();

        var chosen = targets.Length == 0
            ? battle.PlayerShip.Modules.First(m => !m.Destroyed)
            : targets[battle.Rng.Next(targets.Length)];
        IReadOnlyList<string> weaponIds = ship.WeaponIds.Count > 0 ? ship.WeaponIds : new[] { "laser" };
        var weaponId = weaponIds[battle.Rng.Next(weaponIds.Count)];
        ResolveAction(battle, "enemy", new(battle.Turn, "fire", weaponId, chosen.Id, Guid.NewGuid().ToString("N")));
    }

    private static ShipState CreateShip(string id, string name, string accent, IReadOnlyDictionary<string, int> upgrades, ShipLoadout loadout)
    {
        int Level(string key) => upgrades.GetValueOrDefault(key);
        int Boost(int baseHp, string key) => baseHp + Level(key) * 12;

        var allModules = new List<ShipModule>
        {
            new() { Id="armor-top", Name="Top Armor", Type=ModuleType.Armor, Hp=Boost(72,"armor"), MaxHp=Boost(72,"armor"), X=50,Y=16, Protects=["core","sensor"] },
            new() { Id="sensor", Name="Navigation Sensors", Type=ModuleType.Sensor, Hp=Boost(66,"sensors"), MaxHp=Boost(66,"sensors"), X=50,Y=29, Connections=["core"] },
            new() { Id="weapon-left", Name="Port Weapon", Type=ModuleType.Weapon, Hp=Boost(78,"weapons"), MaxHp=Boost(78,"weapons"), X=25,Y=43, Connections=["core","hull"] },
            new() { Id="core", Name="Power Core", Type=ModuleType.Core, Hp=Boost(155,"core"), MaxHp=Boost(155,"core"), X=50,Y=48, Connections=["sensor","weapon-left","weapon-right","engine-left","engine-right","hull"] },
            new() { Id="weapon-right", Name="Starboard Weapon", Type=ModuleType.Weapon, Hp=Boost(78,"weapons"), MaxHp=Boost(78,"weapons"), X=75,Y=43, Connections=["core","hull"] },
            new() { Id="armor-left", Name="Port Armor", Type=ModuleType.Armor, Hp=Boost(70,"armor"), MaxHp=Boost(70,"armor"), X=15,Y=58, Protects=["weapon-left","engine-left","hull"] },
            new() { Id="hull", Name="Hull", Type=ModuleType.Hull, Hp=Boost(125,"hull"), MaxHp=Boost(125,"hull"), X=50,Y=64, Connections=["core","weapon-left","weapon-right","engine-left","engine-right"] },
            new() { Id="armor-right", Name="Starboard Armor", Type=ModuleType.Armor, Hp=Boost(70,"armor"), MaxHp=Boost(70,"armor"), X=85,Y=58, Protects=["weapon-right","engine-right","sensor"] },
            new() { Id="engine-left", Name="Port Engine", Type=ModuleType.Engine, Hp=Boost(88,"engines"), MaxHp=Boost(88,"engines"), X=34,Y=82, Connections=["core","hull"] },
            new() { Id="engine-right", Name="Starboard Engine", Type=ModuleType.Engine, Hp=Boost(88,"engines"), MaxHp=Boost(88,"engines"), X=66,Y=82, Connections=["core","hull"] }
        };

        var placements = loadout.Modules.ToDictionary(m => m.Id, StringComparer.OrdinalIgnoreCase);
        var modules = allModules.Where(m => placements.ContainsKey(m.Id)).ToList();
        foreach (var module in modules)
        {
            var placement = placements[module.Id];
            module.X = Math.Clamp(placement.X, 6, 94);
            module.Y = Math.Clamp(placement.Y, 8, 92);
        }

        var weaponIds = loadout.Weapons.Where(AllowedWeapons.Contains).Distinct(StringComparer.OrdinalIgnoreCase).Take(2).ToList();
        if (weaponIds.Count == 0) weaponIds.Add("laser");

        return new()
        {
            Id = id,
            Name = name,
            Accent = accent,
            Modules = modules,
            WeaponIds = weaponIds,
            UpgradeLevels = upgrades.ToDictionary(x => x.Key, x => x.Value, StringComparer.OrdinalIgnoreCase)
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

        var workingMounts = attacker.Modules
            .Where(m => m.Type == ModuleType.Weapon && !m.Destroyed && m.Powered && m.ShortTurns == 0)
            .ToArray();
        if (workingMounts.Length == 0) throw new InvalidOperationException("No functioning powered weapon mount");

        var mount = workingMounts[battle.Rng.Next(workingMounts.Length)];
        var accuracy = CalculateAccuracy(attacker, weapon);
        var sensorRatio = ModuleRatio(attacker, ModuleType.Sensor, .18);
        var engineRatio = ModuleRatio(attacker, ModuleType.Engine, .35);
        var aimSpread = Math.Clamp((1d - accuracy) + (1d - sensorRatio) * .36 + (1d - engineRatio) * .15, .015, .78);
        var hit = battle.Rng.NextDouble() <= accuracy;

        double endX = target.X;
        double endY = target.Y;
        if (!hit)
        {
            var radius = 10d + aimSpread * 38d + battle.Rng.NextDouble() * 9d;
            var angle = battle.Rng.NextDouble() * Math.PI * 2d;
            endX = Math.Clamp(target.X + Math.Cos(angle) * radius, 2d, 98d);
            endY = Math.Clamp(target.Y + Math.Sin(angle) * radius, 2d, 98d);
        }

        battle.Effects.Add(new(
            Guid.NewGuid(), battle.Turn, "fire", side, weapon.Id, mount.Id, target.Id,
            hit, Math.Round(aimSpread, 3), Math.Round(endX, 2), Math.Round(endY, 2), DateTimeOffset.UtcNow));

        if (!hit)
        {
            AddLog(battle, side, $"{attacker.Name}: {weapon.Name} missed {target.Name}.");
            return;
        }

        var damageModifier = 1d + attacker.UpgradeLevels.GetValueOrDefault("weapons") * .04;
        var core = attacker.Modules.FirstOrDefault(m => m.Type == ModuleType.Core);
        if (core is null || core.Destroyed) damageModifier *= .65;
        var damage = Math.Max(1, (int)Math.Round(weapon.Damage * damageModifier * (.92 + battle.Rng.NextDouble() * .16)));
        var absorbed = ApplyArmor(defender, target, damage, battle, side);
        var direct = Math.Max(1, damage - absorbed);
        ApplyDamage(target, direct);

        if (weapon.Splash > 0)
        {
            var splash = PickConnectedSplash(defender, target, battle.Rng);
            if (splash is not null)
            {
                var splashDamage = Math.Max(1, (int)Math.Round(weapon.Splash * (.8 + battle.Rng.NextDouble() * .4)));
                ApplyDamage(splash, splashDamage);
                AddLog(battle, side, $"Splash hit {splash.Name} for {splashDamage}.");
            }
        }

        var fireResistance = defender.UpgradeLevels.GetValueOrDefault("fire-protection") * .06;
        if (!target.Destroyed && battle.Rng.NextDouble() < Math.Max(0, weapon.FireChance - fireResistance))
        {
            target.FireTurns = Math.Max(target.FireTurns, 2);
            AddLog(battle, side, $"{target.Name} caught fire.");
        }

        var shortResistance = defender.UpgradeLevels.GetValueOrDefault("electrical-shielding") * .07;
        if (!target.Destroyed && target.Type is ModuleType.Core or ModuleType.Sensor or ModuleType.Weapon
            && battle.Rng.NextDouble() < Math.Max(0, weapon.ShortChance - shortResistance))
        {
            target.ShortTurns = Math.Max(target.ShortTurns, 2);
            AddLog(battle, side, $"{target.Name} suffered an electrical short.");
        }

        AddLog(battle, side, $"{attacker.Name}: {weapon.Name} hit {target.Name} for {direct}{(absorbed > 0 ? $" ({absorbed} absorbed by armor)" : "")}.");
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
        var protection = .48 + defender.UpgradeLevels.GetValueOrDefault("armor") * .025;
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
            candidates = ship.Modules.Where(m => !m.Destroyed && m.Id != target.Id).OrderBy(_ => rng.Next()).Take(3).ToArray();
        return candidates.Length == 0 ? null : candidates[rng.Next(candidates.Length)];
    }

    private static void ApplyCascade(ShipState ship, ShipModule destroyed, BattleState battle, string side)
    {
        if (destroyed.Type != ModuleType.Core && destroyed.Type != ModuleType.Hull) return;
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
        var restore = target.Destroyed ? Math.Max(1, (int)Math.Round(target.MaxHp * .28)) : 38;
        target.Hp = Math.Min(target.MaxHp, target.Hp + restore);
        target.FireTurns = 0;
        target.ShortTurns = 0;
        RecalculatePower(ship);
        battle.Effects.Add(new(Guid.NewGuid(), battle.Turn, "repair", side, null, target.Id, target.Id, true, 0, target.X, target.Y, DateTimeOffset.UtcNow));
        AddLog(battle, side, $"{ship.Name} repaired {target.Name} for {restore} HP using {cost} kit{(cost == 1 ? "" : "s")}.");
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

    private static double ModuleRatio(ShipState ship, ModuleType type, double missingValue)
    {
        var modules = ship.Modules.Where(m => m.Type == type).ToArray();
        if (modules.Length == 0) return missingValue;
        return modules.Average(m => m.Destroyed
            ? 0
            : (double)m.Hp / m.MaxHp * (m.Powered ? 1 : .35) * (m.ShortTurns > 0 ? .3 : 1));
    }

    private static double CalculateAccuracy(ShipState ship, WeaponDefinition weapon)
    {
        var sensors = ModuleRatio(ship, ModuleType.Sensor, .18);
        var engines = ModuleRatio(ship, ModuleType.Engine, .35);
        return Math.Clamp(weapon.Accuracy * (.72 + .14 * sensors + .14 * engines), .25, .99);
    }

    private static void ApplyDamage(ShipModule module, int damage) => module.Hp = Math.Max(0, module.Hp - Math.Max(0, damage));

    private static void RecalculatePower(ShipState ship)
    {
        var core = ship.Modules.FirstOrDefault(m => m.Type == ModuleType.Core);
        var powered = new HashSet<string>();
        if (core is not null && !core.Destroyed)
        {
            var queue = new Queue<string>();
            queue.Enqueue(core.Id);
            powered.Add(core.Id);
            while (queue.Count > 0)
            {
                var id = queue.Dequeue();
                var module = ship.Modules.First(x => x.Id == id);
                foreach (var nextId in module.Connections)
                {
                    if (powered.Contains(nextId)) continue;
                    var next = ship.Modules.FirstOrDefault(x => x.Id == nextId);
                    if (next is not null && !next.Destroyed)
                    {
                        powered.Add(nextId);
                        queue.Enqueue(nextId);
                    }
                }
            }
        }
        foreach (var module in ship.Modules) module.Powered = powered.Contains(module.Id);
    }

    private static bool CheckFinished(BattleState battle)
    {
        var playerCapable = CombatCapable(battle.PlayerShip);
        var enemyCapable = CombatCapable(battle.EnemyShip);
        if (playerCapable && enemyCapable) return false;
        battle.Status = "finished";
        battle.Winner = playerCapable && !enemyCapable
            ? "player"
            : enemyCapable && !playerCapable
                ? "enemy"
                : battle.PlayerShip.Integrity >= battle.EnemyShip.Integrity ? "player" : "enemy";
        AddLog(battle, "system", $"Battle complete. Winner: {(battle.Winner == "player" ? battle.PlayerShip.Name : battle.EnemyShip.Name)}.");
        return true;
    }

    private static bool CombatCapable(ShipState ship)
    {
        if (ship.Integrity <= 5) return false;
        var structural = ship.Modules.Any(m => (m.Type == ModuleType.Core || m.Type == ModuleType.Hull) && !m.Destroyed);
        return structural && (HasFunctioningWeaponMount(ship) || FindEmergencyWeaponRepair(ship) is not null);
    }

    private static bool HasFunctioningWeaponMount(ShipState ship) =>
        ship.Modules.Any(m => m.Type == ModuleType.Weapon && !m.Destroyed && m.Powered && m.ShortTurns == 0);

    private static ShipModule? FindEmergencyWeaponRepair(ShipState ship)
    {
        if (ship.RepairKits <= 0) return null;

        var recoverableShort = ship.Modules
            .Where(m => m.Type == ModuleType.Weapon && !m.Destroyed && m.Powered && m.ShortTurns > 0)
            .OrderBy(m => m.Hp)
            .FirstOrDefault();
        if (recoverableShort is not null) return recoverableShort;

        if (ship.RepairKits < 2) return null;
        var core = ship.Modules.FirstOrDefault(m => m.Type == ModuleType.Core);
        var liveWeapon = ship.Modules.Any(m => m.Type == ModuleType.Weapon && !m.Destroyed);
        if (core is not null && core.Destroyed && liveWeapon) return core;

        if (core is not null && !core.Destroyed)
            return ship.Modules.Where(m => m.Type == ModuleType.Weapon && m.Destroyed).OrderByDescending(m => m.MaxHp).FirstOrDefault();

        return null;
    }

    private static void AddLog(BattleState battle, string kind, string text) =>
        battle.Log.Add(new(battle.Turn, kind, text, DateTimeOffset.UtcNow));
}
