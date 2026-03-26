import { CustomSelect } from './CustomSelect';

export interface MemoCondition {
  key: string;
  operator: string;
  value?: string;
  value2?: string;
}

const MEMO_OPERATORS = [
  { value: 'eq',       label: 'Equals (=)',           values: 1 },
  { value: 'neq',      label: 'Not equals (\u2260)',  values: 1 },
  { value: 'gt',       label: 'Greater than (>)',      values: 1 },
  { value: 'gte',      label: 'Greater or equal (\u2265)',  values: 1 },
  { value: 'lt',       label: 'Less than (<)',         values: 1 },
  { value: 'lte',      label: 'Less or equal (\u2264)',     values: 1 },
  { value: 'between',  label: 'Between',              values: 2 },
  { value: 'contains', label: 'Contains',             values: 1 },
  { value: 'exists',   label: 'Exists (any value)',    values: 0 },
  { value: 'regex',    label: 'Matches pattern',      values: 1 },
] as const;

function conditionPreview(c: MemoCondition): string {
  const k = c.key || '\u2026';
  const v = c.value || '\u2026';
  switch (c.operator) {
    case 'eq':       return `"${k}" must equal ${v}`;
    case 'neq':      return `"${k}" must not equal ${v}`;
    case 'gt':       return `"${k}" must be > ${v}`;
    case 'gte':      return `"${k}" must be \u2265 ${v}`;
    case 'lt':       return `"${k}" must be < ${v}`;
    case 'lte':      return `"${k}" must be \u2264 ${v}`;
    case 'between':  return `"${k}" must be between ${v} and ${c.value2 || '\u2026'}`;
    case 'contains': return `"${k}" must contain "${v}"`;
    case 'exists':   return `memo must have field "${k}"`;
    case 'regex':    return `"${k}" must match /${v}/`;
    default:         return '';
  }
}

export function MemoConditionsEditor({ conditions, onChange }: {
  conditions: MemoCondition[];
  onChange:   (conditions: MemoCondition[]) => void;
}) {
  const add = () => onChange([...conditions, { key: '', operator: 'eq', value: '' }]);
  const remove = (i: number) => onChange(conditions.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<MemoCondition>) =>
    onChange(conditions.map((c, idx) => idx === i ? { ...c, ...patch } : c));

  const opMeta = (op: string) => MEMO_OPERATORS.find(o => o.value === op) ?? MEMO_OPERATORS[0];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Memo Conditions</span>
        <button type="button" onClick={add} className="text-[10px] px-2 py-0.5 rounded cursor-pointer" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-text)' }}>+ Add</button>
      </div>
      {conditions.length > 0 ? (
        <div className="flex flex-col gap-2">
          {conditions.map((cond, i) => {
            const meta = opMeta(cond.operator);
            return (
              <div key={i} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                <div className="flex gap-2 items-center">
                  <input
                    className="admin-input flex-1 text-xs"
                    placeholder="field name"
                    value={cond.key}
                    onChange={e => update(i, { key: e.target.value })}
                  />
                  <CustomSelect
                    size="sm"
                    className="!w-[160px]"
                    value={cond.operator}
                    onChange={v => update(i, { operator: v })}
                    options={MEMO_OPERATORS.map(o => ({ value: o.value, label: o.label }))}
                  />
                  {meta.values >= 1 && (
                    <input
                      className="admin-input flex-1 text-xs"
                      placeholder="value"
                      value={cond.value ?? ''}
                      onChange={e => update(i, { value: e.target.value })}
                    />
                  )}
                  {meta.values === 2 && (
                    <>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>and</span>
                      <input
                        className="admin-input flex-1 text-xs"
                        placeholder="value 2"
                        value={cond.value2 ?? ''}
                        onChange={e => update(i, { value2: e.target.value })}
                      />
                    </>
                  )}
                  <button type="button" onClick={() => remove(i)} className="text-red-400 text-sm px-1 cursor-pointer">&times;</button>
                </div>
                <p className="text-[10px] mt-1.5 ml-0.5" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {conditionPreview(cond)}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          No conditions — matches any memo transaction. Click "+ Add" to filter.
        </p>
      )}
    </div>
  );
}
