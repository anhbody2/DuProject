import { Select, Tag } from 'antd';
import { optionsOf, type Labelled } from './labels';

/** Current status as a tag, plus a select offering only the allowed next statuses. */
export default function StatusStep<S extends string>({ value, map, next, onChange }: {
  value: S; map: Record<S, Labelled>; next: Record<S, S[]>; onChange: (s: S) => void;
}) {
  const moves = next[value];
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <Tag color={map[value].color}>{map[value].label}</Tag>
      {/* Uncontrolled and keyed by the current status, so it resets to the placeholder once the change lands. */}
      {moves.length > 0 && (
        <Select<S> key={value} size="small" placeholder="Chuyển sang…" style={{ width: 150 }} onChange={onChange} options={optionsOf(map, moves)} />
      )}
    </div>
  );
}
