import { PipelineSummary } from "@/components/pipeline/PipelineSummary";

export default function SalesPipelinePage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.022em] text-[var(--ink-900)] sm:text-2xl">
          Pipeline
        </h1>
        <p className="mt-1 text-[13px] text-[var(--ink-500)]">
          Your weighted forecast and conversion funnel.
        </p>
      </div>
      <PipelineSummary role="sales" />
    </div>
  );
}
