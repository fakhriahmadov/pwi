"use client";
import { useSubmit } from "@/components/useSubmit";

export function LoginForm({ next }: { next?: string }) {
  const { state, submit } = useSubmit("/api/auth/login");
  if (state.status === "done")
    return <p className="notice okay" role="status">{String(state.data?.message || "Check your inbox for the sign-in link.")}</p>;
  return (
    <form className="form" onSubmit={(e) => submit(e, { next })} style={{ background: "var(--white)", padding: 28 }}>
      <div className="field"><label htmlFor="login-email">Email address</label><input id="login-email" name="email" type="email" required autoComplete="email" className="input" /></div>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {state.status === "error" && <p className="notice err" role="alert">{state.message}</p>}
      <button className="btn btn-dark" style={{ alignSelf: "flex-start" }} disabled={state.status === "sending"}>{state.status === "sending" ? "Sending…" : "Email me a sign-in link"}</button>
    </form>
  );
}
