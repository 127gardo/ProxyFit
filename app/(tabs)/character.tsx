import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { clearBattleProgress } from "../../src/game/battleProgress";
import { useCharacter } from "../../src/game/character";
import { getEvolution } from "../../src/game/evolution";
import { useWorkoutHistory } from "../../src/game/workoutHistory";
import { useWorkoutSession } from "../../src/game/workoutSession";

export default function CharacterScreen() {
  const { character, calculateDamage, resetCharacter } = useCharacter();
  const { clearWorkoutHistory } = useWorkoutHistory();
  const { clearSession } = useWorkoutSession();

  const evolution = getEvolution(character.level);

  function confirmReset() {
    Alert.alert(
      "Reset Progress",
      "This will erase your character progress, workout history, current workout session, and saved boss battle progress. This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            resetCharacter();
            clearWorkoutHistory();
            clearSession();
            await clearBattleProgress();
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Proxy</Text>

      <Text style={styles.icon}>{evolution.icon}</Text>
      <Text style={styles.rank}>{evolution.name}</Text>

      <View style={styles.statsBox}>
        <Text style={styles.stat}>Level: {character.level}</Text>
        <Text style={styles.stat}>Strength: {character.strength}</Text>
        <Text style={styles.stat}>Endurance: {character.endurance}</Text>
        <Text style={styles.stat}>Speed: {character.speed}</Text>
        <Text style={styles.stat}>Damage: {calculateDamage()}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.resetButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={confirmReset}
      >
        <Text style={styles.resetButtonText}>Reset Progress</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    color: "white",
    marginBottom: 30,
  },
  icon: {
    fontSize: 80,
    marginBottom: 10,
  },
  rank: {
    color: "#1e90ff",
    fontSize: 22,
    marginBottom: 30,
  },
  statsBox: {
    backgroundColor: "#111",
    padding: 30,
    borderRadius: 10,
    width: 250,
  },
  stat: {
    color: "white",
    fontSize: 18,
    marginBottom: 10,
  },
  resetButton: {
    marginTop: 24,
    backgroundColor: "#8b0000",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: 250,
  },
  resetButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
