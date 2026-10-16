"use client";

import { localRepository } from "@/lib/storage/lockin-store";
import type { CheckIn, Commitment, CommitmentDraft, GoalRule, LocalProfile, ProgressSummary } from "@/types/commitment";

const DAY = 86_400_000;
export const localToday = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};
const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const plusDays = (value: string, days: number) => { const date = parseDate(value); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); };
export const daysBetween = (from: string, to: string) => Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / DAY);
export const durationOf = (item: Pick<Commitment, "startDate" | "endDate">) => Math.max(1, daysBetween(item.startDate, item.endDate) + 1);
const targetFor = (rule: GoalRule) => rule.type === "daily" ? 1 : rule.target;
const periodStart = (date: string, rule: GoalRule, startDate: string) => {
  if (rule.type === "daily") return date;
  if (rule.type === "monthly") return `${date.slice(0, 7)}-01`;
  if (rule.type === "weekly") { const x = parseDate(date); return plusDays(date, -((x.getDay() + 6) % 7)); }
  return plusDays(startDate, Math.floor(Math.max(0, daysBetween(startDate, date)) / rule.windowDays) * rule.windowDays);
};
const periodEnd = (start: string, rule: GoalRule) => {
  if (rule.type === "daily") return start;
  if (rule.type === "weekly") return plusDays(start, 6);
  if (rule.type === "window") return plusDays(start, rule.windowDays - 1);
  const date = parseDate(start); return `${start.slice(0, 7)}-${new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate().toString().padStart(2, "0")}`;
};

export function getProgress(item: Commitment, onDate = localToday()): ProgressSummary {
  const durationDays = durationOf(item);
  const elapsedDays = onDate < item.startDate ? 0 : Math.min(durationDays, daysBetween(item.startDate, onDate) + 1);
  const reference = onDate < item.startDate ? item.startDate : onDate > item.endDate ? item.endDate : onDate;
  const start = periodStart(reference, item.goalRule, item.startDate);
  const end = periodEnd(start, item.goalRule);
  const periodProgress = item.checkIns.filter((x) => x.outcome === "kept" && x.date >= start && x.date <= end).length;
  const checkedToday = item.checkIns.some((x) => x.date === onDate);
  return { elapsedDays, durationDays, daysRemaining: Math.max(0, durationDays - elapsedDays), elapsedPercent: Math.round(elapsedDays / durationDays * 100), successfulCheckIns: item.checkIns.filter((x) => x.outcome === "kept").length, periodLabel: item.goalRule.type === "daily" ? "Today" : item.goalRule.type === "weekly" ? "This week" : item.goalRule.type === "monthly" ? "This month" : `${item.goalRule.windowDays}-day window`, periodProgress, periodTarget: targetFor(item.goalRule), eligibleToday: item.status === "active" && onDate >= item.startDate && onDate <= item.endDate, checkedToday };
}

function lifecycle(item: Commitment) {
  if (item.status !== "active") return item;
  const now = localToday();
  // MVP policy: once a complete rule period ends short of its target, a build
  // commitment fails. The active period is intentionally never judged early.
  if (item.kind === "build" && now > item.startDate) {
    const lastEligibleDay = now > item.endDate ? item.endDate : plusDays(now, -1);
    const start = periodStart(lastEligibleDay, item.goalRule, item.startDate);
    const end = periodEnd(start, item.goalRule);
    if (end <= lastEligibleDay && end <= item.endDate) {
      const count = item.checkIns.filter((entry) => entry.outcome === "kept" && entry.date >= start && entry.date <= end).length;
      if (count < targetFor(item.goalRule)) {
        const changedAt = new Date().toISOString();
        return { ...item, status: "broken" as const, brokenAt: changedAt, breakReason: "The goal target was not met in a completed period.", updatedAt: changedAt };
      }
    }
  }
  if (now <= item.endDate) return item;
  const final = getProgress(item, item.endDate);
  const successful = item.kind === "quit" || final.periodProgress >= final.periodTarget;
  const changedAt = new Date().toISOString();
  return { ...item, status: successful ? "completed" as const : "broken" as const, completedAt: successful ? changedAt : undefined, brokenAt: successful ? undefined : changedAt, breakReason: successful ? undefined : "The final goal period was not met.", updatedAt: changedAt };
}

const makeId = () => crypto.randomUUID();
export const commitmentService = {
  async load() {
    const session = await localRepository.getSession();
    if (!session) return { session: null, commitments: [] };
    const records = await localRepository.listCommitments(session.id);
    const commitments = await Promise.all(records.map(async (record) => { const next = lifecycle(record); if (next !== record) await localRepository.saveCommitment(next); return next; }));
    return { session, commitments };
  },
  async signIn(email: string, name: string) {
    const normalized = email.trim().toLowerCase(); if (!normalized) throw new Error("Enter an email address to continue.");
    const existing = await localRepository.findProfile(normalized); const now = new Date().toISOString();
    const profile: LocalProfile = existing ? { ...existing, name: name.trim() || existing.name, updatedAt: now } : { id: makeId(), email: normalized, name: name.trim() || normalized.split("@")[0], createdAt: now, updatedAt: now };
    await localRepository.saveProfile(profile); await localRepository.setSession(profile.id); return profile;
  },
  async signOut() { await localRepository.setSession(null); },
  async create(userId: string, draft: CommitmentDraft) {
    if (!draft.title.trim()) throw new Error("Give this commitment a name.");
    if (draft.endDate < draft.startDate) throw new Error("The end date must be after the start date.");
    if (targetFor(draft.goalRule) < 1) throw new Error("Your target must be at least one.");
    const now = new Date().toISOString();
    const item: Commitment = { ...draft, id: makeId(), userId, title: draft.title.trim(), description: draft.description?.trim(), reward: draft.reward.trim() || "A meaningful reward", status: "active", createdAt: now, updatedAt: now, checkIns: [] };
    return localRepository.saveCommitment(item);
  },
  async update(id: string, patch: Partial<Commitment>) { const item = await localRepository.getCommitment(id); if (!item) throw new Error("This commitment no longer exists."); return localRepository.saveCommitment({ ...item, ...patch, updatedAt: new Date().toISOString() }); },
  async remove(id: string) { await localRepository.deleteCommitment(id); },
  async checkIn(id: string, outcome: CheckIn["outcome"], note?: string, reason?: string) {
    const current = await localRepository.getCommitment(id); if (!current) throw new Error("This commitment no longer exists.");
    const item = lifecycle(current); if (item.status !== "active") throw new Error("This commitment is no longer active.");
    const date = localToday(); if (date < item.startDate || date > item.endDate) throw new Error("Check-ins are only available during the commitment timeline.");
    if (item.checkIns.some((x) => x.date === date)) throw new Error("Today has already been logged.");
    const entry: CheckIn = { id: makeId(), commitmentId: id, userId: item.userId, date, outcome, note: note?.trim() || undefined, reason, createdAt: new Date().toISOString() };
    const next: Commitment = outcome === "broken" ? { ...item, checkIns: [...item.checkIns, entry], status: "broken", brokenAt: entry.createdAt, breakReason: reason, updatedAt: entry.createdAt } : { ...item, checkIns: [...item.checkIns, entry], updatedAt: entry.createdAt };
    return localRepository.saveCommitment(next);
  },
  async clearAll() { await localRepository.clearAll(); },
};
