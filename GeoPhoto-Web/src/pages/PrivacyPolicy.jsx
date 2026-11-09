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
            Effective date: November 9, 2026
          </p>
        </section>

        <section className="privacy-section">
          <h2>1. Introduction</h2>
          <p>
            GeoPhoto is a location-based photo-sharing application.
            This Privacy Policy explains what information may be
            collected when you use GeoPhoto and how that information
            is used.
          </p>
          <p>
            By using GeoPhoto, you acknowledge that information
            shared through public location posts may be visible
            to other users and visitors.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. Information We Collect</h2>
          <p>Depending on how you use GeoPhoto, the application may collect:</p>

          <ul>
            <li>
              <strong>Account information:</strong> Email address,
              username, first name, last name, and password credentials.
            </li>
            <li>
              <strong>Profile information:</strong> Profile pictures
              and other information you choose to provide.
            </li>
            <li>
              <strong>Location posts:</strong> Uploaded photographs,
              descriptions, geographic coordinates, and post creation
              dates.
            </li>
            <li>
              <strong>Interactions:</strong> Likes, bookmarks, and
              comments associated with location posts.
            </li>
            <li>
              <strong>Authentication information:</strong> Information
              needed to authenticate your account and maintain your
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

          <p>
            Public location posts include:
          </p>

          <ul>
            <li>Uploaded photographs and their image URLs.</li>
            <li>Geographic latitude and longitude coordinates.</li>
            <li>Post descriptions and creation dates.</li>
            <li>The username and profile picture associated with the post.</li>
            <li>Publicly displayed like and comment counts.</li>
          </ul>

          <p>
            Comments are also publicly viewable. Bookmarks are
            associated with your account and are not included
            in the public location listing.
          </p>

          <p>
            Do not upload photographs or location information
            that you do not want publicly accessible. Avoid
            sharing sensitive locations, personal information,
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
            <li>Provide likes, bookmarks, and commenting features.</li>
            <li>Send account verification and password recovery emails.</li>
            <li>Maintain and improve the application's functionality.</li>
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
              mapping functionality.
              {" "}
              <a href="https://www.mapbox.com/legal/privacy">
                Mapbox Privacy Policy
              </a>
            </li>
            <li>
              <strong>Cloudinary:</strong> Stores and delivers
              uploaded photographs and profile pictures.
              {" "}
              <a href="https://cloudinary.com/privacy">
                Cloudinary Privacy Policy
              </a>
            </li>
            <li>
              <strong>Resend:</strong> Delivers account verification
              and password recovery emails.
              {" "}
              <a href="https://resend.com/legal/privacy-policy">
                Resend Privacy Policy
              </a>
            </li>
            <li>
              <strong>Railway:</strong> Hosts the GeoPhoto backend API.
              {" "}
              <a href="https://railway.com/legal/privacy">
                Railway Privacy Information
              </a>
            </li>
            <li>
              <strong>Neon:</strong> Provides PostgreSQL database
              hosting for application data.
              {" "}
              <a href="https://neon.com/privacy-policy">
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
            rather than being stored as plain-text passwords.
            However, no online service can guarantee absolute
            security.
          </p>
        </section>

        <section className="privacy-section">
          <h2>7. Data Retention and Account Requests</h2>
          <p>
            Information is retained as needed to operate the
            application and maintain its functionality.
          </p>
          <p>
            GeoPhoto does not currently provide a self-service
            account deletion feature. For questions about your
            account or requests concerning your information,
            contact the application developer using the contact
            information below.
          </p>
        </section>

        <section className="privacy-section">
          <h2>8. Children's Privacy</h2>
          <p>
            GeoPhoto is not designed specifically for children.
            Please do not use the application to share photographs
            or personal information about children without
            appropriate authorization.
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