using Blazored.LocalStorage;
using HanoiCollab.Models;

namespace HanoiCollabBlazor
{
    public class IdentityService
    {
        private readonly ILocalStorageService _localStorage;

        public IdentityService(ILocalStorageService localStorage)
        {
            _localStorage = localStorage;
        }

        public event EventHandler IdentityChanged;

        public AsyncEventHandler<IdentityExpiredEventArgs> IdentityExpired;

        public async Task<Identity> GetIdentityAsync()
        {
            var identity = await _localStorage.GetItemAsync<Identity>("Identity");

            while (identity == null || identity.Expiration <= DateTime.Now)
            {
                var eventArgs = new IdentityExpiredEventArgs(identity);
                await IdentityExpired.InvokeAsync(this, eventArgs);
                if (eventArgs.NewIdentity != null && eventArgs.NewIdentity != identity)
                {
                    identity = eventArgs.NewIdentity;
                    await SetIdentityAsync(identity);
                }
            }

            return identity;
        }
        public async Task SetIdentityAsync(Identity value)
        {
            await _localStorage.SetItemAsync("Identity", value);
            IdentityChanged?.Invoke(this, EventArgs.Empty);
        }
        public async Task<string> GetUsernameAsync()
        {
            return await _localStorage.GetItemAsync<string>("Username");
        }
        public async Task SetUsernameAsync(string value)
        {
            await _localStorage.SetItemAsync("Username", value);
        }
    }
}
