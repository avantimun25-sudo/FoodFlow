import { Link } from "wouter";
import { useGetMyOrders } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { formatMoney, getStatusColor } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { format } from "date-fns";
import { ChevronRight, Receipt, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Orders() {
  const { token } = useAuth();
  const { data, isLoading } = useGetMyOrders({
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const orders = data?.data || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      
      <main className="pt-24 md:pt-32 max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl font-display font-extrabold text-foreground mb-8">My Orders</h1>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm">
            <img src={`${import.meta.env.BASE_URL}images/empty-orders.png`} alt="No orders" className="w-48 h-48 mx-auto object-contain mix-blend-multiply mb-6" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-8">When you place an order, it will appear here.</p>
            <Link href="/" className="inline-flex bg-primary text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-1 transition-transform">
              Start Ordering
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link href={`/orders/${order.id}`} className="block group">
                  <div className="bg-card border border-border hover:border-primary/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary shrink-0">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{order.restaurantName}</h3>
                        <p className="text-sm text-muted-foreground font-medium">
                          {format(new Date(order.createdAt), "MMM d, yyyy • h:mm a")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
                      <div className="text-left sm:text-right">
                        <div className={`inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-1 border ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </div>
                        <p className="font-bold text-foreground text-lg">{formatMoney(order.totalAmount)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
