import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../context/AuthContext";

const API_URL = "https://geophoto-production-581e.up.railway.app";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const { login } = useAuth();


    const handleSubmit = async () => {

        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password,
            })
        });

        const responseData = await res.json();

        if (res.ok) {
            await login(responseData.token);
            setMessage("Log in Successful!");
        } else {
            setMessage(responseData.message);
        }
    
    }

    // useEffect (() => {
    //     const storedToken = await SecureStore.getItemAsync("token");
    //     if(storedToken) {
            
    //     }
    // }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

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

      <Button title="Login" onPress={handleSubmit}/>

        <Text style={styles.link}>{message}</Text>
      <Link href="../auth/register" style={styles.link}>
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
    color: "blue",
  },
});

