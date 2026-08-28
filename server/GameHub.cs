using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CosmicFight.Server;

public sealed class PresenceTracker
{
    private readonly ConcurrentDictionary<string, Guid> _connections = new();
    public int OnlineCount => _connections.Values.Distinct().Count();
    public void Add(string connectionId, Guid playerId) => _connections[connectionId] = playerId;
    public void Remove(string connectionId) => _connections.TryRemove(connectionId, out _);
}

[Authorize]
public sealed class GameHub(PresenceTracker presence) : Hub
{
    public override async Task OnConnectedAsync()
    {
        if (AuthHelpers.PlayerId(Context.User) is Guid playerId)
        {
            presence.Add(Context.ConnectionId, playerId);
            await Clients.All.SendAsync("presence", new { online = presence.OnlineCount });
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        presence.Remove(Context.ConnectionId);
        await Clients.All.SendAsync("presence", new { online = presence.OnlineCount });
        await base.OnDisconnectedAsync(exception);
    }
}
