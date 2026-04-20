import { EffectAnchor, Element, SkillTier, getEffectFrames } from "./assets";
import { CharacterClassId } from "./classes";

export type SkillActivation = "basic" | "charged";
export type SkillVisualType = "anchored" | "beam";

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

export const skills: Skill[] = [
  {
    id: "mage_spark",
    classId: "mage",
    name: "Spark",
    activation: "basic",
    damageMultiplier: 1,
    unlockLevel: 1,
    visuals: [
      {
        id: "mage_spark_cast",
        type: "anchored",
        element: "lightning",
        tier: "small",
        anchor: "player",
        offsetX: 38,
        offsetY: -34,
        width: 110,
        height: 110,
        frameDurationMs: 95,
      },
      {
        id: "mage_spark_hit",
        type: "anchored",
        element: "lightning",
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
    id: "mage_arc_lance",
    classId: "mage",
    name: "Arc Lance",
    activation: "basic",
    damageMultiplier: 1.6,
    unlockLevel: 10,
    visuals: [
      {
        id: "mage_arc_lance_cast",
        type: "anchored",
        element: "lightning",
        tier: "small",
        anchor: "player",
        offsetX: 42,
        offsetY: -34,
        width: 120,
        height: 120,
        frameDurationMs: 85,
      },
      {
        id: "mage_arc_lance_beam",
        type: "beam",
        element: "lightning",
        tier: "small",
        startAnchor: "player",
        endAnchor: "boss",
        startOffsetX: 46,
        startOffsetY: -32,
        endOffsetX: -6,
        endOffsetY: -10,
        thickness: 70,
        frameDurationMs: 65,
        delayMs: 25,
        followDistance: true,
      },
    ],
  },
  {
    id: "mage_storm_lance",
    classId: "mage",
    name: "Storm Lance",
    activation: "charged",
    damageMultiplier: 4.2,
    hitsRequired: 5,
    unlockLevel: 10,
    visuals: [
      {
        id: "mage_storm_lance_cast",
        type: "anchored",
        element: "lightning",
        tier: "big",
        anchor: "player",
        offsetX: 34,
        offsetY: -32,
        width: 145,
        height: 145,
        frameDurationMs: 70,
      },
      {
        id: "mage_storm_lance_beam",
        type: "beam",
        element: "lightning",
        tier: "ultimate",
        startAnchor: "player",
        endAnchor: "boss",
        startOffsetX: 46,
        startOffsetY: -34,
        endOffsetX: -6,
        endOffsetY: -12,
        thickness: 100,
        frameDurationMs: 58,
        delayMs: 20,
        followDistance: true,
      },
      {
        id: "mage_storm_lance_hit",
        type: "anchored",
        element: "lightning",
        tier: "ultimate",
        anchor: "boss",
        offsetX: 6,
        offsetY: -22,
        width: 260,
        height: 260,
        frameDurationMs: 60,
        delayMs: 45,
      },
    ],
  },
  {
    id: "warrior_slash",
    classId: "warrior",
    name: "Slash",
    activation: "basic",
    damageMultiplier: 1.15,
    unlockLevel: 1,
    visuals: [
      {
        id: "warrior_slash_hit",
        type: "anchored",
        element: "lightning",
        tier: "small",
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
    id: "warrior_cross_cut",
    classId: "warrior",
    name: "Cross Cut",
    activation: "basic",
    damageMultiplier: 1.7,
    unlockLevel: 10,
    visuals: [
      {
        id: "warrior_cross_cut_hit_1",
        type: "anchored",
        element: "lightning",
        tier: "small",
        anchor: "boss",
        offsetX: -18,
        offsetY: 4,
        width: 190,
        height: 190,
        frameDurationMs: 75,
      },
      {
        id: "warrior_cross_cut_hit_2",
        type: "anchored",
        element: "lightning",
        tier: "small",
        anchor: "boss",
        offsetX: 12,
        offsetY: -16,
        width: 190,
        height: 190,
        frameDurationMs: 75,
        delayMs: 55,
      },
    ],
  },
  {
    id: "warrior_titan_break",
    classId: "warrior",
    name: "Titan Break",
    activation: "charged",
    damageMultiplier: 4.4,
    hitsRequired: 5,
    unlockLevel: 10,
    visuals: [
      {
        id: "warrior_titan_break_hit",
        type: "anchored",
        element: "lightning",
        tier: "ultimate",
        anchor: "boss",
        offsetX: 0,
        offsetY: -12,
        width: 250,
        height: 250,
        frameDurationMs: 62,
      },
    ],
  },
  {
    id: "archer_quick_shot",
    classId: "archer",
    name: "Quick Shot",
    activation: "basic",
    damageMultiplier: 1,
    unlockLevel: 1,
    visuals: [
      {
        id: "archer_quick_shot_beam",
        type: "beam",
        element: "lightning",
        tier: "small",
        startAnchor: "player",
        endAnchor: "boss",
        startOffsetX: 42,
        startOffsetY: -26,
        endOffsetX: -12,
        endOffsetY: -16,
        thickness: 48,
        frameDurationMs: 62,
        followDistance: true,
      },
      {
        id: "archer_quick_shot_hit",
        type: "anchored",
        element: "lightning",
        tier: "small",
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
    id: "archer_arc_shot",
    classId: "archer",
    name: "Arc Shot",
    activation: "basic",
    damageMultiplier: 1.55,
    unlockLevel: 10,
    visuals: [
      {
        id: "archer_arc_shot_beam",
        type: "beam",
        element: "lightning",
        tier: "small",
        startAnchor: "player",
        endAnchor: "boss",
        startOffsetX: 42,
        startOffsetY: -26,
        endOffsetX: 10,
        endOffsetY: -26,
        thickness: 55,
        frameDurationMs: 56,
        followDistance: true,
      },
    ],
  },
  {
    id: "archer_starfall_barrage",
    classId: "archer",
    name: "Starfall Barrage",
    activation: "charged",
    damageMultiplier: 4.1,
    hitsRequired: 5,
    unlockLevel: 10,
    visuals: [
      {
        id: "archer_starfall_beam",
        type: "beam",
        element: "lightning",
        tier: "ultimate",
        startAnchor: "player",
        endAnchor: "boss",
        startOffsetX: 42,
        startOffsetY: -24,
        endOffsetX: 18,
        endOffsetY: -24,
        thickness: 78,
        frameDurationMs: 52,
        followDistance: true,
      },
      {
        id: "archer_starfall_hit",
        type: "anchored",
        element: "lightning",
        tier: "ultimate",
        anchor: "boss",
        offsetX: 16,
        offsetY: -24,
        width: 250,
        height: 250,
        frameDurationMs: 56,
        delayMs: 35,
      },
    ],
  },
  {
    id: "thief_quick_stab",
    classId: "thief",
    name: "Quick Stab",
    activation: "basic",
    damageMultiplier: 0.95,
    unlockLevel: 1,
    visuals: [
      {
        id: "thief_quick_stab_hit",
        type: "anchored",
        element: "lightning",
        tier: "small",
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
  {
    id: "thief_blur_step",
    classId: "thief",
    name: "Blur Step",
    activation: "basic",
    damageMultiplier: 1.45,
    unlockLevel: 10,
    visuals: [
      {
        id: "thief_blur_step_hit",
        type: "anchored",
        element: "lightning",
        tier: "small",
        anchor: "boss",
        offsetX: 6,
        offsetY: 4,
        width: 190,
        height: 190,
        frameDurationMs: 62,
      },
    ],
  },
  {
    id: "thief_night_frenzy",
    classId: "thief",
    name: "Night Frenzy",
    activation: "charged",
    damageMultiplier: 3.8,
    hitsRequired: 4,
    unlockLevel: 10,
    visuals: [
      {
        id: "thief_night_frenzy_hit_1",
        type: "anchored",
        element: "lightning",
        tier: "big",
        anchor: "boss",
        offsetX: -12,
        offsetY: 10,
        width: 210,
        height: 210,
        frameDurationMs: 58,
      },
      {
        id: "thief_night_frenzy_hit_2",
        type: "anchored",
        element: "lightning",
        tier: "ultimate",
        anchor: "boss",
        offsetX: 14,
        offsetY: -8,
        width: 240,
        height: 240,
        frameDurationMs: 58,
        delayMs: 38,
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
