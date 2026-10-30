
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const API_URL = "http://192.168.1.174:5198";

const AuthContext = createContext(null);

// Returns the JWT expiration time in milliseconds.
function getTokenExpiration(authToken) {
  try {
    const payload = authToken.split(".")[1];

    if (!payload) return null;

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedBase64 = base64.padEnd(
      Math.ceil(base64.length / 4) * 4,
      "="
    );

    const decodedPayload = JSON.parse(atob(paddedBase64));

    if (
      typeof decodedPayload.exp !== "number" ||
      !Number.isFinite(decodedPayload.exp)
    ) {
      return null;
    }

    return decodedPayload.exp * 1000;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const loadUser = useCallback(async (authToken) => {
    const response = await fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
      }

      return null;
    }

    const userData = await response.json();
    setUser(userData);

    return userData;
  }, [logout]);

  // Restore the user's session when the app starts.
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");

        if (storedToken) {
          const expiration = getTokenExpiration(storedToken);

          if (!expiration || expiration <= Date.now()) {
            logout();
            return;
          }

          setToken(storedToken);
          await loadUser(storedToken);
        }
      } catch (error) {
        console.error("Unable to restore authentication:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, [loadUser, logout]);

  // Automatically log out when the JWT expires.
  useEffect(() => {
    if (!token) return;

    const expiration = getTokenExpiration(token);

    if (!expiration) {
      logout();
      return;
    }

    let timeoutId;

    const checkExpiration = () => {
      const remainingTime = expiration - Date.now();

      if (remainingTime <= 0) {
        logout();
        return;
      }

      // Keep the timeout within the browser's supported range.
      timeoutId = setTimeout(
        checkExpiration,
        Math.min(remainingTime, 2147483647)
      );
    };

    checkExpiration();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [token, logout]);

  const login = async (newToken) => {
    const expiration = getTokenExpiration(newToken);

    if (!expiration || expiration <= Date.now()) {
      logout();
      throw new Error("The login token is invalid or expired.");
    }

    localStorage.setItem("token", newToken);
    setToken(newToken);

    const userData = await loadUser(newToken);

    if (!userData) {
      logout();
      throw new Error("Unable to load your account.");
    }

    return userData;
  };

  const authenticatedRequest = async (url, options = {}) => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      logout();
      throw new Error("Not authenticated.");
    }

    const expiration = getTokenExpiration(storedToken);

    if (!expiration || expiration <= Date.now()) {
      logout();
      throw new Error("Your session has expired. Please log in again.");
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${storedToken}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      logout();
    }

    return response;
  };

  const refreshUser = () => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      logout();
      return null;
    }

    return loadUser(storedToken);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isLoggedIn: token !== null,
        login,
        logout,
        authenticatedRequest,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
