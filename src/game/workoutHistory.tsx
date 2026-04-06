// This file defines the shape of workout data, load saved history, save updated history,
// adds workout entries, and shares workout history across the app
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo, // used to cache a value
  useState,
} from "react";

// AsyncStorage key for workout history
const WORKOUT_HISTORY_KEY = "PROXYFIT_WORKOUT_HISTORY";

// Says weight units can only be lbs, kg, or bodyweight
export type WeightUnit = "lbs" | "kg" | "bodyweight";

// Defines what one logged exercise looks like
export type WorkoutEntry = {
  id: string; // A unique ID for this specific entry. Helps list rendering and identify entries
  exerciseId: string; // Identifier. ex. bench_press
  exerciseName: string; // Display name for user. "Bench Press"
  type: "strength" | "cardio";
  completedAt: string; // Exact time the exercise was logged. ex. "2026-03-13T10:15:00.000Z"
  weight?: number;
  weightUnit?: WeightUnit;
  reps?: number;
  sets?: number;
  time?: number;
  distance?: number;
};

// Groups multiple entries into one day
export type WorkoutDay = {
  date: string;
  entries: WorkoutEntry[];
};

// What the screen sends in for the user. Similar to WorkoutEntry.
// WorkoutEntry is the final saved object, so slightly different
export type AddWorkoutEntryInput = {
  exerciseId: string;
  exerciseName: string;
  type: "strength" | "cardio";
  weight?: number;
  weightUnit?: WeightUnit;
  reps?: number;
  sets?: number;
  time?: number;
  distance?: number;
};

type WorkoutHistoryContextType = {
  workoutDays: WorkoutDay[]; // The whole workout history, grouped by day
  addWorkoutEntries: (entries: AddWorkoutEntryInput[]) => void; // Adds more entries to today's workout history
  clearWorkoutHistory: () => void; // Deletes all workout history in memory
  getTodayWorkout: () => WorkoutDay | null; // Returns today's workout, or null if none exists
  getLatestExerciseEntry: (exerciseId: string) => WorkoutEntry | null; // Returns the most recently completed version of a specific exercise
};

// Creates the shared workout history container
const WorkoutHistoryContext = createContext<WorkoutHistoryContextType | null>(
  null,
);

// Turns a JavaScript Date into a string like: "2026-03-13".
// This becomes the grouping key for a workout day
function getDateKey(date: Date) {
  const year = date.getFullYear(); // Gets the year
  const month = `${date.getMonth() + 1}`.padStart(2, "0"); // Gets the month. January = 0, Feb = 1, etc. padStart forces 2 digits
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`; // Final result "2026-03-13"
}

// Provider component that wraps the app
export function WorkoutHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]); // This stores the workout history in React state. The [] gets filled.

  // When app opens, this reads saved workout history and stores it into workoutDays
  useEffect(() => {
    async function loadWorkoutHistory() {
      try {
        const saved = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);

        if (saved) {
          setWorkoutDays(JSON.parse(saved) as WorkoutDay[]);
        }
      } catch (error) {
        console.log("Error loading workout history:", error);
      }
    }

    loadWorkoutHistory();
  }, []);

  // Whenever workoutDays changes, converts it to text and saves to AsyncStorage
  useEffect(() => {
    async function saveWorkoutHistory() {
      try {
        await AsyncStorage.setItem(
          WORKOUT_HISTORY_KEY,
          JSON.stringify(workoutDays),
        );
      } catch (error) {
        console.log("Error saving workout history:", error);
      }
    }

    saveWorkoutHistory();
  }, [workoutDays]);

  // Adds one or more exercises to the workout history
  function addWorkoutEntries(entries: AddWorkoutEntryInput[]) {
    if (entries.length === 0) {
      // If nothing was passed in, stop immediately. Prevents pointless updates.
      return;
    }

    const now = new Date(); // now is the exact current time
    const todayKey = getDateKey(now); // todayKey is a date string like "2026-03-13"

    // Takes the input entries and turns them into full WorkoutEntry objects
    const newEntries: WorkoutEntry[] = entries.map((entry) => ({
      // entries.map(...) loops through each input entry and transforms it. If the user submits 3 exercises, map creates 3 final saved workout entries.
      id: `${Date.now()}-${Math.random()}`, // date.now is current timestamp. Math.random adds extra uniqueness
      exerciseId: entry.exerciseId,
      exerciseName: entry.exerciseName,
      type: entry.type,
      completedAt: now.toISOString(), // Stores the exact completion time in ISO format "2026-03-13T10:20:00.000Z"
      weight: entry.weight,
      weightUnit: entry.weightUnit,
      reps: entry.reps,
      sets: entry.sets,
      time: entry.time,
      distance: entry.distance,
    }));

    // Uses the previous state safely
    setWorkoutDays((prev) => {
      const existingDayIndex = prev.findIndex((day) => day.date === todayKey); // Checks if we already have a workout day entry for today

      // If we do not already have a workout day entry for today,
      // create one, put it at the front of the array, and keep older days after it.
      // Newer days appear first.
      if (existingDayIndex === -1) {
        return [
          {
            date: todayKey,
            entries: newEntries,
          },
          ...prev,
        ];
      }

      // Makes a shallow copy of the array. Don't want to directly mutate the original state array
      const updatedDays = [...prev];
      const existingDay = updatedDays[existingDayIndex];

      // Keep existing day info, append the new entries to its entries array
      // So if today already had Bench Press and Squat, and you add Running,
      // then today's entries become Bench Press, Squat, Running
      updatedDays[existingDayIndex] = {
        ...existingDay,
        entries: [...existingDay.entries, ...newEntries],
      };

      return updatedDays; // React then uses that new array as the new state
    });
  }

  // Resets all history in memory to an empty array.
  // Then because of the save effect, that empty array gets saved to AsyncStorage
  function clearWorkoutHistory() {
    setWorkoutDays([]);
  }

  // Looks through workoutDays and returns today's workout group if it exists
  function getTodayWorkout() {
    const todayKey = getDateKey(new Date());
    return workoutDays.find((day) => day.date === todayKey) ?? null; // The ?? null means: if find(...) gives undefined, return null instead
  }

  // Searches every saved entry and returns the most recent version of one specific exercise.
  // This is useful for showing the user what they last did when they open the log screen.
  function getLatestExerciseEntry(exerciseId: string) {
    for (const day of workoutDays) {
      // Loop backward through each day so if the same exercise was logged multiple times that day,
      // we get the latest one from that day.
      for (let i = day.entries.length - 1; i >= 0; i -= 1) {
        const entry = day.entries[i];

        if (entry.exerciseId === exerciseId) {
          return entry;
        }
      }
    }

    return null;
  }

  // Creates the context value object
  // Without useMemo, React would recreate this object on every render
  // With useMemo, React only recreates it when workoutDays changes
  const value = useMemo(
    () => ({
      workoutDays,
      addWorkoutEntries,
      clearWorkoutHistory,
      getTodayWorkout,
      getLatestExerciseEntry,
    }),
    [workoutDays],
  );

  // Makes workout history data available to everything inside the provider
  return (
    <WorkoutHistoryContext.Provider value={value}>
      {children}
    </WorkoutHistoryContext.Provider>
  );
}

// Custom hook. Can use useWorkoutHistory() instead of useContext(WorkoutHistoryContext)
export function useWorkoutHistory() {
  const context = useContext(WorkoutHistoryContext);

  if (!context) {
    throw new Error(
      "useWorkoutHistory must be used inside WorkoutHistoryProvider",
    );
  }

  return context;
}
