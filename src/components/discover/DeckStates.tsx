import { RefreshIcon, SparkleIcon } from "../icons";

export function DeckSkeleton() {
  return (
    <div className="flex h-full flex-col" aria-busy="true" aria-label="Loading profiles">
      <div className="relative mx-5 mt-2 mb-6 flex-1 animate-pulse rounded-[28px] border-2 border-line-strong bg-surface" />
      <div className="flex justify-center gap-6 pb-4">
        <div className="h-16 w-16 rounded-full bg-line" />
        <div className="h-[72px] w-[72px] rounded-full bg-line" />
      </div>
    </div>
  );
}

export function DeckError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <h2 className="text-2xl font-extrabold tracking-tight">Couldn&apos;t load profiles</h2>
      <p className="mt-2 text-[15px] text-muted">Check your connection and try again.</p>
      <button type="button" onClick={onRetry} className="btn-brut mt-6 rounded-full bg-pink px-6 py-3 font-bold">
        Try again
      </button>
    </div>
  );
}

export function DeckEmpty({
  matchCount,
  onViewMatches,
  onReset,
}: {
  matchCount: number;
  onViewMatches: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <span className="inline-flex -rotate-2 items-center gap-1.5 rounded-xl border-2 border-ink bg-yellow px-3 py-1 text-[14px] font-bold shadow-brut">
        <SparkleIcon size={16} />
        All caught up
      </span>
      <h2 className="mt-6 text-[32px] leading-[1.05] font-extrabold tracking-tight">
        You&apos;ve seen everyone for now.
      </h2>
      <p className="mt-3 max-w-[300px] text-[16px] text-muted">
        New people show up here as they join. Your likes stay secret unless they&apos;re mutual.
      </p>
      <button
        type="button"
        onClick={onViewMatches}
        className="btn-brut mt-7 w-full max-w-[280px] rounded-full bg-pink py-3.5 text-[17px] font-bold"
      >
        {matchCount > 0 ? `See your matches (${matchCount})` : "See your matches"}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <RefreshIcon size={15} />
        Reset demo data
      </button>
    </div>
  );
}
