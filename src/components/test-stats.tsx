import { Clock } from "lucide-react";

function Stat({
  label,
  value,
  cls,
}: {
  label: string;
  value: number;
  cls: string;
}) {
  return (
    <div className={`rounded-lg p-2 text-center ${cls}`}>
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="text-[10px] mt-0.5 font-medium">{label}</div>
    </div>
  );
}

export function TestStatsSidebar({
  total,
  attempted,
  correct,
  wrong,
  totalTime,
  timeRemaining,
}: {
  total: number;
  attempted: number;
  correct: number;
  wrong: number;
  totalTime: string;
  timeRemaining: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3 lg:sticky lg:top-4">
      <div className="rounded-xl bg-primary/5 p-3 text-center">
        <div className="text-3xl font-bold leading-none">{total}</div>
        <div className="text-xs text-muted-foreground mt-1">Questions</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Attempted" value={attempted} cls="text-blue-700 bg-blue-50" />
        <Stat label="Correct" value={correct} cls="text-green-700 bg-green-50" />
        <Stat label="Wrong" value={wrong} cls="text-red-700 bg-red-50" />
      </div>

      <div className="rounded-xl border p-3 text-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total Time</span>
          <span className="font-medium">{totalTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Remaining
          </span>
          <span className="font-semibold tabular-nums">{timeRemaining}</span>
        </div>
      </div>
    </div>
  );
}
