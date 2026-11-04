import { useState } from "react";
import { Link } from "react-router-dom";
import "./ForgotPassword.css";

const API_URL = "https://geophoto-production-581e.up.railway.app";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to request a password reset.");
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
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <h1>Forgot Password?</h1>

        <p>
          Enter the email address associated with your GeoPhoto account.
          If an account exists, we'll send you a password reset link.
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
            {submitting ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;