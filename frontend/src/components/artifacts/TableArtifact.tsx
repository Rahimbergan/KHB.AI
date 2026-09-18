import React, { useState } from 'react';
import { Download, Search } from 'lucide-react';
import { TableArtifactData } from '../../types/artifacts';

interface Props {
  data: TableArtifactData;
}

export const TableArtifact: React.FC<Props> = ({ data }) => {
  const [filter, setFilter] = useState('');
  const columns = data.columns || [];
  const rows = data.rows || [];

  const filteredRows = rows.filter(row => {
    if (!filter) return true;
    const values = Array.isArray(row) ? row : Object.values(row);
    return values.some(v => String(v).toLowerCase().includes(filter.toLowerCase()));
  });

  const exportCSV = () => {
    const csvContent = [
      columns.join(','),
      ...rows.map(r => (Array.isArray(r) ? r.join(',') : columns.map(c => r[c] ?? '').join(',')))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'table_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950/40">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Jadvaldan qidirish..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
        >
          <Download className="w-3.5 h-3.5" />
          Eksport (.csv)
        </button>
      </div>
      <div className="overflow-x-auto max-h-72">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 sticky top-0">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-2.5 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500">
                  Ma'lumot topilmadi
                </td>
              </tr>
            ) : (
              filteredRows.map((row, rIdx) => {
                const cells = Array.isArray(row) ? row : columns.map(c => row[c]);
                return (
                  <tr key={rIdx} className="hover:bg-slate-800/40 transition">
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2.5 whitespace-nowrap">
                        {String(cell ?? '-')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
