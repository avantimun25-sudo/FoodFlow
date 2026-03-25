import { 
  useGetDashboardStats, 
  useGetRevenueTrend, 
  useGetOrderStatusDistribution, 
  useGetTopRestaurants, 
  useGetOrdersByHour 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Store, 
  TrendingUp,
  Activity,
  Car
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: revenueTrend, isLoading: trendLoading } = useGetRevenueTrend();
  const { data: orderStatus, isLoading: statusLoading } = useGetOrderStatusDistribution();
  const { data: topRestaurants, isLoading: topLoading } = useGetTopRestaurants();
  const { data: ordersByHour, isLoading: hourLoading } = useGetOrdersByHour();

  const COLORS = ['hsl(191 97% 55%)', 'hsl(250 84% 66%)', 'hsl(316 70% 50%)', 'hsl(35 90% 60%)', 'hsl(142 70% 45%)', 'hsl(215 20% 65%)'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Revenue", value: stats ? `$${stats.totalRevenue.toLocaleString()}` : "", icon: DollarSign, trend: stats?.revenueGrowth, color: "text-primary", bg: "bg-primary/10" },
          { title: "Total Orders", value: stats?.totalOrders.toLocaleString(), icon: ShoppingBag, trend: stats?.ordersGrowth, color: "text-secondary", bg: "bg-secondary/10" },
          { title: "Active Customers", value: stats?.totalCustomers.toLocaleString(), icon: Users, trend: stats?.customersGrowth, color: "text-chart-3", bg: "bg-chart-3/10" },
          { title: "Active Drivers", value: stats?.totalDrivers.toLocaleString(), icon: Car, trend: 0, color: "text-chart-4", bg: "bg-chart-4/10" },
        ].map((kpi, i) => (
          <Card key={i} className="glass-card border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 ${kpi.bg} rounded-full blur-[50px] -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700`} />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-2 bg-white/5" />
                  ) : (
                    <h3 className="text-3xl font-display font-bold mt-1 text-foreground">{kpi.value}</h3>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
              {!statsLoading && kpi.trend !== undefined && (
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className={`w-4 h-4 mr-1 ${kpi.trend >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                  <span className={kpi.trend >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                    {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                  </span>
                  <span className="text-muted-foreground ml-2">from last month</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Line Chart */}
        <Card className="glass-card lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Revenue Trend (30 Days)
            </CardTitle>
            <CardDescription>Daily revenue and order volume analysis</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[350px]">
            {trendLoading ? (
              <Skeleton className="w-full h-full bg-white/5 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(191 97% 55%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(191 97% 55%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(233 30% 15%)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(215 20% 65%)" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => format(new Date(val), 'MMM dd')}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="hsl(215 20% 65%)" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(233 47% 7%)', borderColor: 'hsl(233 30% 15%)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    labelFormatter={(val) => format(new Date(val), 'MMM dd, yyyy')}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(191 97% 55%)" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: "hsl(191 97% 55%)", stroke: "#000", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Order Status Pie */}
        <Card className="glass-card flex flex-col">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current distribution of active orders</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[350px] flex items-center justify-center">
            {statusLoading ? (
              <Skeleton className="w-64 h-64 rounded-full bg-white/5" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                    stroke="none"
                  >
                    {orderStatus?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(233 47% 7%)', borderColor: 'hsl(233 30% 15%)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Restaurants */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-secondary" />
              Top Restaurants
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {topLoading ? (
              <Skeleton className="w-full h-full bg-white/5 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRestaurants} layout="vertical" margin={{ left: 40, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(233 30% 15%)" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="hsl(215 20% 65%)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="hsl(215 20% 65%)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'hsl(233 30% 15%)', opacity: 0.4}}
                    contentStyle={{ backgroundColor: 'hsl(233 47% 7%)', borderColor: 'hsl(233 30% 15%)', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(250 84% 66%)" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders by Hour */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Orders by Hour</CardTitle>
            <CardDescription>Peak ordering times throughout the day</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {hourLoading ? (
              <Skeleton className="w-full h-full bg-white/5 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(233 30% 15%)" vertical={false} />
                  <XAxis 
                    dataKey="hour" 
                    stroke="hsl(215 20% 65%)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${val}:00`}
                  />
                  <YAxis stroke="hsl(215 20% 65%)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'hsl(233 30% 15%)', opacity: 0.4}}
                    contentStyle={{ backgroundColor: 'hsl(233 47% 7%)', borderColor: 'hsl(233 30% 15%)', borderRadius: '12px', color: '#fff' }}
                    labelFormatter={(val) => `${val}:00 - ${Number(val)+1}:00`}
                  />
                  <Bar dataKey="orders" fill="hsl(191 97% 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
