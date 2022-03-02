using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HanoiCollab.Models
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string Name { get; set; }

        public string Salt { get; set; }

        public string HashedPassword { get; set; }
    }
}
