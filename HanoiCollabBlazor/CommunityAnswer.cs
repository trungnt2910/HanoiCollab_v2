using HanoiCollab.Models;

namespace HanoiCollabBlazor
{
    public class CommunityAnswer
    {
        private readonly Dictionary<string, HashSet<string>> _multipleChoice = new Dictionary<string, HashSet<string>>();
        private readonly Dictionary<string, string> _written = new Dictionary<string, string>();
        private readonly Dictionary<string, string> _idToAlpha = new Dictionary<string, string>();
        private object _locker = new object();

        public IReadOnlyDictionary<string, HashSet<string>> MultipleChoiceAnswers => _multipleChoice;
        public IReadOnlyDictionary<string, string> WrittenAnswers => _written;

        public CommunityAnswer(QuestionLayout layout)
        {
            if (layout.IsMultipleChoice())
            {
                foreach (var ans in layout.Answers)
                {
                    _multipleChoice.Add(ans.Alpha, new HashSet<string>());
                    _idToAlpha.Add(ans.Id, ans.Alpha);
                }
            }
        }

        public event EventHandler Updated;

        public void Update(Question q)
        {
            lock (_locker)
            {
                UpdateCore(q.Answer, q.UserId);
            }
            Updated?.Invoke(this, EventArgs.Empty);
        }

        public void Update(QuestionUpdateInfo q)
        {
            lock (_locker)
            {
                if (q.OldAnswer != null && _idToAlpha.ContainsKey(q.OldAnswer))
                {
                    _multipleChoice[_idToAlpha[q.OldAnswer]].Remove(q.UserId);
                }
                // The server, under certain circumstances, may not send the old answer.
                else if (_written.ContainsKey(q.UserId) && (q.OldAnswer == null || _written[q.UserId] == q.OldAnswer))
                {
                    _written.Remove(q.UserId);
                }
                
                if (q.Answer != null)
                {
                    UpdateCore(q.Answer, q.UserId);
                }
            }
            Updated?.Invoke(this, EventArgs.Empty);
        }

        private void UpdateCore(string answer, string userId)
        {
            if (_idToAlpha.ContainsKey(answer))
            {
                _multipleChoice[_idToAlpha[answer]].Add(userId);
            }
            else
            {
                _written.Add(userId, answer);
            }
        }
    }
}
