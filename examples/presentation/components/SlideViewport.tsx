"use client";

import React, { useRef, useEffect, useState } from "react";

interface SlideViewportProps {
  children: React.ReactNode;
  baseWidth?: number;
  baseHeight?: number;
}

export function SlideViewport({
  children,
  baseWidth = 1280,
  baseHeight = 720,
}: SlideViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const availableWidth = container.clientWidth;
      const availableHeight = container.clientHeight;
      const scaleX = availableWidth / baseWidth;
      const scaleY = availableHeight / baseHeight;
      setScale(Math.min(scaleX, scaleY, 1)); // Never scale up beyond 1
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateScale);
      resizeObserver.disconnect();
    };
  }, [baseWidth, baseHeight]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden bg-black"
    >
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          flexShrink: 0,
        }}
        className="bg-[#050509] shadow-lg"
      >
        <div className="w-full h-full overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
