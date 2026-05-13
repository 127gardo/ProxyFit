import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import HealthBar from "../src/components/HealthBar";
import { getXPNeededForLevel, useCharacter } from "../src/game/character";
import { STAT_KEYS, STAT_LABELS } from "../src/game/gameConfig";
import { useWorkoutHistory } from "../src/game/workoutHistory";
import {
  calculateSessionRewards,
  SessionEntry,
  useWorkoutSession,
} from "../src/game/workoutSession";

/*
  CompleteWorkoutScreen is the reward hand-in screen.

  This is intentionally separate from the log screen because it gives the user
  a satisfying “turn in workout” moment instead of silently applying rewards
  after every exercise.

  Flow:
  1. User logs exercises into the temporary workout session.
  2. This screen previews XP/stat-point rewards.
  3. User taps Complete Workout.
  4. The workout is saved to history.
  5. CharacterProvider applies XP, stat points, and the daily Spotter Point bonus.
*/

export default function CompleteWorkoutScreen() {
  const { character, awardWorkoutRewards } = useCharacter();
  const { sessionEntries, clearSession } = useWorkoutSession();
  const { addWorkoutEntries } = useWorkoutHistory();

  const [displayLevel, setDisplayLevel] = useState(character.level);
  const [displayXp, setDisplayXp] = useState(character.xp);
  const [animationDone, setAnimationDone] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [earnedSpotterPoints, setEarnedSpotterPoints] = useState(0);
  const [levelsGained, setLevelsGained] = useState(0);

  /*
    This prevents double rewards if the user taps fast.
  */
  const hasCompletedRef = useRef(false);

  const rewardSummary = useMemo(
    () => calculateSessionRewards(sessionEntries),
    [sessionEntries],
  );

  const totalXpGained = rewardSummary.totalXp;

  function formatSessionEntry(entry: SessionEntry) {
    if (entry.type === "strength") {
      if (entry.weightUnit === "bodyweight") {
        return `Bodyweight x ${entry.reps ?? 0} reps x ${
          entry.sets ?? 0
        } sets — ${entry.exerciseName}`;
      }

      return `${entry.weight ?? 0} ${entry.weightUnit ?? "lbs"} x ${
        entry.reps ?? 0
      } reps x ${entry.sets ?? 0} sets — ${entry.exerciseName}`;
    }

    return `${entry.exerciseName} — ${entry.time ?? 0} min, ${
      entry.distance ?? 0
    } distance`;
  }

  function commitWorkout() {
    if (hasCompletedRef.current) {
      return {
        totalXpGained: 0,
        levelsGained: 0,
        spotterPointsGained: 0,
      };
    }

    hasCompletedRef.current = true;

    /*
      Save the workout as history first.
      History is your real-world log. The reward system can change later
      without needing to rewrite old workout history.
    */
    addWorkoutEntries(
      sessionEntries.map((entry: SessionEntry) => ({
        exerciseId: entry.exerciseId,
        exerciseName: entry.exerciseName,
        type: entry.type,
        weight: entry.weight,
        weightUnit: entry.weightUnit,
        reps: entry.reps,
        sets: entry.sets,
        time: entry.time,
        distance: entry.distance,
      })),
    );

    /*
      CharacterProvider owns all character/economy changes:
      - XP
      - level ups
      - stat points
      - first-workout-of-the-day Spotter Points
    */
    const result = awardWorkoutRewards(rewardSummary.rewards);

    clearSession();

    return result;
  }

  function animateWorkoutCompletion() {
    if (sessionEntries.length === 0 || isAnimating || animationDone) {
      return;
    }

    setIsAnimating(true);

    let workingLevel = character.level;
    let workingXp = character.xp;
    let remainingXp = totalXpGained;

    const timer = setInterval(() => {
      if (remainingXp <= 0) {
        clearInterval(timer);

        const result = commitWorkout();

        setEarnedSpotterPoints(result.spotterPointsGained);
        setLevelsGained(result.levelsGained);
        setAnimationDone(true);
        setIsAnimating(false);

        /*
          Final cleanup value after the animation.
        */
        setDisplayLevel(workingLevel);
        setDisplayXp(workingXp);

        return;
      }

      const step = Math.min(remainingXp, 6);

      remainingXp -= step;
      workingXp += step;

      while (workingXp >= getXPNeededForLevel(workingLevel)) {
        workingXp -= getXPNeededForLevel(workingLevel);
        workingLevel += 1;
      }

      setDisplayLevel(workingLevel);
      setDisplayXp(workingXp);
    }, 40);
  }

  if (sessionEntries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Workout To Complete</Text>
        <Text style={styles.subtitle}>
          Add exercises to your workout before turning it in.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Turn In Workout</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pending Exercises</Text>

        {sessionEntries.map((entry: SessionEntry) => (
          <Text key={entry.id} style={styles.entryText}>
            {formatSessionEntry(entry)}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rewards</Text>

        {STAT_KEYS.map((stat) => (
          <Text key={stat} style={styles.rewardText}>
            {STAT_LABELS[stat]} Points: +{rewardSummary.rewards[stat]}
          </Text>
        ))}

        <Text style={styles.rewardText}>Total XP: +{totalXpGained}</Text>

        {animationDone && earnedSpotterPoints > 0 && (
          <Text style={styles.spotterRewardText}>
            Daily Bonus: +{earnedSpotterPoints} Spotter Points
          </Text>
        )}

        {animationDone && earnedSpotterPoints === 0 && (
          <Text style={styles.rewardText}>
            Daily Spotter Point bonus already claimed today.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Level Progress</Text>

        <Text style={styles.levelText}>Level {displayLevel}</Text>

        <HealthBar
          current={displayXp}
          max={getXPNeededForLevel(displayLevel)}
        />

        <Text style={styles.rewardText}>
          {displayXp} / {getXPNeededForLevel(displayLevel)} XP
        </Text>

        {animationDone && levelsGained > 0 && (
          <Text style={styles.levelUpText}>
            Level Up! +{levelsGained} level{levelsGained > 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {!animationDone ? (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={animateWorkoutCompletion}
        >
          <Text style={styles.buttonText}>
            {isAnimating ? "Applying Rewards..." : "Complete Workout"}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.replace("/workout")}
        >
          <Text style={styles.buttonText}>Back To Workout</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },

  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },

  cardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  entryText: {
    color: "#ddd",
    fontSize: 15,
    marginBottom: 6,
  },

  rewardText: {
    color: "#ddd",
    fontSize: 16,
    marginBottom: 6,
  },

  spotterRewardText: {
    color: "#f2c94c",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },

  levelText: {
    color: "#1e90ff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  levelUpText: {
    color: "#4caf50",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },

  button: {
    backgroundColor: "#1e90ff",
    padding: 15,
    borderRadius: 12,
    marginTop: 8,
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
});
