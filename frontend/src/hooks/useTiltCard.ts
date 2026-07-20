import { useRef } from "react";

// mouse-tracking 3D tilt + light glare on a poster, imperative (writes
// straight to the DOM via ref) so it stays 1:1 with the cursor instead of
// lagging behind a React re-render on every mousemove
export function useTiltCard() {
  const wrapRef = useRef<HTMLDivElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 14;
    const rotateX = (0.5 - py) * 14;
    el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  }

  function onMouseLeave() {
    const el = wrapRef.current;
    if (el) el.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  return { wrapRef, onMouseMove, onMouseLeave };
}
