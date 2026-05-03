import { ImageSourcePropType } from "react-native";
import { CharacterClassId } from "./classes";

export type Element =
  | "lightning"
  | "fire"
  | "ice"
  | "thunder"
  | "thunder_proc"
  | "axe"
  | "arrow"
  | "arrowRain"
  | "boomerang";
export type SkillTier =
  | "small"
  | "big"
  | "ultimate"
  | "swing"
  | "proc"
  | "arrowRain";
export type EffectAnchor = "player" | "boss" | "screen";

export type AnimationFrames = ImageSourcePropType[];

export type CharacterSpriteSet = {
  idle: AnimationFrames;
  attack: AnimationFrames;
};

type EffectLibrary = Partial<
  Record<Element, Partial<Record<SkillTier, AnimationFrames>>>
>;

const defaultCharacterFrame = require("../../assets/sprites/character.png");
const mageCharacterSprite = require("../../assets/sprites/mageSprite.png");
const thiefCharacterSprite = require("../../assets/sprites/thiefSprite.png");
const warriorCharacterSprite = require("../../assets/sprites/warriorSprite.png");
const archerCharacterSprite = require("../../assets/sprites/archerSprite.png");

// Character sprites.
// For now every class uses the same placeholder image.
export const classSprites: Record<CharacterClassId, CharacterSpriteSet> = {
  mage: {
    idle: [mageCharacterSprite],
    attack: [mageCharacterSprite],
  },
  warrior: {
    idle: [warriorCharacterSprite],
    attack: [warriorCharacterSprite],
  },
  archer: {
    idle: [archerCharacterSprite],
    attack: [archerCharacterSprite],
  },
  thief: {
    idle: [thiefCharacterSprite],
    attack: [thiefCharacterSprite],
  },
};

export const sprites = {
  bosses: {
    boss1: require("../../assets/sprites/boss1.png"),
    boss2: require("../../assets/sprites/boss2.png"),
    boss3: require("../../assets/sprites/boss3.png"),
  },
};

// Skill effect animations.
// This file is where you plug in your PNG frames.
//
// Example mental model:
// effectAnimations.lightning.small = [frame1, frame2, frame3]
//
// Then in skills.ts, a skill visual says:
// - element: "lightning"
// - tier: "small"
//
// That tells the battle screen which frame list to play.
export const effectAnimations: EffectLibrary = {
  lightning: {
    small: [
      require("../../assets/effects/skills/lightnining_small_0.png"),
      require("../../assets/effects/skills/lightnining_small_1.png"),
      require("../../assets/effects/skills/lightnining_small_2.png"),
      require("../../assets/effects/skills/lightnining_small_3.png"),
    ],
    big: [
      require("../../assets/effects/skills/lightnining_big_0.png"),
      require("../../assets/effects/skills/lightnining_big_1.png"),
      require("../../assets/effects/skills/lightnining_big_2.png"),
      require("../../assets/effects/skills/lightnining_big_3.png"),
    ],
    ultimate: [
      require("../../assets/effects/skills/lightnining_big_0.png"),
      require("../../assets/effects/skills/lightnining_big_1.png"),
      require("../../assets/effects/skills/lightnining_big_2.png"),
      require("../../assets/effects/skills/lightnining_big_3.png"),
    ],
  },
  thunder: {
    small: [
      require("../../assets/effects/skills/thunder1.png"),
      require("../../assets/effects/skills/thunder2.png"),
      require("../../assets/effects/skills/thunder3.png"),
      require("../../assets/effects/skills/thunder4.png"),
      require("../../assets/effects/skills/thunder5.png"),
      require("../../assets/effects/skills/thunder6.png"),
      require("../../assets/effects/skills/thunder7.png"),
      require("../../assets/effects/skills/thunder8.png"),
      require("../../assets/effects/skills/thunder9.png"),
    ],
  },
  thunder_proc: {
    small: [
      require("../../assets/effects/skills/thunder_proc1.png"),
      require("../../assets/effects/skills/thunder_proc2.png"),
      ,
    ],
  },
  axe: {
    swing: [
      require("../../assets/effects/skills/axeswing1.png"),
      require("../../assets/effects/skills/axeswing2.png"),
      require("../../assets/effects/skills/axeswing3.png"),
      require("../../assets/effects/skills/axeswing4.png"),
      require("../../assets/effects/skills/axeswing5.png"),
    ],
  },
  arrow: {
    arrowRain: [
      require("../../assets/effects/skills/arrowrain1.png"),
      require("../../assets/effects/skills/arrowrain2.png"),
      require("../../assets/effects/skills/arrowrain3.png"),
      require("../../assets/effects/skills/arrowrain4.png"),
    ],
    proc: [
      require("../../assets/effects/skills/arrowproc1.png"),
      require("../../assets/effects/skills/arrowproc2.png"),
      require("../../assets/effects/skills/arrowproc3.png"),
      require("../../assets/effects/skills/arrowproc4.png"),
    ],
  },
  boomerang: {
    proc: [
      require("../../assets/effects/skills/boomerang1.png"),
      require("../../assets/effects/skills/boomerang2.png"),
      require("../../assets/effects/skills/boomerang3.png"),
      require("../../assets/effects/skills/boomerang4.png"),
      require("../../assets/effects/skills/boomerang5.png"),
      require("../../assets/effects/skills/boomerang6.png"),
      require("../../assets/effects/skills/boomerang7.png"),
      require("../../assets/effects/skills/boomerang8.png"),
    ],
  },
  fire: {},
  ice: {},
};

export function getEffectFrames(
  element: Element,
  tier: SkillTier,
): AnimationFrames {
  const requested = effectAnimations[element]?.[tier];
  if (requested && requested.length > 0) {
    return requested;
  }

  const fallback = effectAnimations.lightning?.small;
  if (fallback && fallback.length > 0) {
    return fallback;
  }

  return [];
}

export function getClassSpriteFrames(
  classId: CharacterClassId,
  state: keyof CharacterSpriteSet,
) {
  const frames = classSprites[classId]?.[state];

  if (frames && frames.length > 0) {
    return frames;
  }

  return classSprites.mage.idle;
}
