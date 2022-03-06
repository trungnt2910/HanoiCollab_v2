namespace HanoiCollab.Services
{
    /// <summary>
    /// A class to keep track of **active** exams.
    /// Because it only tracks **active** connections to this server,
    /// no database is involved. Everything is stored temporarily on RAM.
    /// </summary>
    public class ExamService
    {
        private readonly Dictionary<string, HashSet<string>> _exams = new();

        public void JoinExam(string user, string examId)
        {
            HashSet<string> userExams;
            lock (_exams)
            {
                userExams = _exams.GetValueOrDefault(user);
                if (userExams == null)
                {
                    userExams = new HashSet<string>();
                    _exams.Add(user, userExams);
                }
            }
            lock (userExams)
            {
                userExams.Add(examId);
            }
        }

        // There's an edge case of users suddenly leaving 
        // an exam without telling.
        public void LeaveExam(string user, string examId)
        {
            HashSet<string> userExams;
            lock (_exams)
            {
                userExams = _exams.GetValueOrDefault(user);
            }
            if (userExams == null)
            {
                return;
            }
            lock (userExams)
            {
                userExams.Remove(examId);
            }
            if (userExams.Count == 0)
            {
                lock (_exams)
                {
                    _exams.Remove(user);
                }
            }
        }

        public ICollection<string> GetActiveExams(string user)
        {
            lock (_exams)
            {
                return _exams.GetValueOrDefault(user);
            }
        }
    }
}
