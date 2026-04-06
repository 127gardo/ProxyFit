import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { getExerciseById } from "../src/game/exercises";
import {
  useWorkoutHistory,
  WeightUnit,
  WorkoutEntry,
} from "../src/game/workoutHistory";
import { useWorkoutSession } from "../src/game/workoutSession";

export default function LogWorkoutScreen() {
  const { id } = useLocalSearchParams();

  const exercise = getExerciseById(id as string);
  const { addSessionEntry } = useWorkoutSession();
  const { getLatestExerciseEntry } = useWorkoutHistory();

  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lbs");
  const [time, setTime] = useState("");
  const [distance, setDistance] = useState("");

  // Find the most recent saved version of this exercise.
  // This is only for comparison on the log screen.
  const previousEntry = useMemo(() => {
    if (!exercise) {
      return null;
    }

    return getLatestExerciseEntry(exercise.id);
  }, [exercise, getLatestExerciseEntry]);

  function formatPreviousEntry(entry: WorkoutEntry) {
    if (entry.type === "strength") {
      if (entry.weightUnit === "bodyweight") {
        return `Bodyweight x ${entry.reps ?? 0} reps x ${entry.sets ?? 0} sets`;
      }

      return `${entry.weight ?? 0} ${entry.weightUnit ?? "lbs"} x ${entry.reps ?? 0} reps x ${entry.sets ?? 0} sets`;
    }

    return `${entry.time ?? 0} min, ${entry.distance ?? 0} distance`;
  }

  function formatPreviousDate(isoString: string) {
    return new Date(isoString).toLocaleDateString();
  }

  function saveExerciseToSession() {
    if (!exercise) return;

    if (exercise.type === "strength") {
      const repsNumber = Number(reps);
      const setsNumber = Number(sets);

      if (!repsNumber || !setsNumber) {
        Alert.alert("Invalid input", "Please enter valid reps and sets.");
        return;
      }

      // Bodyweight exercises skip the weight input entirely.
      if (weightUnit === "bodyweight") {
        addSessionEntry({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          type: exercise.type,
          stats: exercise.stats,
          weightUnit: "bodyweight",
          reps: repsNumber,
          sets: setsNumber,
        });

        router.back();
        return;
      }

      const weightNumber = Number(weight);

      if (!weightNumber) {
        Alert.alert("Invalid input", "Please enter a valid weight.");
        return;
      }

      addSessionEntry({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        type: exercise.type,
        stats: exercise.stats,
        weight: weightNumber,
        weightUnit,
        reps: repsNumber,
        sets: setsNumber,
      });

      router.back();
      return;
    }

    const timeNumber = Number(time);
    const distanceNumber = Number(distance);

    if (!timeNumber || !distanceNumber) {
      Alert.alert("Invalid input", "Please enter valid time and distance.");
      return;
    }

    addSessionEntry({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      type: exercise.type,
      stats: exercise.stats,
      time: timeNumber,
      distance: distanceNumber,
    });

    router.back();
  }

  if (!exercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Exercise not found</Text>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const isBodyweight = weightUnit === "bodyweight";

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{exercise.name}</Text>

          {previousEntry && (
            <View style={styles.previousCard}>
              <Text style={styles.previousTitle}>Previous Performance</Text>
              <Text style={styles.previousText}>
                {formatPreviousEntry(previousEntry)}
              </Text>
              <Text style={styles.previousSubtext}>
                Logged on {formatPreviousDate(previousEntry.completedAt)}
              </Text>
            </View>
          )}

          {exercise.type === "strength" && (
            <>
              <View style={styles.unitRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.unitButton,
                    weightUnit === "lbs" && styles.unitButtonSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => setWeightUnit("lbs")}
                >
                  <Text style={styles.unitButtonText}>lbs</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.unitButton,
                    weightUnit === "kg" && styles.unitButtonSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => setWeightUnit("kg")}
                >
                  <Text style={styles.unitButtonText}>kg</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.unitButton,
                    weightUnit === "bodyweight" && styles.unitButtonSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => setWeightUnit("bodyweight")}
                >
                  <Text style={styles.unitButtonText}>Bodyweight</Text>
                </Pressable>
              </View>

              {!isBodyweight && (
                <TextInput
                  placeholder="Weight"
                  placeholderTextColor="#777"
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                />
              )}

              {isBodyweight && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Bodyweight selected. No weight input needed.
                  </Text>
                </View>
              )}

              <TextInput
                placeholder="Reps"
                placeholderTextColor="#777"
                keyboardType="numeric"
                returnKeyType="done"
                style={styles.input}
                value={reps}
                onChangeText={setReps}
              />

              <TextInput
                placeholder="Sets"
                placeholderTextColor="#777"
                keyboardType="numeric"
                returnKeyType="done"
                style={styles.input}
                value={sets}
                onChangeText={setSets}
              />
            </>
          )}

          {exercise.type === "cardio" && (
            <>
              <TextInput
                placeholder="Time (minutes)"
                placeholderTextColor="#777"
                keyboardType="numeric"
                returnKeyType="done"
                style={styles.input}
                value={time}
                onChangeText={setTime}
              />

              <TextInput
                placeholder="Distance"
                placeholderTextColor="#777"
                keyboardType="numeric"
                returnKeyType="done"
                style={styles.input}
                value={distance}
                onChangeText={setDistance}
              />
            </>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={saveExerciseToSession}
          >
            <Text style={styles.buttonText}>Add To Workout</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Back</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    color: "white",
    marginBottom: 24,
  },

  previousCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },

  previousTitle: {
    color: "#1e90ff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  previousText: {
    color: "white",
    fontSize: 16,
    marginBottom: 6,
  },

  previousSubtext: {
    color: "#999",
    fontSize: 14,
  },

  input: {
    backgroundColor: "#111",
    color: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },

  unitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },

  unitButton: {
    backgroundColor: "#222",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },

  unitButtonSelected: {
    backgroundColor: "#1e90ff",
  },

  unitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  infoBox: {
    backgroundColor: "#0f1720",
    borderRadius: 8,
    padding: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#1e90ff",
  },

  infoText: {
    color: "#cfe7ff",
    fontSize: 15,
  },

  button: {
    backgroundColor: "#1e90ff",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  secondaryButton: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    marginTop: 12,
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  buttonText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
});
