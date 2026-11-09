import { Link } from "react-router-dom";
import "./About.css";

function About() {
  return (
    <div className="info-page">
      <header className="info-header">
        <Link to="/" className="info-logo">
          GeoPhoto
        </Link>

        <Link to="/" className="info-back-link">
          Back to Map
        </Link>
      </header>

      <main className="info-content">
        <section className="info-hero">
          <h1>About GeoPhoto</h1>
          <p className="info-subtitle">
            Discover the world through photographs and the places
            they're connected to.
          </p>
        </section>

        <section className="info-section">
          <h2>What is GeoPhoto?</h2>
          <p>
            GeoPhoto is a location-based photo-sharing application
            that connects photographs with real-world locations.
            Users can explore a map, discover photographs shared
            by others, and contribute their own experiences.
          </p>
          <p>
            Rather than focusing on a traditional social media
            feed, GeoPhoto puts the map at the center of the
            experience.
          </p>
        </section>

        <section className="info-section">
          <h2>How it works</h2>
          <ul>
            <li>
              Explore a map to discover photographs associated
              with different locations.
            </li>
            <li>
              View photographs, descriptions, and information
              about where they were captured.
            </li>
            <li>
              Create an account to like, bookmark, and comment
              on location posts.
            </li>
            <li>
              Use the mobile application to capture and share
              photographs with geographic coordinates.
            </li>
          </ul>
        </section>

        <section className="info-section">
          <h2>Built with</h2>
          <p>
            GeoPhoto was developed using a combination of
            modern web, mobile, and backend technologies.
          </p>

          <div className="technology-list">
            <span>React</span>
            <span>React Native</span>
            <span>Expo</span>
            <span>ASP.NET Core</span>
            <span>C#</span>
            <span>PostgreSQL</span>
            <span>Entity Framework Core</span>
            <span>Mapbox</span>
            <span>Cloudinary</span>
          </div>
        </section>

        <section className="info-section">
          <h2>Privacy by design</h2>
          <p>
            GeoPhoto is designed for public photo sharing.
            Location posts and their geographic coordinates
            are visible to anyone browsing the application,
            including visitors without an account.
          </p>
          <p>
            Users should only share photographs and location
            information they are comfortable making public.
          </p>
          <Link to="/privacy" className="info-inline-link">
            Read our Privacy Policy
          </Link>
        </section>
      </main>

      <footer className="info-footer">
        <span>GeoPhoto</span>
        <div>
          <Link to="/">Home</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}

export default About;