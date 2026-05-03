import React, { createContext, useContext, useEffect, useState } from "react";
import { CharacterClassId, DEFAULT_CLASS_ID } from "./classes";
import {
  Skill,
  SkillActivation,
  getSkillById,
  normalizeEquippedSkills,
} from "./skills";
import { loadCharacter, saveCharacter } from "./storage";

// These are the 3 stats your character can grow with workouts.
export type CharacterStat = "strength" | "endurance" | "speed";

// This is the shape of your character data.
// Think of this like the "player save file" structure.
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

// This is the very first version of the player.
// If there is no saved data yet, the game starts here.
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

// This describes everything the app can grab from the character system.
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

// This is the shared "box" where character data lives.
const CharacterContext = createContext<CharacterContextType | null>(null);

// This tells us how much XP is needed for a level.
// Higher levels need more XP.
export function getXPNeededForLevel(level: number) {
  return Math.floor(100 * Math.pow(level, 1.35));
}

// This makes sure character data is valid.
// In simple words:
// if old save data is missing something or looks weird,
// we clean it up and fill in safe defaults.
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

  // This helper makes sure equipped skills actually make sense
  // for the class, unlock level, and unlocked skill list.
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

// This applies workout rewards to the character.
// It adds XP, checks for level ups, and increases stats.
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

  // We go through rewards in this order.
  const statOrder: CharacterStat[] = ["strength", "endurance", "speed"];

  for (const stat of statOrder) {
    const amount = rewards[stat] ?? 0;

    // Skip stats with no reward.
    if (amount <= 0) {
      continue;
    }

    // Add XP from this reward.
    newXP += amount;

    // Keep leveling up while enough XP exists.
    while (newXP >= getXPNeededForLevel(newLevel)) {
      newXP -= getXPNeededForLevel(newLevel);
      newLevel += 1;
      levelsGained += 1;

      // Give stat points depending on what type of workout reward this was.
      if (stat === "strength") newStrength += 2;
      if (stat === "endurance") newEndurance += 2;
      if (stat === "speed") newSpeed += 2;
    }
  }

  // Clean up the final character so skills stay valid too.
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

// This provider wraps the app so all screens can use the same character data.
export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [character, setCharacter] = useState<Character>(INITIAL_CHARACTER);

  // This number increases when the character gets fully reset.
  // Other screens can watch this and react to it.
  const [resetVersion, setResetVersion] = useState(0);

  // When the app starts, try to load saved character data.
  useEffect(() => {
    async function loadSave() {
      const savedCharacter = await loadCharacter();

      if (savedCharacter) {
        setCharacter(normalizeCharacter(savedCharacter));
      }
    }

    loadSave();
  }, []);

  // Anytime the character changes, save it.
  useEffect(() => {
    saveCharacter(character);
  }, [character]);

  // Replace the whole character with a new one.
  function updateCharacter(updatedCharacter: Character) {
    setCharacter(normalizeCharacter(updatedCharacter));
  }

  // Full reset back to the starting character.
  function resetCharacter() {
    setCharacter(INITIAL_CHARACTER);
    setResetVersion((prev) => prev + 1);
  }

  // Change the player's class.
  // We clear old class skills so the new class starts clean.
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

  // Equip a skill into the correct slot.
  // Basic skills go into the basic slot.
  // Charged skills go into the charged slot.
  function equipSkill(skillId: string) {
    setCharacter((prev) => {
      const skill = getSkillById(skillId);

      // If the skill doesn't exist, do nothing.
      if (!skill) {
        return prev;
      }

      // Don't allow equipping skills from another class.
      if (skill.classId !== prev.classId) {
        return prev;
      }

      // Don't allow equipping a skill the player hasn't unlocked.
      if (!prev.unlockedSkillIds.includes(skill.id)) {
        return prev;
      }

      // Put the skill into the correct slot.
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

  // Get the currently equipped skill for either:
  // - "basic"
  // - "charged"
  //
  // This is the function your battle screen was crashing over.
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

  // Strength controls damage.
  // If a skill is used, multiply damage by that skill's power.
  function calculateDamage(skill?: Skill | null) {
    const baseDamage = character.strength * 5;

    if (!skill) {
      return baseDamage;
    }

    return Math.max(1, Math.floor(baseDamage * skill.damageMultiplier));
  }

  // Endurance controls max HP.
  function calculateMaxHP() {
    return 100 + character.endurance * 20;
  }

  // Speed makes attacks recover faster.
  // Lower number = faster next attack.
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

// This is the helper other files use.
// It lets them open the shared character box.
export function useCharacter() {
  const context = useContext(CharacterContext);

  if (!context) {
    throw new Error("useCharacter must be used inside CharacterProvider");
  }

  return context;
}
