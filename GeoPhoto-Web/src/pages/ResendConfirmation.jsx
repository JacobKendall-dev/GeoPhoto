import { useState } from "react";
import { Link } from "react-router-dom";
import "./ResendConfirmation.css";

const API_URL = "https://geophoto-production-581e.up.railway.app";

function ResendConfirmation() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/resend-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to request a confirmation email.");
        return;
      }

      setMessage(data.message);
    } catch (error) {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="resend-confirmation-page">
      <div className="resend-confirmation-card">
        <h1>Resend Confirmation</h1>

        <p>
          Enter the email address you used to register. If an unconfirmed
          account exists, we'll send you another confirmation link.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>

          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Resend Confirmation Email"}
          </button>
        </form>

        {message && <p role="status">{message}</p>}

        <p>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResendConfirmation;