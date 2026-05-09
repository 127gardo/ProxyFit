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

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  function getCleanedInputs() {
    return {
      cleanedEmail: email.trim().toLowerCase(),
      cleanedPassword: password,
    };
  }

  async function handleLogin() {
    const { cleanedEmail, cleanedPassword } = getCleanedInputs();

    if (!cleanedEmail || !cleanedPassword) {
      Alert.alert("Missing info", "Please enter both an email and password.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await signIn(cleanedEmail, cleanedPassword);

    setIsSubmitting(false);

    if (error) {
      Alert.alert("Login Error", error.message);
      return;
    }

    router.replace("/");
  }

  async function handleSignUp() {
    const { cleanedEmail, cleanedPassword } = getCleanedInputs();

    if (!cleanedEmail || !cleanedPassword) {
      Alert.alert("Missing info", "Please enter both an email and password.");
      return;
    }

    if (cleanedPassword.length < 6) {
      Alert.alert("Password too short", "Please use at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await signUp(cleanedEmail, cleanedPassword);

    setIsSubmitting(false);

    if (error) {
      Alert.alert("Signup Error", error.message);
      return;
    }

    if (data.session) {
      router.replace("/");
      return;
    }

    Alert.alert(
      "Check your email",
      "Your account was created. Confirm your email, then come back and log in.",
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>ProxyFit Login</Text>

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

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="At least 6 characters"
          style={styles.input}
        />

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            isSubmitting && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Please wait..." : "Login"}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
            isSubmitting && styles.disabledButton,
          ]}
          onPress={handleSignUp}
          disabled={isSubmitting}
        >
          <Text style={styles.secondaryButtonText}>Sign Up</Text>
        </Pressable>

        <Pressable
          style={styles.forgotButton}
          onPress={() => router.push("/forgot-password")}
          disabled={isSubmitting}
        >
          <Text style={styles.forgotButtonText}>Forgot Password?</Text>
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
    marginTop: 4,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    borderColor: "#6d5dfc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#c9c4ff",
    fontWeight: "700",
    fontSize: 16,
  },
  forgotButton: {
    marginTop: 18,
    alignItems: "center",
  },
  forgotButtonText: {
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
