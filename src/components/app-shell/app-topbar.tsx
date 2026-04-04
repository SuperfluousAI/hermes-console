export function AppTopbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 px-6 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-bricolage)] text-sm font-semibold tracking-tight text-fg-strong">
          Hermes Console
        </h1>

        <div className="flex items-center gap-3 font-[family-name:var(--font-jetbrains)] text-xs text-fg-faint">
          <span className="rounded-md bg-accent/10 px-2 py-1 text-accent">
            ~/.hermes
          </span>
          <span className="text-zinc-700">|</span>
          <span>all agents</span>
          <span className="text-zinc-700">|</span>
          <span>bootstrap</span>
        </div>
      </div>
    </header>
  );
}
