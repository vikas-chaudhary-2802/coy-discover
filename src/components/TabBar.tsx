import { CardsIcon, HomeIcon } from "./icons";

export type Tab = "home" | "discover";

const ITEMS: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "discover", label: "Discover", Icon: CardsIcon },
];

export default function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      aria-label="Main"
      className="grid grid-cols-2 gap-2 border-t-2 border-ink bg-white px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {ITEMS.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={active ? "page" : undefined}
            className={`flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-bold transition-colors ${
              active ? "btn-brut bg-pink text-ink" : "text-muted hover:text-ink"
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
