import { Suspense } from "react";
import LockInApp from "../lockin-app";

function Loading() {
  return <main className="boot"><p>Preparing your focus space…</p></main>;
}

export default function CatchAllPage() {
  return <Suspense fallback={<Loading />}><LockInApp /></Suspense>;
}
