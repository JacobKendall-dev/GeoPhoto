namespace MapAppApi.Models
{
    public class Location
    {
        public int Id { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set;}
        public string? CreatedAt { get; set;}
        public string UserId { get; set; } = "";
        public ApplicationUser User { get; set; } = null!;
        public ICollection<LocationLike> Likes { get; set; } = new List<LocationLike>();
        public ICollection<Bookmark> Bookmarks { get; set; } = new List<Bookmark>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();

    }
}