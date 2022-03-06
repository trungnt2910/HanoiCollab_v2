using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace HanoiCollab.Models
{
    public class Question
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string MongoId { get; set; }

        [JsonPropertyName("QuestionId")]
        public string QuestionId { get; set; }

        [JsonPropertyName("ExamId")]
        public string ExamId { get; set; }

        [JsonPropertyName("UserId")]
        public string UserId { get; set; }

        [JsonPropertyName("Answer")]
        public string Answer { get; set; }
    }
}
