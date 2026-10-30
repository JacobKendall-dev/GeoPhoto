using Microsoft.AspNetCore.Mvc;

namespace MapAppApi.Controllers
{
    [ApiController]
    [Route("images")]
    public class ImagesController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public ImagesController(IWebHostEnvironment env)
        {
            _env = env;
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

            long size = image.Length;

            if (size > 10 * 1024 * 1024)
            {
                return BadRequest(
                    "Maximum size of a file is 10 MB");
            }

            List<string> validExtensions = new List<string>()
            {
                ".jpg",
                ".jpeg",
                ".png",
                ".gif"
            };

            string extension =
                Path.GetExtension(image.FileName).ToLower();

            if (!validExtensions.Contains(extension))
            {
                return BadRequest(
                    $"Extension is not valid. Allowed: " +
                    $"{string.Join(',', validExtensions)}");
            }

            string path = Path.Combine(
                _env.WebRootPath,
                "images",
                folder);

            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }

            string fileName =
                Guid.NewGuid().ToString() + extension;

            string filePath =
                Path.Combine(path, fileName);

            using FileStream stream =
                new FileStream(
                    filePath,
                    FileMode.Create);

            await image.CopyToAsync(stream);

            var url =
                $"{Request.Scheme}://{Request.Host}" +
                $"/images/{folder}/{fileName}";

            return Ok(new
            {
                imageUrl = url
            });
        }
    }
}