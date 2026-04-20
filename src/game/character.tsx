import React, { createContext, useContext, useEffect, useState } from "react";
import { CharacterClassId, DEFAULT_CLASS_ID } from "./classes";
import {
  Skill,
  SkillActivation,
  getSkillById,
  normalizeEquippedSkills,
} from "./skills";
import { loadCharacter, saveCharacter } from "./storage";

export type CharacterStat = "strength" | "endurance" | "speed";

export type Character = {
  level: number;
  xp: number;
  strength: number;
  endurance: number;
  speed: number;
  classId: CharacterClassId;
  unlockedSkillIds: string[];
  equippedBasicSkillId: string | null;
  equippedChargedSkillId: string | null;
};

export const INITIAL_CHARACTER: Character = {
  level: 1,
  xp: 0,
  strength: 1,
  endurance: 1,
  speed: 1,
  classId: DEFAULT_CLASS_ID,
  unlockedSkillIds: ["mage_spark", "mage_thunder_burst"],
  equippedBasicSkillId: "mage_spark",
  equippedChargedSkillId: "mage_thunder_burst",
};

type CharacterContextType = {
  character: Character;
  updateCharacter: (character: Character) => void;
  resetCharacter: () => void;
  setCharacterClass: (classId: CharacterClassId) => void;
  equipSkill: (skillId: string) => void;
  getEquippedSkill: (activation: SkillActivation) => Skill | null;
  calculateDamage: (skill?: Skill | null) => number;
  calculateMaxHP: () => number;
  calculateAttackCooldownMs: (activation: SkillActivation) => number;
  resetVersion: number;
};

const CharacterContext = createContext<CharacterContextType | null>(null);

export function getXPNeededForLevel(level: number) {
  return Math.floor(100 * Math.pow(level, 1.35));
}

function normalizeCharacter(
  partialCharacter: Partial<Character> | null | undefined,
) {
  const mergedCharacter: Character = {
    ...INITIAL_CHARACTER,
    ...partialCharacter,
    classId:
      partialCharacter?.classId &&
      ["mage", "warrior", "archer", "thief"].includes(partialCharacter.classId)
        ? partialCharacter.classId
        : INITIAL_CHARACTER.classId,
    unlockedSkillIds: Array.isArray(partialCharacter?.unlockedSkillIds)
      ? partialCharacter.unlockedSkillIds
      : INITIAL_CHARACTER.unlockedSkillIds,
    equippedBasicSkillId:
      partialCharacter?.equippedBasicSkillId ??
      INITIAL_CHARACTER.equippedBasicSkillId,
    equippedChargedSkillId:
      partialCharacter?.equippedChargedSkillId ??
      INITIAL_CHARACTER.equippedChargedSkillId,
  };

  const normalizedSkills = normalizeEquippedSkills({
    classId: mergedCharacter.classId,
    level: mergedCharacter.level,
    unlockedSkillIds: mergedCharacter.unlockedSkillIds,
    equippedBasicSkillId: mergedCharacter.equippedBasicSkillId,
    equippedChargedSkillId: mergedCharacter.equippedChargedSkillId,
  });

  return {
    ...mergedCharacter,
    unlockedSkillIds: normalizedSkills.unlockedSkillIds,
    equippedBasicSkillId: normalizedSkills.equippedBasicSkillId,
    equippedChargedSkillId: normalizedSkills.equippedChargedSkillId,
  };
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

    if (amount <= 0) {
      continue;
    }

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

  const updatedCharacter = normalizeCharacter({
    ...character,
    level: newLevel,
    xp: newXP,
    strength: newStrength,
    endurance: newEndurance,
    speed: newSpeed,
  });

  return {
    character: updatedCharacter,
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
        setCharacter(normalizeCharacter(savedCharacter));
      }
    }

    loadSave();
  }, []);

  useEffect(() => {
    saveCharacter(character);
  }, [character]);

  function updateCharacter(updatedCharacter: Character) {
    setCharacter(normalizeCharacter(updatedCharacter));
  }

  function resetCharacter() {
    setCharacter(INITIAL_CHARACTER);
    setResetVersion((prev) => prev + 1);
  }

  function setCharacterClass(classId: CharacterClassId) {
    setCharacter((prev) =>
      normalizeCharacter({
        ...prev,
        classId,
        unlockedSkillIds: [],
        equippedBasicSkillId: null,
        equippedChargedSkillId: null,
      }),
    );
  }

  function equipSkill(skillId: string) {
    setCharacter((prev) => {
      const skill = getSkillById(skillId);

      if (!skill) {
        return prev;
      }

      if (skill.classId !== prev.classId) {
        return prev;
      }

      if (!prev.unlockedSkillIds.includes(skill.id)) {
        return prev;
      }

      if (skill.activation === "basic") {
        return normalizeCharacter({
          ...prev,
          equippedBasicSkillId: skill.id,
        });
      }

      return normalizeCharacter({
        ...prev,
        equippedChargedSkillId: skill.id,
      });
    });
  }

  function getEquippedSkill(activation: SkillActivation) {
    const skillId =
      activation === "basic"
        ? character.equippedBasicSkillId
        : character.equippedChargedSkillId;

    if (!skillId) {
      return null;
    }

    return getSkillById(skillId);
  }

  function calculateDamage(skill?: Skill | null) {
    const baseDamage = character.strength * 5;

    if (!skill) {
      return baseDamage;
    }

    return Math.max(1, Math.floor(baseDamage * skill.damageMultiplier));
  }

  function calculateMaxHP() {
    return 100 + character.endurance * 20;
  }

  function calculateAttackCooldownMs(activation: SkillActivation) {
    const baseCooldown = activation === "basic" ? 650 : 1100;
    const speedReduction = Math.min(
      character.speed * 18,
      activation === "basic" ? 320 : 420,
    );

    return Math.max(
      activation === "basic" ? 220 : 420,
      baseCooldown - speedReduction,
    );
  }

  return (
    <CharacterContext.Provider
      value={{
        character,
        updateCharacter,
        resetCharacter,
        setCharacterClass,
        equipSkill,
        getEquippedSkill,
        calculateDamage,
        calculateMaxHP,
        calculateAttackCooldownMs,
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
