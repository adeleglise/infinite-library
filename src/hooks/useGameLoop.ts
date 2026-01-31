"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/gameStore";

export function useGameLoop() {
  const tick = useGameStore((state) => state.tick);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastTickRef.current) / 1000; // Convert to seconds
      lastTickRef.current = now;

      // Cap delta time to prevent huge jumps
      const cappedDelta = Math.min(deltaTime, 1);
      tick(cappedDelta);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [tick]);
}

export function useAutoSave(intervalMs: number = 30000) {
  const save = useGameStore((state) => state.save);

  useEffect(() => {
    const interval = setInterval(() => {
      save();
      console.log("Game auto-saved");
    }, intervalMs);

    return () => clearInterval(interval);
  }, [save, intervalMs]);
}
