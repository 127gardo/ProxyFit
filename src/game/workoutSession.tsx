import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ExerciseStat } from "./exercises";
import { WeightUnit } from "./workoutHistory";

// Key used to save to AsyncStorage
const WORKOUT_SESSION_KEY = "PROXYFIT_WORKOUT_SESSION";

// Defines what one exercise inside the current workout session looks like
export type SessionEntry = {
  id: string; // Unique ID
  exerciseId: string; // Machine-friendly identifier (bench_press)
  exerciseName: string; // user-friendly identifier (Bench Press)
  type: "strength" | "cardio";
  stats: ExerciseStat[]; // Which stat this exercise trains
  createdAt: string; // Timestamp
  weight?: number;
  weightUnit?: WeightUnit;
  reps?: number;
  sets?: number;
  time?: number;
  distance?: number;
};

// Defined data passed in when adding a new session entry
type AddSessionEntryInput = {
  exerciseId: string;
  exerciseName: string;
  type: "strength" | "cardio";
  stats: ExerciseStat[];
  weight?: number;
  weightUnit?: WeightUnit;
  reps?: number;
  sets?: number;
  time?: number;
  distance?: number;
};

// Defines what the reward calculation returns
type SessionRewards = {
  rewards: Record<ExerciseStat, number>;
  totalXp: number;
};

// Defines what context provides to the rest of the app. For screens that use useWorkoutSession()
type WorkoutSessionContextType = {
  sessionEntries: SessionEntry[]; // Exercises in the currently active workout
  addSessionEntry: (entry: AddSessionEntryInput) => void; // Adds a new entry into current session
  clearSession: () => void; // Removes all entries from the current session
};

// Creates the shared workout session container
const WorkoutSessionContext = createContext<WorkoutSessionContextType | null>(
  null,
);

// Calculates XP for one session entry
// If the entry is a strength exercise, XP is usually based on volume.
// Normal volume formula: weight x reps x sets. Example: 100 x 10 x 3 = 3000.
// Then XP becomes Math.floor(3000 / 40) = 75.
//
// Bodyweight exercises do not have a weight input, so they use a simpler volume-style formula:
// reps x sets x 12. Example: 12 x 3 x 12 = 432, which becomes Math.floor(432 / 40) = 10.
export function calculateEntryXP(entry: SessionEntry) {
  if (entry.type === "strength") {
    const reps = entry.reps ?? 0;
    const sets = entry.sets ?? 1;

    // Bodyweight exercises skip the weight input,
    // so give them their own XP formula instead of pretending a weight was entered.
    if (entry.weightUnit === "bodyweight") {
      const bodyweightVolume = reps * sets * 12;
      return Math.max(1, Math.floor(bodyweightVolume / 40));
    }

    // entry.weight ?? 0 means use entry.weight if it exists, otherwise use 0
    const volume = (entry.weight ?? 0) * reps * sets;

    return Math.max(1, Math.floor(volume / 40)); // Math.max(1,...) guarantees at least 1 XP. Rounds down to a whole number
  }

  // If the entry is not strength, it falls into the cardio formula.
  // Cardio XP is based on time and distance. If time = 20, and distance = 2,
  // then 20 x 2 + 2 x 15 = 40 + 30 = 70.
  const cardioScore = (entry.time ?? 0) * 2 + (entry.distance ?? 0) * 15;

  return Math.max(1, Math.floor(cardioScore));
}

// Takes all entries in the current session and calculates the total rewards
export function calculateSessionRewards(
  entries: SessionEntry[],
): SessionRewards {
  const rewards: Record<ExerciseStat, number> = {
    strength: 0,
    endurance: 0,
    speed: 0,
  };

  let totalXp = 0;

  for (const entry of entries) {
    const baseXp = calculateEntryXP(entry);
    const splitXp = Math.max(1, Math.floor(baseXp / entry.stats.length));

    for (const stat of entry.stats) {
      rewards[stat] += splitXp;
      totalXp += splitXp;
    }
  }

  return {
    rewards,
    totalXp,
  };
}

export function WorkoutSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionEntries, setSessionEntries] = useState<SessionEntry[]>([]);

  useEffect(() => {
    async function loadSession() {
      try {
        const saved = await AsyncStorage.getItem(WORKOUT_SESSION_KEY);

        if (saved) {
          setSessionEntries(JSON.parse(saved) as SessionEntry[]);
        }
      } catch (error) {
        console.log("Error loading workout session:", error);
      }
    }

    loadSession();
  }, []);

  useEffect(() => {
    async function saveSession() {
      try {
        await AsyncStorage.setItem(
          WORKOUT_SESSION_KEY,
          JSON.stringify(sessionEntries),
        );
      } catch (error) {
        console.log("Error saving workout session:", error);
      }
    }

    saveSession();
  }, [sessionEntries]);

  function addSessionEntry(entry: AddSessionEntryInput) {
    const newEntry: SessionEntry = {
      id: `${Date.now()}-${Math.random()}`,
      exerciseId: entry.exerciseId,
      exerciseName: entry.exerciseName,
      type: entry.type,
      stats: entry.stats,
      createdAt: new Date().toISOString(),
      weight: entry.weight,
      weightUnit: entry.weightUnit,
      reps: entry.reps,
      sets: entry.sets,
      time: entry.time,
      distance: entry.distance,
    };

    setSessionEntries((prev) => [...prev, newEntry]);
  }

  function clearSession() {
    setSessionEntries([]);
  }

  const value = useMemo(
    () => ({
      sessionEntries,
      addSessionEntry,
      clearSession,
    }),
    [sessionEntries],
  );

  return (
    <WorkoutSessionContext.Provider value={value}>
      {children}
    </WorkoutSessionContext.Provider>
  );
}

export function useWorkoutSession() {
  const context = useContext(WorkoutSessionContext);

  if (!context) {
    throw new Error(
      "useWorkoutSession must be used inside WorkoutSessionProvider",
    );
  }

  return context;
}
