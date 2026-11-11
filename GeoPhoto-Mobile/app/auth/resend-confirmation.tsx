
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
} from "react-native";
import { Link } from "expo-router";

const API_URL = "https://geophoto-production-581e.up.railway.app";

export default function ResendConfirmation() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const resendConfirmation = async () => {
    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/resend-confirmation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Unable to resend the confirmation email."
        );
        return;
      }

      setMessage(
        data.message ||
          "If an unconfirmed account exists for that email, a confirmation email will be sent."
      );
    } catch {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resend Confirmation</Text>

      <Text style={styles.description}>
        Enter the email address associated with your account
        to request another confirmation email.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <Button
        title={loading ? "Sending..." : "Resend Confirmation"}
        onPress={resendConfirmation}
        disabled={loading}
      />

      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}

      <Link href="/auth/login" style={styles.link}>
        Back to Login
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 40,
    includeFontPadding: true,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  message: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 14,
    color: "#333",
  },
  link: {
    marginTop: 24,
    textAlign: "center",
    color: "#007AFF",
    fontSize: 16,
  },
});
