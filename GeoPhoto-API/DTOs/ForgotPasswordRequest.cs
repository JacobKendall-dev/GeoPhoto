using System.ComponentModel.DataAnnotations;

namespace MapAppApi.DTOs;

public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";
}