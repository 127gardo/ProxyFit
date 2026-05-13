import { ExerciseStat } from "./exercises";

/*
  Central balance file.

  Put numbers here when they are game-design knobs instead of hard-coded logic.
  That keeps future changes easy: change this file instead of hunting through
  screens and providers.
*/

export const STAT_KEYS: ExerciseStat[] = ["strength", "endurance", "speed"];

export const STAT_LABELS: Record<ExerciseStat, string> = {
  strength: "Strength",
  endurance: "Endurance",
  speed: "Speed",
};

export const ECONOMY = {
  dailyFirstWorkoutSpotterPoints: 100,
  firstClearSpotterPoints: 25,
  singleSpotterRollCost: 100,
  tenSpotterRollCost: 900,
  directSpotterBuyCost: 1500,
  duplicateSpotterPointRefund: 50,
  paidStatResetCost: 1500,
} as const;

export const STAT_UPGRADE_RULES = {
  mainCharacterMaxAllocatedPointsPerStat: 100,
  spotterMaxAllocatedPointsPerStat: 50,
  costIncreasePerUpgrade: 5,
  statGainPerUpgrade: 1,
} as const;

export function createEmptyStatMap() {
  return {
    strength: 0,
    endurance: 0,
    speed: 0,
  } satisfies Record<ExerciseStat, number>;
}

export function addStatMaps(
  left: Record<ExerciseStat, number>,
  right: Partial<Record<ExerciseStat, number>>,
) {
  return {
    strength: left.strength + (right.strength ?? 0),
    endurance: left.endurance + (right.endurance ?? 0),
    speed: left.speed + (right.speed ?? 0),
  } satisfies Record<ExerciseStat, number>;
}

/*
  Upgrade cost is intentionally formula-based:
  upgrade #1 costs 5, #2 costs 10, #3 costs 15, etc.
*/
export function getNextStatUpgradeCost(allocatedStatPoints: number) {
  return (allocatedStatPoints + 1) * STAT_UPGRADE_RULES.costIncreasePerUpgrade;
}
