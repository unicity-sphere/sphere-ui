import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { SearchInput } from './SearchInput';
import { EmptyState } from './EmptyState';

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns, data, isLoading, emptyMessage = 'No data found', searchPlaceholder, enableSearch = true, onRowClick,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const stableColumns = useMemo(() => columns, [columns]);

  const table = useReactTable({
    data,
    columns: stableColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) {
    return <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>Loading&hellip;</div>;
  }

  return (
    <div>
      {enableSearch && (
        <div className="mb-4 max-w-xs">
          <SearchInput
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder={searchPlaceholder ?? 'Search...'}
          />
        </div>
      )}

      {table.getRowModel().rows.length === 0 ? (
        <EmptyState title={emptyMessage} />
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <span style={{ color: 'var(--accent-text)' }}>&#9650;</span>}
                        {header.column.getIsSorted() === 'desc' && <span style={{ color: 'var(--accent-text)' }}>&#9660;</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  style={onRowClick ? { transition: 'background 0.15s' } : undefined}
                  onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (onRowClick) e.currentTarget.style.background = ''; }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
