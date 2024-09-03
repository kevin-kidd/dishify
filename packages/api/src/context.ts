import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import jwt from "@tsndr/cloudflare-worker-jwt";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { createDb } from "./db/client";
import Groq from "groq-sdk";

interface User {
  id: string;
}

interface ApiContextProps {
  user: User | null;
  db: DrizzleD1Database;
  ai: Ai;
  groq: Groq;
}

export const createContext = async (
  d1: D1Database,
  JWT_VERIFICATION_KEY: string,
  GROQ_API_KEY: string,
  ai: Ai,
  opts: FetchCreateContextFnOptions
): Promise<ApiContextProps> => {
  const db = createDb(d1);

  async function getUser() {
    const sessionToken = opts.req.headers.get("authorization")?.split(" ")[1];

    if (sessionToken !== undefined && sessionToken !== "undefined") {
      if (!JWT_VERIFICATION_KEY) {
        console.error("JWT_VERIFICATION_KEY is not set");
        return null;
      }

      try {
        const authorized = await jwt.verify(sessionToken, JWT_VERIFICATION_KEY, {
          algorithm: "HS256",
        });
        if (!authorized) {
          return null;
        }

        const decodedToken = jwt.decode(sessionToken);

        // Check if token is expired
        const expirationTimestamp = decodedToken.payload.exp;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (!expirationTimestamp || expirationTimestamp < currentTimestamp) {
          return null;
        }

        const userId = decodedToken?.payload?.sub;

        if (userId) {
          return {
            id: userId,
          };
        }
      } catch (e) {
        console.error(e);
      }
    }

    return null;
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY });
  const user = await getUser();

  return { user, db, ai, groq };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
