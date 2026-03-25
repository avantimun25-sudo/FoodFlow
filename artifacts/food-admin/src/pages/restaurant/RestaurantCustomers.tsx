import { useState } from "react";
import { useListRestaurantCustomers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Users, Loader2, Mail, Phone, ShoppingBag, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function RestaurantCustomers() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListRestaurantCustomers({ page, limit: 20 });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white">Customers</h1>
        <p className="text-white/40 mt-1">People who ordered from your restaurant</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#f97316" }} />
        </div>
      ) : !data?.data.length ? (
        <div className="rounded-2xl border p-16 text-center" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <Users className="w-12 h-12 mx-auto mb-4 text-white/20" />
          <p className="text-white/40">No customers yet. Orders will show your customers here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.data.map((customer) => {
              const initials = (customer.name ?? "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
              return (
                <div
                  key={customer.id}
                  className="rounded-2xl border p-5 transition-all hover:border-orange-500/20"
                  style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{customer.name}</p>
                      {customer.email && (
                        <p className="text-xs text-white/40 flex items-center gap-1.5 mt-0.5 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {customer.email}
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-xs text-white/40 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {customer.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3" style={{ background: "rgba(249,115,22,0.08)" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <ShoppingBag className="w-3.5 h-3.5" style={{ color: "#f97316" }} />
                        <span className="text-xs text-white/40">Orders</span>
                      </div>
                      <p className="font-bold text-white">{Number(customer.ordersFromRestaurant)}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "rgba(34,197,94,0.08)" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs text-white/40">Spent</span>
                      </div>
                      <p className="font-bold text-white">
                        ${Number(customer.spentAtRestaurant).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {customer.lastOrderAt && (
                    <p className="text-xs text-white/25 mt-3">
                      Last order {format(new Date(customer.lastOrderAt), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {data.total > data.limit && (
            <div className="flex justify-between items-center text-sm text-white/40">
              <span>{data.total} total customers</span>
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
        </>
      )}
    </div>
  );
}
