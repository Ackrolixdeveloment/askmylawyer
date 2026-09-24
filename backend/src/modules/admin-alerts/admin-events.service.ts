import { Injectable, Logger } from '@nestjs/common';
import { Subject, filter, map, Observable } from 'rxjs';

/** What the panel is told about, over one stream per signed-in admin. */
export type AdminEventType = 'alert' | 'permissions';

export interface AdminEvent {
  adminUserId: string;
  type: AdminEventType;
}

/**
 * The live channel behind the bell icon and the access checks.
 *
 * Server-sent events rather than a WebSocket: the panel talks to the backend
 * through its own /api/v1 proxy, which keeps the session cookie first-party
 * but cannot carry a WebSocket upgrade. Everything here is one-way anyway.
 */
@Injectable()
export class AdminEventsService {
  private readonly logger = new Logger(AdminEventsService.name);
  private readonly events = new Subject<AdminEvent>();

  /** Everything addressed to one admin, as SSE message data. */
  streamFor(adminUserId: string): Observable<{ data: { type: AdminEventType } }> {
    return this.events.asObservable().pipe(
      filter((event) => event.adminUserId === adminUserId),
      map((event) => ({ data: { type: event.type } })),
    );
  }

  publish(adminUserId: string, type: AdminEventType) {
    this.logger.debug(`${type} → ${adminUserId}`);
    this.events.next({ adminUserId, type });
  }

  publishMany(adminUserIds: string[], type: AdminEventType) {
    for (const adminUserId of adminUserIds) this.publish(adminUserId, type);
  }
}
