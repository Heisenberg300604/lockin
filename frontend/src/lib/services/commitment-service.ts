"use client";

import { localRepository } from "@/lib/storage/lockin-store";
import type { CheckIn, Commitment, CommitmentDraft, GoalRule, LockInStore, ProgressSummary } from "@/types/commitment";

const DAY = 86_400_000;
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "");
type TokenProvider = () => Promise<string | null>;
type Identity = { clerkId: string; email: string; name: string };
type ApiProfile = { id: string; clerkId: string; displayName: string | null };
type ApiCheckIn = { id: string; commitmentId: string; userId: string; date: string; outcome: "KEPT" | "BROKEN"; note: string | null; reason: string | null; createdAt: string; };
type ApiCommitment = { id: string; userId: string; title: string; description: string | null; kind: "BUILD" | "QUIT"; startDate: string; endDate: string; timeZone: string; ruleFrequency: "DAILY" | "WEEKLY" | "MONTHLY" | "WINDOW"; targetCount: number; windowDays: number | null; scheduledDays: number[]; reward: string; status: "ACTIVE" | "PAUSED" | "COMPLETED" | "BROKEN"; createdAt: string; updatedAt: string; completedAt: string | null; brokenAt: string | null; breakReason: string | null; checkIns?: ApiCheckIn[]; };
let getAccessToken: TokenProvider | null = null;
const accountCache = new Map<string, LockInStore>();
const accountLoads = new Map<string, Promise<LockInStore>>();
const commitmentLoads = new Map<string, Promise<Commitment>>();

export const localToday = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); };
const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const plusDays = (value: string, days: number) => { const date = parseDate(value); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); };
export const daysBetween = (from: string, to: string) => Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / DAY);
export const durationOf = (item: Pick<Commitment, "startDate" | "endDate">) => Math.max(1, daysBetween(item.startDate, item.endDate) + 1);
const targetFor = (rule: GoalRule) => rule.type === "daily" ? 1 : rule.target;
const maximumTargetFor = (rule: GoalRule) => rule.type === "daily" ? 1 : rule.type === "weekly" ? 7 : rule.type === "monthly" ? 31 : rule.windowDays;
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
const isoWeekday = (date: string) => { const day = parseDate(date).getDay(); return day === 0 ? 7 : day; };
const scheduledDaysFor = (rule: GoalRule) => rule.type === "weekly" ? rule.scheduledDays ?? [] : [];

export function getProgress(item: Commitment, onDate = localToday()): ProgressSummary {
  const durationDays = durationOf(item); const elapsedDays = onDate < item.startDate ? 0 : Math.min(durationDays, daysBetween(item.startDate, onDate) + 1); const reference = onDate < item.startDate ? item.startDate : onDate > item.endDate ? item.endDate : onDate; const start = periodStart(reference, item.goalRule, item.startDate); const end = periodEnd(start, item.goalRule); const scheduledDays = scheduledDaysFor(item.goalRule); const periodProgress = item.checkIns.filter((x) => x.outcome === "kept" && x.date >= start && x.date <= end).length; const checkedToday = item.checkIns.some((x) => x.date === onDate); const periodTarget = targetFor(item.goalRule); const periodSecured = periodProgress >= periodTarget; let remainingOpportunities = 0; for (let date = onDate > start ? onDate : start; date <= end && date <= item.endDate; date = plusDays(date, 1)) { if ((!scheduledDays.length || scheduledDays.includes(isoWeekday(date))) && !item.checkIns.some((entry) => entry.date === date)) remainingOpportunities += 1; } const periodState = periodSecured ? "secured" : periodProgress + remainingOpportunities < periodTarget ? "at-risk" : "on-track"; return { elapsedDays, durationDays, daysRemaining: Math.max(0, durationDays - elapsedDays), elapsedPercent: Math.round(elapsedDays / durationDays * 100), successfulCheckIns: item.checkIns.filter((x) => x.outcome === "kept").length, periodLabel: item.goalRule.type === "daily" ? "Today" : item.goalRule.type === "weekly" ? "This week" : item.goalRule.type === "monthly" ? "This month" : `${item.goalRule.windowDays}-day window`, periodProgress, periodTarget, periodSecured, periodState, eligibleToday: item.status === "active" && onDate >= item.startDate && onDate <= item.endDate && (!scheduledDays.length || scheduledDays.includes(isoWeekday(onDate))), checkedToday };
}

function toRule(item: ApiCommitment): GoalRule { if (item.ruleFrequency === "DAILY") return { type: "daily" }; if (item.ruleFrequency === "WEEKLY") return { type: "weekly", target: item.targetCount, ...(item.scheduledDays.length ? { scheduledDays: item.scheduledDays } : {}) }; if (item.ruleFrequency === "MONTHLY") return { type: "monthly", target: item.targetCount }; return { type: "window", target: item.targetCount, windowDays: item.windowDays ?? 1 }; }
function fromApi(item: ApiCommitment): Commitment { return { id: item.id, userId: item.userId, title: item.title, description: item.description ?? undefined, kind: item.kind.toLowerCase() as Commitment["kind"], startDate: item.startDate.slice(0, 10), endDate: item.endDate.slice(0, 10), timeZone: item.timeZone, goalRule: toRule(item), reward: item.reward, status: item.status.toLowerCase() as Commitment["status"], createdAt: item.createdAt, updatedAt: item.updatedAt, completedAt: item.completedAt ?? undefined, brokenAt: item.brokenAt ?? undefined, breakReason: item.breakReason ?? undefined, checkIns: (item.checkIns ?? []).map((entry) => ({ id: entry.id, commitmentId: entry.commitmentId, userId: entry.userId, date: entry.date.slice(0, 10), outcome: entry.outcome.toLowerCase() as CheckIn["outcome"], note: entry.note ?? undefined, reason: entry.reason ?? undefined, createdAt: entry.createdAt })), checkInsLoaded: item.checkIns !== undefined }; }
function toApiRule(rule: GoalRule) { if (rule.type === "daily") return { ruleFrequency: "DAILY", targetCount: 1 }; if (rule.type === "weekly") return { ruleFrequency: "WEEKLY", targetCount: rule.target, ...(rule.scheduledDays?.length ? { scheduledDays: rule.scheduledDays } : {}) }; if (rule.type === "monthly") return { ruleFrequency: "MONTHLY", targetCount: rule.target }; return { ruleFrequency: "WINDOW", targetCount: rule.target, windowDays: rule.windowDays }; }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken?.(); if (!token) throw new Error("Your session expired. Please sign in again.");
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers } });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null) as { message?: string } | T | null;
  if (!response.ok) throw new Error(body && typeof body === "object" && "message" in body && typeof body.message === "string" ? body.message : "The secure service could not complete that request.");
  return body as T;
}

function importPayload(item: Commitment) { return { legacyId: item.id, title: item.title, description: item.description, kind: item.kind.toUpperCase(), startDate: item.startDate, endDate: item.endDate, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", ...toApiRule(item.goalRule), reward: item.reward, status: item.status.toUpperCase(), completedAt: item.completedAt, brokenAt: item.brokenAt, breakReason: item.breakReason, createdAt: item.createdAt, updatedAt: item.updatedAt, checkIns: item.checkIns.map((entry) => ({ date: entry.date, outcome: entry.outcome.toUpperCase(), note: entry.note, reason: entry.reason, createdAt: entry.createdAt })) }; }

export const commitmentService = {
  configure(tokenProvider: TokenProvider | null) { getAccessToken = tokenProvider; },
  cachedStore(clerkId: string) { return accountCache.get(clerkId) ?? null; },
  cacheStore(store: LockInStore) { if (store.session) accountCache.set(store.session.id, store); },
  load(identity: Identity) { const inFlight = accountLoads.get(identity.clerkId); if (inFlight) return inFlight; const load = (async () => { try { const [profile, commitments] = await Promise.all([request<ApiProfile>("/me"), request<ApiCommitment[]>("/commitments?includeCheckIns=false")]); const serverProfile = profile.displayName ? profile : await request<ApiProfile>("/me", { method: "PATCH", body: JSON.stringify({ displayName: identity.name }) }); const cached = accountCache.get(identity.clerkId); const next: LockInStore = { session: { id: identity.clerkId, email: identity.email, name: serverProfile.displayName || identity.name, createdAt: "", updatedAt: "" }, commitments: commitments.map((item) => { const summary = fromApi(item); const previous = cached?.commitments.find((record) => record.id === summary.id); return previous?.checkInsLoaded && previous.updatedAt === summary.updatedAt ? { ...summary, checkIns: previous.checkIns, checkInsLoaded: true } : summary; }) }; accountCache.set(identity.clerkId, next); return next; } finally { accountLoads.delete(identity.clerkId); } })(); accountLoads.set(identity.clerkId, load); return load; },
  get(id: string) { const inFlight = commitmentLoads.get(id); if (inFlight) return inFlight; const load = request<ApiCommitment>(`/commitments/${id}`).then(fromApi).finally(() => commitmentLoads.delete(id)); commitmentLoads.set(id, load); return load; },
  async legacyImportSummary(identity: Identity) { try { if (await localRepository.getMeta(`legacy-import:${identity.clerkId}`)) return 0; const profile = await localRepository.findProfile(identity.email); if (!profile) return 0; return (await localRepository.listCommitments(profile.id)).length; } catch { return 0; } },
  async importLegacy(identity: Identity) { const profile = await localRepository.findProfile(identity.email); if (!profile) return { imported: 0, skipped: 0 }; const commitments = await localRepository.listCommitments(profile.id); const result = await request<{ imported: number; skipped: number }>("/commitments/import", { method: "POST", body: JSON.stringify({ commitments: commitments.map(importPayload) }) }); await localRepository.setMeta(`legacy-import:${identity.clerkId}`, new Date().toISOString()); return result; },
  async create(_userId: string, draft: CommitmentDraft) { if (!draft.title.trim()) throw new Error("Give this commitment a name."); if (draft.startDate < localToday()) throw new Error("Choose today or a future start date. Past dates cannot be checked in reliably."); if (draft.endDate < draft.startDate) throw new Error("The end date must be after the start date."); if (durationOf(draft) > 365) throw new Error("Keep a commitment within 365 days for this MVP."); if (!Number.isInteger(targetFor(draft.goalRule)) || targetFor(draft.goalRule) < 1) throw new Error("Your target must be a whole number of at least one."); if (targetFor(draft.goalRule) > maximumTargetFor(draft.goalRule)) throw new Error(`This goal cannot exceed ${maximumTargetFor(draft.goalRule)} successful days in its period.`); return fromApi(await request<ApiCommitment>("/commitments", { method: "POST", body: JSON.stringify({ title: draft.title.trim(), description: draft.description?.trim() || undefined, kind: draft.kind.toUpperCase(), startDate: draft.startDate, endDate: draft.endDate, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", ...toApiRule(draft.goalRule), reward: draft.reward.trim() || "A meaningful reward" }) })); },
  async update(id: string, patch: Pick<Partial<Commitment>, "title" | "description" | "reward">) { return fromApi(await request<ApiCommitment>(`/commitments/${id}`, { method: "PATCH", body: JSON.stringify(patch) })); },
  async pause(id: string) { return fromApi(await request<ApiCommitment>(`/commitments/${id}/pause`, { method: "POST" })); },
  async resume(id: string) { return fromApi(await request<ApiCommitment>(`/commitments/${id}/resume`, { method: "POST" })); },
  async remove(id: string) { await request<void>(`/commitments/${id}`, { method: "DELETE" }); },
  async checkIn(id: string, outcome: CheckIn["outcome"], note?: string, reason?: string, date?: string) { await request<ApiCheckIn>(`/commitments/${id}/check-ins`, { method: "POST", body: JSON.stringify({ outcome: outcome.toUpperCase(), date, note: note?.trim() || undefined, reason: reason?.trim() || undefined }) }); },
  async updateProfile(displayName: string) { return request<ApiProfile>("/me", { method: "PATCH", body: JSON.stringify({ displayName }) }); },
  async clearLocalCache() { await localRepository.clearAll(); },
};
