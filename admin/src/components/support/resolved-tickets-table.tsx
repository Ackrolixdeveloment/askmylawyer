"use client";
import { SupportQueue, type QueueProps } from "./support-queue";
export function ResolvedTicketsTable(props: QueueProps) {
  return <SupportQueue queue="resolved" seed={props.tickets} />;
}
