import { supabase } from './supabase';

// Sign-in is a 6-digit code emailed by Supabase and typed in the app.
// Magic links would open Safari instead of the installed iPhone app, so the
// app would stay signed out; a code works everywhere.

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes'))
    return 'Too many codes requested. Wait a minute, then try again.';
  if (m.includes('expired') || m.includes('invalid') || m.includes('token'))
    return 'That code is wrong or has expired. Check the latest email, or send a new code.';
  if (m.includes('fetch') || m.includes('network')) return 'No connection. Check your signal and try again.';
  return message;
}

export async function sendCode(email: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  return error ? friendly(error.message) : null;
}

export async function verifyCode(email: string, code: string): Promise<string | null> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: code.trim(),
    type: 'email',
  });
  return error ? friendly(error.message) : null;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
