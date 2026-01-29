import { useMemo } from "react";

const COLORS = ["#f04d3c", "#f7b801", "#00a78e", "#2d9cdb", "#f7931e"];

const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type ConfettiPiece = {
  left: number;
  delay: number;
  size: number;
  rotate: number;
  drift: number;
  duration: number;
  color: string;
};

type ConfettiProps = {
  seed: number;
  active: boolean;
};

export const Confetti = ({ seed, active }: ConfettiProps) => {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    const rand = mulberry32(seed || 1);
    return Array.from({ length: 36 }, () => ({
      left: rand() * 100,
      delay: rand() * 0.25,
      size: 6 + rand() * 6,
      rotate: rand() * 360,
      drift: rand() * 120 - 60,
      duration: 0.9 + rand() * 0.9,
      color: COLORS[Math.floor(rand() * COLORS.length)],
    }));
  }, [seed]);

  if (!active) return null;

  return (
    <div className="confetti">
      {pieces.map((piece, index) => (
        <span
          key={`${seed}-${index}`}
          className="confetti__piece"
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size * 1.6}px`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            ["--drift" as never]: `${piece.drift}px`,
            ["--spin" as never]: `${piece.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
};
