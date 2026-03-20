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
  // Chest
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
    id: "chest_fly",
    name: "Chest Fly",
    muscles: ["chest"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "lower_chest_fly",
    name: "Lower Chest Fly",
    muscles: ["chest"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "standing_chest_press",
    name: "Standing Chest Press",
    muscles: ["chest"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "chest_press",
    name: "Chest Press",
    muscles: ["chest"],
    stats: ["strength"],
    type: "strength",
  },
  // Shoulder
  {
    id: "lateral_raise",
    name: "Lateral Raise",
    muscles: ["shoulders"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "face_pull",
    name: "Face Pull",
    muscles: ["shoulders"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "shoulder_shrug",
    name: "Shoulder Shrug",
    muscles: ["shoulders"],
    stats: ["strength"],
    type: "strength",
  },
  // Arms
  {
    id: "tricep_extension",
    name: "Tricep Extension",
    muscles: ["arms"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "skullcrusher",
    name: "Skull Crusher",
    muscles: ["arms"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "tricep_kickback",
    name: "Tricep Kickback",
    muscles: ["arms"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "dips",
    name: "Dips",
    muscles: ["arms"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "bicep_curl",
    name: "Bicep Curl",
    muscles: ["arms"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "barbell_curl",
    name: "Barbell Curl",
    muscles: ["arms"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "incline_bicep_curl",
    name: "Incline Bicep Curl",
    muscles: ["arms"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "hammer_curl",
    name: "Hammer Curl",
    muscles: ["arms"],
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
    id: "single_arm_shoulder_press",
    name: "Single Arm Shoulder Press",
    muscles: ["shoulders", "arms"],
    stats: ["strength"],
    type: "strength",
  },

  // Cardio
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
  // Legs
  {
    id: "squat",
    name: "Squat",
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
    id: "leg_press",
    name: "Leg Press",
    muscles: ["legs"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "calf_raise",
    name: "Calf Raise",
    muscles: ["legs"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "goblet_squat",
    name: "Goblet Squat",
    muscles: ["legs"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "lunge",
    name: "Lunge",
    muscles: ["legs"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "side_lunge",
    name: "Side Lunge",
    muscles: ["legs"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "bulgarian_lunge",
    name: "Bulgarian Lunge",
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
  // Core
  {
    id: "plank",
    name: "Plank",
    muscles: ["core"],
    stats: ["endurance"],
    type: "strength",
  },
  {
    id: "sit_up",
    name: "Sit Up",
    muscles: ["core"],
    stats: ["strength", "endurance"],
    type: "strength",
  },
  {
    id: "decline_sit_up",
    name: "Decline Sit Up",
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
    id: "hanging_leg_raise",
    name: "Hanging Leg Raise",
    muscles: ["core"],
    stats: ["strength", "endurance"],
    type: "strength",
  },
  {
    id: "cable_crunch",
    name: "Cable Crunch",
    muscles: ["core"],
    stats: ["strength", "endurance"],
    type: "strength",
  },
  // Back
  {
    id: "pullup",
    name: "Pullup",
    muscles: ["back", "arms"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "stead_row",
    name: "Stead Row",
    muscles: ["back"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "kneeling_row",
    name: "Kneeling Row",
    muscles: ["back"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "overhand_barbell_row",
    name: "Overhand Barbell Row",
    muscles: ["back"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "underhand_barbell_row",
    name: "Underhand Barbell Row",
    muscles: ["back"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "lat_pulldown",
    name: "Lat Pulldown",
    muscles: ["back"],
    stats: ["strength"],
    type: "strength",
  },
  {
    id: "rear_delt_fly",
    name: "Rear Delt Fly",
    muscles: ["back"],
    stats: ["strength"],
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
