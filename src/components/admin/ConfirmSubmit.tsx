"use client";

import { useFormStatus } from "react-dom";
import { cx } from "@/lib/utils";

/** Submit button that asks for confirmation — used for destructive admin actions. */
export default function ConfirmSubmit({
  children,
  message = "Are you sure? This cannot be undone.",
  className,
  pendingLabel = "Working…",
}: {
  children: React.ReactNode;
  message?: string;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className={cx(
        "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60",
        className,
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Plain pending-aware submit button (no confirmation). */
export function SubmitButton({
  children,
  className,
  pendingLabel = "Saving…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cx("disabled:opacity-60", className)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
