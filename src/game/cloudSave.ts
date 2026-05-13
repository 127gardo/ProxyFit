import { supabase } from "../lib/supabase";
import type { BattleSaveData } from "./battleProgress";
import type { Character } from "./character";
import type { WorkoutDay } from "./workoutHistory";

/*
  Cloud save layer for ProxyFit.

  Supabase tables store the actual game data inside a JSON/JSONB column named
  "data". That is good for this stage of the app because we can add fields like
  spotterPoints, ownedSpotters, rewardedBossLevels, etc. without changing the
  Supabase table schema every time.
*/

const CHARACTER_TABLE = "proxyfit_characters";
const WORKOUT_HISTORY_TABLE = "proxyfit_workout_history";
const BATTLE_PROGRESS_TABLE = "proxyfit_battle_progress";

export async function loadCloudCharacter(userId: string) {
  const { data, error } = await supabase
    .from(CHARACTER_TABLE)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.log("Error loading cloud character:", error.message);
    return null;
  }

  return (data?.data as Character | null) ?? null;
}

export async function saveCloudCharacter(userId: string, character: Character) {
  const { error } = await supabase.from(CHARACTER_TABLE).upsert({
    user_id: userId,
    data: character,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.log("Error saving cloud character:", error.message);
  }
}

export async function deleteCloudCharacter(userId: string) {
  const { error } = await supabase
    .from(CHARACTER_TABLE)
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.log("Error deleting cloud character:", error.message);
  }
}

export async function loadCloudWorkoutHistory(userId: string) {
  const { data, error } = await supabase
    .from(WORKOUT_HISTORY_TABLE)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.log("Error loading cloud workout history:", error.message);
    return null;
  }

  return (data?.data as WorkoutDay[] | null) ?? null;
}

export async function saveCloudWorkoutHistory(
  userId: string,
  workoutDays: WorkoutDay[],
) {
  const { error } = await supabase.from(WORKOUT_HISTORY_TABLE).upsert({
    user_id: userId,
    data: workoutDays,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.log("Error saving cloud workout history:", error.message);
  }
}

export async function deleteCloudWorkoutHistory(userId: string) {
  const { error } = await supabase
    .from(WORKOUT_HISTORY_TABLE)
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.log("Error deleting cloud workout history:", error.message);
  }
}

export async function loadCloudBattleProgress(userId: string) {
  const { data, error } = await supabase
    .from(BATTLE_PROGRESS_TABLE)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.log("Error loading cloud battle progress:", error.message);
    return null;
  }

  return (data?.data as BattleSaveData | null) ?? null;
}

export async function saveCloudBattleProgress(
  userId: string,
  battleProgress: BattleSaveData,
) {
  const { error } = await supabase.from(BATTLE_PROGRESS_TABLE).upsert({
    user_id: userId,
    data: battleProgress,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.log("Error saving cloud battle progress:", error.message);
  }
}

export async function deleteCloudBattleProgress(userId: string) {
  const { error } = await supabase
    .from(BATTLE_PROGRESS_TABLE)
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.log("Error deleting cloud battle progress:", error.message);
  }
}
