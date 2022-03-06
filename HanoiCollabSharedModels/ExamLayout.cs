using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace HanoiCollab.Models
{
    public class ExamLayout
    {
        [JsonPropertyName("OriginalLink")]
        public Uri OriginalLink { get; set; }

        [JsonPropertyName("Resources")]
        public List<Uri> Resources { get; set; }

        [JsonPropertyName("Questions")]
        public List<QuestionLayout> Questions { get; set; }
    }
}
