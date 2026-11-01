"use client";
import { SupportQueue, type QueueProps } from "./support-queue";
export function InProgressTicketsTable(props: QueueProps) {
  return <SupportQueue queue="in-progress" seed={props.tickets} />;
}
