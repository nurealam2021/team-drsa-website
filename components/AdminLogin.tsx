"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminLogin({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (response.ok) {
      window.location.reload();
      return;
    }
    setMessage(body.message || "Login failed.");
  }

  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-[#0A0A0A] px-5 text-white">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#C1121F]">Team DRSA</p>
        <h1 className="mt-3 text-3xl font-semibold">Admin access</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Role-based access for website content, business inquiries, analytics, users, and audit records.</p>
        {!configured && <p className="mt-5 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-100">Admin access is not configured yet. Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_SECRET for the first super-admin bootstrap.</p>}
        <label className="mt-6 block text-sm font-semibold text-zinc-300">Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-[#C1121F]" /></label>
        <label className="mt-4 block text-sm font-semibold text-zinc-300">Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-[#C1121F]" /></label>
        {message && <p className="mt-4 text-sm text-red-300">{message}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-xl bg-[#C1121F] px-5 py-3 font-bold disabled:opacity-50">{busy ? "Signing in..." : "Sign in"}</button>
        <Link href="/" className="mt-4 block text-center text-sm text-zinc-500 hover:text-white">Return to website</Link>
      </form>
    </main>
  );
}
