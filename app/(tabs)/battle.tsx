import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DamageNumber from "../../src/components/DamageNumber";
import HealthBar from "../../src/components/HealthBar";
import {
  BattleResult,
  createInitialBattleProgress,
  loadBattleProgress,
  saveBattleProgress,
} from "../../src/game/battleProgress";
import { calculateBossHP, getBossStage } from "../../src/game/bosses";
import { useCharacter } from "../../src/game/character";

type DamageInstance = {
  id: number;
  value: number;
  x: number;
  y: number;
};

const characterSprite = require("../../assets/sprites/character.png");

const attackFrames = [
  require("../../assets/effects/attack1.png"),
  require("../../assets/effects/attack2.png"),
];

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
  const [showAttack, setShowAttack] = useState(false);
  const [attackFrameIndex, setAttackFrameIndex] = useState(0);

  const bossShake = useRef(new Animated.Value(0)).current;
  const attackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasHandledInitialResetVersion = useRef(false);

  const stage = getBossStage(bossLevel);
  const bossSprite = stage.sprite;

  const maxPlayerHP = calculateMaxHP();

  const bossAttackDamage = Math.max(
    5,
    Math.floor(6 + bossLevel * 1.5 * stage.hpMultiplier),
  );

  function resetBattleState() {
    const resetBossHP = calculateBossHP(1);
    const resetPlayerHP = calculateMaxHP();

    setBossLevel(1);
    setBossMaxHP(resetBossHP);
    setBossHP(resetBossHP);
    setPlayerHP(resetPlayerHP);
    setBattleResult(null);
    setDamageNumbers([]);
    setShowAttack(false);
    setAttackFrameIndex(0);
    bossShake.setValue(0);
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
      if (attackTimeoutRef.current) {
        clearTimeout(attackTimeoutRef.current);
      }

      if (attackIntervalRef.current) {
        clearInterval(attackIntervalRef.current);
      }
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

  function playAttackAnimation() {
    if (attackTimeoutRef.current) {
      clearTimeout(attackTimeoutRef.current);
    }

    if (attackIntervalRef.current) {
      clearInterval(attackIntervalRef.current);
    }

    setAttackFrameIndex(0);
    setShowAttack(true);

    let frame = 0;

    attackIntervalRef.current = setInterval(() => {
      frame = (frame + 1) % attackFrames.length;
      setAttackFrameIndex(frame);
    }, 100);

    attackTimeoutRef.current = setTimeout(() => {
      if (attackIntervalRef.current) {
        clearInterval(attackIntervalRef.current);
      }

      setShowAttack(false);
      setAttackFrameIndex(0);
    }, 320);
  }

  function attackBoss() {
    if (!isLoaded || battleResult !== null) {
      return;
    }

    const damage = calculateDamage();
    const newHP = Math.max(0, bossHP - damage);
    const id = Date.now() + Math.random();
    const randomX = 175 + Math.random() * 50;
    const randomY = 250 + Math.random() * 50;

    setDamageNumbers((prev) => [
      ...prev,
      { id, value: damage, x: randomX, y: randomY },
    ]);

    playAttackAnimation();
    playBossShake();
    setBossHP(newHP);

    if (newHP <= 0) {
      setBattleResult("win");
    }
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
    setShowAttack(false);
    setAttackFrameIndex(0);
    bossShake.setValue(0);
  }

  function retryBoss() {
    const sameBossHP = calculateBossHP(bossLevel);

    setBossMaxHP(sameBossHP);
    setBossHP(sameBossHP);
    setPlayerHP(maxPlayerHP);
    setBattleResult(null);
    setShowAttack(false);
    setAttackFrameIndex(0);
    bossShake.setValue(0);
  }

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading battle...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.battleArea}>
        <Animated.View
          style={[
            styles.bossWrapper,
            {
              transform: [{ translateX: bossShake }],
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.bossPressable,
              pressed && battleResult === null && styles.bossPressed,
            ]}
            onPress={attackBoss}
            disabled={battleResult !== null}
          >
            {bossSprite ? (
              <Image source={bossSprite} style={styles.bossImage} />
            ) : (
              <View style={styles.iconBossContainer}>
                <Text style={styles.iconBossText}>{stage.icon ?? ""}</Text>
              </View>
            )}

            {showAttack && (
              <Image
                source={attackFrames[attackFrameIndex]}
                style={styles.attackEffect}
              />
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
          </Pressable>
        </Animated.View>

        <View style={styles.playerWrapper}>
          <Image source={characterSprite} style={styles.playerImage} />
        </View>
      </View>

      <Text style={styles.tapHint}>
        {battleResult === null ? "Tap the boss to attack" : "Battle Over"}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 90,
  },
  loadingText: {
    color: "white",
    fontSize: 20,
  },
  title: {
    fontSize: 32,
    color: "white",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 20,
  },
  section: {
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  hpText: {
    color: "#aaa",
    fontSize: 15,
  },
  battleArea: {
    width: "100%",
    height: 360,
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 10,
    position: "relative",
  },
  bossWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
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
  playerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  playerImage: {
    width: 140,
    height: 140,
  },
  attackEffect: {
    position: "absolute",
    top: 88,
    width: 120,
    height: 120,
  },
  bossPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  tapHint: {
    color: "#ddd",
    fontSize: 16,
    marginBottom: 10,
  },
  stats: {
    color: "#aaa",
    fontSize: 16,
  },
  winText: {
    color: "#4caf50",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 10,
  },
  loseText: {
    color: "#ff5555",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 10,
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
