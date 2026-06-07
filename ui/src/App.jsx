import { useState } from "react";
import "./App.css";
import { dynamic } from "./styles.js";

const API = "http://localhost:5050";

const ALGOS = {
  bubble: { label: "Bubble", full: "Bubble Sort", color: "#c0392b" },
  merge:  { label: "Merge",  full: "Merge Sort",  color: "#2471a3" },
  quick:  { label: "Quick",  full: "Quick Sort",  color: "#1e8449" },
};

const SCENARIOS = [
  { key: "random",          label: "random array",       hint: "quick sort's sweet spot"   },
  { key: "sorted",          label: "already sorted",     hint: "kills naive quick sort"     },
  { key: "reverse",         label: "reverse sorted",     hint: "quick sort worst case"      },
  { key: "nearly_sorted",   label: "nearly sorted",      hint: "interesting middle ground"  },
  { key: "many_duplicates", label: "lots of duplicates", hint: "partition skew test"        },
];

export default function App() {
  const [selected, setSelected] = useState(["merge", "quick"]);
  const [input, setInput]       = useState("");
  const [mode, setMode]         = useState("custom");
  const [scenario, setScenario] = useState("random");
  const [n, setN]               = useState(300);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  function toggle(key) {
    setSelected(prev => {
      if (prev.includes(key)) return prev.length > 2 ? prev.filter(k => k !== key) : prev;
      return prev.length < 3 ? [...prev, key] : prev;
    });
    setResult(null);
  }

  async function post(url, body) {
    setError(""); setResult(null); setLoading(true);
    try {
      const r = await fetch(API + url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setResult(await r.json());
    } catch {
      setError("Flask server not reachable on port 5050.");
    }
    setLoading(false);
  }

  function runCustom() {
    const nums = input.split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.some(isNaN)) { setError("numbers only please"); return; }
    if (nums.length < 2)  { setError("need at least 2 numbers"); return; }
    post("/sort", { numbers: nums, algorithms: selected });
  }

  function runScenario() {
    post("/scenario", { scenario, n: Number(n), algorithms: selected });
  }

  function switchMode(m) {
    setMode(m);
    setResult(null);
    setError("");
  }

  const maxTime = result
    ? Math.max(...Object.values(result.results).map(r => r.time_ms))
    : 1;

  return (
    <div className="page">
      <div className="heading">sort complexity</div>
      <div className="sub">bubble / merge / quick — timed in python</div>

      {/* algorithm picker */}
      <div>
        <span className="field-label">algorithms (pick 2 or 3)</span>
        <div className="btn-row">
          {Object.entries(ALGOS).map(([key, meta]) => {
            const on = selected.includes(key);
            return (
              <button
                key={key}
                className={`algo-btn ${on ? "on" : "off"}`}
                style={on ? { background: meta.color, border: `1px solid ${meta.color}` } : {}}
                onClick={() => toggle(key)}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* mode tabs */}
      <div className="tab-bar">
        <button className={`tab-btn ${mode === "custom" ? "active" : "inactive"}`} onClick={() => switchMode("custom")}>
          enter numbers
        </button>
        <button className={`tab-btn ${mode === "scenario" ? "active" : "inactive"}`} onClick={() => switchMode("scenario")}>
          preset scenario
        </button>
      </div>

      {/* custom input */}
      {mode === "custom" && (
        <div>
          <span className="field-label">numbers (space or comma separated)</span>
          <textarea
            rows={2}
            className="text-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="5 3 8 1 9 2 7 4 6"
          />
          <button className="run-btn" onClick={runCustom} disabled={loading}>
            {loading ? "running..." : "run"}
          </button>
        </div>
      )}

      {/* scenario input */}
      {mode === "scenario" && (
        <div>
          <span className="field-label">scenario</span>
          {SCENARIOS.map(sc => (
            <div
              key={sc.key}
              className={`radio-row ${scenario === sc.key ? "active" : "idle"}`}
              onClick={() => setScenario(sc.key)}
            >
              <input
                type="radio"
                name="sc"
                checked={scenario === sc.key}
                onChange={() => setScenario(sc.key)}
                style={{ marginTop: 2 }}
              />
              <div>
                <div className="radio-label">{sc.label}</div>
                <div className="radio-hint">{sc.hint}</div>
              </div>
            </div>
          ))}
          <div className="n-row">
            <span>n =</span>
            <input
              type="number"
              className="num-input"
              min={10} max={2000}
              value={n}
              onChange={e => setN(e.target.value)}
            />
          </div>
          <button className="run-btn" onClick={runScenario} disabled={loading}>
            {loading ? "running..." : "run"}
          </button>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {/* results */}
      {result && (
        <>
          <div className="divider" />

          <div className="result-meta">
            n = {result.input_size}
            {result.fromScenario && <span>  ·  {result.scenario}</span>}
          </div>

          {selected.map(key => {
            const r   = result.results[key];
            const pct = Math.max(4, (r.time_ms / maxTime) * 100);
            const isWinner = result.winner === key;
            return (
              <div key={key}>
                <div className="bar-label">
                  <span>
                    {ALGOS[key].full}
                    {isWinner && <span className="bar-winner">← faster</span>}
                  </span>
                  <span className="complexity">{r.complexity}</span>
                </div>
                <div className="bar-track">
                  <div style={dynamic.barFill(pct, ALGOS[key].color)} />
                </div>
                <div className="bar-time">{r.time_ms.toFixed(4)} ms</div>
              </div>
            );
          })}

          <div className="insight-box">{result.insight}</div>

          {result.sample && (
            <div className="code-block">sample: [{result.sample.join(", ")}…]</div>
          )}

          {result.sorted && !result.fromScenario && (
            <div className="code-block">sorted: [{result.sorted.join(", ")}]</div>
          )}
        </>
      )}
    </div>
  );
}