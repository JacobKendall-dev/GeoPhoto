using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MapAppApi.Data;

namespace MapAppApi.Controllers
{
    [ApiController]
    [Route("users")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _db;

        public UsersController(AppDbContext db)
        {
            _db = db;
        }

        [Authorize]
        [HttpPut("profile-picture")]
        public async Task<IActionResult> UpdateProfilePicture(
            [FromBody] ProfilePictureRequest request)
        {
            var userId =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var user =
                await _db.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound();
            }

            user.ProfilePicture =
                request.ProfilePicture;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                profilePicture = user.ProfilePicture
            });
        }
    }

    public class ProfilePictureRequest
    {
        public string? ProfilePicture { get; set; }
    }
}