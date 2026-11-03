import { View, Text, TextInput, Button, StyleSheet, Keyboard, TouchableWithoutFeedback } from "react-native";
import { Link } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import * as SecureStore from "expo-secure-store";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const API_URL = "https://geophoto-production-581e.up.railway.app";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const { login } = useAuth();



const handleSubmit = async () => {
    Keyboard.dismiss();

    if (password === confirmPassword) {
        setPasswordError("");

        const registerRes = await fetch(
            `${API_URL}/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    firstName: firstName,
                    lastName: lastName,
                    username: username,
                })
            }
        );

        const registerData = await registerRes.json();

        if (registerRes.ok) {

            const loginRes = await fetch(
                `${API_URL}/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                    })
                }
            );

            const loginData = await loginRes.json();

            if (loginRes.ok) {
                await login(loginData.token);
            } else {
                console.log(loginData.message);
            }

        } else {
            setMessage(registerData[0].description);
        }

    } else {
        setPasswordError("Passwords don't match!");
    }
};

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Create Account</ThemedText>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
        <ThemedView style={styles.nameRow}>
        <TextInput
            style={styles.nameInput}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
        />

        <TextInput
            style={styles.nameInput}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
        />
        </ThemedView>

      <Button title="Register" onPress={handleSubmit}/>

      <ThemedText>{message}</ThemedText>
      <ThemedText>{passwordError}</ThemedText>

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
});

