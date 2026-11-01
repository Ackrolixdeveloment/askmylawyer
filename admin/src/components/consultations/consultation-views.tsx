"use client";
import { ConsultationQueue } from "./consultation-queue";
export function CompletedConsultationsView({ customerId }: { customerId?: string }) { return <ConsultationQueue bucket="completed" customerId={customerId} />; }
export function InProgressConsultationsView() { return <ConsultationQueue bucket="in-progress" />; }
export function CancelledConsultationsView() { return <ConsultationQueue bucket="cancelled" />; }
export function RefundedConsultationsView() { return <ConsultationQueue bucket="refunded" />; }
