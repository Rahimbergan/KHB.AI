import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Search,
  Filter,
  CheckCircle,
  RotateCcw,
  XCircle,
  Sparkles,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
  Building,
  Printer,
  X,
  Receipt,
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import { getSales, runSalesAnalysis, getSaleById } from '../api/sales';
import { ArtifactRenderer } from '../components/artifacts/ArtifactRenderer';
import { Sale } from '../types/bito';

export const SalesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const {
    data: salesResponse,
    isLoading: salesLoading,
    isError: salesError,
    error: salesErrObj,
    refetch
  } = useQuery({
    queryKey: ['sales', searchTerm, page],
    queryFn: () => getSales({ search: searchTerm, page, page_size: 15 }),
  });

  const { data: saleDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['saleDetail', selectedSaleId],
    queryFn: () => (selectedSaleId ? getSaleById(selectedSaleId) : null),
    enabled: !!selectedSaleId,
  });

  const analysisMutation = useMutation({
    mutationFn: () => {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return runSalesAnalysis({
        from: thirtyDaysAgo.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
      });
    },
  });

  const salesList = (salesResponse?.data || []).filter(s => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  const pagination = salesResponse?.pagination;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Yakunlangan
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RotateCcw className="w-3 h-3" />
            Qaytarilgan
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Bekor qilingan
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'card':
        return <CreditCard className="w-3.5 h-3.5 text-sky-400" />;
      case 'cash':
        return <Banknote className="w-3.5 h-3.5 text-emerald-400" />;
      case 'transfer':
      default:
        return <Building className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const exportTableCSV = () => {
    if (!salesList.length) return;
    const headers = ['Chek_raqami', 'Mijoz', 'Sana', 'Tolov_usuli', 'Holati', 'Summa_UZS'];
    const rows = salesList.map(s => [
      s.sale_number,
      s.customer_name || 'Anonim',
      s.sale_date,
      s.payment_method,
      s.status,
      s.net_amount
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `savdo_reestri_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Savdo operatsiyalari reestri</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Bito 2.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Barcha savdo cheklari, to'lov turlari va AI davriy tahlil generatori
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportTableCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-white/[0.08] transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Eksport (.csv)
          </button>
          <button
            onClick={() => analysisMutation.mutate()}
            disabled={analysisMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer"
          >
            {analysisMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Davriy tahlilni hisoblash
          </button>
        </div>
      </div>

      {/* Analysis Results Display (Generated Artifacts) */}
      {analysisMutation.data && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-indigo-500/30 space-y-5 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Generatsiya qilingan savdo tahlili</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Davr: {analysisMutation.data.period.from} — {analysisMutation.data.period.to}
                </span>
              </div>
            </div>
            <button
              onClick={() => analysisMutation.reset()}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ArtifactRenderer
              artifact={{
                id: 'art-analysis-rev',
                type: 'metric',
                title: 'Tahliliy umumiy tushum',
                data: {
                  value: analysisMutation.data.metrics.total_revenue,
                  formatted_value: `${analysisMutation.data.metrics.total_revenue.toLocaleString()} ${analysisMutation.data.currency || 'UZS'}`,
                  change_percent: analysisMutation.data.metrics.revenue_change_percent,
                  trend: analysisMutation.data.metrics.trend,
                  subtitle: `O'tgan davr: ${analysisMutation.data.previous_period.revenue.toLocaleString()} UZS`
                }
              }}
            />
            <ArtifactRenderer
              artifact={{
                id: 'art-analysis-profit',
                type: 'metric',
                title: 'Yalpi foyda (Gross Profit)',
                data: {
                  value: analysisMutation.data.metrics.gross_profit,
                  formatted_value: `${analysisMutation.data.metrics.gross_profit.toLocaleString()} ${analysisMutation.data.currency || 'UZS'}`,
                  change_percent: analysisMutation.data.metrics.gross_margin,
                  trend: 'up',
                  subtitle: `Rentabellik marjasi: ${analysisMutation.data.metrics.gross_margin.toFixed(1)}%`
                }
              }}
            />
            <ArtifactRenderer
              artifact={{
                id: 'art-analysis-orders',
                type: 'metric',
                title: 'Jami buyurtmalar',
                data: {
                  value: analysisMutation.data.metrics.orders_count,
                  formatted_value: `${analysisMutation.data.metrics.orders_count} ta`,
                  subtitle: `Sotilgan tovarlar: ${analysisMutation.data.metrics.units_sold} dona`
                }
              }}
            />
          </div>

          <ArtifactRenderer
            artifact={{
              id: 'art-analysis-timeline',
              type: 'line_chart',
              title: 'Savdo dinamikasi grafigi',
              description: 'Kunlik kassa tushumi',
              data: {
                x_key: 'date',
                series: [{ key: 'revenue', label: `Tushum (${analysisMutation.data.currency || 'UZS'})`, color: '#6366f1' }],
                rows: analysisMutation.data.timeline
              }
            }}
          />
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-900/70 rounded-2xl border border-white/[0.06] glass-panel">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Chek raqami bo'yicha qidirish..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full bg-slate-950/80 border border-white/[0.06] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer pr-2"
            >
              <option value="all" className="bg-slate-900">Barcha holatlar</option>
              <option value="completed" className="bg-slate-900">Yakunlangan</option>
              <option value="refunded" className="bg-slate-900">Qaytarilgan</option>
              <option value="cancelled" className="bg-slate-900">Bekor qilingan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Sales Table */}
      {salesLoading ? (
        <div className="text-center py-20 text-xs text-slate-400 bg-slate-900/40 rounded-3xl border border-white/[0.06]">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Buyurtmalar reestri yuklanmoqda...
        </div>
      ) : salesError ? (
        <div className="p-8 text-center bg-slate-900/80 rounded-3xl border border-rose-900/40 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <div className="text-sm font-bold text-white">Buyurtmalarni yuklashda xatolik</div>
          <p className="text-xs text-slate-400">{(salesErrObj as any)?.message || "Server bilan aloqa uzildi"}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
          >
            Qayta urinish
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/[0.06] bg-slate-900/70 overflow-hidden shadow-2xl glass-panel">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/[0.06]">
              <tr>
                <th className="px-5 py-3.5">Chek raqami</th>
                <th className="px-5 py-3.5">Mijoz</th>
                <th className="px-5 py-3.5">Sana va vaqt</th>
                <th className="px-5 py-3.5">To'lov usuli</th>
                <th className="px-5 py-3.5">Holati</th>
                <th className="px-5 py-3.5 text-right">Summa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {salesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                    Reestrda buyurtmalar topilmadi
                  </td>
                </tr>
              ) : (
                salesList.map(sale => {
                  const initials = (sale.customer_name || 'AU')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={sale.id}
                      onClick={() => setSelectedSaleId(sale.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition group"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-400 group-hover:text-indigo-300">
                        {sale.sale_number}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-700">
                            {initials}
                          </div>
                          <span className="font-semibold text-slate-200">{sale.customer_name || 'Anonim xaridor'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                        {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : '-'} • {sale.sale_date ? new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-white/[0.06] text-[11px] font-mono text-slate-300">
                          {getPaymentIcon(sale.payment_method)}
                          <span className="uppercase">{sale.payment_method}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">{getStatusBadge(sale.status)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-black text-white text-sm">
                        {sale.net_amount.toLocaleString()} UZS
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-white/[0.06] bg-slate-950/50 text-xs text-slate-400">
              <span className="font-mono">
                Jami: <strong className="text-white">{pagination.total}</strong> ta chek ({pagination.page}/{pagination.pages} sahifa)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 py-1 bg-slate-900 rounded-lg text-xs font-mono font-bold text-white">
                  {page}
                </span>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-over Drawer for Sale Details */}
      {selectedSaleId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border-l border-white/[0.08] w-full max-w-md h-full flex flex-col p-6 shadow-2xl glass-panel animate-in slide-in-from-right duration-200">
            {detailLoading ? (
              <div className="m-auto text-center space-y-2">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="text-xs text-slate-400">Chek tafsilotlari yuklanmoqda...</div>
              </div>
            ) : saleDetail ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{saleDetail.sale_number}</h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {saleDetail.sale_date ? new Date(saleDetail.sale_date).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSaleId(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body Details */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/[0.06] space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Mijoz:</span>
                      <span className="font-semibold text-white">{saleDetail.customer_name || 'Anonim'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">To'lov usuli:</span>
                      <span className="font-mono uppercase text-indigo-400 font-bold">{saleDetail.payment_method}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Holat:</span>
                      <span>{getStatusBadge(saleDetail.status)}</span>
                    </div>
                    {saleDetail.notes && (
                      <div className="text-xs text-slate-400 pt-2 border-t border-white/[0.04]">
                        Izoh: {saleDetail.notes}
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="space-y-2.5">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Buyurtma tovarlari:
                    </h5>
                    <div className="space-y-2">
                      {saleDetail.items?.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-950/50 border border-white/[0.04] space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-200">
                            <span>{item.product_name}</span>
                            <span className="font-mono text-emerald-400">{item.total_price.toLocaleString()} UZS</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                            <span>{item.quantity} dona × {item.unit_price.toLocaleString()} UZS</span>
                            {item.cost_price ? (
                              <span>Tannarx: {item.cost_price.toLocaleString()} UZS</span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Total & Actions */}
                <div className="pt-4 border-t border-white/[0.06] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-400">Jami to'lov:</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {saleDetail.net_amount.toLocaleString()} UZS
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Chop etish
                    </button>
                    <button
                      onClick={() => setSelectedSaleId(null)}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                    >
                      Yopish
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
