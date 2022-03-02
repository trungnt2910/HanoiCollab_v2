using HanoiCollab.Models;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Security.Cryptography;
using System.Text;

namespace HanoiCollab.Services
{
    public class AccountsService
    {
        private const int SALT_SIZE = 8;
        private readonly Random _random = new Random();
        private readonly IMongoCollection<User> _usersCollection;

        public AccountsService(IOptions<DatabaseSettings> bookStoreDatabaseSettings)
        {
            var mongoClient = new MongoClient(
                bookStoreDatabaseSettings.Value.ConnectionString);

            var mongoDatabase = mongoClient.GetDatabase(
                bookStoreDatabaseSettings.Value.DatabaseName);

            _usersCollection = mongoDatabase.GetCollection<User>(
                bookStoreDatabaseSettings.Value.UsersCollectionName);
        }

        public async Task<User> GetAsync(string username, string password)
        {
            var matchingUser = await _usersCollection.Find(u => u.Name == username).FirstOrDefaultAsync();
            if (matchingUser != null)
            {
                var salt = matchingUser.Salt;
                using var sha512 = SHA512.Create();
                if (CalculateHashedPassword(password, salt) == matchingUser.HashedPassword)
                {
                    return matchingUser;
                }
            }
            return null;
        }

        public async Task<bool> CreateAsync(string username, string password)
        {
            var salt = GenerateSalt();
            var oldUser = await _usersCollection.Find(u => u.Name == username).FirstOrDefaultAsync();
            if (oldUser != null)
            {
                return false;
            }
            var user = new User()
            {
                Id = ObjectId.GenerateNewId().ToString(),
                Name = username,
                Salt = salt,
                HashedPassword = CalculateHashedPassword(password, salt)
            };
            await _usersCollection.InsertOneAsync(user);
            return true;
        }

        public async Task<bool> UpdatePasswordAsync(string username, string oldPassword, string newPassword)
        {
            var user = await GetAsync(username, oldPassword);
            if (user != null)
            {
                user.HashedPassword = CalculateHashedPassword(newPassword, user.Salt);
                await _usersCollection.ReplaceOneAsync(u => u.Id == user.Id, user);
                return true;
            }
            return false;
        }
        public async Task UpdateNameAsync(string username, string password, string newUsername)
        {
            var collidingUser = await _usersCollection.Find(u => u.Name == newUsername).FirstOrDefaultAsync();
            if (collidingUser != null)
            {
                throw new InvalidOperationException("Username already exists.");
            }
            var user = await GetAsync(username, password);
            if (user != null)
            {
                user.Name = newUsername;
                await _usersCollection.ReplaceOneAsync(u => u.Id == user.Id, user);
                return;
            }
            throw new InvalidOperationException("Invalid credentials.");
        }

        private static string CalculateHashedPassword(string password, string salt)
        {
            password = $"{salt}_{password}";
            using var sha512 = SHA512.Create();
            return Convert.ToBase64String(sha512.ComputeHash(Encoding.UTF8.GetBytes(password)));
        }

        private string GenerateSalt()
        {
            var bytes = new byte[SALT_SIZE];
            _random.NextBytes(bytes);
            return Convert.ToBase64String(bytes);
        }
    }
}
