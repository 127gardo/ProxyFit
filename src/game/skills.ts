import { EffectAnchor, Element, SkillTier, getEffectFrames } from "./assets";

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

export type SkillDamageEvent = {
  /*
    Per-skill damage timing.

    delayMs controls when this damage number and HP reduction happen after the
    skill starts. This lets a thunder animation show one hit on the first bolt
    and a second hit on the second bolt instead of every skill using the same
    instant damage timing.

    percent controls how much of the skill's total damage is assigned to this
    event. For example, two events with 0.5 and 0.5 split the skill into two
    equal hits. A single event with percent: 1 keeps the skill as one hit.
  */
  delayMs: number;
  percent: number;
};

/*
  Skills are now a shared move pool.

  Main character:
  - Can equip any unlocked basic move.
  - Can equip any unlocked charged move.
  - No class restriction anymore.

  Spotters:
  - Use fixed move IDs from spotters.ts.
*/
export type Skill = {
  id: string;
  name: string;
  activation: SkillActivation;
  damageMultiplier: number;
  hitsRequired?: number;
  unlockLevel: number;
  visuals: SkillVisual[];

  /*
    Optional. If omitted, the battle screen uses one damage event at delay 0.
    Add this only when a skill needs custom hit timing or multiple damage ticks.
  */
  damageEvents?: SkillDamageEvent[];
};

export const skills: Skill[] = [
  {
    id: "axe_swing",
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
    id: "mage_spark",
    name: "Spark",
    activation: "basic",
    damageMultiplier: 1,
    unlockLevel: 1,
    damageEvents: [
      { delayMs: 550, percent: 0.4 },
      { delayMs: 600, percent: 0.6 },
    ],
    visuals: [
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
    name: "Thunder Burst",
    activation: "charged",
    damageMultiplier: 3,
    hitsRequired: 5,
    unlockLevel: 1,
    damageEvents: [
      { delayMs: 260, percent: 0.5 },
      { delayMs: 620, percent: 0.5 },
    ],
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
    id: "archer_arrow_rain",
    name: "Arrow Rain",
    activation: "basic",
    damageMultiplier: 1,
    unlockLevel: 1,
    visuals: [
      {
        id: "archer_arrow_rain_beam",
        type: "beam",
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
    name: "Shadow Flurry",
    activation: "charged",
    damageMultiplier: 2.9,
    hitsRequired: 4,
    unlockLevel: 1,
    damageEvents: [
      { delayMs: 120, percent: 0.45 },
      { delayMs: 360, percent: 0.55 },
    ],
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
    id: "hammer",
    name: "Hammer",
    activation: "basic",
    damageMultiplier: 1.15,
    unlockLevel: 1,
    visuals: [
      {
        id: "hammer_hit",
        type: "anchored",
        element: "hammer",
        tier: "hammer",
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
    id: "mana",
    name: "Mana",
    activation: "basic",
    damageMultiplier: 5.15,
    unlockLevel: 1,
    damageEvents: [{ delayMs: 520, percent: 1 }],
    visuals: [
      {
        id: "mana_hit",
        type: "anchored",
        element: "mana",
        tier: "mana",
        anchor: "player",
        offsetX: 40,
        offsetY: -30,
        width: 570,
        height: 170,
        frameDurationMs: 100,
      },
    ],
  },
];

export function getSkillById(skillId: string) {
  return skills.find((skill) => skill.id === skillId) ?? null;
}

export function getUnlockedSkills(level: number) {
  return skills.filter((skill) => level >= skill.unlockLevel);
}

export function getUnlockedSkillsByActivation(
  level: number,
  activation: SkillActivation,
) {
  return getUnlockedSkills(level).filter(
    (skill) => skill.activation === activation,
  );
}

export function syncUnlockedSkillIds(
  level: number,
  existingUnlockedSkillIds: string[],
) {
  const validSkillIds = new Set(skills.map((skill) => skill.id));

  const unlockedIds = new Set(
    existingUnlockedSkillIds.filter((skillId) => validSkillIds.has(skillId)),
  );

  for (const skill of getUnlockedSkills(level)) {
    unlockedIds.add(skill.id);
  }

  return Array.from(unlockedIds);
}

export function getDefaultEquippedSkillId(
  level: number,
  activation: SkillActivation,
) {
  return (
    getUnlockedSkillsByActivation(level, activation).sort(
      (a, b) => b.unlockLevel - a.unlockLevel,
    )[0]?.id ?? null
  );
}

export function normalizeEquippedSkills(params: {
  level: number;
  unlockedSkillIds: string[];
  equippedBasicSkillId: string | null;
  equippedChargedSkillId: string | null;
}) {
  const unlockedSkillIds = syncUnlockedSkillIds(
    params.level,
    params.unlockedSkillIds,
  );

  function isUnlockedAndMatching(
    skillId: string | null,
    activation: SkillActivation,
  ) {
    if (!skillId) {
      return false;
    }

    const skill = getSkillById(skillId);

    return (
      Boolean(skill) &&
      skill?.activation === activation &&
      unlockedSkillIds.includes(skillId)
    );
  }

  return {
    unlockedSkillIds,
    equippedBasicSkillId: isUnlockedAndMatching(
      params.equippedBasicSkillId,
      "basic",
    )
      ? params.equippedBasicSkillId
      : getDefaultEquippedSkillId(params.level, "basic"),
    equippedChargedSkillId: isUnlockedAndMatching(
      params.equippedChargedSkillId,
      "charged",
    )
      ? params.equippedChargedSkillId
      : getDefaultEquippedSkillId(params.level, "charged"),
  };
}

export function getFramesForVisual(visual: SkillVisual) {
  return getEffectFrames(visual.element, visual.tier);
}
