// Linkurile de feedback după o cerere concretizată (16 sept 2026). Nu apar
// nicăieri pe site: le scoate `scripts/feedback-links.mjs` și le trimite
// userul de mână, clientului și firmei care a semnat.
//
// Tokenul e semnat cu PORTAL_SECRET peste (rol, cerere, firmă, expirare), ca la
// lib/lead-client-token.ts. Firma intră în semnătură, altfel oricine cu linkul
// clientului ar putea scrie feedback „în numele" oricărei firme.
//
// ATENȚIE: scripts/feedback-links.mjs reface aceeași semnătură în JS simplu.
// Dacă schimbi formatul aici, schimbă-l și acolo.

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { FeedbackRole } from './feedback-shared';

const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function secret(): string {
  const value = process.env.PORTAL_SECRET;
  if (!value) throw new Error('PORTAL_SECRET lipsește: nu pot verifica linkurile de feedback.');
  return value;
}

function sign(role: FeedbackRole, leadId: string, firma: string, exp: number): string {
  return createHmac('sha256', secret())
    .update(`feedback:${role}:${leadId}:${firma}:${exp}`)
    .digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function createFeedbackToken(role: FeedbackRole, leadId: string, firma = ''): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  return `${exp}.${sign(role, leadId, firma, exp)}`;
}

export function verifyFeedbackToken(token: string, role: FeedbackRole, leadId: string, firma = ''): boolean {
  const dot = token.indexOf('.');
  if (dot === -1) return false;
  const exp = Number(token.slice(0, dot));
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  try {
    return safeEqual(token.slice(dot + 1), sign(role, leadId, firma, exp));
  } catch {
    return false;
  }
}
