"use client";

import { useEffect, useRef, useState } from "react";
import { Workflow, Monitor, Tablet } from "lucide-react";

/* ─── Floating orb ─── */
function Orb({ cx, cy, r, delay }: { cx: string; cy: string; r: string; delay: string }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke="oklch(0.35 0 0)"
      strokeWidth="0.5"
      style={{
        animation: `orbPulse 6s ease-in-out ${delay} infinite`,
        transformOrigin: `${cx} ${cy}`,
      }}
    />
  );
}

/* ─── Scanline canvas ─── */
function useScanlines(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let offset = 0;

    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let y = offset; y < canvas.height; y += 4) {
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(0, y, canvas.width, 1);
      }

      offset = (offset + 0.4) % 4;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [canvasRef]);
}

/* ─── Main Component ─── */
export default function UnsupportedScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useScanlines(canvasRef);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "oklch(0.12 0 0)",
        color: "oklch(0.96 0 0)",
        fontFamily: "'DM Mono', 'Fira Code', 'JetBrains Mono', monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.12); opacity: 0.15; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rotateSlowReverse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .anim-1 { animation: fadeSlideUp 0.6s ease both; animation-delay: 0.05s; }
        .anim-2 { animation: fadeSlideUp 0.6s ease both; animation-delay: 0.2s; }
        .anim-3 { animation: fadeSlideUp 0.6s ease both; animation-delay: 0.35s; }
        .anim-4 { animation: fadeSlideUp 0.6s ease both; animation-delay: 0.5s; }
        .anim-5 { animation: fadeSlideUp 0.6s ease both; animation-delay: 0.65s; }
      `}</style>

      {/* Scanline overlay */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
          opacity: 0.4,
        }}
      />

      {/* Grid */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(oklch(0.9 0 0 / 0.04) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.9 0 0 / 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      {/* Radial vignette */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, oklch(0.08 0 0 / 0.9) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Concentric ring SVG */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <svg
          width="600"
          height="600"
          viewBox="0 0 600 600"
          style={{ overflow: "visible" }}
        >
          <Orb cx="300" cy="300" r="120" delay="0s" />
          <Orb cx="300" cy="300" r="185" delay="0.8s" />
          <Orb cx="300" cy="300" r="255" delay="1.6s" />
          <Orb cx="300" cy="300" r="330" delay="2.4s" />

          {/* Rotating dashed ring */}
          <circle
            cx="300"
            cy="300"
            r="220"
            fill="none"
            stroke="oklch(0.28 0 0)"
            strokeWidth="1"
            strokeDasharray="6 18"
            style={{
              animation: "rotateSlow 40s linear infinite",
              transformOrigin: "300px 300px",
            }}
          />
          <circle
            cx="300"
            cy="300"
            r="155"
            fill="none"
            stroke="oklch(0.24 0 0)"
            strokeWidth="1"
            strokeDasharray="3 14"
            style={{
              animation: "rotateSlowReverse 28s linear infinite",
              transformOrigin: "300px 300px",
            }}
          />
        </svg>
      </div>

      {/* Content */}
      <main
        role="main"
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "2rem",
          maxWidth: "420px",
          width: "100%",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        {/* Logo */}
        <div className="anim-1" style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: "1px solid oklch(0.25 0 0)",
                background: "oklch(0.16 0 0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Workflow size={16} color="oklch(0.75 0 0)" />
            </div>
            <span
              style={{
                fontSize: "0.95rem",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "oklch(0.75 0 0)",
              }}
            >
              Quelm
            </span>
          </div>
        </div>

        {/* Device icon cluster */}
        <div
          className="anim-2"
          style={{
            marginBottom: "2.5rem",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "14px",
            animation: "floatY 5s ease-in-out infinite",
          }}
        >
          {/* Phone — dimmed */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              opacity: 0.25,
              transform: "scale(0.85)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 52,
                borderRadius: 8,
                border: "1.5px solid oklch(0.35 0 0)",
                background: "oklch(0.15 0 0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 2,
                  borderRadius: 2,
                  background: "oklch(0.35 0 0)",
                }}
              />
            </div>
          </div>

          {/* Tablet — dimmed */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              opacity: 0.3,
              transform: "scale(0.92)",
            }}
          >
            <div
              style={{
                width: 46,
                height: 60,
                borderRadius: 8,
                border: "1.5px solid oklch(0.35 0 0)",
                background: "oklch(0.15 0 0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Tablet size={18} color="oklch(0.35 0 0)" />
            </div>
          </div>

          {/* Monitor — bright */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 72,
                height: 54,
                borderRadius: 8,
                border: "1.5px solid oklch(0.55 0 0)",
                background: "oklch(0.17 0 0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px oklch(0.4 0 0 / 0.25)",
              }}
            >
              <Monitor size={26} color="oklch(0.88 0 0)" />
            </div>
            {/* Monitor stand */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0,
              }}
            >
              <div style={{ width: 2, height: 10, background: "oklch(0.3 0 0)" }} />
              <div
                style={{
                  width: 22,
                  height: 2,
                  borderRadius: 2,
                  background: "oklch(0.3 0 0)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="anim-3" style={{ marginBottom: "1rem" }}>
          <h1
            style={{
              fontSize: "clamp(1.25rem, 5vw, 1.6rem)",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              lineHeight: 1.25,
              color: "oklch(0.92 0 0)",
              margin: 0,
            }}
          >
            Built for larger screens
          </h1>
        </div>

        {/* Body */}
        <div className="anim-4" style={{ marginBottom: "2.5rem" }}>
          <p
            style={{
              fontSize: "0.8rem",
              color: "oklch(0.42 0 0)",
              lineHeight: 1.8,
              maxWidth: "300px",
              margin: "0 auto",
              letterSpacing: "0.01em",
            }}
          >
            Quelm is optimised for laptops, desktops, and large tablets.
            <br />
            Please switch to a bigger screen to access the full experience.
          </p>
        </div>

        {/* Divider */}
        <div
          className="anim-4"
          style={{
            width: "100%",
            maxWidth: 260,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, oklch(0.25 0 0), transparent)",
            marginBottom: "2.5rem",
          }}
          aria-hidden="true"
        />

        {/* Min-width badge */}
        <div className="anim-5">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "0.5rem 1rem",
              borderRadius: "0.6rem",
              border: "1px solid oklch(0.22 0 0)",
              background: "oklch(0.15 0 0)",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "oklch(0.4 0 0)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "oklch(0.55 0 0)",
                animation: "blink 2s ease-in-out infinite",
              }}
            />
            Minimum 1024px recommended
          </div>
        </div>
      </main>

      {/* Bottom watermark */}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "0.65rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "oklch(0.25 0 0)",
          zIndex: 2,
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.6s ease 1s",
        }}
      >
        quelm · desktop only
      </div>
    </div>
  );
}
