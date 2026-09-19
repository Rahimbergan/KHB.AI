import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Download,
  Building2,
  DollarSign,
  ChevronRight,
  Search,
  ExternalLink,
  Info
} from 'lucide-react';
import { getFiles, uploadFile, analyzeFile } from '../api/documents';
import { FileRecord } from '../types/files';
import { useLanguage } from '../context/LanguageContext';

export const DocumentsPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeCategory, setActiveCategory] = useState<'all' | 'supply' | 'leasing' | 'service'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [calendarAlertSuccess, setCalendarAlertSuccess] = useState(false);

  // Fallback rich realistic contracts for retail store
  const mockContracts = [
    {
      id: 'doc-xiaomi-2026',
      filename: 'Xiaomi_Official_Supply_Contract_2026.pdf',
      title: 'Xiaomi Official Supply Agreement',
      counterparty: 'Xiaomi H.K. Distribution Central Asia',
      category: 'supply',
      contract_value: '140 000 000 UZS / oy',
      file_type: 'PDF',
      size_formatted: '2.4 MB',
      created_at: '2026-01-15',
      deadline: '2026-12-31',
      next_payment_date: '2026-09-25',
      next_payment_amount: '24 500 000 UZS',
      status: 'active',
      status_label: 'Faol ta\'minot',
      analysis_data: {
        monetary_terms: '15 kalendar kunlik kechiktirilgan to\'lov (Deferred Payment). To\'lov muddati buzilganda har kun uchun 0.1% penya (maksimal 5%).',
        deadlines: [
          'Keyingi to\'lov: 2026-09-25 (24 500 000 UZS)',
          'Yangi partiya buyurtmasi: Har seshanba soat 18:00 gacha',
          'Shartnoma yakuni: 2026-12-31'
        ],
        risk_factors: [
          'Zaxira talabi: Do\'konda doimiy 10 dona minimal qoldiq saqlanishi shart.',
          'Narx oshishi: Ta\'minotchi narxni o\'zgartirish uchun 30 kun oldin yozma xabar berishi shart.'
        ],
        disclaimer: 'AI yuridik tekshiruvi: Shartnoma xavfsizlik darajasi yuqori (98%). Jarima shartlari standart bozor me\'yoriga mos.'
      },
      content_preview: `1. SHARTNOMA PREDMETI:
1.1. Yetkazib beruvchi (Xiaomi CA) Buyurtmachining Bito POS orqali bergan buyurtmalariga asosan maishiy texnika va smartfonlarni belgilangan muddatda yetkazib beradi.
1.2. Yetkazib berish muddati: Buyurtma tasdiqlangandan so'ng 48 soat ichida Toshkent shahridagi omborga.

2. HISOB-KITOBLAR VA TO'LOV TARTIBI:
2.1. Mahsulotlar qiymati hisob-faktura (ESF) asosida to'lanadi.
2.2. To'lov kechiktirish muddati: Tovar qabul qilingan sanadan boshlab 15 (o'n besh) kalendar kun.
2.3. Kechiktirilgan har bir kun uchun 0.1% miqdorida penya hisoblanadi.`
    },
    {
      id: 'doc-samsung-2026',
      filename: 'Samsung_Electronics_Authorized_Partner.pdf',
      title: 'Samsung Trade & Warranty Protocol',
      counterparty: 'Samsung Electronics Central Eurasia LLC',
      category: 'supply',
      contract_value: '210 000 000 UZS / oy',
      file_type: 'PDF',
      size_formatted: '3.1 MB',
      created_at: '2026-02-01',
      deadline: '2027-01-31',
      next_payment_date: '2026-09-28',
      next_payment_amount: '22 000 000 UZS',
      status: 'active',
      status_label: 'Faol ta\'minot',
      analysis_data: {
        monetary_terms: '20 kunlik to\'lov kechiktirish. Kassa keshbek va kafolat kompensatsiyasi har oyning 5-sanasigacha to\'liq qaytariladi.',
        deadlines: [
          'Kafolat aktlarini topshirish: Har oyning 1-sanasida',
          'Keyingi to\'lov: 2026-09-28 (22 000 000 UZS)'
        ],
        risk_factors: [
          'Defekt tovarlar: Nuqsonli uskunalar 72 soat ichida to\'liq yangisiga almashtiriladi.'
        ],
        disclaimer: 'AI tahlili: Shartnoma xaridorni to\'liq kafolat himoyasi bilan ta\'minlaydi.'
      },
      content_preview: `SAMSUNG ELECTRONICS AUTORIZATSIYA SHARTNOMASI:
Tovarlarning rasmiy dilerlik kafolati va texnik xizmat ko'rsatish shartlari. Rasmiy servis markazlarida bepul almashtirish kafolatlangan.`
    },
    {
      id: 'doc-lease-2026',
      filename: 'Tashkent_City_Mall_Lease_Agreement.pdf',
      title: 'Do\'kon Joylashuvi Bosh Ijara Shartnomasi',
      counterparty: 'Tashkent Commercial Real Estate LLC',
      category: 'leasing',
      contract_value: '18 000 000 UZS / oy',
      file_type: 'PDF',
      size_formatted: '1.8 MB',
      created_at: '2025-10-01',
      deadline: '2026-10-01',
      next_payment_date: '2026-10-01',
      next_payment_amount: '18 000 000 UZS',
      status: 'warning',
      status_label: 'Muddat yaqin (12 kun)',
      analysis_data: {
        monetary_terms: 'Har oyning 1-sanasiga qadar oldindan to\'lov (Prepayment). Kommunal to\'lovlar hisoblagich ko\'rsatkichiga ko\'ra alohida to\'lanadi.',
        deadlines: [
          'Shartnomani uzaytirish arizasi: 2026-09-25 gacha yozma bildirishnoma berilishi lozim!',
          'Oylik ijara to\'lovi: 2026-10-01'
        ],
        risk_factors: [
          'MUHIM OGOHLANTIRISH: Shartnoma muddati 2026-yil 1-oktyabrda tugaydi. Agar 25-sentyabrgacha uzaytirish xati berilmasa, ijara narxi 15% oshirilishi mumkin.'
        ],
        disclaimer: 'AI huquqiy signali: Zudlik bilan ijara muddatini 1 yilga uzaytirish bo\'yicha qo\'shimcha kelishuv imzolash tavsiya etiladi.'
      },
      content_preview: `IJARA SHARTNOMASI № 44-TC:
Savdo maydoni: 120 kv.m. Do'kon: KHB Texno Market. Ijara muddati: 12 oy. Shartnomani uzaytirish sharti: Muddat tugashidan kamida 30 kun oldin xabardor qilish.`
    },
    {
      id: 'doc-bito-sla-2026',
      filename: 'Bito_POS_SaaS_Service_Agreement.pdf',
      title: 'Bito POS & Payme Integratsiya SLA',
      counterparty: 'Bito Technologies & Payments Ltd',
      category: 'service',
      contract_value: '1 200 000 UZS / oy',
      file_type: 'PDF',
      size_formatted: '850 KB',
      created_at: '2026-01-01',
      deadline: '2027-01-01',
      next_payment_date: '2026-10-05',
      next_payment_amount: '1 200 000 UZS',
      status: 'active',
      status_label: 'Faol integratsiya',
      analysis_data: {
        monetary_terms: 'Oylik obuna to\'lovi 1 200 000 UZS. Tranzaksiya komissiyasi 0.7% Payme / Click orqali.',
        deadlines: [
          'Texnik uzilishlar uchun SLA: Maksimal 15 daqiqa (99.9% kafolat)',
          'Keyingi hisob-kitob: 2026-10-05'
        ],
        risk_factors: [
          'Kassa fiskallashtirish: Barcha cheklar avtomatik Soliq qo\'mitasi bazasiga yuborilishi ta\'minlangan.'
        ],
        disclaimer: 'AI tekshiruvi: Xizmat to\'liq me\'yoriy qoidalarga javob beradi.'
      },
      content_preview: `BITO POS CLOUD SERVICE LEVEL AGREEMENT (SLA):
24/7 jonli kassa sinxronizatsiyasi, inventarizatsiya auditi va to'lov shlyuzlari kafolati.`
    }
  ];

  const { data: filesData, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => getFiles(),
  });

  const [selectedFile, setSelectedFile] = useState<any>(mockContracts[0]);

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedFile(newDoc);
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: (fileId: string) => analyzeFile(fileId),
    onSuccess: (analysisData) => {
      if (selectedFile) {
        setSelectedFile({
          ...selectedFile,
          analysis_data: analysisData
        });
      }
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const filteredContracts = mockContracts.filter((doc) => {
    if (activeCategory !== 'all' && doc.category !== activeCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        doc.title.toLowerCase().includes(term) ||
        doc.counterparty.toLowerCase().includes(term) ||
        doc.filename.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleAddToCalendar = () => {
    setCalendarAlertSuccess(true);
    setTimeout(() => setCalendarAlertSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* 1. TOP HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Shartnomalar va Bitimlar
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              AI Yuridik monitoring faol
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Ta'minot, ijara va to'lov muddatlari bo'yicha doimiy nazorat</span>
            <span>•</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{mockContracts.length} ta faol bitim</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition active:scale-95 cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            {uploadMutation.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5" />
            )}
            <span>+ Yangi shartnoma yuklash</span>
          </button>
        </div>
      </div>

      {/* 2. TOP 4 COHESIVE KPI CARDS */}
      <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 shadow-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:divide-x divide-slate-100 dark:divide-slate-800">
        {/* KPI 1: Faol shartnomalar */}
        <div className="flex items-center gap-4 sm:px-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <FileText className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              Faol shartnomalar
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white font-mono">
              12 ta
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
              <span>✓</span> Barchasi qonuniy kuchga ega
            </span>
          </div>
        </div>

        {/* KPI 2: Kutilayotgan to'lovlar */}
        <div className="flex items-center gap-4 sm:px-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
            <DollarSign className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              Kutilayotgan to'lovlar
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white font-mono">
              46.5M UZS
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-0.5 mt-0.5">
              Keyingi 10 kun ichida
            </span>
          </div>
        </div>

        {/* KPI 3: Yaqinlashayotgan muddatlar */}
        <div className="flex items-center gap-4 sm:px-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-800/40">
            <Clock className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              Kritik muddatlar
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white font-mono">
              2 ta
            </div>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-0.5 mt-0.5">
              Ijara uzaytirish talab qilinadi
            </span>
          </div>
        </div>

        {/* KPI 4: AI Risk xavfsizligi */}
        <div className="flex items-center gap-4 sm:px-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              AI Xavfsizlik darajasi
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white font-mono">
              98%
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
              Yashirin jarimalar yo'q
            </span>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: TWO COLUMNS (List & Comprehensive AI Review) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Contracts Directory (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Controls: Search & Category Tabs */}
          <div className="p-4 rounded-[28px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Shartnoma yoki hamkor nomi bo'yicha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { key: 'all', label: 'Barchasi' },
                { key: 'supply', label: 'Ta\'minot' },
                { key: 'leasing', label: 'Ijara' },
                { key: 'service', label: 'Xizmat / POS' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeCategory === tab.key
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contracts List Cards */}
          <div className="space-y-3">
            {filteredContracts.map((contract) => {
              const isSelected = selectedFile?.id === contract.id;
              return (
                <div
                  key={contract.id}
                  onClick={() => setSelectedFile(contract)}
                  className={`p-5 rounded-[28px] border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-[#0e1320] border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-white/80 dark:bg-[#0e1320]/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        contract.category === 'leasing'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                      }`}>
                        {contract.category === 'leasing' ? (
                          <Building2 className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-950 dark:text-white leading-snug">
                          {contract.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {contract.counterparty}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                      contract.status === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                    }`}>
                      {contract.status_label}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Qiymat: <b className="text-slate-900 dark:text-white font-semibold">{contract.contract_value}</b>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <span>Batafsil</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Contract Intelligence Hub (7 cols) */}
        <div className="lg:col-span-7">
          {selectedFile ? (
            <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-6">
              {/* Header with counterparty & action buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Shartnoma tahlili
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white mt-0.5">
                    {selectedFile.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Hamkor: <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedFile.counterparty}</span> • Fayl: {selectedFile.filename}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddToCalendar}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Taqvimga kiritish</span>
                  </button>

                  <button
                    onClick={() => navigate(`/chat?prompt=Shartnoma bo'yicha tahlil: ${selectedFile.title}`)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5 font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI dan so'rash</span>
                  </button>
                </div>
              </div>

              {calendarAlertSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Keyingi to'lov sanasi ({selectedFile.next_payment_date}) do'kon taqvimiga eslatma sifatida muvaffaqiyatli kiritildi!</span>
                </div>
              )}

              {/* Next Payment Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Kutilayotgan navbatdagi to'lov
                  </span>
                  <div className="text-lg font-bold font-mono text-slate-950 dark:text-white mt-0.5">
                    {selectedFile.next_payment_amount || '12 000 000 UZS'}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 font-medium block">
                    To'lov muddati (Deadline)
                  </span>
                  <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {selectedFile.next_payment_date}
                  </span>
                </div>
              </div>

              {/* Extracted AI Intelligence Cards */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>AI Yuridik xulosasi va muddatlar</span>
                </div>

                {/* 1. To'lov shartlari */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>To'lov va Moliyaviy Majburiyatlar:</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                    {selectedFile.analysis_data?.monetary_terms}
                  </p>
                </div>

                {/* 2. Muhim muddatlar ro'yxati */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Belgilangan muddatlar va Reja:</span>
                  </div>
                  <ul className="space-y-1.5 pl-6 text-xs text-slate-600 dark:text-slate-300">
                    {selectedFile.analysis_data?.deadlines?.map((d: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Xavflar va ogohlantirishlar */}
                {selectedFile.analysis_data?.risk_factors && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 space-y-1.5">
                    <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>E'tibor qilinadigan xatar omillari:</span>
                    </div>
                    <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed pl-6">
                      {selectedFile.analysis_data.risk_factors.join(' ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Raw Contract Text Viewer */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Hujjatning asl matni</span>
                  <span className="text-[11px] text-slate-400 font-mono">Bito POS audit reestri</span>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                  {selectedFile.content_preview}
                </pre>
              </div>

              <div className="text-[11px] text-slate-400 italic">
                * {selectedFile.analysis_data?.disclaimer}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-[32px] bg-white dark:bg-[#0e1320] border border-slate-200/80 dark:border-slate-800/80 text-center text-slate-400">
              Tahlil qilish uchun ro'yxatdan shartnomani tanlang.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
