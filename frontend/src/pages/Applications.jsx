import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui.jsx";

export default function Applications() {
  const [apps, setApps] = useState(null);
  const [err, setErr] = useState("");
  const load = () => { setErr(""); api.get("/me/applications").then((r) => setApps(r.data)).catch((e) => setErr(errMsg(e))); };
  useEffect(load, []);

  return (
    <>
      <PageHeader title="My applications" sub={apps ? `${apps.length} application${apps.length === 1 ? "" : "s"}` : "Track the jobs you applied to"} />
      {err ? <ErrorState message={err} onRetry={load} /> : !apps ? (
        <div className="card"><Skeleton h={18} style={{ marginBottom: 14 }} /><Skeleton h={18} style={{ marginBottom: 14 }} /><Skeleton h={18} /></div>
      ) : apps.length === 0 ? (
        <EmptyState icon="file" title="No applications yet" text="Jobs you apply to will show up here."
          action={<Link className="btn" to="/jobs">Browse jobs</Link>} />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Job</th><th>Company</th><th>Status</th><th>Applied on</th></tr></thead>
              <tbody>{apps.map((a) => (
                <tr key={a.id}>
                  <td><b style={{ fontWeight: 600 }}>{a.jobTitle}</b></td><td className="muted">{a.company}</td>
                  <td><span className="chip ok">{a.status}</span></td>
                  <td className="muted">{new Date(a.appliedAt).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
