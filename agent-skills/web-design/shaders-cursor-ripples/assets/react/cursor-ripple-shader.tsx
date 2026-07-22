"use client";

import { CursorRipples, ImageTexture, Shader } from "shaders/react";

type CursorRippleShaderProps = {
  imageUrl: string;
  ready: boolean;
  onReady: () => void;
  className?: string;
};

export default function CursorRippleShader({
  imageUrl,
  ready,
  onReady,
  className = "cursor-ripple-shader",
}: CursorRippleShaderProps) {
  return (
    <Shader
      className={`${className}${ready ? " is-ready" : ""}`}
      toneMapping="aces"
      disableTelemetry
      onReady={onReady}
      data-cursor-ripple-shader
      aria-hidden="true"
    >
      <ImageTexture url={imageUrl} objectFit="cover" />
      <CursorRipples decay={7.3} radius={0.6} />
    </Shader>
  );
}
