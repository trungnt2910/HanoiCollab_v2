using HanoiCollab.Models;
using HanoiCollab.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace HanoiCollab.Hubs
{
    public class ExamHub : Hub
    {
        private readonly QuestionsService _questionsService;

        public ExamHub(QuestionsService questionsService)
        {
            _questionsService = questionsService;
        }

        [Authorize]
        public async Task JoinExam(string examId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, examId);
            var questions = await _questionsService.GetQuestionsForExam(examId);
            await Clients.Caller.SendAsync("InitializeExam", questions);
        }

        [Authorize]
        public async Task LeaveExam(string examId)
        {
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
                if (answer.Length <= 32)
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

        private string GetUserName()
        {
            return Context.User.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous";
        }
    }
}
