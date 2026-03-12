import AsyncStorage from "@react-native-async-storage/async-storage";

export type BattleResult = "win" | "lose" | null;

export type BattleSaveData = {
  bossLevel: number;
  bossMaxHP: number;
  bossHP: number;
  playerHP: number;
  battleResult: BattleResult;
};

const BATTLE_PROGRESS_KEY = "PROXYFIT_BATTLE_PROGRESS";

export async function loadBattleProgress(): Promise<BattleSaveData | null> {
  try {
    const saved = await AsyncStorage.getItem(BATTLE_PROGRESS_KEY);

    if (!saved) {
      return null;
    }

    return JSON.parse(saved) as BattleSaveData;
  } catch (error) {
    console.log("Error loading battle progress:", error);
    return null;
  }
}

export async function saveBattleProgress(data: BattleSaveData): Promise<void> {
  try {
    await AsyncStorage.setItem(BATTLE_PROGRESS_KEY, JSON.stringify(data));
  } catch (error) {
    console.log("Error saving battle progress:", error);
  }
}

export async function clearBattleProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BATTLE_PROGRESS_KEY);
  } catch (error) {
    console.log("Error clearing battle progress:", error);
  }
}

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
  };
}
