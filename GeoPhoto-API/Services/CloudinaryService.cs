
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace MapAppApi.Services
{
    public class CloudinaryService
    {
        private readonly Cloudinary _cloudinary;
        private readonly string _cloudName;

        public CloudinaryService(IConfiguration configuration)
        {
            var cloudName = configuration["CLOUDINARY_CLOUD_NAME"];
            var apiKey = configuration["CLOUDINARY_API_KEY"];
            var apiSecret = configuration["CLOUDINARY_API_SECRET"];

            if (string.IsNullOrWhiteSpace(cloudName) ||
                string.IsNullOrWhiteSpace(apiKey) ||
                string.IsNullOrWhiteSpace(apiSecret))
            {
                throw new InvalidOperationException(
                    "Cloudinary configuration is missing.");
            }

            _cloudName = cloudName;

            var account = new Account(
                cloudName,
                apiKey,
                apiSecret
            );

            _cloudinary = new Cloudinary(account);
            _cloudinary.Api.Secure = true;
        }

        public async Task<(string ImageUrl, string PublicId)> UploadImageAsync(
            Stream fileStream,
            string fileName,
            string folder)
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, fileStream),
                Folder = folder,
                UseFilename = false,
                UniqueFilename = true
            };

            var result = await _cloudinary.UploadAsync(uploadParams);

            if (result.Error != null)
            {
                throw new InvalidOperationException(
                    $"Cloudinary upload failed: {result.Error.Message}");
            }

            return (
                result.SecureUrl.ToString(),
                result.PublicId
            );
        }

        public async Task DeleteImageAsync(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
                return;

            if (!Uri.TryCreate(
                imageUrl,
                UriKind.Absolute,
                out var uri))
            {
                return;
            }

            // Only delete images hosted in our Cloudinary account.
            if (uri.Host != "res.cloudinary.com")
                return;

            var segments = uri.AbsolutePath
                .Split('/', StringSplitOptions.RemoveEmptyEntries);

            if (segments.Length < 5 ||
                segments[0] != _cloudName ||
                segments[1] != "image" ||
                segments[2] != "upload")
            {
                return;
            }

            var publicIdSegments = segments.Skip(3).ToList();

            // Remove the version segment, such as v1234567890.
            if (publicIdSegments.Count > 0 &&
                publicIdSegments[0].Length > 1 &&
                publicIdSegments[0][0] == 'v' &&
                publicIdSegments[0].Substring(1).All(char.IsDigit))
            {
                publicIdSegments.RemoveAt(0);
            }

            if (publicIdSegments.Count == 0)
                return;

            // Cloudinary public IDs do not include the file extension.
            var lastSegment = publicIdSegments[^1];
            var extensionIndex = lastSegment.LastIndexOf('.');

            if (extensionIndex > 0)
            {
                publicIdSegments[^1] =
                    lastSegment.Substring(0, extensionIndex);
            }

            var publicId = Uri.UnescapeDataString(
                string.Join("/", publicIdSegments));

            var deletionResult = await _cloudinary.DestroyAsync(
                new DeletionParams(publicId));

            if (deletionResult.Error != null)
            {
                throw new InvalidOperationException(
                    $"Cloudinary deletion failed: " +
                    deletionResult.Error.Message);
            }
        }
    }
}
