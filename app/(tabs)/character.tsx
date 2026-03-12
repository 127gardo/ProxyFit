import { StyleSheet, Text, View } from "react-native";
import { useCharacter } from "../../src/game/character";
import { getEvolution } from "../../src/game/evolution";

export default function CharacterScreen() {
  const { character, calculateDamage } = useCharacter();

  const evolution = getEvolution(character.level);

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
});
