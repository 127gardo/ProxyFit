import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  useWorkoutHistory,
  WorkoutDay,
  WorkoutEntry,
} from "../src/game/workoutHistory";

export default function HistoryScreen() {
  const { workoutDays } = useWorkoutHistory();

  function formatEntry(entry: WorkoutEntry) {
    if (entry.type === "strength") {
      return `${entry.weight ?? 0} ${entry.weightUnit ?? "lbs"} x ${entry.reps ?? 0} reps x ${entry.sets ?? 0} sets — ${entry.exerciseName}`;
    }

    return `${entry.exerciseName} — ${entry.time ?? 0} min, ${entry.distance ?? 0} distance`;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Workout History</Text>

      {workoutDays.length === 0 ? (
        <Text style={styles.emptyText}>No workouts logged yet.</Text>
      ) : (
        workoutDays.map((day: WorkoutDay) => (
          <View key={day.date} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{day.date}</Text>

            {day.entries.map((entry: WorkoutEntry) => (
              <View key={entry.id} style={styles.entryRow}>
                <Text style={styles.entryText}>{formatEntry(entry)}</Text>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 30,
    color: "white",
    marginBottom: 20,
  },

  emptyText: {
    color: "#aaa",
    fontSize: 16,
  },

  dayCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 15,
    marginBottom: 16,
  },

  dayTitle: {
    color: "#1e90ff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },

  entryRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },

  entryText: {
    color: "white",
    fontSize: 15,
  },
});
