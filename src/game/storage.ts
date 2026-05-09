import AsyncStorage from "@react-native-async-storage/async-storage";

/*
  This file handles local saves on the phone.

  Important idea:

  Before login, the app used one shared save key like this:

    PROXYFIT_CHARACTER

  That means every account on the same phone saw the same character.

  Now we attach the Supabase user ID to the key:

    PROXYFIT_CHARACTER:abc-user-id

  So each logged-in account gets its own local save on the same device.
*/

const CHARACTER_KEY = "PROXYFIT_CHARACTER";
const WORKOUT_HISTORY_KEY = "PROXYFIT_WORKOUT_HISTORY";

function getUserKey(baseKey: string, userId: string) {
  return `${baseKey}:${userId}`;
}

export async function saveCharacter(character: any, userId: string) {
  try {
    const json = JSON.stringify(character);
    await AsyncStorage.setItem(getUserKey(CHARACTER_KEY, userId), json);
  } catch (error) {
    console.log("Error saving character:", error);
  }
}

export async function loadCharacter(userId: string) {
  try {
    const json = await AsyncStorage.getItem(getUserKey(CHARACTER_KEY, userId));

    if (json) {
      return JSON.parse(json);
    }

    return null;
  } catch (error) {
    console.log("Error loading character:", error);
    return null;
  }
}

export async function saveWorkoutHistory(workoutDays: any[], userId: string) {
  try {
    const json = JSON.stringify(workoutDays);
    await AsyncStorage.setItem(getUserKey(WORKOUT_HISTORY_KEY, userId), json);
  } catch (error) {
    console.log("Error saving workout history:", error);
  }
}

export async function loadWorkoutHistory(userId: string) {
  try {
    const json = await AsyncStorage.getItem(
      getUserKey(WORKOUT_HISTORY_KEY, userId),
    );

    if (json) {
      return JSON.parse(json);
    }

    return null;
  } catch (error) {
    console.log("Error loading workout history:", error);
    return null;
  }
}
