// src/game/assets.ts
//
// Central place for all sprite/effect image requires.

import { ImageSourcePropType } from "react-native";

export type Element = "lightning" | "fire" | "ice";
export type SkillTier = "small" | "big" | "ultimate";
export type EffectAnchor = "player" | "boss" | "screen";

export type AnimationFrames = ImageSourcePropType[];

type EffectLibrary = Partial<
  Record<Element, Partial<Record<SkillTier, AnimationFrames>>>
>;

export const sprites = {
  player: require("../../assets/sprites/character.png"),
  bosses: {
    boss1: require("../../assets/sprites/boss1.png"),
    boss2: require("../../assets/sprites/boss2.png"),
    boss3: require("../../assets/sprites/boss3.png"),
  },
};

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
