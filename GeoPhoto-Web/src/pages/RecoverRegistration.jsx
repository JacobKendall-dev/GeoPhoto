import { useState } from "react";
import { Link } from "react-router-dom";
import "./RecoverRegistration.css";

const API_URL = "https://geophoto-production-581e.up.railway.app";

function RecoverRegistration() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/recover-registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          newEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to recover your registration.");
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
    <div className="recover-registration-page">
      <div className="recover-registration-card">
        <h1>Recover Registration</h1>

        <p>
          Enter the username and password you originally registered with,
          along with your correct email address.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your original password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <label htmlFor="newEmail">Correct Email Address</label>
          <input
            type="email"
            id="newEmail"
            placeholder="Enter your correct email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Recovering..." : "Update Email Address"}
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

export default RecoverRegistration;