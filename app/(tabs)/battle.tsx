import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DamageNumber from "../../src/components/DamageNumber";
import HealthBar from "../../src/components/HealthBar";
import { getClassSpriteFrames } from "../../src/game/assets";
import {
  BattleResult,
  createInitialBattleProgress,
  loadBattleProgress,
  saveBattleProgress,
} from "../../src/game/battleProgress";
import { calculateBossHP, getBossStage } from "../../src/game/bosses";
import { useCharacter } from "../../src/game/character";
import { getCharacterClass } from "../../src/game/classes";
import { Skill, SkillVisual, getFramesForVisual } from "../../src/game/skills";

type DamageInstance = {
  id: number;
  value: number;
  x: number;
  y: number;
};

type BattleLayerSize = {
  width: number;
  height: number;
};

type AnchorPoint = {
  x: number;
  y: number;
};

type ActiveVisualEffect = {
  id: string;
  visual: SkillVisual;
  frames: ReturnType<typeof getFramesForVisual>;
  frameIndex: number;
  width: number;
  height: number;
  left: number;
  top: number;
  rotationDeg?: number;
};

const PLAYER_LAYOUT = {
  left: 10,
  bottom: 40,
  width: 160,
  height: 160,
};

const BOSS_LAYOUT = {
  right: 10,
  top: 60,
  width: 220,
  height: 220,
};

export default function BattleScreen() {
  const {
    character,
    calculateDamage,
    calculateMaxHP,
    calculateAttackCooldownMs,
    getEquippedSkill,
    resetVersion,
  } = useCharacter();

  const [isLoaded, setIsLoaded] = useState(false);
  const [bossLevel, setBossLevel] = useState(1);
  const [bossMaxHP, setBossMaxHP] = useState(calculateBossHP(1));
  const [bossHP, setBossHP] = useState(calculateBossHP(1));
  const [playerHP, setPlayerHP] = useState(calculateMaxHP());
  const [damageNumbers, setDamageNumbers] = useState<DamageInstance[]>([]);
  const [battleResult, setBattleResult] = useState<BattleResult>(null);
  const [basicHitCount, setBasicHitCount] = useState(0);
  const [chargedReady, setChargedReady] = useState(false);
  const [activeEffects, setActiveEffects] = useState<ActiveVisualEffect[]>([]);
  const [isAnimatingSkill, setIsAnimatingSkill] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [battleLayerSize, setBattleLayerSize] = useState<BattleLayerSize>({
    width: 0,
    height: 0,
  });
  const [playerSpriteIndex, setPlayerSpriteIndex] = useState(0);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);

  const bossShake = useRef(new Animated.Value(0)).current;
  const playerSwing = useRef(new Animated.Value(0)).current;
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRefs = useRef<ReturnType<typeof setInterval>[]>([]);
  const hasHandledInitialResetVersion = useRef(false);

  const stage = getBossStage(bossLevel);
  const bossSprite = stage.sprite;
  const battleBackground = stage.background;
  const maxPlayerHP = calculateMaxHP();
  const basicSkill = getEquippedSkill("basic");
  const chargedSkill = getEquippedSkill("charged");
  const chargedHitsRequired = chargedSkill?.hitsRequired ?? 5;
  const isInputLocked =
    battleResult !== null || isAnimatingSkill || isRecovering;
  const bossAttackDamage = Math.max(
    5,
    Math.floor(6 + bossLevel * 1.5 * stage.hpMultiplier),
  );
  const classDefinition = getCharacterClass(character.classId);
  const idleFrames = getClassSpriteFrames(character.classId, "idle");
  const attackFrames = getClassSpriteFrames(character.classId, "attack");
  const currentPlayerFrames = isPlayerAttacking ? attackFrames : idleFrames;
  const playerSpriteSource =
    currentPlayerFrames[playerSpriteIndex] ?? currentPlayerFrames[0];

  const playerTransform = {
    transform: [
      {
        rotate: playerSwing.interpolate({
          inputRange: [0, 1],
          outputRange: [
            "0deg",
            `${classDefinition.swingProfile.rotationDeg}deg`,
          ],
        }),
      },
      {
        translateX: playerSwing.interpolate({
          inputRange: [0, 1],
          outputRange: [0, classDefinition.swingProfile.translateX],
        }),
      },
      {
        translateY: playerSwing.interpolate({
          inputRange: [0, 1],
          outputRange: [0, classDefinition.swingProfile.translateY],
        }),
      },
      {
        scale: playerSwing.interpolate({
          inputRange: [0, 1],
          outputRange: [1, classDefinition.swingProfile.scale],
        }),
      },
    ],
  };

  const anchorPoints = useMemo(() => {
    const playerCenterX = PLAYER_LAYOUT.left + PLAYER_LAYOUT.width * 0.5;
    const playerCenterY =
      battleLayerSize.height -
      PLAYER_LAYOUT.bottom -
      PLAYER_LAYOUT.height * 0.5;
    const bossCenterX =
      battleLayerSize.width - BOSS_LAYOUT.right - BOSS_LAYOUT.width * 0.5;
    const bossCenterY = BOSS_LAYOUT.top + BOSS_LAYOUT.height * 0.5;

    return {
      player: {
        x: PLAYER_LAYOUT.left + PLAYER_LAYOUT.width * 0.72,
        y: playerCenterY - PLAYER_LAYOUT.height * 0.12,
      },
      boss: {
        x: bossCenterX,
        y: bossCenterY - BOSS_LAYOUT.height * 0.04,
      },
      screen: {
        x: battleLayerSize.width * 0.5,
        y: battleLayerSize.height * 0.45,
      },
    } satisfies Record<"player" | "boss" | "screen", AnchorPoint>;
  }, [battleLayerSize.height, battleLayerSize.width]);

  function registerTimeout(callback: () => void, delayMs: number) {
    const timeout = setTimeout(callback, delayMs);
    timeoutRefs.current.push(timeout);
    return timeout;
  }

  function registerInterval(callback: () => void, delayMs: number) {
    const interval = setInterval(callback, delayMs);
    intervalRefs.current.push(interval);
    return interval;
  }

  function clearAllAsyncRefs() {
    timeoutRefs.current.forEach(clearTimeout);
    intervalRefs.current.forEach(clearInterval);
    timeoutRefs.current = [];
    intervalRefs.current = [];
  }

  function clearCombatVisuals() {
    clearAllAsyncRefs();
    setActiveEffects([]);
    setIsAnimatingSkill(false);
    setIsRecovering(false);
    setIsPlayerAttacking(false);
    setPlayerSpriteIndex(0);
    playerSwing.stopAnimation();
    playerSwing.setValue(0);
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
    clearCombatVisuals();
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
        const initialPlayerHP = calculateMaxHP();
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
  }, [calculateMaxHP]);

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
      clearAllAsyncRefs();
    };
  }, []);

  function getAnchorPoint(anchor: "player" | "boss" | "screen") {
    return anchorPoints[anchor];
  }

  function buildAnchoredEffect(visual: SkillVisual): ActiveVisualEffect | null {
    if (!visual.anchor) {
      return null;
    }

    const frames = getFramesForVisual(visual);
    if (frames.length === 0) {
      return null;
    }

    const width = visual.width ?? 180;
    const height = visual.height ?? 180;
    const anchorPoint = getAnchorPoint(visual.anchor);

    return {
      id: `${visual.id}-${Date.now()}-${Math.random()}`,
      visual,
      frames,
      frameIndex: 0,
      width,
      height,
      left: anchorPoint.x - width / 2 + (visual.offsetX ?? 0),
      top: anchorPoint.y - height / 2 + (visual.offsetY ?? 0),
    };
  }

  function buildBeamEffect(visual: SkillVisual): ActiveVisualEffect | null {
    if (!visual.startAnchor || !visual.endAnchor) {
      return null;
    }

    const frames = getFramesForVisual(visual);
    if (frames.length === 0) {
      return null;
    }

    const start = getAnchorPoint(visual.startAnchor);
    const end = getAnchorPoint(visual.endAnchor);

    const startX = start.x + (visual.startOffsetX ?? 0);
    const startY = start.y + (visual.startOffsetY ?? 0);
    const endX = end.x + (visual.endOffsetX ?? 0);
    const endY = end.y + (visual.endOffsetY ?? 0);

    const distance = Math.hypot(endX - startX, endY - startY);
    const width = visual.followDistance
      ? Math.max(distance, 40)
      : (visual.width ?? 180);
    const height = visual.thickness ?? visual.height ?? 60;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const angleRad = Math.atan2(endY - startY, endX - startX);
    const rotationDeg = (angleRad * 180) / Math.PI;

    return {
      id: `${visual.id}-${Date.now()}-${Math.random()}`,
      visual,
      frames,
      frameIndex: 0,
      width,
      height,
      left: midX - width / 2,
      top: midY - height / 2,
      rotationDeg,
    };
  }

  function addVisualEffect(visual: SkillVisual) {
    const builtEffect =
      visual.type === "beam"
        ? buildBeamEffect(visual)
        : buildAnchoredEffect(visual);

    if (!builtEffect) {
      return;
    }

    setActiveEffects((prev) => [...prev, builtEffect]);

    const frameDurationBase = visual.frameDurationMs ?? 90;
    const speedBonus = Math.min(character.speed * 0.015, 0.45);
    const adjustedFrameDuration = Math.max(
      60,
      Math.floor(frameDurationBase * (1 - speedBonus)),
    );

    let frameIndex = 0;

    const interval = registerInterval(() => {
      frameIndex += 1;

      if (frameIndex >= builtEffect.frames.length) {
        clearInterval(interval);
        setActiveEffects((prev) =>
          prev.filter((effect) => effect.id !== builtEffect.id),
        );
        return;
      }

      setActiveEffects((prev) =>
        prev.map((effect) =>
          effect.id === builtEffect.id ? { ...effect, frameIndex } : effect,
        ),
      );
    }, adjustedFrameDuration);
  }

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

  function playPlayerAttackAnimation() {
    setIsPlayerAttacking(true);
    setPlayerSpriteIndex(0);
    playerSwing.setValue(0);

    const attackFramesSafe =
      attackFrames.length > 0 ? attackFrames : idleFrames;
    const frameStepMs = Math.max(
      55,
      Math.floor(
        classDefinition.swingProfile.durationMs / attackFramesSafe.length,
      ),
    );

    attackFramesSafe.forEach((_, index) => {
      registerTimeout(() => {
        setPlayerSpriteIndex(index);
      }, index * frameStepMs);
    });

    Animated.sequence([
      Animated.timing(playerSwing, {
        toValue: 1,
        duration: classDefinition.swingProfile.durationMs,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(playerSwing, {
        toValue: 0,
        duration: Math.max(
          70,
          Math.floor(classDefinition.swingProfile.durationMs * 0.75),
        ),
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsPlayerAttacking(false);
      setPlayerSpriteIndex(0);
    });
  }

  function playSkillVisuals(skill: Skill) {
    setIsAnimatingSkill(true);

    const timings: number[] = [];

    for (const visual of skill.visuals) {
      const delayMs = visual.delayMs ?? 0;
      timings.push(delayMs);
      registerTimeout(() => addVisualEffect(visual), delayMs);
    }

    const latestDelay = timings.length > 0 ? Math.max(...timings) : 0;
    const longestVisual =
      skill.visuals.reduce((max, visual) => {
        const frames = getFramesForVisual(visual);
        const frameDurationBase = visual.frameDurationMs ?? 90;
        const speedBonus = Math.min(character.speed * 0.015, 0.45);
        const adjustedFrameDuration = Math.max(
          60,
          Math.floor(frameDurationBase * (1 - speedBonus)),
        );

        return Math.max(
          max,
          frames.length * adjustedFrameDuration + (visual.delayMs ?? 0),
        );
      }, 0) || latestDelay;

    registerTimeout(() => {
      setIsAnimatingSkill(false);
    }, longestVisual + 40);
  }

  function startRecovery(skill: Skill) {
    setIsRecovering(true);
    const cooldownMs = calculateAttackCooldownMs(skill.activation);

    registerTimeout(() => {
      setIsRecovering(false);
    }, cooldownMs);
  }

  function spawnDamageNumber(value: number) {
    const id = Date.now() + Math.random();

    setDamageNumbers((prev) => [
      ...prev,
      {
        id,
        value,
        x: 90 + Math.random() * 30,
        y: 90 + Math.random() * 30,
      },
    ]);
  }

  function applyAttack(skill: Skill) {
    if (!isLoaded || isInputLocked) {
      return;
    }

    const damage = calculateDamage(skill);
    const newHP = Math.max(0, bossHP - damage);

    spawnDamageNumber(damage);
    playSkillVisuals(skill);
    playPlayerAttackAnimation();
    playBossShake();
    startRecovery(skill);
    setBossHP(newHP);

    if (newHP <= 0) {
      setBattleResult("win");
    }
  }

  function attackBoss() {
    if (!basicSkill || isInputLocked) {
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
    if (!chargedSkill || !chargedReady || isInputLocked) {
      return;
    }

    applyAttack(chargedSkill);
    setBasicHitCount(0);
    setChargedReady(false);
  }

  function removeDamageNumber(id: number) {
    setDamageNumbers((prev) =>
      prev.filter((damageNumber) => damageNumber.id !== id),
    );
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
    clearCombatVisuals();
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
    clearCombatVisuals();
  }

  function handleBattleLayerLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setBattleLayerSize({ width, height });
  }

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading battle...</Text>
      </SafeAreaView>
    );
  }

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

          <View style={styles.battleLayer} onLayout={handleBattleLayerLayout}>
            <Animated.View style={[styles.playerWrapper, playerTransform]}>
              <Image source={playerSpriteSource} style={styles.playerImage} />
            </Animated.View>

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

                {damageNumbers.map((damageNumber) => (
                  <DamageNumber
                    key={damageNumber.id}
                    damage={damageNumber.value}
                    x={damageNumber.x}
                    y={damageNumber.y}
                    onComplete={() => removeDamageNumber(damageNumber.id)}
                  />
                ))}
              </View>
            </Animated.View>

            {activeEffects.map((effect) => {
              const source =
                effect.frames[effect.frameIndex] ?? effect.frames[0];

              return (
                <Image
                  key={effect.id}
                  source={source}
                  style={[
                    styles.effectBase,
                    {
                      left: effect.left,
                      top: effect.top,
                      width: effect.width,
                      height: effect.height,
                      transform: effect.rotationDeg
                        ? [{ rotate: `${effect.rotationDeg}deg` }]
                        : undefined,
                    },
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.bottomUi}>
            <Text style={styles.tapHint}>
              {battleResult === null
                ? isAnimatingSkill
                  ? "Playing skill animation..."
                  : isRecovering
                    ? "Recovering..."
                    : "Tap anywhere to attack"
                : "Battle Over"}
            </Text>

            <View style={styles.section}>
              <HealthBar current={playerHP} max={maxPlayerHP} />
              <Text style={styles.hpText}>
                {playerHP} / {maxPlayerHP}
              </Text>
              <Text style={styles.stats}>Level: {character.level}</Text>
              <Text style={styles.stats}>Class: {classDefinition.name}</Text>
              <Text style={styles.stats}>
                Basic: {basicSkill?.name ?? "None"}
              </Text>
              <Text style={styles.stats}>
                Charged: {chargedSkill?.name ?? "None"}
              </Text>
            </View>

            {battleResult === "win" && (
              <>
                <Text style={styles.winText}>Victory!</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.buttonPressed,
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
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={retryBoss}
                >
                  <Text style={styles.actionButtonText}>Retry</Text>
                </Pressable>
              </>
            )}

            <View style={styles.bottomSkillPanel}>
              <View style={styles.skillInfo}>
                <Text style={styles.skillLabel}>
                  Charge: {Math.min(basicHitCount, chargedHitsRequired)} /{" "}
                  {chargedHitsRequired}
                </Text>
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
                    !isInputLocked &&
                    styles.buttonPressed,
                ]}
                onPress={useChargedSkill}
                disabled={!chargedReady || isInputLocked}
              >
                <Text style={styles.skillButtonText}>
                  {isAnimatingSkill || isRecovering
                    ? "Locked"
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
    left: PLAYER_LAYOUT.left,
    bottom: PLAYER_LAYOUT.bottom,
    width: PLAYER_LAYOUT.width,
    height: PLAYER_LAYOUT.height,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  playerImage: {
    width: PLAYER_LAYOUT.width,
    height: PLAYER_LAYOUT.height,
    resizeMode: "contain",
  },
  bossWrapper: {
    position: "absolute",
    right: BOSS_LAYOUT.right,
    top: BOSS_LAYOUT.top,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  bossPressable: {
    width: BOSS_LAYOUT.width,
    height: BOSS_LAYOUT.height,
    alignItems: "center",
    justifyContent: "center",
  },
  bossImage: {
    width: BOSS_LAYOUT.width,
    height: BOSS_LAYOUT.height,
    resizeMode: "contain",
  },
  iconBossContainer: {
    width: BOSS_LAYOUT.width,
    height: BOSS_LAYOUT.height,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBossText: {
    fontSize: 96,
  },
  effectBase: {
    position: "absolute",
    resizeMode: "contain",
    zIndex: 6,
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
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
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
