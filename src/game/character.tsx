// This file manages player stats, XP, leveling, damage, max HP, reset logic, and saving progress
// Every screen that needs player info calls useCharacter() from here.
import React, { createContext, useContext, useEffect, useState } from "react";
import { loadCharacter, saveCharacter } from "./storage";

export type CharacterStat = "strength" | "endurance" | "speed";

// Defines what a character looks like
export type Character = {
  level: number;
  xp: number;
  strength: number;
  endurance: number;
  speed: number;
};

// Starting character build
export const INITIAL_CHARACTER: Character = {
  level: 1,
  xp: 0,
  strength: 1,
  endurance: 1,
  speed: 1,
};

// Describes everything the context provides
// Anything inside this type is available through useCharacter()
type CharacterContextType = {
  character: Character; // Current stats
  updateCharacter: (character: Character) => void; // Change stats
  resetCharacter: () => void;
  calculateDamage: () => number; // Attack damage
  calculateMaxHP: () => number; // Player HP
  resetVersion: number; // Tells other screens reset happened
};

// Creates the shared state container
const CharacterContext = createContext<CharacterContextType | null>(null);

// Calculates leveling difficulty
// ex. lvl 1, 100 xp needed. lvl 2, 216 xp needed.
export function getXPNeededForLevel(level: number) {
  return Math.floor(100 * Math.pow(level, 1.35));
}

// Processes workout rewards
// ex. strength: +20, endurance: +15, speed: +10
export function applyStatRewards(
  character: Character,
  rewards: Record<CharacterStat, number>,
) {
  let newXP = character.xp;
  let newLevel = character.level;
  let newStrength = character.strength;
  let newEndurance = character.endurance;
  let newSpeed = character.speed;
  let levelsGained = 0; // Tracks how many levels were earned in one workout

  // Defines the order in which rewards are processed
  const statOrder: CharacterStat[] = ["strength", "endurance", "speed"];

  // Loop through strength, edurance, and speed
  // ex. If reward exists -> use it. Otherwise -> 0
  for (const stat of statOrder) {
    const amount = rewards[stat] ?? 0;

    if (amount <= 0) continue; // If no XP for that stat, skip it

    newXP += amount;

    // As long as the player has enough XP to level up, keep leveling
    while (newXP >= getXPNeededForLevel(newLevel)) {
      newXP -= getXPNeededForLevel(newLevel);
      newLevel += 1;
      levelsGained += 1;

      if (stat === "strength") newStrength += 2;
      if (stat === "endurance") newEndurance += 2;
      if (stat === "speed") newSpeed += 2;
    }
  }

  // Returns results and updates the character state
  return {
    character: {
      level: newLevel,
      xp: newXP,
      strength: newStrength,
      endurance: newEndurance,
      speed: newSpeed,
    },
    levelsGained,
    totalXpGained:
      (rewards.strength ?? 0) + (rewards.endurance ?? 0) + (rewards.speed ?? 0),
  };
}

// Entire app is wrapped with this provider so everything inside can access character data
export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [character, setCharacter] = useState<Character>(INITIAL_CHARACTER); // Stores current character
  const [resetVersion, setResetVersion] = useState(0); // When reset happens, other screens detect that and reset themselves

  // Loads saved character. Runs once when the app starts.
  useEffect(() => {
    async function loadSave() {
      const savedCharacter = await loadCharacter();

      if (savedCharacter) {
        setCharacter(savedCharacter);
      }
    }

    loadSave();
  }, []);

  // Whenever character changes, progress is always saved automatically
  useEffect(() => {
    saveCharacter(character);
  }, [character]);

  // Function to replace the character state
  function updateCharacter(updatedCharacter: Character) {
    setCharacter(updatedCharacter);
  }

  // Character becomes level 1 again
  // other screens see resetVersion increase, then reset themselves
  function resetCharacter() {
    setCharacter(INITIAL_CHARACTER);
    setResetVersion((prev) => prev + 1);
  }

  // Calculates character damage.
  // ex. 1 strength = 5 damage. 5 strength = 25 damage.
  function calculateDamage() {
    return character.strength * 5;
  }

  // Caluculates character HP
  // base HP = 100
  // +20 HP per endurance
  function calculateMaxHP() {
    return 100 + character.endurance * 20;
  }

  // Exposes everything inside to the rest of the app
  // Screens can call const { character, calculateDamage } = useCharacter()
  return (
    <CharacterContext.Provider
      value={{
        character,
        updateCharacter,
        resetCharacter,
        calculateDamage,
        calculateMaxHP,
        resetVersion,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

// This is a custom hook
// Instead of writing useContext(CharacterContext), just use useCharacter()
export function useCharacter() {
  const context = useContext(CharacterContext);

  if (!context) {
    throw new Error("useCharacter must be used inside CharacterProvider");
  }

  return context;
}
