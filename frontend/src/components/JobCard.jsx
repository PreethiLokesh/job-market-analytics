import { useState } from "react";
import api, { errMsg } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "./Toast.jsx";
import { Spinner } from "./ui.jsx";
import Icon from "./Icon.jsx";

/** Works for normal jobs and for recommendation results (which have score / matched / missing). */
export default function JobCard({ job, rank, onDelete }) {
  const { user } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(false);
  const isRec = job.score != null;

  const apply = async () => {
    setBusy(true);
    try { await api.post(`/jobs/${job.id}/apply`); setApplied(true); toast(`Applied to ${job.title}`); }
    catch (e) { toast(errMsg(e), "error"); }
    finally { setBusy(false); }
  };

  return (
    <article className="card job">
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div className="row" style={{ alignItems: "flex-start", gap: 12, minWidth: 0 }}>
          {rank != null && <span className="rank">{rank}</span>}
          <div style={{ minWidth: 0 }}>
            <h3>{job.title}</h3>
            <div className="meta">
              <span><Icon name="building" size={14} />{job.company}</span>
              <span><Icon name="pin" size={14} />{job.city}</span>
              <span><Icon name="briefcase" size={14} />{job.level} · {job.type}</span>
            </div>
          </div>
        </div>
        <div className="salary">₹{job.salaryLpa} <small>LPA</small></div>
      </div>

      {isRec && (
        <div>
          <div className="row between"><span className="small muted">Skill match</span><span className="score">{job.score}%</span></div>
          <div className="bar" role="meter" aria-valuenow={job.score} aria-valuemin={0} aria-valuemax={100}><span style={{ width: job.score + "%" }} /></div>
        </div>
      )}

      <div className="chips">
        {isRec ? (
          <>
            {job.matched.map((s) => <span key={s} className="chip ok"><Icon name="check" size={12} />{s}</span>)}
            {job.missing.map((s) => <span key={s} className="chip miss">{s}</span>)}
          </>
        ) : job.skills.map((s) => <span key={s} className="chip">{s}</span>)}
      </div>

      <div className="job-foot">
        <button className={"btn sm" + (applied ? " success" : "")} disabled={busy || applied} onClick={apply}>
          {busy ? <Spinner /> : applied ? <Icon name="check" size={14} /> : null}{applied ? "Applied" : "Apply"}
        </button>
        {user?.role === "ADMIN" && onDelete && (
          <button className="btn sm danger" onClick={() => onDelete(job)}><Icon name="trash" size={14} />Delete</button>
        )}
      </div>
    </article>
  );
}
