"use client";
import { SupportQueue, type QueueProps } from "./support-queue";
export function NewTicketsTable(props: QueueProps) {
  return <SupportQueue queue="new" seed={props.tickets} />;
}
