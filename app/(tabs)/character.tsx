import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../src/auth/AuthProvider";
import { clearBattleProgress } from "../../src/game/battleProgress";
import {
  CharacterStat,
  OwnedSpotter,
  useCharacter,
} from "../../src/game/character";
import { getEvolution } from "../../src/game/evolution";
import {
  ECONOMY,
  STAT_KEYS,
  STAT_LABELS,
  getNextStatUpgradeCost,
} from "../../src/game/gameConfig";
import {
  getSkillById,
  getUnlockedSkillsByActivation,
} from "../../src/game/skills";
import { getSpotterById } from "../../src/game/spotters";
import { useWorkoutHistory } from "../../src/game/workoutHistory";
import { useWorkoutSession } from "../../src/game/workoutSession";

/*
  This screen uses the same idea as the workout-category buttons:
  - Main Character
  - Spotters
  - Options

  Multiple sections can be selected at once. If nothing is selected, Main
  Character is shown by default so the page never looks empty.
*/

type CharacterSection = "main" | "spotters" | "options";

const SECTION_LABELS: Record<CharacterSection, string> = {
  main: "Main Character",
  spotters: "Spotters",
  options: "Options",
};

export default function CharacterScreen() {
  const [selectedSections, setSelectedSections] = useState<CharacterSection[]>([
    "main",
  ]);

  /*
    The owned Spotter list can get long once you add more characters.
    Defaulting it to closed keeps the Spotter page focused on the active
    Spotter first, then lets the user expand the collection only when needed.
  */
  const [ownedSpottersExpanded, setOwnedSpottersExpanded] = useState(false);

  const {
    character,
    calculateDamage,
    resetCharacter,
    equipSkill,
    upgradeStat,
    resetAllocatedStats,
    setActiveSpotter,
    getTotalStatsForSpotter,
  } = useCharacter();

  const { signOut } = useAuth();
  const { clearWorkoutHistory } = useWorkoutHistory();
  const { clearSession } = useWorkoutSession();

  const evolution = getEvolution(character.level);
  const equippedBasicSkill = character.equippedBasicSkillId
    ? getSkillById(character.equippedBasicSkillId)
    : null;
  const equippedChargedSkill = character.equippedChargedSkillId
    ? getSkillById(character.equippedChargedSkillId)
    : null;
  const unlockedBasicSkills = getUnlockedSkillsByActivation(
    character.level,
    "basic",
  );
  const unlockedChargedSkills = getUnlockedSkillsByActivation(
    character.level,
    "charged",
  );

  const activeSpotter = character.activeSpotterId
    ? character.ownedSpotters.find(
        (spotter) => spotter.id === character.activeSpotterId,
      )
    : null;

  const visibleSections =
    selectedSections.length > 0 ? selectedSections : ["main"];

  function toggleSection(section: CharacterSection) {
    if (selectedSections.includes(section)) {
      setSelectedSections(selectedSections.filter((item) => item !== section));
    } else {
      setSelectedSections([...selectedSections, section]);
    }
  }

  function confirmResetProgress() {
    Alert.alert(
      "Reset Progress",
      "This erases character progress, workout history, current workout session, and battle progress.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetCharacter();
            clearWorkoutHistory();
            clearSession();
            clearBattleProgress();
          },
        },
      ],
    );
  }

  function confirmLogout() {
    Alert.alert("Log Out", "Do you want to log out of ProxyFit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  }

  function contactUs() {
    /*
      Replace this email later with your real support email/domain.
      mailto works in Expo Go and in a real app as long as the device has a
      mail app configured.
    */
    Linking.openURL(
      "mailto:support@proxyfit.app?subject=ProxyFit%20Support%20Request",
    );
  }

  function handleUpgradeMainStat(stat: CharacterStat) {
    const didUpgrade = upgradeStat({ type: "main" }, stat);

    if (!didUpgrade) {
      Alert.alert(
        "Not enough points",
        `You need more ${STAT_LABELS[stat]} points.`,
      );
    }
  }

  function confirmResetMainStats() {
    const cost = character.mainHasUsedFreeReset ? ECONOMY.paidStatResetCost : 0;

    Alert.alert(
      "Reset Main Stats",
      cost === 0
        ? "The first reset is free. Used stat points are not returned."
        : `This reset costs ${cost} Spotter Points. Used stat points are not returned.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            const didReset = resetAllocatedStats({ type: "main" });

            if (!didReset) {
              Alert.alert("Not enough Spotter Points");
            }
          },
        },
      ],
    );
  }

  function confirmResetSpotterStats(spotter: OwnedSpotter) {
    const definition = getSpotterById(spotter.id);
    const cost = spotter.hasUsedFreeReset ? ECONOMY.paidStatResetCost : 0;

    Alert.alert(
      `Reset ${definition?.name ?? "Spotter"} Stats`,
      cost === 0
        ? "The first reset for this Spotter is free. Used stat points are not returned."
        : `This reset costs ${cost} Spotter Points. Used stat points are not returned.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            const didReset = resetAllocatedStats({
              type: "spotter",
              spotterId: spotter.id,
            });

            if (!didReset) {
              Alert.alert("Not enough Spotter Points");
            }
          },
        },
      ],
    );
  }

  function renderStatUpgradeRow(stat: CharacterStat) {
    const allocated = character.mainAllocatedStats[stat];
    const availablePoints = character.statPoints[stat];
    const nextCost = getNextStatUpgradeCost(allocated);

    return (
      <View key={stat} style={styles.statRow}>
        <View style={styles.statTextBox}>
          <Text style={styles.statLabel}>{STAT_LABELS[stat]}</Text>
          <Text style={styles.mutedText}>
            +{allocated} added | Cost {nextCost} | You have {availablePoints}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.smallButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => handleUpgradeMainStat(stat)}
        >
          <Text style={styles.smallButtonText}>Upgrade</Text>
        </Pressable>
      </View>
    );
  }

  function renderSkillPicker(
    title: string,
    skills: typeof unlockedBasicSkills,
  ) {
    return (
      <View style={styles.subPanel}>
        <Text style={styles.subPanelTitle}>{title}</Text>
        <View style={styles.skillGrid}>
          {skills.map((skill) => {
            const selected =
              skill.id === character.equippedBasicSkillId ||
              skill.id === character.equippedChargedSkillId;

            return (
              <Pressable
                key={skill.id}
                style={({ pressed }) => [
                  styles.skillButton,
                  selected && styles.skillButtonSelected,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => equipSkill(skill.id)}
              >
                <Text style={styles.skillButtonText}>{skill.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderMainCharacter() {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Main Character</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.bigNumber}>Lv. {character.level}</Text>
          <Text style={styles.summaryText}>
            {evolution.icon} {evolution.name}
          </Text>
        </View>

        <View style={styles.statGrid}>
          <Text style={styles.statPill}>STR {character.strength}</Text>
          <Text style={styles.statPill}>END {character.endurance}</Text>
          <Text style={styles.statPill}>SPD {character.speed}</Text>
          <Text style={styles.statPill}>
            DMG {calculateDamage(equippedBasicSkill)}
          </Text>
        </View>

        <Text style={styles.detailText}>
          Basic: {equippedBasicSkill?.name ?? "None"}
        </Text>
        <Text style={styles.detailText}>
          Charged: {equippedChargedSkill?.name ?? "None"}
        </Text>

        {renderSkillPicker("Basic Moves", unlockedBasicSkills)}
        {renderSkillPicker("Charged Moves", unlockedChargedSkills)}

        <View style={styles.subPanel}>
          <Text style={styles.subPanelTitle}>Stat Points</Text>
          {STAT_KEYS.map(renderStatUpgradeRow)}

          <Pressable
            style={({ pressed }) => [
              styles.warningButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={confirmResetMainStats}
          >
            <Text style={styles.warningButtonText}>
              Reset Main Stats{" "}
              {character.mainHasUsedFreeReset
                ? `(${ECONOMY.paidStatResetCost} SP)`
                : "(Free)"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderSpotterIcon(
    definition: NonNullable<ReturnType<typeof getSpotterById>>,
  ) {
    if (definition.iconImage) {
      return (
        <Image source={definition.iconImage} style={styles.spotterIconImage} />
      );
    }

    return <Text style={styles.spotterIconEmoji}>{definition.icon}</Text>;
  }

  function renderMoveName(skillId: string) {
    return getSkillById(skillId)?.name ?? skillId;
  }

  function renderActiveSpotterDetails() {
    if (!activeSpotter) {
      return (
        <View style={styles.activeSpotterBox}>
          <Text style={styles.subPanelTitle}>Active Spotter</Text>
          <Text style={styles.mutedText}>No Spotter selected yet.</Text>
          <Text style={styles.mutedText}>
            Roll or buy a Spotter, then choose one from your owned list.
          </Text>
        </View>
      );
    }

    const definition = getSpotterById(activeSpotter.id);
    const totalStats = getTotalStatsForSpotter(activeSpotter.id);

    if (!definition) {
      return null;
    }

    return (
      <View style={styles.activeSpotterBox}>
        <View style={styles.activeSpotterHeader}>
          <View style={styles.spotterIconLarge}>
            {renderSpotterIcon(definition)}
          </View>
          <View style={styles.activeSpotterTextBox}>
            <Text style={styles.activeSpotterName}>{definition.name}</Text>
            <Text style={styles.mutedText}>
              {definition.rarity.toUpperCase()} SUPPORT
            </Text>
          </View>
        </View>

        <Text style={styles.detailText}>{definition.description}</Text>

        <View style={styles.statGrid}>
          <Text style={styles.statPill}>STR {totalStats?.strength ?? 0}</Text>
          <Text style={styles.statPill}>END {totalStats?.endurance ?? 0}</Text>
          <Text style={styles.statPill}>SPD {totalStats?.speed ?? 0}</Text>
        </View>

        <View style={styles.movesetBox}>
          <Text style={styles.movesetTitle}>Moveset</Text>
          <Text style={styles.detailText}>
            Basic: {renderMoveName(definition.fixedBasicSkillId)}
          </Text>
          <Text style={styles.detailText}>
            Special: {renderMoveName(definition.fixedSpecialSkillId)}
          </Text>
        </View>
      </View>
    );
  }

  function renderSpotterSummary(spotter: OwnedSpotter) {
    const definition = getSpotterById(spotter.id);

    if (!definition) {
      return null;
    }

    const totalStats = getTotalStatsForSpotter(spotter.id);
    const isActive = character.activeSpotterId === spotter.id;

    return (
      <View key={spotter.id} style={styles.spotterRow}>
        <View style={styles.spotterIconSmall}>
          {renderSpotterIcon(definition)}
        </View>

        <View style={styles.spotterTextBox}>
          <Text style={styles.spotterName}>{definition.name}</Text>
          <Text style={styles.mutedText}>
            {isActive ? "Active" : definition.rarity.toUpperCase()}
          </Text>
          <Text style={styles.mutedText}>
            STR {totalStats?.strength ?? 0} | END {totalStats?.endurance ?? 0} |
            SPD {totalStats?.speed ?? 0}
          </Text>
        </View>

        <View style={styles.spotterButtonColumn}>
          <Pressable
            style={({ pressed }) => [
              styles.smallButton,
              isActive && styles.activeButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setActiveSpotter(spotter.id)}
          >
            <Text style={styles.smallButtonText}>
              {isActive ? "Active" : "Set"}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.miniWarningButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => confirmResetSpotterStats(spotter)}
          >
            <Text style={styles.smallButtonText}>Reset</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderSpotters() {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Spotters</Text>
        <Text style={styles.detailText}>
          Spotter Points: {character.spotterPoints}
        </Text>

        {renderActiveSpotterDetails()}

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/spotterRoll")}
        >
          <Text style={styles.primaryButtonText}>Roll / Manage Spotters</Text>
        </Pressable>

        <View style={styles.subPanel}>
          <Pressable
            style={({ pressed }) => [
              styles.collapseHeader,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setOwnedSpottersExpanded((current) => !current)}
          >
            <View>
              <Text style={styles.subPanelTitle}>Owned Spotters</Text>
              <Text style={styles.mutedText}>
                {character.ownedSpotters.length} owned
              </Text>
            </View>
            <Text style={styles.collapseText}>
              {ownedSpottersExpanded ? "Hide" : "Show"}
            </Text>
          </Pressable>

          {ownedSpottersExpanded && (
            <View style={styles.collapsibleContent}>
              {character.ownedSpotters.length === 0 ? (
                <Text style={styles.mutedText}>No Spotters owned yet.</Text>
              ) : (
                character.ownedSpotters.map(renderSpotterSummary)
              )}
            </View>
          )}
        </View>
      </View>
    );
  }

  function renderOptions() {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Options</Text>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={contactUs}
        >
          <Text style={styles.secondaryButtonText}>Contact Us</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={confirmLogout}
        >
          <Text style={styles.secondaryButtonText}>Log Out</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.dangerButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={confirmResetProgress}
        >
          <Text style={styles.dangerButtonText}>Reset Progress</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Character</Text>

        <View style={styles.sectionContainer}>
          {(Object.keys(SECTION_LABELS) as CharacterSection[]).map(
            (section) => {
              const selected = visibleSections.includes(section);

              return (
                <Pressable
                  key={section}
                  style={({ pressed }) => [
                    styles.sectionButton,
                    selected && styles.sectionButtonSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => toggleSection(section)}
                >
                  <Text style={styles.sectionButtonText}>
                    {SECTION_LABELS[section]}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>

        {visibleSections.includes("main") && renderMainCharacter()}
        {visibleSections.includes("spotters") && renderSpotters()}
        {visibleSections.includes("options") && renderOptions()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
  },
  title: {
    fontSize: 30,
    color: "white",
    fontWeight: "bold",
    marginBottom: 16,
  },
  sectionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  sectionButton: {
    backgroundColor: "#222",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  sectionButtonSelected: {
    backgroundColor: "#1e90ff",
  },
  sectionButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  panel: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  panelTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subPanel: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  subPanelTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  bigNumber: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
  },
  summaryText: {
    color: "#cfe7ff",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  statPill: {
    color: "white",
    backgroundColor: "#222",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "bold",
  },
  detailText: {
    color: "white",
    fontSize: 16,
    marginBottom: 8,
  },
  mutedText: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 20,
  },
  skillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillButton: {
    backgroundColor: "#222",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  skillButtonSelected: {
    backgroundColor: "#1e90ff",
  },
  skillButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  statRow: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statTextBox: {
    flex: 1,
  },
  statLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  smallButton: {
    backgroundColor: "#1e90ff",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  smallButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  activeButton: {
    backgroundColor: "#4caf50",
  },
  warningButton: {
    backgroundColor: "#5a1f1f",
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  warningButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  activeSpotterBox: {
    backgroundColor: "#0f1720",
    borderWidth: 1,
    borderColor: "#1e90ff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  activeSpotterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  activeSpotterTextBox: {
    flex: 1,
  },
  activeSpotterName: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  spotterIconLarge: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#162234",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  spotterIconSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  spotterIconImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  spotterIconEmoji: {
    fontSize: 28,
  },
  movesetBox: {
    backgroundColor: "#162234",
    borderRadius: 12,
    padding: 12,
    marginTop: 2,
  },
  movesetTitle: {
    color: "#cfe7ff",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 8,
  },
  collapseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  collapseText: {
    color: "#1e90ff",
    fontSize: 15,
    fontWeight: "bold",
  },
  collapsibleContent: {
    marginTop: 12,
  },
  spotterRow: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    gap: 10,
  },
  spotterTextBox: {
    flex: 1,
  },
  spotterName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  spotterButtonColumn: {
    justifyContent: "center",
    gap: 8,
  },
  miniWarningButton: {
    backgroundColor: "#5a1f1f",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  primaryButton: {
    backgroundColor: "#1e90ff",
    padding: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#333",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  dangerButton: {
    backgroundColor: "#5a1f1f",
    padding: 14,
    borderRadius: 12,
  },
  dangerButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
