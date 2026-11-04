import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./ResetPassword.css";

const API_URL = "https://geophoto-production-581e.up.railway.app";

function ResetPassword() {
  const [searchParams] = useSearchParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const userId = searchParams.get("userId");
    const token = searchParams.get("token");

    if (!userId || !token) {
      setMessage("This password reset link is invalid or incomplete.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to reset your password.");
        return;
      }

      setResetComplete(true);
      setMessage(data.message);
    } catch (error) {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">
        <h1>Reset Password</h1>

        {!resetComplete ? (
          <>
            <p>Enter your new password below.</p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="newPassword">New Password</label>

              <input
                type="password"
                id="newPassword"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />

              <label htmlFor="confirmPassword">Confirm New Password</label>

              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />

              <button type="submit" disabled={submitting}>
                {submitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        ) : null}

        {message && <p role="status">{message}</p>}

        {resetComplete && (
          <Link to="/login" className="reset-password-button">
            Go to Login
          </Link>
        )}

        {!resetComplete && (
          <p>
            <Link to="/login">Back to Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;