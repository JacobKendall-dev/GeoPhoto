using Microsoft.AspNetCore.Mvc;
using MapAppApi.Services;

namespace MapAppApi.Controllers
{
    [ApiController]
    [Route("images")]
    public class ImagesController : ControllerBase
    {
        private readonly CloudinaryService _cloudinaryService;

        public ImagesController(
            CloudinaryService cloudinaryService)
        {
            _cloudinaryService = cloudinaryService;
        }

        [HttpPost("location")]
        public async Task<IActionResult> UploadLocationImage(
            [FromForm] IFormFile image)
        {
            return await UploadImage(image, "locations");
        }

        [HttpPost("profile")]
        public async Task<IActionResult> UploadProfileImage(
            [FromForm] IFormFile image)
        {
            return await UploadImage(image, "profiles");
        }

        private async Task<IActionResult> UploadImage(
            IFormFile image,
            string folder)
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            if (image.Length > 10 * 1024 * 1024)
            {
                return BadRequest(
                    "Maximum size of a file is 10 MB");
            }

            List<string> validExtensions = new()
            {
                ".jpg",
                ".jpeg",
                ".png",
                ".gif"
            };

            string extension =
                Path.GetExtension(image.FileName).ToLowerInvariant();

            if (!validExtensions.Contains(extension))
            {
                return BadRequest(
                    $"Extension is not valid. Allowed: " +
                    $"{string.Join(',', validExtensions)}");
            }

            try
            {
                using var stream = image.OpenReadStream();

                var result = await _cloudinaryService.UploadImageAsync(
                    stream,
                    image.FileName,
                    folder
                );

                return Ok(new
                {
                    imageUrl = result.ImageUrl
                });
            }
            catch (Exception)
            {
                return StatusCode(
                    500,
                    "Image upload failed.");
            }
        }
    }
}