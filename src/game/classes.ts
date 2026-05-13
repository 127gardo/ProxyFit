/*
  classes.ts is now mostly a SPRITE / animation profile file.

  Important design change:
  - The main character no longer needs to choose a "class" on the Character screen.
  - For now, the main character uses the warrior sprite.
  - The old mage/warrior/archer/thief sprites can be used as temporary Spotter visuals.

  Later, if you add a character creator, this file can evolve into:
  - body type
  - hairstyle
  - outfit
  - weapon stance
  - animation profile
*/

export type CharacterClassId = "mage" | "warrior" | "archer" | "thief";

export const DEFAULT_CLASS_ID: CharacterClassId = "warrior";

export type CharacterClass = {
  id: CharacterClassId;
  name: string;
  icon: string;
  description: string;

  /*
    swingProfile controls the little physical movement that happens when the
    fighter attacks. Different sprites can feel better with different values.
  */
  swingProfile: {
    rotationDeg: number;
    translateX: number;
    translateY: number;
    scale: number;
    durationMs: number;
  };
};

export const characterClasses: CharacterClass[] = [
  {
    id: "warrior",
    name: "Warrior",
    icon: "⚔️",
    description: "Default main character sprite for now.",
    swingProfile: {
      rotationDeg: -10,
      translateX: 12,
      translateY: -4,
      scale: 1.05,
      durationMs: 120,
    },
  },
  {
    id: "mage",
    name: "Mage",
    icon: "🧙",
    description: "Temporary Spotter sprite placeholder.",
    swingProfile: {
      rotationDeg: -5,
      translateX: 8,
      translateY: -6,
      scale: 1.04,
      durationMs: 130,
    },
  },
  {
    id: "archer",
    name: "Archer",
    icon: "🏹",
    description: "Temporary Spotter sprite placeholder.",
    swingProfile: {
      rotationDeg: -4,
      translateX: 10,
      translateY: -3,
      scale: 1.03,
      durationMs: 115,
    },
  },
  {
    id: "thief",
    name: "Thief",
    icon: "🗡️",
    description: "Temporary Spotter sprite placeholder.",
    swingProfile: {
      rotationDeg: -7,
      translateX: 14,
      translateY: -3,
      scale: 1.04,
      durationMs: 100,
    },
  },
];

export function getCharacterClass(classId: CharacterClassId) {
  return (
    characterClasses.find((characterClass) => characterClass.id === classId) ??
    characterClasses[0]
  );
}
