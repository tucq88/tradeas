import type { LedgerAccount } from '@/data/ledger/types';

export type ProductTypeFilter = 'all' | 'vault' | 'agent';

type Props = {
  accounts: LedgerAccount[];
  accountFilter: string;
  typeFilter: ProductTypeFilter;
  onAccountChange: (id: string) => void;
  onTypeChange: (t: ProductTypeFilter) => void;
};

const TYPE_OPTIONS: { value: ProductTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'vault', label: 'Vault' },
  { value: 'agent', label: 'Agent' },
];

export function PositionFilters({ accounts, accountFilter, typeFilter, onAccountChange, onTypeChange }: Props) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex items-center gap-1.5">
        <span className="text-fg-3 text-[10px] uppercase tracking-wide">Account</span>
        <select
          value={accountFilter}
          onChange={(e) => onAccountChange(e.target.value)}
          className="h-6 px-1.5 text-[11px] bg-bg-inset border border-border-1 rounded text-fg-1 focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        {TYPE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onTypeChange(value)}
            className={[
              'h-6 px-2 text-[11px] rounded transition-colors',
              typeFilter === value
                ? 'bg-accent text-white'
                : 'bg-bg-inset text-fg-3 hover:text-fg-1',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function applyPositionFilters<T extends { accountId: string; productType: 'vault' | 'agent' }>(
  positions: T[],
  accountFilter: string,
  typeFilter: ProductTypeFilter,
): T[] {
  return positions.filter((p) => {
    if (accountFilter && p.accountId !== accountFilter) return false;
    if (typeFilter !== 'all' && p.productType !== typeFilter) return false;
    return true;
  });
}
