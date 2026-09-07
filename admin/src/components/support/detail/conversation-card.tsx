"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import type { ConversationMessage } from "@/types/ticket-detail";

interface ConversationCardProps {
  messages: ConversationMessage[];
  /** Read-only view hides the reply box. */
  editable: boolean;
}

export function ConversationCard({ messages, editable }: ConversationCardProps) {
  const [reply, setReply] = useState("");

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-ink">Conversation</h2>

      <ul className="mt-4 space-y-4">
        {messages.map((message) => (
          <li key={message.id} className="flex flex-wrap items-start gap-3">
            <span
              className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand"
              aria-hidden
            >
              {message.initials}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">
                {message.authorName}{" "}
                <span className="text-xs font-normal text-ink-subtle">
                  ({message.authorRole})
                </span>
              </p>
              <p className="mt-0.5 text-sm text-ink-muted">{message.body}</p>
            </div>

            <p className="shrink-0 text-xs text-ink-subtle">{message.timestamp}</p>
          </li>
        ))}
      </ul>

      {editable ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            // TODO: post the reply, then append it to the thread.
            setReply("");
          }}
          className="mt-4 rounded-xl border border-line p-3"
        >
          <label htmlFor="ticket-reply" className="sr-only">
            Reply to this ticket
          </label>
          <textarea
            id="ticket-reply"
            rows={2}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Type your reply"
            className="w-full resize-y bg-transparent text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <Button type="submit" disabled={!reply.trim()} className="px-4 py-2 text-sm">
              Send Reply
            </Button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}