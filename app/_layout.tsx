import { Stack } from "expo-router";
import { CharacterProvider } from "../src/game/character";
import { WorkoutHistoryProvider } from "../src/game/workoutHistory";
import { WorkoutSessionProvider } from "../src/game/workoutSession";

export default function RootLayout() {
  return (
    <CharacterProvider>
      <WorkoutHistoryProvider>
        <WorkoutSessionProvider>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: "#111",
              },
              headerTintColor: "#fff",
              contentStyle: {
                backgroundColor: "#000",
              },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="logWorkout"
              options={{ title: "Log Exercise" }}
            />
            <Stack.Screen
              name="completeWorkout"
              options={{ title: "Complete Workout" }}
            />
            <Stack.Screen
              name="history"
              options={{ title: "Workout History" }}
            />
          </Stack>
        </WorkoutSessionProvider>
      </WorkoutHistoryProvider>
    </CharacterProvider>
  );
}
