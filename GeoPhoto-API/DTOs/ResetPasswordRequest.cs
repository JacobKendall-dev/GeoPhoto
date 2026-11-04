using System.ComponentModel.DataAnnotations;

namespace MapAppApi.DTOs;

public class ResetPasswordRequest
{
    [Required]
    public string UserId { get; set; } = "";

    [Required]
    public string Token { get; set; } = "";

    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = "";
}