export type ExerciseStat = "strength" | "endurance" | "speed";

export type MuscleGroup =
  | "chest"
  | "back"
  | "arms"
  | "legs"
  | "shoulders"
  | "core"
  | "cardio";

export type ExerciseType = "strength" | "cardio";

export type Exercise = {
  id: string;
  name: string;
  muscles: MuscleGroup[];
  stats: ExerciseStat[];
  type: ExerciseType;
};

export const muscleGroups: MuscleGroup[] = [
  "chest",
  "back",
  "arms",
  "legs",
  "shoulders",
  "core",
  "cardio",
];

export const exercises: Exercise[] = [
  {
    id: "bench_press",
    name: "Bench Press",
    muscles: ["chest", "arms"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "incline_bench",
    name: "Incline Bench Press",
    muscles: ["chest", "shoulders"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "squats",
    name: "Squats",
    muscles: ["legs"],
    stats: ["strength", "endurance"],
    type: "strength",
  },
  {
    id: "deadlift",
    name: "Deadlift",
    muscles: ["back", "legs"],
    stats: ["strength", "endurance"],
    type: "strength",
  },
  {
    id: "pullups",
    name: "Pullups",
    muscles: ["back", "arms"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "shoulder_press",
    name: "Shoulder Press",
    muscles: ["shoulders", "arms"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "plank",
    name: "Plank",
    muscles: ["core"],
    stats: ["endurance"],
    type: "strength",
  },
  {
    id: "running",
    name: "Running",
    muscles: ["legs", "cardio"],
    stats: ["speed", "endurance"],
    type: "cardio",
  },
  {
    id: "cycling",
    name: "Cycling",
    muscles: ["legs", "cardio"],
    stats: ["speed", "endurance"],
    type: "cardio",
  },
  {
    id: "leg_press",
    name: "Leg Press",
    muscles: ["legs"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "calf_raises",
    name: "Calf Raises",
    muscles: ["legs"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "goblet_squats",
    name: "Goblet Squats",
    muscles: ["legs"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "lunges",
    name: "Lunges",
    muscles: ["legs"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "side_lunges",
    name: "Side Lunges",
    muscles: ["legs"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "bulgarian_lunges",
    name: "Bulgarian Lunges",
    muscles: ["legs"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "leg_extension",
    name: "Leg Extension",
    muscles: ["legs"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "sit_ups",
    name: "Sit Ups",
    muscles: ["core"],
    stats: ["strength", "endurance"],
    type: "strength",
  },
  {
    id: "decline_sit_ups",
    name: "Decline Sit Ups",
    muscles: ["core"],
    stats: ["strength", "endurance"],
    type: "strength",
  },
  {
    id: "russian_twist",
    name: "Russian Twist",
    muscles: ["core"],
    stats: ["strength", "endurance"],
    type: "strength",
  },
  {
    id: "hanging_leg_raises",
    name: "Hanging Leg Raises",
    muscles: ["core"],
    stats: ["strength", "endurance"],
    type: "strength",
  },
  {
    id: "cable_crunches",
    name: "Cable Crunches",
    muscles: ["core"],
    stats: ["strength", "endurance"],
    type: "strength",
  },
];

export function getExercisesByMuscles(selected: MuscleGroup[]) {
  return exercises.filter((exercise) =>
    selected.some((muscle) => exercise.muscles.includes(muscle)),
  );
}

export function getExerciseById(id: string) {
  return exercises.find((exercise) => exercise.id === id);
}
