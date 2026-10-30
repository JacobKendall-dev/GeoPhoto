import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

const API_URL = "http://192.168.1.174:5198";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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
        body: JSON.stringify({ email, password }),
      });

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = Array.isArray(responseData)
          ? responseData.map((error) => error.description).filter(Boolean).join(" ")
          : responseData.message || responseData.title;

        setMessage(errorMessage || "Registration failed.");
        return;
      }

      // Some register endpoints return a token; others do not.
      let token = responseData.token;

      if (!token) {
        const loginRes = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginRes.json().catch(() => ({}));

        if (!loginRes.ok || !loginData.token) {
          setMessage("Account created! Please log in.");
          navigate("/login", { replace: true });
          return;
        }

        token = loginData.token;
      }

      // Updates localStorage AND the shared AuthContext state.
      await login(token);
      navigate("/", { replace: true });
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

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating Account..." : "Register"}
          </button>
        </form>

        {message && <p role="alert">{message}</p>}
        {passwordError && <p role="alert">{passwordError}</p>}

        <p className="login-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;