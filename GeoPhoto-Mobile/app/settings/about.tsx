
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function About() {
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
            About GeoPhoto
          </ThemedText>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <ThemedText type="title" style={styles.appTitle}>
            GeoPhoto
          </ThemedText>

          <ThemedText style={styles.intro}>
            Discover the world through photos tied to real locations.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            What is GeoPhoto?
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            GeoPhoto is a location-based photo-sharing application
            that lets people share photographs connected to specific
            places. Instead of browsing a traditional photo feed,
            users can explore a map and discover photos from locations
            around the world.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Explore and Share
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Browse photos by exploring map locations, view the
            experiences others have shared, and interact with posts
            through likes and comments. You can also bookmark
            locations to revisit them later.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            The mobile application lets users capture photos and
            associate them with their current GPS coordinates,
            creating new locations for others to discover.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Built With
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            GeoPhoto was developed using modern web and mobile
            technologies, including:
          </ThemedText>

          <View style={styles.list}>
            <ThemedText style={styles.listItem}>
              • React and React Native with Expo
            </ThemedText>
            <ThemedText style={styles.listItem}>
              • ASP.NET Core and C#
            </ThemedText>
            <ThemedText style={styles.listItem}>
              • PostgreSQL and Entity Framework Core
            </ThemedText>
            <ThemedText style={styles.listItem}>
              • Mapbox for interactive maps
            </ThemedText>
            <ThemedText style={styles.listItem}>
              • Cloudinary for image hosting
            </ThemedText>
          </View>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Important Privacy Information
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Photos shared on GeoPhoto are publicly visible and are
            associated with geographic coordinates. Only share
            photographs and locations that you are comfortable
            making public.
          </ThemedText>

          <ThemedText style={styles.footer}>
            GeoPhoto
          </ThemedText>
        </ScrollView>
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

  content: {
    paddingBottom: 35,
  },

  appTitle: {
    marginTop: 15,
    marginBottom: 8,
  },

  intro: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
  },

  paragraph: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 12,
  },

  list: {
    marginLeft: 5,
    marginTop: 4,
  },

  listItem: {
    fontSize: 15,
    lineHeight: 27,
  },

  footer: {
    marginTop: 30,
    textAlign: "center",
    opacity: 0.6,
  },
});
