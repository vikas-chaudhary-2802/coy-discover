"use client";

import { useSyncExternalStore } from "react";
import CoyLogo from "./CoyLogo";
import TabBar, { type Tab } from "./TabBar";
import DiscoverView from "./discover/DiscoverView";

const TABS: Tab[] = ["home", "discover"];
const DEFAULT_TAB: Tab = "discover";

// The open tab lives in the URL hash (#home / #discover): reloads keep it and
// the browser back button switches tabs.
const subscribe = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};
const readTab = (): Tab => {
  const hash = window.location.hash.slice(1) as Tab;
  return TABS.includes(hash) ? hash : DEFAULT_TAB;
};

export default function AppShell() {
  const tab = useSyncExternalStore(subscribe, readTab, () => DEFAULT_TAB);
  const changeTab = (next: Tab) => {
    window.location.hash = next;
  };

  return (
    <div className="min-h-dvh bg-white sm:bg-surface">
      <div className="mx-auto flex h-dvh max-w-[440px] flex-col bg-white sm:border-x-2 sm:border-ink">
        <main className="relative min-h-0 flex-1">
          {/* Home is intentionally blank: it stands in for Coy's existing experience. */}
          <section hidden={tab !== "home"} aria-label="Home" className="h-full">
            <header className="flex h-16 items-center px-5">
              <CoyLogo />
            </header>
          </section>
          {/* Discover stays mounted so the deck and its state survive tab switches. */}
          <section hidden={tab !== "discover"} aria-label="Discover" className="h-full">
            <DiscoverView active={tab === "discover"} />
          </section>
        </main>
        <TabBar tab={tab} onChange={changeTab} />
      </div>
    </div>
  );
}
