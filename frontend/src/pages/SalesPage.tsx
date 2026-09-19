import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Search,
  Sparkles,
  X,
  TrendingUp,
  CreditCard,
  Receipt,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  User,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  Copy,
  Check
} from 'lucide-react';
import { getSales, runSalesAnalysis } from '../api/sales';
import { useLanguage } from '../context/LanguageContext';

export const SalesPage: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'PAYME' | 'CLICK' | 'UZUM' | 'CASH'>('all');
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', searchTerm],
    queryFn: () => getSales({ search: searchTerm }),
  });

  const analysisMutation = useMutation({
    mutationFn: () => runSalesAnalysis({ from: '2026-01-01', to: '2026-01-31' }),
    onSuccess: () => {
      setShowAnalysisModal(true);
    }
  });

  // Default fallback mock sales if backend orders are empty or during local demo
  const fallbackOrders = [
    {
      id: 'ord-1048',
      sale_number: 'CHK-9042',
      sale_date: '2026-09-19 11:42',
      customer_name: 'Jasur Karimov',
      customer_phone: '+998 90 123 45 67',
      items_summary: 'Apple Watch Series 9 45mm Midnight (1x), Silicon Band (1x)',
      items_detail: [
        { name: 'Apple Watch Series 9 45mm', qty: 1, price: 5400000 },
        { name: 'Silicon Sport Band Midnight', qty: 1, price: 250000 }
      ],
      payment_method: 'PAYME',
      status: 'completed',
      net_amount: 5650000,
      cashier: 'Madina R.'
    },
    {
      id: 'ord-1047',
      sale_number: 'CHK-9041',
      sale_date: '2026-09-19 11:15',
      customer_name: 'Dildora Ahmedova',
      customer_phone: '+998 93 456 78 90',
      items_summary: 'Xiaomi Robot Vacuum X10 (1x)',
      items_detail: [
        { name: 'Xiaomi Robot Vacuum X10 White', qty: 1, price: 4200000 }
      ],
      payment_method: 'UZUM',
      status: 'completed',
      net_amount: 4200000,
      cashier: 'Sardor B.'
    },
    {
      id: 'ord-1046',
      sale_number: 'CHK-9040',
      sale_date: '2026-09-19 10:48',
      customer_name: 'Bekzod Rahimov',
      customer_phone: '+998 97 789 12 34',
      items_summary: 'Samsung Galaxy S24 Ultra 512GB (1x), Armor Case (1x)',
      items_detail: [
        { name: 'Samsung Galaxy S24 Ultra Titanium Gray', qty: 1, price: 14800000 },
        { name: 'Armor Shield Protective Case', qty: 1, price: 350000 }
      ],
      payment_method: 'CLICK',
      status: 'completed',
      net_amount: 15150000,
      cashier: 'Madina R.'
    },
    {
      id: 'ord-1045',
      sale_number: 'CHK-9039',
      sale_date: '2026-09-19 10:20',
      customer_name: 'Mijoz (Naqd)',
      customer_phone: 'Noma\'lum',
      items_summary: 'Anker 65W Fast Charger (2x), Type-C Braided Cable (2x)',
      items_detail: [
        { name: 'Anker GaN 65W Charger', qty: 2, price: 420000 },
        { name: 'Type-C Braided Fast Cable', qty: 2, price: 110000 }
      ],
      payment_method: 'CASH',
      status: 'completed',
      net_amount: 1060000,
      cashier: 'Sardor B.'
    },
    {
      id: 'ord-1044',
      sale_number: 'CHK-9038',
      sale_date: '2026-09-19 09:55',
      customer_name: 'Anvar Normatov',
      customer_phone: '+998 99 321 65 43',
      items_summary: 'ThinkPad Bluetooth Silent Mouse (1x), Laptop Stand (1x)',
      items_detail: [
        { name: 'Lenovo ThinkPad Silent Mouse', qty: 1, price: 480000 },
        { name: 'Ergonomic Aluminum Laptop Stand', qty: 1, price: 380000 }
      ],
      payment_method: 'PAYME',
      status: 'completed',
      net_amount: 860000,
      cashier: 'Madina R.'
    },
    {
      id: 'ord-1043',
      sale_number: 'CHK-9037',
      sale_date: '2026-09-19 09:12',
      customer_name: 'Shohruh Mirzayev',
      customer_phone: '+998 91 999 88 77',
      items_summary: 'Dell UltraSharp 27" 4K Monitor (1x)',
      items_detail: [
        { name: 'Dell UltraSharp U2723QE 4K', qty: 1, price: 6850000 }
      ],
      payment_method: 'CLICK',
      status: 'completed',
      net_amount: 6850000,
      cashier: 'Sardor B.'
    }
  ];

  const rawOrders = (salesData?.data && salesData.data.length > 0) ? salesData.data : fallbackOrders;

  const filteredOrders = rawOrders.filter((o: any) => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchSearch = (
        o.sale_number?.toLowerCase().includes(term) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(term)) ||
        (o.items_summary && o.items_summary.toLowerCase().includes(term))
      );
      if (!matchSearch) return false;
    }
    // Payment filter
    if (paymentFilter !== 'all') {
      const method = (o.payment_method || '').toUpperCase();
      if (method !== paymentFilter) return false;
    }
    return true;
  });

  const totalFilteredRevenue = filteredOrders.reduce((acc: number, curr: any) => {
    return acc + Number(curr.net_amount || curr.total_amount || 0);
  }, 0);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Chek', 'Sana', 'Xaridor', 'Mahsulotlar', 'To\'lov', 'Summa'];
    const rows = filteredOrders.map((o: any) => [
      o.sale_number,
      o.sale_date,
      o.customer_name || 'Guest',
      `"${(o.items_summary || '').replace(/"/g, '""')}"`,
      o.payment_method,
      o.net_amount || o.total_amount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KHB_Savdo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Savdo operatsiyalari
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-radar" />
              Bito POS sinxron
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Do'kon: KHB Texno Market</span>
            <span>•</span>
            <span>Bugun 19-Sentyabr, 2026</span>
            <span>•</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{filteredOrders.length} ta kassa cheki</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-2xl text-xs font-semibold bg-white dark:bg-[#0e1320] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 transition active:scale-95 cursor-pointer shadow-xs flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Eksport</span>
          </button>

          <button
            onClick={() => analysisMutation.mutate()}
            disabled={analysisMutation.isPending}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition active:scale-95 cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            {analysisMutation.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>AI Savdo tahlili</span>
          </button>
        </div>
      </div>

      {/* 2. TOP 4 COHESIVE KPI CARDS */}
      <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 shadow-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:divide-x divide-slate-100 dark:divide-slate-800">
        {/* KPI 1: Bugungi tushum */}
        <div className="flex items-center gap-4 sm:px-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              Bugungi tushum
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white font-mono">
              {(totalFilteredRevenue / 1000000).toFixed(1)}M UZS
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
              <span>↑</span> +14.2% kechagiga nisbatan
            </span>
          </div>
        </div>

        {/* KPI 2: O'rtacha chek */}
        <div className="flex items-center gap-4 sm:px-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
            <Receipt className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              O'rtacha chek
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white font-mono">
              {filteredOrders.length > 0
                ? Math.round(totalFilteredRevenue / filteredOrders.length / 1000) * 1000 >= 1000000
                  ? `${(totalFilteredRevenue / filteredOrders.length / 1000000).toFixed(2)}M`
                  : `${Math.round(totalFilteredRevenue / filteredOrders.length / 1000)}k`
                : '0'} UZS
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
              <span>↑</span> +4.1% optimallashtirish
            </span>
          </div>
        </div>

        {/* KPI 3: Jami cheklar soni */}
        <div className="flex items-center gap-4 sm:px-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              Cheklar soni
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white font-mono">
              {filteredOrders.length} ta
            </div>
            <span className="text-xs font-medium text-slate-400 flex items-center gap-0.5 mt-0.5">
              Bugungi faol operatsiyalar
            </span>
          </div>
        </div>

        {/* KPI 4: Qaytarishlar */}
        <div className="flex items-center gap-4 sm:px-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2] text-emerald-600" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              Qaytarilgan tovarlar
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white font-mono">
              0 ta
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
              100% muvaffaqiyatli xarid
            </span>
          </div>
        </div>
      </div>

      {/* 3. CONTROLS: SEARCH & PAYMENT METHOD FILTER TABS */}
      <div className="p-4 sm:p-5 rounded-[28px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Chek raqami, xaridor yoki tovar nomi bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Payment tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'all', label: 'Barchasi' },
            { key: 'PAYME', label: 'Payme' },
            { key: 'CLICK', label: 'Click' },
            { key: 'UZUM', label: 'Uzum Nasiya' },
            { key: 'CASH', label: 'Naqd pul' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPaymentFilter(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                paymentFilter === tab.key
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. ORDERS TABLE */}
      <div className="rounded-[32px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              <tr>
                <th className="px-6 py-4">Chek №</th>
                <th className="px-6 py-4">Sana va Vaqt</th>
                <th className="px-6 py-4">Xaridor</th>
                <th className="px-6 py-4">Mahsulotlar</th>
                <th className="px-6 py-4">To'lov turi</th>
                <th className="px-6 py-4 text-right">Summa</th>
                <th className="px-6 py-4 text-center">Holat</th>
                <th className="px-6 py-4 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Ma'lumotlar yuklanmoqda...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Buyurtmalar topilmadi.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition group cursor-pointer"
                    onClick={() => setSelectedReceipt(order)}
                  >
                    {/* Chek raqami */}
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{order.sale_number}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(order.sale_number, order.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                          title="Nusxa olish"
                        >
                          {copiedId === order.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Sana */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {order.sale_date}
                    </td>

                    {/* Xaridor */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {order.customer_name || 'Mehmon xaridor'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {order.customer_phone || 'Kassadan to\'lov'}
                      </div>
                    </td>

                    {/* Mahsulotlar */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {order.items_summary}
                    </td>

                    {/* To'lov turi */}
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                        {order.payment_method || 'CARD'}
                      </span>
                    </td>

                    {/* Summa */}
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-950 dark:text-white whitespace-nowrap">
                      {Number(order.net_amount || order.total_amount).toLocaleString()} UZS
                    </td>

                    {/* Holat */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Bajarildi
                      </span>
                    </td>

                    {/* Amal */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReceipt(order);
                        }}
                        className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                      >
                        Chek
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. RECEIPT DETAILS MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="rounded-[32px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0e1320] max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">
                    Kassa cheki: {selectedReceipt.sale_number}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedReceipt.sale_date}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Kassir / Operator:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedReceipt.cashier || 'Madina R.'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Mijoz:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedReceipt.customer_name || 'Mehmon'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">To'lov usuli:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedReceipt.payment_method}</span>
              </div>

              <div className="pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Xarid tarkibi
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedReceipt.items_detail ? (
                    selectedReceipt.items_detail.map((it: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{it.name} <b className="text-slate-400">×{it.qty}</b></span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">{(it.price * it.qty).toLocaleString()} UZS</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-600 dark:text-slate-300">{selectedReceipt.items_summary}</div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Jami to'lov</span>
                <span className="text-xl font-bold font-mono text-slate-950 dark:text-white">
                  {Number(selectedReceipt.net_amount || selectedReceipt.total_amount).toLocaleString()} UZS
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Yopish
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-xs font-bold"
              >
                Chop etish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. AI SALES ANALYSIS MODAL */}
      {showAnalysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="rounded-[32px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0e1320] max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">
                    AI Savdo Tahlili & Auditor
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bito POS ma'lumotlari asosidagi avtomatlashtirilgan diagnostika
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium">Jami tushum</span>
                <div className="text-lg font-bold text-slate-950 dark:text-white mt-1 font-mono">
                  {analysisMutation.data?.metrics?.total_revenue
                    ? `${analysisMutation.data.metrics.total_revenue.toLocaleString()} UZS`
                    : '58 700 000 UZS'}
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  +14.2% o'tgan davrga nisbatan
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium">Sof yalpi foyda</span>
                <div className="text-lg font-bold text-slate-950 dark:text-white mt-1 font-mono">
                  {analysisMutation.data?.metrics?.gross_profit
                    ? `${analysisMutation.data.metrics.gross_profit.toLocaleString()} UZS`
                    : '14 200 000 UZS'}
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  O'rtacha marja: 24.1%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium">Muvaffaqiyatli cheklar</span>
                <div className="text-lg font-bold text-slate-950 dark:text-white mt-1 font-mono">
                  {analysisMutation.data?.metrics?.orders_count || 44} ta
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  128 dona tovar sotildi
                </span>
              </div>
            </div>

            {/* Anomaly / Insight Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-950 dark:text-white">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Operatsion anomaliya aniqlandi:</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tushki soat 13:00 dan 14:30 gacha bo'lgan vaqtda kassa kutish vaqti 3.2 daqiqaga cho'zildi. Qo'shimcha kassirni jalb qilish orqali kunlik tushumni yana 8% ga oshirish mumkin.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-xs font-bold"
              >
                Tushunarli, yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
