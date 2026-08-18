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

    }
}