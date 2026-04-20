import { ImageSourcePropType } from "react-native";

const forestBackground = require("../../assets/backgrounds/forest.png");
const skiesBackground = require("../../assets/backgrounds/skies.png");
const beachBackground = require("../../assets/backgrounds/beach.png");

export type BossStage = {
  level: number;
  name: string;
  sprite?: ImageSourcePropType;
  icon?: string;
  hpMultiplier: number;
  background: ImageSourcePropType;
};

export const bosses: BossStage[] = [
  {
    level: 1,
    name: "Miel",
    sprite: require("../../assets/sprites/boss1.png"),
    hpMultiplier: 1,
    background: forestBackground,
  },
  {
    level: 5,
    name: "ChouChou",
    sprite: require("../../assets/sprites/boss2.png"),
    hpMultiplier: 1.5,
    background: forestBackground,
  },
  {
    level: 10,
    name: "Chibi",
    sprite: require("../../assets/sprites/boss3.png"),
    hpMultiplier: 2,
    background: skiesBackground,
  },
  {
    level: 25,
    name: "Nora",
    icon: "🗿",
    hpMultiplier: 3,
    background: forestBackground,
  },
  {
    level: 50,
    name: "Sophie",
    icon: "🐺",
    hpMultiplier: 5,
    background: forestBackground,
  },
  {
    level: 100,
    name: "Sousuke",
    icon: "🔥",
    hpMultiplier: 8,
    background: forestBackground,
  },
];

export function getBossStage(level: number) {
  let current = bosses[0];

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

  return Math.floor(baseHP * level * stage.hpMultiplier);
}
