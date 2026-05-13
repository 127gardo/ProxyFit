import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  ImageSourcePropType,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DamageNumber, {
  DamageNumberKind,
} from "../../src/components/DamageNumber";
import HealthBar from "../../src/components/HealthBar";
import SpriteAnimator from "../../src/components/SpriteAnimator";
import {
  getBossSpriteFrames,
  getClassSpriteFrames,
} from "../../src/game/assets";
import {
  BattleResult,
  createInitialBattleProgress,
  loadBattleProgress,
  saveBattleProgress,
} from "../../src/game/battleProgress";
import { calculateBossHP, getBossStage } from "../../src/game/bosses";
import { useCharacter } from "../../src/game/character";
import { DEFAULT_CLASS_ID, getCharacterClass } from "../../src/game/classes";
import {
  Skill,
  SkillVisual,
  getFramesForVisual,
  getSkillById,
} from "../../src/game/skills";
import { getSpotterById } from "../../src/game/spotters";

/*
  Battle screen notes:

  Main character:
  - Uses DEFAULT_CLASS_ID from classes.ts.
  - Right now that is "warrior".

  Spotter:
  - When summoned, the Spotter replaces the visible player sprite.
  - For now, Spotters use spriteClassId from spotters.ts.
  - Later, you can replace spriteClassId with real Spotter sprite assets.
*/

type DamageInstance = {
  id: number;
  value: number;
  x: number;
  y: number;
  kind: DamageNumberKind;
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

type ActiveFighter = "main" | "spotter";

// Where the player located on the screen as well as its size.
const PLAYER_LAYOUT = {
  left: -10,
  bottom: 40,
  width: 192,
  height: 192,
};

const BOSS_LAYOUT = {
  right: 5,
  top: 40,
  width: 256,
  height: 256,
};

/*
  Spotter/main-character swap transition frames.

  When you make your own transition animation, add the PNG frames here:

  const FIGHTER_SWAP_TRANSITION_FRAMES: ImageSourcePropType[] = [
    require("../../assets/effects/swap_transition_01.png"),
    require("../../assets/effects/swap_transition_02.png"),
    require("../../assets/effects/swap_transition_03.png"),
  ];

  The battle screen will automatically play those frames before the visible
  fighter changes. Until you add art, it uses a simple dark flash so the swap
  still feels smoother than instantly replacing the character sprite.
*/
const FIGHTER_SWAP_TRANSITION_FRAMES: ImageSourcePropType[] = [];
const FALLBACK_SWAP_TRANSITION_MS = 320;

export default function BattleScreen() {
  const {
    character,
    updateCharacter,
    calculateDamage,
    calculateMaxHP,
    calculateAttackCooldownMs,
    getEquippedSkill,
    getActiveSpotter,
    getTotalStatsForSpotter,
    resetVersion,
  } = useCharacter();

  const [isLoaded, setIsLoaded] = useState(false);
  const [bossLevel, setBossLevel] = useState(1);
  const [bossMaxHP, setBossMaxHP] = useState(calculateBossHP(1));
  const [bossHP, setBossHP] = useState(calculateBossHP(1));
  const [playerHP, setPlayerHP] = useState(calculateMaxHP());
  const [damageNumbers, setDamageNumbers] = useState<DamageInstance[]>([]);
  const [battleResult, setBattleResult] = useState<BattleResult>(null);
  const [rewardedBossLevels, setRewardedBossLevels] = useState<number[]>([]);

  const [basicHitCount, setBasicHitCount] = useState(0);
  const [chargedReady, setChargedReady] = useState(false);

  const [activeEffects, setActiveEffects] = useState<ActiveVisualEffect[]>([]);
  const [isAnimatingSkill, setIsAnimatingSkill] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [battleLayerSize, setBattleLayerSize] = useState<BattleLayerSize>({
    width: 0,
    height: 0,
  });

  const [isFighterAttacking, setIsFighterAttacking] = useState(false);

  const [activeFighter, setActiveFighter] = useState<ActiveFighter>("main");
  const [spotterTimeLeftMs, setSpotterTimeLeftMs] = useState(0);
  const [lastRewardText, setLastRewardText] = useState("");

  /*
    Pausing is intentionally controlled by this screen instead of the app as a
    whole. If the user leaves the Battle tab, boss attacks stop and timers are
    cleared. When they return, they see a Paused overlay and tap once to resume.
  */
  const [isPaused, setIsPaused] = useState(false);
  const [, setShouldShowReturnPause] = useState(false);

  /*
    These refs mirror pause-related state without forcing useFocusEffect to
    rebuild its callback. This matters because rebuilding the focus callback can
    run its cleanup, which would immediately pause the fight again right after
    the user taps to resume.
  */
  const shouldShowReturnPauseRef = useRef(false);
  const battleResultRef = useRef<BattleResult>(null);

  /*
    This becomes true while the main-character/Spotter transition is playing.
    Input is locked during the transition so users cannot double-summon or attack
    while the visible fighter is being swapped.
  */
  const [isSwapTransitionPlaying, setIsSwapTransitionPlaying] = useState(false);

  const bossShake = useRef(new Animated.Value(0)).current;
  const fighterSwing = useRef(new Animated.Value(0)).current;

  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRefs = useRef<ReturnType<typeof setInterval>[]>([]);
  const spotterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasHandledInitialResetVersion = useRef(false);

  const stage = getBossStage(bossLevel);
  const bossFrames = getBossSpriteFrames(stage.spriteId);
  const battleBackground = stage.background;

  const selectedSpotter = getActiveSpotter();
  const selectedSpotterDefinition = selectedSpotter
    ? getSpotterById(selectedSpotter.id)
    : null;
  const selectedSpotterStats = selectedSpotter
    ? getTotalStatsForSpotter(selectedSpotter.id)
    : null;

  const isSpotterActive =
    activeFighter === "spotter" &&
    selectedSpotter !== null &&
    selectedSpotterDefinition !== null &&
    selectedSpotterStats !== null;

  /*
    This decides which sprite is shown on screen.

    Main character:
    - DEFAULT_CLASS_ID, currently warrior.

    Spotter:
    - selectedSpotterDefinition.spriteClassId.
  */
  const visibleFighterClassId = isSpotterActive
    ? selectedSpotterDefinition.spriteClassId
    : DEFAULT_CLASS_ID;

  const visibleFighterClass = getCharacterClass(visibleFighterClassId);

  const activeStrength = isSpotterActive
    ? selectedSpotterStats.strength
    : character.strength;

  const activeSpeed = isSpotterActive
    ? selectedSpotterStats.speed
    : character.speed;

  const basicSkill = isSpotterActive
    ? getSkillById(selectedSpotterDefinition.fixedBasicSkillId)
    : getEquippedSkill("basic");

  const chargedSkill = isSpotterActive
    ? getSkillById(selectedSpotterDefinition.fixedSpecialSkillId)
    : getEquippedSkill("charged");

  const chargedHitsRequired = chargedSkill?.hitsRequired ?? 5;
  const maxPlayerHP = calculateMaxHP();

  const isInputLocked =
    battleResult !== null ||
    isPaused ||
    isSwapTransitionPlaying ||
    isAnimatingSkill ||
    isRecovering;

  const bossAttackDamage = Math.max(
    5,
    Math.floor(6 + bossLevel * 1.5 * stage.hpMultiplier),
  );

  const idleFrames = getClassSpriteFrames(visibleFighterClassId, "idle");
  const attackFrames = getClassSpriteFrames(visibleFighterClassId, "attack");

  const currentFighterFrames = isFighterAttacking ? attackFrames : idleFrames;

  /*
    The fighter and boss idle animations are now handled by SpriteAnimator.
    battle.tsx only decides WHICH frames to show.
    SpriteAnimator decides WHEN to switch frames.
  */

  const fighterTransform = {
    transform: [
      {
        rotate: fighterSwing.interpolate({
          inputRange: [0, 1],
          outputRange: [
            "0deg",
            `${visibleFighterClass.swingProfile.rotationDeg}deg`,
          ],
        }),
      },
      {
        translateX: fighterSwing.interpolate({
          inputRange: [0, 1],
          outputRange: [0, visibleFighterClass.swingProfile.translateX],
        }),
      },
      {
        translateY: fighterSwing.interpolate({
          inputRange: [0, 1],
          outputRange: [0, visibleFighterClass.swingProfile.translateY],
        }),
      },
      {
        scale: fighterSwing.interpolate({
          inputRange: [0, 1],
          outputRange: [1, visibleFighterClass.swingProfile.scale],
        }),
      },
    ],
  };

  const anchorPoints = useMemo(() => {
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

    if (spotterTimerRef.current) {
      clearInterval(spotterTimerRef.current);
      spotterTimerRef.current = null;
    }
  }

  function clearCombatVisuals() {
    clearAllAsyncRefs();
    setActiveEffects([]);
    setIsAnimatingSkill(false);
    setIsRecovering(false);
    setIsFighterAttacking(false);
    setActiveFighter("main");
    setSpotterTimeLeftMs(0);
    fighterSwing.stopAnimation();
    fighterSwing.setValue(0);
  }

  function setReturnPauseFlag(nextValue: boolean) {
    shouldShowReturnPauseRef.current = nextValue;
    setShouldShowReturnPause(nextValue);
  }

  useEffect(() => {
    battleResultRef.current = battleResult;
  }, [battleResult]);

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
    setRewardedBossLevels([]);
    setLastRewardText("");
    setIsPaused(false);
    setReturnPauseFlag(false);
    setIsSwapTransitionPlaying(false);
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
        setRewardedBossLevels(saved.rewardedBossLevels);
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
        setRewardedBossLevels(initial.rewardedBossLevels);
      }

      setIsLoaded(true);
    }

    restoreBattle();
  }, []);

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
      rewardedBossLevels,
    });
  }, [
    isLoaded,
    bossLevel,
    bossMaxHP,
    bossHP,
    playerHP,
    battleResult,
    rewardedBossLevels,
  ]);

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
    if (!isLoaded || battleResult !== null || isPaused) {
      return;
    }

    const timer = setInterval(() => {
      setPlayerHP((prev) => {
        const newHP = Math.max(0, prev - bossAttackDamage);

        if (newHP <= 0) {
          setBattleResult("lose");
          setActiveFighter("main");
          setSpotterTimeLeftMs(0);
        }

        return newHP;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [isLoaded, battleResult, bossAttackDamage, isPaused]);

  useEffect(() => {
    return () => {
      clearAllAsyncRefs();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      /*
        When this screen comes back into focus after being blurred, keep the
        fight paused until the user intentionally taps to resume.

        Important: this callback intentionally reads refs instead of depending
        on shouldShowReturnPause/battleResult. If those values are dependencies,
        tapping to resume changes state, useFocusEffect cleans up the old
        callback, and that cleanup can pause the battle again. That was the
        cause of the "Paused" message blinking without actually resuming.
      */
      if (
        shouldShowReturnPauseRef.current &&
        battleResultRef.current === null
      ) {
        setIsPaused(true);
      }

      return () => {
        /*
          Leaving the Battle screen should freeze combat. We clear pending
          timeouts/intervals so skill effects, recovery windows, and Spotter
          timers do not keep progressing in the background.
        */
        if (battleResultRef.current === null) {
          setIsPaused(true);
          setReturnPauseFlag(true);
        }

        clearAllAsyncRefs();
        setActiveEffects([]);
        setIsAnimatingSkill(false);
        setIsRecovering(false);
        setIsFighterAttacking(false);
        setIsSwapTransitionPlaying(false);
        fighterSwing.stopAnimation();
        fighterSwing.setValue(0);
        bossShake.stopAnimation();
        bossShake.setValue(0);
      };
    }, []),
  );

  /*
    If the visible fighter changes, reset animation frame.
    Without this, a Spotter could appear mid-frame from the previous sprite.
  */
  useEffect(() => {
    setIsFighterAttacking(false);
    fighterSwing.stopAnimation();
    fighterSwing.setValue(0);
  }, [visibleFighterClassId]);

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
    const speedBonus = Math.min(activeSpeed * 0.015, 0.45);
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
    /*
      This is separate from the PNG frames.
      SpriteAnimator handles the frame swapping.
      fighterSwing adds a small physical lunge/swing movement.
    */
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

  function playFighterAttackAnimation() {
    setIsFighterAttacking(true);
    fighterSwing.setValue(0);

    Animated.sequence([
      Animated.timing(fighterSwing, {
        toValue: 1,
        duration: visibleFighterClass.swingProfile.durationMs,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fighterSwing, {
        toValue: 0,
        duration: Math.max(
          70,
          Math.floor(visibleFighterClass.swingProfile.durationMs * 0.75),
        ),
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsFighterAttacking(false);
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
        const speedBonus = Math.min(activeSpeed * 0.015, 0.45);
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

  function getCooldownMs(skill: Skill) {
    if (!isSpotterActive) {
      return calculateAttackCooldownMs(skill.activation);
    }

    const baseCooldown = skill.activation === "basic" ? 650 : 1100;
    const speedReduction = Math.min(
      activeSpeed * 18,
      skill.activation === "basic" ? 320 : 420,
    );

    return Math.max(
      skill.activation === "basic" ? 220 : 420,
      baseCooldown - speedReduction,
    );
  }

  function startRecovery(skill: Skill) {
    setIsRecovering(true);

    registerTimeout(() => {
      setIsRecovering(false);
    }, getCooldownMs(skill));
  }

  function getDamageNumberKind(skill: Skill, damage: number): DamageNumberKind {
    /*
      This does not change gameplay damage. It only decides how dramatic the
      floating number should look. Charged skills get a stronger style, and
      very large hits are reserved for the critical-style presentation.
    */
    const isBigChunkOfBossHP = damage >= bossMaxHP * 0.18;

    if (isBigChunkOfBossHP) {
      return "critical";
    }

    if (skill.activation === "charged") {
      return "skill";
    }

    return "normal";
  }

  function spawnDamageNumber(value: number, kind: DamageNumberKind) {
    const id = Date.now() + Math.random();

    setDamageNumbers((prev) => [
      ...prev,
      {
        id,
        value,
        kind,
        /*
          Bigger numbers need a little more room, so these coordinates place
          them near the boss center instead of tucked into the corner.
        */
        x: 70 + Math.random() * 42,
        y: 74 + Math.random() * 34,
      },
    ]);
  }

  function calculateActiveDamage(skill: Skill) {
    if (!isSpotterActive) {
      return calculateDamage(skill);
    }

    return Math.max(1, Math.floor(activeStrength * 5 * skill.damageMultiplier));
  }

  function getSkillDamageEvents(skill: Skill, totalDamage: number) {
    /*
      This converts a skill's optional damageEvents into real damage numbers.

      Example inside src/game/skills.ts:
        damageEvents: [
          { delayMs: 250, percent: 0.5 },
          { delayMs: 650, percent: 0.5 },
        ]

      That gives the skill two separate HP reductions and two separate floating
      numbers. If a skill does not define damageEvents, it behaves like before:
      one full damage hit immediately when the attack starts.
    */
    const configuredEvents =
      skill.damageEvents && skill.damageEvents.length > 0
        ? skill.damageEvents
        : [{ delayMs: 0, percent: 1 }];

    const totalPercent = configuredEvents.reduce(
      (sum, event) => sum + Math.max(0, event.percent),
      0,
    );

    if (totalPercent <= 0) {
      return [{ delayMs: 0, damage: totalDamage }];
    }

    let assignedDamage = 0;

    return configuredEvents.map((event, index) => {
      const isLastEvent = index === configuredEvents.length - 1;
      const normalizedPercent = Math.max(0, event.percent) / totalPercent;

      /*
        Rounding every hit independently can accidentally lose or create damage.
        To avoid that, every hit except the last is rounded normally, and the
        last hit receives whatever damage remains.
      */
      const damage = isLastEvent
        ? Math.max(1, totalDamage - assignedDamage)
        : Math.max(1, Math.round(totalDamage * normalizedPercent));

      assignedDamage += damage;

      return {
        delayMs: Math.max(0, event.delayMs),
        damage,
      };
    });
  }

  function finishBossVictory() {
    rewardBossFirstClearIfNeeded(bossLevel);
    setBattleResult("win");
    setActiveFighter("main");
    setSpotterTimeLeftMs(0);
  }

  function rewardBossFirstClearIfNeeded(clearedBossLevel: number) {
    if (rewardedBossLevels.includes(clearedBossLevel)) {
      setLastRewardText("");
      return;
    }

    const clearedStage = getBossStage(clearedBossLevel);
    const rewardAmount = clearedStage.firstClearSpotterPoints;

    setRewardedBossLevels((prev) => [...prev, clearedBossLevel]);
    setLastRewardText(`+${rewardAmount} Spotter Points`);

    updateCharacter({
      ...character,
      spotterPoints: character.spotterPoints + rewardAmount,
    });
  }

  function applyAttack(skill: Skill) {
    if (!isLoaded || isInputLocked) {
      return;
    }

    const totalDamage = calculateActiveDamage(skill);
    const damageEvents = getSkillDamageEvents(skill, totalDamage);
    let remainingBossHP = bossHP;
    let hasDefeatedBoss = false;

    playSkillVisuals(skill);
    playFighterAttackAnimation();
    startRecovery(skill);

    for (const event of damageEvents) {
      registerTimeout(() => {
        if (hasDefeatedBoss || battleResultRef.current !== null) {
          return;
        }

        remainingBossHP = Math.max(0, remainingBossHP - event.damage);

        spawnDamageNumber(
          event.damage,
          getDamageNumberKind(skill, event.damage),
        );
        playBossShake();
        setBossHP(remainingBossHP);

        if (remainingBossHP <= 0) {
          hasDefeatedBoss = true;
          finishBossVictory();
        }
      }, event.delayMs);
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

  function getSwapTransitionDurationMs() {
    if (FIGHTER_SWAP_TRANSITION_FRAMES.length === 0) {
      return FALLBACK_SWAP_TRANSITION_MS;
    }

    return FIGHTER_SWAP_TRANSITION_FRAMES.length * 70;
  }

  function finishSpotterSummon() {
    if (!selectedSpotterDefinition) {
      setIsSwapTransitionPlaying(false);
      return;
    }

    setActiveFighter("spotter");
    setSpotterTimeLeftMs(selectedSpotterDefinition.summonDurationMs);
    setBasicHitCount(0);
    setChargedReady(false);
    setIsSwapTransitionPlaying(false);

    if (spotterTimerRef.current) {
      clearInterval(spotterTimerRef.current);
    }

    spotterTimerRef.current = setInterval(() => {
      setSpotterTimeLeftMs((prev) => {
        const next = Math.max(0, prev - 250);

        if (next <= 0) {
          if (spotterTimerRef.current) {
            clearInterval(spotterTimerRef.current);
            spotterTimerRef.current = null;
          }

          setActiveFighter("main");
          setBasicHitCount(0);
          setChargedReady(false);
        }

        return next;
      });
    }, 250);
  }

  function playSpotterSwapTransition() {
    /*
      The actual character swap happens halfway through the transition. That
      gives your future animation a chance to hide the instant sprite change.
    */
    const durationMs = getSwapTransitionDurationMs();

    setIsSwapTransitionPlaying(true);

    registerTimeout(
      () => {
        finishSpotterSummon();
      },
      Math.max(120, Math.floor(durationMs * 0.5)),
    );
  }

  function summonSpotter() {
    if (
      !selectedSpotter ||
      !selectedSpotterDefinition ||
      isInputLocked ||
      battleResult !== null ||
      activeFighter === "spotter"
    ) {
      return;
    }

    playSpotterSwapTransition();
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
    setLastRewardText("");
    setIsPaused(false);
    setReturnPauseFlag(false);
    setIsSwapTransitionPlaying(false);
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
    setLastRewardText("");
    setIsPaused(false);
    setReturnPauseFlag(false);
    setIsSwapTransitionPlaying(false);
    bossShake.setValue(0);
    clearCombatVisuals();
  }

  function handleBattleLayerLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setBattleLayerSize({ width, height });
  }

  function handleScreenPress() {
    if (isPaused) {
      setIsPaused(false);
      setReturnPauseFlag(false);
      return;
    }

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

          <View style={styles.battleLayer} onLayout={handleBattleLayerLayout}>
            <Animated.View style={[styles.playerWrapper, fighterTransform]}>
              <SpriteAnimator
                frames={currentFighterFrames}
                frameDurationMs={isFighterAttacking ? 70 : 160}
                loop={!isFighterAttacking}
                style={styles.playerImage}
                onComplete={() => setIsFighterAttacking(false)}
              />
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
                {bossFrames.length > 0 ? (
                  <SpriteAnimator
                    frames={bossFrames}
                    frameDurationMs={180}
                    loop
                    style={styles.bossImage}
                  />
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
                    kind={damageNumber.kind}
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

            {battleResult !== null && (
              <View style={styles.resultOverlay}>
                <Text
                  style={[
                    styles.resultText,
                    battleResult === "win" ? styles.winText : styles.loseText,
                  ]}
                >
                  {battleResult === "win" ? "Victory" : "Defeat"}
                </Text>

                {battleResult === "win" && lastRewardText.length > 0 && (
                  <Text style={styles.rewardText}>{lastRewardText}</Text>
                )}

                <Text style={styles.resultPromptText}>
                  {battleResult === "win"
                    ? "Tap to start the next battle"
                    : "Tap to retry"}
                </Text>
              </View>
            )}

            {isPaused && battleResult === null && (
              <View style={styles.pausedOverlay}>
                <Text style={styles.pausedTitle}>Paused</Text>
                <Text style={styles.pausedPrompt}>Tap to resume battle</Text>
              </View>
            )}

            {isSwapTransitionPlaying && (
              <View style={styles.swapTransitionOverlay} pointerEvents="none">
                {FIGHTER_SWAP_TRANSITION_FRAMES.length > 0 ? (
                  <SpriteAnimator
                    frames={FIGHTER_SWAP_TRANSITION_FRAMES}
                    frameDurationMs={70}
                    loop={false}
                    style={styles.swapTransitionImage}
                  />
                ) : (
                  <View style={styles.swapTransitionFallback}>
                    <Text style={styles.swapTransitionText}>Swap</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.bottomUi}>
            <View style={styles.section}>
              <HealthBar current={playerHP} max={maxPlayerHP} />
              <Text style={styles.hpText}>
                {playerHP} / {maxPlayerHP}
              </Text>
              <Text style={styles.levelText}>{character.level}</Text>

              {isSpotterActive && selectedSpotterDefinition && (
                <Text style={styles.spotterTimerText}>
                  {selectedSpotterDefinition.name}:{" "}
                  {Math.ceil(spotterTimeLeftMs / 1000)}s
                </Text>
              )}
            </View>
          </View>

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

            {selectedSpotterDefinition && (
              <Pressable
                style={({ pressed }) => [
                  styles.spotterButton,
                  isSpotterActive
                    ? styles.spotterButtonActive
                    : styles.spotterButtonReady,
                  pressed &&
                    !isInputLocked &&
                    !isSpotterActive &&
                    styles.buttonPressed,
                ]}
                onPress={summonSpotter}
                disabled={isInputLocked || isSpotterActive}
              >
                <Text style={styles.spotterButtonText}>
                  {selectedSpotterDefinition.icon}
                </Text>
              </Pressable>
            )}
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
  spotterTimerText: {
    color: "#f2c94c",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
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
  rewardText: {
    color: "#f2c94c",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  resultPromptText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pausedOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "38%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 25,
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  pausedTitle: {
    color: "white",
    fontSize: 34,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pausedPrompt: {
    color: "#eee",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  swapTransitionOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },
  swapTransitionImage: {
    width: 260,
    height: 260,
    resizeMode: "contain",
  },
  swapTransitionFallback: {
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: "rgba(30,144,255,0.22)",
    borderWidth: 2,
    borderColor: "rgba(158,208,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  swapTransitionText: {
    color: "white",
    fontSize: 22,
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
  skillButtonText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 26,
  },
  spotterButton: {
    width: 54,
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  spotterButtonReady: {
    backgroundColor: "rgba(30,144,255,0.9)",
    borderColor: "#9ed0ff",
  },
  spotterButtonActive: {
    backgroundColor: "rgba(242,201,76,0.9)",
    borderColor: "#fff3b0",
  },
  spotterButtonText: {
    fontSize: 24,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
