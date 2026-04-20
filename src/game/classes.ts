export type CharacterClassId = "mage" | "warrior" | "archer" | "thief";

export type SwingAnimationProfile = {
  rotationDeg: number;
  translateX: number;
  translateY: number;
  scale: number;
  durationMs: number;
};

export type CharacterClassDefinition = {
  id: CharacterClassId;
  name: string;
  icon: string;
  description: string;
  accentColor: string;
  swingProfile: SwingAnimationProfile;
};

export const characterClasses: CharacterClassDefinition[] = [
  {
    id: "mage",
    name: "Mage",
    icon: "⚡",
    description: "Uses staffs, spells, and magical burst attacks.",
    accentColor: "#8e7dff",
    swingProfile: {
      rotationDeg: -18,
      translateX: 14,
      translateY: -12,
      scale: 1.04,
      durationMs: 160,
    },
  },
  {
    id: "warrior",
    name: "Warrior",
    icon: "🗡️",
    description: "Uses swords and heavy close-range attack motions.",
    accentColor: "#ef5350",
    swingProfile: {
      rotationDeg: -32,
      translateX: 20,
      translateY: -6,
      scale: 1.08,
      durationMs: 130,
    },
  },
  {
    id: "archer",
    name: "Archer",
    icon: "🏹",
    description: "Uses bows and precise ranged shots.",
    accentColor: "#66bb6a",
    swingProfile: {
      rotationDeg: -10,
      translateX: 18,
      translateY: -16,
      scale: 1.03,
      durationMs: 150,
    },
  },
  {
    id: "thief",
    name: "Thief",
    icon: "🌀",
    description: "Uses fast blades and quick attack motions.",
    accentColor: "#26c6da",
    swingProfile: {
      rotationDeg: -24,
      translateX: 24,
      translateY: -10,
      scale: 1.06,
      durationMs: 95,
    },
  },
];

export const DEFAULT_CLASS_ID: CharacterClassId = "mage";

export function getCharacterClass(classId: CharacterClassId) {
  return (
    characterClasses.find((characterClass) => characterClass.id === classId) ??
    characterClasses[0]
  );
}
