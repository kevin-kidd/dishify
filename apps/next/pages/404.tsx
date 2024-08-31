import { Button } from "@dishify/ui";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { SolitoImage } from "solito/image";

const customerCareEmail = process.env.NEXT_PUBLIC_CUSTOMER_CARE_EMAIL;

export default function Page() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Page not found</title>
      </Head>
      <main className="flex h-full w-full items-center justify-center">
        <SolitoImage src="/logo.png" width={96} height={96} alt="Dishify Logo" />
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="max-w-[500px]">
          Your changes were saved, but we could not load the page you requested because it was not
          found on our server. Please try connecting again. If the issue keeps happening,{" "}
          <Link href={`mailto:${customerCareEmail}`} target="_blank" rel="noreferrer">
            contact Customer Care
          </Link>
          .
        </p>
        <Button onPress={() => router.reload()}>Try Again</Button>
      </main>
    </>
  );
}
