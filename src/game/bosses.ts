import { ImageSourcePropType } from "react-native";

// Boss object
export type BossStage = {
  level: number;
  name: string;
  sprite?: ImageSourcePropType;
  icon?: string;
  hpMultiplier: number;
};

export const bosses: BossStage[] = [
  {
    level: 1,
    name: "Miel",
    sprite: require("../../assets/sprites/boss1.png"),
    hpMultiplier: 1,
  },
  {
    level: 5,
    name: "ChouChou",
    sprite: require("../../assets/sprites/boss2.png"),
    hpMultiplier: 1.5,
  },
  {
    level: 10,
    name: "Chibi",
    icon: "🐗",
    hpMultiplier: 2,
  },
  {
    level: 25,
    name: "Nora",
    icon: "🗿",
    hpMultiplier: 3,
  },
  {
    level: 50,
    name: "Sophie",
    icon: "🐺",
    hpMultiplier: 5,
  },
  {
    level: 100,
    name: "Sousuke",
    icon: "🔥",
    hpMultiplier: 8,
  },
];

export function getBossStage(level: number) {
  let current = bosses[0];

  // Checks if player qualifies for a boss
  for (const boss of bosses) {
    if (level >= boss.level) {
      current = boss;
    }
  }

  return current;
}

export function calculateBossHP(level: number) {
  const stage = getBossStage(level);

  const baseHP = 100;

  // Formula: BossHP = baseHP x playerLevel x multiplier
  return Math.floor(baseHP * level * stage.hpMultiplier);
}
