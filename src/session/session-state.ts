import { SessionStatus } from '@prisma/client';

/**
 * SessionLog 상태 머신
 *
 * NOT_STARTED → IN_PROGRESS
 * IN_PROGRESS → QA_MODE | PAUSED | ASSESSMENT | COMPLETED
 * QA_MODE     → IN_PROGRESS | PAUSED
 * PAUSED      → IN_PROGRESS
 * ASSESSMENT  → IN_PROGRESS | COMPLETED
 * COMPLETED   → (terminal)
 */
const TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  NOT_STARTED: [SessionStatus.IN_PROGRESS],
  IN_PROGRESS: [
    SessionStatus.QA_MODE,
    SessionStatus.PAUSED,
    SessionStatus.ASSESSMENT,
    SessionStatus.COMPLETED,
  ],
  QA_MODE: [SessionStatus.IN_PROGRESS, SessionStatus.PAUSED],
  PAUSED: [SessionStatus.IN_PROGRESS],
  ASSESSMENT: [SessionStatus.IN_PROGRESS, SessionStatus.COMPLETED],
  COMPLETED: [],
};

export function canTransition(from: SessionStatus, to: SessionStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function getAllowedTransitions(from: SessionStatus): SessionStatus[] {
  return TRANSITIONS[from];
}
