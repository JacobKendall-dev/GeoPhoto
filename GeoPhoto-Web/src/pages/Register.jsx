
import { useState } from "react";
import { Link } from "react-router-dom";
import "./Register.css";

const API_URL = "https://geophoto-production-581e.up.railway.app";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setPasswordError("");

    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match!");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          username,
          firstName,
          lastName,
        }),
      });

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = Array.isArray(responseData)
          ? responseData.map((error) => error.description).filter(Boolean).join(" ")
          : responseData.message || responseData.title;

        setMessage(errorMessage || "Registration failed.");
        return;
      }

      setRegistrationComplete(true);
      setMessage(
        "Your account has been created! Please check your email and click the confirmation link before logging in."
      );
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>Create an Account</h1>

        {registrationComplete ? (
          <>
            <p role="status">{message}</p>
            <p className="login-link">
              Already confirmed? <Link to="/login">Log in</Link>
            </p>
          </>
        ) : (
          <>
            <p>Register to start adding locations to the map.</p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                autoComplete="new-password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                autoComplete="new-password"
                required
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />

              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                autoComplete="username"
                required
                placeholder="Choose a username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />

              <div className="register-name-row">
                <div className="register-name-field">
                  <label htmlFor="first-name">First Name</label>
                  <input
                    type="text"
                    id="first-name"
                    autoComplete="given-name"
                    required
                    placeholder="First name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                </div>

                <div className="register-name-field">
                  <label htmlFor="last-name">Last Name</label>
                  <input
                    type="text"
                    id="last-name"
                    autoComplete="family-name"
                    required
                    placeholder="Last name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </div>
              </div>

              <button type="submit" disabled={submitting}>
                {submitting ? "Creating Account..." : "Register"}
              </button>
            </form>

            {message && <p role="alert">{message}</p>}
            {passwordError && <p role="alert">{passwordError}</p>}

            <p className="login-link">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Register;
