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

// This is one floating damage number that pops up when you hit the boss.
type DamageInstance = {
  id: number;
  value: number;
  x: number;
  y: number;
};

// This stores how big the battle area is on the screen.
type BattleLayerSize = {
  width: number;
  height: number;
};

// This is just a point on the screen.
type AnchorPoint = {
  x: number;
  y: number;
};

// This stores one active animation effect, like lightning or fire.
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

// Where the player sprite sits on the screen.
const PLAYER_LAYOUT = {
  left: 10,
  bottom: 40,
  width: 128,
  height: 128,
};

// Where the boss sprite sits on the screen.
const BOSS_LAYOUT = {
  right: 10,
  top: 60,
  width: 220,
  height: 220,
};

export default function BattleScreen() {
  // Grab the player data and battle helpers from your character system.
  const {
    character,
    calculateDamage,
    calculateMaxHP,
    calculateAttackCooldownMs,
    getEquippedSkill,
    resetVersion,
  } = useCharacter();

  // Basic battle state.
  const [isLoaded, setIsLoaded] = useState(false);
  const [bossLevel, setBossLevel] = useState(1);
  const [bossMaxHP, setBossMaxHP] = useState(calculateBossHP(1));
  const [bossHP, setBossHP] = useState(calculateBossHP(1));
  const [playerHP, setPlayerHP] = useState(calculateMaxHP());
  const [damageNumbers, setDamageNumbers] = useState<DamageInstance[]>([]);
  const [battleResult, setBattleResult] = useState<BattleResult>(null);

  // This tracks the charge-up for the special skill.
  const [basicHitCount, setBasicHitCount] = useState(0);
  const [chargedReady, setChargedReady] = useState(false);

  // These control animation/effects.
  const [activeEffects, setActiveEffects] = useState<ActiveVisualEffect[]>([]);
  const [isAnimatingSkill, setIsAnimatingSkill] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [battleLayerSize, setBattleLayerSize] = useState<BattleLayerSize>({
    width: 0,
    height: 0,
  });
  const [playerSpriteIndex, setPlayerSpriteIndex] = useState(0);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);

  // These Animated.Values control shake/swing motion.
  const bossShake = useRef(new Animated.Value(0)).current;
  const playerSwing = useRef(new Animated.Value(0)).current;

  // We store timeout/interval refs so we can clean them up safely.
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRefs = useRef<ReturnType<typeof setInterval>[]>([]);
  const hasHandledInitialResetVersion = useRef(false);

  // Figure out which boss stage we are on.
  const stage = getBossStage(bossLevel);
  const bossSprite = stage.sprite;
  const battleBackground = stage.background;

  // Figure out player battle stats.
  const maxPlayerHP = calculateMaxHP();
  const basicSkill = getEquippedSkill("basic");
  const chargedSkill = getEquippedSkill("charged");
  const chargedHitsRequired = chargedSkill?.hitsRequired ?? 5;

  // Lock input during certain moments.
  const isInputLocked =
    battleResult !== null || isAnimatingSkill || isRecovering;

  // Boss damage over time.
  const bossAttackDamage = Math.max(
    5,
    Math.floor(6 + bossLevel * 1.5 * stage.hpMultiplier),
  );

  // Get class animation data.
  const classDefinition = getCharacterClass(character.classId);
  const idleFrames = getClassSpriteFrames(character.classId, "idle");
  const attackFrames = getClassSpriteFrames(character.classId, "attack");
  const currentPlayerFrames = isPlayerAttacking ? attackFrames : idleFrames;
  const playerSpriteSource =
    currentPlayerFrames[playerSpriteIndex] ?? currentPlayerFrames[0];

  // This builds the player swing animation.
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

  // These points tell effects where to appear.
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

  // Small helper for tracking timeouts.
  function registerTimeout(callback: () => void, delayMs: number) {
    const timeout = setTimeout(callback, delayMs);
    timeoutRefs.current.push(timeout);
    return timeout;
  }

  // Small helper for tracking intervals.
  function registerInterval(callback: () => void, delayMs: number) {
    const interval = setInterval(callback, delayMs);
    intervalRefs.current.push(interval);
    return interval;
  }

  // Clears all timers so old animation logic doesn't keep running.
  function clearAllAsyncRefs() {
    timeoutRefs.current.forEach(clearTimeout);
    intervalRefs.current.forEach(clearInterval);
    timeoutRefs.current = [];
    intervalRefs.current = [];
  }

  // Clears all battle visuals and resets animation values.
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

  // Full reset back to the very first boss.
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

  // Load saved battle progress when the screen starts.
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

  // Save battle progress whenever important battle values change.
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

  // If the character system says "full reset happened", reset battle too.
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

  // Keep player HP from going above the new max HP.
  useEffect(() => {
    setPlayerHP((prev) => {
      if (battleResult !== null) {
        return prev;
      }

      return Math.min(prev, maxPlayerHP);
    });
  }, [maxPlayerHP, battleResult]);

  // Boss attacks the player on a timer.
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

  // Cleanup when leaving the screen.
  useEffect(() => {
    return () => {
      clearAllAsyncRefs();
    };
  }, []);

  function getAnchorPoint(anchor: "player" | "boss" | "screen") {
    return anchorPoints[anchor];
  }

  // Builds an effect that appears at one anchor point.
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

  // Builds a beam-type effect from one point to another.
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

  // Adds one effect and animates its frames.
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

  // Makes the boss shake when hit.
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

  // Plays the player attack frames + swing motion.
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

  // Plays all visuals tied to a skill.
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

  // Adds a cooldown after each skill use.
  function startRecovery(skill: Skill) {
    setIsRecovering(true);
    const cooldownMs = calculateAttackCooldownMs(skill.activation);

    registerTimeout(() => {
      setIsRecovering(false);
    }, cooldownMs);
  }

  // Creates floating damage text near the boss.
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

  // One shared attack function for both basic and charged skills.
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

  // Normal tap attack.
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

  // Special charged skill.
  function useChargedSkill() {
    if (!chargedSkill || !chargedReady || isInputLocked) {
      return;
    }

    applyAttack(chargedSkill);
    setBasicHitCount(0);
    setChargedReady(false);
  }

  // Remove one floating damage number after it finishes animating.
  function removeDamageNumber(id: number) {
    setDamageNumbers((prev) =>
      prev.filter((damageNumber) => damageNumber.id !== id),
    );
  }

  // Go to the next boss after a win.
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

  // Retry the same boss after a loss.
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

  // Save the size of the battle area so effects can be placed correctly.
  function handleBattleLayerLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setBattleLayerSize({ width, height });
  }

  // This handles any tap on the screen.
  // If battle ended:
  // - win = next boss
  // - loss = retry
  // If battle not ended:
  // - normal attack
  function handleScreenPress() {
    if (battleResult === "win") {
      goToNextBoss();
      return;
    }

    if (battleResult === "lose") {
      retryBoss();
      return;
    }

    attackBoss();
  }

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading battle...</Text>
      </SafeAreaView>
    );
  }

  return (
    <Pressable style={styles.screenPressable} onPress={handleScreenPress}>
      <ImageBackground
        source={battleBackground}
        style={styles.fullScreenBackground}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.overlay}>
          {/* TOP INFO
             Only keep the important text:
             boss name, boss level, and HP numbers. */}
          <View style={styles.topUi}>
            <Text style={styles.title}>{stage.name}</Text>
            <Text style={styles.levelText}>{bossLevel}</Text>

            <View style={styles.section}>
              <HealthBar current={bossHP} max={bossMaxHP} />
              <Text style={styles.hpText}>
                {bossHP} / {bossMaxHP}
              </Text>
            </View>
          </View>

          {/* MAIN BATTLE AREA
             Player and boss stay in fixed positions here. */}
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

            {/* Skill effects like lightning / fire / beam */}
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

            {/* RESULT OVERLAY
               This is absolute so it does NOT push the layout around. */}
            {battleResult !== null && (
              <View style={styles.resultOverlay} pointerEvents="none">
                <Text
                  style={[
                    styles.resultText,
                    battleResult === "win" ? styles.winText : styles.loseText,
                  ]}
                >
                  {battleResult === "win" ? "Win" : "Loss"}
                </Text>
              </View>
            )}
          </View>

          {/* BOTTOM INFO
             Only show character level and player HP numbers.
             No extra words, no class name, no skill names, no instructions. */}
          <View style={styles.bottomUi}>
            <View style={styles.section}>
              <HealthBar current={playerHP} max={maxPlayerHP} />
              <Text style={styles.hpText}>
                {playerHP} / {maxPlayerHP}
              </Text>
              <Text style={styles.levelText}>{character.level}</Text>
            </View>
          </View>

          {/* CHARGED SKILL BUTTON
             Keep the feature, but make the text minimal.
             We use an icon and little dots instead of words. */}
          <View style={styles.skillHud} pointerEvents="box-none">
            <View style={styles.chargeDotsRow}>
              {Array.from({ length: chargedHitsRequired }).map((_, index) => {
                const filled =
                  index < Math.min(basicHitCount, chargedHitsRequired);

                return (
                  <View
                    key={index}
                    style={[
                      styles.chargeDot,
                      filled ? styles.chargeDotFilled : styles.chargeDotEmpty,
                    ]}
                  />
                );
              })}
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
              <Text style={styles.skillButtonText}>⚡</Text>
            </Pressable>
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
    fontSize: 30,
    color: "white",
    marginBottom: 4,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  levelText: {
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  section: {
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },

  hpText: {
    color: "#eee",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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

  resultOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "42%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },

  resultText: {
    fontSize: 34,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  winText: {
    color: "#4caf50",
  },

  loseText: {
    color: "#ff5555",
  },

  skillHud: {
    position: "absolute",
    right: 20,
    bottom: 34,
    alignItems: "center",
    gap: 8,
  },

  chargeDotsRow: {
    flexDirection: "row",
    gap: 6,
  },

  chargeDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },

  chargeDotFilled: {
    backgroundColor: "#f2c94c",
  },

  chargeDotEmpty: {
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  skillButton: {
    width: 62,
    height: 62,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  skillButtonReady: {
    backgroundColor: "#f2c94c",
  },

  skillButtonLocked: {
    backgroundColor: "rgba(85,85,85,0.85)",
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  skillButtonText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 26,
  },
});
