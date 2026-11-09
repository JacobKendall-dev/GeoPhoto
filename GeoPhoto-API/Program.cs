using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using MapAppApi.Data;
using MapAppApi.Models;
using Microsoft.AspNetCore.Identity;
using MapAppApi.DTOs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MapAppApi.Services;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;


var builder = WebApplication.CreateBuilder(args);

static RateLimitPartition<string> CreateIpRateLimit(
    HttpContext context,
    int permitLimit,
    TimeSpan window)
{
    var clientIp =
        context.Request.Headers["X-Real-IP"].FirstOrDefault()
        ?? context.Connection.RemoteIpAddress?.ToString()
        ?? "unknown";

    return RateLimitPartition.GetFixedWindowLimiter(
        clientIp,
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = permitLimit,
            Window = window,
            QueueLimit = 0,
            AutoReplenishment = true
        });
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentityCore<ApplicationUser>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(
                    builder.Configuration["Jwt:Key"]!
                )
            )
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors();

builder.Services.AddControllers();

builder.Services.AddSingleton<CloudinaryService>();
builder.Services.AddHttpClient<EmailService>();


builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode =
        StatusCodes.Status429TooManyRequests;

    options.AddPolicy("login", context =>
        CreateIpRateLimit(context, 5, TimeSpan.FromMinutes(1)));

    options.AddPolicy("register", context =>
        CreateIpRateLimit(context, 3, TimeSpan.FromHours(1)));

    options.AddPolicy("confirmation", context =>
        CreateIpRateLimit(context, 3, TimeSpan.FromHours(1)));

    options.AddPolicy("recover-registration", context =>
        CreateIpRateLimit(context, 5, TimeSpan.FromMinutes(15)));

    options.AddPolicy("password-reset", context =>
        CreateIpRateLimit(context, 5, TimeSpan.FromMinutes(15)));
});

var app = builder.Build();

app.UseHttpsRedirection();

app.UseCors(policy =>
    policy.WithOrigins(
        "https://trygeophoto.com",
        "https://www.trygeophoto.com",
        "http://localhost:5173"
    )
    .AllowAnyHeader()
    .AllowAnyMethod());

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.UseStaticFiles();
app.MapControllers();

app.MapGet("/", () => "API Running");

app.MapPost("/register", async (
    RegisterRequest request,
    UserManager<ApplicationUser> userManager,
    EmailService emailService) =>
{
    var user = new ApplicationUser
    {
        UserName = request.Username,
        Email = request.Email,
        FirstName = request.FirstName,
        LastName = request.LastName
    };

    var result = await userManager.CreateAsync(user, request.Password);

    if (!result.Succeeded)
    {
        return Results.BadRequest(result.Errors);
    }

    var token = await userManager.GenerateEmailConfirmationTokenAsync(user);

    var confirmationLink =
        $"https://trygeophoto.com/confirm-email" +
        $"?userId={Uri.EscapeDataString(user.Id)}" +
        $"&token={Uri.EscapeDataString(token)}";

    var safeLink = System.Net.WebUtility.HtmlEncode(confirmationLink);

    try
    {
        await emailService.SendEmailAsync(
            user.Email!,
            "Confirm your GeoPhoto email address",
            $"""
            <h2>Welcome to GeoPhoto!</h2>
            <p>Thanks for creating an account.</p>
            <p>Please confirm your email address by clicking below:</p>
            <p><a href="{safeLink}">Confirm Email Address</a></p>
            <p>If you did not create this account, you can ignore this email.</p>
            """,
            $"""
            Welcome to GeoPhoto!

            Please confirm your email address by visiting this link:

            {confirmationLink}

            If you did not create this account, you can ignore this email.
            """
        );
    }
    catch (Exception)
    {
        return Results.Problem(
            title: "Account created, but confirmation email could not be sent.",
            detail: "Please try requesting a confirmation email again.",
            statusCode: 503
        );
    }

    return Results.Ok(new
    {
        message = "Account created! Please check your email to confirm your account."
    });
})
.RequireRateLimiting("register");

app.MapGet("/confirm-email", async (
    string userId,
    string token,
    UserManager<ApplicationUser> userManager) =>
{
    var user = await userManager.FindByIdAsync(userId);

    if (user == null)
    {
        return Results.BadRequest(new
        {
            message = "Invalid confirmation link."
        });
    }

    if (user.EmailConfirmed)
    {
        return Results.Ok(new
        {
            message = "Your email address has already been confirmed."
        });
    }

    var result = await userManager.ConfirmEmailAsync(user, token);

    if (!result.Succeeded)
    {
        return Results.BadRequest(new
        {
            message = "This confirmation link is invalid or has expired."
        });
    }

    return Results.Ok(new
    {
        message = "Your email address has been successfully confirmed."
    });
});

app.MapPost("/resend-confirmation", async (
    ResendConfirmationRequest request,
    UserManager<ApplicationUser> userManager,
    EmailService emailService,
    ILogger<Program> logger) =>
{
    var user = await userManager.FindByEmailAsync(request.Email.Trim());

    // Return the same response regardless of whether the account exists.
    // This prevents people from discovering which email addresses are registered.
    const string genericMessage =
        "If an unconfirmed account exists for that email, a confirmation email will be sent.";

    if (user == null || user.EmailConfirmed)
    {
        return Results.Ok(new { message = genericMessage });
    }

    try
    {
        var token =
            await userManager.GenerateEmailConfirmationTokenAsync(user);

        var confirmationLink =
            $"https://trygeophoto.com/confirm-email" +
            $"?userId={Uri.EscapeDataString(user.Id)}" +
            $"&token={Uri.EscapeDataString(token)}";

        var safeLink =
            System.Net.WebUtility.HtmlEncode(confirmationLink);

        await emailService.SendEmailAsync(
            user.Email!,
            "Confirm your GeoPhoto email address",
            $"""
            <h2>Confirm your GeoPhoto email</h2>
            <p>Please click the link below to confirm your email address:</p>
            <p><a href="{safeLink}">Confirm Email Address</a></p>
            <p>If you did not request this, you can ignore this email.</p>
            """,
            $"""
            Please confirm your GeoPhoto email address by visiting:

            {confirmationLink}

            If you did not request this, you can ignore this email.
            """
        );
    }
    catch (Exception exception)
    {
        logger.LogError(
            exception,
            "Failed to resend confirmation email."
        );
    }

    return Results.Ok(new { message = genericMessage });
})
.RequireRateLimiting("resend-confirmation");

app.MapPost("/recover-registration", async (
    RecoverRegistrationRequest request,
    UserManager<ApplicationUser> userManager,
    EmailService emailService) =>
{
    var genericMessage =
        "If the account can be recovered, a confirmation email will be sent to the new address.";

    var account = await userManager.FindByNameAsync(
        request.Username.Trim());

    // Only allow recovery of accounts that haven't been verified.
    if (account == null || account.EmailConfirmed)
    {
        return Results.Ok(new { message = genericMessage });
    }

    var passwordValid = await userManager.CheckPasswordAsync(
        account,
        request.Password);

    if (!passwordValid)
    {
        return Results.Ok(new { message = genericMessage });
    }

    var newEmail = request.NewEmail.Trim();

    var existingEmail = await userManager.FindByEmailAsync(newEmail);

    if (existingEmail != null && existingEmail.Id != account.Id)
    {
        return Results.BadRequest(new
        {
            message = "That email address is already associated with another account."
        });
    }

    var emailResult = await userManager.SetEmailAsync(
        account,
        newEmail);

    if (!emailResult.Succeeded)
    {
        return Results.BadRequest(emailResult.Errors);
    }

    account.EmailConfirmed = false;

    var stampResult =
        await userManager.UpdateSecurityStampAsync(account);

    if (!stampResult.Succeeded)
    {
        return Results.BadRequest(stampResult.Errors);
    }

    var token =
        await userManager.GenerateEmailConfirmationTokenAsync(account);

    var confirmationLink =
        $"https://trygeophoto.com/confirm-email" +
        $"?userId={Uri.EscapeDataString(account.Id)}" +
        $"&token={Uri.EscapeDataString(token)}";

    var safeLink =
        System.Net.WebUtility.HtmlEncode(confirmationLink);

    try
    {
        await emailService.SendEmailAsync(
            newEmail,
            "Confirm your GeoPhoto email address",
            $"""
            <h2>Welcome back to GeoPhoto!</h2>
            <p>Your registration email address has been updated.</p>
            <p>Please confirm your new email address:</p>
            <p><a href="{safeLink}">Confirm Email Address</a></p>
            <p>If you did not request this change, you can ignore this email.</p>
            """,
            $"""
            Your GeoPhoto registration email address has been updated.

            Please confirm your new email address by visiting:

            {confirmationLink}

            If you did not request this change, you can ignore this email.
            """
        );
    }
    catch (Exception)
    {
        return Results.Problem(
            title: "Email updated, but confirmation email could not be sent.",
            detail: "Your account is saved with the new email address. Please try requesting another confirmation email.",
            statusCode: 503
        );
    }

    return Results.Ok(new { message = genericMessage });
})
.RequireRateLimiting("recover-registration");

app.MapPost("/forgot-password", async (
    ForgotPasswordRequest request,
    UserManager<ApplicationUser> userManager,
    EmailService emailService,
    ILogger<Program> logger) =>
{
    const string genericMessage =
        "If an account exists for that email address, a password reset link will be sent.";

    var user = await userManager.FindByEmailAsync(request.Email.Trim());

    // Don't reveal whether the account exists.
    if (user == null)
    {
        return Results.Ok(new { message = genericMessage });
    }

    try
    {
        var token = await userManager.GeneratePasswordResetTokenAsync(user);

        var resetLink =
            $"https://trygeophoto.com/reset-password" +
            $"?userId={Uri.EscapeDataString(user.Id)}" +
            $"&token={Uri.EscapeDataString(token)}";

        var safeLink =
            System.Net.WebUtility.HtmlEncode(resetLink);

        await emailService.SendEmailAsync(
            user.Email!,
            "Reset your GeoPhoto password",
            $"""
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your GeoPhoto password.</p>
            <p>Click the link below to choose a new password:</p>
            <p><a href="{safeLink}">Reset Password</a></p>
            <p>If you did not request this, you can ignore this email.</p>
            """,
            $"""
            We received a request to reset your GeoPhoto password.

            Reset your password by visiting:

            {resetLink}

            If you did not request this, you can ignore this email.
            """
        );
    }
    catch (Exception exception)
    {
        logger.LogError(
            exception,
            "Failed to send a password reset email."
        );
    }

    return Results.Ok(new { message = genericMessage });
})
.RequireRateLimiting("forgot-password");

app.MapPost("/reset-password", async (
    ResetPasswordRequest request,
    UserManager<ApplicationUser> userManager) =>
{
    var user = await userManager.FindByIdAsync(request.UserId);

    if (user == null)
    {
        return Results.BadRequest(new
        {
            message = "This password reset link is invalid or has expired."
        });
    }

    var result = await userManager.ResetPasswordAsync(
        user,
        request.Token,
        request.NewPassword);

    if (!result.Succeeded)
    {
        return Results.BadRequest(new
        {
            message = "Unable to reset your password. The link may be invalid or expired, or the new password may not meet the requirements."
        });
    }

    return Results.Ok(new
    {
        message = "Your password has been reset successfully. You can now log in."
    });
})
.RequireRateLimiting("reset-password");

app.MapPost("/login", async (
    LoginRequest request,
    UserManager<ApplicationUser> userManager) =>
{
    var user = await userManager.FindByEmailAsync(request.Email);

    if (user == null)
    {
        return Results.BadRequest(new
        {
            message = "Invalid email or password."
        });
    }

    var passwordValid = await userManager.CheckPasswordAsync(
        user,
        request.Password
    );

    if (!passwordValid)
    {
        return Results.BadRequest(new
        {
            message = "Invalid email or password."
        });
    }

    if (!user.EmailConfirmed)
    {
        return Results.BadRequest(new
        {
            message = "Please confirm your email address before logging in."
        });
    }

    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id),
        new Claim(ClaimTypes.Email, user.Email!)
    };

    var key = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(
            builder.Configuration["Jwt:Key"]!
        )
    );

    var credentials = new SigningCredentials(
        key,
        SecurityAlgorithms.HmacSha256
    );

    var token = new JwtSecurityToken(
        issuer: builder.Configuration["Jwt:Issuer"],
        audience: builder.Configuration["Jwt:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddHours(2),
        signingCredentials: credentials
    );

    var tokenString = new JwtSecurityTokenHandler()
        .WriteToken(token);

    return Results.Ok(new
    {
        token = tokenString
    });
})
.RequireRateLimiting("login");


app.MapGet("/locations", async (
    AppDbContext db,
    ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

    var locations = await db.Locations
        .Select(location => new
        {
            location.Id,
            location.Latitude,
            location.Longitude,
            location.Description,
            location.ImageUrl,
            location.CreatedAt,

            Username = location.User.UserName,
            ProfilePicture = location.User.ProfilePicture,

            LikeCount = location.Likes.Count(),

            CommentCount = location.Comments.Count(),

            LikedByMe = userId != null &&
                location.Likes.Any(
                    like => like.UserId == userId),

            BookmarkedByMe = userId != null &&
                location.Bookmarks.Any(
                    bookmark => bookmark.UserId == userId)
        })
        .OrderByDescending(location => location.CreatedAt)
        .ToListAsync();

    return Results.Ok(locations);
});

app.MapGet("/me", async (
    ClaimsPrincipal user,
    UserManager<ApplicationUser> userManager) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

    if (userId == null)
    {
        return Results.Unauthorized();
    }

    var currentUser = await userManager.FindByIdAsync(userId);

    if (currentUser == null)
    {
        return Results.NotFound();
    }

    return Results.Ok(new
    {
        username = currentUser.UserName,
        email = currentUser.Email,
        firstName = currentUser.FirstName,
        lastName = currentUser.LastName,
        profilePicture = currentUser.ProfilePicture
    });
})
.RequireAuthorization();

app.MapPut("/me", async (
    UpdateAccountRequest request,
    ClaimsPrincipal user,
    UserManager<ApplicationUser> userManager,
    EmailService emailService) =>
{
    var userId = user.FindFirstValue(
        ClaimTypes.NameIdentifier);

    if (userId == null)
    {
        return Results.Unauthorized();
    }

    var currentUser = await userManager.FindByIdAsync(userId);

    if (currentUser == null)
    {
        return Results.NotFound();
    }

    if (!string.IsNullOrWhiteSpace(request.Username) &&
        request.Username != currentUser.UserName)
    {
        var existingUsername = await userManager.FindByNameAsync(
            request.Username);

        if (existingUsername != null &&
            existingUsername.Id != currentUser.Id)
        {
            return Results.BadRequest(new
            {
                message = "Username is already taken."
            });
        }

        var usernameResult = await userManager.SetUserNameAsync(
            currentUser,
            request.Username.Trim());

        if (!usernameResult.Succeeded)
        {
            return Results.BadRequest(usernameResult.Errors);
        }
    }

    if (!string.IsNullOrWhiteSpace(request.Email) &&
        !string.Equals(
            request.Email.Trim(),
            currentUser.Email,
            StringComparison.OrdinalIgnoreCase))
    {
        var newEmail = request.Email.Trim();

        var existingEmail = await userManager.FindByEmailAsync(newEmail);

        if (existingEmail != null &&
            existingEmail.Id != currentUser.Id)
        {
            return Results.BadRequest(new
            {
                message = "Email is already in use."
            });
        }

        var emailResult = await userManager.SetEmailAsync(
            currentUser,
            newEmail);

        if (!emailResult.Succeeded)
        {
            return Results.BadRequest(emailResult.Errors);
        }

        // Changing the email requires confirmation again.
        currentUser.EmailConfirmed = false;

        // Invalidate previously generated confirmation tokens.
        var stampResult =
            await userManager.UpdateSecurityStampAsync(currentUser);

        if (!stampResult.Succeeded)
        {
            return Results.BadRequest(stampResult.Errors);
        }

        var token =
            await userManager.GenerateEmailConfirmationTokenAsync(currentUser);

        var confirmationLink =
            $"https://trygeophoto.com/confirm-email" +
            $"?userId={Uri.EscapeDataString(currentUser.Id)}" +
            $"&token={Uri.EscapeDataString(token)}";

        var safeLink =
            System.Net.WebUtility.HtmlEncode(confirmationLink);

        try
        {
            await emailService.SendEmailAsync(
                newEmail,
                "Confirm your new GeoPhoto email address",
                $"""
                <h2>Confirm your new email address</h2>
                <p>You recently changed the email address associated with your GeoPhoto account.</p>
                <p>Please confirm your new email address:</p>
                <p><a href="{safeLink}">Confirm Email Address</a></p>
                <p>If you did not make this change, please contact GeoPhoto support.</p>
                """,
                $"""
                You recently changed the email address associated with your GeoPhoto account.

                Please confirm your new email address by visiting:

                {confirmationLink}

                If you did not make this change, please contact GeoPhoto support.
                """
            );
        }
        catch (Exception)
        {
            return Results.Problem(
                title: "Email updated, but confirmation email could not be sent.",
                detail: "Your new email address is saved, but you must request another confirmation email.",
                statusCode: 503
            );
        }
    }

    currentUser.FirstName = request.FirstName?.Trim() ?? "";
    currentUser.LastName = request.LastName?.Trim() ?? "";

    if (!string.IsNullOrWhiteSpace(request.NewPassword))
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            return Results.BadRequest(new
            {
                message = "Current password is required."
            });
        }

        var passwordResult =
            await userManager.ChangePasswordAsync(
                currentUser,
                request.CurrentPassword,
                request.NewPassword);

        if (!passwordResult.Succeeded)
        {
            return Results.BadRequest(new
            {
                message = "Current password is incorrect or the new password is invalid."
            });
        }
    }

    var updateResult = await userManager.UpdateAsync(currentUser);

    if (!updateResult.Succeeded)
    {
        return Results.BadRequest(updateResult.Errors);
    }

    return Results.Ok(new
    {
        message = currentUser.EmailConfirmed
            ? "Account updated successfully."
            : "Account updated. Please check your new email address and confirm it before logging in.",
        emailConfirmationRequired = !currentUser.EmailConfirmed
    });
})
.RequireAuthorization();

app.MapPost("/locations", async (
    AppDbContext db,
    Location location,
    ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

    if (userId == null)
    {
        return Results.Unauthorized();
    }

    location.UserId = userId;

    db.Locations.Add(location);
    await db.SaveChangesAsync();

    return Results.Ok(location);
})
.RequireAuthorization();

app.MapDelete("/locations/{id}", async (
    int id,
    AppDbContext db,
    ClaimsPrincipal user) =>
{
    var location = await db.Locations.FindAsync(id);

    if (location == null)
    {
        return Results.NotFound();
    }

    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

    if (userId == null)
    {
        return Results.Unauthorized();
    }

    if (location.UserId != userId)
    {
        return Results.Forbid();
    }

    db.Locations.Remove(location);

    await db.SaveChangesAsync();

    return Results.Ok();
})
.RequireAuthorization();

app.MapGet("/locations/me", async (
    AppDbContext db,
    ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

    if (userId == null)
    {
        return Results.Unauthorized();
    }

    var locations = await db.Locations
        .Where(location => location.UserId == userId)
        .ToListAsync();

    return Results.Ok(locations);
})
.RequireAuthorization();


app.MapPost("/locations/{id}/like", async (
    int id,
    AppDbContext db,
    ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(
        ClaimTypes.NameIdentifier);

    if (userId == null)
    {
        return Results.Unauthorized();
    }

    var location = await db.Locations.FindAsync(id);

    if (location == null)
    {
        return Results.NotFound();
    }

    var existingLike = await db.LocationLikes
        .FindAsync(id, userId);

    if (existingLike != null)
    {
        return Results.Conflict(new
        {
            message = "You already liked this location."
        });
    }

    var like = new LocationLike
    {
        LocationId = id,
        UserId = userId
    };

    db.LocationLikes.Add(like);

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "Location liked."
    });
})
.RequireAuthorization();

app.MapDelete("/locations/{id}/like", async (
    int id,
    AppDbContext db,
    ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(
        ClaimTypes.NameIdentifier);

    if (userId == null)
    {
        return Results.Unauthorized();
    }

    var like = await db.LocationLikes
        .FindAsync(id, userId);

    if (like == null)
    {
        return Results.NotFound();
    }

    db.LocationLikes.Remove(like);

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "Location unliked."
    });
})
.RequireAuthorization();

app.MapPost("/locations/{id}/bookmark", async (
    int id,
    AppDbContext db,
    ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(
        ClaimTypes.NameIdentifier);

    if (userId == null)
    {
        return Results.Unauthorized();
    }

    var location = await db.Locations.FindAsync(id);

    if (location == null)
    {
        return Results.NotFound();
    }

    var existingBookmark = await db.Bookmarks
        .FindAsync(id, userId);

    if (existingBookmark != null)
    {
        return Results.Conflict(new
        {
            message = "You already bookmarked this location."
        });
    }

    var bookmark = new Bookmark
    {
        LocationId = id,
        UserId = userId
    };

    db.Bookmarks.Add(bookmark);

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "Location bookmarked."
    });
})
.RequireAuthorization();

app.MapDelete("/locations/{id}/bookmark", async (
    int id,
    AppDbContext db,
    ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(
        ClaimTypes.NameIdentifier);

    if (userId == null)
    {
        return Results.Unauthorized();
    }

    var bookmark = await db.Bookmarks
        .FindAsync(id, userId);

    if (bookmark == null)
    {
        return Results.NotFound();
    }

    db.Bookmarks.Remove(bookmark);

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "Location bookmark removed."
    });
})
.RequireAuthorization();

app.MapGet("/locations/{id}/comments", async (
    int id,
    AppDbContext db,
    ClaimsPrincipal user) =>
{
    var locationExists = await db.Locations
        .AnyAsync(location => location.Id == id);

    if (!locationExists)
    {
        return Results.NotFound();
    }

    var userId = user.FindFirstValue(
        ClaimTypes.NameIdentifier);

    var comments = await db.Comments
        .Where(comment => comment.LocationId == id)
        .OrderBy(comment => comment.CreatedAt)
        .Select(comment => new
        {
            comment.Id,
            comment.Text,
            comment.CreatedAt,
            Username = comment.User.UserName,
            ProfilePicture = comment.User.ProfilePicture,

            IsMine = userId != null &&
                comment.UserId == userId
        })
        .ToListAsync();

    return Results.Ok(comments);
})
.AllowAnonymous();

app.MapPost("/locations/{id}/comments", async (
    int id,
    CommentRequest request,
    AppDbContext db,
    ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(
        ClaimTypes.NameIdentifier);

    if (userId == null)
    {
        return Results.Unauthorized();
    }

    var locationExists = await db.Locations
        .AnyAsync(location => location.Id == id);

    if (!locationExists)
    {
        return Results.NotFound();
    }

    if (string.IsNullOrWhiteSpace(request.Text))
    {
        return Results.BadRequest(new
        {
            message = "Comment cannot be empty."
        });
    }

    var comment = new Comment
    {
        LocationId = id,
        UserId = userId,
        Text = request.Text.Trim(),
        CreatedAt = DateTime.UtcNow
    };

    db.Comments.Add(comment);

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        comment.Id,
        comment.Text,
        comment.CreatedAt
    });
})
.RequireAuthorization();

app.MapDelete("/locations/{locationId}/comments/{commentId}", async (
    int locationId,
    int commentId,
    AppDbContext db,
    ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(
        ClaimTypes.NameIdentifier);

    if (userId == null)
    {
        return Results.Unauthorized();
    }

    var comment = await db.Comments
        .FirstOrDefaultAsync(comment =>
            comment.Id == commentId &&
            comment.LocationId == locationId);

    if (comment == null)
    {
        return Results.NotFound();
    }

    if (comment.UserId != userId)
    {
        return Results.Forbid();
    }

    db.Comments.Remove(comment);

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "Comment deleted."
    });
})
.RequireAuthorization();

app.MapGet("/locations/bookmarks", async (
    AppDbContext db,
    ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

    if (userId == null)
    {
        return Results.Unauthorized();
    }

    var locations = await db.Locations
        .Where(location =>
            location.Bookmarks.Any(bookmark => bookmark.UserId == userId))
        .Select(location => new
        {
            location.Id
        })
        .ToListAsync();

    return Results.Ok(locations);
})
.RequireAuthorization();

app.Run();