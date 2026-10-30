namespace MapAppApi.DTOs;
using System.ComponentModel.DataAnnotations;

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    public string Password { get; set; } = "";

    [Required]
    public string FirstName { get; set; } = "";

    [Required]
    public string LastName { get; set; } = "";

    [Required]
    [StringLength(15, MinimumLength = 1)]
    [RegularExpression(@"^[A-Za-z0-9_.]+$")]
    public string Username { get; set; } = "";
}