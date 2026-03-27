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
        <h1 className="text-3xl font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground mt-1">People who ordered from your restaurant</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
        </div>
      ) : !data?.data.length ? (
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">No customers yet. Orders will show your customers here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.data.map((customer) => {
              const initials = (customer.name ?? "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
              return (
                <div
                  key={customer.id}
                  className="rounded-2xl border border-border bg-card p-5 transition-all hover:border-orange-500/20"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{customer.name}</p>
                      {customer.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {customer.email}
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {customer.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3 bg-orange-500/8">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs text-muted-foreground">Orders</span>
                      </div>
                      <p className="font-bold text-foreground">{Number(customer.ordersFromRestaurant)}</p>
                    </div>
                    <div className="rounded-xl p-3 bg-green-500/8">
                      <div className="flex items-center gap-1.5 mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs text-muted-foreground">Spent</span>
                      </div>
                      <p className="font-bold text-foreground">
                        ${Number(customer.spentAtRestaurant).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {customer.lastOrderAt && (
                    <p className="text-xs text-muted-foreground/60 mt-3">
                      Last order {format(new Date(customer.lastOrderAt), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {data.total > data.limit && (
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{data.total} total customers</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * data.limit >= data.total}
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
