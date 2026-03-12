import { StyleSheet, View } from "react-native";

type Props = {
  current: number;
  max: number;
};

export default function HealthBar({ current, max }: Props) {
  const percentage = current / max;

  return (
    <View style={styles.container}>
      <View style={[styles.fill, { width: `${percentage * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 250,
    height: 20,
    backgroundColor: "#333",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 30,
  },

  fill: {
    height: "100%",
    backgroundColor: "#ff5555",
  },
});
