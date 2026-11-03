using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace MapAppApi.Services;

public class EmailService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public EmailService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task SendEmailAsync(
        string recipient,
        string subject,
        string htmlContent,
        string textContent)
    {
        var apiKey = _configuration["RESEND_API_KEY"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "Resend API key is not configured."
            );
        }

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://api.resend.com/emails"
        );

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        request.Content = JsonContent.Create(new
        {
            from = "GeoPhoto <noreply@trygeophoto.com>",
            to = new[] { recipient },
            subject,
            html = htmlContent,
            text = textContent
        });

        using var response = await _httpClient.SendAsync(request);

        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Resend email request failed: {response.StatusCode} - {responseBody}"
            );
        }
    }
}