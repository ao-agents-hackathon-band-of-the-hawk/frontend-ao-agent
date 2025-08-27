// src/components/RectangularGlow.tsx (updated for flow animation)
import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Vec3 } from "ogl";
import { MotionValue } from 'framer-motion'

import '../Orb.css';

interface RectangularGlowProps {
  borderThickness?: number;
  hue?: number;
  rectWidth?: number | MotionValue<number>;
  rectHeight?: number | MotionValue<number>;
  centerY?: number | MotionValue<number>;
  opacity?: number | MotionValue<number>;
  topSpreadProgress?: number | MotionValue<number>;
}

export default function RectangularGlow({
  borderThickness = 0.1,
  hue = 0,
  rectWidth,
  rectHeight,
  centerY = 0,
  opacity = 1,
  topSpreadProgress = 1,
}: RectangularGlowProps) {
  const ctnDom = useRef<HTMLDivElement>(null);

  const vert = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const frag = /* glsl */ `
    precision highp float;

    uniform float iTime;
    uniform vec3 iResolution;
    uniform float hue;
    uniform float rectWidth;
    uniform float rectHeight;
    uniform float borderThickness;
    uniform float centerY;
    uniform float opacity;
    uniform float topSpreadProgress;
    varying vec2 vUv;

    vec3 rgb2yiq(vec3 c) {
      float y = dot(c, vec3(0.299, 0.587, 0.114));
      float i = dot(c, vec3(0.596, -0.274, -0.322));
      float q = dot(c, vec3(0.211, -0.523, 0.312));
      return vec3(y, i, q);
    }
    
    vec3 yiq2rgb(vec3 c) {
      float r = c.x + 0.956 * c.y + 0.621 * c.z;
      float g = c.x - 0.272 * c.y - 0.647 * c.z;
      float b = c.x - 1.106 * c.y + 1.703 * c.z;
      return vec3(r, g, b);
    }
    
    vec3 adjustHue(vec3 color, float hueDeg) {
      float hueRad = hueDeg * 3.14159265 / 180.0;
      vec3 yiq = rgb2yiq(color);
      float cosA = cos(hueRad);
      float sinA = sin(hueRad);
      float i = yiq.y * cosA - yiq.z * sinA;
      float q = yiq.y * sinA + yiq.z * cosA;
      yiq.y = i;
      yiq.z = q;
      return yiq2rgb(yiq);
    }
    
    vec4 extractAlpha(vec3 colorIn) {
      float a = max(max(colorIn.r, colorIn.g), colorIn.b);
      return vec4(colorIn.rgb / (a + 1e-5), a);
    }
    
    // Smooth rounded rectangle distance function
    float roundedRectDistance(vec2 p, vec2 size, float radius) {
      vec2 d = abs(p) - size + radius;
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
    }
    
    // Modified glow function that focuses on the border
    float borderGlow(float dist, float thickness) {
      float borderDist = abs(dist);
      return exp(-borderDist / thickness) * exp(-borderDist * borderDist / (thickness * thickness * 2.0));
    }
    
    const vec3 baseColor1 = vec3(0.611765, 0.262745, 0.996078);
    const vec3 baseColor2 = vec3(0.298039, 0.760784, 0.913725);
    const vec3 baseColor3 = vec3(0.062745, 0.078431, 0.600000);
    
    vec4 draw(vec2 uv) {
      vec3 color1 = adjustHue(baseColor1, hue);
      vec3 color2 = adjustHue(baseColor2, hue);
      vec3 color3 = adjustHue(baseColor3, hue);
      
      vec2 rectSize = vec2(rectWidth, rectHeight) * 0.5;
      
      // Use consistent corner radius based on smaller dimension
      float cornerRadius = min(rectSize.x, rectSize.y) * 0.08;
      
      // Single, clean distance function
      float dist = roundedRectDistance(uv, rectSize, cornerRadius);
      
      // Border-focused glow system that prevents white center
      float coreGlow = borderGlow(dist, borderThickness * 0.4);
      float midGlow = borderGlow(dist, borderThickness * 1.0);
      float outerGlow = borderGlow(dist, borderThickness * 2.0);
      
      // Combine glows with better weighting to prevent center brightness
      float totalGlow = coreGlow * 0.8 + midGlow * 0.5 + outerGlow * 0.3;
      
      // Improved mask that handles corners better
      float maxGlowDist = borderThickness * 2.5;
      float mask = smoothstep(maxGlowDist, 0.0, abs(dist));
      totalGlow *= mask;
      
      // Top spread mask
      float rectTop = rectHeight * 0.5;
      float topThreshold = rectTop - borderThickness * 2.0;
      if (uv.y > topThreshold) {
        float halfWidth = rectWidth * 0.5;
        float revealWidth = (1.0 - topSpreadProgress) * halfWidth;
        if (abs(uv.x) < revealWidth) {
          totalGlow = 0.0;
        }
      }
      
      // Simplified gradient calculation
      float angle = atan(uv.y, uv.x);
      float gradientFactor = cos(angle) * 0.5 + 0.5;
      
      vec3 gradient = mix(color1, color2, gradientFactor);
      
      // Distance-based color mixing that doesn't brighten the center
      float colorMix = smoothstep(borderThickness * 0.5, 0.0, abs(dist));
      vec3 finalColor = mix(color3, gradient, colorMix) * totalGlow;
      
      // Clamp to prevent over-bright values
      finalColor = clamp(finalColor, 0.0, 1.0);
      
      return extractAlpha(finalColor);
    }
    
    vec4 mainImage(vec2 fragCoord) {
      vec2 center = iResolution.xy * 0.5;
      float size = min(iResolution.x, iResolution.y);
      vec2 uv = (fragCoord - center) / size * 2.0;
      uv.y -= centerY;
      
      return draw(uv);
    }
    
    void main() {
      vec2 fragCoord = vUv * iResolution.xy;
      vec4 col = mainImage(fragCoord);
      gl_FragColor = vec4(col.rgb * col.a * opacity, col.a * opacity);
    }
  `;

  useEffect(() => {
    const container = ctnDom.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Vec3(
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height
          ),
        },
        hue: { value: hue },
        rectWidth: { value: 0 },
        rectHeight: { value: 0 },
        borderThickness: { value: borderThickness },
        centerY: { value: typeof centerY === 'number' ? centerY : centerY.get() },
        opacity: { value: typeof opacity === 'number' ? opacity : opacity.get() },
        topSpreadProgress: { value: typeof topSpreadProgress === 'number' ? topSpreadProgress : topSpreadProgress.get() },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      renderer.setSize(containerWidth * dpr, containerHeight * dpr);
      gl.canvas.style.width = containerWidth + "px";
      gl.canvas.style.height = containerHeight + "px";
      program.uniforms.iResolution.value.set(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      );

      // Dynamically compute rectWidth and rectHeight if not overridden
      const minDim = Math.min(containerWidth, containerHeight);
      const uvXMax = containerWidth / minDim;
      const uvYMax = containerHeight / minDim;
      program.uniforms.rectWidth.value = typeof rectWidth === 'number' ? rectWidth : (rectWidth?.get() ?? uvXMax * 2);
      program.uniforms.rectHeight.value = typeof rectHeight === 'number' ? rectHeight : (rectHeight?.get() ?? uvYMax * 2);
    }
    window.addEventListener("resize", resize);
    resize();

    let rafId: number;
    const update = (t: number) => {
      rafId = requestAnimationFrame(update);
      program.uniforms.iTime.value = t * 0.001;
      program.uniforms.hue.value = hue;
      program.uniforms.borderThickness.value = borderThickness;
      program.uniforms.centerY.value = typeof centerY === 'number' ? centerY : centerY.get();
      program.uniforms.opacity.value = typeof opacity === 'number' ? opacity : opacity.get();

      // Compute defaults for rectWidth and rectHeight in case undefined
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const minDim = Math.min(containerWidth, containerHeight);
      const uvXMax = containerWidth / minDim;
      const uvYMax = containerHeight / minDim;
      program.uniforms.rectWidth.value = typeof rectWidth === 'number' ? rectWidth : (rectWidth?.get() ?? uvXMax * 2);
      program.uniforms.rectHeight.value = typeof rectHeight === 'number' ? rectHeight : (rectHeight?.get() ?? uvYMax * 2);
      program.uniforms.topSpreadProgress.value = typeof topSpreadProgress === 'number' ? topSpreadProgress : topSpreadProgress.get();

      renderer.render({ scene: mesh });
    };
    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [hue, borderThickness]);

  return <div ref={ctnDom} className="orb-container" />;
}