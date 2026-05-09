import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getExercisesByMuscles,
  MuscleGroup,
  muscleGroups,
} from "../../src/game/exercises";

import { useWorkoutHistory, WorkoutEntry } from "../../src/game/workoutHistory";
import { SessionEntry, useWorkoutSession } from "../../src/game/workoutSession";

// These are the milestone colors used for the temporary workout pulse.
// 3 exercises = blue, 6 = purple, 9 = yellow, 12+ = green.
const WORKOUT_PULSE_COLORS = [
  "transparent",
  "#1e90ff",
  "#9b5cff",
  "#ffd54a",
  "#4caf50",
];

export default function WorkoutScreen() {
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);

  const { getTodayWorkout } = useWorkoutHistory();
  const { sessionEntries } = useWorkoutSession();

  // These animated values control the pulse effect.
  // borderPulseOpacity fades the glow in and out.
  // borderPulseScale slightly expands the glow so it feels alive.
  const borderPulseOpacity = useRef(new Animated.Value(0)).current;
  const borderPulseScale = useRef(new Animated.Value(1)).current;

  // Used so the animation only happens when the user crosses a new milestone.
  const previousTierRef = useRef(0);

  const exercises = getExercisesByMuscles(selectedMuscles);
  const todayWorkout = getTodayWorkout();

  // Every 3 exercises moves to the next milestone tier.
  // 0-2 = none, 3-5 = blue, 6-8 = purple, 9-11 = yellow, 12+ = green.
  const pulseTier = Math.min(Math.floor(sessionEntries.length / 3), 4);
  const pulseColor = WORKOUT_PULSE_COLORS[pulseTier];

  useEffect(() => {
    // Only trigger the pulse when entering a new 3-exercise milestone.
    if (pulseTier > 0 && pulseTier !== previousTierRef.current) {
      borderPulseOpacity.setValue(0);
      borderPulseScale.setValue(1);

      const singlePulse = Animated.parallel([
        Animated.sequence([
          Animated.timing(borderPulseOpacity, {
            toValue: 0.38,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(borderPulseOpacity, {
            toValue: 0,
            duration: 240,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(borderPulseScale, {
            toValue: 1.02,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(borderPulseScale, {
            toValue: 1,
            duration: 240,
            useNativeDriver: true,
          }),
        ]),
      ]);

      // Pulse 3 times, then return fully to the normal clean look.
      Animated.sequence([
        singlePulse,
        Animated.delay(70),
        singlePulse,
        Animated.delay(70),
        singlePulse,
      ]).start(() => {
        borderPulseOpacity.setValue(0);
        borderPulseScale.setValue(1);
      });
    }

    previousTierRef.current = pulseTier;
  }, [pulseTier, borderPulseOpacity, borderPulseScale]);

  function toggleMuscle(muscle: MuscleGroup) {
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter((m) => m !== muscle));
    } else {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }
  }

  function formatSessionEntry(entry: SessionEntry) {
    if (entry.type === "strength") {
      if (entry.weightUnit === "bodyweight") {
        return `Bodyweight x ${entry.reps ?? 0} reps x ${entry.sets ?? 0} sets — ${entry.exerciseName}`;
      }

      return `${entry.weight ?? 0} ${entry.weightUnit ?? "lbs"} x ${entry.reps ?? 0} reps x ${entry.sets ?? 0} sets — ${entry.exerciseName}`;
    }

    return `${entry.exerciseName} — ${entry.time ?? 0} min, ${entry.distance ?? 0} distance`;
  }

  function formatHistoryEntry(entry: WorkoutEntry) {
    if (entry.type === "strength") {
      if (entry.weightUnit === "bodyweight") {
        return `Bodyweight x ${entry.reps ?? 0} reps x ${entry.sets ?? 0} sets — ${entry.exerciseName}`;
      }

      return `${entry.weight ?? 0} ${entry.weightUnit ?? "lbs"} x ${entry.reps ?? 0} reps x ${entry.sets ?? 0} sets — ${entry.exerciseName}`;
    }

    return `${entry.exerciseName} — ${entry.time ?? 0} min, ${entry.distance ?? 0} distance`;
  }

  // These animated styles are shared by the three pulse layers.
  // Using multiple layers makes the glow feel softer and more like a gradient.
  const pulseAnimatedStyle = useMemo(
    () => ({
      opacity: borderPulseOpacity,
      transform: [{ scale: borderPulseScale }],
    }),
    [borderPulseOpacity, borderPulseScale],
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* 
        Temporary pulse overlays.
        These only appear during milestone animations and then fade away.
        Using 3 layers makes the effect feel softer than a single hard border.
      */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulseLayerOuter,
          pulseAnimatedStyle,
          {
            borderColor: pulseColor,
            shadowColor: pulseColor,
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulseLayerMiddle,
          pulseAnimatedStyle,
          {
            borderColor: pulseColor,
            shadowColor: pulseColor,
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulseLayerInner,
          pulseAnimatedStyle,
          {
            borderColor: pulseColor,
            shadowColor: pulseColor,
          },
        ]}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Select Muscle Groups</Text>

        <View style={styles.muscleContainer}>
          {muscleGroups.map((muscle) => {
            const selected = selectedMuscles.includes(muscle);

            return (
              <Pressable
                key={muscle}
                style={({ pressed }) => [
                  styles.muscleButton,
                  selected && styles.muscleSelected,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => toggleMuscle(muscle)}
              >
                <Text style={styles.muscleText}>
                  {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedMuscles.length > 0 && (
          <>
            <Text style={styles.subtitle}>Exercises</Text>

            <View style={styles.exerciseContainer}>
              {exercises.map((exercise) => (
                <Pressable
                  key={exercise.id}
                  style={({ pressed }) => [
                    styles.exerciseButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/logWorkout",
                      params: { id: exercise.id },
                    })
                  }
                >
                  <Text style={styles.exerciseText}>{exercise.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={styles.subtitle}>Current Workout Session</Text>

        <View style={styles.historyBox}>
          {sessionEntries.length === 0 ? (
            <Text style={styles.emptyText}>
              No exercises added to this workout yet.
            </Text>
          ) : (
            sessionEntries.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyText}>
                  {formatSessionEntry(entry)}
                </Text>
              </View>
            ))
          )}
        </View>

        {sessionEntries.length > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.completeButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/completeWorkout")}
          >
            <Text style={styles.completeButtonText}>Complete Workout</Text>
          </Pressable>
        )}

        <Text style={styles.subtitle}>Completed Today</Text>

        <View style={styles.historyBox}>
          {!todayWorkout || todayWorkout.entries.length === 0 ? (
            <Text style={styles.emptyText}>
              No completed workouts logged yet today.
            </Text>
          ) : (
            todayWorkout.entries.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyText}>
                  {formatHistoryEntry(entry)}
                </Text>
              </View>
            ))
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.historyButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/history")}
        >
          <Text style={styles.historyButtonText}>
            View Full Workout History
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },

  // Outermost soft glow layer.
  pulseLayerOuter: {
    position: "absolute",
    top: 4,
    right: 4,
    bottom: 4,
    left: 4,
    borderWidth: 2,
    borderRadius: 24,
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
    zIndex: 5,
  },

  // Middle layer to make the effect feel fuller.
  pulseLayerMiddle: {
    position: "absolute",
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
    borderWidth: 2,
    borderRadius: 20,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    zIndex: 5,
  },

  // Inner layer gives a final soft rim near the content.
  pulseLayerInner: {
    position: "absolute",
    top: 16,
    right: 16,
    bottom: 16,
    left: 16,
    borderWidth: 1.5,
    borderRadius: 16,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    zIndex: 5,
  },

  container: {
    backgroundColor: "#000",
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 26,
    color: "white",
    marginBottom: 20,
  },

  subtitle: {
    fontSize: 22,
    color: "white",
    marginTop: 30,
    marginBottom: 10,
  },

  muscleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  muscleButton: {
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 8,
    margin: 5,
  },

  muscleSelected: {
    backgroundColor: "#1e90ff",
  },

  muscleText: {
    color: "white",
  },

  exerciseContainer: {
    marginTop: 10,
  },

  exerciseButton: {
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },

  exerciseText: {
    color: "white",
    fontSize: 16,
  },

  historyBox: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },

  historyRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },

  historyText: {
    color: "white",
    fontSize: 15,
  },

  emptyText: {
    color: "#aaa",
    fontSize: 15,
  },

  completeButton: {
    backgroundColor: "#1e90ff",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },

  completeButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },

  historyButton: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },

  historyButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
