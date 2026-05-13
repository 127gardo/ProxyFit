import { ImageSourcePropType } from "react-native";
import { bossSprites } from "./assets";
import { ECONOMY } from "./gameConfig";

const forestBackground = require("../../assets/backgrounds/forest.png");
const skiesBackground = require("../../assets/backgrounds/skies.png");
const beachBackground = require("../../assets/backgrounds/beach.png");

/*
  BossStage is the configuration for story/boss progression.

  Future-proof idea:
  - Add/remove bosses by editing the bosses array.
  - Do not hard-code boss names or HP rules in the battle screen.
  - Rewards and requirements belong here because they are boss/story design data.
*/
export type BossStage = {
  /*
    First boss level where this stage becomes active.
    Example: level 5 means this boss appears from battle level 5 onward
    until another boss with a higher level takes over.
  */
  level: number;

  name: string;
  /*
    spriteId connects this boss to the bossSprites animation registry in assets.ts.
    Use spriteId when the boss has image/animation frames.
    Use icon only as a quick placeholder if you do not have art yet.
  */
  spriteId?: keyof typeof bossSprites;
  icon?: string;

  /*
    Higher multiplier = tankier boss.
  */
  hpMultiplier: number;

  background: ImageSourcePropType;

  /*
    First-clear reward.
    This is set here so later bosses can have different rewards if you want.
  */
  firstClearSpotterPoints: number;

  /*
    Placeholder for future story gates.

    Example future use:
    requirements: {
      loggedWorkoutDays: 5,
      previousBossLevelCleared: 10,
    }
  */
  requirements?: {
    loggedWorkoutDays?: number;
    requiredBossLevelCleared?: number;
  };
};

export const bosses: BossStage[] = [
  {
    level: 1,
    name: "Miel",
    spriteId: "boss1",
    hpMultiplier: 1,
    background: forestBackground,
    firstClearSpotterPoints: ECONOMY.firstClearSpotterPoints,
  },
  {
    level: 5,
    name: "ChouChou",
    spriteId: "boss2",
    hpMultiplier: 1.5,
    background: forestBackground,
    firstClearSpotterPoints: ECONOMY.firstClearSpotterPoints,
  },
  {
    level: 10,
    name: "Chibi",
    spriteId: "boss3",
    hpMultiplier: 2,
    background: skiesBackground,
    firstClearSpotterPoints: ECONOMY.firstClearSpotterPoints,
  },
  {
    level: 25,
    name: "Nora",
    icon: "🗿",
    hpMultiplier: 3,
    background: beachBackground,
    firstClearSpotterPoints: ECONOMY.firstClearSpotterPoints,
  },
  {
    level: 50,
    name: "Sophie",
    icon: "🐺",
    hpMultiplier: 5,
    background: forestBackground,
    firstClearSpotterPoints: ECONOMY.firstClearSpotterPoints,
  },
  {
    level: 100,
    name: "Sousuke",
    icon: "🔥",
    hpMultiplier: 8,
    background: skiesBackground,
    firstClearSpotterPoints: ECONOMY.firstClearSpotterPoints,
  },
];

/*
  Gets the boss stage for the current battle level.

  Example:
  - battle level 1-4 = Miel
  - battle level 5-9 = ChouChou
  - battle level 10-24 = Chibi
*/
export function getBossStage(level: number) {
  let current = bosses[0];

  for (const boss of bosses) {
    if (level >= boss.level) {
      current = boss;
    }
  }

  return current;
}

/*
  Boss HP formula.

  This is intentionally simple and centralized:
  base HP x battle level x current boss multiplier.
*/
export function calculateBossHP(level: number) {
  const stage = getBossStage(level);
  const baseHP = 100;

  return Math.floor(baseHP * level * stage.hpMultiplier);
}
