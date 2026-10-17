import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import { fmt } from '@/lib/format';
import { compactVND } from './labels';
import { BarFill, BarRow, BarTrack, ChartTip, Legend, Stack100 } from './styles';

type Daily = { date: string; orders: number; revenue: number };

const AXIS = { fontSize: 11, fill: 'var(--muted)', fontFamily: 'var(--font-body)' };
const dayLabel = (iso: string) => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };
const longDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

function DayTip({ active, payload, label, format }: TooltipContentProps<number, string> & { format: (v: number) => string; unit: string }) {
  if (!active || !payload?.length) return null;
  return (
    <ChartTip>
      <span style={{ color: 'var(--muted)' }}>{longDay(String(label))}</span>
      <b>{format(Number(payload[0].value))}</b>
    </ChartTip>
  );
}

/** Daily revenue (single series: 2px line over a 10% wash, crosshair tooltip). */
export function RevenueChart({ data }: { data: Daily[] }) {
  return (
    <div style={{ width: '100%', height: 260 }} role="img" aria-label="Biểu đồ doanh thu theo ngày">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
          <XAxis dataKey="date" tickFormatter={dayLabel} tick={AXIS} tickLine={false} axisLine={{ stroke: 'var(--line)' }} minTickGap={24} />
          <YAxis tickFormatter={compactVND} tick={AXIS} tickLine={false} axisLine={false} width={52} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: 'var(--muted)', strokeWidth: 1 }}
            content={(p) => <DayTip {...(p as TooltipContentProps<number, string>)} format={fmt} unit="" />}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--viz-main)"
            strokeWidth={2}
            fill="var(--viz-main)"
            fillOpacity={0.1}
            activeDot={{ r: 5, fill: 'var(--viz-main)', stroke: 'var(--surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Daily order count as columns (capped at 24px, rounded data-end). */
export function OrdersChart({ data }: { data: Daily[] }) {
  return (
    <div style={{ width: '100%', height: 200 }} role="img" aria-label="Biểu đồ số đơn theo ngày">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
          <XAxis dataKey="date" tickFormatter={dayLabel} tick={AXIS} tickLine={false} axisLine={{ stroke: 'var(--line)' }} minTickGap={24} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={52} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'var(--surface-alt)' }}
            content={(p) => <DayTip {...(p as TooltipContentProps<number, string>)} format={(v) => `${v} đơn`} unit="đơn" />}
          />
          <Bar dataKey="orders" fill="var(--viz1)" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bars for a ranked breakdown; values are labelled at the end. */
export function BarList({ rows, format = String }: { rows: { key: string; label: string; value: number; hint?: string }[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((r) => (
        <BarRow key={r.key} title={r.hint ? `${r.label} — ${r.hint}` : r.label}>
          <span className="name">{r.label}</span>
          <BarTrack><BarFill style={{ width: `${(r.value / max) * 100}%` }} /></BarTrack>
          <span className="value">{format(r.value)}</span>
        </BarRow>
      ))}
    </div>
  );
}

const SLOTS = ['var(--viz1)', 'var(--viz2)', 'var(--viz3)'];

/** Share of a whole (<= 3 parts): 100% stacked bar plus a legend carrying labels and values. */
export function ShareBar({ parts }: { parts: { key: string; label: string; value: number }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Stack100 role="img" aria-label={parts.map((p) => `${p.label}: ${p.value}`).join(', ')}>
        {parts.filter((p) => p.value > 0).map((p) => (
          <div key={p.key} title={`${p.label}: ${p.value} (${pct(p.value)}%)`} style={{ flexGrow: p.value, background: SLOTS[parts.indexOf(p)] }} />
        ))}
      </Stack100>
      <Legend>
        {parts.map((p, i) => (
          <li key={p.key}><i style={{ background: SLOTS[i] }} />{p.label} <b>{p.value}</b> <span style={{ color: 'var(--muted)' }}>({pct(p.value)}%)</span></li>
        ))}
      </Legend>
    </div>
  );
}
