import type { ChecklistItem } from "@/lib/store";

/**
 * Shared checklist status icon — used by both the preview (FeatureMockup)
 * and the editor form (FormPanel) so the shapes always match.
 * Colors are parameterized: defaults suit a light card (preview);
 * pass overrides for the dark form panel.
 */
export function ChecklistStatusIcon({
  status,
  size,
  fill = "#111111",
  check = "#ffffff",
  arc = "#1a1a1a",
  border = "#D1D5DB",
}: {
  status: ChecklistItem["status"];
  size: number;
  /** done: filled circle color */
  fill?: string;
  /** done: checkmark stroke color */
  check?: string;
  /** in-progress: arc stroke color */
  arc?: string;
  /** pending: ring border color */
  border?: string;
}) {
  if (status === "done") {
    const c = Math.round(size * 0.5625);
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%", background: fill, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width={c} height={c} viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke={check} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (status === "in-progress") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle
          cx="8" cy="8" r="6"
          stroke={arc}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 6 * 0.78} ${2 * Math.PI * 6 * 0.22}`}
          strokeDashoffset={2 * Math.PI * 6 * 0.06}
        />
      </svg>
    );
  }

  // pending — ring stroke matches the in-progress arc (strokeWidth 2 over a 16 viewBox)
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `${Math.max(1, Math.round(size * 0.125))}px solid ${border}`,
      flexShrink: 0,
    }} />
  );
}
