
import {
  Linking,
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

export default function PrivacyPolicy() {
  const openExternalLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // The link could not be opened.
    }
  };

  const renderExternalLink = (label: string, url: string) => (
    <Pressable onPress={() => openExternalLink(url)}>
      <ThemedText style={styles.link}>
        {label}
      </ThemedText>
    </Pressable>
  );

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
            Privacy Policy
          </ThemedText>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <ThemedText style={styles.effectiveDate}>
            Effective date: November 10, 2026
          </ThemedText>

          {/* 1. Introduction */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            1. Introduction
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            GeoPhoto is a location-based photo-sharing application.
            This Privacy Policy explains what information may be
            collected when you use GeoPhoto, how that information
            is used, and how it may be shared.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            By using GeoPhoto, you acknowledge that information
            shared through public location posts may be visible
            to other users and visitors.
          </ThemedText>

          {/* 2. Information We Collect */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            2. Information We Collect
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Depending on how you use GeoPhoto, the application
            may collect or process the following information:
          </ThemedText>

          <View style={styles.list}>
            <ThemedText style={styles.listItem}>
              • Account information: Email address, username,
              first name, and last name.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Password credentials: Passwords are processed
              through ASP.NET Core Identity and stored as
              securely hashed credentials rather than plain text.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Profile information: Profile pictures and other
              information you choose to provide.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Location posts: Uploaded photographs,
              descriptions, geographic coordinates, and post
              creation dates.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Location information: Geographic coordinates
              accessed through your device when you use features
              that require your location, such as creating
              location posts or exploring nearby locations.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Interactions: Likes, bookmarks, and comments
              associated with location posts.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Authentication information: Authentication
              tokens and information needed to maintain your
              signed-in session.
            </ThemedText>
          </View>

          {/* 3. Public Location and Photo Sharing */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            3. Public Location and Photo Sharing
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            GeoPhoto is designed around public photo and location
            sharing. Location posts are publicly accessible and
            may be viewed without creating an account.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Public location posts may include:
          </ThemedText>

          <View style={styles.list}>
            <ThemedText style={styles.listItem}>
              • Uploaded photographs and their associated image URLs.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Geographic latitude and longitude coordinates.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Post descriptions and creation dates.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • The username and profile picture associated
              with the post.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Publicly displayed like and comment counts.
            </ThemedText>
          </View>

          <ThemedText style={styles.paragraph}>
            Comments are publicly viewable and may be associated
            with your username and profile information.
            Bookmarks are associated with your account and are
            not included in public location listings.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Location information may reveal where a photograph
            was taken. Do not upload photographs or location
            information that you do not want publicly accessible.
            Avoid sharing sensitive locations, personal information,
            or images containing information you wish to keep private.
          </ThemedText>

          {/* 4. How We Use Information */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            4. How We Use Information
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Information collected through GeoPhoto is used to:
          </ThemedText>

          <View style={styles.list}>
            <ThemedText style={styles.listItem}>
              • Create and manage user accounts.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Authenticate users and protect account access.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Display photographs and their associated locations.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Provide location-based exploration and mapping features.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Provide likes, bookmarks, and commenting features.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Send account verification and password recovery emails.
            </ThemedText>

            <ThemedText style={styles.listItem}>
              • Maintain, secure, and improve the application's functionality.
            </ThemedText>
          </View>

          {/* 5. Third-Party Services */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            5. Third-Party Services
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            GeoPhoto relies on third-party services to operate.
            Information may be processed by these providers as
            necessary to provide their respective services.
          </ThemedText>

          <View style={styles.service}>
            <ThemedText style={styles.serviceName}>
              Mapbox
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              Provides map rendering and mapping functionality.
              Location and map-related information may be processed
              as necessary to provide these services.
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              Mapbox's mobile SDK also collects and sends de-identified
              location and usage telemetry by default to help improve its
              mapping services. Users can opt out at any time through the
              Mapbox attribution menu on the map by selecting "Mapbox
              Telemetry" and choosing "Stop Participating." This telemetry
              is separate from the precise GPS coordinates GeoPhoto
              collects for location posts.
            </ThemedText>
            {renderExternalLink(
              "Mapbox Privacy Policy",
              "https://www.mapbox.com/legal/privacy"
            )}
          </View>

          <View style={styles.service}>
            <ThemedText style={styles.serviceName}>
              Cloudinary
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              Stores and delivers uploaded location photographs
              and profile pictures.
            </ThemedText>
            {renderExternalLink(
              "Cloudinary Privacy Policy",
              "https://cloudinary.com/privacy"
            )}
          </View>

          <View style={styles.service}>
            <ThemedText style={styles.serviceName}>
              Resend
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              Delivers account verification and password
              recovery emails.
            </ThemedText>
            {renderExternalLink(
              "Resend Privacy Policy",
              "https://resend.com/legal/privacy-policy"
            )}
          </View>

          <View style={styles.service}>
            <ThemedText style={styles.serviceName}>
              Railway
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              Hosts the GeoPhoto backend API and processes
              application requests.
            </ThemedText>
            {renderExternalLink(
              "Railway Privacy Information",
              "https://railway.com/legal/privacy"
            )}
          </View>

          <View style={styles.service}>
            <ThemedText style={styles.serviceName}>
              Neon
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              Provides PostgreSQL database hosting for
              application account and location data.
            </ThemedText>
            {renderExternalLink(
              "Neon Privacy Policy",
              "https://neon.com/privacy-policy"
            )}
          </View>

          <ThemedText style={styles.paragraph}>
            These services have their own privacy practices and
            policies. Their processing of information is subject
            to their respective terms and policies.
          </ThemedText>

          {/* 6. Account Security */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            6. Account Security
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            GeoPhoto uses authentication and authorization
            mechanisms to protect account access and restrict
            account-specific actions.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Passwords are handled through ASP.NET Core Identity
            and stored as hashed credentials rather than
            plain-text passwords. Authentication tokens are
            used to maintain signed-in sessions.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Although reasonable measures are used to protect
            account information, no online service can guarantee
            absolute security.
          </ThemedText>

          {/* 7. Data Retention and Account Deletion */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            7. Data Retention and Account Deletion
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Information is retained as needed to operate the
            application and provide its features.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Users can permanently delete their accounts through
            the Account Information section of the GeoPhoto
            mobile application. Account deletion requires
            confirmation using the account's current password.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            When an account is deleted, GeoPhoto deletes the
            associated account information, location posts,
            uploaded location photographs, profile picture,
            comments, likes, and bookmarks.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Uploaded photographs and profile pictures stored
            through Cloudinary are also submitted for deletion.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Account deletion is permanent and cannot be reversed.
            Once an account has been deleted, the user will no
            longer be able to access it or its associated content.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            For questions about account deletion or personal
            information, contact the GeoPhoto developer using
            the contact information below.
          </ThemedText>

          {/* 8. Children's Privacy */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            8. Children's Privacy
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            GeoPhoto is not specifically designed for children.
            We do not knowingly collect personal information
            from children in violation of applicable privacy laws.
            If you believe a child has provided personal information
            through GeoPhoto, please contact the developer.
          </ThemedText>

          {/* 9. Changes */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            9. Changes to This Policy
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            This Privacy Policy may be updated as GeoPhoto
            develops. Any changes will be reflected on this page
            along with an updated effective date.
          </ThemedText>

          {/* 10. Contact */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            10. Contact
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            If you have questions about this Privacy Policy or
            how information is handled by GeoPhoto, contact:
          </ThemedText>

          <ThemedText style={styles.contact}>
            GeoPhoto Developer: Jacob.jkendall@gmail.com
          </ThemedText>

          <ThemedText style={styles.footer}>
            GeoPhoto Privacy Policy
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

  effectiveDate: {
    fontSize: 13,
    opacity: 0.65,
    marginTop: 15,
    marginBottom: 18,
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
    marginBottom: 12,
  },

  listItem: {
    fontSize: 15,
    lineHeight: 25,
    marginBottom: 5,
  },

  service: {
    marginBottom: 15,
  },

  serviceName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 5,
  },

  link: {
    color: "#3498db",
    fontSize: 15,
    textDecorationLine: "underline",
    marginBottom: 5,
  },

  contact: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 5,
  },

  footer: {
    marginTop: 30,
    textAlign: "center",
    opacity: 0.6,
  },
});
