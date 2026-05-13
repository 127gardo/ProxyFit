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
  updateSessionEntry: (entryId: string, entry: AddSessionEntryInput) => void;
  removeSessionEntry: (entryId: string) => void;
  getSessionEntryById: (entryId: string) => SessionEntry | undefined;
  clearSession: () => void;
};

const WorkoutSessionContext = createContext<WorkoutSessionContextType | null>(
  null,
);

function createSessionEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/*
  Calculates XP/stat points for one logged exercise.

  Important:
  - This does not directly change the character.
  - It only calculates what the exercise is worth.
  - The complete workout screen sends the final reward bundle to CharacterProvider.

  That keeps this file focused only on workout-session math.
*/
export function calculateEntryXP(entry: SessionEntry) {
  if (entry.type === "strength") {
    const reps = entry.reps ?? 0;
    const sets = entry.sets ?? 1;

    /*
      Bodyweight exercises do not have a numeric weight.
      Instead of pretending the weight is 0, we use a simple bodyweight formula.
    */
    if (entry.weightUnit === "bodyweight") {
      const bodyweightVolume = reps * sets * 12;
      return Math.max(1, Math.floor(bodyweightVolume / 40));
    }

    /*
      Weighted strength formula:
      weight x reps x sets = total volume.
    */
    const volume = (entry.weight ?? 0) * reps * sets;

    return Math.max(1, Math.floor(volume / 40));
  }

  /*
    Cardio formula:
    time gives reliable effort credit.
    distance gives a bonus.
  */
  const cardioScore = (entry.time ?? 0) * 2 + (entry.distance ?? 0) * 15;

  return Math.max(1, Math.floor(cardioScore));
}

/*
  Converts a whole workout session into stat-specific reward points.

  Example:
  - Bench Press trains ["strength"]
  - Running trains ["speed", "endurance"]

  If an exercise trains multiple stats, its points are split across those stats.
*/
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
    const statCount = Math.max(1, entry.stats.length);
    const splitXp = Math.max(1, Math.floor(baseXp / statCount));

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

  const value = useMemo<WorkoutSessionContextType>(
    () => ({
      sessionEntries,

      addSessionEntry(entry) {
        const newEntry: SessionEntry = {
          id: createSessionEntryId(),
          createdAt: new Date().toISOString(),
          ...entry,
        };

        setSessionEntries((currentEntries) => {
          const updatedEntries = [...currentEntries, newEntry];

          AsyncStorage.setItem(
            WORKOUT_SESSION_KEY,
            JSON.stringify(updatedEntries),
          );

          return updatedEntries;
        });
      },

      updateSessionEntry(entryId, entry) {
        /*
          Editing a current-session exercise keeps the original ID and timestamp.
          That way React can keep the same row identity, and the user is just
          correcting a mistake instead of creating a brand-new log item.
        */
        setSessionEntries((currentEntries) => {
          const updatedEntries = currentEntries.map((currentEntry) =>
            currentEntry.id === entryId
              ? {
                  ...currentEntry,
                  ...entry,
                }
              : currentEntry,
          );

          AsyncStorage.setItem(
            WORKOUT_SESSION_KEY,
            JSON.stringify(updatedEntries),
          );

          return updatedEntries;
        });
      },

      removeSessionEntry(entryId) {
        setSessionEntries((currentEntries) => {
          const updatedEntries = currentEntries.filter(
            (entry) => entry.id !== entryId,
          );

          AsyncStorage.setItem(
            WORKOUT_SESSION_KEY,
            JSON.stringify(updatedEntries),
          );

          return updatedEntries;
        });
      },

      getSessionEntryById(entryId) {
        return sessionEntries.find((entry) => entry.id === entryId);
      },

      clearSession() {
        setSessionEntries([]);
        AsyncStorage.removeItem(WORKOUT_SESSION_KEY);
      },
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
