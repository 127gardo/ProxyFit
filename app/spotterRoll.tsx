import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RollResult, useCharacter } from "../src/game/character";
import { ECONOMY } from "../src/game/gameConfig";
import { SPOTTERS, SpotterId, getSpotterById } from "../src/game/spotters";

/*
  SpotterRollScreen has two separate visual moments:

  1. The pull animation area on the main screen.
     - This is where your future gacha animation plugs in.
     - Search for "GACHA ANIMATION SLOT" below.

  2. The roll result popup.
     - Each pull result appears as a compact icon tile.
     - New Spotters use a blue background.
     - Duplicates use a grey background.
     - The bottom message summarizes duplicate conversion into Spotter Points.
*/

type PendingRollType = "single" | "ten" | "buy";

export default function SpotterRollScreen() {
  const { character, rollSpotter, rollTenSpotters, buySpotter } =
    useCharacter();

  const [lastRollResults, setLastRollResults] = useState<RollResult[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [pendingRollLabel, setPendingRollLabel] = useState("");

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.35)).current;

  function playRollAnimation(results: RollResult[], label: string) {
    setLastRollResults(results);
    setPendingRollLabel(label);
    setResultModalVisible(false);
    setIsAnimating(true);

    pulseScale.setValue(1);
    pulseOpacity.setValue(0.35);

    /*
      Temporary animation:
      - pulse a glowing orb three times
      - then show the result modal

      Later, replace this Animated.sequence with your own SpriteAnimator timing.
    */
    Animated.sequence([
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 1.25,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 0.9,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0.45,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 1.45,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setIsAnimating(false);
      setResultModalVisible(true);
    });
  }

  function handleRoll(type: PendingRollType, spotterId?: SpotterId) {
    if (isAnimating) {
      return;
    }

    if (type === "single") {
      const result = rollSpotter();

      if (!result) {
        Alert.alert("Not enough Spotter Points");
        return;
      }

      playRollAnimation([result], "Roll Result");
      return;
    }

    if (type === "ten") {
      const results = rollTenSpotters();

      if (results.length === 0) {
        Alert.alert("Not enough Spotter Points");
        return;
      }

      playRollAnimation(results, "10 Pull Results");
      return;
    }

    if (!spotterId) {
      return;
    }

    const result = buySpotter(spotterId);

    if (!result) {
      Alert.alert("Could not buy", "You may not have enough Spotter Points.");
      return;
    }

    playRollAnimation([result], "Purchase Result");
  }

  function renderSpotterResultIcon(result: RollResult, index: number) {
    const definition = getSpotterById(result.spotterId);

    if (!definition) {
      return null;
    }

    return (
      <View
        key={`${result.spotterId}-${result.isDuplicate ? "duplicate" : "new"}-${index}`}
        style={[
          styles.resultIconTile,
          result.isDuplicate
            ? styles.duplicateResultTile
            : styles.newResultTile,
        ]}
      >
        {definition.iconImage ? (
          <Image source={definition.iconImage} style={styles.resultIconImage} />
        ) : (
          <Text style={styles.resultEmoji}>{definition.icon}</Text>
        )}

        {/*
          This small label is intentionally short. It helps the user know what
          they pulled without turning the popup into a long text list.
        */}
        <Text style={styles.resultIconName} numberOfLines={1}>
          {definition.name}
        </Text>
      </View>
    );
  }

  function renderResultSummary() {
    if (lastRollResults.length === 0) {
      return null;
    }

    const duplicates = lastRollResults.filter((result) => result.isDuplicate);
    const duplicateRefund = duplicates.reduce(
      (sum, result) => sum + result.refundAmount,
      0,
    );

    return (
      <View>
        <Text style={styles.modalTitle}>{pendingRollLabel}</Text>

        <View style={styles.resultLegendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.newLegendDot]} />
            <Text style={styles.legendText}>New</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.duplicateLegendDot]} />
            <Text style={styles.legendText}>Duplicate</Text>
          </View>
        </View>

        {/*
          The grid naturally creates two rows of five on a 10-pull because each
          tile is 20% wide. If the screen is narrow, flexWrap still keeps it
          readable instead of forcing tiny icons.
        */}
        <View style={styles.resultGrid}>
          {lastRollResults.map(renderSpotterResultIcon)}
        </View>

        <Text style={styles.duplicateSummaryText}>
          {duplicates.length} duplicate{duplicates.length === 1 ? "" : "s"}{" "}
          converted into {duplicateRefund} SP
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => setResultModalVisible(false)}
        >
          <Text style={styles.primaryButtonText}>OK</Text>
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
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Spotter Roll</Text>
        <Text style={styles.mutedText}>
          Spotter Points: {character.spotterPoints}
        </Text>

        <View style={styles.animationPanel}>
          {/* GACHA ANIMATION SLOT

              Replace this temporary orb with your own pull animation later.
              Example idea:

              <SpriteAnimator
                frames={gachaRollFrames}
                frameDurationMs={80}
                loop={false}
                onComplete={() => {
                  setIsAnimating(false);
                  setResultModalVisible(true);
                }}
                style={styles.gachaSprite}
              />

              Important: whatever animation component you use, the result popup
              should open only after the animation finishes.
          */}
          <Animated.View
            style={[
              styles.gachaOrb,
              {
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          >
            <Text style={styles.gachaOrbText}>{isAnimating ? "★" : "?"}</Text>
          </Animated.View>

          <Text style={styles.animationText}>
            {isAnimating ? "Rolling..." : "Press roll to summon a Spotter."}
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Roll</Text>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleRoll("single")}
          >
            <Text style={styles.primaryButtonText}>
              Roll 1 ({ECONOMY.singleSpotterRollCost} SP)
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleRoll("ten")}
          >
            <Text style={styles.primaryButtonText}>
              Roll 10 ({ECONOMY.tenSpotterRollCost} SP)
            </Text>
          </Pressable>

          <Text style={styles.mutedText}>
            Duplicates convert into {ECONOMY.duplicateSpotterPointRefund} SP.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Direct Buy</Text>
          {SPOTTERS.map((spotter) => {
            const isOwned = character.ownedSpotters.some(
              (ownedSpotter) => ownedSpotter.id === spotter.id,
            );

            return (
              <Pressable
                key={spotter.id}
                style={({ pressed }) => [
                  styles.shopRow,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => handleRoll("buy", spotter.id)}
              >
                <View style={styles.shopIconBox}>
                  {spotter.iconImage ? (
                    <Image
                      source={spotter.iconImage}
                      style={styles.shopIconImage}
                    />
                  ) : (
                    <Text style={styles.shopEmoji}>{spotter.icon}</Text>
                  )}
                </View>

                <View style={styles.shopTextBox}>
                  <Text style={styles.shopName}>
                    {spotter.name} {isOwned ? "(Owned)" : ""}
                  </Text>
                  <Text style={styles.mutedText}>
                    {spotter.rarity.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.priceText}>
                  {ECONOMY.directSpotterBuyCost} SP
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={resultModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>{renderResultSummary()}</View>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginBottom: 8,
  },
  backButtonText: {
    color: "#1e90ff",
    fontSize: 17,
    fontWeight: "bold",
  },
  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 6,
  },
  mutedText: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  animationPanel: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 20,
    minHeight: 210,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 16,
  },
  gachaOrb: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#1e90ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1e90ff",
    shadowOpacity: 0.8,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  gachaOrbText: {
    color: "white",
    fontSize: 46,
    fontWeight: "bold",
  },
  animationText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 24,
    textAlign: "center",
  },
  panel: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  panelTitle: {
    color: "white",
    fontSize: 21,
    fontWeight: "bold",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#1e90ff",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  primaryButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  shopRow: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shopIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#252525",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  shopIconImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  shopEmoji: {
    fontSize: 24,
  },
  shopTextBox: {
    flex: 1,
  },
  shopName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  priceText: {
    color: "#f2c94c",
    fontSize: 15,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#333",
  },
  modalTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  resultLegendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  newLegendDot: {
    backgroundColor: "#1e90ff",
  },
  duplicateLegendDot: {
    backgroundColor: "#555",
  },
  legendText: {
    color: "#ccc",
    fontSize: 13,
    fontWeight: "bold",
  },
  resultGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 12,
  },
  resultIconTile: {
    width: "20%",
    minWidth: 54,
    maxWidth: 70,
    aspectRatio: 0.82,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
    margin: 4,
  },
  newResultTile: {
    backgroundColor: "#1e90ff",
  },
  duplicateResultTile: {
    backgroundColor: "#555",
  },
  resultIconImage: {
    width: 38,
    height: 38,
    resizeMode: "contain",
    marginBottom: 4,
  },
  resultEmoji: {
    fontSize: 30,
    marginBottom: 4,
  },
  resultIconName: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
  },
  duplicateSummaryText: {
    color: "#f2c94c",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
