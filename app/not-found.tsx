import Link from "next/link";

export default function NotFound() {
  return (
    <section className="dark"><div className="wrap stack" style={{ ["--g" as string]: "24px" }}>
      <span className="label">404</span>
      <h1 className="display-l">This page has moved<span className="dot">.</span></h1>
      <p className="lead">The page you were looking for isn't here. Try the latest insights or upcoming events.</p>
      <div className="row"><Link className="btn btn-red" href="/insights">Insights</Link><Link className="btn btn-line" href="/events">Events</Link></div>
    </div></section>
  );
}
