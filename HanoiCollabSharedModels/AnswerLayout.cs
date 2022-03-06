using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace HanoiCollab.Models
{
    public class AnswerLayout
    {
        [JsonPropertyName("Description")]
        public string Description { get; set; }

        [JsonPropertyName("Resources")]
        public List<Uri> Resources { get; set; }

        [JsonPropertyName("ImageResources")]
        public List<Uri> ImageResources { get; set; }

        [JsonPropertyName("Id")]
        public string Id { get; set; }

        [JsonPropertyName("Alpha")]
        public string Alpha { get; set; }
    }
}