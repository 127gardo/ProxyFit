import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth/AuthProvider";
import { clearBattleProgress } from "../../src/game/battleProgress";
import { useCharacter } from "../../src/game/character";
import { characterClasses, getCharacterClass } from "../../src/game/classes";
import { getEvolution } from "../../src/game/evolution";
import { getSkillById, getUnlockedSkillsForClass } from "../../src/game/skills";
import { useWorkoutHistory } from "../../src/game/workoutHistory";
import { useWorkoutSession } from "../../src/game/workoutSession";
export default function CharacterScreen() {
  const {
    character,
    calculateDamage,
    resetCharacter,
    setCharacterClass,
    equipSkill,
  } = useCharacter();

  const { signOut } = useAuth();
  const { clearWorkoutHistory } = useWorkoutHistory();
  const { clearSession } = useWorkoutSession();

  const evolution = getEvolution(character.level);
  const activeClass = getCharacterClass(character.classId);

  const unlockedSkills = getUnlockedSkillsForClass(
    character.classId,
    character.level,
  );

  const basicSkills = unlockedSkills.filter(
    (skill) => skill.activation === "basic",
  );

  const chargedSkills = unlockedSkills.filter(
    (skill) => skill.activation === "charged",
  );

  const equippedBasicSkill = character.equippedBasicSkillId
    ? getSkillById(character.equippedBasicSkillId)
    : null;

  const equippedChargedSkill = character.equippedChargedSkillId
    ? getSkillById(character.equippedChargedSkillId)
    : null;

  function confirmReset() {
    Alert.alert(
      "Reset Progress",
      "This will erase your character progress, workout history, current workout session, and saved boss battle progress. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Your Proxy</Text>

        <View style={styles.heroCard}>
          <Text style={styles.icon}>{evolution.icon}</Text>
          <Text style={styles.rank}>{evolution.name}</Text>
          <Text style={styles.classLine}>
            {activeClass.icon} {activeClass.name}
          </Text>
        </View>

        <View style={styles.statsBox}>
          <Text style={styles.stat}>Level: {character.level}</Text>
          <Text style={styles.stat}>Strength: {character.strength}</Text>
          <Text style={styles.stat}>Endurance: {character.endurance}</Text>
          <Text style={styles.stat}>Speed: {character.speed}</Text>
          <Text style={styles.stat}>Damage: {calculateDamage()}</Text>
          <Text style={styles.stat}>
            Basic Skill: {equippedBasicSkill?.name ?? "None"}
          </Text>
          <Text style={styles.stat}>
            Charged Skill: {equippedChargedSkill?.name ?? "None"}
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Choose Class</Text>

          {characterClasses.map((characterClass) => {
            const isSelected = character.classId === characterClass.id;

            return (
              <Pressable
                key={characterClass.id}
                style={({ pressed }) => [
                  styles.classCard,
                  isSelected && styles.classCardSelected,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setCharacterClass(characterClass.id)}
              >
                <Text style={styles.className}>
                  {characterClass.icon} {characterClass.name}
                </Text>
                <Text style={styles.classDescription}>
                  {characterClass.description}
                </Text>
                <Text style={styles.classStatus}>
                  {isSelected ? "Currently equipped" : "Tap to switch class"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Equip Basic Skill</Text>

          {basicSkills.map((skill) => {
            const isEquipped = character.equippedBasicSkillId === skill.id;

            return (
              <Pressable
                key={skill.id}
                style={({ pressed }) => [
                  styles.skillCard,
                  isEquipped && styles.skillCardSelected,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => equipSkill(skill.id)}
              >
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.skillMeta}>
                  Unlock level: {skill.unlockLevel}
                </Text>
                <Text style={styles.skillMeta}>
                  Damage multiplier: {skill.damageMultiplier.toFixed(2)}x
                </Text>
                <Text style={styles.skillMeta}>
                  {isEquipped ? "Equipped as basic" : "Tap to equip"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Equip Charged Skill</Text>

          {chargedSkills.map((skill) => {
            const isEquipped = character.equippedChargedSkillId === skill.id;

            return (
              <Pressable
                key={skill.id}
                style={({ pressed }) => [
                  styles.skillCard,
                  isEquipped && styles.skillCardSelected,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => equipSkill(skill.id)}
              >
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.skillMeta}>
                  Unlock level: {skill.unlockLevel}
                </Text>
                <Text style={styles.skillMeta}>
                  Damage multiplier: {skill.damageMultiplier.toFixed(2)}x
                </Text>
                <Text style={styles.skillMeta}>
                  Hits needed: {skill.hitsRequired ?? 5}
                </Text>
                <Text style={styles.skillMeta}>
                  {isEquipped ? "Equipped as charged" : "Tap to equip"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={signOut}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.resetButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={confirmReset}
        >
          <Text style={styles.resetButtonText}>Reset Progress</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 18,
  },
  icon: {
    fontSize: 80,
    marginBottom: 10,
  },
  rank: {
    color: "#1e90ff",
    fontSize: 22,
    marginBottom: 8,
  },
  classLine: {
    color: "#fff",
    fontSize: 18,
  },
  statsBox: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 16,
    marginBottom: 18,
  },
  stat: {
    color: "white",
    fontSize: 18,
    marginBottom: 10,
  },
  panel: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  panelTitle: {
    color: "white",
    fontSize: 22,
    marginBottom: 14,
  },
  classCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  classCardSelected: {
    borderColor: "#1e90ff",
    backgroundColor: "#162338",
  },
  className: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  classDescription: {
    color: "#ccc",
    fontSize: 15,
    marginBottom: 8,
  },
  classStatus: {
    color: "#8ec5ff",
    fontSize: 14,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  skillCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  skillCardSelected: {
    borderColor: "#f2c94c",
    backgroundColor: "#2b2410",
  },
  skillName: {
    color: "white",
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 6,
  },
  skillMeta: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 4,
  },
  logoutButton: {
    marginTop: 6,
    backgroundColor: "#333",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 12,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },
  resetButton: {
    backgroundColor: "#8b0000",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  resetButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
