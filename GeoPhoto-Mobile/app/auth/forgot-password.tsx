
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
} from "react-native";
import { Link } from "expo-router";
import { useState } from "react";

const API_URL = "https://geophoto-production-581e.up.railway.app";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setMessage("");

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await res.json();

      setMessage(
        data.message || "Unable to request a password reset. Please try again."
      );
    } catch (error) {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

      <Text style={styles.description}>
        Enter your email address and we'll send you a password reset link
        if an account exists.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        editable={!isSubmitting}
      />

      <Button
        title={isSubmitting ? "Sending..." : "Send Reset Link"}
        onPress={handleSubmit}
        disabled={isSubmitting}
      />

      {!!message && (
        <Text style={styles.message}>{message}</Text>
      )}

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
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 40,
    includeFontPadding: true,
  },

  description: {
    color: "white",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
    color: "white",
  },

  message: {
    marginTop: 15,
    textAlign: "center",
    color: "#4CAF50",
  },

  link: {
    marginTop: 20,
    textAlign: "center",
    color: "white",
  },
});
