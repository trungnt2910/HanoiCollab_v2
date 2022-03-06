using HanoiCollab.Models;
using HanoiCollab.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HanoiCollab.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountsController : ControllerBase
    {
        private readonly AccountsService _accountsService;
        private readonly JwtSettings _jwtSettings;
        private readonly SymmetricSecurityKey _authSigningKey;

        public AccountsController(AccountsService accountsService, IOptions<JwtSettings> jwtSettings)
        {
            _accountsService = accountsService;
            _jwtSettings = jwtSettings.Value;
            _authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.JwtSecret));
        }

        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> LoginAsync([FromBody] Login loginInfo)
        {
            var user = await _accountsService.GetAsync(loginInfo.Name, loginInfo.Password);
            if (user != null)
            {
                var authClaims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, user.Name),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                };

                var token = new JwtSecurityToken(
                    expires: DateTime.Now.AddHours(24),
                    claims: authClaims,
                    audience: _jwtSettings.JwtAudience,
                    issuer: _jwtSettings.JwtIssuer,
                    signingCredentials: new SigningCredentials(_authSigningKey, SecurityAlgorithms.HmacSha256)
                    );

                return Ok(new Identity
                {
                    Token = new JwtSecurityTokenHandler().WriteToken(token),
                    Expiration = token.ValidTo
                });
            }
            return Unauthorized();
        }

        [HttpPost]
        [Route("register")]
        public async Task<IActionResult> RegisterAsync([FromBody] Login loginInfo)
        {
            if (await _accountsService.CreateAsync(loginInfo.Name, loginInfo.Password))
            {
                return Ok(new Response { Status = "Success", Message = "User created successfully!" });
            }

            return StatusCode(StatusCodes.Status409Conflict, new Response { Status = "Error", Message = "Username already exists!" });
        }

        [HttpPost]
        [Route("updatePassword")]
        public async Task<IActionResult> UpdatePasswordAsync([FromBody] Login loginInfo)
        {
            if (await _accountsService.UpdatePasswordAsync(loginInfo.Name, loginInfo.Password, loginInfo.NewPassword))
            {
                return Ok(new Response { Status = "Success", Message = "Password updated successfully!" });
            }

            return StatusCode(StatusCodes.Status409Conflict, new Response { Status = "Error", Message = "Failed to update password! Please check your login info." });
        }

        [HttpPost]
        [Route("updateName")]
        public async Task<IActionResult> UpdateNameAsync([FromBody] Login loginInfo)
        {
            try
            {
                await _accountsService.UpdateNameAsync(loginInfo.Name, loginInfo.Password, loginInfo.NewName);
                return Ok(new Response { Status = "Success", Message = "Username updated successfully!" });
            }
            catch (InvalidOperationException e)
            {
                return StatusCode(StatusCodes.Status409Conflict, new Response { Status = "Error", Message = $"Failed to update username: {e.Message}" });
            }
            catch (Exception e)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new Response { Status = "Error", Message = $"Failed to update username due to server error: {e.GetType().Name}" });
            }
        }
    }
}
