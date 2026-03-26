import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRestaurantOrders,
  useUpdateRestaurantOrderStatus,
  getListRestaurantOrdersQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag, Clock, CheckCircle2, XCircle, Loader2,
  Truck, ChefHat, ArrowRight, Ban,
} from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:          { label: "Pending",          color: "#eab308", bg: "rgba(234,179,8,0.12)",   icon: Clock },
  confirmed:        { label: "Confirmed",         color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  icon: CheckCircle2 },
  preparing:        { label: "Preparing",         color: "#f97316", bg: "rgba(249,115,22,0.12)",  icon: ChefHat },
  out_for_delivery: { label: "Out for Delivery",  color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: Truck },
  delivered:        { label: "Delivered",         color: "#22c55e", bg: "rgba(34,197,94,0.12)",  icon: CheckCircle2 },
  cancelled:        { label: "Cancelled",         color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: XCircle },
};

const NEXT_STATUS: Record<string, { status: string; label: string } | null> = {
  pending:          { status: "confirmed",        label: "Confirm Order" },
  confirmed:        { status: "preparing",        label: "Start Preparing" },
  preparing:        { status: "out_for_delivery", label: "Out for Delivery" },
  out_for_delivery: { status: "delivered",        label: "Mark Delivered" },
  delivered:        null,
  cancelled:        null,
};

const CANCELLABLE = new Set(["pending", "confirmed"]);

const FILTERS = ["all", "pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

export default function RestaurantOrders() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListRestaurantOrders(
    { status: statusFilter !== "all" ? statusFilter : undefined, page, limit: 15 },
    { query: { enabled: true } }
  );

  const { mutate: updateStatus } = useUpdateRestaurantOrderStatus();

  const handleStatusChange = (orderId: number, newStatus: string, label: string) => {
    setLoadingId(orderId);
    updateStatus(
      { id: orderId, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast({ title: `Order #${orderId} updated`, description: `Status: ${label}` });
          queryClient.invalidateQueries({ queryKey: getListRestaurantOrdersQueryKey() });
          setLoadingId(null);
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err?.data?.error || "Failed to update status.", variant: "destructive" });
          setLoadingId(null);
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white">Orders</h1>
        <p className="text-white/40 mt-1">Manage and update incoming orders</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setStatusFilter(f); setPage(1); }}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize"
            style={statusFilter === f ? {
              background: "rgba(249,115,22,0.2)",
              color: "#f97316",
              border: "1px solid rgba(249,115,22,0.3)",
            } : {
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {f === "out_for_delivery" ? "Out for Delivery" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#f97316" }} />
        </div>
      ) : !data?.data.length ? (
        <div
          className="rounded-2xl border p-16 text-center"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-white/20" />
          <p className="text-white/40">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.data.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            const next = NEXT_STATUS[order.status];
            const canCancel = CANCELLABLE.has(order.status);
            const isUpdating = loadingId === order.id;

            return (
              <div
                key={order.id}
                className="rounded-2xl border p-5 flex flex-col gap-4 transition-all"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-white">#{order.id}</span>
                      <span className="text-sm text-white/50">{order.customerName || "Customer"}</span>
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    {order.deliveryAddress && (
                      <p className="text-sm text-white/40 truncate">{order.deliveryAddress}</p>
                    )}
                    {order.notes && (
                      <p className="text-xs text-white/30 mt-1 italic">"{order.notes}"</p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold" style={{ color: "#f97316" }}>
                      ${Number(order.totalAmount).toFixed(2)}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {format(new Date(order.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>

                {(next || canCancel) && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                    {next && (
                      <button
                        onClick={() => handleStatusChange(order.id, next.status, next.label)}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                        style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" />
                        )}
                        {next.label}
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => handleStatusChange(order.id, "cancelled", "Cancelled")}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {data && data.total > data.limit && (
        <div className="flex justify-between items-center text-sm text-white/40">
          <span>{data.total} total orders</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-transparent text-white/60 border-white/10 hover:bg-white/5"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * data.limit >= data.total}
              className="bg-transparent text-white/60 border-white/10 hover:bg-white/5"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
