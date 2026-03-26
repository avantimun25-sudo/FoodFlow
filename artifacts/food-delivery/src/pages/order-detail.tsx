import { useRoute, Link } from "wouter";
import { useGetMyOrder } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { formatMoney, getStatusColor } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { format } from "date-fns";
import { ChevronLeft, MapPin, Receipt, CheckCircle2, Clock, Truck, ChefHat } from "lucide-react";

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const id = parseInt(params?.id || "0");
  const { token } = useAuth();
  
  const { data: order, isLoading } = useGetMyOrder(id, {
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-32 px-4">
        <Navbar />
        <div className="max-w-3xl mx-auto animate-pulse space-y-6">
          <div className="h-8 w-32 bg-secondary rounded" />
          <div className="h-64 bg-card rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background pt-32 text-center">
        <Navbar />
        <h2 className="text-2xl font-bold">Order not found</h2>
        <Link href="/orders" className="text-primary hover:underline mt-4 inline-block">Back to orders</Link>
      </div>
    );
  }

  const stages = [
    { id: 'pending', label: 'Received', icon: Receipt },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { id: 'preparing', label: 'Preparing', icon: ChefHat },
    { id: 'out_for_delivery', label: 'On the way', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: MapPin },
  ];

  const currentStageIndex = stages.findIndex(s => s.id === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      
      <main className="pt-24 md:pt-32 max-w-3xl mx-auto px-4 sm:px-6">
        <Link href="/orders" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to orders
        </Link>

        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-border bg-gradient-to-br from-secondary/50 to-background">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-display font-extrabold text-foreground mb-1">Order #{order.id}</h1>
                <p className="text-muted-foreground font-medium">
                  {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider border text-center ${getStatusColor(order.status)}`}>
                {order.status.replace('_', ' ')}
              </div>
            </div>

            {/* Progress Tracker */}
            {!isCancelled && (
              <div className="mt-8 relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-border -translate-y-1/2 rounded-full" />
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.max(0, (currentStageIndex / (stages.length - 1)) * 100)}%` }}
                />
                
                <div className="relative flex justify-between">
                  {stages.map((stage, idx) => {
                    const isCompleted = idx <= currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    const Icon = stage.icon;
                    return (
                      <div key={stage.id} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 bg-card
                          ${isCompleted ? 'border-primary text-primary' : 'border-border text-muted-foreground'}
                          ${isCurrent ? 'ring-4 ring-primary/20 bg-primary/5' : ''}
                        `}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-xs font-bold hidden sm:block ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Restaurant */}
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Restaurant</h3>
              <p className="text-xl font-bold text-foreground">{order.restaurantName}</p>
            </div>

            {/* Delivery Details */}
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Delivery To</h3>
              <div className="bg-secondary/50 p-4 rounded-2xl flex items-start gap-3 border border-border">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{order.deliveryAddress}</p>
                  {order.notes && <p className="text-sm text-muted-foreground mt-1 italic">Note: "{order.notes}"</p>}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Order Summary</h3>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
                        {item.quantity}x
                      </span>
                      <span className="font-bold text-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold text-muted-foreground">{formatMoney(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t-2 border-dashed border-border flex justify-between items-center">
                <span className="text-xl font-bold text-foreground">Total Paid</span>
                <span className="text-3xl font-display font-extrabold text-primary">{formatMoney(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
