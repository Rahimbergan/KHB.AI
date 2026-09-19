export const MOCK_DAILY_SALES = {
  date: "2026-01-31",
  currency: "UZS",
  total_revenue: 58700000,
  total_cost: 48280000,
  gross_profit: 10420000,
  gross_margin: 17.75,
  orders_count: 5,
  total_units_sold: 11,
  average_order_value: 11740000,
  refunded_count: 0,
  operating_profit: 10420000,
  expenses: 0,
  top_products: [
    { name: "Apple Watch Series 9 45mm Midnight", category: "Smart Home & Gadgets", units_sold: 3, revenue: 16800000 },
    { name: "Xiaomi Robot Vacuum S10+", category: "Smart Home & Gadgets", units_sold: 3, revenue: 12600000 },
    { name: "Samsung Galaxy S24 256GB Gray", category: "Smartphones & Tablets", units_sold: 1, revenue: 11900000 },
    { name: "Lenovo ThinkPad E14 Gen 5 i5/16GB", category: "Laptops & Computers", units_sold: 1, revenue: 9900000 },
    { name: "Dell 27-inch 4K UHD Monitor S2722QC", category: "Laptops & Computers", units_sold: 1, revenue: 5100000 },
  ],
  timeline: [
    { date: "01-01", revenue: 42000000 },
    { date: "01-03", revenue: 26000000 },
    { date: "01-05", revenue: 68000000 },
    { date: "01-07", revenue: 76000000 },
    { date: "01-09", revenue: 38000000 },
    { date: "01-11", revenue: 75000000 },
    { date: "01-13", revenue: 28000000 },
    { date: "01-15", revenue: 54000000 },
    { date: "01-17", revenue: 67000000 },
    { date: "01-19", revenue: 44000000 },
    { date: "01-21", revenue: 12000000 },
    { date: "01-23", revenue: 63000000 },
    { date: "01-25", revenue: 35000000 },
    { date: "01-27", revenue: 72000000 },
    { date: "01-29", revenue: 48000000 },
    { date: "01-31", revenue: 58700000 },
  ],
  alert: {
    title: "AI Operations Alert",
    message: "Fastest moving categories today: Smart Home & Audio. Check buffer inventory on Anker and Apple accessories to avoid lost baskets before the weekend."
  }
};

export const MOCK_SALES_ORDERS = [
  {
    id: "so-1",
    sale_number: "SO-2026-001",
    sale_date: "2026-01-31 18:40",
    customer_name: "Dilshod Karimov",
    items_summary: "Apple Watch Series 9 (2), AirPods Pro 2 (1)",
    status: "completed",
    payment_method: "CARD",
    net_amount: 16800000,
    total_amount: 16800000,
    currency: "UZS"
  },
  {
    id: "so-2",
    sale_number: "SO-2026-002",
    sale_date: "2026-01-31 16:15",
    customer_name: "Nodira Rahimova",
    items_summary: "Xiaomi Robot Vacuum S10+ (3)",
    status: "completed",
    payment_method: "CLICK",
    net_amount: 12600000,
    total_amount: 12600000,
    currency: "UZS"
  },
  {
    id: "so-3",
    sale_number: "SO-2026-003",
    sale_date: "2026-01-31 14:05",
    customer_name: "Jasur Bekzodov",
    items_summary: "Samsung Galaxy S24 256GB Gray (1)",
    status: "completed",
    payment_method: "PAYME",
    net_amount: 11900000,
    total_amount: 11900000,
    currency: "UZS"
  },
  {
    id: "so-4",
    sale_number: "SO-2026-004",
    sale_date: "2026-01-31 11:30",
    customer_name: "Alisher Usmanov",
    items_summary: "Lenovo ThinkPad E14 Gen 5 i5/16GB (1)",
    status: "completed",
    payment_method: "TRANSFER",
    net_amount: 9900000,
    total_amount: 9900000,
    currency: "UZS"
  },
  {
    id: "so-5",
    sale_number: "SO-2026-005",
    sale_date: "2026-01-31 10:10",
    customer_name: "Gulnoza Saidova",
    items_summary: "Dell 27-inch 4K UHD Monitor S2722QC (1)",
    status: "completed",
    payment_method: "CASH",
    net_amount: 5100000,
    total_amount: 5100000,
    currency: "UZS"
  }
];

export const MOCK_FILES = [
  {
    id: "file-1",
    filename: "6a3dae70_january_inventory.csv",
    file_type: "csv",
    size_bytes: 142,
    size_formatted: "0.1 KB",
    created_at: "2026-01-31 09:15",
    content_preview: "product_id,product_name,sku,stock_qty,cost_price\n1,Apple Watch Series 9,AW9-BLK,14,4600000\n2,Xiaomi Robot Vacuum S10+,XIA-VAC-S10,8,3400000\n3,Samsung Galaxy S24 256GB,SAM-S24-256,5,9800000",
    analysis_data: {
      parties: ["KHB Smart Retail", "Apple & Xiaomi Wholesale Dist"],
      effective_date: "2026-01-01",
      monetary_terms: "Stock valuation ~184,000,000 UZS",
      obligations: ["Weekly stock reconciliation", "Safety reserve threshold: 5 units per category"],
      deadlines: ["Next inventory audit: 2026-02-15"],
      risk_factors: ["Low stock threshold hit on Galaxy S24 (only 5 units remaining)"],
      disclaimer: "This analysis is an AI-assisted informational extract, not certified legal or tax advice."
    }
  },
  {
    id: "file-2",
    filename: "99cf098e_january_inventory.csv",
    file_type: "csv",
    size_bytes: 142,
    size_formatted: "0.1 KB",
    created_at: "2026-01-25 14:30",
    content_preview: "product_id,product_name,sku,stock_qty,cost_price\n4,Lenovo ThinkPad E14,LEN-TP-E14,6,8200000\n5,Dell 27-inch 4K Monitor,DEL-27-4K,4,4100000",
    analysis_data: null
  },
  {
    id: "file-3",
    filename: "commercial_lease_agreement_2026.txt",
    file_type: "txt",
    size_bytes: 924,
    size_formatted: "0.9 KB",
    created_at: "2026-01-10 11:00",
    content_preview: "COMMERCIAL REAL ESTATE LEASE AGREEMENT\nBetween: Tashkent Trade Center LLC (Landlord) and KHB Smart Retail FE (Tenant)\nLocation: Amir Temur Avenue 107A, Retail Unit #14, Tashkent\nTerm: 12 months commencing January 1, 2026.\nMonthly Rent: 25,000,000 UZS payable by 5th day of each calendar month.",
    analysis_data: {
      parties: ["Tashkent Trade Center LLC (Landlord)", "KHB Smart Retail FE (Tenant)"],
      effective_date: "2026-01-01",
      monetary_terms: "Monthly rent: 25,000,000 UZS. Security deposit: 50,000,000 UZS.",
      obligations: [
        "Pay rent strictly before 5th of each calendar month",
        "Maintain commercial property insurance policy",
        "Utility costs billed separately within 3 days of landlord invoice"
      ],
      deadlines: ["Rent payment due: 5th of every month", "Lease expiration: 2026-12-31"],
      risk_factors: ["Late payment penalty 0.2% per day of overdue sum after 5 business days."],
      disclaimer: "This analysis is an AI-assisted informational extract, not certified legal or tax advice."
    }
  }
];

export const MOCK_CONVERSATIONS = [
  {
    id: "conv-1",
    title: "New Chat",
    created_at: "2026-01-31T10:00:00Z",
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "give me the sales report 2 days ago",
        created_at: "2026-01-31T10:01:00Z"
      },
      {
        id: "msg-2",
        role: "assistant",
        content: `### Daily Sales Report for 2026-01-31\n\n- **Total Revenue**: 58 700 000 UZS\n- **Gross Profit**: 10 420 000 UZS (Gross Margin: 17.75%)\n- **Total Orders**: 5 completed orders\n- **Average Order Value (AOV)**: 11 740 000 UZS\n- **Units Sold**: 11 items\n\n**Top Performing Items Today**:\n1. **Apple Watch Series 9 45mm Midnight** — 3 units (16 800 000 UZS)\n2. **Xiaomi Robot Vacuum S10+** — 3 units (12 600 000 UZS)\n3. **Samsung Galaxy S24 256GB Gray** — 1 units (11 900 000 UZS)\n\n> This report is an informational business estimate, not legal, tax, or certified accounting advice.`,
        created_at: "2026-01-31T10:01:05Z",
        artifacts: [
          {
            id: "art-1",
            type: "metric",
            title: "Sales Revenue (2026-01-31)",
            description: "Total completed sales revenue for the day.",
            data: {
              value: 58700000,
              formatted_value: "58 700 000 UZS",
              change_percent: 46.38,
              trend: "up",
              subtitle: "vs previous period"
            }
          },
          {
            id: "art-2",
            type: "table",
            title: "Today's Top Products",
            description: "Products ranked by sales revenue on 2026-01-31",
            data: {
              columns: ["Product", "Category", "Units Sold", "Revenue (UZS)"],
              rows: [
                ["Apple Watch Series 9 45mm Midnight", "Smart Home & Gadgets", 3, "16 800 000 UZS"],
                ["Xiaomi Robot Vacuum S10+", "Smart Home & Gadgets", 3, "12 600 000 UZS"],
                ["Samsung Galaxy S24 256GB Gray", "Smartphones & Tablets", 1, "11 900 000 UZS"],
                ["Lenovo ThinkPad E14 Gen 5 i5/16GB", "Laptops & Computers", 1, "9 900 000 UZS"],
                ["Dell 27-inch 4K UHD Monitor S2722QC", "Laptops & Computers", 1, "5 100 000 UZS"]
              ]
            }
          }
        ]
      }
    ]
  },
  {
    id: "conv-2",
    title: "New Chat",
    created_at: "2026-01-30T15:00:00Z",
    messages: []
  },
  {
    id: "conv-3",
    title: "Yangi muloqot",
    created_at: "2026-01-29T11:20:00Z",
    messages: []
  },
  {
    id: "conv-4",
    title: "salom",
    created_at: "2026-01-28T09:10:00Z",
    messages: []
  },
  {
    id: "conv-5",
    title: "KHB Business Advisory Session",
    created_at: "2026-01-27T14:45:00Z",
    messages: []
  }
];
