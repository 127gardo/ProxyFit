import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

type Props = {
  damage: number;
  x: number;
  y: number;
  onComplete: () => void;
};

export default function DamageNumber({ damage, x, y, onComplete }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -60,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  }, []);

  return (
    <Animated.Text
      style={[
        styles.damage,
        {
          left: x,
          top: y,
          opacity: opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      +{damage}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  damage: {
    position: "absolute",
    color: "#ff5555",
    fontSize: 24,
    fontWeight: "bold",
  },
});
