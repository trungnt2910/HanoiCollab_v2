﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace HanoiCollab.Hubs
{
    public class ChatHub : Hub
    {
        [Authorize]
        public async Task SendMessage(string channel, string message)
        {
            await Clients.Group(channel).SendAsync("ReceiveMessage", Context.User.FindFirst(ClaimTypes.Name).Value, message);
        }

        [Authorize]
        public async Task JoinChannel(string channel)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, channel);
            var name = Context.User.FindFirst(ClaimTypes.Name).Value;
            await Clients.Group(channel).SendAsync("ReceiveMessage", name, $"{name} has joined the group.");
        }

        [Authorize]
        public async Task LeaveChannel(string channel)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, channel);
            var name = Context.User.FindFirst(ClaimTypes.Name).Value;
            await Clients.Group(channel).SendAsync("ReceiveMessage", name, $"{name} has left the group.");
        }
    }
}
