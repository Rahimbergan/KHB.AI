# KHB.AI - Frontend CRM & AI Business Operations Assistant

Ushbu qism kichik biznes egalari uchun mo'ljallangan zamonaviy CRM, operatsion hisobotlar va sun'iy intellekt (Claude-style Artifacts) bilan ishlovchi React veb-ilovasi.

## Xususiyatlari

1. **Boshqaruv paneli (Dashboard / CRM Overview)**:
   - Bugungi tushum, buyurtmalar soni, o'rtacha chek (AOV), yalpi marja (Gross margin).
   - Oylik savdo tendensiyasi (Recharts Line Chart).
   - Kategoriyalar bo'yicha tushum taqsimoti.
   - Eng ko'p sotilgan top mahsulotlar jadvali va kam qolgan tovarlar bo'yicha tezkor ogohlantirishlar.
2. **Savdo va Tahlil (Sales & Analysis)**:
   - Qidiruv va statuslar (Yakunlangan, Qaytarilgan, Bekor qilingan) bo'yicha filtrlash.
   - Buyurtma tafsilotlari modali (tovarlar ro'yxati, narxlar, to'lov turi).
   - Bir tugma bilan "Davriy tahlilni ishga tushirish" va dinamik artefaktlar generatsiyasi.
3. **Hujjatlar (Documents & Legal Extract)**:
   - Drag-and-drop orqali shartnoma, hisob-faktura yoki jadvallarni yuklash (PDF, TXT, CSV, XLSX).
   - Hujjatdan tomonlar, muhim muddatlar, moliyaviy summalar, majburiyatlar va aniqlangan xavflarni ajratib ko'rsatish.
   - Yuridik eslatma (Legal disclaimer) ko'rsatilishi.
4. **AI Yordamchi (Webchat Workspace)**:
   - Muloqotlar ro'yxati va yangi chat boshlash.
   - Tavsiya etilgan biznes so'rovlar (Suggested prompts).
   - Claude-style interaktiv artefaktlar (Metrika kartalari, jadvallar, chiziqli va ustunli grafiklar, hujjat tahlili).
   - Manbalar (Sources) va JSON nusxalash / kengaytirish imkoniyati.

## Texnologiyalar

- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4**
- **TanStack React Query**
- **Lucide React**
- **Recharts**
- **React Router DOM**

## O'rnatish va Ishga Tushirish

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Brauzerda oching: `http://localhost:5173`

## Muhit o'zgaruvchilari (.env)

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_ENABLE_MOCK_FALLBACK=true
```

- `VITE_API_BASE_URL`: Backend API manzili.
- `VITE_ENABLE_MOCK_FALLBACK`: Agar backend ishga tushmagan bo'lsa, avtomatik ravishda to'liq interaktiv lokal ma'lumotlar bilan ishlashni ta'minlaydi.
