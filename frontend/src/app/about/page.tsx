import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, appNode, breadcrumbs, ids, websiteNode } from "@/lib/seo/json-ld";
import { PRODUCT, SITE_NAME, absoluteUrl, pageMetadata } from "@/lib/seo/site";

const TITLE = "What Is LockIn? A Habit Tracker for Building and Quitting Habits";
const DESCRIPTION = "How LockIn works: pick a habit to build or quit, set a 7 to 365-day timeline, check in daily as kept or broken, and finish with a reward you chose.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/about" });

// The public explainer that crawlers and AI assistants can read without running
// JavaScript. Every statement mirrors the shipped builder and the API's rules.
const STEPS = [
  { title: "Choose your path", copy: "Build a new habit, such as daily yoga, or quit one, such as fast food." },
  { title: "Name the target", copy: "Give the commitment a clear name and, if you like, a short description." },
  { title: "Set the timeline", copy: "Pick 7, 30, 45 or 90 days, or any custom length up to 365 days, starting today or later." },
  { title: "Set the rhythm", copy: "Build habits run every day or to a weekly target, such as three times a week. Quit habits are tracked every day." },
  { title: "Pick a reward", copy: "Choose what is waiting at the finish line: a good coffee, a favorite meal, or anything you type." },
  { title: "Review and lock it in", copy: "Confirm the rules. The timeline starts and the commitment appears on your dashboard." },
];

const FAQ = [
  { q: "What is LockIn?", a: PRODUCT.summary },
  { q: "Who is LockIn for?", a: PRODUCT.audience },
  { q: "Can I use LockIn to quit a bad habit?", a: "Yes. Choose the quit path, and each day you record whether you kept the commitment. A slip is recorded honestly with a reason, ends that commitment, and stays in your history; you can start a new one whenever you are ready." },
  { q: "What happens if I forget to check in?", a: "You can log a missed day as kept for up to two days afterwards from the check-in calendar. Older days can no longer be changed, so the record stays trustworthy." },
  { q: "How long can a commitment last?", a: "Anywhere from 1 to 365 days. The setup offers 7, 30, 45 and 90-day presets, and you can type any custom length." },
  { q: "Can I pause a commitment?", a: "Yes. Pausing keeps your history and does not count as a kept day. When you resume, the end date moves back by the number of days you were paused." },
  { q: "Can I change my reward later?", a: "Yes. While a commitment is active you can edit its reward whenever a better motivator comes to mind." },
  { q: "Does LockIn involve money or penalties?", a: "No. Unlike commitment-contract apps that put money at stake, LockIn motivates with a reward you choose for yourself and an honest record of each day." },
  { q: "Is my data private?", a: "Yes. Commitments and check-ins are stored in your own account, there is no social feed, and sign-in is handled by Clerk, so LockIn never receives or stores your password." },
  { q: "Do I need to install anything?", a: "No. LockIn is a web app that works in a modern browser on desktop and mobile." },
];

export default function AboutPage() {
  return <div className="guide">
    <JsonLd graph={[websiteNode, appNode, { "@type": "AboutPage", "@id": `${absoluteUrl("/about")}#webpage`, url: absoluteUrl("/about"), name: TITLE, description: DESCRIPTION, inLanguage: "en", isPartOf: { "@id": ids.website }, about: { "@id": ids.app }, mainEntity: { "@id": ids.app }, breadcrumb: breadcrumbs([{ name: SITE_NAME, path: "/" }, { name: "About", path: "/about" }]) }]} />
    <header className="guide-head"><Link href="/" className="brand" aria-label="LockIn home"><span>LockIn</span></Link><Link href="/" className="button guide-cta">OPEN LOCKIN</Link></header>
    <main>
      <article>
        <nav className="guide-crumbs" aria-label="Breadcrumb"><ol><li><Link href="/">Home</Link></li><li aria-current="page">About</li></ol></nav>
        <p className="eyebrow">ABOUT LOCKIN</p>
        <h1>What is LockIn?</h1>
        <p className="guide-lead">{PRODUCT.summary}</p>
        <p>Most habit trackers count an endless streak. LockIn gives every promise a finish line: a fixed timeline, a measurable rule, an honest daily record, and a reward you picked before you started.</p>

        <section aria-labelledby="who"><h2 id="who">Who is LockIn for?</h2><p>{PRODUCT.audience}</p></section>

        <section aria-labelledby="how"><h2 id="how">How LockIn works</h2><p>Setting up a commitment takes six short steps:</p><ol className="guide-steps">{STEPS.map((step) => <li key={step.title}><h3>{step.title}</h3><p>{step.copy}</p></li>)}</ol></section>

        <section aria-labelledby="checkins"><h2 id="checkins">Daily check-ins and honest records</h2><p>Each day you open the commitment and log what happened. For a habit you are building, you log the day as kept. For a habit you are quitting, you answer whether you kept your word; a slip is recorded with a reason and ends that commitment rather than being quietly erased. A calendar shows every day as logged, logged late, not logged or upcoming, and you can backfill the previous two days if you forgot.</p></section>

        <section aria-labelledby="different"><h2 id="different">What makes LockIn different</h2><ul className="guide-list"><li><b>A finish line, not a streak.</b> Every commitment has a start date, an end date and a clear rule for success.</li><li><b>Build and quit in one place.</b> Positive routines and patterns you want to break use the same simple flow.</li><li><b>Rewards, not penalties.</b> You choose the reward up front; no money is put at stake.</li><li><b>Honest by design.</b> Late logging is limited to two days, and broken commitments stay in your history.</li><li><b>Private by default.</b> No social feed, no public profile; your commitments belong to your account.</li></ul></section>

        <section aria-labelledby="faq"><h2 id="faq">Frequently asked questions</h2><div className="guide-faq">{FAQ.map((item) => <div key={item.q}><h3>{item.q}</h3><p>{item.a}</p></div>)}</div></section>

        <section className="guide-start" aria-labelledby="start"><h2 id="start">Start your first commitment</h2><p>Sign up, choose a habit to build or quit, and lock in your first promise in a couple of minutes.</p><Link href="/" className="button">LOCK IN A COMMITMENT →</Link></section>
      </article>
    </main>
    <footer className="guide-foot"><nav aria-label="Site"><Link href="/">LockIn app</Link><Link href="/about">About LockIn</Link></nav><p>LockIn — Keep promises to yourself.</p></footer>
  </div>;
}
