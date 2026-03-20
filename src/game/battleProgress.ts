// This file is the save system for battles. It defines what battle progress looks like,
// creates a fresh new battle state, save battle progress, and load/clear saved progress.

// battle.tsx tries to load old progress with loadBattleProgress()
// As the boss HP/player HP changes during battle, it saves saveBattleProgress(...) so the state is always up to date

import AsyncStorage from "@react-native-async-storage/async-storage";

// Says battle result ca nonly be win, lose, or null. Null means the battle is still going.
export type BattleResult = "win" | "lose" | null;

// Defines battle progress
export type BattleSaveData = {
  bossLevel: number; // Boss the player is currently fighting
  bossMaxHP: number; // Boss current HP. Changes as the player attacks.
  bossHP: number; // Max value for the boss HP bar
  playerHP: number; // Player's current HP. Changes as the boss attacks.
  battleResult: BattleResult; // Win, lose, or null
};

// Name used to store battle progress in AsyncStorage
const BATTLE_PROGRESS_KEY = "PROXYFIT_BATTLE_PROGRESS";

// Loads saved battle data
export async function loadBattleProgress(): Promise<BattleSaveData | null> {
  try {
    const saved = await AsyncStorage.getItem(BATTLE_PROGRESS_KEY); // Checks to see if anything is saved under "PROXYFIT_BATTLE_PROGRESS"

    if (!saved) {
      return null;
    }

    return JSON.parse(saved) as BattleSaveData; // Converts saved text back into a BattleProgress object
  } catch (error) {
    console.log("Error loading battle progress:", error);
    return null;
  }
}

// Saves a BattleProgress object into AsyncStorage
export async function saveBattleProgress(data: BattleSaveData): Promise<void> {
  try {
    // Saves a value under the key "BATTLE_PROGRESS_KEY", so the storage name is "PROXYFIT_BATTLE_PROGRESS"
    // AsyncStorage can only store strings. JSON.stringify turns the JavaScript object into text so it can be stored.
    await AsyncStorage.setItem(BATTLE_PROGRESS_KEY, JSON.stringify(data));
  } catch (error) {
    console.log("Error saving battle progress:", error);
  }
}

// Deletes saved battle data (reset button)
export async function clearBattleProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BATTLE_PROGRESS_KEY);
  } catch (error) {
    console.log("Error clearing battle progress:", error);
  }
}

// Creates a fresh starting battle object
// Returned object is the starting battle state
// ex. Calling createInitialBattleProgress(1, 100, 120) would give
// ex. bossLevel: 1, bossHP: 100, bossMaxHP: 100, playerHP: 120, battleResult: null
export function createInitialBattleProgress(
  bossLevel: number,
  bossMaxHP: number,
  playerHP: number,
): BattleSaveData {
  return {
    bossLevel,
    bossMaxHP,
    bossHP: bossMaxHP, // Means boss starts at full health
    playerHP,
    battleResult: null,
  };
}
