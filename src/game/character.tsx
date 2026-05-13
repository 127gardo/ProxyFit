import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { DEFAULT_CLASS_ID } from "./classes";
import { loadCloudCharacter, saveCloudCharacter } from "./cloudSave";
import { ExerciseStat } from "./exercises";
import {
  ECONOMY,
  STAT_KEYS,
  STAT_UPGRADE_RULES,
  addStatMaps,
  createEmptyStatMap,
  getNextStatUpgradeCost,
} from "./gameConfig";
import {
  Skill,
  SkillActivation,
  getSkillById,
  normalizeEquippedSkills,
} from "./skills";
import {
  SPOTTERS,
  SpotterId,
  getRandomSpotter,
  getSpotterById,
} from "./spotters";
import { loadCharacter, saveCharacter } from "./storage";

export type CharacterStat = ExerciseStat;
export type StatMap = Record<CharacterStat, number>;

export type OwnedSpotter = {
  id: SpotterId;

  /*
    These are the user's upgrades on top of the Spotter's base stats.

    Example:
    Rook base strength = 45
    allocatedStats.strength = 3
    final Rook strength = 48
  */
  allocatedStats: StatMap;

  /*
    Each character/Spotter gets one free stat reset.
    After that, resets cost Spotter Points.
  */
  hasUsedFreeReset: boolean;
};

export type RollResult = {
  spotterId: SpotterId;
  spotterName: string;
  isDuplicate: boolean;
  refundAmount: number;
};

export type Character = {
  level: number;
  xp: number;

  /*
    These are the final visible main-character stats.
    They are calculated from mainBaseStats + mainAllocatedStats.
  */
  strength: number;
  endurance: number;
  speed: number;

  /*
    classId is still kept internally because your sprite system currently uses it.
    The Character screen no longer exposes class switching.
    For now, the main character uses DEFAULT_CLASS_ID, which is warrior.
  */
  classId: typeof DEFAULT_CLASS_ID;

  /*
    Main character move system.
    No class restrictions anymore. The main character can equip any unlocked move.
  */
  unlockedSkillIds: string[];
  equippedBasicSkillId: string | null;
  equippedChargedSkillId: string | null;

  /*
    Game economy.
  */
  spotterPoints: number;
  statPoints: StatMap;

  /*
    Main character upgrade tracking.
  */
  mainBaseStats: StatMap;
  mainAllocatedStats: StatMap;
  mainHasUsedFreeReset: boolean;

  /*
    Spotter collection.
  */
  ownedSpotters: OwnedSpotter[];
  activeSpotterId: SpotterId | null;

  /*
    Used to award the first-workout-of-the-day Spotter Point bonus.
  */
  lastDailyWorkoutSpotterRewardDate: string | null;
};

export const INITIAL_CHARACTER: Character = {
  level: 1,
  xp: 0,

  strength: 1,
  endurance: 1,
  speed: 1,

  classId: DEFAULT_CLASS_ID,

  /*
    Starting as warrior-style main character.
    You can change these defaults later if you want the starter move to be
    something else.
  */
  unlockedSkillIds: ["axe_swing", "warrior_power_strike"],
  equippedBasicSkillId: "axe_swing",
  equippedChargedSkillId: "warrior_power_strike",

  spotterPoints: 0,
  statPoints: createEmptyStatMap(),

  mainBaseStats: {
    strength: 1,
    endurance: 1,
    speed: 1,
  },
  mainAllocatedStats: createEmptyStatMap(),
  mainHasUsedFreeReset: false,

  ownedSpotters: [],
  activeSpotterId: null,

  lastDailyWorkoutSpotterRewardDate: null,
};

type StatUpgradeTarget =
  | { type: "main" }
  | { type: "spotter"; spotterId: SpotterId };

type CharacterContextType = {
  character: Character;
  updateCharacter: (character: Character) => void;
  resetCharacter: () => void;

  equipSkill: (skillId: string) => void;
  getEquippedSkill: (activation: SkillActivation) => Skill | null;

  calculateDamage: (skill?: Skill | null) => number;
  calculateMaxHP: () => number;
  calculateAttackCooldownMs: (activation: SkillActivation) => number;

  awardWorkoutRewards: (rewards: StatMap) => {
    levelsGained: number;
    totalXpGained: number;
    spotterPointsGained: number;
    statPointsGained: StatMap;
  };

  awardSpotterPoints: (amount: number) => void;

  upgradeStat: (target: StatUpgradeTarget, stat: CharacterStat) => boolean;
  resetAllocatedStats: (target: StatUpgradeTarget) => boolean;

  rollSpotter: () => RollResult | null;
  rollTenSpotters: () => RollResult[];
  buySpotter: (spotterId: SpotterId) => RollResult | null;

  setActiveSpotter: (spotterId: SpotterId | null) => void;
  getActiveSpotter: () => OwnedSpotter | null;
  getTotalStatsForSpotter: (spotterId: SpotterId) => StatMap | null;

  resetVersion: number;
};

const CharacterContext = createContext<CharacterContextType | null>(null);

export function getXPNeededForLevel(level: number) {
  return Math.floor(100 * Math.pow(level, 1.35));
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function calculateVisibleMainStats(character: Character) {
  const totalStats = addStatMaps(
    character.mainBaseStats,
    character.mainAllocatedStats,
  );

  return {
    ...character,
    strength: totalStats.strength,
    endurance: totalStats.endurance,
    speed: totalStats.speed,
  };
}

function normalizeOwnedSpotter(spotter: Partial<OwnedSpotter>): OwnedSpotter {
  return {
    id: spotter.id as SpotterId,
    allocatedStats: {
      ...createEmptyStatMap(),
      ...(spotter.allocatedStats ?? {}),
    },
    hasUsedFreeReset: spotter.hasUsedFreeReset ?? false,
  };
}

/*
  Normalization protects the app from old save data.

  During development, you will add/remove fields often.
  This function fills in missing fields so old saves do not crash the app.
*/
function normalizeCharacter(
  partialCharacter: Partial<Character> | null | undefined,
) {
  const mergedCharacter: Character = {
    ...INITIAL_CHARACTER,
    ...partialCharacter,

    /*
      No visible class switching anymore.
      Keep the main character as warrior for now.
    */
    classId: DEFAULT_CLASS_ID,

    unlockedSkillIds: Array.isArray(partialCharacter?.unlockedSkillIds)
      ? partialCharacter.unlockedSkillIds
      : INITIAL_CHARACTER.unlockedSkillIds,

    equippedBasicSkillId:
      partialCharacter?.equippedBasicSkillId ??
      INITIAL_CHARACTER.equippedBasicSkillId,

    equippedChargedSkillId:
      partialCharacter?.equippedChargedSkillId ??
      INITIAL_CHARACTER.equippedChargedSkillId,

    spotterPoints: partialCharacter?.spotterPoints ?? 0,

    statPoints: {
      ...createEmptyStatMap(),
      ...(partialCharacter?.statPoints ?? {}),
    },

    mainBaseStats: {
      strength: partialCharacter?.mainBaseStats?.strength ?? 1,
      endurance: partialCharacter?.mainBaseStats?.endurance ?? 1,
      speed: partialCharacter?.mainBaseStats?.speed ?? 1,
    },

    mainAllocatedStats: {
      ...createEmptyStatMap(),
      ...(partialCharacter?.mainAllocatedStats ?? {}),
    },

    mainHasUsedFreeReset: partialCharacter?.mainHasUsedFreeReset ?? false,

    ownedSpotters: Array.isArray(partialCharacter?.ownedSpotters)
      ? partialCharacter.ownedSpotters
          .filter((spotter) => Boolean(getSpotterById(spotter.id)))
          .map(normalizeOwnedSpotter)
      : [],

    activeSpotterId:
      partialCharacter?.activeSpotterId &&
      getSpotterById(partialCharacter.activeSpotterId)
        ? partialCharacter.activeSpotterId
        : null,

    lastDailyWorkoutSpotterRewardDate:
      partialCharacter?.lastDailyWorkoutSpotterRewardDate ?? null,
  };

  const normalizedSkills = normalizeEquippedSkills({
    level: mergedCharacter.level,
    unlockedSkillIds: mergedCharacter.unlockedSkillIds,
    equippedBasicSkillId: mergedCharacter.equippedBasicSkillId,
    equippedChargedSkillId: mergedCharacter.equippedChargedSkillId,
  });

  return calculateVisibleMainStats({
    ...mergedCharacter,
    unlockedSkillIds: normalizedSkills.unlockedSkillIds,
    equippedBasicSkillId: normalizedSkills.equippedBasicSkillId,
    equippedChargedSkillId: normalizedSkills.equippedChargedSkillId,
  });
}

export function applyStatRewards(
  character: Character,
  rewards: Record<CharacterStat, number>,
) {
  let newXP = character.xp;
  let newLevel = character.level;
  let levelsGained = 0;

  for (const stat of STAT_KEYS) {
    const amount = rewards[stat] ?? 0;

    if (amount <= 0) {
      continue;
    }

    newXP += amount;

    while (newXP >= getXPNeededForLevel(newLevel)) {
      newXP -= getXPNeededForLevel(newLevel);
      newLevel += 1;
      levelsGained += 1;
    }
  }

  const updatedCharacter = normalizeCharacter({
    ...character,
    level: newLevel,
    xp: newXP,
    statPoints: addStatMaps(character.statPoints, rewards),
  });

  return {
    character: updatedCharacter,
    levelsGained,
    totalXpGained:
      (rewards.strength ?? 0) + (rewards.endurance ?? 0) + (rewards.speed ?? 0),
  };
}

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [character, setCharacter] = useState<Character>(INITIAL_CHARACTER);
  const [resetVersion, setResetVersion] = useState(0);
  const [hasLoadedForUser, setHasLoadedForUser] = useState(false);

  useEffect(() => {
    async function loadSaveForCurrentUser() {
      if (!user?.id) {
        setCharacter(INITIAL_CHARACTER);
        setHasLoadedForUser(false);
        return;
      }

      setHasLoadedForUser(false);
      setCharacter(INITIAL_CHARACTER);

      const localCharacter = await loadCharacter(user.id);

      if (localCharacter) {
        setCharacter(normalizeCharacter(localCharacter));
      }

      const cloudCharacter = await loadCloudCharacter(user.id);

      if (cloudCharacter) {
        const normalizedCloudCharacter = normalizeCharacter(cloudCharacter);
        setCharacter(normalizedCloudCharacter);
        await saveCharacter(normalizedCloudCharacter, user.id);
      } else if (localCharacter) {
        await saveCloudCharacter(user.id, normalizeCharacter(localCharacter));
      }

      setHasLoadedForUser(true);
    }

    loadSaveForCurrentUser();
  }, [user?.id]);

  useEffect(() => {
    async function saveCurrentCharacter() {
      if (!user?.id || !hasLoadedForUser) {
        return;
      }

      await saveCharacter(character, user.id);
      await saveCloudCharacter(user.id, character);
    }

    saveCurrentCharacter();
  }, [character, user?.id, hasLoadedForUser]);

  function updateCharacter(updatedCharacter: Character) {
    setCharacter(normalizeCharacter(updatedCharacter));
  }

  function resetCharacter() {
    setCharacter(INITIAL_CHARACTER);
    setResetVersion((prev) => prev + 1);
  }

  function equipSkill(skillId: string) {
    setCharacter((prev) => {
      const skill = getSkillById(skillId);

      if (!skill) {
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

  function awardWorkoutRewards(rewards: StatMap) {
    let result = {
      levelsGained: 0,
      totalXpGained: 0,
      spotterPointsGained: 0,
      statPointsGained: rewards,
    };

    setCharacter((prev) => {
      const applied = applyStatRewards(prev, rewards);
      const todayKey = getTodayKey();

      const shouldAwardDailySpotterPoints =
        prev.lastDailyWorkoutSpotterRewardDate !== todayKey;

      const spotterPointsGained = shouldAwardDailySpotterPoints
        ? ECONOMY.dailyFirstWorkoutSpotterPoints
        : 0;

      result = {
        levelsGained: applied.levelsGained,
        totalXpGained: applied.totalXpGained,
        spotterPointsGained,
        statPointsGained: rewards,
      };

      return normalizeCharacter({
        ...applied.character,
        spotterPoints: applied.character.spotterPoints + spotterPointsGained,
        lastDailyWorkoutSpotterRewardDate: shouldAwardDailySpotterPoints
          ? todayKey
          : applied.character.lastDailyWorkoutSpotterRewardDate,
      });
    });

    return result;
  }

  function awardSpotterPoints(amount: number) {
    setCharacter((prev) =>
      normalizeCharacter({
        ...prev,
        spotterPoints: prev.spotterPoints + amount,
      }),
    );
  }

  function upgradeStat(target: StatUpgradeTarget, stat: CharacterStat) {
    let didUpgrade = false;

    setCharacter((prev) => {
      if (target.type === "main") {
        const currentAllocated = prev.mainAllocatedStats[stat];
        const maxAllocated =
          STAT_UPGRADE_RULES.mainCharacterMaxAllocatedPointsPerStat;
        const cost = getNextStatUpgradeCost(currentAllocated);

        if (currentAllocated >= maxAllocated || prev.statPoints[stat] < cost) {
          return prev;
        }

        didUpgrade = true;

        return normalizeCharacter({
          ...prev,
          statPoints: {
            ...prev.statPoints,
            [stat]: prev.statPoints[stat] - cost,
          },
          mainAllocatedStats: {
            ...prev.mainAllocatedStats,
            [stat]: currentAllocated + STAT_UPGRADE_RULES.statGainPerUpgrade,
          },
        });
      }

      const spotter = prev.ownedSpotters.find(
        (ownedSpotter) => ownedSpotter.id === target.spotterId,
      );

      if (!spotter) {
        return prev;
      }

      const currentAllocated = spotter.allocatedStats[stat];
      const maxAllocated = STAT_UPGRADE_RULES.spotterMaxAllocatedPointsPerStat;
      const cost = getNextStatUpgradeCost(currentAllocated);

      if (currentAllocated >= maxAllocated || prev.statPoints[stat] < cost) {
        return prev;
      }

      didUpgrade = true;

      return normalizeCharacter({
        ...prev,
        statPoints: {
          ...prev.statPoints,
          [stat]: prev.statPoints[stat] - cost,
        },
        ownedSpotters: prev.ownedSpotters.map((ownedSpotter) =>
          ownedSpotter.id === target.spotterId
            ? {
                ...ownedSpotter,
                allocatedStats: {
                  ...ownedSpotter.allocatedStats,
                  [stat]:
                    currentAllocated + STAT_UPGRADE_RULES.statGainPerUpgrade,
                },
              }
            : ownedSpotter,
        ),
      });
    });

    return didUpgrade;
  }

  function resetAllocatedStats(target: StatUpgradeTarget) {
    let didReset = false;

    setCharacter((prev) => {
      if (target.type === "main") {
        const resetCost = prev.mainHasUsedFreeReset
          ? ECONOMY.paidStatResetCost
          : 0;

        if (prev.spotterPoints < resetCost) {
          return prev;
        }

        didReset = true;

        return normalizeCharacter({
          ...prev,
          spotterPoints: prev.spotterPoints - resetCost,
          mainAllocatedStats: createEmptyStatMap(),
          mainHasUsedFreeReset: true,
        });
      }

      const spotter = prev.ownedSpotters.find(
        (ownedSpotter) => ownedSpotter.id === target.spotterId,
      );

      if (!spotter) {
        return prev;
      }

      const resetCost = spotter.hasUsedFreeReset
        ? ECONOMY.paidStatResetCost
        : 0;

      if (prev.spotterPoints < resetCost) {
        return prev;
      }

      didReset = true;

      return normalizeCharacter({
        ...prev,
        spotterPoints: prev.spotterPoints - resetCost,
        ownedSpotters: prev.ownedSpotters.map((ownedSpotter) =>
          ownedSpotter.id === target.spotterId
            ? {
                ...ownedSpotter,
                allocatedStats: createEmptyStatMap(),
                hasUsedFreeReset: true,
              }
            : ownedSpotter,
        ),
      });
    });

    return didReset;
  }

  function createRollResult(
    currentCharacter: Character,
    spotterId: SpotterId,
  ): RollResult {
    const spotter = getSpotterById(spotterId);
    const isDuplicate = currentCharacter.ownedSpotters.some(
      (ownedSpotter) => ownedSpotter.id === spotterId,
    );

    return {
      spotterId,
      spotterName: spotter?.name ?? spotterId,
      isDuplicate,
      refundAmount: isDuplicate ? ECONOMY.duplicateSpotterPointRefund : 0,
    };
  }

  function addSpotterToCollection(
    currentCharacter: Character,
    spotterId: SpotterId,
  ) {
    const alreadyOwned = currentCharacter.ownedSpotters.some(
      (ownedSpotter) => ownedSpotter.id === spotterId,
    );

    if (alreadyOwned) {
      return normalizeCharacter({
        ...currentCharacter,
        spotterPoints:
          currentCharacter.spotterPoints + ECONOMY.duplicateSpotterPointRefund,
      });
    }

    return normalizeCharacter({
      ...currentCharacter,
      ownedSpotters: [
        ...currentCharacter.ownedSpotters,
        {
          id: spotterId,
          allocatedStats: createEmptyStatMap(),
          hasUsedFreeReset: false,
        },
      ],
      activeSpotterId: currentCharacter.activeSpotterId ?? spotterId,
    });
  }

  function rollSpotter() {
    let rollResult: RollResult | null = null;

    setCharacter((prev) => {
      if (prev.spotterPoints < ECONOMY.singleSpotterRollCost) {
        return prev;
      }

      const rolledSpotter = getRandomSpotter();

      rollResult = createRollResult(prev, rolledSpotter.id);

      return addSpotterToCollection(
        {
          ...prev,
          spotterPoints: prev.spotterPoints - ECONOMY.singleSpotterRollCost,
        },
        rolledSpotter.id,
      );
    });

    return rollResult;
  }

  function rollTenSpotters() {
    const results: RollResult[] = [];

    setCharacter((prev) => {
      if (prev.spotterPoints < ECONOMY.tenSpotterRollCost) {
        return prev;
      }

      let nextCharacter = normalizeCharacter({
        ...prev,
        spotterPoints: prev.spotterPoints - ECONOMY.tenSpotterRollCost,
      });

      for (let i = 0; i < 10; i += 1) {
        const rolledSpotter = getRandomSpotter();
        const rollResult = createRollResult(nextCharacter, rolledSpotter.id);

        results.push(rollResult);
        nextCharacter = addSpotterToCollection(nextCharacter, rolledSpotter.id);
      }

      return nextCharacter;
    });

    return results;
  }

  function buySpotter(spotterId: SpotterId) {
    let result: RollResult | null = null;

    setCharacter((prev) => {
      const spotterExists = SPOTTERS.some(
        (spotter) => spotter.id === spotterId,
      );

      if (!spotterExists || prev.spotterPoints < ECONOMY.directSpotterBuyCost) {
        return prev;
      }

      result = createRollResult(prev, spotterId);

      return addSpotterToCollection(
        {
          ...prev,
          spotterPoints: prev.spotterPoints - ECONOMY.directSpotterBuyCost,
        },
        spotterId,
      );
    });

    return result;
  }

  function setActiveSpotter(spotterId: SpotterId | null) {
    setCharacter((prev) => {
      if (spotterId === null) {
        return normalizeCharacter({
          ...prev,
          activeSpotterId: null,
        });
      }

      const ownsSpotter = prev.ownedSpotters.some(
        (ownedSpotter) => ownedSpotter.id === spotterId,
      );

      if (!ownsSpotter) {
        return prev;
      }

      return normalizeCharacter({
        ...prev,
        activeSpotterId: spotterId,
      });
    });
  }

  function getActiveSpotter() {
    if (!character.activeSpotterId) {
      return null;
    }

    return (
      character.ownedSpotters.find(
        (ownedSpotter) => ownedSpotter.id === character.activeSpotterId,
      ) ?? null
    );
  }

  function getTotalStatsForSpotter(spotterId: SpotterId) {
    const ownedSpotter = character.ownedSpotters.find(
      (spotter) => spotter.id === spotterId,
    );

    const spotterDefinition = getSpotterById(spotterId);

    if (!ownedSpotter || !spotterDefinition) {
      return null;
    }

    return addStatMaps(
      spotterDefinition.baseStats,
      ownedSpotter.allocatedStats,
    );
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

        equipSkill,
        getEquippedSkill,

        calculateDamage,
        calculateMaxHP,
        calculateAttackCooldownMs,

        awardWorkoutRewards,
        awardSpotterPoints,

        upgradeStat,
        resetAllocatedStats,

        rollSpotter,
        rollTenSpotters,
        buySpotter,

        setActiveSpotter,
        getActiveSpotter,
        getTotalStatsForSpotter,

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
