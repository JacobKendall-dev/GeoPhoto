import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

type User = {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
};

const API_URL = "https://geophoto-production-581e.up.railway.app";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAuth = async () => {
            const storedToken = await SecureStore.getItemAsync("token");

            if (storedToken) {
                const res = await fetch(`${API_URL}/me`, {
                    method: "GET",
                    headers: {
                        Authorization: "Bearer " + storedToken,
                    },
                });

                if (res.ok) {
                    const data = await res.json();

                    setToken(storedToken);
                    setUser(data);
                } else if (res.status === 401) {
                    await SecureStore.deleteItemAsync("token");
                    setToken(null);
                    setUser(null);
                }
            }

            setLoading(false);
        };

        loadAuth();
    }, []);

    const login = async (newToken: string) => {
        await SecureStore.setItemAsync("token", newToken);
        setToken(newToken);

        const res = await fetch(`${API_URL}/me`, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + newToken,
            },
        });

        if (res.ok) {
            const data = await res.json();
            setUser(data);
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync("token");
        setToken(null);
        setUser(null);
    };

    const authenticatedRequest = async (
        url: string,
        options: RequestInit = {}
    ) => {
        const storedToken = await SecureStore.getItemAsync("token");

        if (!storedToken) {
            await logout();
            throw new Error("Not authenticated.");
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: "Bearer " + storedToken,
            },
        });

        if (response.status === 401) {
            await logout();
        }

        return response;
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isLoggedIn: token !== null,
                loading,
                login,
                logout,
                authenticatedRequest,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}