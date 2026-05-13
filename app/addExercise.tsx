import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useCustomExercises } from "../src/game/customExercises";
import { MuscleGroup, muscleGroups } from "../src/game/exercises";

/*
  AddExerciseScreen lets users add exercises you did not include by default.

  The user only chooses:
  - exercise name
  - category/muscle group

  The game-side stat rewards are decided in src/game/exercises.ts by
  getStatsForMuscleGroup(). That keeps this screen clean and prevents users
  from needing to understand the full RPG math.
*/

export default function AddExerciseScreen() {
  const { addCustomExercise } = useCustomExercises();

  const [name, setName] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>("arms");

  function saveExercise() {
    const createdExercise = addCustomExercise({
      name,
      muscle: selectedMuscle,
    });

    if (!createdExercise) {
      Alert.alert(
        "Could not add exercise",
        "Please enter a unique exercise name.",
      );
      return;
    }

    Alert.alert("Exercise added", `${createdExercise.name} is now available.`, [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Add Exercise</Text>
          <Text style={styles.subText}>
            Add an exercise once and it becomes part of your workout list.
          </Text>

          <Text style={styles.label}>Exercise Name</Text>
          <TextInput
            placeholder="Example: Sled Push"
            placeholderTextColor="#777"
            style={styles.input}
            value={name}
            onChangeText={setName}
            returnKeyType="done"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {muscleGroups.map((muscle) => {
              const selected = selectedMuscle === muscle;

              return (
                <Pressable
                  key={muscle}
                  style={({ pressed }) => [
                    styles.categoryButton,
                    selected && styles.categoryButtonSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => setSelectedMuscle(muscle)}
                >
                  <Text style={styles.categoryText}>
                    {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Rewards are automatic. Cardio gives Speed/Endurance. Legs and Core
              give Strength/Endurance. Other categories give Strength.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={saveExercise}
          >
            <Text style={styles.primaryButtonText}>Save Exercise</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subText: {
    color: "#aaa",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 22,
  },
  label: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#111",
    color: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  categoryButton: {
    backgroundColor: "#222",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonSelected: {
    backgroundColor: "#1e90ff",
  },
  categoryText: {
    color: "white",
    fontWeight: "bold",
  },
  infoBox: {
    backgroundColor: "#0f1720",
    borderWidth: 1,
    borderColor: "#1e90ff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  infoText: {
    color: "#cfe7ff",
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#1e90ff",
    padding: 15,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 12,
    marginTop: 12,
  },
  secondaryButtonText: {
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
