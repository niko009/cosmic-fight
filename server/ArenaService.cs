using System.Collections.Concurrent;

namespace CosmicFight.Server;

public sealed class ArenaService
{
    private sealed class Presence
    {
        public required PlayerProfile Profile { get; set; }
        public HashSet<string> Connections { get; } = [];
        public string Status { get; set; } = "online_available";
        public Guid? BattleId { get; set; }
    }

    private readonly object _gate = new();
    private readonly Dictionary<Guid, Presence> _players = [];
    private readonly Dictionary<Guid, DuelChallenge> _challenges = [];
    private readonly Dictionary<Guid, Guid> _battleByPlayer = [];

    public int OnlineCount
    {
        get { lock (_gate) return _players.Values.Count(p => p.Connections.Count > 0); }
    }

    public void Connect(string connectionId, PlayerProfile profile)
    {
        lock (_gate)
        {
            if (!_players.TryGetValue(profile.Id, out var p))
            {
                p = new Presence { Profile = profile };
                _players[profile.Id] = p;
            }
            p.Profile = profile;
            p.Connections.Add(connectionId);
            p.Status = p.BattleId is null ? "online_available" : "in_battle";
            ExpireChallengesUnsafe();
        }
    }

    public void Disconnect(string connectionId)
    {
        lock (_gate)
        {
            foreach (var p in _players.Values)
            {
                if (!p.Connections.Remove(connectionId)) continue;
                if (p.Connections.Count == 0 && p.BattleId is null) p.Status = "offline";
                break;
            }
        }
    }

    public IReadOnlyList<ArenaPlayer> List(Guid viewerId)
    {
        lock (_gate)
        {
            ExpireChallengesUnsafe();
            return _players.Values
                .Where(p => p.Profile.Id != viewerId && p.Connections.Count > 0)
                .OrderBy(p => p.Status == "online_available" ? 0 : 1)
                .ThenByDescending(p => p.Profile.Rating)
                .Select(p => new ArenaPlayer(p.Profile.Id, p.Profile.DisplayName, p.Profile.AvatarUrl,
                    p.Profile.Rating, p.Profile.Level, ShipPower(p.Profile), p.Status))
                .ToArray();
        }
    }

    public DuelChallenge CreateChallenge(Guid fromId, Guid toId)
    {
        lock (_gate)
        {
            ExpireChallengesUnsafe();
            if (fromId == toId) throw new InvalidOperationException("Cannot challenge yourself");
            if (!_players.TryGetValue(fromId, out var from) || from.Connections.Count == 0) throw new InvalidOperationException("Challenger is offline");
            if (!_players.TryGetValue(toId, out var to) || to.Connections.Count == 0) throw new InvalidOperationException("Opponent is offline");
            if (from.BattleId is not null || to.BattleId is not null || from.Status != "online_available" || to.Status != "online_available")
                throw new InvalidOperationException("One of the players is not available");
            if (_challenges.Values.Any(c => c.Status == "pending" && (c.FromPlayerId == fromId || c.ToPlayerId == fromId || c.FromPlayerId == toId || c.ToPlayerId == toId)))
                throw new InvalidOperationException("A challenge is already pending");
            var challenge = new DuelChallenge(Guid.NewGuid(), fromId, from.Profile.DisplayName, toId, to.Profile.DisplayName,
                DateTimeOffset.UtcNow.AddSeconds(30), "pending");
            _challenges[challenge.Id] = challenge;
            from.Status = "challenging";
            to.Status = "invited";
            return challenge;
        }
    }

    public DuelChallenge ResolveChallenge(Guid challengeId, Guid responderId, bool accept)
    {
        lock (_gate)
        {
            ExpireChallengesUnsafe();
            if (!_challenges.TryGetValue(challengeId, out var challenge) || challenge.Status != "pending") throw new InvalidOperationException("Challenge is no longer active");
            if (challenge.ToPlayerId != responderId) throw new UnauthorizedAccessException();
            var resolved = challenge with { Status = accept ? "accepted" : "declined" };
            _challenges[challengeId] = resolved;
            if (_players.TryGetValue(challenge.FromPlayerId, out var from)) from.Status = "online_available";
            if (_players.TryGetValue(challenge.ToPlayerId, out var to)) to.Status = "online_available";
            return resolved;
        }
    }

    public void AttachBattle(Guid battleId, Guid a, Guid b)
    {
        lock (_gate)
        {
            _battleByPlayer[a] = battleId; _battleByPlayer[b] = battleId;
            if (_players.TryGetValue(a, out var pa)) { pa.BattleId = battleId; pa.Status = "in_battle"; }
            if (_players.TryGetValue(b, out var pb)) { pb.BattleId = battleId; pb.Status = "in_battle"; }
        }
    }

    public Guid? BattleFor(Guid playerId)
    {
        lock (_gate) return _battleByPlayer.GetValueOrDefault(playerId);
    }

    public void FinishBattle(Guid a, Guid b)
    {
        lock (_gate)
        {
            _battleByPlayer.Remove(a); _battleByPlayer.Remove(b);
            if (_players.TryGetValue(a, out var pa)) { pa.BattleId = null; pa.Status = pa.Connections.Count > 0 ? "online_available" : "offline"; }
            if (_players.TryGetValue(b, out var pb)) { pb.BattleId = null; pb.Status = pb.Connections.Count > 0 ? "online_available" : "offline"; }
        }
    }

    public bool IsOnline(Guid playerId)
    {
        lock (_gate) return _players.TryGetValue(playerId, out var p) && p.Connections.Count > 0;
    }

    private void ExpireChallengesUnsafe()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var item in _challenges.Values.Where(c => c.Status == "pending" && c.ExpiresAt <= now).ToArray())
        {
            _challenges[item.Id] = item with { Status = "expired" };
            if (_players.TryGetValue(item.FromPlayerId, out var from) && from.BattleId is null) from.Status = from.Connections.Count > 0 ? "online_available" : "offline";
            if (_players.TryGetValue(item.ToPlayerId, out var to) && to.BattleId is null) to.Status = to.Connections.Count > 0 ? "online_available" : "offline";
        }
    }

    private static int ShipPower(PlayerProfile p) => 100 + p.Upgrades.Values.Sum() * 18 + p.Level * 5;
}
