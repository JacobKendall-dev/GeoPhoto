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

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentityCore<ApplicationUser>()
    .AddEntityFrameworkStores<AppDbContext>();

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

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.UseCors(policy =>
    policy.AllowAnyOrigin()
          .AllowAnyHeader()
          .AllowAnyMethod());

app.UseStaticFiles();
app.MapControllers();

app.MapGet("/", () => "API Running");

app.MapPost("/register", async (RegisterRequest request, UserManager<ApplicationUser> userManager) =>
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

    return Results.Ok(new
    {
        message = "User registered successfully"
    });
});

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
});


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
    UserManager<ApplicationUser> userManager) =>
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
        request.Email != currentUser.Email)
    {
        var existingEmail = await userManager.FindByEmailAsync(
            request.Email);

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
            request.Email.Trim());

        if (!emailResult.Succeeded)
        {
            return Results.BadRequest(emailResult.Errors);
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

    await userManager.UpdateAsync(currentUser);

    return Results.Ok(new
    {
        message = "Account updated successfully."
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