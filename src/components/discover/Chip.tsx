const TONES = ["bg-yellow", "bg-mint", "bg-peach", "bg-lavender", "bg-sky", "bg-pink-soft"];

export default function Chip({ label, index = 0 }: { label: string; index?: number }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 border-ink px-2.5 py-0.5 text-[13px] font-semibold text-ink ${TONES[index % TONES.length]}`}
    >
      {label}
    </span>
  );
}
