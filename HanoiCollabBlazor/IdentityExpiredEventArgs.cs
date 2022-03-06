using HanoiCollab.Models;

namespace HanoiCollabBlazor
{
    public class IdentityExpiredEventArgs : EventArgs
    {
        public Identity OldIdentity { get; init; }
        public Identity NewIdentity { get; set; }

        internal IdentityExpiredEventArgs(Identity oldIdentity)
        {
            OldIdentity = oldIdentity;
        }
    }
}
