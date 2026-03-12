// Evolution object
export type EvolutionStage = {
  level: number;
  name: string;
  icon: string;
};

export const evolutions: EvolutionStage[] = [
  {
    level: 1,
    name: "Beginner",
    icon: "🙂",
  },
  {
    level: 5,
    name: "Trained",
    icon: "💪",
  },
  {
    level: 10,
    name: "Fighter",
    icon: "🥊",
  },
  {
    level: 20,
    name: "Elite Athlete",
    icon: "🏋️",
  },
  {
    level: 40,
    name: "Legendary Champion",
    icon: "🔥",
  },
];

// Takes a level and returns the correct evolution
export function getEvolution(level: number) {
  // [0] is the first item in the array (beginner)
  let current = evolutions[0];

  // Example: player level: 12, check 12>=1 true, 12>=5 true, 12>=10 true, 12 ?=20 false
  for (const evo of evolutions) {
    if (level >= evo.level) {
      current = evo;
    }
  }

  return current;
}
