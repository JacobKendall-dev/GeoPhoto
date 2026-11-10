import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from "../context/AuthContext";
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthNavigation() {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) {
      return;
    }

  const inAuthScreen = [
    "login",
    "register",
    "forgot-password",
    "reset-password",
    "resend-confirmation",
    "recover-registration",
  ].includes(segments[segments.length - 1] as string);

    if (!isLoggedIn && !inAuthScreen) {
      router.replace('../auth/login');
    }

    if (isLoggedIn && inAuthScreen) {
      router.replace('/');
    }
  }, [isLoggedIn, loading, segments]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider
          value={
            colorScheme === 'dark'
              ? DarkTheme
              : DefaultTheme
          }
        >

          <AuthNavigation />

          <Stack screenOptions={{headerShown: false}}>
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="settings/index"
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="settings/account"
              options={{ headerShown: false }}
            />
          </Stack>

          <StatusBar style="auto" />

        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}