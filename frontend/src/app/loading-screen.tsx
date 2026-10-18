// The product is a padlock: the loader is that padlock closing, not a spinner.
// No hooks and no client state, so the same component serves the server-rendered
// Suspense fallbacks and the in-app loading states.
export function LoadingScreen({ label = "Preparing your focus space" }: { label?: string }) {
  return (
    <main className="boot loading-screen" aria-busy="true">
      <svg className="loader-lock" viewBox="0 0 64 78" aria-hidden="true">
        <rect className="loader-lock-shadow" x="13.5" y="37.5" width="44" height="34" rx="4" />
        <path className="loader-lock-shackle" d="M21 36V23a11 11 0 0 1 22 0v13" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        <rect className="loader-lock-body" x="10" y="34" width="44" height="34" rx="4" />
        <circle className="loader-lock-pin" cx="32" cy="47" r="4" />
        <path className="loader-lock-keyhole" d="M32 50.5v6" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      </svg>
      <p className="loader-word" aria-hidden="true">LockIn</p>
      <div className="loader-track" aria-hidden="true">{[0, 1, 2, 3, 4].map((segment) => <i key={segment} />)}</div>
      <p className="loader-label" role="status">{label}…</p>
    </main>
  );
}
