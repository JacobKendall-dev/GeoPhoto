
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";

export default function Settings() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.fullScreen} edges={["top"]}>
      <ThemedView style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons
              name="arrow-back"
              size={26}
              color="gray"
            />
          </Pressable>

          <ThemedText type="title">
            Settings
          </ThemedText>

          <View style={styles.headerSpacer} />
        </View>

        {/* Account */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Account
        </ThemedText>

        <Pressable
          onPress={() => router.push("/settings/account")}
          style={styles.settingRow}
        >
          <ThemedText type="default">
            Account Information
          </ThemedText>

          <MaterialIcons
            name="chevron-right"
            size={24}
            color="gray"
          />
        </Pressable>

        <Pressable
          onPress={() => router.push("/settings/privacy-policy")}
          style={styles.settingRow}
        >
          <ThemedText type="default">
            Privacy & Security
          </ThemedText>

          <MaterialIcons
            name="chevron-right"
            size={24}
            color="gray"
          />
        </Pressable>

        {/* About */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          About
        </ThemedText>

        <Pressable
          onPress={() => router.push("/settings/about")}
          style={styles.settingRow}
        >
          <ThemedText type="default">
            About GeoPhoto
          </ThemedText>

          <MaterialIcons
            name="chevron-right"
            size={24}
            color="gray"
          />
        </Pressable>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <Pressable
            onPress={handleLogout}
            style={styles.button}
          >
            <ThemedText type="defaultSemiBold">
              Logout
            </ThemedText>
          </Pressable>
        </View>

      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  headerSpacer: {
    width: 44,
  },

  sectionTitle: {
    marginTop: 25,
    marginBottom: 8,
  },

  settingRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },

  logoutContainer: {
    marginTop: "auto",
    paddingTop: 30,
    paddingBottom: 20,
  },

  button: {
    height: 50,
    borderRadius: 10,
    backgroundColor: "#f27a7a",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
