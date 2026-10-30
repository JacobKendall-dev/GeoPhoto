using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using MapAppApi.Models;

namespace MapAppApi.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Location> Locations { get; set; }

        public DbSet<LocationLike> LocationLikes { get; set; }

        public DbSet<Bookmark> Bookmarks { get; set; }

        public DbSet<Comment> Comments { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<LocationLike>()
                .HasKey(like => new
                {
                    like.LocationId,
                    like.UserId
                });

            builder.Entity<Bookmark>()
                .HasKey(bookmark => new
                {
                    bookmark.LocationId,
                    bookmark.UserId
                });

            builder.Entity<LocationLike>()
                .HasOne(like => like.Location)
                .WithMany(location => location.Likes)
                .HasForeignKey(like => like.LocationId);

            builder.Entity<LocationLike>()
                .HasOne(like => like.User)
                .WithMany(user => user.LocationLikes)
                .HasForeignKey(like => like.UserId);

            builder.Entity<Bookmark>()
                .HasOne(bookmark => bookmark.Location)
                .WithMany(location => location.Bookmarks)
                .HasForeignKey(bookmark => bookmark.LocationId);

            builder.Entity<Bookmark>()
                .HasOne(bookmark => bookmark.User)
                .WithMany(user => user.Bookmarks)
                .HasForeignKey(bookmark => bookmark.UserId);

            builder.Entity<Comment>()
                .HasOne(comment => comment.Location)
                .WithMany(location => location.Comments)
                .HasForeignKey(comment => comment.LocationId);

            builder.Entity<Comment>()
                .HasOne(comment => comment.User)
                .WithMany(user => user.Comments)
                .HasForeignKey(comment => comment.UserId);
        }
    }
}