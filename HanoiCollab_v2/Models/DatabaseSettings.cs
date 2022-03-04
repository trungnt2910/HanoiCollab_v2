namespace HanoiCollab.Models
{
    public class DatabaseSettings
    {
        public string ConnectionString { get; set; }

        public string DatabaseName { get; set; }

        public string UsersCollectionName { get; set; }

        public string QuestionsCollectionName { get; set; }
    }
}
