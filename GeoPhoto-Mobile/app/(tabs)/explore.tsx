import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";

import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://192.168.1.174:5198";

type Location = {
  id: number;
  latitude: number;
  longitude: number;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  username: string | null;
  profilePicture: string | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
};

type Comment = {
  id: number;
  text: string;
  createdAt: string;
  username: string | null;
  profilePicture: string | null;
  isMine: boolean;
};

type Filter = "all" | "distance" | "liked";

type CommentMenuPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function Explore() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const insets = useSafeAreaInsets();

  const [locations, setLocations] = useState<Location[]>([]);

  const [selectedFilter, setSelectedFilter] =
    useState<Filter>("all");

  /*
   * Stores the order of locations when
   * entering Most Liked.
   *
   * This prevents a like count changing
   * from immediately moving a post.
   */
  const [likedOrder, setLikedOrder] = useState<number[]>([]);

  /*
   * Stores the order of locations when
   * entering Distance.
   *
   * This prevents comments/likes/bookmarks
   * from changing the distance ordering.
   */
  const [distanceOrder, setDistanceOrder] =
    useState<number[]>([]);

  const [loading, setLoading] = useState(true);

  const [distanceLoading, setDistanceLoading] =
    useState(false);

  const [selectedLocation, setSelectedLocation] =
    useState<Location | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);

  const [commentsLoading, setCommentsLoading] =
    useState(false);

  const [commentText, setCommentText] = useState("");

  const [sendingComment, setSendingComment] =
    useState(false);

  /*
   * Stores which comment's three-dot menu
   * is currently open.
   */
  const [commentMenuId, setCommentMenuId] =
    useState<number | null>(null);

  /*
   * Stores the screen position of the
   * three-dot button that was pressed.
   */
  const [commentMenuPosition, setCommentMenuPosition] =
    useState<CommentMenuPosition | null>(null);

  /*
   * Stores references to each comment's
   * three-dot button so we can measure
   * its position on the screen.
   */
  const commentButtonRefs =
    useRef<Record<number, any>>({});

  const bottomSheetRef =
    useRef<BottomSheet>(null);

  /*
   * Keep the comments sheet at 75% of the screen.
   */
  const snapPoints = useMemo(
    () => ["75%"],
    []
  );

  /*
   * Load locations
   */
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);

      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/locations`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load locations."
        );
      }

      const data = await response.json();

      setLocations(data);
    } catch (error) {
      console.error(
        "Error loading locations:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  /*
   * Calculate distance between two
   * latitude/longitude points.
   *
   * Returns distance in meters.
   */
  const calculateDistance = (
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number
  ) => {
    const earthRadius = 6371000;

    const latitudeDifference =
      ((latitude2 - latitude1) * Math.PI) / 180;

    const longitudeDifference =
      ((longitude2 - longitude1) * Math.PI) / 180;

    const a =
      Math.sin(latitudeDifference / 2) *
        Math.sin(latitudeDifference / 2) +
      Math.cos((latitude1 * Math.PI) / 180) *
        Math.cos((latitude2 * Math.PI) / 180) *
        Math.sin(longitudeDifference / 2) *
        Math.sin(longitudeDifference / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return earthRadius * c;
  };

  /*
   * Get current device location and
   * establish Distance ordering.
   */
  const handleDistanceFilter = async () => {
    try {
      setDistanceLoading(true);

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Allow MapApp to access your location to sort locations by distance."
        );

        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      const userLatitude =
        currentLocation.coords.latitude;

      const userLongitude =
        currentLocation.coords.longitude;

      const sortedIds = [...locations]
        .sort((a, b) => {
          const distanceA = calculateDistance(
            userLatitude,
            userLongitude,
            a.latitude,
            a.longitude
          );

          const distanceB = calculateDistance(
            userLatitude,
            userLongitude,
            b.latitude,
            b.longitude
          );

          return distanceA - distanceB;
        })
        .map((location) => location.id);

      setDistanceOrder(sortedIds);
      setSelectedFilter("distance");
    } catch (error) {
      console.error(
        "Error getting current location:",
        error
      );

      Alert.alert(
        "Unable to Get Location",
        "We couldn't determine your current location. Please try again."
      );
    } finally {
      setDistanceLoading(false);
    }
  };

  /*
   * Apply current filter
   */
  const filteredLocations = useMemo(() => {
    if (selectedFilter === "liked") {
      const locationMap = new Map(
        locations.map((location) => [
          location.id,
          location,
        ])
      );

      return likedOrder
        .map((id) => locationMap.get(id))
        .filter(
          (location): location is Location =>
            location !== undefined
        );
    }

    if (selectedFilter === "distance") {
      const locationMap = new Map(
        locations.map((location) => [
          location.id,
          location,
        ])
      );

      return distanceOrder
        .map((id) => locationMap.get(id))
        .filter(
          (location): location is Location =>
            location !== undefined
        );
    }

    return locations;
  }, [
    locations,
    selectedFilter,
    likedOrder,
    distanceOrder,
  ]);

  /*
   * Change filter
   */
  const handleFilterChange = async (
    filter: Filter
  ) => {
    if (filter === "distance") {
      await handleDistanceFilter();
      return;
    }

    /*
     * When entering Most Liked, capture
     * the current ranking.
     */
    if (filter === "liked") {
      const sortedIds = [...locations]
        .sort(
          (a, b) =>
            b.likeCount - a.likeCount
        )
        .map((location) => location.id);

      setLikedOrder(sortedIds);
    }

    setSelectedFilter(filter);
  };

  /*
   * Go to location on map
   */
  const handleGoToLocation = (
    location: Location
  ) => {
    router.push({
      pathname: "/",
      params: {
        locationId: location.id.toString(),
      },
    });
  };

  /*
   * Toggle like
   */
  const handleLike = async (
    location: Location
  ) => {
    if (!token) {
      return;
    }

    try {
      const method = location.likedByMe
        ? "DELETE"
        : "POST";

      const response = await fetch(
        `${API_URL}/locations/${location.id}/like`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update like."
        );
      }

      setLocations((current) =>
        current.map((item) => {
          if (item.id !== location.id) {
            return item;
          }

          return {
            ...item,
            likedByMe: !item.likedByMe,
            likeCount: item.likedByMe
              ? item.likeCount - 1
              : item.likeCount + 1,
          };
        })
      );
    } catch (error) {
      console.error(
        "Error updating like:",
        error
      );
    }
  };

  /*
   * Toggle bookmark
   */
  const handleBookmark = async (
    location: Location
  ) => {
    if (!token) {
      return;
    }

    try {
      const method = location.bookmarkedByMe
        ? "DELETE"
        : "POST";

      const response = await fetch(
        `${API_URL}/locations/${location.id}/bookmark`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update bookmark."
        );
      }

      setLocations((current) =>
        current.map((item) => {
          if (item.id !== location.id) {
            return item;
          }

          return {
            ...item,
            bookmarkedByMe:
              !item.bookmarkedByMe,
          };
        })
      );
    } catch (error) {
      console.error(
        "Error updating bookmark:",
        error
      );
    }
  };

  /*
   * Open comments
   */
  const openComments = async (
    location: Location
  ) => {
    setSelectedLocation(location);
    setComments([]);
    setCommentText("");
    setCommentMenuId(null);
    setCommentMenuPosition(null);

    bottomSheetRef.current?.snapToIndex(0);

    try {
      setCommentsLoading(true);

      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/locations/${location.id}/comments`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load comments."
        );
      }

      const data = await response.json();

      setComments(data);
    } catch (error) {
      console.error(
        "Error loading comments:",
        error
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  /*
   * Open the three-dot menu and measure
   * the button's position on the screen.
   */
  const openCommentMenu = (
    commentId: number
  ) => {
    const button =
      commentButtonRefs.current[commentId];

    if (!button) {
      return;
    }

    button.measureInWindow(
      (
        x: number,
        y: number,
        width: number,
        height: number
      ) => {
        setCommentMenuPosition({
          x,
          y,
          width,
          height,
        });

        setCommentMenuId(commentId);
      }
    );
  };

  /*
   * Close the three-dot menu.
   */
  const closeCommentMenu = () => {
    setCommentMenuId(null);
    setCommentMenuPosition(null);
  };

  /*
   * Send comment
   */
  const handleSendComment = async () => {
    if (!token || !selectedLocation) {
      return;
    }

    if (!commentText.trim()) {
      return;
    }

    try {
      setSendingComment(true);

      const response = await fetch(
        `${API_URL}/locations/${selectedLocation.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: commentText.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to create comment."
        );
      }

      /*
       * Reload comments so the new comment
       * includes username, profile picture,
       * and isMine.
       */
      const commentsResponse =
        await fetch(
          `${API_URL}/locations/${selectedLocation.id}/comments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      if (commentsResponse.ok) {
        const updatedComments =
          await commentsResponse.json();

        setComments(updatedComments);
      }

      setCommentText("");

      /*
       * Update comment count on the card.
       */
      setLocations((current) =>
        current.map((location) => {
          if (
            location.id !==
            selectedLocation.id
          ) {
            return location;
          }

          return {
            ...location,
            commentCount:
              location.commentCount + 1,
          };
        })
      );
    } catch (error) {
      console.error(
        "Error sending comment:",
        error
      );
    } finally {
      setSendingComment(false);
    }
  };

  /*
   * Delete comment
   */
  const handleDeleteComment = (
    comment: Comment
  ) => {
    if (!token || !selectedLocation) {
      return;
    }

    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response =
                await fetch(
                  `${API_URL}/locations/${selectedLocation.id}/comments/${comment.id}`,
                  {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

              if (!response.ok) {
                throw new Error(
                  "Failed to delete comment."
                );
              }

              /*
               * Remove the comment immediately
               * from the bottom sheet.
               */
              setComments((current) =>
                current.filter(
                  (item) =>
                    item.id !== comment.id
                )
              );

              /*
               * Update the comment count
               * on the location card.
               */
              setLocations((current) =>
                current.map((location) => {
                  if (
                    location.id !==
                    selectedLocation.id
                  ) {
                    return location;
                  }

                  return {
                    ...location,
                    commentCount: Math.max(
                      0,
                      location.commentCount - 1
                    ),
                  };
                })
              );

              /*
               * Keep selectedLocation's count
               * synchronized as well.
               */
              setSelectedLocation(
                (current) =>
                  current
                    ? {
                        ...current,
                        commentCount:
                          Math.max(
                            0,
                            current.commentCount -
                              1
                          ),
                      }
                    : current
              );
            } catch (error) {
              console.error(
                "Error deleting comment:",
                error
              );

              Alert.alert(
                "Error",
                "The comment could not be deleted."
              );
            }
          },
        },
      ]
    );
  };

  /*
   * Format date
   */
  const formatDate = (
    dateString: string
  ) => {
    const date = new Date(dateString);

    return date.toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  /*
   * Location card
   */
  const renderLocation = ({
    item,
  }: {
    item: Location;
  }) => {
    return (
      <ThemedView style={styles.card}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            {item.profilePicture ? (
              <Image
                source={{
                  uri: item.profilePicture.startsWith(
                    "http"
                  )
                    ? item.profilePicture
                    : `${API_URL}${item.profilePicture}`,
                }}
                style={styles.profilePicture}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.defaultProfilePicture,
                  {
                    backgroundColor:
                      colors.border,
                  },
                ]}
              >
                <MaterialIcons
                  name="person"
                  size={24}
                  color={colors.text}
                />
              </View>
            )}

            <ThemedText
              type="defaultSemiBold"
              style={styles.username}
            >
              @{item.username ?? "unknown"}
            </ThemedText>
          </View>

          {/* Go to Location */}
          <Pressable
            onPress={() =>
              handleGoToLocation(item)
            }
            style={[
              styles.goToLocationButton,
              {
                borderColor:
                  colors.border,
              },
            ]}
          >
            <MaterialIcons
              name="location-on"
              size={18}
              color={colors.primary}
            />

            <ThemedText
              style={[
                styles.goToLocationText,
                {
                  color: colors.primary,
                },
              ]}
            >
              Go to Location
            </ThemedText>
          </Pressable>
        </View>

        {/* Location image */}
        {item.imageUrl ? (
          <Image
            source={{
              uri: item.imageUrl.startsWith(
                "http"
              )
                ? item.imageUrl
                : `${API_URL}${item.imageUrl}`,
            }}
            style={[
              styles.locationImage,
              {
                backgroundColor: colors.card,
              },
            ]}
            resizeMode="contain"
          />
        ) : (
          <View
            style={[
              styles.noImage,
              {
                backgroundColor:
                  colors.border,
              },
            ]}
          >
            <MaterialIcons
              name="image"
              size={40}
              color={colors.text}
            />
          </View>
        )}

        {/* Content below image */}
        <View style={styles.cardContent}>
          {/* Interaction row */}
          <View style={styles.interactionRow}>
            <View style={styles.leftActions}>
              {/* Like */}
              <Pressable
                onPress={() =>
                  handleLike(item)
                }
                style={styles.iconButton}
              >
                <MaterialIcons
                  name={
                    item.likedByMe
                      ? "favorite"
                      : "favorite-border"
                  }
                  size={27}
                  color={
                    item.likedByMe
                      ? "#e53935"
                      : colors.text
                  }
                />

                <ThemedText
                  style={styles.countText}
                >
                  {item.likeCount}
                </ThemedText>
              </Pressable>

              {/* Comments */}
              <Pressable
                onPress={() =>
                  openComments(item)
                }
                style={styles.iconButton}
              >
                <MaterialIcons
                  name="chat-bubble-outline"
                  size={25}
                  color={colors.text}
                />

                <ThemedText
                  style={styles.countText}
                >
                  {item.commentCount}
                </ThemedText>
              </Pressable>
            </View>

            {/* Bookmark */}
            <Pressable
              onPress={() =>
                handleBookmark(item)
              }
              style={styles.iconButton}
            >
              <MaterialIcons
                name={
                  item.bookmarkedByMe
                    ? "bookmark"
                    : "bookmark-border"
                }
                size={27}
                color={colors.text}
              />
            </Pressable>
          </View>

          {/* Description */}
          <View
            style={
              styles.descriptionContainer
            }
          >
            <ThemedText type="defaultSemiBold">
              @{item.username ?? "unknown"}
            </ThemedText>

            {item.description ? (
              <ThemedText
                style={styles.description}
              >
                {" "}
                {item.description}
              </ThemedText>
            ) : null}
          </View>

          {/* Created date */}
          <ThemedText
            style={styles.createdDate}
          >
            {formatDate(item.createdAt)}
          </ThemedText>
        </View>
      </ThemedView>
    );
  };

  /*
   * Comment item
   */
  const renderComment = ({
    item,
  }: {
    item: Comment;
  }) => {
    return (
      <View style={styles.commentRow}>
        {item.profilePicture ? (
          <Image
            source={{
              uri: item.profilePicture.startsWith(
                "http"
              )
                ? item.profilePicture
                : `${API_URL}${item.profilePicture}`,
            }}
            style={styles.commentProfilePicture}
          />
        ) : (
          <View
            style={[
              styles.commentProfilePicture,
              styles.defaultCommentProfilePicture,
              {
                backgroundColor: colors.border,
              },
            ]}
          >
            <MaterialIcons
              name="person"
              size={20}
              color={colors.text}
            />
          </View>
        )}

        <View style={styles.commentContent}>
          {/*
           * The text and three-dot button are
           * separate columns. This prevents a
           * long comment from pushing the dots
           * off the screen.
           */}
          <View style={styles.commentTopRow}>
            <View style={styles.commentTextRow}>
              <ThemedText type="defaultSemiBold">
                @{item.username ?? "unknown"}
              </ThemedText>

              <ThemedText
                style={styles.commentText}
              >
                {" "}
                {item.text}
              </ThemedText>
            </View>

            {/* Three-dot menu for user's own comments */}
            {item.isMine && (
              <Pressable
                ref={(ref) => {
                  commentButtonRefs.current[
                    item.id
                  ] = ref;
                }}
                onPress={() =>
                  openCommentMenu(item.id)
                }
                style={
                  styles.commentOptionsButton
                }
                hitSlop={8}
              >
                <MaterialIcons
                  name="more-vert"
                  size={22}
                  color={colors.text}
                />
              </Pressable>
            )}
          </View>

          <ThemedText style={styles.commentDate}>
            {formatDate(item.createdAt)}
          </ThemedText>
        </View>
      </View>
    );
  };

  /*
   * Main loading state
   */
  if (loading) {
    return (
      <ThemedView
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </ThemedView>
    );
  }

  /*
   * Calculate the position of the comment
   * menu inside the transparent modal.
   */
  const menuWidth = 130;
  const menuHeight = 48;
  const menuSpacing = 8;
  const screenWidth =
    Dimensions.get("window").width;
  const screenHeight =
    Dimensions.get("window").height;

  let commentMenuStyle: {
    left: number;
    top: number;
  } | null = null;

  if (commentMenuPosition) {
    const desiredLeft =
      commentMenuPosition.x +
      commentMenuPosition.width -
      menuWidth;

    const left = Math.max(
      8,
      Math.min(
        desiredLeft,
        screenWidth - menuWidth - 8
      )
    );

    const desiredTop =
      commentMenuPosition.y -
      menuHeight -
      menuSpacing;

    /*
     * Normally the menu goes above the dots.
     *
     * If the dots are very close to the top
     * of the screen, put it below them instead
     * so the menu remains visible.
     */
    const top =
      desiredTop >= insets.top + 8
        ? desiredTop
        : commentMenuPosition.y +
          commentMenuPosition.height +
          menuSpacing;

    commentMenuStyle = {
      left,
      top: Math.min(
        top,
        screenHeight - menuHeight - 8
      ),
    };
  }

  return (
    <ThemedView style={styles.container}>
      {/* Filters */}
      <View
        style={[
          styles.filterContainer,
          {
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <Pressable
          onPress={() =>
            handleFilterChange("all")
          }
          style={[
            styles.filterButton,
            {
              borderColor: colors.border,
            },
            selectedFilter === "all" &&
              styles.activeFilterButton,
            selectedFilter === "all" && {
              backgroundColor:
                colors.primary,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.filterText,
              selectedFilter === "all" &&
                styles.activeFilterText,
            ]}
          >
            All Locations
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() =>
            handleFilterChange("distance")
          }
          disabled={distanceLoading}
          style={[
            styles.filterButton,
            {
              borderColor: colors.border,
            },
            selectedFilter === "distance" &&
              styles.activeFilterButton,
            selectedFilter === "distance" && {
              backgroundColor:
                colors.primary,
            },
            distanceLoading &&
              styles.disabledFilterButton,
          ]}
        >
          {distanceLoading ? (
            <ActivityIndicator
              size="small"
              color={
                selectedFilter === "distance"
                  ? "#fff"
                  : colors.primary
              }
            />
          ) : (
            <ThemedText
              style={[
                styles.filterText,
                selectedFilter ===
                  "distance" &&
                  styles.activeFilterText,
              ]}
            >
              Distance
            </ThemedText>
          )}
        </Pressable>

        <Pressable
          onPress={() =>
            handleFilterChange("liked")
          }
          style={[
            styles.filterButton,
            {
              borderColor: colors.border,
            },
            selectedFilter === "liked" &&
              styles.activeFilterButton,
            selectedFilter === "liked" && {
              backgroundColor:
                colors.primary,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.filterText,
              selectedFilter === "liked" &&
                styles.activeFilterText,
            ]}
          >
            Most Liked
          </ThemedText>
        </Pressable>
      </View>

      {/* Location feed */}
      <FlatList
        data={filteredLocations}
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={renderLocation}
        contentContainerStyle={
          styles.listContent
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Comments bottom sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={[
          styles.bottomSheetBackground,
          {
            backgroundColor:
              colors.card,
          },
        ]}
        handleIndicatorStyle={[
          styles.bottomSheetHandle,
          {
            backgroundColor:
              colors.border,
          },
        ]}
      >
        <View
          style={styles.bottomSheetContainer}
        >
          <BottomSheetFlatList
            data={comments}
            keyExtractor={(item) =>
              item.id.toString()
            }
            renderItem={renderComment}
            contentContainerStyle={
              styles.commentsListContent
            }
            ListHeaderComponentStyle={{
              paddingBottom: 6,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
            ListHeaderComponent={
              <View
                style={[
                  styles.commentsHeader,
                  {
                    borderBottomColor:
                      colors.border,
                  },
                ]}
              >
                <ThemedText
                  type="subtitle"
                  style={
                    styles.commentsTitle
                  }
                >
                  Comments
                </ThemedText>
              </View>
            }
            ListEmptyComponent={
              commentsLoading ? (
                <View
                  style={
                    styles.emptyComments
                  }
                >
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                  />
                </View>
              ) : (
                <View
                  style={
                    styles.emptyComments
                  }
                >
                  <ThemedText>
                    No comments yet.
                  </ThemedText>

                  <ThemedText
                    style={
                      styles.emptyCommentsText
                    }
                  >
                    Be the first to comment!
                  </ThemedText>
                </View>
              )
            }
          />

          {/* Fixed comment input */}
          <View
            style={[
              styles.commentInputContainer,
              {
                paddingBottom: Math.max(
                  insets.bottom,
                  10
                ),
                borderTopColor:
                  colors.border,
                backgroundColor:
                  colors.card,
              },
            ]}
          >
            <BottomSheetTextInput
              value={commentText}
              onChangeText={
                setCommentText
              }
              placeholder={
                token
                  ? "Add a comment..."
                  : "Log in to comment"
              }
              editable={
                !!token && !sendingComment
              }
              multiline
              style={[
                styles.commentInput,
                {
                  backgroundColor:
                    colors.background,
                  borderColor:
                    colors.border,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={
                colors.text
              }
            />

            <Pressable
              onPress={
                handleSendComment
              }
              disabled={
                !token ||
                !commentText.trim() ||
                sendingComment
              }
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    colors.primary,
                },
                (!token ||
                  !commentText.trim() ||
                  sendingComment) &&
                  styles.disabledSendButton,
              ]}
            >
              {sendingComment ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                />
              ) : (
                <MaterialIcons
                  name="send"
                  size={22}
                  color="#fff"
                />
              )}
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      {/* Three-dot comment menu */}
      <Modal
        transparent
        visible={
          commentMenuId !== null &&
          commentMenuPosition !== null
        }
        animationType="fade"
        onRequestClose={
          closeCommentMenu
        }
      >
        <Pressable
          style={styles.commentMenuOverlay}
          onPress={closeCommentMenu}
        >
          {commentMenuStyle && (
            <View
              style={[
                styles.commentMenu,
                {
                  backgroundColor:
                    colors.card,
                },
                commentMenuStyle,
              ]}
            >
              <Pressable
                style={styles.commentMenuItem}
                onPress={() => {
                  const comment =
                    comments.find(
                      (item) =>
                        item.id ===
                        commentMenuId
                    );

                  closeCommentMenu();

                  if (comment) {
                    handleDeleteComment(
                      comment
                    );
                  }
                }}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={20}
                  color="#e53935"
                />

                <ThemedText
                  style={
                    styles.commentMenuDeleteText
                  }
                >
                  Delete
                </ThemedText>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /*
   * Filters
   */
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },

  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  activeFilterButton: {
    borderColor: "transparent",
  },

  disabledFilterButton: {
    opacity: 0.6,
  },

  filterText: {
    fontSize: 14,
  },

  activeFilterText: {
    color: "#fff",
  },

  /*
   * Location list
   */
  listContent: {
    paddingBottom: 30,
  },

  card: {
    marginBottom: 22,
  },

  cardContent: {
    paddingHorizontal: 12,
  },

  /*
   * Profile header
   */
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  defaultProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  username: {
    marginLeft: 10,
  },

  goToLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 16,
    marginLeft: 8,
  },

  goToLocationText: {
    fontSize: 12,
    marginLeft: 4,
  },

  /*
   * Location image
   */
  locationImage: {
    width: "100%",
    aspectRatio: 4 / 3,
  },

  noImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    alignItems: "center",
    justifyContent: "center",
  },

  /*
   * Interaction row
   */
  interactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
  },

  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  countText: {
    fontSize: 14,
  },

  /*
   * Description
   */
  descriptionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 8,
  },

  description: {
    flexShrink: 1,
  },

  createdDate: {
    paddingTop: 6,
    paddingBottom: 10,
    fontSize: 12,
    opacity: 0.6,
  },

  /*
   * Bottom sheet
   */
  bottomSheetBackground: {
    borderRadius: 20,
  },

  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },

  bottomSheetContainer: {
    flex: 1,
  },

  commentsHeader: {
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  commentsTitle: {
    fontSize: 18,
  },

  /*
   * Comments list
   */
  commentsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  /*
   * Individual comment
   */
  commentRow: {
    flexDirection: "row",
    marginBottom: 18,
  },

  commentProfilePicture: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },

  defaultCommentProfilePicture: {
    alignItems: "center",
    justifyContent: "center",
  },

  commentContent: {
    flex: 1,
    marginLeft: 10,
  },

  /*
   * Text and menu are separate columns.
   */
  commentTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },

  /*
   * Allows the comment text to use
   * the available width while leaving
   * room for the three-dot button.
   */
  commentTextRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    minWidth: 0,
  },

  commentText: {
    flexShrink: 1,
  },

  /*
   * Fixed right-side area for the
   * three-dot button.
   */
  commentOptionsButton: {
    width: 32,
    minHeight: 28,
    marginLeft: 6,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 1,
  },

  commentDate: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 4,
  },

  /*
   * Three-dot comment menu
   */
  commentMenuOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0, 0, 0, 0.08)",
  },

  commentMenu: {
    position: "absolute",
    width: 130,
    height: 48,
    borderRadius: 10,
    elevation: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowColor: "#000",
  },

  commentMenuItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  commentMenuDeleteText: {
    color: "#e53935",
    marginLeft: 10,
    fontSize: 15,
  },

  emptyComments: {
    alignItems: "center",
    paddingTop: 50,
  },

  emptyCommentsText: {
    opacity: 0.6,
    marginTop: 5,
  },

  /*
   * Comment input
   */
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth:
      StyleSheet.hairlineWidth,
  },

  commentInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledSendButton: {
    opacity: 0.4,
  },
});