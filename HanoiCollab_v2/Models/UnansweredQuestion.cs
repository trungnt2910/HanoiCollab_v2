namespace HanoiCollab.Models
{
    public class UnansweredQuestion
    {
        public string QuestionId { get; set; }

        public string ExamId { get; set; }

        public string UserId { get; set; }

        public override int GetHashCode()
        {
            return unchecked((QuestionId.GetHashCode() << 7) ^ (ExamId.GetHashCode() << 3) ^ UserId.GetHashCode());
        }

        public override bool Equals(object obj)
        {
            var realObj = obj as UnansweredQuestion;
            if (realObj == null)
            {
                return false;
            }
            return realObj.QuestionId == QuestionId && realObj.ExamId == ExamId && realObj.UserId == UserId;
        }
    }
}
