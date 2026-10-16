import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg, useMeta } from "../api";
import { useAuth } from "../AuthContext.jsx";
import SkillInput from "../components/SkillInput.jsx";
import Icon from "../components/Icon.jsx";
import { Brand } from "../components/Layout.jsx";
import { Spinner } from "../components/ui.jsx";

const FEATURES = [
  ["trend", "Live market analytics", "Skills, salaries and hiring trends across 50,000+ postings."],
  ["sparkles", "Skill-based matching", "Enter your skills and see jobs ranked by how well you fit."],
  ["file", "Track every application", "Apply in one click and keep your history in one place."],
];

const FieldError = ({ id, children }) => children ? <div id={id} className="field-error" role="alert"><Icon name="alert" size={13} />{children}</div> : null;

export default function Auth({ mode }) {
  const signup = mode === "signup";
  const nav = useNavigate();
  const { save } = useAuth();
  const meta = useMeta();
  const [f, setF] = useState({ name: "", email: "", password: "", city: "", skills: [] });
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  // same rules as before: required fields, valid email, password of 6+ characters
  const errors = {};
  if (signup && !f.name.trim()) errors.name = "Please enter your name";
  if (!/^\S+@\S+\.\S+$/.test(f.email)) errors.email = "Enter a valid email address";
  if (!f.password) errors.password = "Enter your password";
  else if (f.password.length < 6) errors.password = "Use at least 6 characters";
  const show_ = (k) => touched[k] && errors[k];

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setTouched({ name: true, email: true, password: true });
    if (Object.keys(errors).length) return;
    setBusy(true);
    try {
      const body = signup ? f : { email: f.email, password: f.password };
      const { data } = await api.post(signup ? "/auth/signup" : "/auth/login", body);
      save(data);
      nav("/");
    } catch (x) { setErr(errMsg(x)); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-brand">
        <Brand />
        <div>
          <h1>Understand the job market. Land the right role.</h1>
          <p className="lead">Explore hiring data, discover in-demand skills, and get matched to jobs that fit what you already know.</p>
          {FEATURES.map(([icon, title, text]) => (
            <div className="feat" key={title}>
              <span className="feat-ico"><Icon name={icon} /></span>
              <div><b>{title}</b><span>{text}</span></div>
            </div>
          ))}
        </div>
        <div aria-hidden="true" />
      </aside>

      <main className="auth-panel">
        <form className="auth-form" onSubmit={submit} noValidate>
          <div className="auth-mobile-brand"><Brand /></div>
          <h2>{signup ? "Create your account" : "Welcome back"}</h2>
          <p className="sub">{signup ? "Add your skills to get personalised job matches." : "Log in to continue to your dashboard."}</p>

          {err && <div className="alert" role="alert"><Icon name="alert" size={16} />{err}</div>}

          {signup && (
            <label className="field">Name
              <input autoComplete="name" value={f.name} onChange={set("name")} onBlur={blur("name")} aria-invalid={!!show_("name")} placeholder="Your full name" />
              <FieldError>{show_("name")}</FieldError>
            </label>
          )}
          <label className="field">Email
            <input type="email" autoComplete="email" value={f.email} onChange={set("email")} onBlur={blur("email")} aria-invalid={!!show_("email")} placeholder="you@example.com" />
            <FieldError>{show_("email")}</FieldError>
          </label>
          <label className="field">Password
            <div className="pw">
              <input type={show ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} value={f.password}
                     onChange={set("password")} onBlur={blur("password")} aria-invalid={!!show_("password")} placeholder={signup ? "At least 6 characters" : "Your password"} />
              <button type="button" className="pw-toggle" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>
                <Icon name={show ? "eyeOff" : "eye"} size={16} />
              </button>
            </div>
            <FieldError>{show_("password")}</FieldError>
          </label>

          {signup && (
            <>
              <label className="field">City
                <select value={f.city} onChange={set("city")}>
                  <option value="">Select city</option>
                  {meta.cities.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <div className="field" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: 20 }}>
                <div style={{ marginBottom: 6 }}>Your skills <span className="dim">(used for recommendations)</span></div>
                <SkillInput value={f.skills} onChange={(skills) => setF({ ...f, skills })} options={meta.skills} />
              </div>
            </>
          )}

          <button className="btn block" disabled={busy} style={{ marginTop: 4 }}>
            {busy && <Spinner />}{signup ? "Create account" : "Log in"}
          </button>
          <p className="auth-switch">
            {signup ? <>Already registered? <Link to="/login">Log in</Link></> : <>New here? <Link to="/signup">Create an account</Link></>}
          </p>
        </form>
      </main>
    </div>
  );
}
