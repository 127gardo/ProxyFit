import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../auth/AuthProvider";
import { loadCloudWorkoutHistory, saveCloudWorkoutHistory } from "./cloudSave";
import { loadWorkoutHistory, saveWorkoutHistory } from "./storage";

export type WeightUnit = "lbs" | "kg" | "bodyweight";

export type WorkoutEntry = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: "strength" | "cardio";
  completedAt: string;
  weight?: number;
  weightUnit?: WeightUnit;
  reps?: number;
  sets?: number;
  time?: number;
  distance?: number;
};

export type WorkoutDay = {
  date: string;
  entries: WorkoutEntry[];
};

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
  workoutDays: WorkoutDay[];
  addWorkoutEntries: (entries: AddWorkoutEntryInput[]) => void;
  clearWorkoutHistory: () => void;
  getTodayWorkout: () => WorkoutDay | null;
  getLatestExerciseEntry: (exerciseId: string) => WorkoutEntry | null;
};

const WorkoutHistoryContext = createContext<WorkoutHistoryContextType | null>(
  null,
);

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function WorkoutHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [hasLoadedForUser, setHasLoadedForUser] = useState(false);

  useEffect(() => {
    async function loadSaveForCurrentUser() {
      if (!user?.id) {
        setWorkoutDays([]);
        setHasLoadedForUser(false);
        return;
      }

      setHasLoadedForUser(false);

      /*
        Clear the visible workout history immediately.

        This prevents Account B from temporarily seeing Account A's workout
        history while the app is loading Account B's data.
      */
      setWorkoutDays([]);

      /*
        First load the local phone save.

        This allows offline use.
      */
      const localWorkoutDays = await loadWorkoutHistory(user.id);

      if (localWorkoutDays) {
        setWorkoutDays(localWorkoutDays as WorkoutDay[]);
      }

      /*
        Then try Supabase.

        If Supabase has data, it becomes the main save and replaces the local
        cache on this phone.
      */
      const cloudWorkoutDays = await loadCloudWorkoutHistory(user.id);

      if (cloudWorkoutDays) {
        setWorkoutDays(cloudWorkoutDays);
        await saveWorkoutHistory(cloudWorkoutDays, user.id);
      } else if (localWorkoutDays) {
        /*
          If this account has a local save but no cloud save yet,
          upload the local save once.
        */
        await saveCloudWorkoutHistory(
          user.id,
          localWorkoutDays as WorkoutDay[],
        );
      }

      setHasLoadedForUser(true);
    }

    loadSaveForCurrentUser();
  }, [user?.id]);

  useEffect(() => {
    async function saveCurrentWorkoutHistory() {
      if (!user?.id || !hasLoadedForUser) {
        return;
      }

      await saveWorkoutHistory(workoutDays, user.id);
      await saveCloudWorkoutHistory(user.id, workoutDays);
    }

    saveCurrentWorkoutHistory();
  }, [workoutDays, user?.id, hasLoadedForUser]);

  function addWorkoutEntries(entries: AddWorkoutEntryInput[]) {
    if (entries.length === 0) {
      return;
    }

    const now = new Date();
    const todayKey = getDateKey(now);

    const newEntries: WorkoutEntry[] = entries.map((entry) => ({
      id: `${Date.now()}-${Math.random()}`,
      exerciseId: entry.exerciseId,
      exerciseName: entry.exerciseName,
      type: entry.type,
      completedAt: now.toISOString(),
      weight: entry.weight,
      weightUnit: entry.weightUnit,
      reps: entry.reps,
      sets: entry.sets,
      time: entry.time,
      distance: entry.distance,
    }));

    setWorkoutDays((prev) => {
      const existingDayIndex = prev.findIndex((day) => day.date === todayKey);

      if (existingDayIndex === -1) {
        return [
          {
            date: todayKey,
            entries: newEntries,
          },
          ...prev,
        ];
      }

      const updatedDays = [...prev];
      const existingDay = updatedDays[existingDayIndex];

      updatedDays[existingDayIndex] = {
        ...existingDay,
        entries: [...existingDay.entries, ...newEntries],
      };

      return updatedDays;
    });
  }

  function clearWorkoutHistory() {
    setWorkoutDays([]);
  }

  function getTodayWorkout() {
    const todayKey = getDateKey(new Date());
    return workoutDays.find((day) => day.date === todayKey) ?? null;
  }

  function getLatestExerciseEntry(exerciseId: string) {
    for (const day of workoutDays) {
      for (let i = day.entries.length - 1; i >= 0; i -= 1) {
        const entry = day.entries[i];

        if (entry.exerciseId === exerciseId) {
          return entry;
        }
      }
    }

    return null;
  }

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

  return (
    <WorkoutHistoryContext.Provider value={value}>
      {children}
    </WorkoutHistoryContext.Provider>
  );
}

export function useWorkoutHistory() {
  const context = useContext(WorkoutHistoryContext);

  if (!context) {
    throw new Error(
      "useWorkoutHistory must be used inside WorkoutHistoryProvider",
    );
  }

  return context;
}
