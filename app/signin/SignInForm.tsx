"use client";
import { useState } from "react";
import s from "./signin.module.css";

type St = { kind: "idle" | "sending" | "sent" | "error"; msg?: string };
const G = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
);

const L = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0A66C2" /><path fill="#fff" d="M7.1 9.4h2.6v8.3H7.1zM8.4 5.3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11.3 9.4h2.5v1.1h.1c.3-.7 1.2-1.4 2.5-1.4 2.7 0 3.2 1.8 3.2 4v4.6H17v-4.1c0-1 0-2.2-1.4-2.2s-1.6 1.1-1.6 2.1v4.2h-2.6z" /></svg>
);

async function post(url: string, body: object) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json.ok !== false, json };
}

export function SignInForm({ next, startTab, googleEnabled, linkedinEnabled }: { next: string; startTab: "in" | "up"; googleEnabled: boolean; linkedinEnabled: boolean }) {
  const [tab, setTab] = useState<"in" | "up">(startTab);
  const [mode, setMode] = useState<"pw" | "link">("pw");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [news, setNews] = useState(true);
  const [st, setSt] = useState<St>({ kind: "idle" });
  const err = (msg: string) => setSt({ kind: "error", msg });
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!validEmail) return err("Please enter your email address.");
    setSt({ kind: "sending" });
    if (mode === "link") {
      const r = await post("/api/auth/login", { email: email.trim(), next });
      return r.ok ? setSt({ kind: "sent", msg: r.json.message }) : err(r.json.message || "Something went wrong. Please try again.");
    }
    if (!pw) return err("Please enter your password.");
    const r = await post("/api/auth/password", { email: email.trim(), password: pw, next });
    if (r.ok && r.json.redirect) { window.location.href = String(r.json.redirect); return; }
    err(r.json.message || "Something went wrong. Please try again.");
  }
  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return err("Please enter your name.");
    if (!validEmail) return err("Please enter a valid email address.");
    if (pw.length < 10) return err("Choose a password of at least 10 characters.");
    setSt({ kind: "sending" });
    const r = await post("/api/auth/signup", { name: name.trim(), email: email.trim(), password: pw, newsletter: news });
    if (r.ok && r.json.redirect) { window.location.href = String(r.json.redirect); return; }
    err(r.json.message || "Something went wrong. Please try again.");
  }

  const h1 = { margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(32px, 7vw, 48px)", lineHeight: 1, letterSpacing: "-.035em" } as const;
  const box = { background: "var(--paper)", padding: "clamp(20px, 4vw, 28px)", display: "flex", flexDirection: "column", gap: 16 } as const;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h1 style={h1}>{tab === "in" ? "Sign in" : "Create your account"}<span className="dot">.</span></h1>
        <p style={{ margin: 0, color: "var(--ink-body)" }}>{tab === "in" ? "See your summit registrations and tickets, and manage your newsletter and details." : "Keep your registrations, tickets and newsletter settings in one place."}</p>
      </div>
      <div className={s.seg} role="group" aria-label="Sign in or create an account">
        <button type="button" aria-pressed={tab === "in"} onClick={() => { setTab("in"); setSt({ kind: "idle" }); }}>Sign in</button>
        <button type="button" aria-pressed={tab === "up"} onClick={() => { setTab("up"); setSt({ kind: "idle" }); }}>Create account</button>
      </div>
      <a className={s.google} href={googleEnabled ? `/api/auth/google?next=${encodeURIComponent(next)}` : "/signin?error=google-off"}><G /> Continue with Google</a>
      <a className={s.google} href={linkedinEnabled ? `/api/auth/linkedin?next=${encodeURIComponent(next)}` : "/signin?error=linkedin-off"}><L /> Continue with LinkedIn</a>
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink-muted)", fontSize: 13 }}><span style={{ flex: 1, height: 1, background: "var(--line)" }} />or with email<span style={{ flex: 1, height: 1, background: "var(--line)" }} /></div>

      {tab === "in" ? (
        <form style={box} onSubmit={signIn} noValidate>
          <div className={s.fld}><label htmlFor="si-email">Email address</label><input id="si-email" type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setSt({ kind: "idle" }); }} /></div>
          {mode === "pw" && <div className={s.fld}><label htmlFor="si-pw">Password</label><input id="si-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>}
          {st.kind === "error" && <p className={s.err} role="alert">{st.msg}</p>}
          {st.kind === "sent" ? <p style={{ margin: 0, padding: "14px 16px", background: "var(--sand)", fontSize: 14 }} role="status">{st.msg}</p>
            : <button className={s.go} disabled={st.kind === "sending"}>{st.kind === "sending" ? "…" : mode === "pw" ? "Sign in" : "Email me a sign-in link"}</button>}
          <button type="button" className={s.textlink} onClick={() => { setMode(mode === "pw" ? "link" : "pw"); setSt({ kind: "idle" }); }}>{mode === "pw" ? "Forgot your password? Email me a sign-in link instead" : "Use my password instead"}</button>
        </form>
      ) : (
        <form style={box} onSubmit={signUp} noValidate>
          <div className={s.fld}><label htmlFor="su-name">Full name</label><input id="su-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className={s.fld}><label htmlFor="su-email">Email address</label><input id="su-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className={s.fld}><label htmlFor="su-pw">Password <span style={{ fontWeight: 400, color: "var(--ink-muted)" }}>· at least 10 characters</span></label><input id="su-pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <label className={s.check}><input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} /><span>Send me the monthly newsletter — insights and upcoming events. You can change how often in your account.</span></label>
          {st.kind === "error" && <p className={s.err} role="alert">{st.msg}</p>}
          <button className={s.go} disabled={st.kind === "sending"}>{st.kind === "sending" ? "…" : "Create account"}</button>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>Already registered for a summit or subscribed to the newsletter? Use the same email address and they’ll appear in your account.</p>
        </form>
      )}
    </>
  );
}
