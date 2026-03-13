import React, { createContext, useContext, useEffect, useState } from "react";
import { loadCharacter, saveCharacter } from "./storage";

export type CharacterStat = "strength" | "endurance" | "speed";

export type Character = {
  level: number;
  xp: number;
  strength: number;
  endurance: number;
  speed: number;
};

export const INITIAL_CHARACTER: Character = {
  level: 1,
  xp: 0,
  strength: 1,
  endurance: 1,
  speed: 1,
};

type CharacterContextType = {
  character: Character;
  updateCharacter: (character: Character) => void;
  resetCharacter: () => void;
  calculateDamage: () => number;
  calculateMaxHP: () => number;
  resetVersion: number;
};

const CharacterContext = createContext<CharacterContextType | null>(null);

export function getXPNeededForLevel(level: number) {
  return Math.floor(100 * Math.pow(level, 1.35));
}

export function applyStatRewards(
  character: Character,
  rewards: Record<CharacterStat, number>,
) {
  let newXP = character.xp;
  let newLevel = character.level;
  let newStrength = character.strength;
  let newEndurance = character.endurance;
  let newSpeed = character.speed;
  let levelsGained = 0;

  const statOrder: CharacterStat[] = ["strength", "endurance", "speed"];

  for (const stat of statOrder) {
    const amount = rewards[stat] ?? 0;

    if (amount <= 0) continue;

    newXP += amount;

    while (newXP >= getXPNeededForLevel(newLevel)) {
      newXP -= getXPNeededForLevel(newLevel);
      newLevel += 1;
      levelsGained += 1;

      if (stat === "strength") newStrength += 2;
      if (stat === "endurance") newEndurance += 2;
      if (stat === "speed") newSpeed += 2;
    }
  }

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

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [character, setCharacter] = useState<Character>(INITIAL_CHARACTER);
  const [resetVersion, setResetVersion] = useState(0);

  useEffect(() => {
    async function loadSave() {
      const savedCharacter = await loadCharacter();

      if (savedCharacter) {
        setCharacter(savedCharacter);
      }
    }

    loadSave();
  }, []);

  useEffect(() => {
    saveCharacter(character);
  }, [character]);

  function updateCharacter(updatedCharacter: Character) {
    setCharacter(updatedCharacter);
  }

  function resetCharacter() {
    setCharacter(INITIAL_CHARACTER);
    setResetVersion((prev) => prev + 1);
  }

  function calculateDamage() {
    return character.strength * 5;
  }

  function calculateMaxHP() {
    return 100 + character.endurance * 20;
  }

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

export function useCharacter() {
  const context = useContext(CharacterContext);

  if (!context) {
    throw new Error("useCharacter must be used inside CharacterProvider");
  }

  return context;
}
