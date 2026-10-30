using Microsoft.AspNetCore.Identity;

namespace MapAppApi.Models;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = "";

    public string LastName { get; set; } = "";

    public string? ProfilePicture { get; set; }

    public ICollection<LocationLike> LocationLikes { get; set; } = new List<LocationLike>();

    public ICollection<Bookmark> Bookmarks { get; set; } = new List<Bookmark>();

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}