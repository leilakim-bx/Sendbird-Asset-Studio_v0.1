import { getConceptUiSample } from "./samples";
import type { SceneSpec } from "./scene-spec";

function compactPrompt(prompt: string): string {
  return prompt.toLowerCase();
}

export function chooseConceptUiSampleId(prompt: string): string {
  const p = compactPrompt(prompt);
  if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(prompt)) {
    if (p.includes("대시") || p.includes("성과") || p.includes("해결") || p.includes("지표")) {
      return "dashboard-deflection-ko";
    }
    return "inbox-customer-context-ko";
  }

  if (
    p.includes("metric") ||
    p.includes("dashboard") ||
    p.includes("insight") ||
    p.includes("analytics") ||
    p.includes("csat") ||
    p.includes("deflection") ||
    p.includes("score")
  ) {
    return "dashboard-csat";
  }

  if (p.includes("oversight") || p.includes("audit") || p.includes("policy") || p.includes("action")) {
    return "dashboard-ai-actions";
  }

  if (p.includes("ticket") || p.includes("convert") || p.includes("prefill") || p.includes("pre-fill")) {
    return "inbox-agent-action";
  }

  return "inbox-support-ticket";
}

export function buildSceneSpecFromPrompt(prompt: string): SceneSpec {
  return getConceptUiSample(chooseConceptUiSampleId(prompt));
}
