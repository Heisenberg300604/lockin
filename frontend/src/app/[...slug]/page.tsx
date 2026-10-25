import { Suspense } from "react";
import type { Metadata } from "next";
import LockInApp from "../lockin-app";
import { LoadingScreen } from "../loading-screen";

// Every URL that reaches the catch-all is either a signed-in app screen
// (/dashboard, /history, /commitments/…) or an unknown path, and all of them
// answer 200 with the same shell. Keep them all out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function CatchAllPage() {
  return <Suspense fallback={<LoadingScreen />}><LockInApp /></Suspense>;
}
