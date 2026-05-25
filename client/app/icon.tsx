import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom right, #18181b, #000000)",
        borderRadius: "18px",
        position: "relative",
      }}
    >
      {/* glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at top, rgba(255,255,255,0.12), transparent 60%)",
        }}
      />

      {/* Raw SVG for Lucide Workflow Icon */}
      <svg
        xmlns="http://w3.org"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="8" height="8" x="3" y="3" rx="2" />
        <path d="M7 11v4a2 2 0 0 0 2 2h4" />
        <rect width="8" height="8" x="13" y="13" rx="2" />
      </svg>

      {/* status dot */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          width: 8,
          height: 8,
          borderRadius: "9999px",
          background: "#4ade80",
        }}
      />
    </div>,
    {
      ...size,
    },
  );
}
