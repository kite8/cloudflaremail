"use client"

import { MeshGradient } from "@paper-design/shaders-react"

export default function BackgroundShader() {
  return (
    <div className="fixed inset-0 z-0">
      <MeshGradient
        style={{ height: "100vh", width: "100vw" }}
        distortion={0.8}
        swirl={0.1}
        offsetX={0}
        offsetY={0}
        scale={1}
        rotation={0}
        speed={1}
        colors={[
          "hsl(216, 90%, 27%)",
          "hsl(243, 68%, 36%)",
          "hsl(205, 91%, 64%)",
          "hsl(211, 61%, 57%)",
        ]}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.34),rgba(2,6,23,0.22)_32%,rgba(2,6,23,0.44))]" />
    </div>
  )
}
