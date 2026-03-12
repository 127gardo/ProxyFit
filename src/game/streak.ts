import AsyncStorage from "@react-native-async-storage/async-storage";

const STREAK_KEY = "proxyfit_streak";
const LAST_WORKOUT_KEY = "proxyfit_last_workout";

export type StreakData = {
  streak: number;
  lastWorkoutDate: string | null;
};

export async function getStreak(): Promise<StreakData> {
  const streakString = await AsyncStorage.getItem(STREAK_KEY);
  const lastWorkoutDate = await AsyncStorage.getItem(LAST_WORKOUT_KEY);

  return {
    streak: streakString ? parseInt(streakString) : 0,
    lastWorkoutDate: lastWorkoutDate,
  };
}

export async function recordWorkout(): Promise<number> {
  const today = new Date().toDateString();

  const streakData = await getStreak();

  if (streakData.lastWorkoutDate === today) {
    return streakData.streak;
  }

  let newStreak = 1;

  if (streakData.lastWorkoutDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (streakData.lastWorkoutDate === yesterday.toDateString()) {
      newStreak = streakData.streak + 1;
    }
  }

  await AsyncStorage.setItem(STREAK_KEY, newStreak.toString());
  await AsyncStorage.setItem(LAST_WORKOUT_KEY, today);

  return newStreak;
}
