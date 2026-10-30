namespace MapAppApi.Models;

public class LocationLike
{
    public int LocationId { get; set; }
    public Location Location { get; set; } = null!;

    public string UserId { get; set; } = "";
    public ApplicationUser User { get; set; } = null!;
}