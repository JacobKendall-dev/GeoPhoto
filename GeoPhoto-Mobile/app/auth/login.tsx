import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
} from "react-native";
import { Link } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "https://geophoto-production-581e.up.railway.app";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async () => {
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const responseData = await res.json();

      if (res.ok) {
        await login(responseData.token);
        setMessage("Log in successful!");
      } else {
        setMessage(
          responseData.message ||
          responseData.title ||
          "Login failed. Please try again."
        );
      }
    } catch (error) {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

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

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!isSubmitting}
      />

      <Button
        title={isSubmitting ? "Logging In..." : "Login"}
        onPress={handleSubmit}
        disabled={isSubmitting}
      />

      {!!message && (
        <Text style={styles.message}>{message}</Text>
      )}

      <Link href="/auth/forgot-password" style={styles.link}>
        Forgot Password?
      </Link>

      <Link href="/auth/resend-confirmation" style={styles.link}>
        Resend Confirmation Email
      </Link>

      <Link href="/auth/recover-registration" style={styles.link}>
        Change Email
      </Link>

      <Link href="/auth/register" style={styles.link}>
        Don't have an account? Register
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
    marginBottom: 30,
    lineHeight: 40,
    includeFontPadding: true,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
    color: "white",
  },

  link: {
    marginTop: 15,
    textAlign: "center",
    color: "white",
  },

  message: {
    marginTop: 15,
    textAlign: "center",
    color: "#4CAF50",
  },
});
