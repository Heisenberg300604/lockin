"use client";

import type { Commitment, LocalProfile } from "@/types/commitment";

const DB_NAME = "lockin-mvp";
const DB_VERSION = 1;
const PROFILE_STORE = "profiles";
const COMMITMENT_STORE = "commitments";
const META_STORE = "meta";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB is not available in this browser."));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        const profiles = db.createObjectStore(PROFILE_STORE, { keyPath: "id" });
        profiles.createIndex("email", "email", { unique: true });
      }
      if (!db.objectStoreNames.contains(COMMITMENT_STORE)) {
        const commitments = db.createObjectStore(COMMITMENT_STORE, { keyPath: "id" });
        commitments.createIndex("userId", "userId", { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open local data."));
  });
}

function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => { value.onsuccess = () => resolve(value.result); value.onerror = () => reject(value.error ?? new Error("A local data operation failed.")); });
}

export const localRepository = {
  async getMeta(key: string) {
    const db = await openDb();
    const saved = await request<{ key: string; value: string } | undefined>(
      db.transaction(META_STORE).objectStore(META_STORE).get(key),
    );
    return saved?.value ?? null;
  },
  async setMeta(key: string, value: string) {
    const db = await openDb();
    await request(
      db.transaction(META_STORE, "readwrite").objectStore(META_STORE).put({ key, value }),
    );
  },
  async getSession(): Promise<LocalProfile | null> {
    const db = await openDb(); const tx = db.transaction([META_STORE, PROFILE_STORE], "readonly");
    const saved = await request<{ key: string; value: string } | undefined>(tx.objectStore(META_STORE).get("session"));
    if (!saved?.value) return null;
    return (await request<LocalProfile | undefined>(tx.objectStore(PROFILE_STORE).get(saved.value))) ?? null;
  },
  async setSession(profileId: string | null) {
    const db = await openDb(); const store = db.transaction(META_STORE, "readwrite").objectStore(META_STORE);
    if (profileId) await request(store.put({ key: "session", value: profileId })); else await request(store.delete("session"));
  },
  async findProfile(email: string) {
    const db = await openDb(); return (await request<LocalProfile | undefined>(db.transaction(PROFILE_STORE).objectStore(PROFILE_STORE).index("email").get(email.toLowerCase()))) ?? null;
  },
  async saveProfile(profile: LocalProfile) { const db = await openDb(); await request(db.transaction(PROFILE_STORE, "readwrite").objectStore(PROFILE_STORE).put(profile)); return profile; },
  async listCommitments(userId: string) { const db = await openDb(); const rows = await request<Commitment[]>(db.transaction(COMMITMENT_STORE).objectStore(COMMITMENT_STORE).index("userId").getAll(userId)); return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  async getCommitment(id: string) { const db = await openDb(); return (await request<Commitment | undefined>(db.transaction(COMMITMENT_STORE).objectStore(COMMITMENT_STORE).get(id))) ?? null; },
  async saveCommitment(item: Commitment) { const db = await openDb(); await request(db.transaction(COMMITMENT_STORE, "readwrite").objectStore(COMMITMENT_STORE).put(item)); return item; },
  async deleteCommitment(id: string) { const db = await openDb(); await request(db.transaction(COMMITMENT_STORE, "readwrite").objectStore(COMMITMENT_STORE).delete(id)); },
  async clearAll() { const db = await openDb(); const tx = db.transaction([PROFILE_STORE, COMMITMENT_STORE, META_STORE], "readwrite"); await Promise.all([request(tx.objectStore(PROFILE_STORE).clear()), request(tx.objectStore(COMMITMENT_STORE).clear()), request(tx.objectStore(META_STORE).clear())]); },
};
