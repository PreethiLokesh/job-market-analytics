import { useState } from "react";
import api, { errMsg, useMeta } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { initials } from "../components/Layout.jsx";
import SkillInput from "../components/SkillInput.jsx";
import { useToast } from "../components/Toast.jsx";
import { PageHeader, Spinner } from "../components/ui.jsx";

export default function Profile() {
  const { user, update } = useAuth();
  const meta = useMeta();
  const toast = useToast();
  const [f, setF] = useState({ name: user.name, city: user.city || "", skills: user.skills || [] });
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { update((await api.put("/me", f)).data); toast("Profile saved"); }
    catch (x) { toast(errMsg(x), "error"); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Profile" sub="Your skills power the job recommendations." />
      <div className="split">
        <div className="card" style={{ textAlign: "center" }}>
          <span className="avatar lg" style={{ margin: "0 auto 14px" }}>{initials(user.name)}</span>
          <h3>{user.name}</h3>
          <div className="muted" style={{ marginBottom: 12, overflowWrap: "anywhere" }}>{user.email}</div>
          <span className="chip accent">{user.role}</span>
          <div className="small dim" style={{ marginTop: 14 }}>{(user.skills || []).length} skills saved</div>
        </div>

        <form className="card" onSubmit={save}>
          <div className="card-head"><h3>Personal details</h3></div>
          <div className="form-grid">
            <label className="field">Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label className="field">Email<input disabled value={user.email} /></label>
            <label className="field span2">City
              <select value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
                <option value="">Select city</option>{meta.cities.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <div className="field" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
            <div style={{ marginBottom: 6 }}>Skills</div>
            <SkillInput value={f.skills} onChange={(skills) => setF({ ...f, skills })} options={meta.skills} />
          </div>
          <button className="btn" disabled={busy}>{busy && <Spinner />}Save changes</button>
        </form>
      </div>
    </>
  );
}
