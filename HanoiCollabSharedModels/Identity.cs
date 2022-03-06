using System;
using System.Text.Json.Serialization;

namespace HanoiCollab.Models
{
    public class Identity
    {
        [JsonPropertyName("Token")]
        public string Token { get; set; }
        [JsonPropertyName("Expiration")]
        public DateTime Expiration { get; set; }
    }
}
