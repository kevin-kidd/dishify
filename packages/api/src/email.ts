import type { User } from "better-auth/types";
import { Resend } from "resend";
import type { Env } from "./types";

export const sendVerificationEmail = async (
  { url, user }: { url: string; user: User },
  env: Env,
) => {
  const resend = new Resend(env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: "auth@dishify.app",
      to: user.email,
      subject: "Verify your email",
      html: `<p>Verify your email by clicking <a href="${url}">here</a></p>.`,
    });
  } catch (error) {
    console.error(error);
  }
};

export const sendChangeEmailVerification = async (
  { url, user, newEmail }: { url: string; user: User; newEmail: string },
  env: Env,
) => {
  const resend = new Resend(env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: "auth@dishify.app",
      to: user.email,
      subject: "Approve email change",
      html: `<p>You are receiving this email because you have requested to change your email to ${newEmail}. Please approve the change by clicking <a href="${url}">here</a></p>.`,
    });
  } catch (error) {
    console.error(error);
  }
};

export const sendResetPasswordEmail = async (
  { url, user }: { url: string; user: User },
  env: Env,
) => {
  try {
    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
      from: "auth@dishify.app",
      to: user.email,
      subject: "Reset your password",
      html: `<p>Reset your password by clicking <a href="${url}">here</a></p>.`,
    });
  } catch (error) {
    console.error(error);
  }
};
