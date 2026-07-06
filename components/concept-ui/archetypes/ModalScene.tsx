"use client";

import { BookOpen, Bot, CheckCircle2, Database, FileText, MessageSquare, Sparkles, UserRound, X } from "lucide-react";
import type { ModalSceneSpec } from "@/lib/concept-ui/scene-spec";
import { conceptSceneTokens as t } from "@/lib/concept-ui/scene-tokens";
import { hasReusableBlocks, ReusableBlockStack } from "../blocks/ReusableBlockCards";
import { Card, EllipsisText, Pill, Slot } from "../primitives";

type Props = {
  spec: ModalSceneSpec;
};

function productEyebrow(value: string): string {
  if (/pre[-\s]?filled/i.test(value)) return "Ready to review";
  return value;
}

function productCallout(callout: ModalSceneSpec["modifiers"]["aiCallout"]) {
  if (!callout) return undefined;
  return {
    ...callout,
    label: /pre[-\s]?filled/i.test(callout.label) ? "Generated draft" : callout.label,
  };
}

function fieldValue(content: ModalSceneSpec["content"], label: string): string {
  return content.modal.fields.find((field) => field.label.toLowerCase() === label.toLowerCase())?.value ?? "";
}

function fieldSlotValue(content: ModalSceneSpec["content"], slotId: string): string {
  return content.modal.fields.find((field) => field.slotId === slotId)?.value ?? "";
}

function sourceParts(value: string): { label: string; match: string } {
  const [label, match] = value.split("|").map((part) => part.trim());
  return { label: label || value, match: match || "" };
}

const responseSourceIconComponents = {
  document: FileText,
  knowledge: BookOpen,
  customer: UserRound,
  data: Database,
  conversation: MessageSquare,
} as const;

type ResponseSourceIconId = keyof typeof responseSourceIconComponents;

function responseSourceIconId(value: string): ResponseSourceIconId {
  return value in responseSourceIconComponents ? (value as ResponseSourceIconId) : "document";
}

function responseSourceRows(content: ModalSceneSpec["content"]) {
  return [1, 2]
    .map((index) => {
      const source = content.modal.fields.find((field) => field.slotId === `moment-source-${index}`);
      if (!source) return null;
      return {
        ...sourceParts(source.value),
        icon: responseSourceIconId(fieldSlotValue(content, `moment-source-${index}-icon`)),
      };
    })
    .filter((source): source is { label: string; match: string; icon: ResponseSourceIconId } => Boolean(source));
}

function isResponseMoment(content: ModalSceneSpec["content"]): boolean {
  return content.modal.slotId === "moment-ai-response";
}

function isApprovalMoment(content: ModalSceneSpec["content"]): boolean {
  return content.modal.slotId === "moment-approval";
}

function MomentResponseCard({ spec }: Props) {
  const { content } = spec;
  const reviewer = fieldValue(content, "Reviewer") || "Reviewer";
  const response = fieldValue(content, "Response") || content.modal.description;
  const showReviewer = fieldSlotValue(content, "moment-show-reviewer") !== "false";
  // Missing toggle slots (older saved specs) default to visible.
  const showSources = fieldSlotValue(content, "moment-show-sources") !== "false";
  const showButtons = fieldSlotValue(content, "moment-show-buttons") !== "false";
  const sources = responseSourceRows(content);
  const cardType = t.momentResponse;
  const study = cardType.study;

  return (
    <Card
      primaryPanel
      style={{
        width: study.frame.width,
        // With a section hidden the card hugs its content instead of keeping
        // the full-frame height (which would leave a blank band at the bottom).
        ...(showSources && showButtons
          ? { minHeight: showReviewer ? study.frame.height : study.frame.heightWithoutReviewer }
          : {}),
        boxSizing: "border-box",
        border: 0,
        borderRadius: study.card.radius,
        overflow: "hidden",
        boxShadow: t.shadow.none,
      }}
    >
      <div
        style={{
          padding: `${study.card.paddingTop}px ${study.card.paddingX}px ${study.card.paddingBottom}px`,
        }}
      >
        <EllipsisText style={{ ...cardType.title, color: t.color.text }}>
          {content.modal.title}
        </EllipsisText>

        {showReviewer ? (
          <div
            style={{
              marginTop: study.meta.top,
              display: "flex",
              alignItems: "center",
              gap: study.meta.gap,
              color: t.color.text,
            }}
          >
            <EllipsisText style={cardType.metaLabel}>Reviewer</EllipsisText>
            <div
              aria-hidden
              style={{
                width: study.meta.avatar,
                height: study.meta.avatar,
                borderRadius: t.radius.full,
                background: t.color.surfaceStrong,
                boxShadow: `0 0 0 1px ${t.color.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/preview/Avatar/Woman-08.png"
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: "cover",
                }}
              />
            </div>
            <EllipsisText style={{ ...cardType.metaValue, color: t.color.text }}>
              {reviewer}
            </EllipsisText>
          </div>
        ) : null}

        <Slot
          id="moment-response"
          highlighted={spec.modifiers.highlightedSlotId === "moment-response"}
          style={{
            marginTop: showReviewer ? study.responseBox.top : study.meta.top,
            minHeight: study.responseBox.minHeight,
            borderRadius: study.responseBox.radius,
            border: `${study.responseBox.borderWidth}px solid ${t.color.border}`,
            background: t.color.app,
            boxSizing: "border-box",
            padding: `${study.responseBox.paddingY}px ${study.responseBox.paddingX}px`,
          }}
        >
          <EllipsisText lines={3} style={{ ...cardType.response, color: t.color.text }}>
            {response}
          </EllipsisText>
        </Slot>

        {showSources ? (
        <div
          style={{
            marginTop: study.evidence.top,
            borderRadius: study.evidence.radius,
            background: t.color.evidenceSurface,
            padding: `${study.evidence.paddingTop}px ${study.evidence.paddingX}px ${study.evidence.paddingBottom}px`,
          }}
        >
          <EllipsisText style={{ ...cardType.evidenceHeading, color: t.color.text }}>
            Knowledge sources used
          </EllipsisText>
          <div style={{ marginTop: study.evidence.rowsTop, display: "grid", gap: study.evidence.rowGap }}>
            {sources.slice(0, 2).map((source, index) => (
              <div key={`${index}-${source.label}`} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 24, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
                  {(() => {
                    const Icon = responseSourceIconComponents[source.icon];
                    return <Icon size={study.evidence.iconSize} color={t.color.text} strokeWidth={1.9} />;
                  })()}
                  <EllipsisText style={{ ...cardType.evidenceLabel, color: t.color.text, textDecoration: "underline" }}>
                    {source.label}
                  </EllipsisText>
                </div>
                {source.match ? (
                  <EllipsisText style={{ ...cardType.evidenceMatch, color: t.color.success }}>
                    {source.match}
                  </EllipsisText>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        ) : null}

        {showButtons ? (
        <div style={{ marginTop: study.actions.top, display: "flex", justifyContent: "flex-end", gap: study.actions.gap }}>
          {content.modal.actions.map((action) => (
            <button
              key={action.label}
              type="button"
              style={{
                border: action.tone === "primary" ? 0 : `2px solid ${t.color.borderStrong}`,
                borderRadius: study.actions.radius,
                background: action.tone === "primary" ? t.color.ink : t.color.app,
                color: action.tone === "primary" ? t.color.inverse : t.color.text,
                minHeight: study.actions.height,
                padding: `0 ${study.actions.paddingX}px`,
                fontSize: cardType.button.fontSize,
                fontWeight: action.tone === "primary" ? cardType.button.primaryWeight : cardType.button.secondaryWeight,
                lineHeight: cardType.button.lineHeight,
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
        ) : null}
      </div>
    </Card>
  );
}

function MomentApprovalCard({ spec }: Props) {
  const { content } = spec;
  const actionTrail = content.actionTrails?.[0];
  const approvalType = t.momentApproval;
  const details = approvalType.details;
  const signal = [
    content.title,
    content.modal.title,
    content.modal.description,
    actionTrail?.steps.map((step) => step.label).join(" "),
    actionTrail?.gate?.title,
  ].filter(Boolean).join(" ");
  const isBooking = /booking|flight|rebook|reservation|itinerary|항공|예약/i.test(signal);
  const isBilling = /billing|refund|payment|charge|dispute|환불|결제/i.test(signal);
  const panelTitle = /^(action approval|#\d+\s+billing dispute)$/i.test(content.modal.title)
    ? "Steward details"
    : content.modal.title;
  const defaultInfoRows = {
    type: isBooking ? "Flight cancellation — multi-step" : isBilling ? "Billing dispute — review" : "Customer request — multi-step",
    name: isBooking || isBilling ? "Refund Approval Request" : "Resolution Review Request",
    status: "RESOLUTION",
    time: isBooking ? "12 minutes" : "8 minutes",
  };
  const infoRows = [
    {
      label: "Type",
      value: fieldSlotValue(content, "moment-detail-type") || defaultInfoRows.type,
    },
    {
      label: "Name",
      value: fieldSlotValue(content, "moment-detail-name") || defaultInfoRows.name,
    },
    {
      label: "Status",
      value: fieldSlotValue(content, "moment-detail-status") || defaultInfoRows.status,
      badge: true,
    },
    {
      label: "Task handling time",
      value: fieldSlotValue(content, "moment-detail-time") || defaultInfoRows.time,
    },
  ];
  const defaultActivityRows = isBooking
    ? [
        { tag: "Steward triggered", text: "Flight cancellation workflow initiated" },
        { tag: "API call", text: "Booking system — reservation pulled, policy check..." },
        { tag: "Voice call", text: "United Airlines rebooking desk — call duration 3:42" },
        { tag: "Email sent", text: "Marriott Denver — extension confirmed for Jun 5", muted: true },
      ]
    : [
        { tag: "Steward triggered", text: "Customer resolution workflow initiated" },
        { tag: "Policy check", text: actionTrail?.steps[0]?.label ?? "Customer context and policy evidence reviewed" },
        { tag: "AI prepared", text: actionTrail?.steps[1]?.label ?? "Next action prepared for review" },
        { tag: "Agent review", text: "Final decision queued for a teammate", muted: true },
      ];
  // Editor-managed specs carry activity rows as slots; a fully cleared row is
  // omitted from the spec and dropped here. The fixed tail row only follows
  // when at least one edited row remains. Specs without any activity slots
  // (older/imported) keep the full default trail.
  const hasActivityFields = content.modal.fields.some((field) => field.slotId?.startsWith("moment-activity-"));
  const editedActivityRows = defaultActivityRows.slice(0, 3).flatMap((row, index) => {
    const slotIndex = index + 1;
    const tag = fieldSlotValue(content, `moment-activity-${slotIndex}-tag`);
    const text = fieldSlotValue(content, `moment-activity-${slotIndex}-text`);
    if (!tag && !text) return [];
    return [{ ...row, tag, text }];
  });
  const showActivity = fieldSlotValue(content, "moment-show-activity") !== "false";
  const activityRows = !showActivity
    ? []
    : hasActivityFields
      ? (editedActivityRows.length > 0 ? [...editedActivityRows, ...defaultActivityRows.slice(3)] : [])
      : defaultActivityRows;
  const showInformation = fieldSlotValue(content, "moment-show-information") !== "false";
  const activityMetrics = showInformation
    ? details.activity
    : { ...details.activity, ...details.activity.timelineOnly };
  const timelineMetrics = showInformation
    ? details.timeline
    : { ...details.timeline, ...details.timeline.timelineOnly };

  return (
    <div
      data-concept-primary-panel="true"
      data-concept-crop-bounds="true"
      style={{
        width: details.frame.width,
        height: details.frame.height,
        overflow: "hidden",
        borderRadius: details.panel.radius,
        background: t.color.app,
        boxShadow: t.shadow.none,
        fontFamily: t.font.sans,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: details.header.gap,
          padding: `${details.header.paddingTop}px ${details.panel.paddingX}px ${details.header.paddingBottom}px`,
        }}
      >
        <EllipsisText style={{ ...details.header.title, color: t.color.text }}>
          {panelTitle}
        </EllipsisText>
        <X aria-hidden size={details.header.iconSize} color={t.color.text} strokeWidth={details.header.iconStrokeWidth} />
      </div>
      <div
        style={{
          height: 1,
          background: t.color.border,
        }}
      />
      <div style={{ padding: `${details.content.paddingTop}px ${details.panel.paddingX}px ${details.panel.paddingBottom}px` }}>
        {showInformation ? (
          <section>
            <EllipsisText style={{ ...details.sectionTitle, color: t.color.text }}>
              Information
            </EllipsisText>
            <div style={{ marginTop: details.info.top, display: "grid", gap: details.info.rowGap }}>
              {infoRows.map((row) => (
                <div key={row.label} style={{ display: "grid", gridTemplateColumns: `${details.info.labelWidth}px minmax(0, 1fr)`, gap: details.info.gap, alignItems: "center" }}>
                  <EllipsisText style={{ ...details.info.label, color: t.color.muted }}>
                    {row.label}
                  </EllipsisText>
                  {row.badge ? (
                    <span
                      style={{
                        justifySelf: "start",
                        borderRadius: details.badge.radius,
                        background: t.color.goodSoft,
                        color: t.color.goodText,
                        minHeight: details.badge.height,
                        display: "inline-flex",
                        alignItems: "center",
                        padding: `0 ${details.badge.paddingX}px`,
                        fontSize: details.badge.fontSize,
                        fontWeight: details.badge.fontWeight,
                        lineHeight: t.typography.lineHeight.compact,
                        letterSpacing: details.badge.letterSpacing,
                      }}
                    >
                      {row.value}
                    </span>
                  ) : (
                    <EllipsisText style={{ ...details.info.value, color: t.color.text }}>
                      {row.value}
                    </EllipsisText>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activityRows.length > 0 ? (
        <section style={{ marginTop: activityMetrics.sectionTop }}>
          {showInformation ? (
            <EllipsisText style={{ ...details.sectionTitle, color: t.color.text }}>
              Activity
            </EllipsisText>
          ) : null}
          <Slot
            id={actionTrail?.slotId ?? "moment-action-trail"}
            style={{
              marginTop: showInformation ? activityMetrics.top : 0,
              display: "grid",
              gap: activityMetrics.rowGap,
            }}
          >
            {activityRows.map((row, index) => (
              <div
                key={`${index}-${row.tag}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: `${timelineMetrics.columnWidth}px minmax(0, 1fr)`,
                  gap: timelineMetrics.gap,
                  minHeight: activityMetrics.rowMinHeight,
                  opacity: row.muted ? activityMetrics.mutedOpacity : 1,
                }}
              >
                <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                  <span
                    aria-hidden
                    style={{
                      position: "relative",
                      zIndex: 1,
                      marginTop: timelineMetrics.dotTop,
                      width: timelineMetrics.dot,
                      height: timelineMetrics.dot,
                      borderRadius: t.radius.full,
                      background: row.muted ? t.color.borderStrong : t.color.ink,
                    }}
                  />
                  {index < activityRows.length - 1 ? (
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        top: timelineMetrics.lineTop,
                        bottom: -activityMetrics.rowGap,
                        borderLeft: `1px dashed ${t.color.borderStrong}`,
                      }}
                    />
                  ) : null}
                </div>
                <div style={{ minWidth: 0 }}>
                  {row.tag ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: activityMetrics.tagHeight,
                      borderRadius: activityMetrics.tagRadius,
                      background: t.color.surfaceStrong,
                      color: t.color.text,
                      padding: `0 ${activityMetrics.tagPaddingX}px`,
                      fontSize: activityMetrics.tagFontSize,
                      fontWeight: activityMetrics.tagWeight,
                      lineHeight: t.typography.lineHeight.compact,
                    }}
                  >
                    {row.tag}
                  </span>
                  ) : null}
                  {row.text ? (
                  <EllipsisText
                    lines={2}
                    style={{
                      marginTop: row.tag ? activityMetrics.textTop : 0,
                      fontSize: activityMetrics.textFontSize,
                      fontWeight: activityMetrics.textWeight,
                      lineHeight: activityMetrics.textLineHeight,
                      color: t.color.text,
                    }}
                  >
                    {row.text}
                  </EllipsisText>
                  ) : null}
                </div>
              </div>
            ))}
          </Slot>
        </section>
        ) : null}
      </div>
    </div>
  );
}

export function ModalScene({ spec }: Props) {
  const { content } = spec;
  if (isResponseMoment(content)) return <MomentResponseCard spec={spec} />;
  if (isApprovalMoment(content)) return <MomentApprovalCard spec={spec} />;

  const callout = productCallout(spec.modifiers.aiCallout);
  const cursor = spec.modifiers.cursor;
  const hasBlocks = hasReusableBlocks(content);
  const calloutOnModal = callout?.targetSlotId === content.modal.slotId;

  return (
    <div
      style={{
        position: "relative",
        width: 1370,
        height: 790,
        borderRadius: t.radius.md,
        overflow: "hidden",
        background: t.color.page,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          background: t.color.surface,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 58,
            filter: "blur(7px)",
            opacity: 0.12,
            transform: "scale(1.02)",
          }}
        >
          <div
            style={{
              height: 54,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 10px",
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: t.radius.sm, background: t.color.border }} />
            <div style={{ width: 240, height: 18, borderRadius: t.radius.sm, background: t.color.border }} />
            <div style={{ marginLeft: "auto", width: 120, height: 30, borderRadius: t.radius.sm, background: t.color.border }} />
          </div>
          <div style={{ marginTop: 42, display: "grid", gridTemplateColumns: "260px 1fr", gap: 36, minHeight: 0 }}>
            <div
              style={{
                minHeight: 540,
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {content.background.items.slice(0, 5).map((item, index) => (
                <div key={`${index}-${item}`} style={{ height: 54, borderRadius: t.radius.md, background: index === 0 ? t.color.aiSoft : t.color.app }} />
              ))}
            </div>
            <div style={{ padding: 10, display: "grid", gridTemplateRows: "repeat(4, 86px)", gap: 18 }}>
              {content.background.items.slice(0, 4).map((item, index) => (
                <div key={`${index}-${item}`} style={{ borderRadius: t.radius.md, background: t.color.app }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: t.overlay.modal,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        <Card
          primaryPanel
          style={{
            width: calloutOnModal ? 980 : 820,
            minHeight: 520,
            borderRadius: 30,
            boxShadow: t.shadow.modal,
            overflow: "visible",
          }}
        >
          <Slot
            id={content.modal.slotId}
            callout={callout}
            cursor={cursor}
            popover={calloutOnModal ? "inside-right" : "right"}
            style={{ padding: 34, paddingRight: calloutOnModal ? 360 : 34, borderRadius: 30 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
              <Pill tone={content.modal.kind === "ai-result" ? "ai" : "neutral"}>{productEyebrow(content.modal.eyebrow)}</Pill>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: content.modal.kind === "ai-result" ? t.color.aiSoft : t.color.surface,
                  color: t.color.ink,
                }}
              >
                {content.modal.kind === "confirmation" ? <CheckCircle2 size={22} /> : <Sparkles size={22} />}
              </div>
            </div>
            <EllipsisText style={{ marginTop: 22, fontSize: 36, fontWeight: t.font.weight.semibold, color: t.color.text }}>
              {content.modal.title}
            </EllipsisText>
            <EllipsisText lines={3} style={{ marginTop: 13, fontSize: 20, lineHeight: 1.42, color: t.color.muted }}>
              {content.modal.description}
            </EllipsisText>

            {hasBlocks ? (
              <ReusableBlockStack
                {...content}
                callout={callout}
                cursor={cursor}
                compact
                max={1}
                style={{ marginTop: 24, boxShadow: t.shadow.none }}
              />
            ) : (
              <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 13 }}>
                {content.modal.fields.map((field) => (
                  <Slot
                    key={field.slotId}
                    id={field.slotId}
                    callout={callout}
                    cursor={cursor}
                    popover="left"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "145px 1fr",
                      gap: 18,
                      alignItems: "center",
                      borderRadius: 16,
                      background: t.color.surface,
                      border: `1px solid ${t.color.border}`,
                      padding: "15px 18px",
                    }}
                  >
                    <EllipsisText style={{ fontSize: 14, fontWeight: t.font.weight.semibold, color: t.color.faint }}>
                      {field.label}
                    </EllipsisText>
                    <EllipsisText style={{ fontSize: 17, fontWeight: t.font.weight.semibold, color: t.color.text }}>
                      {field.value}
                    </EllipsisText>
                  </Slot>
                ))}
              </div>
            )}

            <div style={{ marginTop: 30, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              {content.modal.actions.map((action, index) => (
                <button
                  key={`${index}-${action.label}`}
                  type="button"
                  style={{
                    border: action.tone === "primary" ? 0 : `1px solid ${t.color.border}`,
                    borderRadius: 16,
                    background: action.tone === "primary" ? t.color.ink : t.color.surface,
                    color: action.tone === "primary" ? t.color.inverse : t.color.text,
                    minWidth: 132,
                    minHeight: 48,
                    padding: "0 18px",
                    fontSize: 16,
                    fontWeight: t.font.weight.semibold,
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8, color: t.color.muted, fontSize: 14 }}>
              <Bot size={16} />
              {content.subtitle}
            </div>
          </Slot>
        </Card>
      </div>
    </div>
  );
}
