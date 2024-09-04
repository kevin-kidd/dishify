"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from "@dishify/ui";
import { SolitoImage } from "solito/image";
const customerCareEmail = process.env.NEXT_PUBLIC_CUSTOMER_CARE_EMAIL;
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <main className="flex h-full w-full items-center justify-center">
      <SolitoImage src="/logo.png" width={96} height={96} alt="Logo" />
      <h1 className="text-2xl font-semibold">Unable to connect to server</h1>
      <p className="max-w-[500px]">
        Your changes were saved, but we could not connect to the server due to a technical issue on
        our end. Please try connecting again. If the issue keeps happening,{" "}
        <Link href={`mailto:${customerCareEmail}`} target="_blank" rel="noreferrer">
          contact Customer Care
        </Link>
        .
      </p>
      <Button onPress={() => reset()}>Try Again</Button>
    </main>
  );
}
