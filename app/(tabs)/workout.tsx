import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  getExercisesByMuscles,
  MuscleGroup,
  muscleGroups,
} from "../../src/game/exercises";

import { useWorkoutHistory, WorkoutEntry } from "../../src/game/workoutHistory";

import { SessionEntry, useWorkoutSession } from "../../src/game/workoutSession";

export default function WorkoutScreen() {
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);

  const { getTodayWorkout } = useWorkoutHistory();
  const { sessionEntries } = useWorkoutSession();

  const exercises = getExercisesByMuscles(selectedMuscles);
  const todayWorkout = getTodayWorkout();

  function toggleMuscle(muscle: MuscleGroup) {
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter((m) => m !== muscle));
    } else {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }
  }

  function formatSessionEntry(entry: SessionEntry) {
    if (entry.type === "strength") {
      return `${entry.weight ?? 0} ${entry.weightUnit ?? "lbs"} x ${entry.reps ?? 0} reps x ${entry.sets ?? 0} sets — ${entry.exerciseName}`;
    }

    return `${entry.exerciseName} — ${entry.time ?? 0} min, ${entry.distance ?? 0} distance`;
  }

  function formatHistoryEntry(entry: WorkoutEntry) {
    if (entry.type === "strength") {
      return `${entry.weight ?? 0} ${entry.weightUnit ?? "lbs"} x ${entry.reps ?? 0} reps x ${entry.sets ?? 0} sets — ${entry.exerciseName}`;
    }

    return `${entry.exerciseName} — ${entry.time ?? 0} min, ${entry.distance ?? 0} distance`;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <Text style={styles.historyButtonText}>View Full Workout History</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
