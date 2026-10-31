"use client";
import { useState } from "react";
import { useSubmit } from "@/components/useSubmit";

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export function LoginForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const [mode, setMode] = useState<"password" | "link">("password");
  const pw = useSubmit("/api/auth/password");
  const link = useSubmit("/api/auth/login");
  const box: React.CSSProperties = { background: "var(--white)", padding: 28 };

  return (
    <div className="stack" style={{ ["--g" as string]: "16px" }}>
      <a className="btn btn-ghost" href={`/api/auth/google?next=${encodeURIComponent(next)}`} style={{ background: "var(--white)", gap: 12, textTransform: "none", letterSpacing: 0, fontSize: 15, fontWeight: 500 }} aria-disabled={!googleEnabled}>
        <GoogleMark /> Continue with Google
      </a>
      <div className="row" style={{ alignItems: "center", ["--g" as string]: "12px", color: "var(--muted)", fontSize: 13 }}>
        <span style={{ flex: 1, height: 1, background: "var(--line)" }} />or<span style={{ flex: 1, height: 1, background: "var(--line)" }} />
      </div>

      {mode === "password" ? (
        <form className="form" style={box} onSubmit={async (e) => { const r = await pw.submit(e, { next }); if (r?.redirect) window.location.href = String(r.redirect); }}>
          <div className="field"><label htmlFor="pw-email">Email address</label><input id="pw-email" name="email" type="email" required autoComplete="username" className="input" /></div>
          <div className="field"><label htmlFor="pw-password">Password</label><input id="pw-password" name="password" type="password" required autoComplete="current-password" className="input" /></div>
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          {pw.state.status === "error" && <p className="notice err" role="alert">{pw.state.message}</p>}
          <button className="btn btn-dark" style={{ alignSelf: "flex-start" }} disabled={pw.state.status === "sending" || pw.state.status === "done"}>{pw.state.status === "idle" || pw.state.status === "error" ? "Sign in" : "Signing in…"}</button>
          <button type="button" onClick={() => setMode("link")} style={{ alignSelf: "flex-start", background: "none", border: 0, padding: 0, minHeight: 44, font: "inherit", fontSize: 13, textDecoration: "underline", cursor: "pointer" }}>Forgot your password, or signing in for the first time?</button>
        </form>
      ) : link.state.status === "done" ? (
        <p className="notice okay" role="status">{String(link.state.data?.message || "Check your inbox for the sign-in link.")}</p>
      ) : (
        <form className="form" style={box} onSubmit={(e) => link.submit(e, { next: "/admin/account?setup=1" })}>
          <p style={{ fontSize: 14, color: "var(--ink)" }}>We'll email you a one-time sign-in link. After signing in you can set a new password.</p>
          <div className="field"><label htmlFor="link-email">Email address</label><input id="link-email" name="email" type="email" required autoComplete="email" className="input" /></div>
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          {link.state.status === "error" && <p className="notice err" role="alert">{link.state.message}</p>}
          <button className="btn btn-dark" style={{ alignSelf: "flex-start" }} disabled={link.state.status === "sending"}>{link.state.status === "sending" ? "Sending…" : "Email me a sign-in link"}</button>
          <button type="button" onClick={() => setMode("password")} style={{ alignSelf: "flex-start", background: "none", border: 0, padding: 0, minHeight: 44, font: "inherit", fontSize: 13, textDecoration: "underline", cursor: "pointer" }}>Back to password sign-in</button>
        </form>
      )}
      <p className="muted" style={{ fontSize: 13 }}>Admin access: fakhri.ahmadov@gmail.com and fakhri@privatewealth.institute.</p>
    </div>
  );
}
