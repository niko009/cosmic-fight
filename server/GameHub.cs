using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CosmicFight.Server;

[Authorize]
public sealed class GameHub(ArenaService arena, GameStore store, CombatEngine engine) : Hub
{
    public override async Task OnConnectedAsync()
    {
        if (AuthHelpers.PlayerId(Context.User) is Guid playerId && await store.GetPlayerAsync(playerId) is { } profile)
        {
            arena.Connect(Context.ConnectionId, profile);
            if (arena.BattleFor(playerId) is null && await store.GetActiveBattleForPlayerAsync(playerId) is { } restored)
            {
                var battle = engine.RestoreBattle(restored);
                if (battle.OpponentPlayerId is Guid opponentId)
                    arena.AttachBattle(battle.Id, battle.PlayerId, opponentId);
            }
            await Clients.Caller.SendAsync("arenaState", new { online = arena.OnlineCount, players = arena.List(playerId) });
            if (arena.BattleFor(playerId) is Guid battleId && engine.GetBattle(battleId) is { } battle)
                await Clients.Caller.SendAsync("matchStarted", engine.ViewerSnapshot(battle, playerId));
            await Clients.All.SendAsync("arenaChanged", new { online = arena.OnlineCount });
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        arena.Disconnect(Context.ConnectionId);
        await Clients.All.SendAsync("arenaChanged", new { online = arena.OnlineCount });
        await base.OnDisconnectedAsync(exception);
    }

    public Task<object> GetArena()
    {
        var playerId = AuthHelpers.RequirePlayerId(Context.User!);
        return Task.FromResult<object>(new { online = arena.OnlineCount, players = arena.List(playerId) });
    }

    public ViewerBattleSnapshot? GetCurrentBattle()
    {
        var playerId = AuthHelpers.RequirePlayerId(Context.User!);
        return arena.BattleFor(playerId) is Guid battleId && engine.GetBattle(battleId) is { } battle
            ? engine.ViewerSnapshot(battle, playerId)
            : null;
    }

    public async Task Challenge(Guid opponentId)
    {
        var playerId = AuthHelpers.RequirePlayerId(Context.User!);
        var challenge = arena.CreateChallenge(playerId, opponentId);
        await Clients.User(opponentId.ToString()).SendAsync("challengeReceived", challenge);
        await Clients.User(playerId.ToString()).SendAsync("challengeSent", challenge);
        await Clients.All.SendAsync("arenaChanged", new { online = arena.OnlineCount });
    }

    public async Task RespondChallenge(Guid challengeId, bool accept)
    {
        var responderId = AuthHelpers.RequirePlayerId(Context.User!);
        var challenge = arena.ResolveChallenge(challengeId, responderId, accept);
        if (!accept)
        {
            await Clients.User(challenge.FromPlayerId.ToString()).SendAsync("challengeDeclined", challenge);
            await Clients.User(challenge.ToPlayerId.ToString()).SendAsync("challengeClosed", challenge);
            await Clients.All.SendAsync("arenaChanged", new { online = arena.OnlineCount });
            return;
        }

        if (!arena.IsOnline(challenge.FromPlayerId) || !arena.IsOnline(challenge.ToPlayerId))
            throw new HubException("One of the players went offline");

        var a = await store.GetPlayerAsync(challenge.FromPlayerId) ?? throw new HubException("Challenger profile not found");
        var b = await store.GetPlayerAsync(challenge.ToPlayerId) ?? throw new HubException("Opponent profile not found");
        var aLoadout = await store.GetLoadoutAsync(a.Id);
        var bLoadout = await store.GetLoadoutAsync(b.Id);
        var battle = engine.CreatePvpBattle(a, aLoadout, b, bLoadout);
        await store.SaveActiveBattleAsync(
            battle.Id, a.Id, b.Id, battle.Turn, store.SerializeBattle(battle));
        arena.AttachBattle(battle.Id, a.Id, b.Id);
        await Clients.User(a.Id.ToString()).SendAsync("matchStarted", engine.ViewerSnapshot(battle, a.Id));
        await Clients.User(b.Id.ToString()).SendAsync("matchStarted", engine.ViewerSnapshot(battle, b.Id));
        await Clients.All.SendAsync("arenaChanged", new { online = arena.OnlineCount });
    }

    public async Task Act(BattleActionRequest request)
    {
        var playerId = AuthHelpers.RequirePlayerId(Context.User!);
        if (arena.BattleFor(playerId) is not Guid battleId || engine.GetBattle(battleId) is not { } battle)
            throw new HubException("Active battle not found");
        string serializedState;
        lock (battle)
        {
            engine.ApplyPvpAction(battle, playerId, request);
            serializedState = store.SerializeBattle(battle);
        }

        var a = battle.PlayerId;
        var b = battle.OpponentPlayerId ?? throw new HubException("Opponent missing");
        if (battle.Status == "active")
            await store.SaveActiveBattleAsync(battle.Id, a, b, battle.Turn, serializedState);

        if (battle.Status == "finished")
        {
            var settle = false;
            lock (battle) { if (!battle.Settled) { battle.Settled = true; settle = true; } }
            if (settle)
            {
                try
                {
                    await store.SettlePvpBattleAsync(battle);
                    arena.FinishBattle(a, b);
                    await Clients.User(a.ToString()).SendAsync("profileChanged");
                    await Clients.User(b.ToString()).SendAsync("profileChanged");
                    await Clients.All.SendAsync("arenaChanged", new { online = arena.OnlineCount });
                }
                catch
                {
                    lock (battle) battle.Settled = false;
                    throw;
                }
            }
        }

        await Clients.User(a.ToString()).SendAsync("battleUpdated", engine.ViewerSnapshot(battle, a));
        await Clients.User(b.ToString()).SendAsync("battleUpdated", engine.ViewerSnapshot(battle, b));
    }
}
