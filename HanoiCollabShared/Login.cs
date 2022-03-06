using System.ComponentModel.DataAnnotations;

namespace HanoiCollab.Models
{
    public class Login
    {
        [Required(ErrorMessage = "Username is required")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; }

        public string NewName { get; set; }

        public string NewPassword { get; set; }
    }
}
