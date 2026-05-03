import { EffectAnchor, Element, SkillTier, getEffectFrames } from "./assets";
import { CharacterClassId } from "./classes";

export type SkillActivation = "basic" | "charged";
export type SkillVisualType = "anchored" | "beam";

// One visual piece that plays during a skill.
// A single skill can have more than one visual.
// Example:
// - a small spark at the player's hand
// - then a hit effect on the boss
export type SkillVisual = {
  id: string;
  type: SkillVisualType;
  element: Element;
  tier: SkillTier;
  delayMs?: number;
  frameDurationMs?: number;
  width?: number;
  height?: number;
  anchor?: EffectAnchor;
  offsetX?: number;
  offsetY?: number;
  startAnchor?: EffectAnchor;
  endAnchor?: EffectAnchor;
  startOffsetX?: number;
  startOffsetY?: number;
  endOffsetX?: number;
  endOffsetY?: number;
  thickness?: number;
  followDistance?: boolean;
};

// This is one skill the player can equip.
export type Skill = {
  id: string;
  classId: CharacterClassId;
  name: string;
  activation: SkillActivation;
  damageMultiplier: number;
  hitsRequired?: number;
  unlockLevel: number;
  visuals: SkillVisual[];
};

// For now, every class gets only 2 skills total.
// - 1 basic attack
// - 1 charged attack

export const skills: Skill[] = [
  {
    id: "mage_spark",
    classId: "mage",
    name: "Spark",
    activation: "basic",
    damageMultiplier: 1,
    unlockLevel: 1,
    visuals: [
      // Small cast effect near the player.
      {
        id: "mage_spark_cast",
        type: "anchored",
        element: "thunder_proc",
        tier: "small",
        anchor: "player",
        offsetX: 38,
        offsetY: -34,
        width: 110,
        height: 110,
        frameDurationMs: 95,
      },
      // Small hit effect on the boss.
      {
        id: "mage_spark_hit",
        type: "anchored",
        element: "thunder",
        tier: "small",
        anchor: "boss",
        offsetX: 0,
        offsetY: -18,
        width: 180,
        height: 180,
        frameDurationMs: 90,
        delayMs: 40,
      },
    ],
  },
  {
    id: "mage_thunder_burst",
    classId: "mage",
    name: "Thunder Burst",
    activation: "charged",
    damageMultiplier: 3,
    hitsRequired: 5,
    unlockLevel: 1,
    visuals: [
      // Charge-up effect by the player.
      {
        id: "mage_burst_cast",
        type: "anchored",
        element: "lightning",
        tier: "small",
        anchor: "player",
        offsetX: 32,
        offsetY: -28,
        width: 130,
        height: 130,
        frameDurationMs: 85,
      },
      // Traveling beam from player to boss.
      {
        id: "mage_burst_beam",
        type: "beam",
        element: "lightning",
        tier: "big",
        startAnchor: "player",
        endAnchor: "boss",
        startOffsetX: 48,
        startOffsetY: -34,
        endOffsetX: -10,
        endOffsetY: -16,
        thickness: 90,
        frameDurationMs: 70,
        delayMs: 35,
        followDistance: true,
      },
      // Big hit on the boss.
      {
        id: "mage_burst_hit",
        type: "anchored",
        element: "lightning",
        tier: "big",
        anchor: "boss",
        offsetX: 0,
        offsetY: -14,
        width: 240,
        height: 240,
        frameDurationMs: 70,
        delayMs: 55,
      },
    ],
  },
  {
    id: "axe_swing",
    classId: "warrior",
    name: "Carnage",
    activation: "basic",
    damageMultiplier: 1.15,
    unlockLevel: 1,
    visuals: [
      {
        id: "warrior_slash_hit",
        type: "anchored",
        element: "axe",
        tier: "swing",
        anchor: "boss",
        offsetX: -14,
        offsetY: 8,
        width: 170,
        height: 170,
        frameDurationMs: 80,
      },
    ],
  },
  {
    id: "warrior_power_strike",
    classId: "warrior",
    name: "Power Strike",
    activation: "charged",
    damageMultiplier: 3.25,
    hitsRequired: 5,
    unlockLevel: 1,
    visuals: [
      {
        id: "warrior_power_strike_hit",
        type: "anchored",
        element: "lightning",
        tier: "big",
        anchor: "boss",
        offsetX: -6,
        offsetY: -4,
        width: 240,
        height: 240,
        frameDurationMs: 72,
      },
    ],
  },
  {
    id: "archer_arrow_rain",
    classId: "archer",
    name: "Arrow Rain",
    activation: "basic",
    damageMultiplier: 1,
    unlockLevel: 1,
    visuals: [
      {
        id: "archer_arrow_rain",
        type: "anchored",
        element: "arrow",
        tier: "proc",
        startAnchor: "player",
        endAnchor: "boss",
        startOffsetX: 42,
        startOffsetY: -26,
        endOffsetX: -12,
        endOffsetY: -16,
        thickness: 48,
        frameDurationMs: 52,
        followDistance: true,
      },
      {
        id: "archer_quick_shot_hit",
        type: "anchored",
        element: "arrow",
        tier: "proc",
        anchor: "boss",
        offsetX: 12,
        offsetY: -18,
        width: 150,
        height: 150,
        frameDurationMs: 70,
        delayMs: 25,
      },
    ],
  },
  {
    id: "archer_piercing_volley",
    classId: "archer",
    name: "Piercing Volley",
    activation: "charged",
    damageMultiplier: 3.1,
    hitsRequired: 5,
    unlockLevel: 1,
    visuals: [
      {
        id: "archer_piercing_beam",
        type: "beam",
        element: "lightning",
        tier: "big",
        startAnchor: "player",
        endAnchor: "boss",
        startOffsetX: 42,
        startOffsetY: -28,
        endOffsetX: -8,
        endOffsetY: -16,
        thickness: 68,
        frameDurationMs: 58,
        followDistance: true,
      },
      {
        id: "archer_piercing_hit",
        type: "anchored",
        element: "lightning",
        tier: "big",
        anchor: "boss",
        offsetX: 14,
        offsetY: -18,
        width: 220,
        height: 220,
        frameDurationMs: 65,
        delayMs: 30,
      },
    ],
  },
  {
    id: "boomerang",
    classId: "thief",
    name: "Boomerang",
    activation: "basic",
    damageMultiplier: 0.95,
    unlockLevel: 1,
    visuals: [
      {
        id: "boomerang_hit",
        type: "anchored",
        element: "boomerang",
        tier: "proc",
        anchor: "boss",
        offsetX: 2,
        offsetY: 8,
        width: 160,
        height: 160,
        frameDurationMs: 70,
      },
    ],
  },
  {
    id: "thief_shadow_flurry",
    classId: "thief",
    name: "Shadow Flurry",
    activation: "charged",
    damageMultiplier: 2.9,
    hitsRequired: 4,
    unlockLevel: 1,
    visuals: [
      {
        id: "thief_shadow_flurry_hit_1",
        type: "anchored",
        element: "lightning",
        tier: "small",
        anchor: "boss",
        offsetX: -10,
        offsetY: 12,
        width: 170,
        height: 170,
        frameDurationMs: 65,
      },
      {
        id: "thief_shadow_flurry_hit_2",
        type: "anchored",
        element: "lightning",
        tier: "big",
        anchor: "boss",
        offsetX: 8,
        offsetY: -10,
        width: 210,
        height: 210,
        frameDurationMs: 65,
        delayMs: 45,
      },
    ],
  },
];

export function getSkillById(skillId: string) {
  return skills.find((skill) => skill.id === skillId) ?? null;
}

export function getSkillsForClass(classId: CharacterClassId) {
  return skills.filter((skill) => skill.classId === classId);
}

export function getUnlockedSkillsForClass(
  classId: CharacterClassId,
  level: number,
) {
  return getSkillsForClass(classId).filter(
    (skill) => level >= skill.unlockLevel,
  );
}

export function syncUnlockedSkillIds(
  classId: CharacterClassId,
  level: number,
  existingUnlockedSkillIds: string[],
) {
  const validSkillIds = new Set(
    getSkillsForClass(classId).map((skill) => skill.id),
  );
  const unlockedIds = new Set(
    existingUnlockedSkillIds.filter((skillId) => validSkillIds.has(skillId)),
  );

  for (const skill of getUnlockedSkillsForClass(classId, level)) {
    unlockedIds.add(skill.id);
  }

  return Array.from(unlockedIds);
}

export function getHighestUnlockedSkill(
  classId: CharacterClassId,
  level: number,
  activation: SkillActivation,
) {
  return (
    getUnlockedSkillsForClass(classId, level)
      .filter((skill) => skill.activation === activation)
      .sort((a, b) => b.unlockLevel - a.unlockLevel)[0] ?? null
  );
}

export function getDefaultEquippedSkillId(
  classId: CharacterClassId,
  level: number,
  activation: SkillActivation,
) {
  return getHighestUnlockedSkill(classId, level, activation)?.id ?? null;
}

export function normalizeEquippedSkills(params: {
  classId: CharacterClassId;
  level: number;
  unlockedSkillIds: string[];
  equippedBasicSkillId: string | null;
  equippedChargedSkillId: string | null;
}) {
  const unlockedSkillIds = syncUnlockedSkillIds(
    params.classId,
    params.level,
    params.unlockedSkillIds,
  );

  const isUnlockedAndMatching = (
    skillId: string | null,
    activation: SkillActivation,
  ) => {
    if (!skillId) {
      return false;
    }

    const skill = getSkillById(skillId);
    if (!skill) {
      return false;
    }

    return (
      skill.classId === params.classId &&
      skill.activation === activation &&
      unlockedSkillIds.includes(skillId)
    );
  };

  const equippedBasicSkillId = isUnlockedAndMatching(
    params.equippedBasicSkillId,
    "basic",
  )
    ? params.equippedBasicSkillId
    : getDefaultEquippedSkillId(params.classId, params.level, "basic");

  const equippedChargedSkillId = isUnlockedAndMatching(
    params.equippedChargedSkillId,
    "charged",
  )
    ? params.equippedChargedSkillId
    : getDefaultEquippedSkillId(params.classId, params.level, "charged");

  return {
    unlockedSkillIds,
    equippedBasicSkillId,
    equippedChargedSkillId,
  };
}

export function getFramesForVisual(visual: SkillVisual) {
  return getEffectFrames(visual.element, visual.tier);
}
