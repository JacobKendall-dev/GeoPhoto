
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";

const API_URL = "https://geophoto-production-581e.up.railway.app";

export default function AccountInformation() {
  const { colors } = useTheme();
  const { authenticatedRequest, logout } = useAuth();

  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");

  const [firstName, setFirstName] = useState("");
  const [newFirstName, setNewFirstName] = useState("");

  const [lastName, setLastName] = useState("");
  const [newLastName, setNewLastName] = useState("");

  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);

  const [savingUsername, setSavingUsername] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        Alert.alert("Error", "You are not logged in.");
        router.back();
        return;
      }

      const response = await authenticatedRequest(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();

      setUsername(data.username ?? "");
      setNewUsername(data.username ?? "");

      setFirstName(data.firstName ?? "");
      setNewFirstName(data.firstName ?? "");

      setLastName(data.lastName ?? "");
      setNewLastName(data.lastName ?? "");

      setEmail(data.email ?? "");
      setNewEmail(data.email ?? "");
    } catch {
      Alert.alert(
        "Error",
        "Unable to load your account information."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (
    updates: {
      username?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      currentPassword?: string;
      newPassword?: string;
    },
    setSaving: (value: boolean) => void,
    onSuccess: () => void
  ) => {
    try {
      setSaving(true);

      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        Alert.alert("Error", "You are not logged in.");
        return;
      }

      const response = await authenticatedRequest(`${API_URL}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Unable to save",
          data.message ?? "Something went wrong."
        );
        return;
      }

      onSuccess();

      Alert.alert(
        "Saved",
        "Your account information has been updated."
      );
    } catch {
      Alert.alert(
        "Error",
        "Unable to connect to the server."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveUsername = () => {
    const trimmedUsername = newUsername.trim();

    if (!trimmedUsername) {
      Alert.alert("Error", "Username cannot be empty.");
      return;
    }

    if (trimmedUsername === username) {
      return;
    }

    updateAccount(
      {
        username: trimmedUsername,
      },
      setSavingUsername,
      () => {
        setUsername(trimmedUsername);
        setNewUsername(trimmedUsername);
      }
    );
  };

  const saveName = () => {
    const trimmedFirstName = newFirstName.trim();
    const trimmedLastName = newLastName.trim();

    updateAccount(
      {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      },
      setSavingName,
      () => {
        setFirstName(trimmedFirstName);
        setLastName(trimmedLastName);
        setNewFirstName(trimmedFirstName);
        setNewLastName(trimmedLastName);
      }
    );
  };

  const saveEmail = () => {
    const trimmedEmail = newEmail.trim();

    if (!trimmedEmail) {
      Alert.alert("Error", "Email cannot be empty.");
      return;
    }

    if (trimmedEmail === email) {
      return;
    }

    updateAccount(
      {
        email: trimmedEmail,
      },
      setSavingEmail,
      () => {
        setEmail(trimmedEmail);
        setNewEmail(trimmedEmail);
      }
    );
  };

  const savePassword = () => {
    if (!currentPassword) {
      Alert.alert(
        "Error",
        "Enter your current password."
      );
      return;
    }

    if (!newPassword) {
      Alert.alert(
        "Error",
        "Enter a new password."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Error",
        "New passwords do not match."
      );
      return;
    }

    updateAccount(
      {
        currentPassword,
        newPassword,
      },
      setSavingPassword,
      () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your GeoPhoto account? This will remove your profile, locations, photos, comments, likes, and bookmarks. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          style: "destructive",
          onPress: requestDeleteConfirmation,
        },
      ]
    );
  };

  const requestDeleteConfirmation = () => {
    Alert.prompt(
      "Confirm Account Deletion",
      "Enter your current password to continue.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          style: "destructive",
          onPress: (password?: string) => {
            if (!password?.trim()) {
              Alert.alert(
                "Error",
                "Your current password is required."
              );
              return;
            }

            Alert.alert(
              "Final Confirmation",
              "Your account and associated data will be permanently deleted. Are you absolutely sure?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete Permanently",
                  style: "destructive",
                  onPress: () => deleteAccount(password),
                },
              ]
            );
          },
        },
      ],
      "secure-text"
    );
  };

  const deleteAccount = async (password: string) => {
    try {
      setDeletingAccount(true);

      const response = await authenticatedRequest(`${API_URL}/me`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        Alert.alert(
          "Unable to Delete Account",
          data?.message ?? "Something went wrong. Please try again."
        );
        return;
      }

      await logout();

      Alert.alert(
        "Account Deleted",
        "Your GeoPhoto account has been successfully deleted.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/auth/login"),
          },
        ]
      );
    } catch {
      Alert.alert(
        "Error",
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      color: colors.text,
    },
  ];

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.fullScreen,
          { backgroundColor: colors.background },
        ]}
        edges={["top"]}
      >
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.fullScreen,
        { backgroundColor: "#151718" },
      ]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={styles.fullScreen}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ThemedText style={styles.backText}>
                ‹
              </ThemedText>
            </Pressable>

            <ThemedText type="title">
              Account Information
            </ThemedText>
          </ThemedView>

          {/* Username */}

          <ThemedView style={styles.section}>
            <ThemedText style={styles.currentInfo}>
              Username: {username}
            </ThemedText>

            <TextInput
              value={newUsername}
              onChangeText={setNewUsername}
              style={inputStyle}
              placeholder="New username"
              placeholderTextColor={colors.text + "80"}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable
              onPress={saveUsername}
              disabled={savingUsername}
              style={[
                styles.saveButton,
                {
                  opacity: savingUsername ? 0.6 : 1,
                },
              ]}
            >
              {savingUsername ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.saveText}>
                  Save Username
                </ThemedText>
              )}
            </Pressable>
          </ThemedView>

          {/* Name */}

          <ThemedView style={styles.section}>
            <ThemedText style={styles.currentInfo}>
              Name: {firstName} {lastName}
            </ThemedText>

            <ThemedView style={styles.nameRow}>
              <TextInput
                value={newFirstName}
                onChangeText={setNewFirstName}
                style={[inputStyle, styles.nameInput]}
                placeholder="First name"
                placeholderTextColor={colors.text + "80"}
              />

              <TextInput
                value={newLastName}
                onChangeText={setNewLastName}
                style={[inputStyle, styles.nameInput]}
                placeholder="Last name"
                placeholderTextColor={colors.text + "80"}
              />
            </ThemedView>

            <Pressable
              onPress={saveName}
              disabled={savingName}
              style={[
                styles.saveButton,
                {
                  opacity: savingName ? 0.6 : 1,
                },
              ]}
            >
              {savingName ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.saveText}>
                  Save Name
                </ThemedText>
              )}
            </Pressable>
          </ThemedView>

          {/* Email */}

          <ThemedView style={styles.section}>
            <ThemedText style={styles.currentInfo}>
              Email: {email}
            </ThemedText>

            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              style={inputStyle}
              placeholder="New email"
              placeholderTextColor={colors.text + "80"}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable
              onPress={saveEmail}
              disabled={savingEmail}
              style={[
                styles.saveButton,
                {
                  opacity: savingEmail ? 0.6 : 1,
                },
              ]}
            >
              {savingEmail ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.saveText}>
                  Save Email
                </ThemedText>
              )}
            </Pressable>
          </ThemedView>

          {/* Password */}

          <ThemedView style={styles.section}>
            <ThemedText style={styles.currentInfo}>
              Password
            </ThemedText>

            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              style={inputStyle}
              placeholder="Current password"
              placeholderTextColor={colors.text + "80"}
              secureTextEntry
            />

            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              style={inputStyle}
              placeholder="New password"
              placeholderTextColor={colors.text + "80"}
              secureTextEntry
            />

            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={inputStyle}
              placeholder="Confirm new password"
              placeholderTextColor={colors.text + "80"}
              secureTextEntry
            />

            <Pressable
              onPress={savePassword}
              disabled={savingPassword}
              style={[
                styles.saveButton,
                {
                  opacity: savingPassword ? 0.6 : 1,
                },
              ]}
            >
              {savingPassword ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.saveText}>
                  Save Password
                </ThemedText>
              )}
            </Pressable>
          </ThemedView>

          {/* Account deletion */}

          <View style={styles.dangerSection}>
            <View style={styles.divider} />

            <ThemedText style={styles.dangerTitle}>
              Delete Account
            </ThemedText>

            <ThemedText style={styles.dangerDescription}>
              Permanently delete your account and all associated
              locations, photos, comments, likes, and bookmarks.
              This action cannot be undone.
            </ThemedText>

            <Pressable
              onPress={confirmDeleteAccount}
              disabled={deletingAccount}
              style={[
                styles.deleteButton,
                {
                  opacity: deletingAccount ? 0.6 : 1,
                },
              ]}
            >
              {deletingAccount ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.deleteText}>
                  Delete Account
                </ThemedText>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },

  container: {
    padding: 20,
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginRight: 8,
  },

  backText: {
    fontSize: 40,
    lineHeight: 40,
  },

  section: {
    marginBottom: 30,
  },

  currentInfo: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 10,
  },

  saveButton: {
    backgroundColor: "teal",
    height: 44,
    borderRadius: 4,
    alignSelf: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
    marginTop: 2,
  },

  saveText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  nameRow: {
    flexDirection: "row",
    gap: 10,
  },

  nameInput: {
    flex: 1,
  },

  dangerSection: {
    marginTop: 5,
    marginBottom: 20,
  },

  divider: {
    height: 1,
    backgroundColor: "#555",
    marginBottom: 25,
  },

  dangerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ff5555",
    marginBottom: 10,
  },

  dangerDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#cccccc",
    marginBottom: 18,
  },

  deleteButton: {
    backgroundColor: "#c62828",
    height: 46,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});
