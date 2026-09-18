import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Play, Search, AlertTriangle, ArrowRight, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { SalesAnalysis } from '../types';

interface SalesPageProps {
  currentDate: string;
}

export const SalesPage: React.FC<SalesPageProps> = ({ currentDate }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [analysisResult, setAnalysisResult] = useState<SalesAnalysis | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', page, search],
    queryFn: () => api.getSales({ page, page_size: 15, search: search || undefined }),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => {
      const from = currentDate.substring(0, 7) + '-01';
      return api.runSalesAnalysis(from, currentDate);
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setShowAnalysisModal(true);
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU').format(Math.round(val)) + ' UZS';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Analysis Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Sales Orders & Analytics</h2>
          <p className="text-sm text-slate-400 mt-1">
            Track transactions, refunds, and run deep comparative performance analysis.
          </p>
        </div>
        <button
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {analyzeMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>Run Sales Analysis</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order number or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Showing {salesData?.data.length || 0} of {salesData?.pagination.total || 0} orders
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : salesData?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                salesData?.data.map((order) => {
                  const isRefunded = order.status === 'refunded';
                  const isCancelled = order.status === 'cancelled';
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">{order.order_number}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {order.order_date.replace('T', ' ').substring(0, 16)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 font-medium">{order.customer_name}</td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                        {order.items.map((i) => `${i.product_name} (x${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                            isRefunded
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : isCancelled
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 uppercase text-[11px] font-medium">
                        {order.payment_method}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-white">
                        {formatCurrency(order.total_amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {salesData && salesData.pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page {salesData.pagination.page} of {salesData.pagination.pages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= salesData.pagination.pages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results Modal */}
      {showAnalysisModal && analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  Sales Performance Analysis
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Period: {analysisResult.from_date} to {analysisResult.to_date}
                </p>
              </div>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400">Total Revenue</div>
                <div className="text-sm font-bold text-white mt-1">
                  {formatCurrency(analysisResult.total_revenue)}
                </div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400">Gross Margin</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">
                  {analysisResult.gross_margin}%
                </div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400">Total Orders</div>
                <div className="text-sm font-bold text-white mt-1">
                  {analysisResult.number_of_orders}
                </div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <div className="text-[11px] text-slate-400">Units Sold</div>
                <div className="text-sm font-bold text-white mt-1">
                  {analysisResult.units_sold}
                </div>
              </div>
            </div>

            {/* Period Comparison */}
            {analysisResult.previous_period_comparison && (
              <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="text-xs font-semibold text-slate-300">
                  Comparison with Previous Period
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Revenue Change:</span>
                  <span
                    className={`font-bold ${
                      analysisResult.previous_period_comparison.revenue_change_percent >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {analysisResult.previous_period_comparison.revenue_change_percent >= 0 ? '+' : ''}
                    {analysisResult.previous_period_comparison.revenue_change_percent}%
                  </span>
                  <span>
                    (Prev:{' '}
                    {formatCurrency(
                      analysisResult.previous_period_comparison.previous_revenue || 0
                    )}
                    )
                  </span>
                </div>
              </div>
            )}

            {/* Anomalies Detected */}
            {analysisResult.anomalies && analysisResult.anomalies.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Detected Operational Anomalies</span>
                </div>
                <div className="space-y-1.5">
                  {analysisResult.anomalies.map((a, i) => (
                    <div
                      key={i}
                      className="text-xs bg-slate-800/70 border border-slate-700 p-2.5 rounded-lg text-slate-300"
                    >
                      {a.description}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-800">
              {analysisResult.disclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

