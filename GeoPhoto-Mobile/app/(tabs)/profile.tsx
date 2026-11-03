import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";

import { useAuth } from "../../context/AuthContext";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

import * as SecureStore from "expo-secure-store";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@react-navigation/native";

import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";

const API_URL = "https://geophoto-production-581e.up.railway.app";

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

type ProfileTab = "locations" | "bookmarks";

type CommentMenuPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function Profile() {
  const { authenticatedRequest, user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [locations, setLocations] = useState<Location[]>(
    []
  );

  const [bookmarks, setBookmarks] = useState<Location[]>(
    []
  );

  const [activeTab, setActiveTab] =
    useState<ProfileTab>("locations");

  const [showPosts, setShowPosts] = useState(false);
  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const [profilePicture, setProfilePicture] =
    useState<string | null>(null);

  const [showPicture, setShowPicture] =
    useState(false);

  const [showOptions, setShowOptions] =
    useState(false);

  /*
   * Comments
   */

  const [selectedLocation, setSelectedLocation] =
    useState<Location | null>(null);

  const [comments, setComments] = useState<Comment[]>(
    []
  );

  const [commentText, setCommentText] =
    useState("");

  const [commentsLoading, setCommentsLoading] =
    useState(false);

  const [commentSending, setCommentSending] =
    useState(false);

  const [commentMenuId, setCommentMenuId] =
    useState<number | null>(null);

  const [commentMenuPosition, setCommentMenuPosition] =
    useState<CommentMenuPosition | null>(null);

  const [locationMenuId, setLocationMenuId] =
    useState<number | null>(null);

  const [locationMenuPosition, setLocationMenuPosition] =
    useState<CommentMenuPosition | null>(null);

  const commentButtonRefs =
    useRef<Record<number, any>>({});

  const locationButtonRefs =
    useRef<Record<number, any>>({});

  const commentsSheetRef =
    useRef<BottomSheet>(null);

  const postsListRef =
    useRef<FlatList<Location>>(null);

  const commentSnapPoints = useMemo(
    () => ["75%"],
    []
  );

  const activeLocations =
    activeTab === "locations"
      ? locations
      : bookmarks;

  /*
   * Profile picture upload
   */

  const takeProfilePicture = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Camera Permission",
        "MapApp needs camera access to take a profile picture."
      );
      return;
    }

    const result =
      await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

    if (result.canceled) {
      return;
    }

    try {
      const image = result.assets[0];

      const formData = new FormData();

      formData.append("image", {
        uri: image.uri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);

      const uploadResponse = await authenticatedRequest(
        `${API_URL}/images/profile`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(
          `Image upload failed: ${uploadResponse.status}`
        );
      }

      const uploadData =
        await uploadResponse.json();

      const storedToken =
        await SecureStore.getItemAsync("token");

      const profileResponse = await authenticatedRequest(
        `${API_URL}/users/profile-picture`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer " + storedToken,
          },
          body: JSON.stringify({
            profilePicture:
              uploadData.imageUrl,
          }),
        }
      );

      if (!profileResponse.ok) {
        throw new Error(
          `Profile update failed: ${profileResponse.status}`
        );
      }

      setProfilePicture(
        uploadData.imageUrl
      );

      setShowOptions(false);
    } catch (error) {
      console.log(
        "Profile picture error:",
        error
      );

      Alert.alert(
        "Profile Picture Error",
        "Something went wrong updating your profile picture."
      );
    }
  };

  const chooseProfilePicture = async () => {
    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

    if (result.canceled) {
      return;
    }

    try {
      const image = result.assets[0];

      const formData = new FormData();

      formData.append("image", {
        uri: image.uri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);

      const uploadResponse = await authenticatedRequest(
        `${API_URL}/images/profile`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(
          `Image upload failed: ${uploadResponse.status}`
        );
      }

      const uploadData =
        await uploadResponse.json();

      const storedToken =
        await SecureStore.getItemAsync("token");

      const profileResponse = await authenticatedRequest(
        `${API_URL}/users/profile-picture`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer " + storedToken,
          },
          body: JSON.stringify({
            profilePicture:
              uploadData.imageUrl,
          }),
        }
      );

      if (!profileResponse.ok) {
        throw new Error(
          `Profile update failed: ${profileResponse.status}`
        );
      }

      setProfilePicture(
        uploadData.imageUrl
      );

      setShowOptions(false);
    } catch (error) {
      console.log(
        "Profile picture error:",
        error
      );

      Alert.alert(
        "Profile Picture Error",
        "Something went wrong updating your profile picture."
      );
    }
  };

  /*
   * Fetch locations
   */

  const fetchLocations = async () => {
    try {
      const storedToken =
        await SecureStore.getItemAsync("token");

      const headers: HeadersInit = {};

      if (storedToken) {
        headers.Authorization =
          "Bearer " + storedToken;
      }

      const response = await authenticatedRequest(
        `${API_URL}/locations`,
        {
          headers,
        }
      );

      if (!response.ok) {
        console.log(
          "Failed to fetch locations:",
          response.status
        );
        return;
      }

      const data: Location[] =
        await response.json();

      const myLocationsResponse =
        await authenticatedRequest(
          `${API_URL}/locations/me`,
          {
            headers,
          }
        );

      if (!myLocationsResponse.ok) {
        console.log(
          "Failed to fetch my locations:",
          myLocationsResponse.status
        );
        return;
      }

      const myLocations: Location[] =
        await myLocationsResponse.json();

      const myLocationIds =
        new Set(
          myLocations.map(
            (location) => location.id
          )
        );

      const myFullLocations =
        data.filter((location) =>
          myLocationIds.has(location.id)
        );

      setLocations(
        myFullLocations
      );

      const myBookmarks =
        data.filter(
          (location) =>
            location.bookmarkedByMe === true
        );

      setBookmarks(myBookmarks);
    } catch (error) {
      console.log(
        "Error fetching locations:",
        error
      );
    }
  };

  /*
   * Fetch profile
   */

  const fetchProfile = async () => {
    try {
      const storedToken =
        await SecureStore.getItemAsync("token");

      const res = await authenticatedRequest(
        `${API_URL}/me`,
        {
          headers: {
            Authorization:
              "Bearer " + storedToken,
          },
        }
      );

      if (!res.ok) {
        console.log(
          "Failed to fetch profile:",
          res.status
        );
        return;
      }

      const data =
        await res.json();

      setProfilePicture(
        data.profilePicture
      );
    } catch (error) {
      console.log(
        "Error fetching profile:",
        error
      );
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchProfile();
  }, []);

  /*
   * Post navigation
   */

  const openPost = (index: number) => {
    setSelectedIndex(index);
    setShowPosts(true);

    setTimeout(() => {
      postsListRef.current?.scrollToIndex({
        index,
        animated: false,
      });
    }, 100);
  };

  const closePosts = () => {
    setShowPosts(false);
  };

  /*
   * Likes
   */

  const handleLike = async (
    location: Location
  ) => {
    try {
      const storedToken =
        await SecureStore.getItemAsync("token");

      if (!storedToken) {
        Alert.alert(
          "Login Required",
          "You need to be logged in to like a location."
        );
        return;
      }

      const response = await authenticatedRequest(
        `${API_URL}/locations/${location.id}/like`,
        {
          method: location.likedByMe
            ? "DELETE"
            : "POST",
          headers: {
            Authorization:
              "Bearer " + storedToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Like request failed: ${response.status}`
        );
      }

      const liked =
        !location.likedByMe;

      const updateLocation = (
        item: Location
      ): Location => {
        if (item.id !== location.id) {
          return item;
        }

        return {
          ...item,
          likedByMe: liked,
          likeCount: liked
            ? item.likeCount + 1
            : Math.max(
                0,
                item.likeCount - 1
              ),
        };
      };

      setLocations((current) =>
        current.map(updateLocation)
      );

      setBookmarks((current) =>
        current.map(updateLocation)
      );
    } catch (error) {
      console.log(
        "Like error:",
        error
      );

      Alert.alert(
        "Like Error",
        "Something went wrong updating the like."
      );
    }
  };

  /*
   * Comments
   */

  const openComments = async (
    location: Location
  ) => {
    setSelectedLocation(location);
    setComments([]);
    setCommentText("");
    setCommentMenuId(null);
    setCommentMenuPosition(null);
    setLocationMenuId(null);
    setLocationMenuPosition(null);

    commentsSheetRef.current?.snapToIndex(0);

    setCommentsLoading(true);

    try {
      const storedToken =
        await SecureStore.getItemAsync("token");

      const headers: HeadersInit = {};

      if (storedToken) {
        headers.Authorization =
          "Bearer " + storedToken;
      }

      const response = await authenticatedRequest(
        `${API_URL}/locations/${location.id}/comments`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Comments request failed: ${response.status}`
        );
      }

      const data =
        await response.json();

      setComments(data);
    } catch (error) {
      console.log(
        "Comments error:",
        error
      );

      Alert.alert(
        "Comments Error",
        "Something went wrong loading the comments."
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSendComment = async () => {
    const trimmedText =
      commentText.trim();

    if (!trimmedText) {
      return;
    }

    if (!selectedLocation) {
      return;
    }

    try {
      setCommentSending(true);

      const storedToken =
        await SecureStore.getItemAsync("token");

      if (!storedToken) {
        Alert.alert(
          "Login Required",
          "You need to be logged in to comment."
        );
        return;
      }

      const response = await authenticatedRequest(
        `${API_URL}/locations/${selectedLocation.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              "Bearer " + storedToken,
          },
          body: JSON.stringify({
            text: trimmedText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Comment request failed: ${response.status}`
        );
      }

      /*
       * Refetch so the new comment gets:
       *
       * username
       * profilePicture
       * isMine
       * createdAt
       */
      const commentsResponse =
        await authenticatedRequest(
          `${API_URL}/locations/${selectedLocation.id}/comments`,
          {
            headers: {
              Authorization:
                "Bearer " + storedToken,
            },
          }
        );

      if (!commentsResponse.ok) {
        throw new Error(
          `Comments refresh failed: ${commentsResponse.status}`
        );
      }

      const updatedComments =
        await commentsResponse.json();

      setComments(
        updatedComments
      );

      setCommentText("");

      const updateCommentCount = (
        item: Location
      ): Location => {
        if (
          item.id !==
          selectedLocation.id
        ) {
          return item;
        }

        return {
          ...item,
          commentCount:
            item.commentCount + 1,
        };
      };

      setLocations((current) =>
        current.map(
          updateCommentCount
        )
      );

      setBookmarks((current) =>
        current.map(
          updateCommentCount
        )
      );

      setSelectedLocation(
        (current) =>
          current
            ? {
                ...current,
                commentCount:
                  current.commentCount +
                  1,
              }
            : current
      );
    } catch (error) {
      console.log(
        "Send comment error:",
        error
      );

      Alert.alert(
        "Comment Error",
        "Something went wrong adding your comment."
      );
    } finally {
      setCommentSending(false);
    }
  };

  const handleDeleteComment = (
    comment: Comment
  ) => {
    if (!selectedLocation) {
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
              const storedToken =
                await SecureStore.getItemAsync(
                  "token"
                );

              if (!storedToken) {
                return;
              }

              const response =
                await authenticatedRequest(
                  `${API_URL}/locations/${selectedLocation.id}/comments/${comment.id}`,
                  {
                    method: "DELETE",
                    headers: {
                      Authorization:
                        "Bearer " +
                        storedToken,
                    },
                  }
                );

              if (!response.ok) {
                throw new Error(
                  `Delete comment failed: ${response.status}`
                );
              }

              setComments(
                (current) =>
                  current.filter(
                    (item) =>
                      item.id !==
                      comment.id
                  )
              );

              const updateCommentCount = (
                item: Location
              ): Location => {
                if (
                  item.id !==
                  selectedLocation.id
                ) {
                  return item;
                }

                return {
                  ...item,
                  commentCount:
                    Math.max(
                      0,
                      item.commentCount -
                        1
                    ),
                };
              };

              setLocations((current) =>
                current.map(
                  updateCommentCount
                )
              );

              setBookmarks((current) =>
                current.map(
                  updateCommentCount
                )
              );

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
              console.log(
                "Delete comment error:",
                error
              );

              Alert.alert(
                "Delete Error",
                "Something went wrong deleting the comment."
              );
            }
          },
        },
      ]
    );
  };

  /*
   * Location delete
   */

  const handleDeleteLocation = (
    location: Location
  ) => {
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
              const storedToken =
                await SecureStore.getItemAsync(
                  "token"
                );

              if (!storedToken) {
                return;
              }

              const response = await authenticatedRequest(
                `${API_URL}/locations/${location.id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization:
                      "Bearer " + storedToken,
                  },
                }
              );

              if (!response.ok) {
                throw new Error(
                  `Delete location failed: ${response.status}`
                );
              }

              setLocations((current) =>
                current.filter(
                  (item) => item.id !== location.id
                )
              );

              setBookmarks((current) =>
                current.filter(
                  (item) => item.id !== location.id
                )
              );

              setLocationMenuId(null);
              setLocationMenuPosition(null);

              if (selectedLocation?.id === location.id) {
                commentsSheetRef.current?.close();
                setSelectedLocation(null);
                setComments([]);
              }

              setShowPosts(false);
            } catch (error) {
              console.log(
                "Delete location error:",
                error
              );

              Alert.alert(
                "Delete Error",
                "Something went wrong deleting the location."
              );
            }
          },
        },
      ]
    );
  };

  const openLocationMenu = (
    locationId: number
  ) => {
    const button =
      locationButtonRefs.current[locationId];

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
        setLocationMenuPosition({
          x,
          y,
          width,
          height,
        });

        setLocationMenuId(locationId);
      }
    );
  };

  const closeLocationMenu = () => {
    setLocationMenuId(null);
    setLocationMenuPosition(null);
  };

  /*
   * Comment menu
   */

  const openCommentMenu = (
    commentId: number
  ) => {
    const button =
      commentButtonRefs.current[
        commentId
      ];

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

        setCommentMenuId(
          commentId
        );
      }
    );
  };

  const closeCommentMenu = () => {
    setCommentMenuId(null);
    setCommentMenuPosition(null);
  };

  const renderComment = ({
    item,
  }: {
    item: Comment;
  }) => {
    const commentProfilePicture =
      item.profilePicture
        ? item.profilePicture.startsWith(
            "http"
          )
          ? item.profilePicture
          : `${API_URL}${item.profilePicture}`
        : null;

    return (
      <View style={styles.commentRow}>
        {commentProfilePicture ? (
          <Image
            source={{
              uri: commentProfilePicture,
            }}
            style={
              styles.commentProfilePicture
            }
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.commentProfilePicture,
              styles.defaultCommentProfilePicture,
              {
                backgroundColor:
                  colors.border,
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

        <View
          style={styles.commentContent}
        >
          <View
            style={styles.commentTopRow}
          >
            <View
              style={styles.commentTextRow}
            >
              <ThemedText type="defaultSemiBold">
                @{item.username ??
                  "unknown"}
              </ThemedText>

              <ThemedText
                style={
                  styles.commentText
                }
              >
                {" "}
                {item.text}
              </ThemedText>
            </View>

            {item.isMine && (
              <Pressable
                ref={(ref) => {
                  commentButtonRefs.current[
                    item.id
                  ] = ref;
                }}
                onPress={() =>
                  openCommentMenu(
                    item.id
                  )
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

          <ThemedText
            style={styles.commentDate}
          >
            {formatDate(
              item.createdAt
            )}
          </ThemedText>
        </View>
      </View>
    );
  };

  const formatDate = (
    dateString: string
  ) => {
    const date =
      new Date(dateString);

    return date.toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const getProfilePictureUri = (
    picture: string | null
  ) => {
    if (!picture) {
      return null;
    }

    return picture.startsWith("http")
      ? picture
      : `${API_URL}${picture}`;
  };

  /*
   * Comment popup positioning
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
        screenWidth -
          menuWidth -
          8
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
        screenHeight -
          menuHeight -
          8
      ),
    };
  }

  let locationMenuStyle: {
    left: number;
    top: number;
  } | null = null;

  if (locationMenuPosition) {
    const desiredLeft =
      locationMenuPosition.x +
      locationMenuPosition.width -
      menuWidth;

    const left = Math.max(
      8,
      Math.min(
        desiredLeft,
        screenWidth - menuWidth - 8
      )
    );

    const desiredTop =
      locationMenuPosition.y -
      menuHeight -
      menuSpacing;

    const top =
      desiredTop >= 8
        ? desiredTop
        : locationMenuPosition.y +
          locationMenuPosition.height +
          menuSpacing;

    locationMenuStyle = {
      left,
      top: Math.min(
        top,
        screenHeight - menuHeight - 8
      ),
    };
  }

  /*
   * Full post view
   */

  if (showPosts) {
    return (
      <SafeAreaView
        style={[
          styles.fullScreen,
          {
            backgroundColor: colors.background,
          },
        ]}
        edges={["top"]}
      >
        <View
          style={[
            styles.postHeader,
            {
              borderBottomColor:
                colors.border,
            },
          ]}
        >
          <Pressable
            onPress={closePosts}
            style={styles.backButton}
          >
            <ThemedText
              style={styles.backText}
            >
              ‹
            </ThemedText>
          </Pressable>

          <ThemedText
            type="subtitle"
            style={styles.postHeaderTitle}
          >
            {activeTab === "locations"
              ? "My Locations"
              : "Bookmarks"}
          </ThemedText>
        </View>

        <FlatList
          ref={postsListRef}
          data={activeLocations}
          style={{
            backgroundColor: colors.card,
          }}
          contentContainerStyle={{
            backgroundColor: colors.card,
          }}
          keyExtractor={(item) =>
            item.id.toString()
          }
          extraData={[
            activeTab,
            locations,
            bookmarks,
          ]}
          renderItem={({
            item,
          }) => {
            const itemProfilePicture =
              getProfilePictureUri(
                item.profilePicture
              );

            return (
              <View
              style={[
                styles.post,
                {
                  backgroundColor: colors.card,
                },
              ]}
            >
                {/* Top profile row + location actions */}
                <View style={styles.postUser}>
                  <View style={styles.postUserInfo}>
                    {itemProfilePicture ? (
                      <Image
                        source={{
                          uri: itemProfilePicture,
                        }}
                        style={styles.postProfilePicture}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.postProfilePicture,
                          styles.defaultPostProfilePicture,
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

                    <ThemedText
                      type="defaultSemiBold"
                      numberOfLines={1}
                      style={styles.postUsername}
                    >
                      @{item.username ?? "unknown"}
                    </ThemedText>
                  </View>

                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/",
                        params: {
                          locationId: item.id.toString(),
                        },
                      })
                    }
                    style={[
                      styles.goToLocationButton,
                      {
                        borderColor: colors.border,
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

                  {activeTab === "locations" && (
                    <Pressable
                      ref={(ref) => {
                        locationButtonRefs.current[item.id] = ref;
                      }}
                      onPress={() =>
                        openLocationMenu(item.id)
                      }
                      style={styles.locationOptionsButton}
                      hitSlop={8}
                    >
                      <MaterialIcons
                        name="more-vert"
                        size={24}
                        color={colors.text}
                      />
                    </Pressable>
                  )}
                </View>

                {/* Image */}
                {item.imageUrl ? (
                  <Image
                    source={{
                      uri: item.imageUrl,
                    }}
                    style={
                      styles.postImage
                    }
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.postImage,
                      styles.imagePlaceholder,
                      {
                        backgroundColor:
                          colors.border,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="image-not-supported"
                      size={40}
                      color={colors.text}
                    />
                  </View>
                )}

                <View
                  style={styles.postInformation}
                >
                  {/* Like + comment buttons */}
                  <View
                    style={
                      styles.postActions
                    }
                  >
                    <Pressable
                      onPress={() =>
                        handleLike(item)
                      }
                      style={
                        styles.postAction
                      }
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
                        style={
                          styles.actionCount
                        }
                      >
                        {item.likeCount ??
                          0}
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        openComments(item)
                      }
                      style={
                        styles.postAction
                      }
                    >
                      <MaterialIcons
                        name="chat-bubble-outline"
                        size={25}
                        color={
                          colors.text
                        }
                      />

                      <ThemedText
                        style={
                          styles.actionCount
                        }
                      >
                        {item.commentCount ??
                          0}
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* Username + description */}
                  <View
                    style={
                      styles.descriptionRow
                    }
                  >
                    <ThemedText
                      type="defaultSemiBold"
                    >
                      {item.username ??
                        "unknown"}
                    </ThemedText>

                    <ThemedText
                      style={
                        styles.description
                      }
                    >
                      {" "}
                      {item.description ||
                        "No description available."}
                    </ThemedText>
                  </View>

                  {/* Date */}
                  <ThemedText
                    style={
                      styles.postDate
                    }
                  >
                    {formatDate(
                      item.createdAt
                    )}
                  </ThemedText>
                </View>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={(
            info
          ) => {
            setTimeout(() => {
              postsListRef.current?.scrollToOffset(
                {
                  offset:
                    info.averageItemLength *
                    info.index,
                  animated: false,
                }
              );
            }, 100);
          }}
        />

        {/* Comments Bottom Sheet */}
        <BottomSheet
          ref={commentsSheetRef}
          index={-1}
          snapPoints={commentSnapPoints}
          enableDynamicSizing={false}
          enablePanDownToClose
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          backgroundStyle={{
            backgroundColor:
              colors.card,
          }}
          handleIndicatorStyle={{
            backgroundColor:
              colors.border,
          }}
          onClose={() => {
            setSelectedLocation(null);
            setComments([]);
            setCommentText("");
            closeCommentMenu();
            closeLocationMenu();
          }}
        >
          <View
            style={styles.bottomSheetContainer}
          >
            <View
              style={[
                styles.commentsHeader,
              {
                borderBottomColor: colors.border,
              },
            ]}
          >
            <ThemedText type="subtitle">
              Comments
            </ThemedText>
          </View>

          <BottomSheetFlatList
            data={comments}
            keyExtractor={(item) =>
              item.id.toString()
            }
            renderItem={renderComment}
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.commentsList,
              { flexGrow: 1 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
            ListEmptyComponent={
              commentsLoading ? (
                <View
                  style={
                    styles.commentsLoading
                  }
                >
                  <ActivityIndicator
                    size="small"
                    color={colors.text}
                  />
                </View>
              ) : (
                <View
                  style={
                    styles.noComments
                  }
                >
                  <ThemedText>
                    No comments yet.
                  </ThemedText>

                  <ThemedText
                    style={
                      styles.noCommentsSubtext
                    }
                  >
                    Be the first to comment.
                  </ThemedText>
                </View>
              )
            }
          />

            <View
              style={[
                styles.commentInputContainer,
                {
                  backgroundColor:
                    colors.card,
                  borderTopColor:
                    colors.border,
                  paddingBottom: Math.max(
                    insets.bottom,
                    10
                  ),
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
                colors.text + "80"
              }
              multiline
              style={[
                styles.commentInput,
                {
                  color: colors.text,
                  borderColor:
                    colors.border,
                  backgroundColor:
                    colors.background,
                },
              ]}
              editable={!commentSending}
            />

            <Pressable
              onPress={
                handleSendComment
              }
              disabled={
                commentSending ||
                !commentText.trim()
              }
              style={[
                styles.commentSendButton,
                {
                  backgroundColor: colors.primary,
                  opacity:
                    commentSending ||
                    !commentText.trim()
                      ? 0.4
                      : 1,
                },
              ]}
            >
              {commentSending ? (
                <ActivityIndicator
                  size="small"
                  color={colors.text}
                />
              ) : (
                <MaterialIcons
                  name="send"
                  size={23}
                  color="#fff"
                />
              )}
            </Pressable>
            </View>
          </View>
        </BottomSheet>

        {/* Location delete menu */}
        <Modal
          transparent
          visible={
            locationMenuId !== null &&
            locationMenuPosition !== null
          }
          animationType="fade"
          onRequestClose={closeLocationMenu}
        >
          <Pressable
            style={styles.commentMenuOverlay}
            onPress={closeLocationMenu}
          >
            {locationMenuStyle && (
              <View
                style={[
                  styles.commentMenu,
                  {
                    backgroundColor: colors.card,
                  },
                  locationMenuStyle,
                ]}
              >
                <Pressable
                  style={styles.commentMenuItem}
                  onPress={() => {
                    const location = activeLocations.find(
                      (item) => item.id === locationMenuId
                    );

                    closeLocationMenu();

                    if (location) {
                      handleDeleteLocation(location);
                    }
                  }}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={20}
                    color="#e53935"
                  />

                  <ThemedText
                    style={styles.commentMenuDeleteText}
                  >
                    Delete
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Modal>

        {/* Comment delete menu */}
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
                  styles.commentMenu,
                  {
                    backgroundColor:
                      colors.card,
                  },
                  commentMenuStyle,
                ]}
              >
                <Pressable
                  style={
                    styles.commentMenuItem
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
      </SafeAreaView>
    );
  }

  /*
   * Profile page
   */

  return (
    <SafeAreaView
      style={styles.fullScreen}
      edges={["top"]}
    >
      <ThemedView
        style={styles.profileContainer}
      >
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.headerTop}>
            <ThemedText type="subtitle">
              @{user?.username}
            </ThemedText>

            <Pressable
              onPress={() =>
                router.push("../settings")
              }
              style={
                styles.settingsButton
              }
            >
              <MaterialIcons
                name="settings"
                size={26}
                color="gray"
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() =>
              setShowPicture(true)
            }
            style={
              styles.profilePictureButton
            }
          >
            {profilePicture ? (
              <Image
                source={{
                  uri: profilePicture,
                }}
                style={
                  styles.profilePicture
                }
                contentFit="cover"
              />
            ) : (
              <MaterialIcons
                name="person"
                size={55}
                color="gray"
              />
            )}
          </Pressable>
        </View>

        {/* Collection tabs */}
        <View
          style={[
            styles.collectionTabs,
            {
              borderColor:
                colors.border,
              backgroundColor:
                colors.card,
            },
          ]}
        >
          <Pressable
            onPress={() =>
              setActiveTab("locations")
            }
            style={[
              styles.collectionTab,
              activeTab ===
                "locations" && {
                borderBottomColor:
                  colors.text,
              },
            ]}
          >
            <MaterialIcons
              name="grid-on"
              size={25}
              color={colors.text}
            />
          </Pressable>

          <Pressable
            onPress={() =>
              setActiveTab("bookmarks")
            }
            style={[
              styles.collectionTab,
              activeTab ===
                "bookmarks" && {
                borderBottomColor:
                  colors.text,
              },
            ]}
          >
            <MaterialIcons
              name="bookmark-border"
              size={27}
              color={colors.text}
            />
          </Pressable>
        </View>

        {/* Location / bookmark grid */}
        <FlatList
          data={activeLocations}
          numColumns={3}
          keyExtractor={(item) =>
            item.id.toString()
          }
          extraData={[
            activeTab,
            locations,
            bookmarks,
          ]}
          renderItem={({
            item,
            index,
          }) => (
            <Pressable
              onPress={() =>
                openPost(index)
              }
              style={
                styles.thumbnailContainer
              }
            >
              {item.imageUrl ? (
                <Image
                  source={{
                    uri: item.imageUrl,
                  }}
                  style={styles.thumbnail}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    styles.thumbnail,
                    styles.imagePlaceholder,
                    {
                      backgroundColor:
                        colors.border,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="image-not-supported"
                    size={25}
                    color={colors.text}
                  />
                </View>
              )}
            </Pressable>
          )}
          showsVerticalScrollIndicator={
            false
          }
          ListEmptyComponent={
            <View
              style={
                styles.emptyCollection
              }
            >
              <MaterialIcons
                name={
                  activeTab ===
                  "locations"
                    ? "grid-on"
                    : "bookmark-border"
                }
                size={42}
                color={colors.text}
              />

              <ThemedText
                style={
                  styles.emptyCollectionText
                }
              >
                {activeTab ===
                "locations"
                  ? "You haven't posted any locations yet."
                  : "You haven't bookmarked any locations yet."}
              </ThemedText>
            </View>
          }
        />

        {/* Enlarged profile picture */}
        <Modal
          visible={showPicture}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setShowPicture(false)
          }
        >
          <View
            style={styles.pictureModal}
          >
            <Pressable
              style={
                styles.modalBackground
              }
              onPress={() =>
                setShowPicture(false)
              }
            />

            <View
              style={
                styles.largePictureContainer
              }
            >
              {profilePicture ? (
                <Image
                  source={{
                    uri: profilePicture,
                  }}
                  style={
                    styles.largeProfilePicture
                  }
                  contentFit="cover"
                />
              ) : (
                <View
                  style={
                    styles.largePlaceholder
                  }
                >
                  <MaterialIcons
                    name="person"
                    size={100}
                    color="gray"
                  />
                </View>
              )}
            </View>

            <Pressable
              onPress={() => {
                setShowPicture(false);
                setShowOptions(true);
              }}
              style={
                styles.editPictureButton
              }
            >
              <ThemedText type="defaultSemiBold">
                Change Profile Picture
              </ThemedText>
            </Pressable>
          </View>
        </Modal>

        {/* Change profile picture options */}
        <Modal
          visible={showOptions}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setShowOptions(false)
          }
        >
          <View
            style={
              styles.optionsBackground
            }
          >
            <ThemedView
              style={
                styles.optionsContainer
              }
            >
              <View
                style={styles.optionsHeader}
              >
                <ThemedText type="subtitle">
                  Change Profile Picture
                </ThemedText>

                <Pressable
                  onPress={() =>
                    setShowOptions(false)
                  }
                  style={
                    styles.optionsCloseButton
                  }
                >
                  <MaterialIcons
                    name="close"
                    size={24}
                    color="gray"
                  />
                </Pressable>
              </View>

              <Pressable
                onPress={takeProfilePicture}
                style={styles.option}
              >
                <MaterialIcons
                  name="photo-camera"
                  size={24}
                  color="gray"
                />

                <ThemedText>
                  Take Photo
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={
                  chooseProfilePicture
                }
                style={styles.option}
              >
                <MaterialIcons
                  name="photo-library"
                  size={24}
                  color="gray"
                />

                <ThemedText>
                  Choose from Camera Roll
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() =>
                  setShowOptions(false)
                }
                style={
                  styles.cancelOption
                }
              >
                <ThemedText type="defaultSemiBold">
                  Cancel
                </ThemedText>
              </Pressable>
            </ThemedView>
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },

  profileContainer: {
    flex: 1,
  },

  profileHeader: {
    padding: 20,
    gap: 5,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  profilePictureButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  profilePicture: {
    width: "100%",
    height: "100%",
  },

  /*
   * Collection tabs
   */

  collectionTabs: {
    height: 52,
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 1,
    borderRightWidth: 0,
    borderLeftWidth: 0,
    overflow: "hidden",
  },

  collectionTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },

  /*
   * Empty collection
   */

  emptyCollection: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 70,
    paddingHorizontal: 30,
  },

  emptyCollectionText: {
    textAlign: "center",
    marginTop: 12,
    opacity: 0.7,
  },

  /*
   * Profile picture modal
   */

  pictureModal: {
    flex: 1,
    backgroundColor:
      "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBackground: {
    ...StyleSheet.absoluteFillObject,
  },

  largePictureContainer: {
    width: 300,
    height: 300,
    borderRadius: 150,
    overflow: "hidden",
  },

  largeProfilePicture: {
    width: "100%",
    height: "100%",
  },

  largePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },

  editPictureButton: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  /*
   * Change profile picture modal
   */

  optionsBackground: {
    flex: 1,
    backgroundColor:
      "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  optionsContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },

  optionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  optionsCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  option: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  cancelOption: {
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  /*
   * Grid
   */

  thumbnailContainer: {
    width: "33.333%",
    aspectRatio: 1,
    padding: 1,
  },

  thumbnail: {
    width: "100%",
    height: "100%",
  },

  /*
   * Full post
   */

  postHeader: {
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },

  backButton: {
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 40,
    lineHeight: 40,
  },

  postHeaderTitle: {
    marginLeft: 5,
  },

  post: {
    width: "100%",
  },

  /*
   * Top profile row
   */

  postUser: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    gap: 8,
  },

  postUserInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  postUsername: {
    flexShrink: 1,
  },

  postProfilePicture: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  defaultPostProfilePicture: {
    justifyContent: "center",
    alignItems: "center",
  },

  /*
   * Image
   *
   * Deliberately unchanged from your
   * original Profile implementation.
   */

  postImage: {
    width: "100%",
    aspectRatio: 4 / 3,
  },

  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },

  /*
   * Post information
   */

  postInformation: {
    padding: 15,
  },

  /*
   * Likes / comments
   */

  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 14,
  },

  postAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  actionCount: {
    fontSize: 14,
  },

  /*
   * Profile + Go To Location
   *
   * This is intentionally a fixed row.
   * The button cannot be pushed below
   * the username.
   */

  postMetaRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  postMetaUser: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 12,
  },

  metaProfilePicture: {
    width: 34,
    height: 34,
    borderRadius: 17,
    flexShrink: 0,
  },

  defaultMetaProfilePicture: {
    justifyContent: "center",
    alignItems: "center",
  },

  metaUsername: {
    flexShrink: 1,
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

  locationOptionsButton: {
    width: 32,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  /*
   * Username + description
   */

  descriptionRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },

  description: {
    flexShrink: 1,
  },

  postDate: {
    fontSize: 12,
    opacity: 0.5,
    paddingBottom: 10,
  },

  /*
   * Comments Bottom Sheet
   */

  commentsHeader: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 12,
    alignItems: "center",
    borderBottomWidth: 1,
  },

  commentsLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  commentsList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },

  commentRow: {
    flexDirection: "row",
    marginBottom: 18,
  },

  commentProfilePicture: {
    width: 38,
    height: 38,
    borderRadius: 19,
    flexShrink: 0,
  },

  defaultCommentProfilePicture: {
    alignItems: "center",
    justifyContent: "center",
  },

  commentContent: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },

  commentTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },

  commentTextRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    minWidth: 0,
  },

  commentText: {
    flexShrink: 1,
  },

  commentOptionsButton: {
    width: 32,
    minHeight: 28,
    marginLeft: 6,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 1,
    flexShrink: 0,
  },

  commentDate: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 4,
  },

  noComments: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 45,
  },

  noCommentsSubtext: {
    opacity: 0.5,
    marginTop: 5,
  },

  bottomSheetContainer: {
    flex: 1,
  },

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

  commentSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },

  /*
   * Comment delete menu
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
});