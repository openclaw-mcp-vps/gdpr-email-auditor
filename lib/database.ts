import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { AuditReport, ContactRecord, PurchaseRecord, UploadedDataset } from "@/types/audit";

interface PersistedStore {
  datasets: UploadedDataset[];
  audits: AuditReport[];
  purchases: PurchaseRecord[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "gdpr-email-auditor.json");

function getDefaultStore(): PersistedStore {
  return {
    datasets: [],
    audits: [],
    purchases: []
  };
}

function ensureStore(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(getDefaultStore(), null, 2), "utf8");
  }
}

function readStore(): PersistedStore {
  ensureStore();
  const raw = fs.readFileSync(DATA_FILE, "utf8");

  if (!raw.trim()) {
    return getDefaultStore();
  }

  try {
    const parsed = JSON.parse(raw) as PersistedStore;
    return {
      datasets: parsed.datasets ?? [],
      audits: parsed.audits ?? [],
      purchases: parsed.purchases ?? []
    };
  } catch {
    return getDefaultStore();
  }
}

function writeStore(store: PersistedStore): void {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

export function saveDataset(filename: string, contacts: ContactRecord[]): UploadedDataset {
  const store = readStore();

  const dataset: UploadedDataset = {
    id: randomUUID(),
    filename,
    uploadedAt: new Date().toISOString(),
    totalContacts: contacts.length,
    contacts
  };

  store.datasets.unshift(dataset);
  store.datasets = store.datasets.slice(0, 30);
  writeStore(store);

  return dataset;
}

export function getDataset(datasetId: string): UploadedDataset | null {
  const store = readStore();
  return store.datasets.find((entry) => entry.id === datasetId) ?? null;
}

export function saveAudit(report: AuditReport): AuditReport {
  const store = readStore();
  store.audits.unshift(report);
  store.audits = store.audits.slice(0, 100);
  writeStore(store);
  return report;
}

export function getLatestAudit(): AuditReport | null {
  const store = readStore();
  return store.audits[0] ?? null;
}

export function getRecentAudits(limit = 10): AuditReport[] {
  const store = readStore();
  return store.audits.slice(0, limit);
}

export function upsertPaidSession(purchase: PurchaseRecord): void {
  const store = readStore();
  const existingIndex = store.purchases.findIndex(
    (entry) => entry.sessionId === purchase.sessionId
  );

  if (existingIndex >= 0) {
    store.purchases[existingIndex] = purchase;
  } else {
    store.purchases.unshift(purchase);
  }

  store.purchases = store.purchases.slice(0, 5000);
  writeStore(store);
}

export function findPaidSession(sessionId: string, email?: string): PurchaseRecord | null {
  const store = readStore();

  const record = store.purchases.find((entry) => entry.sessionId === sessionId);
  if (!record) return null;

  if (email && record.email.toLowerCase() !== email.toLowerCase()) {
    return null;
  }

  return record;
}
