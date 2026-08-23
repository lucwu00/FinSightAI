import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import './CoverageGapPanel.css';

// ─── Constants ────────────────────────────────────────────────────────────────

// MAS-aligned life coverage benchmark: 10× annual income
const LIFE_INCOME_MULTIPLIER = 10;

// Category definitions — maps your productType values to coverage buckets
const COVERAGE_CATEGORIES = [
  {
    key: 'life',
    label: 'Life Coverage',
    icon: '🛡️',
    types: ['Whole Life', 'Term Life', 'Universal Life'],
    description: 'Death & TPD protection',
    benchmarkFn: (annualIncome) => annualIncome * LIFE_INCOME_MULTIPLIER,
    benchmarkLabel: (annualIncome) =>
      `Benchmark: ${LIFE_INCOME_MULTIPLIER}× income = $${(annualIncome * LIFE_INCOME_MULTIPLIER).toLocaleString()}`,
  },
  {
    key: 'health',
    label: 'Health & Hospitalisation',
    icon: '🏥',
    types: ['Hospitalization', 'Critical Illness'],
    description: 'Medical & CI coverage',
    benchmarkFn: (annualIncome) => annualIncome * 2,
    benchmarkLabel: (annualIncome) =>
      `Benchmark: 2× income = $${(annualIncome * 2).toLocaleString()}`,
  },
  {
    key: 'income',
    label: 'Income Protection',
    icon: '💼',
    types: ['Income Protection', 'Disability', 'Personal Accident'],
    description: 'Salary replacement coverage',
    benchmarkFn: (annualIncome) => annualIncome * 5,
    benchmarkLabel: (annualIncome) =>
      `Benchmark: 5× income = $${(annualIncome * 5).toLocaleString()}`,
  },
  {
    key: 'savings',
    label: 'Savings & Investment',
    icon: '📈',
    types: ['Investment-Linked', 'Endowment', 'Retirement Plan', 'Child Education'],
    description: 'Wealth accumulation',
    benchmarkFn: (annualIncome) => annualIncome * 3,
    benchmarkLabel: (annualIncome) =>
      `Benchmark: 3× income = $${(annualIncome * 3).toLocaleString()}`,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function lifeStageLabel(age) {
  if (age === null) return 'Unknown';
  if (age < 30) return 'Early Career';
  if (age < 40) return 'Young Family';
  if (age < 50) return 'Mid Career';
  if (age < 60) return 'Pre-Retirement';
  return 'Retirement';
}

function coverageRating(ratio) {
  if (ratio >= 1.0) return { label: 'Well Covered', color: '#22c55e', bg: '#f0fdf4', bar: '#22c55e' };
  if (ratio >= 0.7) return { label: 'Adequate',     color: '#84cc16', bg: '#f7fee7', bar: '#84cc16' };
  if (ratio >= 0.4) return { label: 'Under-Insured', color: '#f59e0b', bg: '#fffbeb', bar: '#f59e0b' };
  return                   { label: 'At Risk',       color: '#ef4444', bg: '#fef2f2', bar: '#ef4444' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MeterBar({ ratio, color }) {
  const pct = Math.min(ratio * 100, 100);
  return (
    <div className="cgp-meter-track">
      <div
        className="cgp-meter-fill"
        style={{ width: `${pct}%`, background: color }}
      />
      {ratio > 1 && (
        <div className="cgp-meter-overflow" title="Exceeds benchmark" />
      )}
    </div>
  );
}

function CategoryCard({ cat, annualIncome, activePolicies }) {
  const [expanded, setExpanded] = useState(false);

  const matchingPolicies = activePolicies.filter((p) =>
    cat.types.some(
      (t) => (p.policyName || '').includes(t) || (p.productType || '') === t
    )
  );

  const totalCoverage = matchingPolicies.reduce(
    (sum, p) => sum + (parseFloat(p.coverageAmount) || 0),
    0
  );

  const benchmark = cat.benchmarkFn(annualIncome);
  const ratio = benchmark > 0 ? totalCoverage / benchmark : 0;
  const rating = coverageRating(ratio);
  const isMissing = matchingPolicies.length === 0;

  return (
    <div
      className={`cgp-cat-card ${isMissing ? 'cgp-cat-missing' : ''}`}
      style={{ '--accent': rating.color, '--accent-bg': rating.bg }}
    >
      <div className="cgp-cat-header" onClick={() => setExpanded((e) => !e)}>
        <span className="cgp-cat-icon">{cat.icon}</span>
        <div className="cgp-cat-info">
          <div className="cgp-cat-label">{cat.label}</div>
          <div className="cgp-cat-desc">{cat.description}</div>
        </div>
        <div className="cgp-cat-right">
          {isMissing ? (
            <span className="cgp-badge cgp-badge-missing">Not Covered</span>
          ) : (
            <span className="cgp-badge" style={{ color: rating.color, background: rating.bg }}>
              {rating.label}
            </span>
          )}
          <span className="cgp-expand-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {!isMissing && (
        <div className="cgp-cat-meter">
          <MeterBar ratio={ratio} color={rating.bar} />
          <div className="cgp-meter-labels">
            <span style={{ color: rating.color, fontWeight: 600 }}>
              ${totalCoverage.toLocaleString()}
            </span>
            <span className="cgp-meter-bench">{cat.benchmarkLabel(annualIncome)}</span>
          </div>
        </div>
      )}

      {expanded && (
        <div className="cgp-cat-detail">
          {isMissing ? (
            <p className="cgp-missing-msg">
              No active policies in this category. Consider discussing options with the client.
            </p>
          ) : (
            <table className="cgp-policy-mini-table">
              <thead>
                <tr>
                  <th>Policy</th>
                  <th>Provider</th>
                  <th>Coverage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {matchingPolicies.map((p) => (
                  <tr key={p.policyId}>
                    <td>{p.policyName || '-'}</td>
                    <td>{p.provider || '-'}</td>
                    <td>${parseFloat(p.coverageAmount || 0).toLocaleString()}</td>
                    <td>
                      <span
                        className={`cgp-status-pill ${
                          (p.status || '').toLowerCase().replace(' ', '-')
                        }`}
                      >
                        {p.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Overall score dial ───────────────────────────────────────────────────────

function OverallScore({ categories, annualIncome, activePolicies }) {
  const scores = categories.map((cat) => {
    const matching = activePolicies.filter((p) =>
      cat.types.some(
        (t) => (p.policyName || '').includes(t) || (p.productType || '') === t
      )
    );
    const total = matching.reduce((s, p) => s + (parseFloat(p.coverageAmount) || 0), 0);
    const bench = cat.benchmarkFn(annualIncome);
    return bench > 0 ? Math.min(total / bench, 1) : 0;
  });

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const pct = Math.round(avg * 100);
  const rating = coverageRating(avg);

  // SVG arc
  const r = 38;
  const cx = 50;
  const cy = 50;
  const circumference = Math.PI * r; // half-circle
  const offset = circumference * (1 - avg);

  return (
    <div className="cgp-score-block">
      <svg viewBox="0 0 100 60" className="cgp-score-svg">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={rating.bar}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${offset}`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" className="cgp-score-pct">
          {pct}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="cgp-score-label">
          {rating.label}
        </text>
      </svg>
      <p className="cgp-score-caption">Overall coverage score across all categories</p>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function CoverageGapPanel({ client, policies, apiBaseUrl }) {
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  const annualIncome = parseFloat(client?.annualIncome) || 0;
  const age = calcAge(client?.dob);

  // Only count active policies for coverage analysis
  const activePolicies = useMemo(
    () =>
      policies.filter((p) => {
        const now = new Date();
        const end = p.endDate ? new Date(p.endDate) : null;
        return !end || end >= now;
      }),
    [policies]
  );

  // Fetch AI gap narrative from existing endpoint
  useEffect(() => {
    if (!client?.clientId || policies.length === 0) return;
    setAiLoading(true);
    setAiError(false);
    setAiInsight('');

    axios
      .get(`${apiBaseUrl}/api/clients/${client.clientId}/gap-insights`)
      .then((res) => {
        const text =
          res?.data?.insight ??
          res?.data?.summary ??
          res?.data?.content ??
          (typeof res?.data === 'string' ? res.data : '');
        setAiInsight(text);
      })
      .catch(() => setAiError(true))
      .finally(() => setAiLoading(false));
  }, [client?.clientId, policies.length, apiBaseUrl]);

  if (!client || !annualIncome) {
    return (
      <div className="cgp-no-income">
        ℹ️ Coverage analysis requires the client's annual income to be recorded.
      </div>
    );
  }

  return (
    <div className="cgp-panel">
      {/* Header row */}
      <div className="cgp-header">
        <div className="cgp-title-block">
          <h3 className="cgp-title">📊 Coverage Gap Analysis</h3>
          <div className="cgp-client-meta">
            <span className="cgp-meta-pill">Age {age ?? '—'}</span>
            <span className="cgp-meta-pill">{lifeStageLabel(age)}</span>
            <span className="cgp-meta-pill">
              Income: ${annualIncome.toLocaleString()}/yr
            </span>
            <span className="cgp-meta-pill">
              Risk: {client.riskProfile || 'Not set'}
            </span>
          </div>
        </div>

        <OverallScore
          categories={COVERAGE_CATEGORIES}
          annualIncome={annualIncome}
          activePolicies={activePolicies}
        />
      </div>

      {/* Category cards */}
      <div className="cgp-categories">
        {COVERAGE_CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.key}
            cat={cat}
            annualIncome={annualIncome}
            activePolicies={activePolicies}
          />
        ))}
      </div>

      {/* AI narrative */}
      <div className="cgp-ai-section">
        <div className="cgp-ai-label">🤖 AI Gap Narrative</div>
        {aiLoading && (
          <div className="cgp-ai-loading">
            <span className="cgp-spinner" /> Analysing coverage gaps…
          </div>
        )}
        {aiError && (
          <div className="cgp-ai-error">
            Could not load AI narrative. The gap analysis above is based on live data.
          </div>
        )}
        {!aiLoading && !aiError && aiInsight && (
  <div className="cgp-ai-text">
    {(() => {
      try {
        const parsed = JSON.parse(aiInsight);
        const insights = parsed.insights || [];
        return insights.map((insight, i) => (
          <p key={i} style={{ marginBottom: '0.5rem' }}>• {insight}</p>
        ));
      } catch {
        return (
          <div dangerouslySetInnerHTML={{
            __html: aiInsight
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n/g, '<br/>'),
          }} />
        );
      }
    })()}
  </div>
)}
        {!aiLoading && !aiError && !aiInsight && (
          <div className="cgp-ai-empty">
            No narrative available yet.
          </div>
        )}
      </div>
    </div>
  );
}
