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

export default function ForgotPasswordScreen() {
  const { sendPasswordResetEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSendResetEmail() {
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedEmail) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }

    setIsSubmitting(true);

    /*
      This tells Supabase to email the user a password reset link.

      The link will point back to:

        proxyfit://reset-password

      That deep link opens the app and takes the user to reset-password.tsx.
    */
    const { error } = await sendPasswordResetEmail(cleanedEmail);

    setIsSubmitting(false);

    if (error) {
      Alert.alert("Reset Error", error.message);
      return;
    }

    Alert.alert(
      "Check your email",
      "If this email exists, Supabase will send a password reset link.",
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>

        <Text style={styles.description}>
          Enter your email and we’ll send you a password reset link.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          style={styles.input}
        />

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            isSubmitting && styles.disabledButton,
          ]}
          onPress={handleSendResetEmail}
          disabled={isSubmitting}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Sending..." : "Send Reset Email"}
          </Text>
        </Pressable>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
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
