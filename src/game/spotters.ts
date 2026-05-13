import type { ImageSourcePropType } from "react-native";

import { CharacterClassId } from "./classes";
import { ExerciseStat } from "./exercises";

/*
  Spotter data lives here so adding/removing Spotters is simple.

  To add a Spotter later:
  1. Add a new id to SpotterId.
  2. Add a new object to SPOTTERS.
  3. Choose base stats, fixed move IDs, summon time, and spriteClassId.

  spriteClassId uses your current old class sprites as temporary Spotter images.
  Later, this can become a direct sprite field like:
  sprite: require("../../assets/sprites/mySpotter.png")
*/

export type SpotterId = "rook" | "blue" | "atlas" | "monkey";

export type SpotterDefinition = {
  id: SpotterId;
  name: string;
  icon: string;

  /*
    Optional party-menu style icon for roll results and compact UI.

    When you make your PNG icons, add them to your assets folder and replace
    the commented examples in SPOTTERS below with something like:
    iconImage: require("../../assets/spotter-icons/rook.png"),

    The emoji icon stays as a fallback so the app still works before you make
    art for every Spotter.
  */
  iconImage?: ImageSourcePropType;

  description: string;
  rarity: "common" | "rare" | "epic";

  /*
    Temporary visual choice.
    These use the old class sprite folders/assets.
  */
  spriteClassId: CharacterClassId;

  /*
    Spotters start with preset base stats.
    User upgrades are added on top of these.
  */
  baseStats: Record<ExerciseStat, number>;

  /*
    Spotter moves are fixed.
    The user cannot change Spotter moves from the Character screen.
  */
  fixedBasicSkillId: string;
  fixedSpecialSkillId: string;

  /*
    How long this Spotter replaces the main character in battle.
  */
  summonDurationMs: number;
};

export const SPOTTERS: SpotterDefinition[] = [
  {
    id: "rook",
    name: "Rook",
    icon: "🛡️",
    // iconImage: require("../../assets/spotter-icons/rook.png"),
    rarity: "common",
    description: "Balanced Spotter. Good all-around support.",
    spriteClassId: "warrior",
    baseStats: { strength: 45, endurance: 55, speed: 35 },
    fixedBasicSkillId: "axe_swing",
    fixedSpecialSkillId: "warrior_power_strike",
    summonDurationMs: 5000,
  },
  {
    id: "blue",
    name: "Blue",
    icon: "⚡",
    // iconImage: require("../../assets/spotter-icons/blue.png"),
    rarity: "rare",
    description: "Fast Spotter with quick attacks.",
    spriteClassId: "mage",
    baseStats: { strength: 35, endurance: 30, speed: 80 },
    fixedBasicSkillId: "mana",
    fixedSpecialSkillId: "mana",
    summonDurationMs: 7000,
  },
  {
    id: "atlas",
    name: "Atlas",
    icon: "🏋️",
    // iconImage: require("../../assets/spotter-icons/atlas.png"),
    rarity: "epic",
    description: "Strength-heavy Spotter built for burst damage.",
    spriteClassId: "archer",
    baseStats: { strength: 85, endurance: 45, speed: 25 },
    fixedBasicSkillId: "archer_arrow_rain",
    fixedSpecialSkillId: "archer_piercing_volley",
    summonDurationMs: 6000,
  },
  {
    id: "monkey",
    name: "Monkey",
    icon: "🌘",
    // iconImage: require("../../assets/spotter-icons/monkey.png"),
    rarity: "rare",
    description: "Quick Spotter with a shorter special charge requirement.",
    spriteClassId: "thief",
    baseStats: { strength: 45, endurance: 35, speed: 75 },
    fixedBasicSkillId: "hammer",
    fixedSpecialSkillId: "thief_shadow_flurry",
    summonDurationMs: 6500,
  },
];

export function getSpotterById(spotterId: string | null | undefined) {
  if (!spotterId) {
    return null;
  }

  return SPOTTERS.find((spotter) => spotter.id === spotterId) ?? null;
}

export function getRandomSpotter() {
  return SPOTTERS[Math.floor(Math.random() * SPOTTERS.length)];
}
