import { useState } from "react";

const API = "http://localhost:5050";

const ALGOS = {
  bubble: { label: "Bubble Sort", complexity: "O(n²)", color: "#d9534f" },
  merge: { label: "Merge Sort", complexity: "O(n log n)", color: "#3a7bd5" },
  quick: {
    label: "Quick Sort",
    complexity: "O(n log n) / worst O(n²)",
    color: "#2e8b57",
  },
};

const SCENARIOS = [
  { key: "random", label: "Random", note: "Quick Sort's ideal case" },
  {
    key: "sorted",
    label: "Already Sorted",
    note: "Quick Sort's worst case (naive pivot)",
  },
  {
    key: "reverse",
    label: "Reverse Sorted",
    note: "Quick Sort degrades badly",
  },
  {
    key: "nearly_sorted",
    label: "Nearly Sorted",
    note: "Interesting middle ground",
  },
  {
    key: "many_duplicates",
    label: "Many Duplicates",
    note: "Tests duplicate handling",
  },
];

function Bar({ label, timeMs, maxTime, color, complexity, isWinner }) {
  const pct = maxTime > 0 ? Math.max(4, (timeMs / maxTime) * 100) : 4;
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 5,
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {label}
          {isWinner && (
            <span
              style={{
                fontSize: 11,
                background: "#222",
                color: "#fff",
                padding: "1px 7px",
                borderRadius: 10,
              }}
            >
              faster
            </span>
          )}
        </span>
        <span style={{ color: "#888", fontFamily: "monospace", fontSize: 12 }}>
          {complexity}
        </span>
      </div>
      <div style={{ background: "#eee", borderRadius: 2, height: 12 }}>
        <div
          style={{
            width: `${pct}%`,
            background: color,
            height: "100%",
            borderRadius: 2,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 12,
          color: "#555",
          marginTop: 4,
          fontFamily: "monospace",
        }}
      >
        {timeMs.toFixed(4)} ms
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          color: "#999",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState(["merge", "quick"]);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("custom"); // "custom" | "scenario"
  const [scenario, setScenario] = useState("random");
  const [scenarioN, setScenarioN] = useState(300);

  function toggleAlgo(key) {
    setSelected((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 2) return prev; // keep minimum 2
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= 3) return prev; // max 3
      return [...prev, key];
    });
    setResult(null);
  }

  async function runCustom() {
    setError("");
    setResult(null);
    const nums = input
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number);
    if (nums.some(isNaN)) {
      setError("Numbers only — spaces or commas.");
      return;
    }
    if (nums.length < 2) {
      setError("Enter at least 2 numbers.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/sort`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: nums, algorithms: selected }),
      });
      setResult(await res.json());
    } catch {
      setError("Cannot reach Flask server on port 5050.");
    }
    setLoading(false);
  }

  async function runScenario() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/scenario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, n: scenarioN, algorithms: selected }),
      });
      const data = await res.json();
      setResult({ ...data, fromScenario: true });
    } catch {
      setError("Cannot reach Flask server on port 5050.");
    }
    setLoading(false);
  }

  const maxTime = result
    ? Math.max(...Object.values(result.results).map((r) => r.time_ms))
    : 1;

  const isMergeVsQuick =
    selected.includes("merge") &&
    selected.includes("quick") &&
    !selected.includes("bubble");

  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        maxWidth: 560,
        margin: "50px auto",
        padding: "0 20px",
        color: "#222",
      }}
    >
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 4 }}>
        Sort Complexity
      </h2>
      <p style={{ color: "#777", fontSize: 13, margin: "0 0 28px" }}>
        Compare sorting algorithms — real timing via Python
      </p>

      {/* Algorithm selector */}
      <Section title="Algorithms (pick 2 or 3)">
        <div style={{ display: "flex", gap: 10 }}>
          {Object.entries(ALGOS).map(([key, meta]) => {
            const on = selected.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleAlgo(key)}
                style={{
                  flex: 1,
                  padding: "8px 6px",
                  border: `2px solid ${on ? meta.color : "#ddd"}`,
                  borderRadius: 3,
                  background: on ? meta.color : "#fff",
                  color: on ? "#fff" : "#555",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
        {isMergeVsQuick && (
          <p
            style={{
              fontSize: 12,
              color: "#888",
              margin: "8px 0 0",
              fontStyle: "italic",
            }}
          >
            Merge always splits in half · Quick uses first-element pivot
            (textbook behaviour)
          </p>
        )}
      </Section>

      {/* Mode tabs */}
      <Section title="Input">
        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 14,
            borderBottom: "1px solid #ddd",
          }}
        >
          {["custom", "scenario"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setResult(null);
                setError("");
              }}
              style={{
                padding: "6px 16px",
                border: "none",
                borderBottom:
                  mode === m ? "2px solid #222" : "2px solid transparent",
                background: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: mode === m ? 700 : 400,
                color: mode === m ? "#222" : "#888",
                marginBottom: -1,
              }}
            >
              {m === "custom" ? "Your Numbers" : "Preset Scenarios"}
            </button>
          ))}
        </div>

        {mode === "custom" && (
          <>
            <textarea
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g.  5 3 8 1 9 2 7 4 6"
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontFamily: "monospace",
                fontSize: 14,
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: 3,
                resize: "none",
                outline: "none",
              }}
            />
            <button
              onClick={runCustom}
              disabled={loading}
              style={{
                marginTop: 10,
                padding: "8px 20px",
                background: "#222",
                color: "#fff",
                border: "none",
                borderRadius: 3,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 13,
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "Running…" : "Run"}
            </button>
          </>
        )}

        {mode === "scenario" && (
          <>
            <div style={{ display: "grid", gap: 8 }}>
              {SCENARIOS.map((s) => (
                <label
                  key={s.key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    cursor: "pointer",
                    padding: "8px 10px",
                    border: `1px solid ${scenario === s.key ? "#222" : "#e0e0e0"}`,
                    borderRadius: 3,
                    background: scenario === s.key ? "#f8f8f8" : "#fff",
                  }}
                >
                  <input
                    type="radio"
                    name="scenario"
                    value={s.key}
                    checked={scenario === s.key}
                    onChange={() => setScenario(s.key)}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#888" }}>{s.note}</div>
                  </div>
                </label>
              ))}
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Array size:
              </label>
              <input
                type="number"
                min={10}
                max={2000}
                value={scenarioN}
                onChange={(e) => setScenarioN(Number(e.target.value))}
                style={{
                  width: 80,
                  padding: "5px 8px",
                  border: "1px solid #ccc",
                  borderRadius: 3,
                  fontFamily: "monospace",
                  fontSize: 13,
                }}
              />
              <span style={{ fontSize: 12, color: "#aaa" }}>max 2000</span>
            </div>

            <button
              onClick={runScenario}
              disabled={loading}
              style={{
                marginTop: 12,
                padding: "8px 20px",
                background: "#222",
                color: "#fff",
                border: "none",
                borderRadius: 3,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 13,
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "Running…" : "Run Scenario"}
            </button>
          </>
        )}
      </Section>

      {error && <p style={{ color: "#c00", fontSize: 13 }}>{error}</p>}

      {result && (
        <>
          <Section title={`Results — n = ${result.input_size}`}>
            {selected.map((key) => (
              <Bar
                key={key}
                label={ALGOS[key].label}
                timeMs={result.results[key].time_ms}
                maxTime={maxTime}
                color={ALGOS[key].color}
                complexity={result.results[key].complexity}
                isWinner={result.winner === key}
              />
            ))}
          </Section>

          <Section title="Why">
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                margin: 0,
                color: "#444",
                background: "#f8f8f8",
                padding: "12px 14px",
                borderRadius: 3,
                borderLeft: "3px solid #ddd",
              }}
            >
              {result.insight}
            </p>
          </Section>

          {result.fromScenario && result.sample && (
            <Section title="Sample of generated array (first 20)">
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#666",
                  background: "#f5f5f5",
                  padding: "8px 12px",
                  borderRadius: 3,
                }}
              >
                [{result.sample.join(", ")}…]
              </div>
            </Section>
          )}

          {!result.fromScenario && result.sorted && (
            <Section title="Sorted output">
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#666",
                  background: "#f5f5f5",
                  padding: "8px 12px",
                  borderRadius: 3,
                  wordBreak: "break-all",
                }}
              >
                [{result.sorted.join(", ")}]
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
