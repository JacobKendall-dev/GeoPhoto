
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const API_URL = "https://geophoto-production-581e.up.railway.app";

const tabs = [
  { id: "explore", label: "Explore", icon: "compass" },
  { id: "bookmarks", label: "Bookmarks", icon: "bookmark" },
  { id: "profile", label: "Profile", icon: "user" },
];

const filters = [
  { id: "all", label: "All" },
  { id: "liked", label: "Most Liked" },
  { id: "distance", label: "Distance" },
];

function Icon({ name, size = 20, filled = false }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: filled ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
    bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z" />,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    heart: <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.5Z" />,
    comment: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.7 9.7 0 0 1-4-.9L3 21l1.5-4.5A8.1 8.1 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />,
    image: <><rect x="3" y="3" width="18" height="18" rx="1" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 10v6M14 10v6" /></>,
  };

  return <svg {...common}>{paths[name] || paths.compass}</svg>;
}

function getDistanceKm(start, end) {
  const rad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = rad(end.latitude - start.latitude);
  const dLng = rad(end.longitude - start.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(start.latitude)) *
      Math.cos(rad(end.latitude)) *
      Math.sin(dLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getImageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}/${path.replace(/^\/+/, "")}`;
}

function getCoordinates(location) {
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

export default function App() {
  const { isLoggedIn, user, logout, authenticatedRequest } = useAuth();
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [personalLocationIds, setPersonalLocationIds] = useState([]);
  const [bookmarkedLocationIds, setBookmarkedLocationIds] = useState([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [exploreFilter, setExploreFilter] = useState("all");
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceError, setDistanceError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyActions, setBusyActions] = useState({});
  const [commentLocation, setCommentLocation] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSending, setCommentSending] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [commentMenuId, setCommentMenuId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const panelOpen = activeTab !== null;
  const selectedTab = tabs.find((tab) => tab.id === activeTab);
  const selectedLocation = locations.find(
    (location) => String(location.id) === String(selectedLocationId)
  ) || null;

  const authFetch = (url, options = {}) =>
    authenticatedRequest(url, options);

  const fetchLocations = async () => {
    try {
      // Public visitors can load locations without a token.
      // Signed-in users can still load their personal like/bookmark state.
      const response = isLoggedIn
        ? await authFetch(`${API_URL}/locations`)
        : await fetch(`${API_URL}/locations`);

      if (!response.ok) {
        throw new Error(`Unable to load locations (${response.status}).`);
      }

      const data = await response.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Unable to load locations:", error);
    }
  };

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiZ2F3YWluNDA0IiwiYSI6ImNtdzltZmNqZjAybHMyeG91aHF3M3J3aTQifQ.N7RACkT6_B4g7c1o6gYn-Q";

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-95.3011, 32.3513],
      zoom: 3,
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fetch again when authentication finishes loading or changes, so
  // personal like/bookmark state is fetched with the current token.
  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Load private collections only for a signed-in user and only when opened.
  useEffect(() => {
    let cancelled = false;

    const fetchPersonalCollections = async () => {
      if (!isLoggedIn || !["profile", "bookmarks"].includes(activeTab)) {
        if (!isLoggedIn) {
          setPersonalLocationIds([]);
          setBookmarkedLocationIds([]);
        }
        setPanelError("");
        setPanelLoading(false);
        return;
      }

      setPanelLoading(true);
      setPanelError("");

      try {
        const endpoint =
          activeTab === "profile" ? "/locations/me" : "/locations/bookmarks";
        const response = await authFetch(`${API_URL}${endpoint}`);

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Your session has expired. Please log in again."
              : `Unable to load ${activeTab === "profile" ? "your photos" : "bookmarks"}.`
          );
        }

        const data = await response.json();
        const ids = Array.isArray(data)
          ? data.map((item) => item.id).filter((id) => id != null)
          : [];

        if (!cancelled) {
          if (activeTab === "profile") setPersonalLocationIds(ids);
          else setBookmarkedLocationIds(ids);
        }
      } catch (error) {
        if (!cancelled) setPanelError(error.message || "Unable to load this collection.");
      } finally {
        if (!cancelled) setPanelLoading(false);
      }
    };

    fetchPersonalCollections();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isLoggedIn]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    locations.forEach((location) => {
      const coordinates = getCoordinates(location);
      if (!coordinates) return;

      const marker = new mapboxgl.Marker()
        .setLngLat([coordinates.longitude, coordinates.latitude])
        .addTo(map);

      const markerElement = marker.getElement();
      markerElement.style.cursor = "pointer";
      markerElement.setAttribute("role", "button");
      markerElement.setAttribute(
        "aria-label",
        `Open photo location by ${location.username || "User"}`
      );
      markerElement.tabIndex = 0;

      const openLocation = () => {
        setSelectedLocationId(location.id);
        setActiveTab("location");
      };

      markerElement.addEventListener("click", openLocation);
      markerElement.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLocation();
        }
      });

      markersRef.current.push(marker);
    });
  }, [locations]);

  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainer.current;

    if (!map || !container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const handleTabClick = (tabId) => {
    setSelectedLocationId(null);
    setActiveTab((current) => current === tabId ? null : tabId);
  };

  const handleExploreFilter = (filterId) => {
    setExploreFilter(filterId);
    setDistanceError("");

    if (filterId !== "distance" || userCoordinates) return;

    if (!navigator.geolocation) {
      setDistanceError("Your browser does not support location services.");
      return;
    }

    setDistanceLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setDistanceLoading(false);
      },
      (error) => {
        setDistanceError(
          error.code === 1
            ? "Location permission was denied. Allow location access in your browser to sort by distance."
            : "Unable to determine your location. Please try again."
        );
        setDistanceLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const filteredLocations = useMemo(() => {
    const valid = locations.filter(getCoordinates);

    if (exploreFilter === "liked") {
      return [...valid].sort(
        (a, b) => (Number(b.likeCount) || 0) - (Number(a.likeCount) || 0)
      );
    }

    if (exploreFilter === "distance" && userCoordinates) {
      return [...valid].sort((a, b) =>
        getDistanceKm(userCoordinates, getCoordinates(a)) -
        getDistanceKm(userCoordinates, getCoordinates(b))
      );
    }

    return valid;
  }, [locations, exploreFilter, userCoordinates]);

  const personalLocations = useMemo(
    () => locations.filter((location) =>
      personalLocationIds.some((id) => String(id) === String(location.id))
    ),
    [locations, personalLocationIds]
  );

  const bookmarkedLocations = useMemo(
    () => locations.filter((location) =>
      location.bookmarkedByMe &&
      bookmarkedLocationIds.some((id) => String(id) === String(location.id))
    ),
    [locations, bookmarkedLocationIds]
  );

  const flyToLocation = (location) => {
    const coordinates = getCoordinates(location);
    if (!coordinates || !mapRef.current) return;

    setActiveTab(null);
    mapRef.current.flyTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom: 14,
      essential: true,
    });
  };

  const requireLogin = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const updateLocation = (id, updates) => {
    setLocations((current) =>
      current.map((location) =>
        String(location.id) === String(id)
          ? { ...location, ...updates }
          : location
      )
    );
  };

  const toggleLike = async (location) => {
    if (!requireLogin()) return;
    if (busyActions[`${location.id}-like`]) return;

    const wasLiked = Boolean(location.likedByMe);
    const key = `${location.id}-like`;

    setActionError("");
    setBusyActions((current) => ({ ...current, [key]: true }));

    try {
      const response = await authFetch(
        `${API_URL}/locations/${location.id}/like`,
        { method: wasLiked ? "DELETE" : "POST" }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please log in again to like locations."
            : "Unable to update your like. Please try again."
        );
      }

      updateLocation(location.id, {
        likedByMe: !wasLiked,
        likeCount: Math.max(
          0,
          (Number(location.likeCount) || 0) + (wasLiked ? -1 : 1)
        ),
      });
    } catch (error) {
      setActionError(error.message || "Unable to update your like.");
    } finally {
      setBusyActions((current) => ({ ...current, [key]: false }));
    }
  };

  const toggleBookmark = async (location) => {
    if (!requireLogin()) return;
    if (busyActions[`${location.id}-bookmark`]) return;

    const wasBookmarked = Boolean(location.bookmarkedByMe);
    const key = `${location.id}-bookmark`;

    setActionError("");
    setBusyActions((current) => ({ ...current, [key]: true }));

    try {
      const response = await authFetch(
        `${API_URL}/locations/${location.id}/bookmark`,
        { method: wasBookmarked ? "DELETE" : "POST" }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please log in again to bookmark locations."
            : "Unable to update your bookmark. Please try again."
        );
      }

      updateLocation(location.id, {
        bookmarkedByMe: !wasBookmarked,
      });
    } catch (error) {
      setActionError(error.message || "Unable to update your bookmark.");
    } finally {
      setBusyActions((current) => ({ ...current, [key]: false }));
    }
  };

  const openComments = async (location) => {
    setCommentLocation(location);
    setComments([]);
    setCommentText("");
    setCommentsError("");
    setCommentMenuId(null);
    setCommentsLoading(true);

    try {
      // Comments are public. Use the authenticated request only when a user
      // is signed in so the API can additionally identify their own comments.
      const commentsUrl = `${API_URL}/locations/${location.id}/comments`;
      const response = isLoggedIn
        ? await authFetch(commentsUrl)
        : await fetch(commentsUrl);

      if (!response.ok) {
        throw new Error("Unable to load comments.");
      }

      const data = await response.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      setCommentsError(error.message || "Unable to load comments.");
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();

    if (!commentLocation || !commentText.trim() || commentSending) return;
    if (!requireLogin()) return;

    setCommentSending(true);
    setCommentsError("");

    try {
      const response = await authFetch(
        `${API_URL}/locations/${commentLocation.id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: commentText.trim() }),
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please log in again to comment."
            : "Unable to post your comment."
        );
      }

      const created = await response.json();

      setComments((current) => [
        ...current,
        {
          ...created,
          username: user?.username || "You",
          profilePicture: user?.profilePicture || null,
          isMine: true,
        },
      ]);

      setCommentText("");

      updateLocation(commentLocation.id, {
        commentCount: (Number(commentLocation.commentCount) || 0) + 1,
      });
    } catch (error) {
      setCommentsError(error.message || "Unable to post your comment.");
    } finally {
      setCommentSending(false);
    }
  };

  const deleteComment = async (comment) => {
    if (!commentLocation || !comment?.id || !comment.isMine || deletingCommentId) {
      return;
    }

    const confirmed = window.confirm("Delete your comment?");
    if (!confirmed) {
      setCommentMenuId(null);
      return;
    }

    setDeletingCommentId(comment.id);
    setCommentsError("");

    try {
      const response = await authFetch(
        `${API_URL}/locations/${commentLocation.id}/comments/${comment.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please log in again to delete your comment."
            : response.status === 403
              ? "You can only delete your own comments."
              : "Unable to delete this comment. Please try again."
        );
      }

      setComments((current) =>
        current.filter((item) => String(item.id) !== String(comment.id))
      );
      setCommentMenuId(null);

      setLocations((current) =>
        current.map((location) =>
          String(location.id) === String(commentLocation.id)
            ? {
                ...location,
                commentCount: Math.max(0, (Number(location.commentCount) || 0) - 1),
              }
            : location
        )
      );
    } catch (error) {
      setCommentsError(error.message || "Unable to delete this comment.");
    } finally {
      setDeletingCommentId(null);
    }
  };


  const renderLocationPosts = (items, showDistance = false) => (
<div className="exploreLocationList">
                      {items.map((location) => {
                        const imageUrl = getImageUrl(location.imageUrl);
                        const profilePicture = getImageUrl(location.profilePicture);

                        return (
                          <article className="explorePost" key={location.id}>
                            <button
                              type="button"
                              className="explorePostAuthor"
                              onClick={() => flyToLocation(location)}
                              title="Show this location on the map"
                            >
                              {profilePicture ? (
                                <img
                                  className="exploreAvatar"
                                  src={profilePicture}
                                  alt=""
                                  loading="lazy"
                                />
                              ) : (
                                <span className="exploreAvatar exploreAvatarPlaceholder">
                                  <Icon name="user" size={19} />
                                </span>
                              )}
                              <span>{location.username || "User"}</span>
                            </button>

                            <button
                              type="button"
                              className="explorePostImageButton"
                              onClick={() => flyToLocation(location)}
                              title="Show this location on the map"
                            >
                              {imageUrl ? (
                                <img
                                  className="explorePostImage"
                                  src={imageUrl}
                                  alt={location.description || "Location photo"}
                                  loading="lazy"
                                />
                              ) : (
                                <div className="explorePostImage explorePostImagePlaceholder">
                                  <Icon name="image" size={34} />
                                  <span>No image available</span>
                                </div>
                              )}
                            </button>

                            <div className="explorePostDescription">
                              <span className="explorePostUsername">
                                {location.username || "User"}
                              </span>
                              {" - "}
                              <span>
                                {location.description?.trim() || "Photo location"}
                              </span>
                            </div>

                            <div className="explorePostActions">
                              <div className="explorePostActionsLeft">
                                <button
                                  type="button"
                                  className={`postAction ${location.likedByMe ? "postActionActive" : ""}`}
                                  onClick={() => toggleLike(location)}
                                  disabled={Boolean(busyActions[`${location.id}-like`])}
                                  aria-label={location.likedByMe ? "Unlike location" : "Like location"}
                                  title={isLoggedIn ? "Like" : "Log in to like"}
                                >
                                  <Icon name="heart" filled={Boolean(location.likedByMe)} />
                                  <span>Like</span>
                                  <span className="postActionCount">
                                    {Number(location.likeCount) || 0}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  className="postAction"
                                  onClick={() => openComments(location)}
                                  aria-label="View comments"
                                >
                                  <Icon name="comment" />
                                  <span>Comment</span>
                                  <span className="postActionCount">
                                    {Number(location.commentCount) || 0}
                                  </span>
                                </button>
                              </div>

                              <button
                                type="button"
                                className={`postAction postBookmark ${location.bookmarkedByMe ? "postActionActive" : ""}`}
                                onClick={() => toggleBookmark(location)}
                                disabled={Boolean(busyActions[`${location.id}-bookmark`])}
                                aria-label={location.bookmarkedByMe ? "Remove bookmark" : "Bookmark location"}
                                title={isLoggedIn ? "Bookmark" : "Log in to bookmark"}
                              >
                                <Icon
                                  name="bookmark"
                                  filled={Boolean(location.bookmarkedByMe)}
                                />
                              </button>
                            </div>

                            {showDistance && userCoordinates && (
                              <p className="postDistance">{formatDistance(location)}</p>
                            )}
                          </article>
                        );
                      })}
                    </div>
  );

  const formatDistance = (location) => {
    if (!userCoordinates) return "";
    const distance = getDistanceKm(userCoordinates, getCoordinates(location));

    return distance < 1
      ? `${Math.round(distance * 1000)} m away`
      : `${distance.toFixed(1)} km away`;
  };

  return (
    <div className="body">
      <header className="siteHeader">
        <h1>GeoPhoto</h1>

        <nav aria-label="Account navigation">
          {isLoggedIn ? (
            <>
              <span className="welcomeMessage">
                Welcome, {user?.username}
              </span>
              <button
                type="button"
                className="headerButton"
                onClick={logout}
              >
                Log Out
              </button>
            </>
          ) : (
            <>

              <Link to="/register">Register</Link>
              <Link to="/login">Login</Link>
            </>
          )}
        </nav>
      </header>

      <main className="mapMain">
        <article className="mapArticle">
          <div
            ref={mapContainer}
            id="map"
            aria-label="Map showing GeoPhoto locations"
          />

          <div className="sidebarRail" aria-label="Main sidebar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`sidebarTab ${activeTab === tab.id ? "active" : ""}`}
                aria-label={tab.label}
                aria-expanded={activeTab === tab.id}
                aria-controls="sidebarContentPanel"
                title={tab.label}
                onClick={() => handleTabClick(tab.id)}
              >
                <Icon name={tab.icon} />
                <span className="sidebarTabLabel">{tab.label}</span>
              </button>
            ))}
          </div>

          <section
            id="sidebarContentPanel"
            className={`sidebarContentPanel ${panelOpen ? "panelIsOpen" : ""}`}
            aria-hidden={!panelOpen}
          >
            <div className="sidebarPanelHeader">
              <h2>{selectedTab?.label ?? (activeTab === "location" ? "Location" : "")}</h2>
            </div>

            <div className={`sidebarPanelBody ${["explore", "profile", "bookmarks", "location"].includes(activeTab) ? "socialPostPanelBody" : ""} ${activeTab === "explore" ? "explorePanelBody" : ""}`}>
              {activeTab === "location" && (
                <div className="selectedLocationContent">
                  {selectedLocation ? (
                    renderLocationPosts([selectedLocation])
                  ) : (
                    <div className="emptyLocations">
                      <Icon name="image" size={30} />
                      <h3>Location unavailable</h3>
                      <p>This photo location could not be found.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "explore" && (
                <div className="exploreContent">
                  <div className="exploreFilters" role="group" aria-label="Sort locations">
                    {filters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={`exploreFilter ${exploreFilter === filter.id ? "active" : ""}`}
                        aria-pressed={exploreFilter === filter.id}
                        onClick={() => handleExploreFilter(filter.id)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  {distanceLoading && (
                    <p className="exploreMessage">Finding your location...</p>
                  )}

                  {distanceError && (
                    <p className="exploreMessage exploreError" role="alert">
                      {distanceError}
                    </p>
                  )}

                  {actionError && (
                    <p className="exploreMessage exploreError" role="alert">
                      {actionError}
                    </p>
                  )}

                  <p className="locationCount">
                    {filteredLocations.length}{" "}
                    {filteredLocations.length === 1 ? "location" : "locations"}
                  </p>

                  {filteredLocations.length === 0 ? (
                    <div className="emptyLocations">
                      <Icon name="compass" size={30} />
                      <h3>No locations yet</h3>
                      <p>Locations shared with GeoPhoto will appear here.</p>
                    </div>
                  ) : (
                    renderLocationPosts(filteredLocations, exploreFilter === "distance")
                  )}
                </div>
              )}

              {activeTab === "bookmarks" && (
                <div className="collectionContent">
                  {!isLoggedIn ? (
                    <div className="emptyLocations">
                      <Icon name="bookmark" size={30} />
                      <h3>Your bookmarks</h3>
                      <p>Log in to see the photos you have saved.</p>
                      <Link to="/login" className="panelActionLink">Log in</Link>
                    </div>
                  ) : panelLoading ? (
                    <p className="collectionMessage">Loading bookmarks...</p>
                  ) : panelError ? (
                    <p className="collectionMessage exploreError" role="alert">{panelError}</p>
                  ) : bookmarkedLocations.length === 0 ? (
                    <div className="emptyLocations">
                      <Icon name="bookmark" size={30} />
                      <h3>No bookmarks yet</h3>
                      <p>Photos you bookmark in Explore will appear here.</p>
                    </div>
                  ) : (
                    <>
                      <p className="locationCount">{bookmarkedLocations.length} {bookmarkedLocations.length === 1 ? "photo" : "photos"}</p>
                      {renderLocationPosts(bookmarkedLocations)}
                    </>
                  )}
                </div>
              )}

              {activeTab === "profile" && (
                <div className="collectionContent">
                  {!isLoggedIn ? (
                    <div className="emptyLocations">
                      <Icon name="user" size={30} />
                      <h3>Your profile</h3>
                      <p>Log in to see the photos you have shared.</p>
                      <Link to="/login" className="panelActionLink">Log in</Link>
                    </div>
                  ) : panelLoading ? (
                    <p className="collectionMessage">Loading your photos...</p>
                  ) : panelError ? (
                    <p className="collectionMessage exploreError" role="alert">{panelError}</p>
                  ) : personalLocations.length === 0 ? (
                    <div className="emptyLocations">
                      <Icon name="user" size={30} />
                      <h3>No photos yet</h3>
                      <p>Photos you share with GeoPhoto will appear here.</p>
                    </div>
                  ) : (
                    <>
                      <p className="locationCount">{personalLocations.length} {personalLocations.length === 1 ? "photo" : "photos"}</p>
                      {renderLocationPosts(personalLocations)}
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="sidebarCloseButton"
              aria-label="Close sidebar"
              title="Close sidebar"
              onClick={() => { setActiveTab(null); setSelectedLocationId(null); }}
              tabIndex={panelOpen ? 0 : -1}
            >
              <Icon name="close" size={19} />
            </button>
          </section>

          {commentLocation && (
            <div
              className="commentsBackdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setCommentLocation(null);
                  setCommentMenuId(null);
                }
              }}
            >
              <section
                className="commentsDialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="commentsDialogTitle"
              >
                <header className="commentsDialogHeader">
                  <h2 id="commentsDialogTitle">Comments</h2>
                  <button
                    type="button"
                    className="commentsCloseButton"
                    aria-label="Close comments"
                    onClick={() => {
                      setCommentLocation(null);
                      setCommentMenuId(null);
                    }}
                  >
                    <Icon name="close" />
                  </button>
                </header>

                <div className="commentsList">
                  {commentsLoading && <p>Loading comments...</p>}

                  {!commentsLoading && comments.length === 0 && !commentsError && (
                    <p className="commentsEmpty">No comments yet. Start the conversation.</p>
                  )}

                  {comments.map((comment) => (
                    <div className="commentItem" key={comment.id}>
                      {getImageUrl(comment.profilePicture) ? (
                        <img
                          className="commentAvatar"
                          src={getImageUrl(comment.profilePicture)}
                          alt=""
                        />
                      ) : (
                        <span className="commentAvatar commentAvatarPlaceholder">
                          <Icon name="user" size={16} />
                        </span>
                      )}

                      <div className="commentContent">
                        <strong>{comment.username || "User"}</strong>
                        <p>{comment.text}</p>
                      </div>

                      {isLoggedIn && (
                      <div className="commentMenuContainer">
                        <button
                          type="button"
                          className="commentMenuButton"
                          aria-label={`Options for ${comment.username || "user"}'s comment`}
                          aria-expanded={String(commentMenuId) === String(comment.id)}
                          title="Comment options"
                          onClick={() =>
                            setCommentMenuId((current) =>
                              String(current) === String(comment.id) ? null : comment.id
                            )
                          }
                        >
                          <Icon name="more" size={19} />
                        </button>

                        {String(commentMenuId) === String(comment.id) && (
                          <div className="commentMenu" role="menu">
                            {comment.isMine ? (
                              <button
                                type="button"
                                role="menuitem"
                                className="commentDeleteButton"
                                disabled={String(deletingCommentId) === String(comment.id)}
                                onClick={() => deleteComment(comment)}
                              >
                                <Icon name="trash" size={16} />
                                {String(deletingCommentId) === String(comment.id)
                                  ? "Deleting..."
                                  : "Delete comment"}
                              </button>
                            ) : (
                              <p className="commentMenuMessage">
                                You can only delete your own comments.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      )}
                    </div>
                  ))}
                </div>

                {commentsError && (
                  <p className="commentsError" role="alert">{commentsError}</p>
                )}

                <form className="commentForm" onSubmit={submitComment}>
                  <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder={isLoggedIn ? "Write a comment..." : "Log in to comment"}
                    rows={2}
                    maxLength={2000}
                    disabled={!isLoggedIn || commentSending}
                  />
                  <button
                    type="submit"
                    className="commentSubmitButton"
                    disabled={!isLoggedIn || !commentText.trim() || commentSending}
                  >
                    {commentSending ? "Posting..." : "Post"}
                  </button>
                </form>

                {!isLoggedIn && (
                  <p className="commentsLoginPrompt">
                    <Link to="/login">Log in</Link> to join the conversation.
                  </p>
                )}
              </section>
            </div>
          )}
        </article>
      </main>

      <footer className="siteFooter">
        <p>
          Creator:{" "}
          <a href="mailto:jacob.jkendall@gmail.com">
            jacob.jkendall@gmail.com
          </a>
        </p>

        <nav className="footerLinks">
          <Link to="/about">About</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </nav>
      </footer>
    </div>
  );
}
