
import { Link } from "react-router-dom";
import "./PrivacyPolicy.css";

function PrivacyPolicy() {
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
          <h1>Privacy Policy</h1>
          <p className="info-subtitle">
            How GeoPhoto collects, uses, and shares information.
          </p>
          <p className="privacy-effective-date">
            Effective date: November 10, 2026
          </p>
        </section>

        <section className="privacy-section">
          <h2>1. Introduction</h2>
          <p>
            GeoPhoto is a location-based photo-sharing application.
            This Privacy Policy explains what information may be
            collected when you use GeoPhoto, how that information
            is used, and how it may be shared.
          </p>
          <p>
            By using GeoPhoto, you acknowledge that information
            shared through public location posts may be visible
            to other users and visitors.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. Information We Collect</h2>
          <p>
            Depending on how you use GeoPhoto, the application
            may collect or process the following information:
          </p>

          <ul>
            <li>
              <strong>Account information:</strong> Email address,
              username, first name, and last name.
            </li>
            <li>
              <strong>Password credentials:</strong> Passwords are
              processed through ASP.NET Core Identity and stored
              as securely hashed credentials rather than plain text.
            </li>
            <li>
              <strong>Profile information:</strong> Profile pictures
              and other information you choose to provide.
            </li>
            <li>
              <strong>Location posts:</strong> Uploaded photographs,
              descriptions, geographic coordinates, and post
              creation dates.
            </li>
            <li>
              <strong>Location information:</strong> Geographic
              coordinates accessed through your device when you
              use features that require your location, such as
              creating location posts or exploring nearby locations.
            </li>
            <li>
              <strong>Interactions:</strong> Likes, bookmarks, and
              comments associated with location posts.
            </li>
            <li>
              <strong>Authentication information:</strong> Authentication
              tokens and information needed to maintain your
              signed-in session.
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. Public Location and Photo Sharing</h2>
          <p>
            GeoPhoto is designed around public photo and location
            sharing. Location posts are publicly accessible and
            may be viewed without creating an account.
          </p>

          <p>Public location posts may include:</p>

          <ul>
            <li>Uploaded photographs and their associated image URLs.</li>
            <li>Geographic latitude and longitude coordinates.</li>
            <li>Post descriptions and creation dates.</li>
            <li>The username and profile picture associated with the post.</li>
            <li>Publicly displayed like and comment counts.</li>
          </ul>

          <p>
            Comments are publicly viewable and may be associated
            with your username and profile information.
            Bookmarks are associated with your account and are
            not included in public location listings.
          </p>

          <p>
            Location information may reveal where a photograph
            was taken. Do not upload photographs or location
            information that you do not want publicly accessible.
            Avoid sharing sensitive locations, personal information,
            or images containing information you wish to keep private.
          </p>
        </section>

        <section className="privacy-section">
          <h2>4. How We Use Information</h2>
          <p>Information collected through GeoPhoto is used to:</p>

          <ul>
            <li>Create and manage user accounts.</li>
            <li>Authenticate users and protect account access.</li>
            <li>Display photographs and their associated locations.</li>
            <li>Provide location-based exploration and mapping features.</li>
            <li>Provide likes, bookmarks, and commenting features.</li>
            <li>Send account verification and password recovery emails.</li>
            <li>Maintain, secure, and improve the application's functionality.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>5. Third-Party Services</h2>
          <p>
            GeoPhoto relies on third-party services to operate.
            Information may be processed by these providers as
            necessary to provide their respective services.
          </p>

          <ul>
            <li>
              <strong>Mapbox:</strong> Provides map rendering and
              mapping functionality. Location and map-related
              information may be processed as necessary to provide
              these services.
              <p>
                Mapbox's mobile SDK also collects and sends de-identified
                location and usage telemetry by default to help improve its
                mapping services. Users can opt out at any time through the
                Mapbox attribution menu on the map by selecting "Mapbox
                Telemetry" and choosing "Stop Participating." This telemetry
                is separate from the precise GPS coordinates GeoPhoto
                collects for location posts.
              </p>
              {" "}
              <a href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noopener noreferrer">
                Mapbox Privacy Policy
              </a>
            </li>
            <li>
              <strong>Cloudinary:</strong> Stores and delivers
              uploaded location photographs and profile pictures.
              {" "}
              <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer">
                Cloudinary Privacy Policy
              </a>
            </li>
            <li>
              <strong>Resend:</strong> Delivers account verification
              and password recovery emails.
              {" "}
              <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                Resend Privacy Policy
              </a>
            </li>
            <li>
              <strong>Railway:</strong> Hosts the GeoPhoto backend
              API and processes application requests.
              {" "}
              <a href="https://railway.com/legal/privacy" target="_blank" rel="noopener noreferrer">
                Railway Privacy Information
              </a>
            </li>
            <li>
              <strong>Neon:</strong> Provides PostgreSQL database
              hosting for application account and location data.
              {" "}
              <a href="https://neon.com/privacy-policy" target="_blank" rel="noopener noreferrer">
                Neon Privacy Policy
              </a>
            </li>
          </ul>

          <p>
            These services have their own privacy practices and
            policies. Their processing of information is subject
            to their respective terms and policies.
          </p>
        </section>

        <section className="privacy-section">
          <h2>6. Account Security</h2>
          <p>
            GeoPhoto uses authentication and authorization
            mechanisms to protect account access and restrict
            account-specific actions.
          </p>
          <p>
            Passwords are handled through ASP.NET Core Identity
            and stored as hashed credentials rather than
            plain-text passwords. Authentication tokens are
            used to maintain signed-in sessions.
          </p>
          <p>
            Although reasonable measures are used to protect
            account information, no online service can guarantee
            absolute security.
          </p>
        </section>

        <section className="privacy-section">
          <h2>7. Data Retention and Account Deletion</h2>
          <p>
            Information is retained as needed to operate the
            application and provide its features.
          </p>
          <p>
            Users can permanently delete their accounts through
            the Account Information section of the GeoPhoto
            mobile application. Account deletion requires
            confirmation using the account's current password.
          </p>
          <p>
            When an account is deleted, GeoPhoto deletes the
            associated account information, location posts,
            uploaded location photographs, profile picture,
            comments, likes, and bookmarks.
          </p>
          <p>
            Uploaded photographs and profile pictures stored
            through Cloudinary are also submitted for deletion.
          </p>
          <p>
            Account deletion is permanent and cannot be reversed.
            Once an account has been deleted, the user will no
            longer be able to access it or its associated content.
          </p>
          <p>
            For questions about account deletion or personal
            information, contact the GeoPhoto developer using
            the contact information below.
          </p>
        </section>

        <section className="privacy-section">
          <h2>8. Children's Privacy</h2>
          <p>
            GeoPhoto is not specifically designed for children.
            We do not knowingly collect personal information
            from children in violation of applicable privacy laws.
            If you believe a child has provided personal information
            through GeoPhoto, please contact the developer.
          </p>
        </section>

        <section className="privacy-section">
          <h2>9. Changes to This Policy</h2>
          <p>
            This Privacy Policy may be updated as GeoPhoto
            develops. Any changes will be reflected on this page
            along with an updated effective date.
          </p>
        </section>

        <section className="privacy-section">
          <h2>10. Contact</h2>
          <p>
            If you have questions about this Privacy Policy or
            how information is handled by GeoPhoto, contact:
          </p>

          <p className="privacy-contact">
            <strong>GeoPhoto Developer:</strong>{" "}
            Jacob.jkendall@gmail.com
          </p>
        </section>
      </main>

      <footer className="info-footer">
        <span>GeoPhoto</span>
        <div>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </div>
      </footer>
    </div>
  );
}

export default PrivacyPolicy;
