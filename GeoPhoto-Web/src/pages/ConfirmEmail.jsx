
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./ConfirmEmail.css";

const API_URL = "https://geophoto-production-581e.up.railway.app";

function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Confirming your email address...");

  useEffect(() => {
    const confirmEmail = async () => {
      const userId = searchParams.get("userId");
      const token = searchParams.get("token");

      if (!userId || !token) {
        setStatus("error");
        setMessage("This confirmation link is invalid or incomplete.");
        return;
      }

      try {
        const query = new URLSearchParams({ userId, token });

        const response = await fetch(
          `${API_URL}/confirm-email?${query.toString()}`
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setStatus("error");
          setMessage(data.message || "Email confirmation failed.");
          return;
        }

        setStatus("success");
        setMessage(data.message || "Your email has been confirmed!");
      } catch (error) {
        console.error("Email confirmation error:", error);
        setStatus("error");
        setMessage("Unable to connect to the server. Please try again.");
      }
    };

    confirmEmail();
  }, [searchParams]);

  return (
    <div className="confirm-email-page">
      <div className="confirm-email-card">
        <h1>
          {status === "loading"
            ? "Confirming Email"
            : status === "success"
              ? "Email Confirmed!"
              : "Confirmation Failed"}
        </h1>

        <p role="status">{message}</p>

        {status === "success" && (
          <Link to="/login" className="confirm-email-button">
            Go to Login
          </Link>
        )}

        {status === "error" && (
          <Link to="/register" className="confirm-email-button">
            Back to Registration
          </Link>
        )}
      </div>
    </div>
  );
}

export default ConfirmEmail;
