using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using MapAppApi.Data;
using MapAppApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors();

builder.Services.AddControllers();

var app = builder.Build();

app.UseCors(policy =>
    policy.AllowAnyOrigin()
          .AllowAnyHeader()
          .AllowAnyMethod());

app.UseStaticFiles();
app.MapControllers();

app.MapGet("/", () => "API Running");


app.MapGet("/locations", async (AppDbContext db) =>
{   
    return await db.Locations.ToListAsync();
});

app.MapPost("/locations", async (AppDbContext db, Location location) =>
{
    db.Locations.Add(location);
    await db.SaveChangesAsync();
    return location;
});

/*
app.MapPut("/locations/{id}", async (int id, AppDbContext db, Location updatedLocation) =>
{
    var location = await db.Locations.FindAsync(id);

    if (location == null)
    {
        return Results.NotFound();
    }

    location.Latitude = updatedLocation.Latitude;
    location.Longitude = updatedLocation.Longitude;
    location.Description = updatedLocation.Description;
    location.ImageUrl = updatedLocation.ImageUrl;
    location.CreatedAt = updatedLocation.CreatedAt;

    await db.SaveChangesAsync();

    return Results.Ok(location);
});

app.MapDelete("/locations/{id}", async (int id, AppDbContext db) =>
{
    var location = await db.Locations.FindAsync(id);

    if (location == null)
    {
        return Results.NotFound();
    }

    db.Locations.Remove(location);

    await db.SaveChangesAsync();

    return Results.Ok();
});
*/

app.Run();