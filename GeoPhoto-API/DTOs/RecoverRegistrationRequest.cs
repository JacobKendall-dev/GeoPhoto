using System.ComponentModel.DataAnnotations;

namespace MapAppApi.DTOs;

public class RecoverRegistrationRequest
{
    [Required]
    public string Username { get; set; } = "";

    [Required]
    public string Password { get; set; } = "";

    [Required]
    [EmailAddress]
    public string NewEmail { get; set; } = "";
}