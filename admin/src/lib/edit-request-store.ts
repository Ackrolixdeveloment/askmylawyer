/**
 * MOCK STORE — keeps approve / reject decisions alive across the three edit
 * approval screens without a backend.
 *
 * Decisions live in localStorage and are broadcast to every subscribed list,
 * so approving a request really does move it out of Pending and into Approved.
 * Replace the whole module with API calls once the backend exists.
 */
import { editRequests } from "@/data/mock-edit-requests";
import type { EditRequest, EditRequestStatus } from "@/types/edit-request";

interface Decision {
  status: Exclude<EditRequestStatus, "pending">;
  decidedAt: string;
  feedback: string | null;
}

const STORAGE_KEY = "aml.admin.editRequestDecisions";

function load(): Record<string, Decision> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

let decisions: Record<string, Decision> = {};
let loaded = false;
const listeners = new Set<() => void>();

/** Server render has no storage, so it always sees the untouched data. */
const EMPTY: Record<string, Decision> = {};

export function subscribe(listener: () => void) {
  if (!loaded) {
    decisions = load();
    loaded = true;
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDecisions() {
  if (!loaded) {
    decisions = load();
    loaded = true;
  }
  return decisions;
}

export function getServerDecisions() {
  return EMPTY;
}

export function decide(
  id: string,
  status: Decision["status"],
  feedback: string | null = null,
) {
  const today = new Date().toISOString().slice(0, 10);
  decisions = { ...decisions, [id]: { status, decidedAt: today, feedback } };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
  } catch {
    // Storage blocked — the decision still applies for this session.
  }
  listeners.forEach((listener) => listener());
}

/** Applies any stored decision on top of the seed data. */
export function applyDecisions(
  requests: EditRequest[],
  overrides: Record<string, Decision>,
): EditRequest[] {
  return requests.map((request) => {
    const decision = overrides[request.id];
    if (!decision) return request;

    return {
      ...request,
      status: decision.status,
      decidedAt: decision.decidedAt,
      feedback: decision.feedback ?? request.feedback,
    };
  });
}

export function getAllRequests(overrides: Record<string, Decision>) {
  return applyDecisions(editRequests, overrides);
}
