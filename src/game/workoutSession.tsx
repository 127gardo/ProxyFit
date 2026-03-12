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

const WORKOUT_SESSION_KEY = "PROXYFIT_WORKOUT_SESSION";

export type SessionEntry = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: "strength" | "cardio";
  stats: ExerciseStat[];
  createdAt: string;
  weight?: number;
  weightUnit?: WeightUnit;
  reps?: number;
  sets?: number;
  time?: number;
  distance?: number;
};

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

type SessionRewards = {
  rewards: Record<ExerciseStat, number>;
  totalXp: number;
};

type WorkoutSessionContextType = {
  sessionEntries: SessionEntry[];
  addSessionEntry: (entry: AddSessionEntryInput) => void;
  clearSession: () => void;
};

const WorkoutSessionContext = createContext<WorkoutSessionContextType | null>(
  null,
);

export function calculateEntryXP(entry: SessionEntry) {
  if (entry.type === "strength") {
    const volume = (entry.weight ?? 0) * (entry.reps ?? 0) * (entry.sets ?? 1);

    return Math.max(1, Math.floor(volume / 40));
  }

  const cardioScore = (entry.time ?? 0) * 2 + (entry.distance ?? 0) * 15;

  return Math.max(1, Math.floor(cardioScore));
}

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
