import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../auth/AuthProvider";
import {
  Exercise,
  ExerciseStat,
  MuscleGroup,
  createCustomExercise,
  exercises,
} from "./exercises";

/*
  CustomExercisesProvider keeps user-created exercises separate from the
  built-in exercise list.

  Why separate?
  - Built-in exercises are app data and can be updated by you later.
  - Custom exercises are user data and should belong to the logged-in account.
  - The workout screen merges both lists so the user experiences one pool.

  For now this saves locally per Supabase user ID. If you want cloud sync later,
  the easiest path is adding a Supabase table like proxyfit_custom_exercises
  with user_id + data, similar to your character/workout history tables.
*/

const CUSTOM_EXERCISES_KEY = "PROXYFIT_CUSTOM_EXERCISES";

export type CustomExerciseInput = {
  name: string;
  muscle: MuscleGroup;
  stats?: ExerciseStat[];
};

type CustomExercisesContextType = {
  customExercises: Exercise[];
  allExercises: Exercise[];
  addCustomExercise: (input: CustomExerciseInput) => Exercise | null;
  getExerciseById: (id: string) => Exercise | undefined;
};

const CustomExercisesContext = createContext<CustomExercisesContextType | null>(
  null,
);

function getUserKey(userId: string) {
  return `${CUSTOM_EXERCISES_KEY}:${userId}`;
}

function normalizeSavedExercises(savedExercises: unknown): Exercise[] {
  if (!Array.isArray(savedExercises)) {
    return [];
  }

  return savedExercises.filter((exercise): exercise is Exercise => {
    return (
      typeof exercise?.id === "string" &&
      typeof exercise?.name === "string" &&
      Array.isArray(exercise?.muscles) &&
      Array.isArray(exercise?.stats) &&
      (exercise?.type === "strength" || exercise?.type === "cardio")
    );
  });
}

export function CustomExercisesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [hasLoadedForUser, setHasLoadedForUser] = useState(false);

  useEffect(() => {
    async function loadCustomExercises() {
      if (!user?.id) {
        setCustomExercises([]);
        setHasLoadedForUser(false);
        return;
      }

      setHasLoadedForUser(false);
      setCustomExercises([]);

      try {
        const saved = await AsyncStorage.getItem(getUserKey(user.id));
        setCustomExercises(
          normalizeSavedExercises(saved ? JSON.parse(saved) : []),
        );
      } catch (error) {
        console.log("Error loading custom exercises:", error);
        setCustomExercises([]);
      }

      setHasLoadedForUser(true);
    }

    loadCustomExercises();
  }, [user?.id]);

  useEffect(() => {
    async function saveCustomExercises() {
      if (!user?.id || !hasLoadedForUser) {
        return;
      }

      try {
        await AsyncStorage.setItem(
          getUserKey(user.id),
          JSON.stringify(customExercises),
        );
      } catch (error) {
        console.log("Error saving custom exercises:", error);
      }
    }

    saveCustomExercises();
  }, [customExercises, user?.id, hasLoadedForUser]);

  const allExercises = useMemo(
    () =>
      [...exercises, ...customExercises].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [customExercises],
  );

  const value = useMemo<CustomExercisesContextType>(
    () => ({
      customExercises,
      allExercises,

      addCustomExercise(input) {
        const trimmedName = input.name.trim();

        if (!trimmedName) {
          return null;
        }

        const duplicate = allExercises.some(
          (exercise) =>
            exercise.name.toLowerCase() === trimmedName.toLowerCase(),
        );

        if (duplicate) {
          return null;
        }

        const newExercise = createCustomExercise({
          name: trimmedName,
          muscle: input.muscle,
          stats: input.stats,
        });

        setCustomExercises((current) => [...current, newExercise]);
        return newExercise;
      },

      getExerciseById(id) {
        return allExercises.find((exercise) => exercise.id === id);
      },
    }),
    [allExercises, customExercises],
  );

  return (
    <CustomExercisesContext.Provider value={value}>
      {children}
    </CustomExercisesContext.Provider>
  );
}

export function useCustomExercises() {
  const context = useContext(CustomExercisesContext);

  if (!context) {
    throw new Error(
      "useCustomExercises must be used inside CustomExercisesProvider",
    );
  }

  return context;
}
