import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

/*
  DamageNumberKind controls the "damage skin" style for a single number.

  For now these are code-based skins. I'll make damage skin art later. When that time comes, this same prop can be connected to unlockable cosmetic damage skins.
*/
export type DamageNumberKind = "normal" | "skill" | "critical" | "heal";

type Props = {
  damage: number;
  x: number;
  y: number;

  /*
    kind lets battle.tsx tell this component how important the hit is.
    - normal: basic tap attacks
    - skill: charged / special attacks
    - critical: future big-hit or crit attacks
    - heal: future healing numbers
  */
  kind?: DamageNumberKind;

  onComplete: () => void;
};

export default function DamageNumber({
  damage,
  x,
  y,
  kind = "normal",
  onComplete,
}: Props) {
  /*
    Each animated value controls one simple part of the effect.
    Keeping them separated makes the animation easier to tune later.
  */
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.65)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const animationConfig = useMemo(() => {
    /*
      Bigger hit types stay on screen longer and move farther.
      This gives skill hits more impact without flooding the battle screen.
    */
    switch (kind) {
      case "critical":
        return {
          lingerMs: 1250,
          floatDistance: -96,
          sideDrift: 18,
          peakScale: 1.45,
          settleScale: 1.15,
          rotationDegrees: 7,
        };
      case "skill":
        return {
          lingerMs: 1120,
          floatDistance: -84,
          sideDrift: 12,
          peakScale: 1.3,
          settleScale: 1.08,
          rotationDegrees: 4,
        };
      case "heal":
        return {
          lingerMs: 1000,
          floatDistance: -72,
          sideDrift: 8,
          peakScale: 1.2,
          settleScale: 1,
          rotationDegrees: 0,
        };
      case "normal":
      default:
        return {
          lingerMs: 750,
          floatDistance: -68,
          sideDrift: 0,
          peakScale: 1.16,
          settleScale: 0.98,
          rotationDegrees: 2,
        };
    }
  }, [kind]);

  useEffect(() => {
    /*
      Animation timeline:
      1. Pop in quickly so the hit feels strong.
      2. Linger while floating upward.
      3. Fade near the end instead of disappearing immediately.
    */
    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(Math.floor(animationConfig.lingerMs * 0.55)),
        Animated.timing(opacity, {
          toValue: 0,
          duration: Math.floor(animationConfig.lingerMs * 0.35),
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: animationConfig.peakScale,
          duration: 120,
          easing: Easing.out(Easing.back(1.8)),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: animationConfig.settleScale,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(translateY, {
        toValue: animationConfig.floatDistance,
        duration: animationConfig.lingerMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: animationConfig.sideDrift,
          duration: Math.floor(animationConfig.lingerMs * 0.35),
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -animationConfig.sideDrift / 2,
          duration: Math.floor(animationConfig.lingerMs * 0.45),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: 1,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -1,
          duration: 130,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });
  }, [
    animationConfig,
    onComplete,
    opacity,
    rotate,
    scale,
    translateX,
    translateY,
  ]);

  const rotateText = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [
      `-${animationConfig.rotationDegrees}deg`,
      "0deg",
      `${animationConfig.rotationDegrees}deg`,
    ],
  });

  const displayedValue = kind === "heal" ? `+${damage}` : `${damage}`;

  return (
    <Animated.Text
      /*
        pointerEvents="none" prevents the damage number from blocking taps on
        the boss while it is floating over the battle area.
      */
      pointerEvents="none"
      style={[
        styles.damageBase,
        styles[kind],
        {
          left: x,
          top: y,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { scale },
            { rotate: rotateText },
          ],
        },
      ]}
    >
      {displayedValue}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  damageBase: {
    position: "absolute",
    zIndex: 50,
    elevation: 50,
    minWidth: 100,
    textAlign: "center",
    fontWeight: "900",
    includeFontPadding: false,

    /*
      Text shadow is the simplest code-only way to create a stronger
      MapleStory-like outline without needing damage-number art yet.
    */
    textShadowColor: "#000",
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 3,
  },
  normal: {
    color: "#ffef5a",
    fontSize: 34,
    letterSpacing: 0.5,
  },
  skill: {
    color: "#ff8a2a",
    fontSize: 42,
    letterSpacing: 0.8,
  },
  critical: {
    color: "#ff3b3b",
    fontSize: 50,
    letterSpacing: 1,
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 4,
  },
  heal: {
    color: "#75ff8a",
    fontSize: 34,
    letterSpacing: 0.5,
  },
});
