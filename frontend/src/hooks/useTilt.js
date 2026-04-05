import { useRef } from "react";

export const useTilt = () => {
  const ref = useRef();

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const rotateX = ((y - midY) / midY) * 5;
    const rotateY = ((x - midX) / midX) * -5;

    el.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.03)
      translateY(-6px)
    `;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1.01) translateY(0)";
  };

  return { ref, handleMouseMove, handleMouseLeave };
};
