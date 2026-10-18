import { Suspense } from "react";
import LockInApp from "../lockin-app";
import { LoadingScreen } from "../loading-screen";

export default function CatchAllPage() {
  return <Suspense fallback={<LoadingScreen />}><LockInApp /></Suspense>;
}
