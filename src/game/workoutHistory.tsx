import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const WORKOUT_HISTORY_KEY = "PROXYFIT_WORKOUT_HISTORY";

export type WeightUnit = "lbs" | "kg";

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
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);

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

  const value = useMemo(
    () => ({
      workoutDays,
      addWorkoutEntries,
      clearWorkoutHistory,
      getTodayWorkout,
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
