"use client";
import { useSubmit } from "@/components/useSubmit";

export function PasswordForm() {
  const { state, submit } = useSubmit("/api/admin/account");
  if (state.status === "done") return <p className="notice okay" role="status">{state.message}</p>;
  return (
    <form className="form" onSubmit={(e) => submit(e)}>
      <div className="field"><label htmlFor="pw-new">New password</label><input id="pw-new" name="password" type="password" minLength={12} required autoComplete="new-password" className="input" /></div>
      <div className="field"><label htmlFor="pw-confirm">Repeat new password</label><input id="pw-confirm" name="confirm" type="password" minLength={12} required autoComplete="new-password" className="input" /></div>
      {state.status === "error" && <p className="notice err" role="alert">{state.message}</p>}
      <button className="btn btn-dark" style={{ alignSelf: "flex-start" }} disabled={state.status === "sending"}>{state.status === "sending" ? "Saving…" : "Save password"}</button>
    </form>
  );
}
