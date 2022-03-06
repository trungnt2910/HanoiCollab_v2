using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace HanoiCollab.Models
{
    public class QuestionUpdateInfo
    {
        [JsonPropertyName("QuestionId")]
        public string QuestionId { get; set; }

        [JsonPropertyName("UserId")]
        public string UserId { get; set; }

        [JsonPropertyName("Answer")]
        public string Answer { get; set; }

        [JsonPropertyName("OldAnswer")]
        public string OldAnswer { get; set; }
    }
}
