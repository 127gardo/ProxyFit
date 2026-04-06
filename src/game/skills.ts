// src/game/skills.ts
//
// This file defines battle skills in a scalable, data-driven way.
// Adding a future skill should mostly mean:
// 1) adding frames in assets.ts
// 2) adding one new skill object here
//
// battle.tsx then just reads this data.

import { EffectAnchor, Element, SkillTier, getEffectFrames } from "./assets";

export type SkillActivation = "basic" | "charged";

export type Skill = {
  id: string;
  name: string;

  // Which family/type the skill belongs to.
  element: Element;
  tier: SkillTier;

  // Basic attack vs charged skill.
  activation: SkillActivation;

  // Used to scale final damage.
  damageMultiplier: number;

  // Only matters for charged skills.
  hitsRequired?: number;

  // Where the effect should be drawn.
  effectAnchor: EffectAnchor;

  // Fixed offsets relative to the chosen anchor.
  offsetX: number;
  offsetY: number;

  // Size of the effect image box.
  width: number;
  height: number;

  // How fast the frame animation should advance.
  frameDurationMs: number;

  // Progression support later.
  unlockLevel: number;
};

export const skills: Skill[] = [
  {
    id: "lightning_basic",
    name: "Spark",
    element: "lightning",
    tier: "small",
    activation: "basic",
    damageMultiplier: 1,
    effectAnchor: "boss",
    offsetX: 0,
    offsetY: 0,
    width: 180,
    height: 180,
    frameDurationMs: 150,
    unlockLevel: 1,
  },
  {
    id: "lightning_big",
    name: "Thunder Burst",
    element: "lightning",
    tier: "big",
    activation: "charged",
    damageMultiplier: 3,
    hitsRequired: 5,
    effectAnchor: "boss",
    offsetX: 0,
    offsetY: -10,
    width: 220,
    height: 220,
    frameDurationMs: 70,
    unlockLevel: 1,
  },
];

export function getFramesForSkill(skill: Skill) {
  return getEffectFrames(skill.element, skill.tier);
}

export function getBasicSkill() {
  return skills.find((skill) => skill.activation === "basic") ?? null;
}

export function getChargedSkill() {
  return skills.find((skill) => skill.activation === "charged") ?? null;
}
