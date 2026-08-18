using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;


namespace MapAppApi.Controllers
{
    [ApiController]
    [Route("images")]
    public class ImagesController: ControllerBase
    {
    private readonly IWebHostEnvironment _env;

    public ImagesController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpPost]
    public async Task<IActionResult> UploadFile([FromForm] IFormFile image)
    {
            //BEGINNING OF VALIDATION
            if (image == null || image.Length == 0)
                return BadRequest("No file uploaded");

            long size = image.Length;
            if (size > 10 *1024 * 1024)
                return BadRequest("Maximum size of a file 10 mb");

            List<string> validExtentions = new List<string>() {".jpg", ".png", ".gif", "jpeg"};
            string extention = Path.GetExtension(image.FileName).ToLower();
            if (!validExtentions.Contains(extention))
            {
                return BadRequest($"Extentions is not valid. Allowed: {string.Join(',', validExtentions)}");
            }
            //END OF VALIDATION


            string path = Path.Combine(_env.WebRootPath, "images");
            if (!Directory.Exists(path))
                Directory.CreateDirectory(path);

            string fileName = Guid.NewGuid().ToString() + extention;

            using FileStream stream = new FileStream(Path.Combine(path, fileName), FileMode.Create);
            await image.CopyToAsync(stream);

            var url = $"{Request.Scheme}://{Request.Host}/images/{fileName}";

            return Ok(new {imageUrl = url});
        }
    }
}
