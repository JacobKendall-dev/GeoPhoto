using System.ComponentModel.DataAnnotations;

namespace MapAppApi.DTOs;

public class ResendConfirmationRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";
}