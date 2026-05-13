// This file is the save system for battles.
// It uses BOTH local storage and Supabase cloud storage.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import {
  deleteCloudBattleProgress,
  loadCloudBattleProgress,
  saveCloudBattleProgress,
} from "./cloudSave";

// Battle result can only be win, lose, or null.
// null means the battle is still going.
export type BattleResult = "win" | "lose" | null;

// Defines battle progress.
export type BattleSaveData = {
  bossLevel: number; // Boss the player is currently fighting.
  bossMaxHP: number; // Max value for the boss HP bar.
  bossHP: number; // Boss current HP. Changes as the player attacks.
  playerHP: number; // Player's current HP. Changes as the boss attacks.
  battleResult: BattleResult; // win, lose, or null.

  /*
    Tracks which boss levels have already paid their first-clear reward.

    Example:
    - User clears boss level 1 for the first time.
    - They get 25 Spotter Points.
    - "1" gets added here.
    - If they replay/retry that boss later, they do not get paid again.

    This is stored in battle progress because it belongs to story/boss progress,
    not workout history.
  */
  rewardedBossLevels: number[];
};

const BATTLE_PROGRESS_KEY = "PROXYFIT_BATTLE_PROGRESS";

/*
  Returns the current Supabase user ID.

  We do this inside the battle save file so battle.tsx does not have to know
  about Supabase directly.
*/
async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/*
  Creates a local storage key for one specific account.

  Old version:
  PROXYFIT_BATTLE_PROGRESS

  New logged-in version:
  PROXYFIT_BATTLE_PROGRESS:user-id-here

  This prevents two accounts on the same phone from sharing the same battle.
*/
function getBattleProgressKey(userId: string | null) {
  return userId ? `${BATTLE_PROGRESS_KEY}:${userId}` : BATTLE_PROGRESS_KEY;
}

/*
  Save data changes over time while you build the game.

  This function makes old saves safe by filling in new fields.
  Without this, existing users could crash after an update because their old
  save data does not have rewardedBossLevels yet.
*/
function normalizeBattleSaveData(
  data: Partial<BattleSaveData>,
): BattleSaveData {
  return {
    bossLevel: data.bossLevel ?? 1,
    bossMaxHP: data.bossMaxHP ?? 100,
    bossHP: data.bossHP ?? data.bossMaxHP ?? 100,
    playerHP: data.playerHP ?? 100,
    battleResult: data.battleResult ?? null,
    rewardedBossLevels: Array.isArray(data.rewardedBossLevels)
      ? data.rewardedBossLevels
      : [],
  };
}

async function loadLocalBattleProgress(userId: string | null) {
  try {
    const saved = await AsyncStorage.getItem(getBattleProgressKey(userId));

    if (!saved) {
      return null;
    }

    return normalizeBattleSaveData(JSON.parse(saved));
  } catch (error) {
    console.log("Error loading local battle progress:", error);
    return null;
  }
}

async function saveLocalBattleProgress(
  userId: string | null,
  data: BattleSaveData,
) {
  try {
    await AsyncStorage.setItem(
      getBattleProgressKey(userId),
      JSON.stringify(normalizeBattleSaveData(data)),
    );
  } catch (error) {
    console.log("Error saving local battle progress:", error);
  }
}

async function clearLocalBattleProgress(userId: string | null) {
  try {
    await AsyncStorage.removeItem(getBattleProgressKey(userId));
  } catch (error) {
    console.log("Error clearing local battle progress:", error);
  }
}

// Loads saved battle data.
export async function loadBattleProgress(): Promise<BattleSaveData | null> {
  const userId = await getCurrentUserId();

  /*
    Step 1: Load from the phone first so the battle can work offline.
  */
  const localBattleProgress = await loadLocalBattleProgress(userId);

  if (!userId) {
    return localBattleProgress;
  }

  /*
    Step 2: If the user is online, try to load the Supabase version.
    If it exists, cloud wins and updates the phone cache.
  */
  const cloudBattleProgress = await loadCloudBattleProgress(userId);

  if (cloudBattleProgress) {
    const normalizedCloudBattleProgress =
      normalizeBattleSaveData(cloudBattleProgress);

    await saveLocalBattleProgress(userId, normalizedCloudBattleProgress);
    return normalizedCloudBattleProgress;
  }

  /*
    Step 3: If this account has a local battle but no cloud battle yet,
    upload the local battle once.
  */
  if (localBattleProgress) {
    await saveCloudBattleProgress(userId, localBattleProgress);
  }

  return localBattleProgress;
}

// Saves battle progress locally and to Supabase.
export async function saveBattleProgress(data: BattleSaveData): Promise<void> {
  const userId = await getCurrentUserId();
  const normalizedData = normalizeBattleSaveData(data);

  // Local save happens first so progress is protected even if internet is bad.
  await saveLocalBattleProgress(userId, normalizedData);

  // Cloud save only happens when a user is logged in.
  if (userId) {
    await saveCloudBattleProgress(userId, normalizedData);
  }
}

// Deletes saved battle data.
export async function clearBattleProgress(): Promise<void> {
  const userId = await getCurrentUserId();

  await clearLocalBattleProgress(userId);

  if (userId) {
    await deleteCloudBattleProgress(userId);
  }
}

// Creates a fresh starting battle object.
export function createInitialBattleProgress(
  bossLevel: number,
  bossMaxHP: number,
  playerHP: number,
): BattleSaveData {
  return {
    bossLevel,
    bossMaxHP,
    bossHP: bossMaxHP,
    playerHP,
    battleResult: null,
    rewardedBossLevels: [],
  };
}
