import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from "recharts";
import api, { errMsg } from "../api";
import Icon from "../components/Icon.jsx";
import { ErrorState, PageHeader, Skeleton } from "../components/ui.jsx";

const ACCENT = "#7c7af6";
const tick = { fill: "#8b90a0", fontSize: 12 };
const tip = {
  contentStyle: { background: "#191c25", border: "1px solid #2d313d", borderRadius: 10, color: "#e8eaf0", fontSize: 13 },
  labelStyle: { color: "#a3a8b6" }, itemStyle: { color: "#e8eaf0" }, cursor: { fill: "rgba(255,255,255,.04)" },
};

const ChartCard = ({ title, sub, children }) => (
  <div className="card">
    <div className="card-head"><h3>{title}</h3>{sub && <p>{sub}</p>}</div>
    <div className="chart">{children}</div>
  </div>
);

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  const load = () => {
    setErr(""); setD(null);
    const paths = ["overview", "top-skills?limit=12", "salary?by=role", "salary?by=city", "hiring-trend", "top-companies?limit=10"];
    Promise.all(paths.map((p) => api.get("/analytics/" + p))).then((r) => setD(r.map((x) => x.data))).catch((e) => setErr(errMsg(e)));
  };
  useEffect(load, []);

  if (err) return <><PageHeader title="Dashboard" /><ErrorState message={err} onRetry={load} /></>;
  if (!d) return (
    <>
      <PageHeader title="Dashboard" sub="Job market overview" />
      <div className="stats">{[0, 1, 2, 3, 4].map((i) => <div className="card" key={i}><Skeleton h={40} /></div>)}</div>
      <div className="grid-2">{[0, 1, 2, 3].map((i) => <div className="card" key={i}><Skeleton h={300} /></div>)}</div>
    </>
  );

  const [ov, skills, roles, cities, trend, companies] = d;
  const stats = [
    ["Open jobs", ov.jobs, "briefcase"], ["Companies", ov.companies, "building"], ["Users", ov.users, "users"],
    ["Applications", ov.applications, "file"], ["Avg salary (LPA)", ov.avgSalary, "rupee"],
  ];

  return (
    <>
      <PageHeader title="Dashboard" sub="Skills, salaries and hiring activity across all job postings" />
      <div className="stats">
        {stats.map(([label, v, icon]) => (
          <div className="card stat-card" key={label}>
            <span className="stat-ico"><Icon name={icon} /></span>
            <div><div className="stat-val">{Number(v).toLocaleString()}</div><div className="stat-label">{label}</div></div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <ChartCard title="Most in-demand skills" sub="Number of jobs requiring each skill">
          <ResponsiveContainer><BarChart data={skills} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" tick={tick} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="skill" width={110} interval={0} tick={tick} axisLine={false} tickLine={false} />
            <Tooltip {...tip} /><Bar dataKey="count" name="Jobs" fill={ACCENT} radius={[0, 4, 4, 0]} barSize={14} />
          </BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Hiring trend by month" sub="Jobs posted per month">
          <ResponsiveContainer><AreaChart data={trend} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid stroke="#22252f" vertical={false} />
            <XAxis dataKey="month" tick={tick} axisLine={false} tickLine={false} />
            <YAxis tick={tick} axisLine={false} tickLine={false} width={44} />
            <Tooltip {...tip} cursor={{ stroke: "#2d313d" }} />
            <Area type="monotone" dataKey="jobs" name="Jobs posted" stroke={ACCENT} strokeWidth={2} fill={ACCENT} fillOpacity={0.12} />
          </AreaChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Average salary by role" sub="In lakhs per annum (LPA)">
          <ResponsiveContainer><BarChart data={roles} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" tick={tick} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={150} interval={0} tick={tick} axisLine={false} tickLine={false} />
            <Tooltip {...tip} /><Bar dataKey="avgSalary" name="Avg LPA" fill={ACCENT} radius={[0, 4, 4, 0]} barSize={14} />
          </BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Average salary by city" sub="In lakhs per annum (LPA)">
          <ResponsiveContainer><BarChart data={cities} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid stroke="#22252f" vertical={false} />
            <XAxis dataKey="name" interval={0} tick={{ ...tick, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={tick} axisLine={false} tickLine={false} width={36} />
            <Tooltip {...tip} /><Bar dataKey="avgSalary" name="Avg LPA" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart></ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Top hiring companies</h3><p>Ranked by number of open jobs</p></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Company</th><th>Open jobs</th><th>Avg salary (LPA)</th></tr></thead>
            <tbody>{companies.map((c, i) => (
              <tr key={c.company}><td className="dim">{i + 1}</td><td><b style={{ fontWeight: 600 }}>{c.company}</b></td><td>{c.jobs}</td><td>{c.avgSalary}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}
