using HanoiCollab.Models;
using HanoiCollab.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace HanoiCollab.Hubs
{
    public class ExamHub : Hub
    {
        private readonly ExamService _examService;
        private readonly QuestionsService _questionsService;

        public ExamHub(ExamService examService, QuestionsService questionsService)
        {
            _examService = examService;
            _questionsService = questionsService;
        }

        [Authorize]
        public async Task JoinExam(string examId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, examId);
            _examService.JoinExam(GetUserName(), examId);
            var questions = await _questionsService.GetQuestionsForExam(examId);
            await Clients.Caller.SendAsync("InitializeExam", questions);
        }

        [Authorize]
        public async Task LeaveExam(string examId)
        {
            _examService.LeaveExam(GetUserName(), examId);
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, examId);
        }

        [Authorize]
        public async Task UpdateAnswer(string examId, string questionId, string answer)
        {
            var userName = GetUserName();
            var info = new QuestionUpdateInfo()
            {
                QuestionId = questionId,
                Answer = answer,
                UserId = userName,
            };
            if (answer != null)
            {
                // Answer supports at most 4096 characters. That seems small, but
                // enough to write a big fat essay.
                if (answer.Length > 4096)
                {
                    answer = answer.Substring(0, 4096);
                }
                var oldAnswer = await _questionsService.UpdateAnswer(userName, examId, questionId, answer);
                // This is either the letters (A, B, C, D) or some client-provided hash.
                // Always provide multiple choice old answers so clients can delete them.
                if ((oldAnswer?.Length ?? 0) <= 32)
                {
                    info.OldAnswer = oldAnswer;
                }
            }
            else
            {
                info.OldAnswer = await _questionsService.RemoveAnswer(userName, examId, questionId);
            }

            // Avoid bothering the other clients when there's nothing to update.
            if (info.OldAnswer != info.Answer)
            {
                await Clients.Group(examId).SendAsync("ReceiveAnswer", info);
            }
        }

        [Authorize]
        public async Task Ping(string examId, string pingType, string details)
        {
            await Clients.Group(examId).SendAsync("Ping", GetUserName(), pingType, details);
        }

        [Authorize]
        public Task<List<string>> GetActiveExams()
        {
            return Task.FromResult(_examService.GetActiveExams(GetUserName())?.ToList() ?? new List<string>());
        }

        [Authorize]
        public async Task RequestExamLayout(string examId)
        {
            await Clients.User(GetUserName()).SendAsync("RequestExamLayout", examId);
        }

        [Authorize]
        public async Task BroadcastExamLayout(string examId, ExamLayout layout)
        {
            await Clients.User(GetUserName()).SendAsync("BroadcastExamLayout", examId, layout);
        }

        [Authorize]
        public async Task BroadcastExamLayoutPartial(string examId, string broadcastId, int chunkIndex, int totalChunks, string layout)
        {
            await Clients.User(GetUserName()).SendAsync("BroadcastExamLayoutPartial", examId, broadcastId, chunkIndex, totalChunks, layout);
        }

        private string GetUserName()
        {
            return Context.User.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous";
        }
    }
}
