import type { User } from "better-auth/types";
import { Resend } from "resend";
import type { Env } from "./types";

/**
 * Sends a verification email to the user
 *
 * @param params - The parameters for sending the email
 * @param env - The environment variables
 */
export const sendVerificationEmail = async (
  { url, user }: { url: string; user: User },
  env: Env,
) => {
  const resend = new Resend(env.RESEND_API_KEY);
  return resend.emails.send({
    from: "auth@dishify.app",
    to: user.email,
    subject: "Verify your email",
    html: `<p>Verify your email by clicking <a href="${url}">here</a></p>.`,
  });
};

/**
 * Sends an email verification for changing email address
 *
 * @param params - The parameters for sending the email
 * @param env - The environment variables
 */
export const sendChangeEmailVerification = async (
  { url, user, newEmail }: { url: string; user: User; newEmail: string },
  env: Env,
) => {
  const resend = new Resend(env.RESEND_API_KEY);
  return resend.emails.send({
    from: "auth@dishify.app",
    to: user.email,
    subject: "Approve email change",
    html: `<p>You are receiving this email because you have requested to change your email to ${newEmail}. Please approve the change by clicking <a href="${url}">here</a></p>.`,
  });
};

/**
 * Sends a password reset email to the user
 *
 * @param params - The parameters for sending the email
 * @param env - The environment variables
 */
export const sendResetPasswordEmail = async (
  { url, user }: { url: string; user: User },
  env: Env,
) => {
  const resend = new Resend(env.RESEND_API_KEY);
  return resend.emails.send({
    from: "auth@dishify.app",
    to: user.email,
    subject: "Reset your password",
    html: `<p>Reset your password by clicking <a href="${url}">here</a></p>.`,
  });
};
