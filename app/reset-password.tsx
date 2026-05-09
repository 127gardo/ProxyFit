import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../src/auth/AuthProvider";

export default function ResetPasswordScreen() {
  const { session, updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleUpdatePassword() {
    if (!session) {
      Alert.alert(
        "Reset link not ready",
        "Please open this screen from the password reset email link.",
      );
      return;
    }

    if (!password || !confirmPassword) {
      Alert.alert("Missing password", "Please fill out both password boxes.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password too short", "Please use at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords do not match",
        "Please type the same password twice.",
      );
      return;
    }

    setIsSubmitting(true);

    /*
      This updates the password for the user who opened the reset email link.

      The reset email link temporarily creates a Supabase session.
      That is why updatePassword() knows which account to update.
    */
    const { error } = await updatePassword(password);

    setIsSubmitting(false);

    if (error) {
      Alert.alert("Password Error", error.message);
      return;
    }

    Alert.alert(
      "Password updated",
      "You can now log in with your new password.",
    );

    router.replace("/login");
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Create New Password</Text>

        <Text style={styles.description}>Enter your new password below.</Text>

        <Text style={styles.label}>New Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="At least 6 characters"
          style={styles.input}
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="Type it again"
          style={styles.input}
        />

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            isSubmitting && styles.disabledButton,
          ]}
          onPress={handleUpdatePassword}
          disabled={isSubmitting}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Updating..." : "Update Password"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#10131a",
  },
  card: {
    backgroundColor: "#1b2030",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    color: "#d7dbe8",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    color: "#d7dbe8",
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#6d5dfc",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  backButton: {
    marginTop: 18,
    alignItems: "center",
  },
  backButtonText: {
    color: "#9fa8ff",
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.75,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
