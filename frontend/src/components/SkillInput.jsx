import { useState } from "react";
import Icon from "./Icon.jsx";

/** Chips + text box. Press Enter / comma / Add to add a skill. */
export default function SkillInput({ value, onChange, options = [] }) {
  const [text, setText] = useState("");
  const add = (s) => {
    s = s.trim();
    if (!s) return;
    const match = options.find((o) => o.toLowerCase() === s.toLowerCase()) || s;
    if (!value.includes(match)) onChange([...value, match]);
    setText("");
  };
  return (
    <div>
      {value.length > 0 && (
        <div className="chips" style={{ marginBottom: 10 }}>
          {value.map((s) => (
            <span key={s} className="chip accent">
              {s}
              <button type="button" aria-label={"Remove " + s} onClick={() => onChange(value.filter((x) => x !== s))}><Icon name="x" size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="row">
        <input
          list="skill-options"
          value={text}
          aria-label="Add a skill"
          placeholder="Type a skill, e.g. Java, then press Enter"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(text); } }}
        />
        <button type="button" className="btn secondary" onClick={() => add(text)}><Icon name="plus" size={16} />Add</button>
      </div>
      <datalist id="skill-options">{options.map((o) => <option key={o} value={o} />)}</datalist>
    </div>
  );
}
