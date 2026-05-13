import { useEffect, useRef, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
} from "react-native";

/*
  SpriteAnimator is a small reusable component for frame-by-frame animation.

  Beginner explanation:
  - Aseprite gives you multiple PNG images.
  - Each PNG is one "frame" of the animation.
  - This component shows frame 0, then frame 1, then frame 2, etc.
  - If loop is true, it goes back to frame 0 and keeps playing.

  Why this is useful:
  - battle.tsx no longer needs to know how idle animations work.
  - Player characters, Spotters, and bosses can all use the same component.
  - Adding new idle frames later only requires changing the asset config.
*/
export type SpriteAnimatorProps = {
  frames: ImageSourcePropType[];
  frameDurationMs?: number;
  loop?: boolean;
  paused?: boolean;
  style?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
  onComplete?: () => void;
};

export default function SpriteAnimator({
  frames,
  frameDurationMs = 140,
  loop = true,
  paused = false,
  style,
  resizeMode = "contain",
  onComplete,
}: SpriteAnimatorProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);

  /*
    Keep the newest onComplete function without restarting the animation every
    time the parent screen re-renders.
  */
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  /*
    When the frames change, start from the first frame.

    Example:
    - idle animation is playing
    - player attacks
    - frames changes from idle frames to attack frames
    - we restart at attack frame 0
  */
  useEffect(() => {
    setFrameIndex(0);
  }, [frames]);

  useEffect(() => {
    if (paused || frames.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setFrameIndex((currentIndex) => {
        const nextIndex = currentIndex + 1;

        if (nextIndex < frames.length) {
          return nextIndex;
        }

        if (loop) {
          return 0;
        }

        onCompleteRef.current?.();
        return currentIndex;
      });
    }, frameDurationMs);

    return () => clearInterval(interval);
  }, [frames, frameDurationMs, loop, paused]);

  const safeFrames = frames.length > 0 ? frames : [];
  const source = safeFrames[frameIndex] ?? safeFrames[0];

  if (!source) {
    return null;
  }

  return <Image source={source} style={style} resizeMode={resizeMode} />;
}
