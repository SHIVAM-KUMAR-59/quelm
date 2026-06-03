"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

/* ─── Particle ─── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = () => {
      if (particles.length < 60) {
        const maxLife = 120 + Math.random() * 180;
        particles.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -(0.3 + Math.random() * 0.8),
          life: 0,
          maxLife,
          size: 1 + Math.random() * 2,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      spawn();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life > p.maxLife || p.y < -10) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `oklch(0.85 0 0 / ${alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef]);
}

/* ─── Glitch Text ─── */
function GlitchText({ text, className = "" }: { text: string; className?: string }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 150);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`${className} relative inline-block`}
      data-text={text}
      aria-label={text}
      style={{ position: "relative" }}
    >
      {text}
      {glitching && (
        <>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              color: "oklch(0.85 0 0)",
              clipPath: "inset(20% 0 60% 0)",
              transform: "translateX(-3px)",
              opacity: 0.7,
            }}
          >
            {text}
          </span>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              color: "oklch(0.5 0 0)",
              clipPath: "inset(60% 0 10% 0)",
              transform: "translateX(3px)",
              opacity: 0.5,
            }}
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
}

/* ─── Grid Lines ─── */
function GridLines() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: `
          linear-gradient(oklch(0.3 0 0 / 0.06) 1px, transparent 1px),
          linear-gradient(90deg, oklch(0.3 0 0 / 0.06) 1px, transparent 1px)
        `,
        backgroundSize: "64px 64px",
        maskImage:
          "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
      }}
    />
  );
}

/* ─── Main Component ─── */
export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pathname, setPathname] = useState("");

  useParticleCanvas(canvasRef);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    setPathname(window.location.pathname);
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
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Grid */}
      <GridLines />

      {/* Radial vignette */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 30%, oklch(0.08 0 0 / 0.8) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

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
          maxWidth: "640px",
          width: "100%",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        {/* Logo */}
        <div
          style={{
            marginBottom: "2.5rem",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "scale(1)" : "scale(0.8)",
            transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s",
          }}
        >
          <Icon size={48} />
        </div>

        {/* 404 */}
        <div
          style={{
            fontSize: "clamp(7rem, 20vw, 12rem)",
            fontWeight: 300,
            lineHeight: 1,
            letterSpacing: "-0.06em",
            color: "oklch(0.92 0 0)",
            marginBottom: "0.5rem",
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease 0.2s",
            userSelect: "none",
          }}
        >
          <GlitchText text="404" />
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            maxWidth: "320px",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, oklch(0.35 0 0), transparent)",
            margin: "1.5rem auto",
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease 0.35s",
          }}
          aria-hidden="true"
        />

        {/* Message */}
        <p
          style={{
            fontSize: "clamp(0.8rem, 2.5vw, 0.95rem)",
            color: "oklch(0.55 0 0)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease 0.4s",
          }}
        >
          page not found
        </p>

        <p
          style={{
            fontSize: "clamp(0.85rem, 2vw, 1rem)",
            color: "oklch(0.45 0 0)",
            lineHeight: 1.7,
            maxWidth: "360px",
            marginBottom: "3rem",
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease 0.5s",
          }}
        >
          The route you followed leads nowhere.
          <br />
          Let&apos;s get you back on track.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => router.push("/workflows")}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label="Go to Workflows"
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "0.85rem 2rem",
            background: hovered ? "oklch(0.92 0 0)" : "transparent",
            color: hovered ? "oklch(0.12 0 0)" : "oklch(0.92 0 0)",
            border: "1px solid oklch(0.35 0 0)",
            borderRadius: "0.8rem",
            fontSize: "0.85rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition:
              "background 0.25s ease, color 0.25s ease, border-color 0.25s ease, transform 0.15s ease",
            transform: hovered ? "scale(1.03)" : "scale(1)",
            opacity: mounted ? 1 : 0,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              transform: hovered ? "translateX(-2px)" : "translateX(0)",
              transition: "transform 0.2s ease",
            }}
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
          Go to Workflows
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              transform: hovered ? "translateX(3px)" : "translateX(0)",
              transition: "transform 0.2s ease",
            }}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        {/* Bottom code hint */}
        <p
          style={{
            marginTop: "3.5rem",
            fontSize: "0.72rem",
            color: "oklch(0.3 0 0)",
            letterSpacing: "0.08em",
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease 0.75s",
          }}
        >
          ERR_ROUTE_NOT_FOUND · {pathname || "/???"}
        </p>
      </main>

      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.4; }
          94% { opacity: 1; }
          96% { opacity: 0.6; }
          97% { opacity: 1; }
        }
        main {
          animation: flicker 8s infinite;
        }
        @media (max-width: 480px) {
          main {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
