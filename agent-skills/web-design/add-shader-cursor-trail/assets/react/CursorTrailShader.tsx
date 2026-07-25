"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import {
  ChromaFlow,
  CursorRipples,
  DotGrid,
  FilmGrain,
  LinearGradient,
  Shader,
} from "shaders/react";

type ShaderBoundaryProps = { children: ReactNode };
type ShaderBoundaryState = { failed: boolean };

class ShaderBoundary extends Component<ShaderBoundaryProps, ShaderBoundaryState> {
  state: ShaderBoundaryState = { failed: false };

  static getDerivedStateFromError(): ShaderBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("Cursor trail shader could not start.", error, info);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function CursorTrailShader() {
  return (
    <ShaderBoundary>
      <Shader className="cursor-trail-shader" disableTelemetry colorSpace="srgb">
        <DotGrid
          id="trailDots"
          density={40}
          dotSize={{
            type: "map",
            source: "trailFlow",
            channel: "alpha",
            inputMax: 1,
            inputMin: 0,
            outputMax: 1,
            outputMin: 0,
          }}
          twinkle={0.9}
          visible={false}
        />
        <ChromaFlow id="trailFlow" intensity={1.4} radius={2.9} visible={false} />
        <LinearGradient
          colorA="#1e1e1f"
          colorB="#070708"
          colorSpace="hsl"
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 1 }}
        />
        <LinearGradient
          colorA="#000000"
          colorB="#ffffff"
          colorSpace="hsl"
          end={{ x: 1, y: 0 }}
          maskSource="trailDots"
          start={{ x: 0, y: 1 }}
        />
        <CursorRipples />
        <FilmGrain strength={0.1} />
      </Shader>
    </ShaderBoundary>
  );
}
