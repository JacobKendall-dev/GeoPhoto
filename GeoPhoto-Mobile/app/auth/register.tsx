
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const API_URL = "https://geophoto-production-581e.up.railway.app";

export default function Register() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [message, setMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();

    setMessage("");
    setPasswordError("");

    if (
      !email.trim() ||
      !password ||
      !confirmPassword ||
      !username.trim() ||
      !firstName.trim() ||
      !lastName.trim()
    ) {
      setMessage("Please complete all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match!");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);

      const registerRes = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
        }),
      });

      const registerData = await registerRes.json();

      if (registerRes.ok) {
        setRegistrationComplete(true);
        setMessage(
          "Your account has been created! Please check your email and follow the confirmation link before logging in."
        );
      } else {
        const errorMessage = Array.isArray(registerData)
          ? registerData.map((error: any) => error.description).filter(Boolean).join("\n")
          : registerData.message || registerData.title || "Registration failed. Please try again.";

        setMessage(errorMessage);
      }
    } catch (error) {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={styles.container}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!registrationComplete && !isSubmitting}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!registrationComplete && !isSubmitting}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!registrationComplete && !isSubmitting}
        />

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          editable={!registrationComplete && !isSubmitting}
        />

        <View style={styles.nameRow}>
          <TextInput
            style={styles.nameInput}
            placeholder="First Name"
            placeholderTextColor="#999"
            value={firstName}
            onChangeText={setFirstName}
            editable={!registrationComplete && !isSubmitting}
          />

          <TextInput
            style={styles.nameInput}
            placeholder="Last Name"
            placeholderTextColor="#999"
            value={lastName}
            onChangeText={setLastName}
            editable={!registrationComplete && !isSubmitting}
          />
        </View>

        {!registrationComplete && (
          <Button
            title={isSubmitting ? "Creating Account..." : "Register"}
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
        )}

        {!!message && (
          <Text style={styles.message}>{message}</Text>
        )}

        {!!passwordError && (
          <Text style={styles.error}>{passwordError}</Text>
        )}

        {registrationComplete && (
          <Button
            title="Return to Login"
            onPress={() => router.replace("/auth/login")}
          />
        )}

        <Link href="../auth/login" style={styles.link}>
          Already have an account? Login
        </Link>
      </ThemedView>
    </TouchableWithoutFeedback>
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
    color: "#ECEDEE"
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
    marginTop: 20,
    textAlign: "center",
    color: "white",
  },

  nameRow: {
    flexDirection: "row",
    gap: 10,
  },

  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
    color: "white",
  },

  message: {
    marginTop: 15,
    marginBottom: 10,
    textAlign: "center",
    color: "#4CAF50",
  },

  error: {
    marginTop: 10,
    textAlign: "center",
    color: "#ff5555",
  },
});
