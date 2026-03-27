import { useGetRestaurantDashboard, useGetRestaurantRevenueTrend } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, ShoppingBag, Users, UtensilsCrossed, TrendingUp, TrendingDown,
  Activity, Star, Clock,
} from "lucide-react";
import { format } from "date-fns";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  growth,
  color = "orange",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  growth?: number;
  color?: string;
}) {
  const colors: Record<string, { bg: string; icon: string }> = {
    orange: { bg: "rgba(249,115,22,0.12)", icon: "#f97316" },
    red:    { bg: "rgba(239,68,68,0.12)",  icon: "#ef4444" },
    blue:   { bg: "rgba(59,130,246,0.12)", icon: "#3b82f6" },
    green:  { bg: "rgba(34,197,94,0.12)",  icon: "#22c55e" },
    purple: { bg: "rgba(168,85,247,0.12)", icon: "#a855f7" },
    yellow: { bg: "rgba(234,179,8,0.12)",  icon: "#eab308" },
  };
  const c = colors[color] ?? colors.orange;

  return (
    <Card className="relative overflow-hidden border-border bg-card">
      <div className="absolute inset-0 border rounded-xl border-orange-500/8" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: c.bg }}>
            <Icon className="w-5 h-5" style={{ color: c.icon }} />
          </div>
          {growth !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${growth >= 0 ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"}`}>
              {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(growth).toFixed(1)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs mt-1" style={{ color: c.icon }}>{sub}</p>}
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-orange-500 font-bold">${Number(payload[0]?.value ?? 0).toFixed(2)}</p>
      {payload[1] && <p className="text-muted-foreground text-xs">{payload[1].value} orders</p>}
    </div>
  );
};

export default function RestaurantDashboard() {
  const { data: stats, isLoading } = useGetRestaurantDashboard();
  const { data: trend } = useGetRestaurantRevenueTrend();

  const chartData = (trend ?? []).map((r) => ({
    date: format(new Date(r.date), "MMM d"),
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your restaurant at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`$${Number(stats?.totalRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          growth={stats?.revenueGrowth}
          color="orange"
          sub="All time"
        />
        <StatCard
          label="Total Orders"
          value={Number(stats?.totalOrders ?? 0).toLocaleString()}
          icon={ShoppingBag}
          growth={stats?.ordersGrowth}
          color="blue"
          sub="All time"
        />
        <StatCard
          label="Customers"
          value={Number(stats?.totalCustomers ?? 0).toLocaleString()}
          icon={Users}
          color="purple"
          sub="Unique customers"
        />
        <StatCard
          label="Menu Items"
          value={Number(stats?.totalMenuItems ?? 0).toLocaleString()}
          icon={UtensilsCrossed}
          color="green"
          sub="Active offerings"
        />
        <StatCard
          label="Active Orders"
          value={Number(stats?.activeOrders ?? 0).toLocaleString()}
          icon={Activity}
          color="red"
          sub="In progress"
        />
        <StatCard
          label="Avg Order Value"
          value={`$${Number(stats?.avgOrderValue ?? 0).toFixed(2)}`}
          icon={DollarSign}
          color="yellow"
          sub="Last 30 days"
        />
        {stats?.rating != null && (
          <StatCard
            label="Rating"
            value={Number(stats.rating).toFixed(1)}
            icon={Star}
            color="yellow"
            sub="Customer rating"
          />
        )}
      </div>

      <div className="rounded-2xl border border-orange-500/10 bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-foreground text-lg">Revenue Trend</h3>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500">
            <Clock className="w-3.5 h-3.5" />
            Daily
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No revenue data yet. Start receiving orders!
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#f97316", stroke: "rgba(249,115,22,0.3)", strokeWidth: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
