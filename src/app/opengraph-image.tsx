import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ComfyMart — Marketing on autopilot";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#faf7f2",
          backgroundImage:
            "radial-gradient(60% 60% at 15% 10%, rgba(109,58,255,0.28), transparent 70%), radial-gradient(50% 50% at 90% 25%, rgba(255,140,90,0.26), transparent 70%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #6d3aff, #ff8c5a)",
            }}
          />
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#1a1625",
              letterSpacing: "-0.02em",
            }}
          >
            ComfyMart
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#1a1625",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            Marketing on autopilot.
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#6b6478",
              maxWidth: 780,
              lineHeight: 1.35,
            }}
          >
            Plug any project in. AI runs social, email, content, and SEO —
            with human approval by default.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
