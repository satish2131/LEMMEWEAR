"use client";
import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, Palette, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/context/AdminAuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Metrics {
  revenue: { value: number; change: string };
  orders: { value: number; change: string };
  customers: { value: number; change: string };
  designs: { value: number; change: string };
}

interface RevenueDay {
  date: string;
  revenue: number;
}

interface CategoryData {
  name: string;
  value: number;
  fill: string;
}

interface RecentOrder {
  orderNumber: string;
  shipping: { fullName: string; email: string };
  createdAt: string;
  total: number;
  status: string;
}

// ─── Demo fallbacks (shown when DB has no data yet) ───────────────────────────

const DEMO_METRICS: Metrics = {
  revenue: { value: 1284500, change: "+14.2%" },
  orders: { value: 1247, change: "+8.1%" },
  customers: { value: 8491, change: "+5.7%" },
  designs: { value: 342, change: "+23.5%" },
};

const DEMO_REVENUE: RevenueDay[] = [
  { date: "Apr 7", revenue: 4200 },
  { date: "Apr 9", revenue: 5800 },
  { date: "Apr 11", revenue: 4900 },
  { date: "Apr 13", revenue: 7200 },
  { date: "Apr 15", revenue: 6100 },
  { date: "Apr 17", revenue: 8400 },
  { date: "Apr 19", revenue: 7600 },
  { date: "Apr 21", revenue: 9100 },
  { date: "Apr 23", revenue: 8200 },
  { date: "Apr 25", revenue: 10500 },
  { date: "Apr 27", revenue: 9800 },
  { date: "Apr 29", revenue: 11200 },
  { date: "May 1", revenue: 10100 },
  { date: "May 3", revenue: 12400 },
  { date: "May 5", revenue: 11800 },
];

const DEMO_CATEGORIES: CategoryData[] = [
  { name: "Men", value: 42, fill: "hsl(270,70%,55%)" },
  { name: "Women", value: 31, fill: "hsl(300,65%,55%)" },
  { name: "Unisex", value: 18, fill: "hsl(152,60%,42%)" },
  { name: "Accessories", value: 9, fill: "hsl(38,92%,50%)" },
];

const statusColor: Record<string, string> = {
  delivered: "bg-green-500/15 text-green-600 border-green-500/20",
  shipped: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  processing: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
  confirmed: "bg-purple-500/15 text-purple-600 border-purple-500/20",
  cancelled: "bg-red-500/15 text-red-600 border-red-500/20",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { admin } = useAdminAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [revenueByDay, setRevenueByDay] = useState<RevenueDay[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/orders?limit=5"),
        ]);

        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          if (statsJson.success && statsJson.data) {
            const { metrics: m, revenueByDay: r, categoryData: c } = statsJson.data;
            // Always use real API data — never fall back to demo
            setMetrics(m);
            setIsDemo(false);
            if (r && r.length > 0) setRevenueByDay(r);
            if (c && c.length > 0) setCategoryData(c);
          } else {
            // API returned but no data — show demo
            setMetrics(DEMO_METRICS);
            setRevenueByDay(DEMO_REVENUE);
            setCategoryData(DEMO_CATEGORIES);
            setIsDemo(true);
          }
        } else {
          setMetrics(DEMO_METRICS);
          setRevenueByDay(DEMO_REVENUE);
          setCategoryData(DEMO_CATEGORIES);
          setIsDemo(true);
        }

        if (ordersRes.ok) {
          const ordersJson = await ordersRes.json();
          if (ordersJson.success) setRecentOrders(ordersJson.data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setMetrics(DEMO_METRICS);
        setRevenueByDay(DEMO_REVENUE);
        setCategoryData(DEMO_CATEGORIES);
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const metricCards = metrics ? [
    {
      title: "Total Revenue",
      value: `₹${metrics.revenue.value.toLocaleString("en-IN")}`,
      change: metrics.revenue.change,
      icon: DollarSign,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
    },
    {
      title: "Total Orders",
      value: metrics.orders.value.toLocaleString("en-IN"),
      change: metrics.orders.change,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      title: "Active Designs",
      value: metrics.designs.value.toLocaleString("en-IN"),
      change: metrics.designs.change,
      icon: Palette,
      color: "text-pink-600",
      bg: "bg-pink-500/10",
    },
    {
      title: "Total Customers",
      value: metrics.customers.value.toLocaleString("en-IN"),
      change: metrics.customers.change,
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
  ] : [];

  // Show demo only when API completely fails (isDemo=true)
  // When API succeeds with real 0 values, show 0 — not demo

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-xl">
              <CardContent className="p-5">
                <div className="h-16 bg-muted animate-pulse rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {admin?.name || "Admin"}
          {isDemo && (
            <span className="ml-2 text-xs text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-full">
              Demo data — add real orders to see live stats
            </span>
          )}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m, i) => (
          <Card
            key={m.title}
            className="rounded-xl border-border/60"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.bg}`}>
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  {m.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold tracking-tight">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="rounded-xl lg:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardHeader>
          <CardContent className="pb-4">
            <RevenueChart data={revenueByDay} />
          </CardContent>
        </Card>

        {/* Category Chart */}
        <Card className="rounded-xl border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart data={categoryData} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="rounded-xl border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-10 text-center">
              <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Order ID</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Date</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                    <th className="pb-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr
                      key={o.orderNumber}
                      className="border-b last:border-0 transition-colors hover:bg-muted/30"
                    >
                      <td className="py-3 font-medium text-xs">{o.orderNumber}</td>
                      <td className="py-3">{o.shipping.fullName}</td>
                      <td className="py-3 hidden sm:table-cell text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 text-right font-medium">
                        ₹{o.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 text-right">
                        <Badge
                          variant="outline"
                          className={`text-[11px] ${statusColor[o.status] || ""}`}
                        >
                          {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Pure SVG Revenue Area Chart ──────────────────────────────────────────────

function RevenueChart({ data }: { data: RevenueDay[] }) {
  const W = 560;
  const H = 220;
  const PAD = { top: 12, right: 12, bottom: 36, left: 48 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.revenue), 1);

  const xS = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * cW;
  const yS = (v: number) => PAD.top + cH - (v / maxVal) * cH;

  // Smooth curve using cubic bezier
  const smooth = data
    .map((d, i) => {
      if (i === 0) return `M${xS(0)},${yS(d.revenue)}`;
      const prev = data[i - 1];
      const cpX = (xS(i - 1) + xS(i)) / 2;
      return `C${cpX},${yS(prev.revenue)} ${cpX},${yS(d.revenue)} ${xS(i)},${yS(d.revenue)}`;
    })
    .join(" ");

  const area =
    smooth +
    ` L${xS(data.length - 1)},${PAD.top + cH} L${xS(0)},${PAD.top + cH} Z`;

  // Y ticks: 4 evenly spaced
  const yTicks = [0, 0.33, 0.66, 1].map((t) => ({
    val: Math.round(t * maxVal),
    y: PAD.top + cH - t * cH,
  }));

  // X labels: ~6 evenly spaced
  const step = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i % step === 0 || i === data.length - 1);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 220 }}
        aria-label="Revenue overview chart"
      >
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(270,70%,55%)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(270,70%,55%)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map((t) => (
          <line
            key={t.val}
            x1={PAD.left}
            x2={PAD.left + cW}
            y1={t.y}
            y2={t.y}
            stroke="currentColor"
            strokeOpacity="0.07"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Area */}
        <path d={area} fill="url(#revFill)" />

        {/* Line */}
        <path
          d={smooth}
          fill="none"
          stroke="hsl(270,70%,55%)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Y-axis labels */}
        {yTicks.map((t) => (
          <text
            key={t.val}
            x={PAD.left - 8}
            y={t.y + 4}
            textAnchor="end"
            fontSize="10"
            fill="currentColor"
            opacity="0.45"
          >
            ₹{t.val >= 1000 ? `${(t.val / 1000).toFixed(0)}k` : t.val}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ d, i }) => (
          <text
            key={i}
            x={xS(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="currentColor"
            opacity="0.45"
          >
            {d.date}
          </text>
        ))}

        {/* Hover dots */}
        {data.map((d, i) => (
          <circle key={i} cx={xS(i)} cy={yS(d.revenue)} r="3.5" fill="hsl(270,70%,55%)">
            <title>
              {d.date}: ₹{d.revenue.toLocaleString("en-IN")}
            </title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

// ─── Pure SVG Donut Chart ─────────────────────────────────────────────────────

function CategoryChart({ data }: { data: CategoryData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 90;
  const cy = 90;
  const R = 70;
  const r = 46;

  let angle = -Math.PI / 2;

  const slices = data.map((d) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const a0 = angle;
    angle += sweep;
    const a1 = angle;

    const large = sweep > Math.PI ? 1 : 0;
    const path = [
      `M ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)}`,
      `A ${R} ${R} 0 ${large} 1 ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)}`,
      `L ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`,
      `A ${r} ${r} 0 ${large} 0 ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)}`,
      "Z",
    ].join(" ");

    return { ...d, path, pct: Math.round((d.value / total) * 100) };
  });

  return (
    <div className="flex flex-col items-center gap-5">
      <svg
        viewBox="0 0 180 180"
        className="w-44 h-44"
        aria-label="Sales by category"
      >
        {slices.map((s) => (
          <path
            key={s.name}
            d={s.path}
            fill={s.fill}
            stroke="hsl(var(--card))"
            strokeWidth="2"
          >
            <title>
              {s.name}: {s.pct}%
            </title>
          </path>
        ))}
      </svg>

      {/* Legend */}
      <div className="w-full grid grid-cols-2 gap-x-4 gap-y-2">
        {slices.map((s) => (
          <div key={s.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: s.fill }}
            />
            <span className="text-muted-foreground">{s.name}</span>
            <span className="ml-auto font-medium">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
