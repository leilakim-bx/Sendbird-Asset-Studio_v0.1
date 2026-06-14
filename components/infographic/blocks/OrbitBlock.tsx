import {
  AudioLines,
  Globe,
  Mail,
  MessageCircle,
  Mic,
  Monitor,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import {
  siGmail,
  siInstagram,
  siLine,
  siMessenger,
  siWhatsapp,
  type SimpleIcon,
} from "simple-icons";
import type { InfographicBlock, OrbitIconKey } from "@/lib/types/infographic";
import { INFOGRAPHIC_INK } from "@/lib/types/infographic";
import { INFOGRAPHIC_BLOCK_LIMITS } from "@/lib/infographic-block-limits";
import { brand } from "@/lib/tokens/brand";
import { DelightMark } from "./DelightMark";

type Props = { block: Extract<InfographicBlock, { type: "orbit" }>; scale?: number };

const PAPER = brand.color.infographic.paper;
const ORBIT_BLACK = brand.color.infographic.orbitBlack;
const HUB_DASH_STROKE = brand.color.inkMutedStrong;
const ICON_RING_STROKE = brand.color.infographic.iconRing;

const STAGE = { w: 560, h: 460 };
const CENTER = { x: STAGE.w / 2, y: STAGE.h / 2 };

const LUCIDE_ICONS: Partial<Record<OrbitIconKey, LucideIcon>> = {
  mobile: Smartphone,
  voice: Mic,
  email: Mail,
  chat: MessageCircle,
  web: Monitor,
  audio: AudioLines,
  site: Globe,
};

const SIMPLE_ICONS: Partial<Record<OrbitIconKey, SimpleIcon>> = {
  whatsapp: siWhatsapp,
  line: siLine,
  instagram: siInstagram,
  messenger: siMessenger,
  gmail: siGmail,
};

const ASSET_ICONS: Partial<Record<OrbitIconKey, string>> = {
  slack: "/preview/icon_slack.svg",
};

const DEFAULT_NODES = [
  { label: "Detect" },
  { label: "Activate" },
  { label: "Orchestrate", highlight: true },
  { label: "Resolve" },
];

const DEFAULT_SATELLITES: Array<{ key: OrbitIconKey }> = [
  { key: "mobile" },
  { key: "web" },
  { key: "chat" },
  { key: "slack" },
  { key: "email" },
  { key: "whatsapp" },
  { key: "site" },
];

function nodePos(i: number, n: number, r: number) {
  const angle = nodeAngle(i, n) * (Math.PI / 180);
  return {
    x: CENTER.x + Math.cos(angle) * r,
    y: CENTER.y + Math.sin(angle) * r,
  };
}

function nodeAngle(i: number, n: number) {
  return -90 + (360 / n) * i;
}

function CenterMark({ scale }: { scale: number }) {
  const size = Math.round(96 * scale);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      <DelightMark size={size} />
    </div>
  );
}

function CycleDiagram({ block, scale = 1 }: Props) {
  const nodes = (block.nodes?.length ? block.nodes : DEFAULT_NODES).slice(0, INFOGRAPHIC_BLOCK_LIMITS.orbitNodes);
  const radius = nodes.length > 6 ? 160 : 152;
  const outerGuideRadius = 216;
  const innerGuideRadius = 92;
  const fs = (n: number) => Math.round(n * scale);

  return (
    <div style={{ position: "relative", width: "min(100%, 560px)", height: STAGE.h, margin: "0 auto" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${STAGE.w} ${STAGE.h}`} fill="none" style={{ position: "absolute", inset: 0 }}>
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={outerGuideRadius}
          stroke={ORBIT_BLACK}
          strokeWidth="1.2"
          strokeDasharray="8 8"
          opacity="0.2"
        />
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={innerGuideRadius}
          stroke={ORBIT_BLACK}
          strokeWidth="1.2"
          strokeDasharray="4 4"
          opacity="0.2"
        />
        <circle cx={CENTER.x} cy={CENTER.y} r={radius} stroke={ORBIT_BLACK} strokeWidth="1.2" />
      </svg>

      <CenterMark scale={scale} />

      {nodes.map((node, i) => {
        const p = nodePos(i, nodes.length, radius);
        const highlight = !!node.highlight;
        return (
          <div
            key={`${node.label}-${i}`}
            style={{
              position: "absolute",
              left: `${(p.x / STAGE.w) * 100}%`,
              top: `${(p.y / STAGE.h) * 100}%`,
              transform: "translate(-50%, -50%)",
              display: "flex",
              alignItems: "center",
              gap: 7,
              maxWidth: 150,
              minHeight: 36,
              padding: "8px 13px",
              borderRadius: 9,
              border: `1px solid ${ORBIT_BLACK}`,
              background: highlight ? ORBIT_BLACK : PAPER,
              color: highlight ? PAPER : ORBIT_BLACK,
              boxSizing: "border-box",
              boxShadow: brand.elevation[1],
            }}
          >
            {highlight && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--ig-accent)",
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: fs(14),
                lineHeight: 1.1,
                fontWeight: 650,
              }}
            >
              {node.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HubSpokeDiagram({ block, scale = 1 }: Props) {
  const rawSatellites = block.satellites?.length ? block.satellites : DEFAULT_SATELLITES;
  const satellites = rawSatellites
    .filter((satellite) => satellite.key in ASSET_ICONS || satellite.key in LUCIDE_ICONS || satellite.key in SIMPLE_ICONS)
    .slice(0, INFOGRAPHIC_BLOCK_LIMITS.orbitSatellites);
  const radius = satellites.length > 6 ? 124 : 116;
  const outerGuideRadius = radius + 72;
  const iconSize = Math.round(24 * scale);

  return (
    <div style={{ position: "relative", width: "min(100%, 560px)", height: STAGE.h, margin: "0 auto" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${STAGE.w} ${STAGE.h}`} fill="none" style={{ position: "absolute", inset: 0 }}>
        <circle cx={CENTER.x} cy={CENTER.y} r={outerGuideRadius} stroke={ORBIT_BLACK} strokeWidth="1.2" opacity="0.12" />
        <circle cx={CENTER.x} cy={CENTER.y} r={radius} stroke={HUB_DASH_STROKE} strokeWidth="2" strokeDasharray="6 9" />
      </svg>

      <CenterMark scale={scale} />

      {satellites.map((satellite, i) => {
        const p = nodePos(i, satellites.length, radius);
        const assetIcon = ASSET_ICONS[satellite.key];
        const simpleIcon = SIMPLE_ICONS[satellite.key];
        const Icon = LUCIDE_ICONS[satellite.key] ?? Globe;
        return (
          <div
            key={`${satellite.key}-${i}`}
            style={{
              position: "absolute",
              left: `${(p.x / STAGE.w) * 100}%`,
              top: `${(p.y / STAGE.h) * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: PAPER,
              border: `1.5px solid ${ICON_RING_STROKE}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: INFOGRAPHIC_INK,
              boxShadow: brand.elevation[1],
            }}
          >
            {assetIcon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={assetIcon}
                alt=""
                width={iconSize}
                height={iconSize}
                aria-hidden
                style={{ display: "block", width: iconSize, height: iconSize, objectFit: "contain" }}
              />
            ) : simpleIcon ? (
              <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" aria-hidden style={{ display: "block" }}>
                <path d={simpleIcon.path} fill="currentColor" />
              </svg>
            ) : (
              <Icon size={iconSize} strokeWidth={2.1} aria-hidden />
            )}
          </div>
        );
      })}

    </div>
  );
}

export function OrbitBlock({ block, scale = 1 }: Props) {
  if (block.variant === "hub-spoke") {
    return <HubSpokeDiagram block={block} scale={scale} />;
  }

  return <CycleDiagram block={block} scale={scale} />;
}
