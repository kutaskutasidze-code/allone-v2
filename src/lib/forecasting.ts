// Pipeline stage model + weighted forecast. Shared by the pipeline API (types) and
// the funnel UI (config + calc), so the stage taxonomy + win-probabilities live in
// exactly one place.

export const PIPELINE_STAGES = [
  'in_process',
  'interested',
  'proposal',
  'on_hold',
  'won',
  'lost',
] as const;

export type PipelineStatus = (typeof PIPELINE_STAGES)[number];

// Open, in-flight stages — the basis of the "expected to close" headline.
// 'won' is already closed (shown separately); 'lost' is dead.
export const OPEN_STAGES: PipelineStatus[] = [
  'in_process',
  'interested',
  'proposal',
  'on_hold',
];

// The forward progression the funnel narrows along.
export const FUNNEL_PATH: PipelineStatus[] = [
  'in_process',
  'interested',
  'proposal',
  'won',
];

// Off-path stages shown as side stats — everything not on the funnel path, so a
// new stage auto-lands here (visible) rather than silently vanishing.
export const SIDE_STAGES: PipelineStatus[] = PIPELINE_STAGES.filter(
  (s) => !FUNNEL_PATH.includes(s),
);

// Hardcoded per-stage win probability for the weighted projection.
export const STAGE_WIN_PROBABILITIES: Record<PipelineStatus, number> = {
  in_process: 0.15,
  interested: 0.4,
  proposal: 0.7,
  on_hold: 0.1,
  won: 1,
  lost: 0,
};

export interface PipelineStageData {
  status: PipelineStatus;
  count: number;
  totalValue: number;
}

export function stageWeightedValue(
  status: PipelineStatus,
  totalValue: number,
): number {
  return totalValue * STAGE_WIN_PROBABILITIES[status];
}

// Weighted "expected to close" — open stages only.
export function weightedForecast(stages: PipelineStageData[]): number {
  return stages
    .filter((s) => OPEN_STAGES.includes(s.status))
    .reduce((sum, s) => sum + stageWeightedValue(s.status, s.totalValue), 0);
}
