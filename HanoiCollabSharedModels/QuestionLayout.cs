using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace HanoiCollab.Models
{
    public class QuestionLayout
    {
        [JsonPropertyName("Type")]
        public string Type { get; set; }

        [JsonPropertyName("Description")]
        public string Description { get; set; }

        [JsonPropertyName("Id")]
        public string Id { get; set; }

        [JsonPropertyName("Answers")]
        public List<AnswerLayout> Answers { get; set; }

        [JsonPropertyName("Resources")]
        public List<Uri> Resources { get; set; }

        [JsonPropertyName("ImageResources")]
        public List<Uri> ImageResources { get; set; }

        public bool IsMultipleChoice()
        {
            return Type == "multipleChoice" || Type == "hybrid";
        }
        public bool IsWritten()
        {
            return Type == "written" || Type == "hybrid";
        }
    }
}