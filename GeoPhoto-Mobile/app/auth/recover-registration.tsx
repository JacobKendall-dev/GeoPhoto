
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

export default function RecoverRegistration() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const recoverRegistration = async () => {
    if (!username.trim() || !password || !newEmail.trim()) {
      setMessage("Please complete all fields.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/recover-registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
            newEmail: newEmail.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(
          data.message ||
            data.detail ||
            data.title ||
            "Unable to recover your registration. Please try again."
        );
        return;
      }

      setMessage(
        data.message ||
          "If the account can be recovered, a confirmation email will be sent to the new address."
      );
    } catch {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recover Registration</Text>

      <Text style={styles.description}>
        If you registered with an incorrect email address,
        enter your original username and password along
        with the correct email address.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoComplete="username"
      />

      <TextInput
        style={styles.input}
        placeholder="Original Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
      />

      <TextInput
        style={styles.input}
        placeholder="New Email Address"
        placeholderTextColor="#888"
        value={newEmail}
        onChangeText={setNewEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <Button
        title={loading ? "Recovering..." : "Recover Registration"}
        onPress={recoverRegistration}
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
