"use client";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  Sentry.captureException(error);
  return (
    <div className="max-w-md py-10">
      <h1 className="text-[24px] font-semibold">Something didn&rsquo;t load</h1>
      <p className="text-ink-2 mt-2">Your data is safe — nothing was changed. Try again, and if it keeps happening, let us know from the Support page.</p>
      <div className="mt-5 flex gap-2"><Button onClick={reset}>Try again</Button><Button variant="secondary" href="/me">Back home</Button></div>
    </div>
  );
}
