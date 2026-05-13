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
  | "boomerang"
  | "hammer"
  | "mana";
export type SkillTier =
  | "small"
  | "big"
  | "ultimate"
  | "swing"
  | "proc"
  | "arrowRain"
  | "hammer"
  | "mana";
export type EffectAnchor = "player" | "boss" | "screen";

export type AnimationFrames = ImageSourcePropType[];

export type CharacterAnimationState =
  | "idle"
  | "attack"
  | "hurt"
  | "victory"
  | "defeat";

export type CharacterSpriteSet = Partial<
  Record<CharacterAnimationState, AnimationFrames>
> & {
  idle: AnimationFrames;
  attack: AnimationFrames;
};

export type BossSpriteSet = {
  idle: AnimationFrames;
};

type EffectLibrary = Partial<
  Record<Element, Partial<Record<SkillTier, AnimationFrames>>>
>;

const mageCharacterSprite = require("../../assets/sprites/mageSprite.png");
const thiefCharacterSprite = require("../../assets/sprites/thiefSprite.png");
const warriorCharacterSprite = require("../../assets/sprites/warriorSprite.png");
const archerCharacterSprite = require("../../assets/sprites/archerSprite.png");

/*
  Character animation registry.

  This is where you plug in character PNG frames from Aseprite.

  Recommended folder idea for later:
  assets/sprites/player/warrior/idle/idle_0.png
  assets/sprites/player/warrior/idle/idle_1.png
  assets/sprites/player/warrior/attack/attack_0.png

  Expo/React Native needs require(...) paths to be written manually.
  You cannot dynamically build paths like require("../../assets/" + fileName).
*/
export const classSprites: Record<CharacterClassId, CharacterSpriteSet> = {
  mage: {
    idle: [
      require("../../assets/sprites/characterSprites/blue/idle/blue1.png"),
      require("../../assets/sprites/characterSprites/blue/idle/blue2.png"),
      require("../../assets/sprites/characterSprites/blue/idle/blue3.png"),
      require("../../assets/sprites/characterSprites/blue/idle/blue4.png"),
      require("../../assets/sprites/characterSprites/blue/idle/blue5.png"),
      require("../../assets/sprites/characterSprites/blue/idle/blue6.png"),
      require("../../assets/sprites/characterSprites/blue/idle/blue7.png"),
      require("../../assets/sprites/characterSprites/blue/idle/blue8.png"),
    ],
    attack: [
      require("../../assets/sprites/characterSprites/blue/idle/blue1.png"),
    ],
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
    idle: [
      require("../../assets/sprites/characterSprites/monkey/skill/monkey1.png"),
      require("../../assets/sprites/characterSprites/monkey/skill/monkey2.png"),
    ],
    attack: [
      require("../../assets/sprites/characterSprites/monkey/skill/monkey1.png"),
      require("../../assets/sprites/characterSprites/monkey/skill/monkey2.png"),
    ],
  },
};

/*
  Boss animation registry.

  For now each boss only has one idle frame, so nothing visually changes yet.
  Once you export idle frames from Aseprite, add them here like this:

  boss1: {
    idle: [
      require("../../assets/sprites/bosses/boss1/idle/idle_0.png"),
      require("../../assets/sprites/bosses/boss1/idle/idle_1.png"),
      require("../../assets/sprites/bosses/boss1/idle/idle_2.png"),
    ],
  }
*/
export const bossSprites = {
  boss1: {
    idle: [require("../../assets/sprites/boss1.png")],
  },
  boss2: {
    idle: [require("../../assets/sprites/boss2.png")],
  },
  boss3: {
    idle: [require("../../assets/sprites/boss3.png")],
  },
} satisfies Record<string, BossSpriteSet>;

/*
  Kept for older code that may still import sprites.bosses.boss1.
  New battle code should prefer bossSprites because it supports animations.
*/
export const sprites = {
  bosses: {
    boss1: bossSprites.boss1.idle[0],
    boss2: bossSprites.boss2.idle[0],
    boss3: bossSprites.boss3.idle[0],
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
  hammer: {
    hammer: [
      require("../../assets/sprites/characterSprites/monkey/skill/monkey1.png"),
      require("../../assets/sprites/characterSprites/monkey/skill/monkey2.png"),
      require("../../assets/sprites/characterSprites/monkey/skill/monkey3.png"),
      require("../../assets/sprites/characterSprites/monkey/skill/monkey4.png"),
      require("../../assets/sprites/characterSprites/monkey/skill/monkey5.png"),
      require("../../assets/sprites/characterSprites/monkey/skill/monkey6.png"),
      require("../../assets/sprites/characterSprites/monkey/skill/monkey7.png"),
      require("../../assets/sprites/characterSprites/monkey/skill/monkey8.png"),
      require("../../assets/sprites/characterSprites/monkey/skill/monkey9.png"),
    ],
    proc: [],
  },
  mana: {
    mana: [
      require("../../assets/sprites/characterSprites/blue/skill/bluemove1.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove2.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove3.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove4.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove5.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove6.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove7.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove8.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove9.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove10.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove11.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove12.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove13.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove14.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove15.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove16.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove17.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove18.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove19.png"),
      require("../../assets/sprites/characterSprites/blue/skill/bluemove20.png"),
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

export function getBossSpriteFrames(
  bossSpriteId: keyof typeof bossSprites | null | undefined,
) {
  if (!bossSpriteId) {
    return [];
  }

  return bossSprites[bossSpriteId]?.idle ?? [];
}
