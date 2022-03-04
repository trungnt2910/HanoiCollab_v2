using HanoiCollab.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace HanoiCollab.Services
{
    public class QuestionsService
    {
        private readonly IMongoCollection<Question> _questionsCollection;

        public QuestionsService(IOptions<DatabaseSettings> databaseSettings)
        {
            var mongoClient = new MongoClient(
                databaseSettings.Value.ConnectionString);

            var mongoDatabase = mongoClient.GetDatabase(
                databaseSettings.Value.DatabaseName);

            _questionsCollection = mongoDatabase.GetCollection<Question>(
                databaseSettings.Value.QuestionsCollectionName);
        }

        public async Task<string> UpdateAnswer(string userName, string examId, string questionId, string answer)
        {
            return (await _questionsCollection.FindOneAndUpdateAsync(
                Builders<Question>.Filter
                    .Where(q => q.UserId == userName && q.ExamId == examId && q.QuestionId == questionId),
                Builders<Question>.Update
                    .Set(q => q.Answer, answer),
                new FindOneAndUpdateOptions<Question, Question>()
                {
                    IsUpsert = true,
                    ReturnDocument = ReturnDocument.Before
                }
            ))?.Answer;
        }

        public async Task<string> RemoveAnswer(string userName, string examId, string questionId)
        {
            return (await _questionsCollection.FindOneAndDeleteAsync(
                Builders<Question>.Filter
                    .Where(q => q.UserId == userName && q.ExamId == examId && q.QuestionId == questionId)
            ))?.Answer;
        }

        public async Task<IList<Question>> GetQuestionsForExam(string examId)
        {
            var cursor = await _questionsCollection.FindAsync(
                Builders<Question>.Filter
                    .Where(q => q.ExamId == examId)
                );

            var list = new List<Question>();

            while (await cursor.MoveNextAsync())
            {
                list.AddRange(cursor.Current);
            }

            return list;
        }
    }
}
