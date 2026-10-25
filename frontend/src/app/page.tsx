import { Suspense } from "react";
import type { Metadata } from "next";
import LockInApp from "./lockin-app";
import { LoadingScreen } from "./loading-screen";
import { JsonLd, appNode, websiteNode } from "@/lib/seo/json-ld";
import { PRODUCT, pageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = pageMetadata({
  title: "LockIn — Habit Tracker with Rewards to Build or Quit Habits",
  description: PRODUCT.summary,
  path: "/",
});

export default function Home() {
  return <><JsonLd graph={[websiteNode, appNode]} /><Suspense fallback={<LoadingScreen />}><LockInApp /></Suspense></>;
}
