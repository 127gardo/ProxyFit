import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: "#111",
        },
        headerTintColor: "#fff",
        sceneStyle: {
          backgroundColor: "#000",
        },
        tabBarStyle: {
          backgroundColor: "#111",
          borderTopColor: "#222",
          height: 70,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#1e90ff",
        tabBarInactiveTintColor: "#777",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          href: "/(tabs)",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="workout"
        options={{
          title: "Workout",
          href: "/(tabs)/workout",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="battle"
        options={{
          title: "Battle",
          href: "/(tabs)/battle",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="character"
        options={{
          title: "Character",
          href: "/(tabs)/character",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
