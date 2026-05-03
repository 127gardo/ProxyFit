import { StyleSheet, Text, View } from "react-native";
import { useCharacter } from "../../src/game/character";
import { getCharacterClass } from "../../src/game/classes";
import { getEvolution } from "../../src/game/evolution";
import { useWorkoutHistory } from "../../src/game/workoutHistory";

export default function HomeScreen() {
  const { character, calculateDamage, getEquippedSkill } = useCharacter();
  const { getTodayWorkout } = useWorkoutHistory();

  const evolution = getEvolution(character.level);
  const todayWorkout = getTodayWorkout();
  const todayCount = todayWorkout ? todayWorkout.entries.length : 0;
  const activeClass = getCharacterClass(character.classId);
  const basicSkill = getEquippedSkill("basic");
  const chargedSkill = getEquippedSkill("charged");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ProxyFit</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroIcon}>{evolution.icon}</Text>
        {/* <Text style={styles.heroRank}>{evolution.name}</Text> */}
        <Text style={styles.heroLevel}>Level {character.level}</Text>
        {/* <Text style={styles.heroClass}>
          {activeClass.icon} {activeClass.name}
        </Text> */}
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Strength</Text>
          <Text style={styles.statValue}>{character.strength}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Endurance</Text>
          <Text style={styles.statValue}>{character.endurance}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Speed</Text>
          <Text style={styles.statValue}>{character.speed}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Damage</Text>
          <Text style={styles.statValue}>{calculateDamage()}</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today</Text>
        <Text style={styles.summaryText}>Workouts logged: {todayCount}</Text>
        {/* <Text style={styles.summaryText}>Current form: {evolution.name}</Text> */}
        {/* <Text style={styles.summaryText}>Class: {activeClass.name}</Text> */}
        {/* <Text style={styles.summaryText}>
          Basic Skill: {basicSkill?.name ?? "None"}
        </Text> */}
        {/* <Text style={styles.summaryText}>
          Charged Skill: {chargedSkill?.name ?? "None"}
        </Text> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 30,
  },
  heroCard: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  heroIcon: {
    fontSize: 72,
    marginBottom: 8,
  },
  heroRank: {
    color: "#1e90ff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
  },
  heroLevel: {
    color: "white",
    fontSize: 18,
    marginBottom: 4,
  },
  heroClass: {
    color: "#f2c94c",
    fontSize: 17,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  statLabel: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 6,
  },
  statValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  summaryCard: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 20,
  },
  summaryTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  summaryText: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 6,
  },
});
