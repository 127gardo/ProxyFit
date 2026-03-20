// This file manages bosses. Decides which boss should appear and how much HP it should have

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

// Chooses the correct boss based on the character's level
export function getBossStage(level: number) {
  let current = bosses[0];

  // Checks if character qualifies for the boss
  for (const boss of bosses) {
    if (level >= boss.level) {
      current = boss;
    }
  }

  //if the character qualifies, update current boss
  return current;
}

export function calculateBossHP(level: number) {
  const stage = getBossStage(level);

  const baseHP = 100;

  // Formula: BossHP = baseHP x playerLevel x multiplier
  // ex. if hpMultiplier: 1.5 and level is 5, formula is 100 x 5 x 1.5 = 750
  return Math.floor(baseHP * level * stage.hpMultiplier);
}
