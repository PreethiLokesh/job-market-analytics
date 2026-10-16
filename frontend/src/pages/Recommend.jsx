import { useState } from "react";
import api, { errMsg, useMeta } from "../api";
import { useAuth } from "../AuthContext.jsx";
import SkillInput from "../components/SkillInput.jsx";
import JobCard from "../components/JobCard.jsx";
import Icon from "../components/Icon.jsx";
import { EmptyState, PageHeader, Skeleton, Spinner } from "../components/ui.jsx";

export default function Recommend() {
  const { user } = useAuth();
  const meta = useMeta();
  const [skills, setSkills] = useState(user?.skills || []);
  const [city, setCity] = useState("");
  const [jobs, setJobs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const find = async () => {
    setErr(""); setLoading(true);
    try { setJobs((await api.post("/recommend", { skills, city })).data); }
    catch (e) { setErr(errMsg(e)); }
    finally { setLoading(false); }
  };

  return (
    <>
      <PageHeader title="Find jobs that match your skills" sub="Add the skills you have and we rank jobs by how much of the role you already cover." />
      <div className="card">
        <SkillInput value={skills} onChange={setSkills} options={meta.skills} />
        <div className="row wrap" style={{ marginTop: 14 }}>
          <select aria-label="City" value={city} onChange={(e) => setCity(e.target.value)} style={{ width: 200 }}>
            <option value="">Any city</option>{meta.cities.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button className="btn" disabled={!skills.length || loading} onClick={find}>{loading ? <Spinner /> : <Icon name="sparkles" size={16} />}{loading ? "Searching…" : "Find jobs"}</button>
          {user?.skills?.length > 0 && <button className="btn ghost" onClick={() => setSkills(user.skills)}>Use my profile skills</button>}
        </div>
        {err && <div className="alert" role="alert" style={{ marginTop: 14, marginBottom: 0 }}><Icon name="alert" size={16} />{err}</div>}
      </div>

      {loading ? (
        <div className="grid-cards">{[0, 1, 2, 3].map((i) => <div className="card" key={i}><Skeleton h={20} w="55%" /><Skeleton h={14} w="80%" style={{ margin: "12px 0" }} /><Skeleton h={40} /></div>)}</div>
      ) : jobs === null ? (
        <EmptyState icon="sparkles" title="Your matches will appear here" text="Add at least one skill above and click Find jobs." />
      ) : jobs.length === 0 ? (
        <EmptyState icon="search" title="No matching jobs" text="Try adding more skills or removing the city filter." />
      ) : (
        <>
          <div className="row between wrap" style={{ margin: "4px 0 14px" }}>
            <h3>{jobs.length} best matches</h3>
            <div className="row small muted"><span className="chip ok">have it</span><span className="chip miss">to learn</span></div>
          </div>
          <div className="grid-cards">{jobs.map((j, i) => <JobCard key={j.id} job={j} rank={i + 1} />)}</div>
        </>
      )}
    </>
  );
}
