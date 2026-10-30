import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams, useNavigation, } from "expo-router";
import { useTheme } from "@react-navigation/native";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import Mapbox from "@rnmapbox/maps";
import CameraComponent from "../../components/CameraComponent";
import { useAuth } from "../../context/AuthContext";
import { Collapsible } from "@/components/ui/collapsible";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Dimensions, Keyboard, Modal, Pressable, StyleSheet,Text,TouchableWithoutFeedback,View,
} from "react-native";

import {BottomSheetFlatList,BottomSheetScrollView,BottomSheetTextInput,BottomSheetView,
} from "@gorhom/bottom-sheet";
import BottomSheet from "@gorhom/bottom-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

Mapbox.setAccessToken(
  "pk.eyJ1IjoiZ2F3YWluNDA0IiwiYSI6ImNtdXFsdzVscjAydHUyd3BxbWV5ZWY5dTMifQ.vgJEszjTHerdTWzqNJ5D_A"
);

const API_URL = "http://192.168.1.174:5198";

type MapLocation = {
  id: number;
  latitude: number;
  longitude: number;
  description?: string | null;
  imageUrl?: string | null;
  createdAt?: string | null;
  username?: string | null;
  profilePicture?: string | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
};

type Comment = {
  id: number;
  text: string;
  createdAt: string;
  username: string;
  profilePicture?: string | null;
  isMine: boolean;
};

type CommentMenuPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function getApiUrl(value?: string | null) {
  if (!value) return null;

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${API_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { locationId } = useLocalSearchParams();
  const navigation = useNavigation("/(tabs)");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [showCamera, setShowCamera] = useState(false);

  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<MapLocation | null>(null);

  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [commentMenuId, setCommentMenuId] = useState<number | null>(null);

  const [commentMenuPosition, setCommentMenuPosition] =
    useState<CommentMenuPosition | null>(null);

  const cameraRef = useRef<Mapbox.Camera>(null);
  const locationSheetRef = useRef<BottomSheet>(null);
  const uploadSheetRef = useRef<BottomSheet>(null);
  const commentsSheetRef = useRef<BottomSheet>(null);

  const commentButtonRefs = useRef<Record<number, any>>({});

  const zoomLevelRef = useRef(12);

  const locationSnapPoints = useMemo(() => ["85%", "92%"], []);
  const commentsSnapPoints = useMemo(() => ["75%"], []);
  const uploadSnapPoints = useMemo(() => ["25%"], []);

  const tokenForRequest = async () =>
    SecureStore.getItemAsync("token");

  const fetchLocations = useCallback(async () => {
    try {
      const token = await tokenForRequest();

      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/locations`, {
        headers,
      });

      if (!res.ok) {
        console.log("Locations status:", res.status);
        return [];
      }

      const data = await res.json();

      setLocations(data);

      return Array.isArray(data)
        ? (data as MapLocation[])
        : [];
    } catch (error) {
      console.error("Fetch locations error:", error);
      return [];
    }
  }, []);

  const refreshMapData = useCallback(async () => {
    await fetchLocations();
  }, [fetchLocations]);

  const openLocation = useCallback((marker: MapLocation) => {
    setSelectedLocation(marker);
    setCommentMenuId(null);
    setCommentMenuPosition(null);

    locationSheetRef.current?.snapToIndex(0);
  }, []);

  const closeLocation = useCallback(() => {
    Keyboard.dismiss();
    setCommentMenuId(null);
    setCommentMenuPosition(null);

    locationSheetRef.current?.close();
  }, []);

  const handleLocationPress = useCallback(
    (id: number) => {
      const location = locations.find(
        (item) => item.id === id
      );

      if (location) {
        openLocation(location);
      }
    },
    [locations, openLocation]
  );

  const updateSelectedLocation = useCallback(
    (updated: MapLocation) => {
      setSelectedLocation(updated);

      setLocations((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      );
    },
    []
  );

  const loadComments = useCallback(
    async (locationId: number) => {
      try {
        setCommentsLoading(true);
        setCommentMenuId(null);
        setCommentMenuPosition(null);

        const token = await tokenForRequest();

        const headers: Record<string, string> = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(
          `${API_URL}/locations/${locationId}/comments`,
          {
            headers,
          }
        );

        if (!res.ok) {
          console.log("Comments status:", res.status);
          setComments([]);
          return;
        }

        const data = await res.json();

        console.log("Comments response:", data);

        setComments(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error("Load comments error:", error);
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    },
    []
  );

  const openComments = useCallback(() => {
    if (!selectedLocation) return;

    setCommentText("");
    setCommentMenuId(null);
    setCommentMenuPosition(null);

    commentsSheetRef.current?.snapToIndex(0);

    void loadComments(selectedLocation.id);
  }, [loadComments, selectedLocation]);

  const closeComments = useCallback(() => {
    Keyboard.dismiss();
    setCommentMenuId(null);
    setCommentMenuPosition(null);

    commentsSheetRef.current?.close();
  }, []);

  const toggleLike = async () => {
    if (!selectedLocation || isLiking) return;

    const token = await tokenForRequest();

    if (!token) {
      Alert.alert(
        "Login required",
        "You need to be logged in to like locations."
      );
      return;
    }

    const wasLiked = selectedLocation.likedByMe;
    const nextLiked = !wasLiked;

    setIsLiking(true);

    updateSelectedLocation({
      ...selectedLocation,
      likedByMe: nextLiked,
      likeCount: Math.max(
        0,
        selectedLocation.likeCount +
          (nextLiked ? 1 : -1)
      ),
    });

    try {
      const res = await fetch(
        `${API_URL}/locations/${selectedLocation.id}/like`,
        {
          method: nextLiked ? "POST" : "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(
          `Like request failed: ${res.status}`
        );
      }

      const data = await res.json().catch(() => null);

      if (
        data &&
        typeof data.likeCount === "number"
      ) {
        updateSelectedLocation({
          ...selectedLocation,
          likedByMe: nextLiked,
          likeCount: data.likeCount,
        });
      }
    } catch (error) {
      console.error("Like error:", error);

      updateSelectedLocation(selectedLocation);

      Alert.alert(
        "Error",
        "Unable to update the like right now."
      );
    } finally {
      setIsLiking(false);
    }
  };

  const toggleBookmark = async () => {
    if (!selectedLocation || isBookmarking) return;

    const token = await tokenForRequest();

    if (!token) {
      Alert.alert(
        "Login required",
        "You need to be logged in to bookmark locations."
      );
      return;
    }

    const wasBookmarked =
      selectedLocation.bookmarkedByMe;

    const nextBookmarked = !wasBookmarked;

    setIsBookmarking(true);

    updateSelectedLocation({
      ...selectedLocation,
      bookmarkedByMe: nextBookmarked,
    });

    try {
      const res = await fetch(
        `${API_URL}/locations/${selectedLocation.id}/bookmark`,
        {
          method: nextBookmarked ? "POST" : "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(
          `Bookmark request failed: ${res.status}`
        );
      }
    } catch (error) {
      console.error("Bookmark error:", error);

      updateSelectedLocation(selectedLocation);

      Alert.alert(
        "Error",
        "Unable to update the bookmark right now."
      );
    } finally {
      setIsBookmarking(false);
    }
  };

  const submitComment = async () => {
    const text = commentText.trim();

    if (
      !selectedLocation ||
      !text ||
      commentSubmitting
    ) {
      return;
    }

    const token = await tokenForRequest();

    if (!token) {
      Alert.alert(
        "Login required",
        "You need to be logged in to comment on locations."
      );
      return;
    }

    try {
      setCommentSubmitting(true);

      const res = await fetch(
        `${API_URL}/locations/${selectedLocation.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!res.ok) {
        throw new Error(
          `Comment request failed: ${res.status}`
        );
      }

      setCommentText("");

      await loadComments(selectedLocation.id);

      updateSelectedLocation({
        ...selectedLocation,
        commentCount:
          selectedLocation.commentCount + 1,
      });
    } catch (error) {
      console.error(
        "Submit comment error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to add your comment right now."
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = (
    comment: Comment
  ) => {
    if (!selectedLocation || !comment.isMine) {
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
            const token = await tokenForRequest();

            if (!token) {
              return;
            }

            try {
              const res = await fetch(
                `${API_URL}/locations/${selectedLocation.id}/comments/${comment.id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!res.ok) {
                throw new Error(
                  `Delete comment failed: ${res.status}`
                );
              }

              setComments((current) =>
                current.filter(
                  (item) =>
                    item.id !== comment.id
                )
              );

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

              setSelectedLocation(
                (current) =>
                  current
                    ? {
                        ...current,
                        commentCount: Math.max(
                          0,
                          current.commentCount - 1
                        ),
                      }
                    : current
              );

              setCommentMenuId(null);
              setCommentMenuPosition(null);
            } catch (error) {
              console.error(
                "Delete comment error:",
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

  const closeCommentMenu = () => {
    setCommentMenuId(null);
    setCommentMenuPosition(null);
  };

  const goToLocation = () => {
    if (!selectedLocation) return;

    const {
      latitude: lat,
      longitude: lng,
    } = selectedLocation;

    cameraRef.current?.setCamera({
      centerCoordinate: [lng, lat],
      zoomLevel: 15,
      animationDuration: 1000,
    });

    closeLocation();
  };

  const deleteLocation = async (
    id: number
  ) => {
    const token = await tokenForRequest();

    if (!token) {
      Alert.alert(
        "Login required",
        "You need to be logged in to delete a location."
      );
      return;
    }

    Alert.alert(
      "Delete Location",
      "Are you sure you want to delete this location?",
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
              const res = await fetch(
                `${API_URL}/locations/${id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!res.ok) {
                throw new Error(
                  `Delete location failed: ${res.status}`
                );
              }

              setLocations((current) =>
                current.filter(
                  (item) => item.id !== id
                )
              );

              closeLocation();
            } catch (error) {
              console.error(
                "Delete location error:",
                error
              );

              Alert.alert(
                "Error",
                "Unable to delete this location right now."
              );
            }
          },
        },
      ]
    );

    fetchLocations();
  };

  const myLocation = async () => {
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Permission to access your location was denied."
      );
      return;
    }

    const currentLocation =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

    const lat =
      currentLocation.coords.latitude;

    const lng =
      currentLocation.coords.longitude;

    cameraRef.current?.setCamera({
      centerCoordinate: [lng, lat],
      zoomLevel: 15,
      animationDuration: 2000,
    });
  };

  const zoomOut = () => {
    const newZoom = Math.max(0, zoomLevelRef.current - 5);

    zoomLevelRef.current = newZoom;

    cameraRef.current?.setCamera({
      zoomLevel: newZoom,
      animationDuration: 1000,
    });
  };

  const takeLocation = async () => {
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Permission to access your location is required."
      );
      return;
    }

    setShowCamera(true);
  };

  const addLocation = async () => {
    const token = await tokenForRequest();

    if (!token) {
      Alert.alert(
        "Login required",
        "You need to be logged in to create a location."
      );
      return null;
    }

    const res = await fetch(
      `${API_URL}/locations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude,
          longitude,
          description,
          imageUrl,
          createdAt: new Date().toISOString(),
        }),
      }
    );

    console.log(
      "Create location status:",
      res.status
    );

    if (!res.ok) {
      const message = await res
        .text()
        .catch(() => "");

      console.error(
        "Create location response:",
        message
      );

      throw new Error(
        `Create location failed: ${res.status}`
      );
    }

    return await res.json();
  };

  const confirmUpload = async () => {
    if (
      latitude == null ||
      longitude == null ||
      !imageUrl
    ) {
      Alert.alert(
        "Missing information",
        "Take a picture before uploading."
      );
      return;
    }

    try {
      const newLocation =
        await addLocation();

      if (!newLocation) return;

      closeSheet();
      setDescription("");

      const refreshedLocations =
        await fetchLocations();

      const refreshedLocation =
        refreshedLocations.find(
          (item) =>
            item.id ===
            Number(newLocation.id)
        );

      if (refreshedLocation) {
        openLocation(
          refreshedLocation
        );
      } else {
        const fallbackLocation: MapLocation =
          {
            ...newLocation,
            likeCount: Number(
              newLocation.likeCount ?? 0
            ),
            commentCount: Number(
              newLocation.commentCount ?? 0
            ),
            likedByMe: Boolean(
              newLocation.likedByMe ?? false
            ),
            bookmarkedByMe: Boolean(
              newLocation.bookmarkedByMe ??
                false
            ),
          };

        setLocations((current) => {
          if (
            current.some(
              (item) =>
                item.id ===
                fallbackLocation.id
            )
          ) {
            return current;
          }

          return [
            ...current,
            fallbackLocation,
          ];
        });

        openLocation(
          fallbackLocation
        );
      }
    } catch (error) {
      console.error(
        "Upload location error:",
        error
      );

      Alert.alert(
        "Upload error",
        "The location could not be uploaded right now."
      );
    }
  };

  const openSheet = () => {
    uploadSheetRef.current?.expand();
  };

  const closeSheet = () => {
    Keyboard.dismiss();
    uploadSheetRef.current?.close();
  };

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: showCamera
        ? { display: "none" }
        : undefined,
    });
  }, [showCamera, navigation]);

  useEffect(() => {
    refreshMapData();
  }, [refreshMapData]);

  useFocusEffect(
    useCallback(() => {
      if (
        !locationId ||
        locations.length === 0
      ) {
        return;
      }

      const location =
        locations.find(
          (item) =>
            item.id.toString() ===
            locationId
        );

      if (!location) return;

      const timer = setTimeout(() => {
        cameraRef.current?.setCamera({
          centerCoordinate: [
            location.longitude,
            location.latitude,
          ],
          zoomLevel: 15,
          animationDuration: 1000,
        });

        openLocation(location);

        router.setParams({
          locationId: undefined,
        });
      }, 100);

      return () =>
        clearTimeout(timer);
    }, [
      locationId,
      locations,
      openLocation,
    ])
  );

  const selectedIsMine =
    !!selectedLocation &&
    !!user?.username &&
    selectedLocation.username ===
      user.username;

  const renderComment = ({
    item,
  }: {
    item: Comment;
  }) => {
    const profileUri =
      getApiUrl(item.profilePicture);

    return (
      <View style={styles.commentRow}>
        {profileUri ? (
          <Image
            source={{
              uri: profileUri,
            }}
            style={
              styles.commentProfilePicture
            }
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.commentProfilePlaceholder,
              {
                backgroundColor:
                  colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.commentProfilePlaceholderText,
                {
                  color: colors.text,
                },
              ]}
            >
              {(item.username || "?")
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.commentBody}>
          <View style={styles.commentTopRow}>
            <Text
              style={[
                styles.commentTextRow,
                {
                  color: colors.text,
                },
              ]}
            >
              <Text style={styles.commentUsername}>
                @{item.username ||
                  "Unknown User"}
              </Text>{" "}
              <Text style={styles.commentText}>
                {item.text}
              </Text>
            </Text>

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
                hitSlop={8}
                style={
                  styles.commentMenuButton
                }
              >
                <MaterialIcons
                  name="more-vert"
                  size={22}
                  color={colors.text}
                />
              </Pressable>
            )}
          </View>

          {!!item.createdAt && (
            <Text
              style={[
                styles.commentDate,
                {
                  color: colors.text,
                },
              ]}
            >
              {formatDate(
                item.createdAt
              )}
            </Text>
          )}
        </View>
      </View>
    );
  };

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

    const top =
      desiredTop >= 8
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
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}
    >
      <GestureHandlerRootView
        style={{ flex: 1 }}
      >
        <BottomSheetModalProvider>
          <View style={styles.container}>
            <Mapbox.MapView
              style={styles.map}
              onCameraChanged={(event) => {
                zoomLevelRef.current = event.properties.zoom;
              }}
              scaleBarEnabled={false}
            >

              <Mapbox.Camera
                ref={cameraRef}
                zoomLevel={1}
                centerCoordinate={[
                  -95.3011,
                  32.3513,
                ]}
              />

              <Mapbox.Images
                images={{
                  pin: require("../../assets/images/map-pin.png"),
                }}
              />

              <Mapbox.ShapeSource
                id="locations"
                shape={{
                  type: "FeatureCollection",
                  features:
                    locations.map(
                      (location) => ({
                        type: "Feature",
                        id: location.id,
                        geometry: {
                          type: "Point",
                          coordinates: [
                            location.longitude,
                            location.latitude,
                          ],
                        },
                        properties: {
                          locationId:
                            location.id,
                        },
                      })
                    ),
                }}
                hitbox={{
                  width: 30,
                  height: 30,
                }}
                onPress={(event) => {
                  const feature =
                    event.features[0];

                  if (
                    feature?.properties
                      ?.locationId != null
                  ) {
                    handleLocationPress(
                      Number(
                        feature.properties
                          .locationId
                      )
                    );
                  }
                }}
              >
                <Mapbox.SymbolLayer
                  id="location-icons"
                  style={{
                    iconImage: "pin",
                    iconSize: 0.5,
                    iconAllowOverlap: true,
                    iconIgnorePlacement: true,
                  }}
                />
              </Mapbox.ShapeSource>
            </Mapbox.MapView>

            {!showCamera && (
              <>
                <Pressable
                  onPress={myLocation}
                  style={styles.mapButton}
                >
                  <Text
                    style={
                      styles.mapButtonText
                    }
                  >
                    ⌖
                  </Text>
                </Pressable>

                <Pressable
                  onPress={takeLocation}
                  style={[
                    styles.mapButton,
                    styles.cameraButton,
                  ]}
                >
                  <Text
                    style={styles.plusText}
                  >
                    +
                  </Text>
                </Pressable>

                <Pressable
                  onPress={zoomOut}
                  style={[
                    styles.mapButton,
                    styles.zoomButton,
                  ]}
                >
                  <Text
                    style={
                      styles.zoomOutText
                    }
                  >
                    ⊖
                  </Text>
                </Pressable>
              </>
            )}

            {/* Selected location */}
            <BottomSheet
              ref={locationSheetRef}
              index={-1}
              snapPoints={locationSnapPoints}
              enablePanDownToClose
              enableContentPanningGesture
              enableHandlePanningGesture
              backgroundStyle={[
                styles.sheetBackground,
                {
                  backgroundColor:
                    colors.card,
                },
              ]}
              handleIndicatorStyle={[
                styles.handleIndicator,
                {
                  backgroundColor:
                    colors.border,
                },
              ]}
            >
              <BottomSheetScrollView
                style={styles.locationScroll}
                contentContainerStyle={
                  styles.locationContent
                }
                showsVerticalScrollIndicator={
                  false
                }
                nestedScrollEnabled
              >
                {selectedLocation && (
                  <>
                    <View
                      style={
                        styles.sheetHeader
                      }
                    >
                      <Text
                        style={[
                          styles.sheetTitle,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        Location
                      </Text>

                      <Pressable
                        onPress={
                          closeLocation
                        }
                        style={
                          styles.closeButton
                        }
                        hitSlop={8}
                      >
                        <Text
                          style={
                            styles.closeButtonText
                          }
                        >
                          ×
                        </Text>
                      </Pressable>
                    </View>

                    <View
                      style={
                        styles.profileHeader
                      }
                    >
                      <View
                        style={
                          styles.profileIdentity
                        }
                      >
                        {getApiUrl(
                          selectedLocation.profilePicture
                        ) ? (
                          <Image
                            source={{
                              uri: getApiUrl(
                                selectedLocation.profilePicture
                              )!,
                            }}
                            style={
                              styles.profilePicture
                            }
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={
                              styles.profilePlaceholder
                            }
                          >
                            <Text
                              style={
                                styles.profilePlaceholderText
                              }
                            >
                              {(
                                selectedLocation.username ||
                                "?"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </Text>
                          </View>
                        )}

                        <Text
                          style={[
                            styles.username,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          @{selectedLocation.username ||
                            "Unknown User"}
                        </Text>
                      </View>

                      <Pressable
                        onPress={
                          goToLocation
                        }
                        style={[
                          styles.goToLocationHeaderButton,
                          {
                            borderColor:
                              colors.border,
                          },
                        ]}
                      >
                        <MaterialIcons
                          name="location-on"
                          size={18}
                          color={
                            colors.primary
                          }
                        />

                        <Text
                          style={[
                            styles.goToLocationHeaderText,
                            {
                              color:
                                colors.primary,
                            },
                          ]}
                        >
                          Go To Location
                        </Text>
                      </Pressable>
                    </View>

                    {selectedLocation.imageUrl && (
                      <Image
                        source={{
                          uri: getApiUrl(
                            selectedLocation.imageUrl
                          )!,
                        }}
                        style={
                          styles.locationImage
                        }
                        contentFit="contain"
                      />
                    )}

                    <View
                      style={styles.actionRow}
                    >
                      <Pressable
                        onPress={toggleLike}
                        disabled={isLiking}
                        style={
                          styles.actionButton
                        }
                      >
                        <Ionicons
                          name={
                            selectedLocation.likedByMe
                              ? "heart"
                              : "heart-outline"
                          }
                          size={25}
                          color={
                            selectedLocation.likedByMe
                              ? "#E53935"
                              : colors.text
                          }
                        />

                        <Text
                          style={[
                            styles.actionCount,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          {
                            selectedLocation.likeCount
                          }
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={openComments}
                        style={
                          styles.actionButton
                        }
                      >
                        <Ionicons
                          name="chatbubble-outline"
                          size={23}
                          color={colors.text}
                        />

                        <Text
                          style={[
                            styles.actionCount,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          {
                            selectedLocation.commentCount
                          }
                        </Text>
                      </Pressable>

                      <View
                        style={
                          styles.actionRightGroup
                        }
                      >
                        {selectedIsMine && (
                          <Pressable
                            onPress={() =>
                              deleteLocation(
                                selectedLocation.id
                              )
                            }
                            style={[
                              styles.actionButton,
                              styles.trashButton,
                            ]}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={24}
                              color="#B42318"
                            />
                          </Pressable>
                        )}

                        <Pressable
                          onPress={
                            toggleBookmark
                          }
                          disabled={
                            isBookmarking
                          }
                          style={[
                            styles.actionButton,
                            styles.bookmarkButton,
                          ]}
                        >
                          <Ionicons
                            name={
                              selectedLocation.bookmarkedByMe
                                ? "bookmark"
                                : "bookmark-outline"
                            }
                            size={24}
                            color={colors.text}
                          />
                        </Pressable>
                      </View>
                    </View>

                    <View
                      style={
                        styles.descriptionBlock
                      }
                    >
                      <Text
                        style={
                          styles.descriptionLine
                        }
                      >
                        <Text
                          style={[
                            styles.descriptionUsername,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          @{selectedLocation.username ||
                            "Unknown User"}
                        </Text>{" "}
                        <Text
                          style={[
                            styles.description,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          {selectedLocation.description ||
                            "No description available."}
                        </Text>
                      </Text>

                      {!!selectedLocation.createdAt && (
                        <Text
                          style={[
                            styles.createdDate,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          {formatDate(
                            selectedLocation.createdAt
                          )}
                        </Text>
                      )}
                    </View>

                    <View
                      style={
                        styles.infoContainer
                      }
                    >
                      <Collapsible title="Location Info">
                        <View
                          style={
                            styles.infoItem
                          }
                        >
                          <Text
                            style={[
                              styles.infoLabel,
                              {
                                color:
                                  colors.text,
                                opacity: 0.65,
                              },
                            ]}
                          >
                            Latitude
                          </Text>

                          <Text
                            style={[
                              styles.infoValue,
                              {
                                color:
                                  colors.text,
                              },
                            ]}
                          >
                            {selectedLocation.latitude.toFixed(
                              6
                            )}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.infoItem
                          }
                        >
                          <Text
                            style={[
                              styles.infoLabel,
                              {
                                color:
                                  colors.text,
                                opacity: 0.65,
                              },
                            ]}
                          >
                            Longitude
                          </Text>

                          <Text
                            style={[
                              styles.infoValue,
                              {
                                color:
                                  colors.text,
                              },
                            ]}
                          >
                            {selectedLocation.longitude.toFixed(
                              6
                            )}
                          </Text>
                        </View>
                      </Collapsible>
                    </View>

                    <View
                      style={
                        styles.bottomSheetSpacer
                      }
                    />
                  </>
                )}
              </BottomSheetScrollView>
            </BottomSheet>

            {/* Comments */}
            <BottomSheet
              ref={commentsSheetRef}
              index={-1}
              snapPoints={commentsSnapPoints}
              enablePanDownToClose
              enableDynamicSizing={false}
              keyboardBehavior="interactive"
              keyboardBlurBehavior="restore"
              android_keyboardInputMode="adjustResize"
              backgroundStyle={[
                styles.sheetBackground,
                {
                  backgroundColor:
                    colors.card,
                },
              ]}
              handleIndicatorStyle={[
                styles.handleIndicator,
                {
                  backgroundColor:
                    colors.border,
                },
              ]}
              onChange={(index) => {
                if (index === -1) {
                  setCommentMenuId(null);
                  setCommentMenuPosition(null);
                }
              }}
            >
              <View
                style={
                  styles.commentsContainer
                }
              >
                <BottomSheetFlatList
                  data={comments}
                  keyExtractor={(item) =>
                    item.id.toString()
                  }
                  renderItem={renderComment}
                  showsVerticalScrollIndicator={
                    false
                  }
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  contentContainerStyle={
                    styles.commentsListContent
                  }
                  ListHeaderComponent={
                    <View
                      style={
                        styles.commentsHeader
                      }
                    >
                      <View>
                        <Text
                          style={[
                            styles.commentsTitle,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          Comments
                        </Text>

                        <View
                          style={[
                            styles.commentsTitleLine,
                            {
                              backgroundColor:
                                colors.border,
                            },
                          ]}
                        />
                      </View>

                      <Pressable
                        onPress={
                          closeComments
                        }
                        style={
                          styles.closeButton
                        }
                        hitSlop={8}
                      >
                        <Text
                          style={
                            styles.closeButtonText
                          }
                        >
                          ×
                        </Text>
                      </Pressable>
                    </View>
                  }
                  ListEmptyComponent={
                    <View
                      style={
                        styles.emptyComments
                      }
                    >
                      {commentsLoading ? (
                        <Text
                          style={[
                            styles.emptyCommentsText,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          Loading comments...
                        </Text>
                      ) : (
                        <>
                          <Text
                            style={[
                              styles.emptyCommentsText,
                              {
                                color:
                                  colors.text,
                              },
                            ]}
                          >
                            No comments yet.
                          </Text>

                          <Text
                            style={[
                              styles.emptyCommentsSubtext,
                              {
                                color:
                                  colors.text,
                              },
                            ]}
                          >
                            Be the first to comment.
                          </Text>
                        </>
                      )}
                    </View>
                  }
                />

                {/* Fixed comment input */}
                <View
                  style={[
                    styles.commentInputContainer,
                    {
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
                    placeholder="Add a comment..."
                    placeholderTextColor={
                      colors.text
                    }
                    multiline
                    style={[
                      styles.commentInput,
                      {
                        color:
                          colors.text,
                        borderColor:
                          colors.border,
                        backgroundColor:
                          colors.background,
                      },
                    ]}
                    maxLength={500}
                  />

                  <Pressable
                    onPress={
                      submitComment
                    }
                    disabled={
                      !commentText.trim() ||
                      commentSubmitting
                    }
                    style={[
                      styles.sendCommentButton,
                      (!commentText.trim() ||
                        commentSubmitting) &&
                        styles.sendCommentButtonDisabled,
                    ]}
                  >
                    {commentSubmitting ? (
                      <MaterialIcons
                        name="hourglass-empty"
                        size={20}
                        color="#FFFFFF"
                      />
                    ) : (
                      <MaterialIcons
                        name="send"
                        size={20}
                        color="#FFFFFF"
                      />
                    )}
                  </Pressable>
                </View>
              </View>
            </BottomSheet>

            {/* Explore-style three-dot comment menu */}
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
                style={
                  styles.commentMenuOverlay
                }
                onPress={
                  closeCommentMenu
                }
              >
                {commentMenuStyle && (
                  <View
                    style={[
                      styles.commentDeleteMenu,
                      {
                        backgroundColor:
                          colors.card,
                      },
                      commentMenuStyle,
                    ]}
                  >
                    <Pressable
                      style={
                        styles.commentDeleteButton
                      }
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
                        color="#E53935"
                      />

                      <Text
                        style={
                          styles.commentDeleteText
                        }
                      >
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            </Modal>

            {/* Create location */}
            <BottomSheet
              ref={uploadSheetRef}
              index={-1}
              snapPoints={uploadSnapPoints}
              detached
              bottomInset={46}
              enablePanDownToClose={false}
              enableContentPanningGesture={
                false
              }
              enableHandlePanningGesture={
                false
              }
              handleComponent={null}
              keyboardBehavior="interactive"
              keyboardBlurBehavior="restore"
              backgroundStyle={styles.uploadSheetBackground}
              style={styles.uploadSheet}
            >
              <BottomSheetView
                style={styles.uploadContainer}
              >
                <Text
                  style={styles.uploadTitle}
                >
                  Create Location
                </Text>

                {imageUrl && (
                  <Image
                    source={{
                      uri: imageUrl,
                    }}
                    style={
                      styles.uploadImage
                    }
                    contentFit="contain"
                  />
                )}

                <BottomSheetTextInput
                  style={
                    styles.inputConfirm
                  }
                  placeholder="Write a description about your picture..."
                  placeholderTextColor="#888"
                  onChangeText={
                    setDescription
                  }
                  value={description}
                  multiline
                />

                <View
                  style={
                    styles.locationInfo
                  }
                >
                  <Text
                    style={
                      styles.locationLabel
                    }
                  >
                    Location
                  </Text>

                  <Text
                    style={
                      styles.coordinates
                    }
                  >
                    {latitude?.toFixed(5)},{" "}
                    {longitude?.toFixed(5)}
                  </Text>
                </View>

                <Pressable
                  style={
                    styles.uploadButton
                  }
                  onPress={
                    confirmUpload
                  }
                >
                  <Text
                    style={
                      styles.uploadButtonText
                    }
                  >
                    Confirm Upload
                  </Text>
                </Pressable>

                <Pressable
                  style={
                    styles.cancelButton
                  }
                  onPress={closeSheet}
                >
                  <Text
                    style={
                      styles.cancelButtonText
                    }
                  >
                    Cancel
                  </Text>
                </Pressable>
              </BottomSheetView>
            </BottomSheet>

            {showCamera && (
              <View
                style={
                  styles.cameraOverlay
                }
              >
                <CameraComponent
                  onClose={() =>
                    setShowCamera(false)
                  }
                  onImageTaken={async (
                    newImageUrl
                  ) => {
                    try {
                      setImageUrl(
                        newImageUrl
                      );

                      const currentLocation =
                        await Location.getCurrentPositionAsync(
                          {
                            accuracy:
                              Location.Accuracy
                                .Balanced,
                          }
                        );

                      const lat =
                        currentLocation
                          .coords
                          .latitude;

                      const lng =
                        currentLocation
                          .coords
                          .longitude;

                      setLatitude(lat);
                      setLongitude(lng);
                      setShowCamera(false);

                      cameraRef.current?.flyTo(
                        [lng, lat],
                        1000
                      );

                      openSheet();
                    } catch (error) {
                      console.error(
                        "Camera location error:",
                        error
                      );

                      setShowCamera(false);
                    }
                  }}
                />
              </View>
            )}
          </View>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  mapButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  cameraButton: {
    bottom: 100,
  },

  zoomButton: {
    left: 20,
    right: undefined,
  },

  mapButtonText: {
    fontSize: 25,
    color: "white",
  },

  plusText: {
    fontSize: 32,
    fontWeight: "300",
    color: "white",
    lineHeight: 34,
  },

  zoomOutText: {
    fontSize: 32,
    fontWeight: "300",
    color: "white",
    lineHeight: 34,
  },

  sheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  handleIndicator: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#C7C7C7",
  },

  locationScroll: {
    flex: 1,
  },

  locationContent: {
    paddingBottom: 40,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    marginBottom: 10,
  },

  sheetTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
  },

  closeButton: {
    position: "absolute",
    right: 16,
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEEEEE",
    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonText: {
    fontSize: 24,
    color: "#444",
    lineHeight: 26,
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  profileIdentity: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },

  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  profilePlaceholderText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#666",
  },

  username: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },

  locationImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    marginBottom: 8,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  actionRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    minHeight: 36,
  },

  trashButton: {
    marginRight: 10,
  },

  bookmarkButton: {
    marginRight: 0,
  },

  actionIcon: {
    marginRight: 7,
  },

  actionCount: {
    fontSize: 14,
    color: "#222",
    fontWeight: "700",
    marginLeft: 7,
  },

  activeLike: {
    color: "#E53935",
  },

  activeBookmark: {
    color: "#222",
  },

  descriptionBlock: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 18,
  },

  descriptionLine: {
    fontSize: 14,
    lineHeight: 21,
  },

  descriptionUsername: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    marginRight: 6,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#222",
  },

  createdDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
  },

  infoContainer: {
    marginHorizontal: 16,
    borderTopColor: "#EEEEEE",
    paddingTop: 2,
    paddingBottom: 12,
  },

  infoItem: {
    paddingHorizontal: 4,
    paddingVertical: 9,
  },

  infoLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },

  goToLocationHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 16,
    marginLeft: 8,
  },

  goToLocationHeaderText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "600",
  },

  goToLocationButton: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
  },

  goToLocationText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  bottomSheetSpacer: {
    height: 12,
  },

  /*
   * Comments
   */
  commentsContainer: {
    flex: 1,
  },

  commentsHeader: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  commentsTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  commentsTitleLine: {
    height: 1,
    marginTop: 8,
    width: 110,
  },

  commentsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  emptyComments: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },

  emptyCommentsText: {
    fontSize: 15,
    fontWeight: "600",
  },

  emptyCommentsSubtext: {
    fontSize: 13,
    marginTop: 5,
    opacity: 0.55,
  },

  commentRow: {
    flexDirection: "row",
    paddingVertical: 10,
  },

  commentProfilePicture: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },

  commentProfilePlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  commentProfilePlaceholderText: {
    fontSize: 15,
    fontWeight: "700",
  },

  commentBody: {
    flex: 1,
    minWidth: 0,
  },

  commentTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },

  commentTextRow: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 21,
  },

  commentUsername: {
    fontSize: 14,
    fontWeight: "700",
  },

  commentText: {
    fontSize: 15,
    lineHeight: 21,
  },

  commentDate: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 5,
  },

  commentMenuButton: {
    width: 32,
    height: 32,
    marginLeft: 6,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 1,
    flexShrink: 0,
  },

  /*
   * Explore-style transparent menu overlay
   */
  commentMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },

  commentDeleteMenu: {
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

  commentDeleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  commentDeleteText: {
    color: "#E53935",
    marginLeft: 10,
    fontSize: 15,
  },

  /*
   * Comment input
   */
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
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
    marginRight: 8,
  },

  sendCommentButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
  },

  sendCommentButtonDisabled: {
    opacity: 0.45,
  },

  /*
   * Upload
   */
  /*
   * Upload
   */
  uploadSheet: {
    marginHorizontal: 24,
  },

  uploadContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  uploadTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },

  uploadImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 0,
    marginBottom: 16,
  },

  inputConfirm: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111",
    textAlignVertical: "top",
    marginBottom: 16,
  },

  locationInfo: {
    paddingVertical: 10,
    marginBottom: 12,
  },

  locationLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },

  coordinates: {
    fontSize: 14,
    color: "#444",
  },

  uploadButton: {
    height: 52,
    borderRadius: 2,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  cancelButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
  uploadSheetBackground: {
  backgroundColor: "#fff",
  borderRadius: 5,
},

  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
  },
});