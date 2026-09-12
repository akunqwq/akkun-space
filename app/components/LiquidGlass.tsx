"use client";

import { useEffect, useRef, type CSSProperties } from "react";

interface LiquidGlassProps {
  followPointer?: boolean;
  displacement?: number; // 折射强度 (0-40)
  tint?: string;         // 基础颜色
  accent?: string;       // 高光/光晕颜色
  radius?: number;       // 圆角半径 (px)
  className?: string;
  style?: CSSProperties;
}

// 十六进制/RGB 颜色解析为 [R, G, B] (0-1 范围)
function parseColor(input: string): [number, number, number] {
  const hex = input.match(/#([0-9a-f]{6})/i);
  if (hex) {
    const h = hex[1];
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }
  const rgb = input.match(/\d+/g);
  return rgb ? [Number(rgb[0]) / 255, Number(rgb[1]) / 255, Number(rgb[2]) / 255] : [1, 1, 1];
}

const VERTEX_SRC = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const FRAGMENT_SRC = `
precision highp float;

uniform vec2  uResolution; // 容器像素尺寸
uniform vec2  uHalfSize;   // 归一化半尺寸
uniform float uRadius;     // 归一化圆角半径
uniform float uDisp;       // 折射系数 (0-1)
uniform vec3  uTint;       // 基础色
uniform vec3  uAccent;     // 强调色
uniform vec2  uPointer;    // 鼠标坐标
uniform float uHover;      // 悬停强度
uniform float uTime;       // 呼吸动画时间

// 2D 圆角矩形 SDF 距离场：内部 <= 0，外部 > 0
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + max(r, 0.0);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
  float d = sdRoundedBox(uv, uHalfSize, uRadius);
  float aa = 1.0 / min(uResolution.x, uResolution.y);
  float shape = 1.0 - smoothstep(-aa, aa, d); // 容器形状遮罩

  // 1. RGB 三通道色散（利用不同的衰减范围模拟波长分离）
  float distNorm = abs(d);
  float edgeWidth = 0.08 + uDisp * 0.04;
  float edgeR = 1.0 - smoothstep(0.0, edgeWidth * 0.65, distNorm); // 红光散射快
  float edgeG = 1.0 - smoothstep(0.0, edgeWidth, distNorm);        // 绿光中等
  float edgeB = 1.0 - smoothstep(0.0, edgeWidth * 1.35, distNorm); // 蓝光散射慢
  vec3 chroma = vec3(edgeR, edgeG, edgeB);

  // 2. 顶部高光带
  float topLight = smoothstep(uHalfSize.y * 0.2, uHalfSize.y * 0.85, uv.y) * (edgeG * 0.5 + 0.5);
  
  // 3. 中心玻璃体调色
  float centerFade = (1.0 - smoothstep(0.0, uHalfSize.x * 0.6, abs(uv.x))) * 
                     (1.0 - smoothstep(0.0, uHalfSize.y * 0.6, abs(uv.y)));

  // 4. 鼠标跟随呼吸光晕
  float glow = 0.0;
  if (uPointer.x >= 0.0 && uHover > 0.0) {
    float dist = length(uv - uPointer);
    glow = exp(-dist * 4.0) * uHover * (sin(dist * 24.0 - uTime * 2.5) * 0.15 + 1.0);
  }

  // 色彩与 Alpha 组合合成
  vec3 color = uTint * centerFade * 0.18 + chroma * 0.85 + uAccent * (topLight * 0.7 + glow);
  float alpha = clamp((edgeG * 0.9 + centerFade * 0.12 + glow * 0.5 + 0.15) * shape, 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}
`;

export default function LiquidGlass({
  followPointer = true,
  displacement = 14,
  tint = "rgba(255,255,255,0.55)",
  accent = "rgba(59,130,246,0.8)",
  radius = 30,
  className = "",
  style,
}: LiquidGlassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ time: 0, hover: false, px: -1, py: -1, raf: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrapper = wrapperRef.current!;
    const gl = canvas.getContext("webgl")!;

    // 编译 Shader 程序
    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, VERTEX_SRC));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, FRAGMENT_SRC));
    gl.linkProgram(program);
    gl.useProgram(program);

    // 顶点位置 Buffer (全屏 2D 矩形)
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // 开启 Blend 混合
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // 获取 Uniform 指针缓存
    const u = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = {
      res: u("uResolution"), half: u("uHalfSize"), rad: u("uRadius"),
      disp: u("uDisp"), tint: u("uTint"), accent: u("uAccent"),
      ptr: u("uPointer"), hvr: u("uHover"), time: u("uTime")
    };

    // 主渲染帧逻辑
    const render = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }

      const minSide = Math.min(w, h);
      gl.uniform2f(uniforms.res, w, h);
      gl.uniform2f(uniforms.half, (rect.width * 0.5 * dpr) / minSide, (rect.height * 0.5 * dpr) / minSide);
      gl.uniform1f(uniforms.rad, (radius * dpr) / minSide);
      gl.uniform1f(uniforms.disp, Math.min(Math.max(displacement, 0), 40) / 40);

      const [tr, tg, tb] = parseColor(tint);
      const [ar, ag, ab] = parseColor(accent);
      gl.uniform3f(uniforms.tint, tr, tg, tb);
      gl.uniform3f(uniforms.accent, ar, ag, ab);

      const s = stateRef.current;
      gl.uniform1f(uniforms.hvr, s.hover ? 1.0 : 0.0);
      gl.uniform1f(uniforms.time, s.time);
      gl.uniform2f(uniforms.ptr, s.hover && followPointer ? s.px : -1, s.hover && followPointer ? s.py : -1);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    // 帧循环驱动（悬停时连续更新时间实现波纹动画，静止时单帧渲染）
    const loop = () => {
      if (stateRef.current.hover) {
        stateRef.current.time += 0.016;
        render();
        stateRef.current.raf = requestAnimationFrame(loop);
      }
    };

    // 监听 Pointer 事件
    const onMove = (e: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      
      if (inside) {
        const minSide = Math.min(rect.width, rect.height);
        stateRef.current.px = (e.clientX - rect.left - rect.width * 0.5) / minSide;
        stateRef.current.py = (rect.height * 0.5 - (e.clientY - rect.top)) / minSide;
        
        if (!stateRef.current.hover) {
          stateRef.current.hover = true;
          loop(); // 启动 RAF
        } else {
          render();
        }
      } else if (stateRef.current.hover) {
        stateRef.current.hover = false;
        cancelAnimationFrame(stateRef.current.raf);
        render(); // 离开时重绘最后一帧
      }
    };

    const ro = new ResizeObserver(() => render());
    ro.observe(wrapper);
    window.addEventListener("pointermove", onMove, { passive: true });
    render(); // 首次重绘

    return () => {
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(stateRef.current.raf);
      gl.deleteProgram(program);
    };
  }, [followPointer, displacement, tint, accent, radius]);

  return (
    <div ref={wrapperRef} className={`liquid-glass-wrap ${className}`} style={style} aria-hidden>
      <canvas ref={canvasRef} style={{ pointerEvents: "none", width: "100%", height: "100%" }} />
    </div>
  );
}