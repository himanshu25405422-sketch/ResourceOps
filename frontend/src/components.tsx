import type { ReactNode } from "react";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight, CircleHelp, Database, Gauge, Lightbulb, LoaderCircle, Moon, Thermometer, Timer, TrendingUp, Wind } from "lucide-react";
import type { EnergyOverview, Opportunity, SeriesPoint } from "./types";

export const formatNumber = (value: number) => new Intl.NumberFormat("en-IN").format(value);
export const formatCurrency = (value: number) => `₹${new Intl.NumberFormat("en-IN").format(value)}`;

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

export function Button({ children, variant = "primary", onClick, type = "button", disabled = false }: { children: ReactNode; variant?: "primary" | "secondary" | "quiet"; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  return <button type={type} className={`button button-${variant}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "high" | "medium" | "low" | "positive" | "neutral" | "warning" }) { return <span className={`badge badge-${tone}`}><i />{children}</span>; }

export function MetricCard({ label, value, caption, tone = "default", icon }: { label: string; value: string; caption: string; tone?: "default" | "accent" | "positive"; icon: ReactNode }) {
  return <div className={`metric-card metric-${tone}`}><div className="metric-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{caption}</small></div>;
}

function linePath(values: number[], width: number, height: number, min: number, max: number) { return values.map((value, index) => { const x = (index / Math.max(1, values.length - 1)) * width; const y = height - ((value - min) / Math.max(1, max - min)) * height; return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`; }).join(" "); }

export function TrendChart({ points, height = 250, showLabels = true }: { points: SeriesPoint[]; height?: number; showLabels?: boolean }) {
  const width = 900; const chartHeight = height - 38;
  const values = points.flatMap((point) => [point.actual, point.expected]); const min = Math.min(...values) - 10; const max = Math.max(...values) + 10;
  const actualPath = linePath(points.map((point) => point.actual), width, chartHeight, min, max); const expectedPath = linePath(points.map((point) => point.expected), width, chartHeight, min, max);
  const step = Math.max(1, Math.floor(points.length / 6));
  return <div className="chart-wrap"><div className="chart-legend"><span><i className="legend-actual" />Actual</span><span><i className="legend-expected" />Expected baseline</span><span className="legend-note"><AlertTriangle size={12} /> anomaly marker</span></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Actual versus expected energy trend" className="trend-chart"><g className="grid-lines">{[0, 1, 2, 3].map((row) => <line key={row} x1="0" x2={width} y1={(chartHeight / 3) * row} y2={(chartHeight / 3) * row} />)}</g><path d={expectedPath} className="series-expected" /><path d={actualPath} className="series-actual" />{points.map((point, index) => point.anomaly ? <circle key={`${point.label}-anomaly`} className="anomaly-point" cx={(index / Math.max(1, points.length - 1)) * width} cy={chartHeight - ((point.actual - min) / Math.max(1, max - min)) * chartHeight} r="4" /> : null)}{showLabels && <g className="chart-labels">{points.map((point, index) => ({ point, index })).filter(({ index }) => index % step === 0).map(({ point, index }) => <text key={`${point.label}-${index}`} x={(index / Math.max(1, points.length - 1)) * width} y={height - 8} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}>{point.label}</text>)}</g>}</svg></div>;
}

export function CompactBar({ label, value, max, color = "blue", note }: { label: string; value: number; max: number; color?: "blue" | "green" | "pink"; note?: string }) { return <div className="compact-bar"><div><span>{label}</span><b>{formatNumber(value)} kWh</b></div><div className="bar-track"><i className={`bar-${color}`} style={{ width: `${Math.max(8, Math.min(100, (value / max) * 100))}%` }} /></div>{note && <small>{note}</small>}</div>; }

export function OpportunityCard({ opportunity, onOpen }: { opportunity: Opportunity; onOpen: () => void }) {
  const tone = opportunity.severity === "High" ? "high" : opportunity.severity === "Medium" ? "medium" : "low";
  return <button className="opportunity-card" onClick={onOpen}><div className="opportunity-card-head"><Badge tone={tone}>{opportunity.severity} priority</Badge><ChevronRight size={16} /></div><h3>{opportunity.title}</h3><p>{opportunity.summary}</p><div className="opportunity-card-foot"><span><strong>{opportunity.monthly_range}</strong><small>monthly opportunity</small></span><span><strong>{opportunity.confidence}%</strong><small>confidence</small></span></div></button>;
}

export function EvidenceRow({ label, value, tone = "neutral" }: { label: string; value: string; tone?: string }) { const Icon = tone === "positive" ? ArrowDownRight : tone === "warning" ? ArrowUpRight : ArrowRight; return <div className="evidence-row"><span>{label}</span><strong className={`evidence-${tone}`}><Icon size={14} />{value}</strong></div>; }

export function InsightBlock({ title, children, onAction }: { title: string; children: ReactNode; onAction?: () => void }) { return <div className="insight-block"><div className="insight-icon"><Lightbulb size={18} /></div><div className="insight-copy"><div className="eyebrow">ResourceOps insight</div><h3>{title}</h3><p>{children}</p>{onAction && <button className="inline-link" onClick={onAction}>Open evidence <ArrowRight size={13} /></button>}</div></div>; }

export function LoadingState() { return <div className="loading-state"><LoaderCircle size={17} className="spin" /> Loading analysis…</div>; }

export function EmptyState({ title, body, icon = <CircleHelp size={20} /> }: { title: string; body: string; icon?: ReactNode }) { return <div className="empty-state">{icon}<strong>{title}</strong><p>{body}</p></div>; }

export function ContextPanel({ energy }: { energy: EnergyOverview }) { return <div className="context-panel"><div className="panel-label">Operating context</div><div className="context-grid"><div><Gauge size={15} /><span>Average occupancy</span><strong>{energy.context.average_occupancy}%</strong></div><div><Thermometer size={15} /><span>Average temperature</span><strong>{energy.context.average_temperature}°C</strong></div><div><Wind size={15} /><span>HVAC runtime</span><strong>{energy.context.hvac_runtime}</strong></div><div><TrendingUp size={15} /><span>Peak load</span><strong>{energy.context.peak_load}</strong></div><div><Moon size={15} /><span>Base load</span><strong>{energy.context.base_load}</strong></div><div><Timer size={15} /><span>Operating window</span><strong>08:00–19:00</strong></div></div></div>; }

export function DataQualityBanner({ completeness, onOpen }: { completeness: number; onOpen?: () => void }) { return <div className="data-quality-banner"><div className="quality-icon"><Database size={16} /></div><div><strong>Data quality is {completeness}% complete</strong><span>35 missing values detected. The baseline accounts for incomplete context and confidence is shown on each opportunity.</span></div>{onOpen && <button className="inline-link" onClick={onOpen}>Review data <ArrowRight size={13} /></button>}</div>; }

export function BeforeAfter({ before, after, unit = "kWh" }: { before: number; after: number; unit?: string }) { const max = Math.max(before, after); return <div className="before-after"><div><div className="before-after-head"><span>Before ResourceOps</span><strong>{formatNumber(before)} {unit}</strong></div><div className="large-bar"><i style={{ width: "100%" }} /></div></div><div><div className="before-after-head"><span>After interventions</span><strong className="positive-text">{formatNumber(after)} {unit}</strong></div><div className="large-bar"><i className="bar-green" style={{ width: `${(after / max) * 100}%` }} /></div></div></div>; }

export function ErrorNotice({ children }: { children: ReactNode }) { return <div className="error-notice"><AlertTriangle size={16} />{children}</div>; }

