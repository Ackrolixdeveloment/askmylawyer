/** How a consultation request is offered to lawyers. */
export type DispatchMode = "broadcast" | "sequential";

/** Everything on Settings → Consultation Engine. */
export interface EngineSettings {
  /** The whole demo profile in one switch. */
  demoMode: boolean;

  // Matching
  dispatchMode: DispatchMode;
  /** Demo only: ring every lawyer, whatever their status or preferences. */
  ignoreLawyerFilters: boolean;
  ringWindowSeconds: number;
  searchLimitSeconds: number;
  radiusStepsKm: number[];
  /** 0 turns escalation off. */
  escalateAfterAttempts: number;
  wrapUpCooldownMinutes: number;
  scheduledBufferMinutes: number;
  locationFreshnessMinutes: number;

  // Availability
  heartbeatSeconds: number;
  maxConcurrentChat: number;
  maxConcurrentVoice: number;
  maxConcurrentVideo: number;

  // Payments
  skipPayment: boolean;
  autoRefundHours: number;

  // What the customer sees while waiting
  showNotifiedCount: boolean;
  allowCancelDuringSearch: boolean;

  // Session
  tokenGraceMinutes: number;
  callGraceSeconds: number;
}

/** What the demo-mode banner needs. */
export interface EngineStatus {
  demoMode: boolean;
  dispatchMode: DispatchMode;
  skipPayment: boolean;
  ignoreLawyerFilters: boolean;
}
