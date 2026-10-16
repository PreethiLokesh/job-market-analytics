import { useEffect, useState } from "react";
import api, { errMsg, useMeta } from "../api";
import SkillInput from "../components/SkillInput.jsx";
import { useToast } from "../components/Toast.jsx";
import { ErrorState, PageHeader, Skeleton, Spinner } from "../components/ui.jsx";

const empty = { title: "", role: "", company: "", city: "", salaryLpa: "", level: "Mid", type: "Full-time", skills: [] };

export default function Admin() {
  const meta = useMeta();
  const toast = useToast();
  const [f, setF] = useState(empty);
  const [users, setUsers] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const loadUsers = () => { setErr(""); api.get("/admin/users").then((r) => setUsers(r.data)).catch((e) => setErr(errMsg(e))); };
  useEffect(loadUsers, []);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/jobs", { ...f, salaryLpa: Number(f.salaryLpa) });
      toast("Job posted"); setF(empty);
    } catch (x) { toast(errMsg(x), "error"); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Admin" sub="Post new jobs and review registered users. To delete a job, use the Browse jobs page." />
      <div className="split" style={{ gridTemplateColumns: "minmax(0, 460px) minmax(0, 1fr)" }}>
        <form className="card" onSubmit={add}>
          <div className="card-head"><h3>Post a new job</h3></div>
          <div className="form-grid">
            <label className="field span2">Title<input required value={f.title} onChange={set("title")} placeholder="e.g. Senior Java Developer" /></label>
            <label className="field">Role
              <select required value={f.role} onChange={set("role")}><option value="">Select role</option>{meta.roles.map((r) => <option key={r}>{r}</option>)}</select>
            </label>
            <label className="field">Company<input required value={f.company} onChange={set("company")} /></label>
            <label className="field">City
              <select required value={f.city} onChange={set("city")}><option value="">Select city</option>{meta.cities.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label className="field">Salary (LPA)<input required type="number" step="0.1" min="0.1" value={f.salaryLpa} onChange={set("salaryLpa")} /></label>
            <label className="field span2">Level
              <select value={f.level} onChange={set("level")}><option>Entry</option><option>Mid</option><option>Senior</option></select>
            </label>
          </div>
          <div className="field" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
            <div style={{ marginBottom: 6 }}>Required skills</div>
            <SkillInput value={f.skills} onChange={(skills) => setF({ ...f, skills })} options={meta.skills} />
          </div>
          <button className="btn" disabled={busy}>{busy && <Spinner />}Post job</button>
        </form>

        <div className="card">
          <div className="card-head"><h3>Registered users{users ? ` (${users.length})` : ""}</h3></div>
          {err ? <ErrorState message={err} onRetry={loadUsers} /> : !users ? <Skeleton h={120} /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Skills</th></tr></thead>
                <tbody>{users.map((u) => (
                  <tr key={u.id}><td><b style={{ fontWeight: 600 }}>{u.name}</b></td><td className="muted">{u.email}</td>
                    <td><span className={"chip" + (u.role === "ADMIN" ? " accent" : "")}>{u.role}</span></td>
                    <td className="muted">{u.city}</td><td className="muted">{(u.skills || []).join(", ")}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
