import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DamageNumber from "../../src/components/DamageNumber";
import HealthBar from "../../src/components/HealthBar";
import { sprites } from "../../src/game/assets";
import {
  BattleResult,
  createInitialBattleProgress,
  loadBattleProgress,
  saveBattleProgress,
} from "../../src/game/battleProgress";
import { calculateBossHP, getBossStage } from "../../src/game/bosses";
import { useCharacter } from "../../src/game/character";
import { getBasicSkill, getChargedSkill, Skill } from "../../src/game/skills";

type DamageInstance = {
  id: number;
  value: number;
  x: number;
  y: number;
};

type ActiveEffectKey =
  | "lightning_small"
  | "lightning_big"
  | "lightning_ultimate"
  | null;

const battleBackground = require("../../assets/backgrounds/battle_bg_test.png");

const effectFrameMap: Record<
  Exclude<ActiveEffectKey, null>,
  ImageSourcePropType[]
> = {
  lightning_small: [
    require("../../assets/effects/skills/lightnining_small_0.png"),
    require("../../assets/effects/skills/lightnining_small_1.png"),
    require("../../assets/effects/skills/lightnining_small_2.png"),
    require("../../assets/effects/skills/lightnining_small_3.png"),
  ],
  lightning_big: [
    require("../../assets/effects/skills/lightnining_big_0.png"),
    require("../../assets/effects/skills/lightnining_big_1.png"),
    require("../../assets/effects/skills/lightnining_big_2.png"),
    require("../../assets/effects/skills/lightnining_big_3.png"),
  ],
  lightning_ultimate: [
    require("../../assets/effects/skills/lightnining_big_0.png"),
    require("../../assets/effects/skills/lightnining_big_1.png"),
    require("../../assets/effects/skills/lightnining_big_2.png"),
    require("../../assets/effects/skills/lightnining_big_3.png"),
  ],
};

function getEffectKeyForSkill(skill: Skill): ActiveEffectKey {
  if (skill.element === "lightning" && skill.tier === "small") {
    return "lightning_small";
  }
  if (skill.element === "lightning" && skill.tier === "big") {
    return "lightning_big";
  }
  if (skill.element === "lightning" && skill.tier === "ultimate") {
    return "lightning_ultimate";
  }
  return null;
}

export default function BattleScreen() {
  const { character, calculateDamage, calculateMaxHP, resetVersion } =
    useCharacter();

  const [isLoaded, setIsLoaded] = useState(false);

  const initialBossHP = calculateBossHP(1);
  const initialPlayerHP = calculateMaxHP();

  const [bossLevel, setBossLevel] = useState(1);
  const [bossMaxHP, setBossMaxHP] = useState(initialBossHP);
  const [bossHP, setBossHP] = useState(initialBossHP);
  const [playerHP, setPlayerHP] = useState(initialPlayerHP);
  const [damageNumbers, setDamageNumbers] = useState<DamageInstance[]>([]);
  const [battleResult, setBattleResult] = useState<BattleResult>(null);

  const [basicHitCount, setBasicHitCount] = useState(0);
  const [chargedReady, setChargedReady] = useState(false);

  const [activeEffectKey, setActiveEffectKey] = useState<ActiveEffectKey>(null);
  const [activeEffectFrame, setActiveEffectFrame] = useState<number | null>(
    null,
  );
  const [activeEffectSize, setActiveEffectSize] = useState({
    width: 220,
    height: 220,
  });
  const [isAnimatingSkill, setIsAnimatingSkill] = useState(false);

  const bossShake = useRef(new Animated.Value(0)).current;
  const effectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const effectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHandledInitialResetVersion = useRef(false);

  const stage = getBossStage(bossLevel);
  const bossSprite = stage.sprite;

  const maxPlayerHP = calculateMaxHP();

  const basicSkill = getBasicSkill();
  const chargedSkill = getChargedSkill();

  const chargedHitsRequired = chargedSkill?.hitsRequired ?? 5;

  const bossAttackDamage = Math.max(
    5,
    Math.floor(6 + bossLevel * 1.5 * stage.hpMultiplier),
  );

  const speedStat = typeof character?.speed === "number" ? character.speed : 0;

  function clearEffectTimers() {
    if (effectIntervalRef.current) {
      clearInterval(effectIntervalRef.current);
      effectIntervalRef.current = null;
    }

    if (effectTimeoutRef.current) {
      clearTimeout(effectTimeoutRef.current);
      effectTimeoutRef.current = null;
    }
  }

  function stopEffect() {
    clearEffectTimers();
    setActiveEffectKey(null);
    setActiveEffectFrame(null);
    setIsAnimatingSkill(false);
  }

  function resetBattleState() {
    const resetBossHP = calculateBossHP(1);
    const resetPlayerHP = calculateMaxHP();

    setBossLevel(1);
    setBossMaxHP(resetBossHP);
    setBossHP(resetBossHP);
    setPlayerHP(resetPlayerHP);
    setBattleResult(null);
    setDamageNumbers([]);
    setBasicHitCount(0);
    setChargedReady(false);
    bossShake.setValue(0);
    stopEffect();
  }

  useEffect(() => {
    async function restoreBattle() {
      const saved = await loadBattleProgress();

      if (saved) {
        setBossLevel(saved.bossLevel);
        setBossMaxHP(saved.bossMaxHP);
        setBossHP(saved.bossHP);
        setPlayerHP(saved.playerHP);
        setBattleResult(saved.battleResult);
      } else {
        const initial = createInitialBattleProgress(
          1,
          calculateBossHP(1),
          initialPlayerHP,
        );

        setBossLevel(initial.bossLevel);
        setBossMaxHP(initial.bossMaxHP);
        setBossHP(initial.bossHP);
        setPlayerHP(initial.playerHP);
        setBattleResult(initial.battleResult);
      }

      setIsLoaded(true);
    }

    restoreBattle();
  }, [initialPlayerHP]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveBattleProgress({
      bossLevel,
      bossMaxHP,
      bossHP,
      playerHP,
      battleResult,
    });
  }, [isLoaded, bossLevel, bossMaxHP, bossHP, playerHP, battleResult]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!hasHandledInitialResetVersion.current) {
      hasHandledInitialResetVersion.current = true;
      return;
    }

    resetBattleState();
  }, [resetVersion, isLoaded]);

  useEffect(() => {
    setPlayerHP((prev) => {
      if (battleResult !== null) {
        return prev;
      }

      return Math.min(prev, maxPlayerHP);
    });
  }, [maxPlayerHP, battleResult]);

  useEffect(() => {
    if (!isLoaded || battleResult !== null) {
      return;
    }

    const timer = setInterval(() => {
      setPlayerHP((prev) => {
        const newHP = Math.max(0, prev - bossAttackDamage);

        if (newHP <= 0) {
          setBattleResult("lose");
        }

        return newHP;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [isLoaded, battleResult, bossAttackDamage]);

  useEffect(() => {
    return () => {
      clearEffectTimers();
    };
  }, []);

  function playBossShake() {
    Animated.sequence([
      Animated.timing(bossShake, {
        toValue: 8,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(bossShake, {
        toValue: -8,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(bossShake, {
        toValue: 6,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(bossShake, {
        toValue: -6,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(bossShake, {
        toValue: 0,
        duration: 45,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function playSkillEffect(skill: Skill) {
    const effectKey = getEffectKeyForSkill(skill);

    if (!effectKey) {
      stopEffect();
      return;
    }

    const frames = effectFrameMap[effectKey];

    if (!frames.length) {
      stopEffect();
      return;
    }

    clearEffectTimers();
    setIsAnimatingSkill(true);

    const speedMultiplier = Math.min(speedStat * 0.015, 0.45);
    const adjustedFrameDuration = Math.max(
      60,
      Math.floor(skill.frameDurationMs * (1 - speedMultiplier)),
    );

    setActiveEffectSize({
      width: Math.max(skill.width, 220),
      height: Math.max(skill.height, 220),
    });

    setActiveEffectKey(effectKey);
    setActiveEffectFrame(0);

    let frame = 0;

    effectIntervalRef.current = setInterval(() => {
      frame += 1;

      if (frame >= frames.length) {
        stopEffect();
        return;
      }

      setActiveEffectFrame(frame);
    }, adjustedFrameDuration);

    effectTimeoutRef.current = setTimeout(
      () => {
        stopEffect();
      },
      frames.length * adjustedFrameDuration + 60,
    );
  }

  function spawnDamageNumber(value: number) {
    const id = Date.now() + Math.random();

    const randomX = 90 + Math.random() * 30;
    const randomY = 90 + Math.random() * 30;

    setDamageNumbers((prev) => [
      ...prev,
      { id, value, x: randomX, y: randomY },
    ]);
  }

  function applyAttack(skill: Skill) {
    if (!isLoaded || battleResult !== null || isAnimatingSkill) {
      return;
    }

    const baseDamage = calculateDamage();
    const damage = Math.max(1, Math.floor(baseDamage * skill.damageMultiplier));
    const newHP = Math.max(0, bossHP - damage);

    spawnDamageNumber(damage);
    playSkillEffect(skill);
    playBossShake();
    setBossHP(newHP);

    if (newHP <= 0) {
      setBattleResult("win");
    }
  }

  function attackBoss() {
    if (!basicSkill || battleResult !== null || isAnimatingSkill) {
      return;
    }

    applyAttack(basicSkill);

    const newHitCount = basicHitCount + 1;
    setBasicHitCount(newHitCount);

    if (chargedSkill && newHitCount >= chargedHitsRequired) {
      setChargedReady(true);
    }
  }

  function useChargedSkill() {
    if (
      !chargedSkill ||
      !chargedReady ||
      battleResult !== null ||
      isAnimatingSkill
    ) {
      return;
    }

    applyAttack(chargedSkill);
    setBasicHitCount(0);
    setChargedReady(false);
  }

  function removeDamageNumber(id: number) {
    setDamageNumbers((prev) => prev.filter((d) => d.id !== id));
  }

  function goToNextBoss() {
    const nextBoss = bossLevel + 1;
    const nextHP = calculateBossHP(nextBoss);

    setBossLevel(nextBoss);
    setBossMaxHP(nextHP);
    setBossHP(nextHP);
    setPlayerHP(maxPlayerHP);
    setBattleResult(null);
    setDamageNumbers([]);
    setBasicHitCount(0);
    setChargedReady(false);
    bossShake.setValue(0);
    stopEffect();
  }

  function retryBoss() {
    const sameBossHP = calculateBossHP(bossLevel);

    setBossMaxHP(sameBossHP);
    setBossHP(sameBossHP);
    setPlayerHP(maxPlayerHP);
    setBattleResult(null);
    setDamageNumbers([]);
    setBasicHitCount(0);
    setChargedReady(false);
    bossShake.setValue(0);
    stopEffect();
  }

  const effectSource =
    activeEffectKey !== null &&
    activeEffectFrame !== null &&
    activeEffectFrame >= 0 &&
    activeEffectFrame < effectFrameMap[activeEffectKey].length
      ? effectFrameMap[activeEffectKey][activeEffectFrame]
      : null;

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading battle...</Text>
      </SafeAreaView>
    );
  }

  const chargeProgress = chargedSkill
    ? `${Math.min(basicHitCount, chargedHitsRequired)} / ${chargedHitsRequired}`
    : "0 / 0";

  return (
    <Pressable
      style={styles.screenPressable}
      onPress={attackBoss}
      disabled={battleResult !== null || isAnimatingSkill}
    >
      <ImageBackground
        source={battleBackground}
        style={styles.fullScreenBackground}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.overlay}>
          <View style={styles.topUi}>
            <Text style={styles.title}>
              {stage.icon ? `${stage.icon} ${stage.name}` : stage.name}
            </Text>

            <Text style={styles.subtitle}>Boss Level {bossLevel}</Text>

            <View style={styles.section}>
              <HealthBar current={bossHP} max={bossMaxHP} />
              <Text style={styles.hpText}>
                {bossHP} / {bossMaxHP}
              </Text>
            </View>
          </View>

          <View style={styles.battleLayer}>
            <View style={styles.playerWrapper}>
              <Image source={sprites.player} style={styles.playerImage} />
            </View>

            <Animated.View
              style={[
                styles.bossWrapper,
                {
                  transform: [{ translateX: bossShake }],
                },
              ]}
            >
              <View style={styles.bossPressable}>
                {bossSprite ? (
                  <Image source={bossSprite} style={styles.bossImage} />
                ) : (
                  <View style={styles.iconBossContainer}>
                    <Text style={styles.iconBossText}>{stage.icon ?? ""}</Text>
                  </View>
                )}

                {damageNumbers.map((d) => (
                  <DamageNumber
                    key={d.id}
                    damage={d.value}
                    x={d.x}
                    y={d.y}
                    onComplete={() => removeDamageNumber(d.id)}
                  />
                ))}
              </View>
            </Animated.View>

            {effectSource !== null && activeEffectFrame !== null && (
              <Image
                key={`${activeEffectKey}-${activeEffectFrame}`}
                source={effectSource}
                style={[
                  styles.effectBase,
                  {
                    left: 120,
                    top: 180,
                    width: activeEffectSize.width,
                    height: activeEffectSize.height,
                  },
                ]}
              />
            )}
          </View>

          <View style={styles.bottomUi}>
            <Text style={styles.tapHint}>
              {battleResult === null
                ? isAnimatingSkill
                  ? "Playing skill animation..."
                  : "Tap anywhere to attack"
                : "Battle Over"}
            </Text>

            <View style={styles.section}>
              <HealthBar current={playerHP} max={maxPlayerHP} />
              <Text style={styles.hpText}>
                {playerHP} / {maxPlayerHP}
              </Text>
              <Text style={styles.stats}>Level: {character.level}</Text>
            </View>

            {battleResult === "win" && (
              <>
                <Text style={styles.winText}>Victory!</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.bossPressed,
                  ]}
                  onPress={goToNextBoss}
                >
                  <Text style={styles.actionButtonText}>Next Boss</Text>
                </Pressable>
              </>
            )}

            {battleResult === "lose" && (
              <>
                <Text style={styles.loseText}>You were defeated.</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.bossPressed,
                  ]}
                  onPress={retryBoss}
                >
                  <Text style={styles.actionButtonText}>Retry</Text>
                </Pressable>
              </>
            )}

            <View style={styles.bottomSkillPanel}>
              <View style={styles.skillInfo}>
                <Text style={styles.skillLabel}>Charge: {chargeProgress}</Text>
                <Text style={styles.skillSubLabel}>
                  {chargedSkill ? chargedSkill.name : "No charged skill"}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.skillButton,
                  chargedReady
                    ? styles.skillButtonReady
                    : styles.skillButtonLocked,
                  pressed &&
                    chargedReady &&
                    !isAnimatingSkill &&
                    styles.skillButtonPressed,
                ]}
                onPress={useChargedSkill}
                disabled={
                  !chargedReady || battleResult !== null || isAnimatingSkill
                }
              >
                <Text style={styles.skillButtonText}>
                  {isAnimatingSkill
                    ? "Animating..."
                    : chargedReady
                      ? `Use ${chargedSkill?.name ?? "Skill"}`
                      : "Skill Not Ready"}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenPressable: {
    flex: 1,
  },
  fullScreenBackground: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 20,
  },
  topUi: {
    width: "100%",
    alignItems: "center",
  },
  bottomUi: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    color: "white",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#ddd",
    marginBottom: 20,
  },
  section: {
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  hpText: {
    color: "#eee",
    fontSize: 15,
  },
  battleLayer: {
    flex: 1,
    width: "100%",
    position: "relative",
    justifyContent: "center",
  },
  playerWrapper: {
    position: "absolute",
    left: 10,
    bottom: 40,
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  playerImage: {
    width: 160,
    height: 160,
    resizeMode: "contain",
  },
  bossWrapper: {
    position: "absolute",
    right: 10,
    top: 60,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  bossPressable: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  bossImage: {
    width: 220,
    height: 220,
    resizeMode: "contain",
  },
  iconBossContainer: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBossText: {
    fontSize: 96,
  },
  effectBase: {
    position: "absolute",
    resizeMode: "contain",
    zIndex: 50,
  },
  bossPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  tapHint: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  skillInfo: {
    flex: 1,
  },
  skillLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  skillSubLabel: {
    color: "#eee",
    fontSize: 13,
    marginTop: 2,
  },
  bottomSkillPanel: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  skillButton: {
    minWidth: 150,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  skillButtonReady: {
    backgroundColor: "#f2c94c",
  },
  skillButtonLocked: {
    backgroundColor: "#555",
  },
  skillButtonPressed: {
    opacity: 0.85,
  },
  skillButtonText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 14,
  },
  stats: {
    color: "#fff",
    fontSize: 16,
  },
  winText: {
    color: "#4caf50",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loseText: {
    color: "#ff5555",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionButton: {
    backgroundColor: "#1e90ff",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 4,
  },
  actionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
