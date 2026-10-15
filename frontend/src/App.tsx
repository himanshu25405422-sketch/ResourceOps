import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Building2, Check, ChevronDown, FileUp, Info, Menu, Settings as SettingsIcon, Sparkles, Target, TrendingUp, UploadCloud, X, Zap } from "lucide-react";
import { api } from "./api";
import { Button, BeforeAfter, Badge, CompactBar, ContextPanel, DataQualityBanner, EmptyState, ErrorNotice, EvidenceRow, InsightBlock, LoadingState, MetricCard, OpportunityCard, PageHeader, TrendChart, formatCurrency, formatNumber } from "./components";
import { dataHealth as demoHealth, dashboard as demoDashboard, details as demoDetails, impact as demoImpact, opportunities as demoOpportunities, recommendations as demoRecommendations, series as demoSeries } from "./data";
import type { Dashboard, DataHealth, Detail, EnergyOverview, Impact, Opportunity, Recommendation, Simulation } from "./types";

type Route = "dashboard" | "intelligence" | "opportunities" | "recommendations" | "simulator" | "impact" | "data" | "settings" | `opportunity:${string}`;

const nav = [
  { key: "dashboard", label: "Command Center", icon: Activity },
  { key: "intelligence", label: "Energy Intelligence", icon: BarChart3 },
  { key: "opportunities", label: "Opportunities", icon: Target },
  { key: "recommendations", label: "Recommendations", icon: Sparkles },
  { key: "simulator", label: "Simulator", icon: Zap },
  { key: "impact", label: "Impact", icon: ArrowRight },
  { key: "data", label: "Data", icon: UploadCloud },
  { key: "settings", label: "Settings", icon: SettingsIcon },
] as const;

function routeFromHash(): Route { const raw = window.location.hash.replace(/^#\/?/, "") || "dashboard"; return raw.startsWith("opportunities/") ? `opportunity:${raw.split("/")[1]}` : (raw as Route); }

function AppShell({ route, onNavigate, children }: { route: Route; onNavigate: (route: Route) => void; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = route.startsWith("opportunity:") ? "opportunities" : route;
  const navigate = (next: Route) => { onNavigate(next); setMobileOpen(false); };
  return <div className="app-shell"><aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}><div className="brand"><div className="brand-mark">R</div><div><strong>ResourceOps</strong><small>ENERGY OPERATIONS</small></div><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={17} /></button></div><div className="building-switcher"><Building2 size={15} /><div><span>ACTIVE BUILDING</span><strong>Orion Business Center</strong></div><ChevronDown size={13} /></div><nav><div className="nav-label">Workspace</div>{nav.slice(0, 6).map(({ key, label, icon: Icon }) => <button key={key} className={`nav-item ${active === key ? "active" : ""}`} onClick={() => navigate(key as Route)}><Icon size={16} /><span>{label}</span>{key === "opportunities" && <b>5</b>}</button>)}<div className="nav-label nav-label-space">System</div>{nav.slice(6).map(({ key, label, icon: Icon }) => <button key={key} className={`nav-item ${active === key ? "active" : ""}`} onClick={() => navigate(key as Route)}><Icon size={16} /><span>{label}</span></button>)}</nav><div className="sidebar-footer"><div className="status-dot"><i /> Analysis current</div><span>Model {"contextual-baseline-v0.1"}</span></div></aside><div className={`mobile-overlay ${mobileOpen ? "show" : ""}`} onClick={() => setMobileOpen(false)} /><main className="main-shell"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={18} /></button><div className="breadcrumb"><span>ORION BUSINESS CENTER</span><i>/</i><strong>{nav.find((item) => item.key === active)?.label ?? "Opportunity detail"}</strong></div><div className="topbar-right"><span className="topbar-date">October 04, 2026</span><span className="topbar-avatar">HK</span></div></header>{children}</main></div>;
}

function CommandCenter({ dashboard, onNavigate }: { dashboard: Dashboard; onNavigate: (route: Route) => void }) {
  return <div className="page"><PageHeader eyebrow="Energy operations · October 2026" title="What should I care about right now?" description="A contextual view of what is happening, why it matters, and where to intervene first." actions={<><Button variant="secondary" onClick={() => onNavigate("data")}> <FileUp size={14} /> Import data</Button><Button onClick={() => onNavigate("simulator")}>Simulate intervention <ArrowRight size={14} /></Button></>} /><DataQualityBanner completeness={dashboard.data_quality.completeness} onOpen={() => onNavigate("data")} /><div className="metric-grid"><MetricCard label="Current usage" value={`${formatNumber(dashboard.current_usage_kwh)} kWh`} caption="October · actual consumption" icon={<Zap size={16} />} /><MetricCard label="Expected baseline" value={`${formatNumber(dashboard.expected_usage_kwh)} kWh`} caption="Contextual model · v0.1" icon={<Activity size={16} />} /><MetricCard label="Variance" value={`+${dashboard.variance_percent}%`} caption="Above expected conditions" tone="accent" icon={<ArrowUpRight size={16} />} /><MetricCard label="Potential savings" value={`${formatCurrency(dashboard.potential_monthly_savings)}/mo`} caption="Across ranked opportunities" tone="positive" icon={<TrendingUpIcon />} /></div><div className="content-grid dashboard-grid"><section className="panel trend-panel"><div className="panel-head"><div><div className="eyebrow">Observed behavior</div><h2>Actual vs expected energy</h2><p>Last 14 days · anomaly markers are evidence, not alarms.</p></div><button className="select-button" onClick={() => onNavigate("intelligence")}>7D <ChevronDown size={13} /></button></div><TrendChart points={demoSeries("7D").points} /></section><section className="panel"><div className="panel-head"><div><div className="eyebrow">Ranked by impact × confidence</div><h2>Priority opportunities</h2></div><button className="inline-link" onClick={() => onNavigate("opportunities")}>View all <ArrowRight size={13} /></button></div><div className="opportunity-list">{dashboard.priority_opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} onOpen={() => onNavigate(`opportunity:${opportunity.id}`)} />)}</div></section></div><InsightBlock title={dashboard.insight.title} onAction={() => onNavigate("opportunity:after-hours-hvac")}>{dashboard.insight.body}</InsightBlock></div>;
}

function TrendingUpIcon() { return <TrendingUp size={16} />; }

type BreakdownCategory = "Operating hours" | "Non-operating hours" | "Weekday" | "Weekend";

const breakdownTabs: BreakdownCategory[] = ["Operating hours", "Non-operating hours", "Weekday", "Weekend"];

const breakdownConfigs: Record<
  BreakdownCategory,
  {
    bars: { label: string; value: number; max: number; color: "blue" | "pink" | "green"; note: string }[];
    signalTitle: string;
    signals: { num: string; bold: string; text: string }[];
    opportunityId: string;
    linkText: string;
  }
> = {
  "Operating hours": {
    bars: [
      { label: "Operating window", value: 30540, max: 48240, color: "blue", note: "63.3% of observed monthly usage (08:00–19:00)" },
      { label: "Expected baseline", value: 27190, max: 48240, color: "green", note: "Learned baseline accounting for daytime weather & occupancy" },
      { label: "Operating variance", value: 3350, max: 48240, color: "pink", note: "+12.3% residual above baseline during occupied periods" },
    ],
    signalTitle: "Three things changed",
    signals: [
      { num: "01", bold: "Evening occupancy fell.", text: "The abnormal window begins after the expected operating pattern ends." },
      { num: "02", bold: "HVAC stayed flat.", text: "Runtime did not respond to the lower load context." },
      { num: "03", bold: "The behavior repeats.", text: "Similar residuals appeared on four of the last five weekdays." },
    ],
    opportunityId: "after-hours-hvac",
    linkText: "Open the evidence chain",
  },
  "Non-operating hours": {
    bars: [
      { label: "Non-operating window", value: 17700, max: 48240, color: "pink", note: "36.7% of observed monthly usage outside working hours" },
      { label: "Expected standby baseline", value: 16610, max: 48240, color: "blue", note: "Normal overnight security, emergency lighting & baseload" },
      { label: "Avoidable off-hours residual", value: 1090, max: 48240, color: "green", note: "Recurring residuals drive the opportunity queue (Opportunity #1)" },
    ],
    signalTitle: "Off-hours signal analysis",
    signals: [
      { num: "01", bold: "Schedule overshoot.", text: "Active cooling remains engaged for up to 3 hours after occupants leave." },
      { num: "02", bold: "Standby load is stable.", text: "Baseline accounts for IT and security; deviation is strictly schedule overrun." },
      { num: "03", bold: "Recurring opportunity.", text: "Ending evening HVAC 45 mins earlier eliminates 1,420 kWh monthly." },
    ],
    opportunityId: "after-hours-hvac",
    linkText: "Inspect after-hours HVAC evidence",
  },
  "Weekday": {
    bars: [
      { label: "Weekday total actual", value: 38120, max: 48240, color: "blue", note: "79.0% of total monthly consumption across 22 working days" },
      { label: "Expected weekday baseline", value: 34700, max: 48240, color: "green", note: "Contextual expectation for normal business operations" },
      { label: "Weekday residual variance", value: 3420, max: 48240, color: "pink", note: "+9.9% above baseline, concentrated in evening overruns & Monday resets" },
    ],
    signalTitle: "Weekday pattern analysis",
    signals: [
      { num: "01", bold: "Schedule extension.", text: "Over 14% of weekday energy is consumed after the 19:00 official close." },
      { num: "02", bold: "Monday reset pattern.", text: "Systematic lag in returning to setback mode after weekend shutdown." },
      { num: "03", bold: "Lighting overrun.", text: "Lighting circuits remain energized 2 hours past operating closure on Mon/Wed/Fri." },
    ],
    opportunityId: "monday-inefficiency",
    linkText: "Review Monday reset pattern",
  },
  "Weekend": {
    bars: [
      { label: "Weekend total actual", value: 10120, max: 48240, color: "pink", note: "21.0% of total monthly consumption across 8 weekend days" },
      { label: "Expected weekend baseline", value: 9190, max: 48240, color: "blue", note: "Expected unoccupied baseline for security & idle standby" },
      { label: "Weekend baseload residual", value: 930, max: 48240, color: "green", note: "+10.1% avoidable baseload above expected idle conditions" },
    ],
    signalTitle: "Weekend baseload analysis",
    signals: [
      { num: "01", bold: "Ghost baseload.", text: "Non-operating energy recurs 18 kWh/hr above learned baseload on recent weekends." },
      { num: "02", bold: "Unshifted loads.", text: "Non-critical loads run during weekends rather than low-tariff windows." },
      { num: "03", bold: "Zero-cost intervention.", text: "Moving non-critical weekend load into operating window saves ₹10,140/mo." },
    ],
    opportunityId: "weekend-baseload",
    linkText: "Examine weekend baseload opportunity",
  },
};

function Intelligence({ energy, onPeriodChange, period, onNavigate }: { energy: EnergyOverview; onPeriodChange: (period: string) => void; period: string; onNavigate: (route: Route) => void }) {
  const [breakdownTab, setBreakdownTab] = useState<BreakdownCategory>("Operating hours");
  const config = breakdownConfigs[breakdownTab];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Contextual baseline"
        title="Energy intelligence"
        description="Understand how the building is behaving across operational conditions."
        actions={
          <div className="segmented">
            {["24H", "7D", "30D", "90D", "1Y"].map((item) => (
              <button key={item} className={period === item ? "selected" : ""} onClick={() => onPeriodChange(item)}>
                {item}
              </button>
            ))}
          </div>
        }
      />
      <div className="content-grid intelligence-grid">
        <section className="panel trend-panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">Primary operating signal</div>
              <h2>Actual vs expected energy</h2>
              <p>{period === "24H" ? "Hourly view" : "Daily aggregation"} · baseline includes occupancy, weather, schedule, and HVAC activity.</p>
            </div>
          </div>
          <TrendChart points={energy.points} height={330} />
        </section>
        <ContextPanel energy={energy} />
      </div>
      <div className="content-grid breakdown-grid">
        <section className="panel panel-pad">
          <div className="eyebrow">Consumption breakdown</div>
          <h2 className="subheading">Where the residual accumulates</h2>
          <div className="breakdown-tabs" role="tablist" aria-label="Consumption breakdown categories">
            {breakdownTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={breakdownTab === tab}
                className={breakdownTab === tab ? "selected" : ""}
                onClick={() => setBreakdownTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          {config.bars.map((bar) => (
            <CompactBar key={bar.label} label={bar.label} value={bar.value} max={bar.max} color={bar.color} note={bar.note} />
          ))}
        </section>
        <section className="panel panel-pad">
          <div className="eyebrow">Read the signal</div>
          <h2 className="subheading">{config.signalTitle}</h2>
          <div className="signal-list">
            {config.signals.map((sig) => (
              <div key={sig.num}>
                <span className="signal-number">{sig.num}</span>
                <p>
                  <strong>{sig.bold}</strong> {sig.text}
                </p>
              </div>
            ))}
          </div>
          <button className="text-button" onClick={() => onNavigate(`opportunity:${config.opportunityId}`)}>
            {config.linkText} <ArrowRight size={14} />
          </button>
        </section>
      </div>
    </div>
  );
}

function Opportunities({ opportunities, onNavigate }: { opportunities: Opportunity[]; onNavigate: (route: Route) => void }) {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? opportunities : opportunities.filter((item) => item.severity === filter);
  return (
    <div className="page">
      <PageHeader
        eyebrow="Anomaly → opportunity"
        title="Opportunities"
        description="Meaningful deviations ranked by impact, confidence, recurrence, and actionability."
        actions={
          <div className="filter-row">
            {["All", "High", "Medium", "Low"].map((item) => (
              <button key={item} className={`filter-chip ${filter === item ? "selected" : ""}`} onClick={() => setFilter(item)}>
                {item}
              </button>
            ))}
          </div>
        }
      />
      <div className="opportunity-summary">
        <div>
          <strong>{opportunities.length}</strong>
          <span>ranked opportunities</span>
        </div>
        <div>
          <strong>{formatNumber(opportunities.reduce((sum, item) => sum + item.potential_kwh, 0))} kWh</strong>
          <span>monthly potential</span>
        </div>
        <div>
          <strong>88%</strong>
          <span>average confidence</span>
        </div>
        <div>
          <strong>4 / 5</strong>
          <span>actionable now</span>
        </div>
      </div>
      <section className="panel">
        {filtered.length === 0 ? (
          <EmptyState title="No opportunities found" body="No opportunities match the selected priority filter." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Priority</th>
                  <th>Detected</th>
                  <th>Expected → actual</th>
                  <th>Potential</th>
                  <th>Confidence</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="clickable-row" onClick={() => onNavigate(`opportunity:${item.id}`)}>
                    <td>
                      <strong>{item.title}</strong>
                      <span className="cell-sub">{item.summary}</span>
                    </td>
                    <td>
                      <Badge tone={item.severity === "High" ? "high" : item.severity === "Medium" ? "medium" : "low"}>{item.severity}</Badge>
                    </td>
                    <td>{item.detected}</td>
                    <td>
                      <span className="mono-value">
                        {item.expected_kwh} → {item.actual_kwh} kWh
                      </span>
                      <span className="cell-sub">+{item.residual_kwh} kWh residual</span>
                    </td>
                    <td>
                      <strong>{item.monthly_range}</strong>
                      <span className="cell-sub">{item.monthly_value}</span>
                    </td>
                    <td>
                      <span className="confidence-value">{item.confidence}%</span>
                    </td>
                    <td>
                      <ArrowRight size={15} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function OpportunityDetail({ detail, onNavigate }: { detail: Detail; onNavigate: (route: Route) => void }) {
  const energy = demoSeries("24H");
  return (
    <div className="page">
      <button className="back-link" onClick={() => onNavigate("opportunities")}>
        <ArrowLeft size={14} /> Back to opportunities
      </button>
      <PageHeader
        eyebrow={`${detail.detected} · evidence review`}
        title={detail.title}
        description={detail.what_happened}
        actions={
          <>
            <Badge tone="high">{detail.severity} priority</Badge>
            <Badge tone="positive">{detail.confidence}% confidence</Badge>
          </>
        }
      />
      <div className="content-grid detail-grid">
        <div className="detail-main">
          <section className="panel panel-pad">
            <div className="panel-title-row">
              <div>
                <div className="eyebrow">Evidence</div>
                <h2>What changed in the abnormal window?</h2>
              </div>
              <span className="window-label">
                {detail.timeline?.start ?? "08:00"} → {detail.timeline?.end ?? "22:00"}
              </span>
            </div>
            <div className="evidence-grid">
              {detail.evidence && detail.evidence.length > 0 ? (
                detail.evidence.map((item) => <EvidenceRow key={item.label} {...item} />)
              ) : (
                <div className="evidence-row">
                  <span>Avoidable range</span>
                  <strong>{detail.avoidable_range}</strong>
                </div>
              )}
            </div>
            <div className="detail-chart">
              <TrendChart points={energy.points.slice(6, 13)} height={225} />
            </div>
            <div className="timeline-row">
              <span>
                ANOMALY BEGAN <strong>{detail.timeline?.start ?? "19:00"}</strong>
              </span>
              <i />
              <span>
                ANOMALY ENDED <strong>{detail.timeline?.end ?? "22:00"}</strong>
              </span>
              <em>{detail.timeline?.recurrence ?? "Recurring"}</em>
            </div>
          </section>
          <section className="panel panel-pad">
            <div className="eyebrow">Root-cause intelligence</div>
            <div className="cause-row">
              <div>
                <h2>Likely driver: {detail.root_cause?.title ?? "Contextual schedule deviation"}</h2>
                <p>Correlation and recurrence support this hypothesis. The system does not claim physical causation.</p>
              </div>
              <Badge tone="positive">{detail.root_cause?.confidence ?? detail.confidence}% confidence</Badge>
            </div>
            <ul className="evidence-list">
              {(detail.root_cause?.evidence ?? [detail.summary]).map((item) => (
                <li key={item}>
                  <Check size={15} />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="detail-aside">
          <section className="panel recommendation-panel">
            <div className="eyebrow">Recommended intervention</div>
            <h2>{detail.recommended_action?.title ?? detail.title}</h2>
            <p>Low operational risk, immediate payback, and aligned to the evidence above.</p>
            <div className="recommendation-stats">
              <div>
                <span>Projected saving</span>
                <strong>{formatNumber(detail.recommended_action?.savings_kwh ?? detail.potential_kwh)} kWh/mo</strong>
              </div>
              <div>
                <span>Financial value</span>
                <strong>{formatCurrency(detail.recommended_action?.value ?? 0)}/mo</strong>
              </div>
              <div>
                <span>Implementation cost</span>
                <strong>{detail.recommended_action?.cost === 0 ? "₹0" : formatCurrency(detail.recommended_action?.cost ?? 0)}</strong>
              </div>
              <div>
                <span>Payback</span>
                <strong>{detail.recommended_action?.payback ?? "Immediate"}</strong>
              </div>
            </div>
            <Button onClick={() => onNavigate("simulator")}>
              Simulate intervention <ArrowRight size={14} />
            </Button>
          </section>
          <section className="panel panel-pad">
            <div className="eyebrow">Data provenance</div>
            <div className="provenance-row">
              <span>Model</span>
              <strong>contextual-baseline-v0.1</strong>
            </div>
            <div className="provenance-row">
              <span>Data coverage</span>
              <strong>99.6%</strong>
            </div>
            <div className="provenance-row">
              <span>Evidence window</span>
              <strong>Oct 03, 19:00–22:00</strong>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Recommendations({ recommendations, onNavigate }: { recommendations: Recommendation[]; onNavigate: (route: Route) => void }) {
  const [sort, setSort] = useState("Highest impact"); const sorted = [...recommendations].sort((a, b) => sort === "Lowest cost" ? a.cost - b.cost : sort === "Fastest payback" ? (a.payback === "Immediate" ? -1 : 1) - (b.payback === "Immediate" ? -1 : 1) : sort === "Highest confidence" ? b.confidence - a.confidence : b.energy_kwh - a.energy_kwh);
  return <div className="page"><PageHeader eyebrow="Action plan" title="Recommendations" description="Choose the next intervention by making savings, risk, confidence, and payback explicit." actions={<div className="filter-row">{["Highest impact", "Lowest cost", "Fastest payback", "Highest confidence"].map((item) => <button key={item} className={`filter-chip ${sort === item ? "selected" : ""}`} onClick={() => setSort(item)}>{item}</button>)}</div>} /><section className="panel panel-pad tradeoff-note"><div className="tradeoff-icon"><Sparkles size={18} /></div><div><strong>The zero-cost HVAC adjustment is the best first move.</strong><span>Equipment replacement has the highest theoretical saving, but the schedule intervention has immediate payback and lower operational risk.</span></div></section><section className="panel"><div className="table-wrap"><table><thead><tr><th>Action</th><th>Energy</th><th>Value</th><th>Cost</th><th>Payback</th><th>Risk</th><th>Confidence</th><th /></tr></thead><tbody>{sorted.map((item, index) => <tr key={item.id} className="clickable-row" onClick={() => onNavigate(`opportunity:${item.opportunity_id}`)}><td><span className="rank-number">0{index + 1}</span><strong>{item.action}</strong><span className="cell-sub">{item.description}</span></td><td><strong>{formatNumber(item.energy_kwh)} kWh</strong><span className="cell-sub">monthly estimate</span></td><td>{formatCurrency(item.value)}<span className="cell-sub">per month</span></td><td>{item.cost === 0 ? "₹0" : formatCurrency(item.cost)}</td><td><Badge tone={item.payback === "Immediate" ? "positive" : "neutral"}>{item.payback}</Badge></td><td>{item.risk}</td><td><span className="confidence-value">{item.confidence}%</span></td><td><ArrowRight size={15} /></td></tr>)}</tbody></table></div></section></div>;
}

function Simulator() {
  const [controls, setControls] = useState({ hvac_minutes: 45, lighting_minutes: 20, load_shift_hours: 2, occupancy_delta: -10 }); const [saved, setSaved] = useState(true);
  const simulation = useMemo<Simulation>(() => { const savedKwh = Math.max(0, Math.round(controls.hvac_minutes * 40 + controls.lighting_minutes * 8 + controls.load_shift_hours * 75 + Math.abs(controls.occupancy_delta) * 22)); return { baseline_kwh: 48240, scenario_kwh: 48240 - savedKwh, energy_saved_kwh: savedKwh, cost_saved: savedKwh * 13, co2e_avoided: Math.round(savedKwh * 0.71 / 1000 * 100) / 100, operational_impact: savedKwh < 1800 ? "Low" : "Moderate", assumptions: ["Tariff ₹13/kWh", "Grid factor 0.71 kgCO₂e/kWh", "Scenario is isolated from source readings"] }; }, [controls]);
  const update = (key: keyof typeof controls, value: number) => { setSaved(false); setControls((current) => ({ ...current, [key]: value })); };
  return <div className="page"><PageHeader eyebrow="Decision support · hypothetical only" title="Intervention simulator" description="Explore a virtual scenario. No equipment, source data, or physical schedule is changed." actions={<Badge tone="neutral">Simulation isolated</Badge>} /><div className="content-grid simulator-grid"><section className="panel control-panel"><div className="eyebrow">Scenario controls</div><h2>Build an intervention</h2><p>Adjust one or more levers and compare the modeled outcome to the current month.</p><ScenarioSlider label="HVAC operating window" value={controls.hvac_minutes} min={0} max={90} step={5} suffix="min reduction" onChange={(value) => update("hvac_minutes", value)} /><ScenarioSlider label="Lighting schedule" value={controls.lighting_minutes} min={0} max={60} step={5} suffix="min reduction" onChange={(value) => update("lighting_minutes", value)} /><ScenarioSlider label="Peak load shift" value={controls.load_shift_hours} min={0} max={6} step={1} suffix="h shifted" onChange={(value) => update("load_shift_hours", value)} /><ScenarioSlider label="Occupancy assumption" value={controls.occupancy_delta} min={-30} max={10} step={5} suffix="% vs baseline" onChange={(value) => update("occupancy_delta", value)} /><div className="simulation-note"><Info size={15} /><span>These controls estimate operational impact using the contextual baseline and configured tariff. They are not commands.</span></div><Button variant={saved ? "secondary" : "primary"} onClick={() => setSaved(true)}>{saved ? <><Check size={14} /> Scenario saved</> : <>Save scenario <ArrowRight size={14} /></>}</Button></section><section className="panel result-panel"><div className="eyebrow">Projected outcome</div><h2>Current → simulated</h2><div className="simulation-hero"><div><span>Current</span><strong>{formatNumber(simulation.baseline_kwh)} <small>kWh/month</small></strong></div><ArrowRight size={20} /><div className="scenario-result"><span>Simulated</span><strong>{formatNumber(simulation.scenario_kwh)} <small>kWh/month</small></strong></div></div><div className="saving-highlight"><div><span>Estimated saving</span><strong>{formatNumber(simulation.energy_saved_kwh)} kWh/month</strong></div><div><span>Financial saving</span><strong>{formatCurrency(simulation.cost_saved)}/mo</strong></div><div><span>CO₂e avoided</span><strong>{simulation.co2e_avoided} t</strong></div><div><span>Operational impact</span><Badge tone="positive">{simulation.operational_impact}</Badge></div></div><div className="comparison-bars"><CompactBar label="Current monthly use" value={simulation.baseline_kwh} max={simulation.baseline_kwh} color="pink" /><CompactBar label="Scenario monthly use" value={simulation.scenario_kwh} max={simulation.baseline_kwh} color="green" /></div><div className="assumptions"><span>Assumptions</span>{simulation.assumptions.map((assumption) => <small key={assumption}>· {assumption}</small>)}</div></section></div></div>;
}

function ScenarioSlider({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) { return <label className="scenario-control"><span><strong>{label}</strong><b>{value} {suffix}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><div className="range-labels"><small>{min}</small><small>{max}</small></div></label>; }

function ImpactPage({ impact }: { impact: Impact }) { const maxTimeline = Math.max(...impact.timeline.map((item) => item.projected)); return <div className="page"><PageHeader eyebrow="Measured outcomes" title="Impact" description="See what has been projected, what has been confirmed, and where the gap still needs measurement." actions={<Badge tone="positive">11 successful interventions</Badge>} /><div className="metric-grid impact-metrics"><MetricCard label="Total energy saved" value={`${formatNumber(impact.total_energy_saved)} kWh`} caption="Projected + confirmed interventions" tone="positive" icon={<Zap size={16} />} /><MetricCard label="Cost saved" value={formatCurrency(impact.cost_saved)} caption="Measured tariff impact" tone="positive" icon={<span className="rupee-icon">₹</span>} /><MetricCard label="CO₂e avoided" value={`${impact.co2e_avoided} tonnes`} caption="Using configured grid factor" tone="positive" icon={<Activity size={16} />} /><MetricCard label="Interventions" value={`${impact.successful_interventions} / ${impact.interventions}`} caption="Successful / total" icon={<Target size={16} />} /></div><div className="content-grid impact-grid"><section className="panel panel-pad"><div className="eyebrow">Performance change</div><h2 className="subheading">Baseline to measured outcome</h2><BeforeAfter before={impact.baseline_kwh} after={impact.current_kwh} /><div className="improvement-callout"><strong>{impact.improvement_percent}%</strong><span>improvement versus the pre-intervention baseline</span></div></section><section className="panel panel-pad"><div className="eyebrow">Intervention timeline</div><h2 className="subheading">Projected vs confirmed energy impact</h2><div className="timeline-bars">{impact.timeline.map((item) => <div className="timeline-bar" key={item.label}><div className="timeline-columns"><i className="bar-projected" style={{ height: `${(item.projected / maxTimeline) * 100}%` }} /><i className="bar-confirmed" style={{ height: `${(item.confirmed / maxTimeline) * 100}%` }} /></div><span>{item.label}</span></div>)}</div><div className="chart-legend impact-legend"><span><i className="legend-projected" />Projected</span><span><i className="legend-confirmed" />Confirmed</span></div></section></div><div className="content-grid projected-grid"><ImpactStatus title="Projected impact" tone="pink" items={[`${formatNumber(impact.projected.energy_kwh)} kWh`, formatCurrency(impact.projected.cost), `${impact.projected.co2e} t CO₂e`, `${impact.projected.interventions} interventions`]} /><ImpactStatus title="Confirmed impact" tone="green" items={[`${formatNumber(impact.confirmed.energy_kwh)} kWh`, formatCurrency(impact.confirmed.cost), `${impact.confirmed.co2e} t CO₂e`, `${impact.confirmed.interventions} interventions`]} /></div></div>; }

function ImpactStatus({ title, tone, items }: { title: string; tone: "pink" | "green"; items: string[] }) { return <section className={`panel panel-pad impact-status impact-${tone}`}><div className="eyebrow">{title}</div><div className="impact-status-grid">{items.map((item, index) => <div key={item}><strong>{item}</strong><span>{["Energy", "Cost", "CO₂e", "Count"][index]}</span></div>)}</div></section>; }

function DataPage({ health, onRefresh }: { health: DataHealth; onRefresh: () => void }) { const [uploadResult, setUploadResult] = useState<{ valid: boolean; filename: string; rows: number; missing_columns?: string[]; invalid_timestamps?: number; message: string } | null>(null); const [uploading, setUploading] = useState(false); const upload = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; setUploading(true); setUploadResult(await api.upload(file)); setUploading(false); onRefresh(); }; return <div className="page"><PageHeader eyebrow="Trust layer" title="Data" description="Upload, validate, and understand the data powering the current analysis." actions={<label className="button button-primary upload-button"><UploadCloud size={14} /> Upload CSV<input type="file" accept=".csv,text/csv" onChange={upload} /></label>} />{uploading && <LoadingState />}{uploadResult && (uploadResult.valid ? <div className="success-notice"><Check size={16} /><span><strong>{uploadResult.filename}</strong> is ready for analysis ({formatNumber(uploadResult.rows)} rows).</span></div> : <ErrorNotice>{uploadResult.message}{uploadResult.missing_columns?.length ? ` Missing: ${uploadResult.missing_columns.join(", ")}.` : ""}</ErrorNotice>)}<DataQualityBanner completeness={health.completeness} /><div className="content-grid data-grid"><section className="panel panel-pad dataset-summary"><div className="eyebrow">Current dataset</div><h2>{health.dataset}</h2><div className="dataset-stats"><div><span>Rows</span><strong>{formatNumber(health.rows)}</strong></div><div><span>Time range</span><strong>{health.time_range}</strong></div><div><span>Last analysis</span><strong>{health.last_analysis}</strong></div><div><span>Status</span><Badge tone="positive">Ready for analysis</Badge></div></div><div className="data-pipeline"><span className="done">Upload</span><i /><span className="done">Validate</span><i /><span className="done">Baseline</span><i /><span className="current">Analyze</span><i /><span>Impact</span></div></section><section className="panel panel-pad"><div className="eyebrow">Model health</div><h2>{health.model.version}</h2><div className="model-health"><div><span>Validation MAE</span><strong>{health.model.mae} kWh</strong></div><div><span>Validation RMSE</span><strong>{health.model.rmse} kWh</strong></div><div><span>Last trained</span><strong>{health.model.trained_at}</strong></div></div><p className="muted-copy">Chronological validation keeps future data out of training. Numerical claims on this workspace come from deterministic services.</p></section></div><section className="panel"><div className="panel-head"><div><div className="eyebrow">Ingestion history</div><h2>Upload history</h2></div></div><div className="table-wrap"><table><thead><tr><th>Dataset</th><th>Rows</th><th>Time range</th><th>Completeness</th><th>Uploaded</th><th>Status</th></tr></thead><tbody>{health.uploads.map((upload) => <tr key={`${upload.dataset}-${upload.uploaded_at}`}><td><strong>{upload.dataset}</strong></td><td>{formatNumber(upload.rows)}</td><td>{upload.time_range}</td><td>{upload.completeness}%</td><td>{upload.uploaded_at}</td><td><Badge tone="positive">{upload.status}</Badge></td></tr>)}</tbody></table></div></section></div>; }

function SettingsPage() { const [saved, setSaved] = useState(false); return <div className="page"><PageHeader eyebrow="Configuration" title="Settings" description="Small, transparent controls for the current building and analysis assumptions." actions={saved ? <Badge tone="positive"><Check size={12} /> Saved</Badge> : undefined} /><div className="content-grid settings-grid"><section className="panel panel-pad form-panel"><div className="eyebrow">Building details</div><h2>Orion Business Center</h2><label><span>Building name</span><input defaultValue="Orion Business Center" /></label><label><span>Location</span><input defaultValue="Bengaluru, India" /></label><label><span>Operating hours</span><div className="form-row"><input defaultValue="08:00" /><input defaultValue="19:00" /></div></label></section><section className="panel panel-pad form-panel"><div className="eyebrow">Analysis assumptions</div><h2>Impact configuration</h2><label><span>Electricity tariff</span><input defaultValue="13" /></label><label><span>Emissions factor (kgCO₂e/kWh)</span><input defaultValue="0.71" /></label><label><span>Confidence threshold</span><input defaultValue="75" /></label><div className="settings-note"><Info size={15} /><span>These assumptions are used for projections and simulations. They do not alter historical source data.</span></div></section></div><div className="settings-footer"><span>ResourceOps v0.1 · Software-only prototype · No hardware control connected.</span><Button onClick={() => setSaved(true)}>Save configuration</Button></div></div>; }

export function App() {
  const [route, setRoute] = useState<Route>(routeFromHash()); const [dashboard, setDashboard] = useState<Dashboard>(demoDashboard); const [energy, setEnergy] = useState<EnergyOverview>(demoSeries("7D")); const [period, setPeriod] = useState("7D"); const [opportunities, setOpportunities] = useState<Opportunity[]>(demoOpportunities); const [recommendations, setRecommendations] = useState<Recommendation[]>(demoRecommendations); const [impact, setImpact] = useState<Impact>(demoImpact); const [health, setHealth] = useState<DataHealth>(demoHealth); const [detail, setDetail] = useState<Detail>(demoDetails["after-hours-hvac"]); const [loading, setLoading] = useState(false);
  useEffect(() => { const handle = () => setRoute(routeFromHash()); window.addEventListener("popstate", handle); Promise.all([api.dashboard(), api.energy("7D"), api.opportunities(), api.recommendations(), api.impact(), api.health()]).then(([nextDashboard, nextEnergy, nextOpportunities, nextRecommendations, nextImpact, nextHealth]) => { setDashboard(nextDashboard); setEnergy(nextEnergy); setOpportunities(nextOpportunities); setRecommendations(nextRecommendations); setImpact(nextImpact); setHealth(nextHealth); }).catch(() => undefined); return () => window.removeEventListener("popstate", handle); }, []);
  const navigate = (next: Route) => { const hash = next.startsWith("opportunity:") ? `#/opportunities/${next.split(":")[1]}` : `#/${next}`; window.history.pushState({}, "", hash); setRoute(next); if (next.startsWith("opportunity:")) { const id = next.split(":")[1]; setDetail(demoDetails[id] ?? demoDetails["after-hours-hvac"]); api.detail(id).then(setDetail).catch(() => undefined); } };
  const changePeriod = (next: string) => { setPeriod(next); setLoading(true); api.energy(next).then(setEnergy).finally(() => setLoading(false)); };
  const refreshHealth = () => api.health().then(setHealth).catch(() => undefined);
  const page = route === "dashboard" ? <CommandCenter dashboard={dashboard} onNavigate={navigate} /> : route === "intelligence" ? (loading ? <div className="page"><LoadingState /></div> : <Intelligence energy={energy} period={period} onPeriodChange={changePeriod} onNavigate={navigate} />) : route === "opportunities" ? <Opportunities opportunities={opportunities} onNavigate={navigate} /> : route.startsWith("opportunity:") ? <OpportunityDetail detail={detail} onNavigate={navigate} /> : route === "recommendations" ? <Recommendations recommendations={recommendations} onNavigate={navigate} /> : route === "simulator" ? <Simulator /> : route === "impact" ? <ImpactPage impact={impact} /> : route === "data" ? <DataPage health={health} onRefresh={refreshHealth} /> : <SettingsPage />;
  return <AppShell route={route} onNavigate={navigate}>{page}</AppShell>;
}
