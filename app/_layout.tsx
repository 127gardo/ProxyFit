import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { AuthProvider, useAuth } from "../src/auth/AuthProvider";
import { CharacterProvider } from "../src/game/character";
import { WorkoutHistoryProvider } from "../src/game/workoutHistory";
import { WorkoutSessionProvider } from "../src/game/workoutSession";

function AppNavigator() {
  const { session, loading } = useAuth();

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const firstSegment = segments[0];

    const isOnLoginScreen = firstSegment === "login";
    const isOnForgotPasswordScreen = firstSegment === "forgot-password";
    const isOnResetPasswordScreen = firstSegment === "reset-password";

    const isOnPublicAuthScreen =
      isOnLoginScreen || isOnForgotPasswordScreen || isOnResetPasswordScreen;

    /*
      If the user is not logged in, they should only see auth screens.

      Auth screens:
      - login
      - forgot-password
      - reset-password
    */
    if (!session && !isOnPublicAuthScreen) {
      router.replace("/login");
      return;
    }

    /*
      If the user is logged in and looking at login/forgot-password,
      send them into the app.

      We do NOT automatically redirect away from reset-password because
      password reset links temporarily create a session. The user needs to
      stay on reset-password long enough to enter the new password.
    */
    if (session && (isOnLoginScreen || isOnForgotPasswordScreen)) {
      router.replace("/");
    }
  }, [loading, session, segments, router]);

  return (
    <CharacterProvider>
      <WorkoutHistoryProvider>
        <WorkoutSessionProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen
              name="forgot-password"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="reset-password"
              options={{ headerShown: false }}
            />

            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            <Stack.Screen
              name="logWorkout"
              options={{
                title: "Log Exercise",
                headerStyle: { backgroundColor: "#111" },
                headerTintColor: "#fff",
                contentStyle: { backgroundColor: "#000" },
              }}
            />

            <Stack.Screen
              name="completeWorkout"
              options={{
                title: "Complete Workout",
                headerStyle: { backgroundColor: "#111" },
                headerTintColor: "#fff",
                contentStyle: { backgroundColor: "#000" },
              }}
            />

            <Stack.Screen
              name="history"
              options={{
                title: "Workout History",
                headerStyle: { backgroundColor: "#111" },
                headerTintColor: "#fff",
                contentStyle: { backgroundColor: "#000" },
              }}
            />
          </Stack>
        </WorkoutSessionProvider>
      </WorkoutHistoryProvider>
    </CharacterProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
