import { useEffect, useState } from "react";
import api, { errMsg, useMeta } from "../api";
import JobCard from "../components/JobCard.jsx";
import Icon from "../components/Icon.jsx";
import { useToast } from "../components/Toast.jsx";
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui.jsx";

export default function Jobs() {
  const meta = useMeta();
  const toast = useToast();
  const [f, setF] = useState({ q: "", city: "", skill: "" });
  const [page, setPage] = useState(0);
  const [res, setRes] = useState({ content: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [del, setDel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const size = 12;

  const load = () => {
    setLoading(true); setErr("");
    api.get("/jobs", { params: { ...f, page, size } }).then((r) => setRes(r.data)).catch((e) => setErr(errMsg(e))).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [page, f.city, f.skill]);

  const pick = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(0); };
  const search = (e) => { e.preventDefault(); page === 0 ? load() : setPage(0); };
  const pages = Math.ceil(res.total / size);

  const confirmDelete = async () => {
    setDeleting(true);
    try { await api.delete("/admin/jobs/" + del.id); toast("Job deleted"); setDel(null); load(); }
    catch (e) { toast(errMsg(e), "error"); }
    finally { setDeleting(false); }
  };

  return (
    <>
      <PageHeader title="Browse jobs" sub={loading ? "Searching…" : `${res.total.toLocaleString()} jobs found`} />
      <form className="card filters" onSubmit={search} style={{ padding: 14 }}>
        <div className="search"><Icon name="search" size={16} /><input aria-label="Search job title" placeholder="Search job title…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div>
        <select aria-label="City" value={f.city} onChange={pick("city")}><option value="">All cities</option>{meta.cities.map((c) => <option key={c}>{c}</option>)}</select>
        <select aria-label="Skill" value={f.skill} onChange={pick("skill")}><option value="">Any skill</option>{meta.skills.map((s) => <option key={s}>{s}</option>)}</select>
        <button className="btn">Search</button>
      </form>

      {err ? <ErrorState message={err} onRetry={load} /> : loading ? (
        <div className="grid-cards">{Array.from({ length: 6 }, (_, i) => <div className="card" key={i}><Skeleton h={20} w="60%" /><Skeleton h={14} w="85%" style={{ margin: "12px 0" }} /><Skeleton h={24} /></div>)}</div>
      ) : res.content.length === 0 ? (
        <EmptyState icon="search" title="No jobs match your filters" text="Try a different title, city or skill." />
      ) : (
        <div className="grid-cards">{res.content.map((j) => <JobCard key={j.id} job={j} onDelete={setDel} />)}</div>
      )}

      {!err && pages > 1 && (
        <div className="pager">
          <button className="btn secondary sm" disabled={page === 0} onClick={() => setPage(page - 1)}><Icon name="left" size={14} />Previous</button>
          <span>Page {page + 1} of {pages}</span>
          <button className="btn secondary sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next<Icon name="right" size={14} /></button>
        </div>
      )}

      <ConfirmDialog open={!!del} title="Delete this job?" busy={deleting} confirmLabel="Delete job"
        text={del ? `"${del.title}" at ${del.company} will be permanently removed.` : ""}
        onConfirm={confirmDelete} onCancel={() => setDel(null)} />
    </>
  );
}
