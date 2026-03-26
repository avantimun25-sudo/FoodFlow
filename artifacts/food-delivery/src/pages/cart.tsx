import { useState } from "react";
import { Link, useLocation } from "wouter";
import { usePlaceOrder } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { ChevronLeft, Plus, Minus, Trash2, MapPin, Loader2, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function Cart() {
  const { user, token } = useAuth();
  const { items, restaurantId, restaurantName, updateQuantity, clearCart, subtotal, totalItems } = useCart();
  const placeOrderMutation = usePlaceOrder();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [address, setAddress] = useState(user?.address || "");
  const [notes, setNotes] = useState("");

  const deliveryFee = 3.99;
  const taxes = subtotal * 0.08;
  const total = subtotal + deliveryFee + taxes;

  const handlePlaceOrder = () => {
    if (!address) {
      toast({ title: "Address required", description: "Please enter a delivery address", variant: "destructive" });
      return;
    }
    if (!restaurantId || items.length === 0) return;

    placeOrderMutation.mutate({
      data: {
        restaurantId,
        deliveryAddress: address,
        notes,
        items: items.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          name: i.name,
          price: i.price
        }))
      }
    }, {
      request: { headers: { Authorization: `Bearer ${token}` } },
      onSuccess: (data) => {
        clearCart();
        toast({ title: "Order Placed!", description: "Your food is on the way." });
        setLocation(`/orders/${data.id}`);
      },
      onError: (err: any) => {
        toast({ title: "Order Failed", description: err?.message || "Could not place order", variant: "destructive" });
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-24 max-w-lg mx-auto px-4 text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8">
            <img src={`${import.meta.env.BASE_URL}images/empty-cart.png`} alt="Empty Cart" className="w-64 h-64 mx-auto object-contain mix-blend-multiply" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">Your cart is empty</h2>
          <p className="text-muted-foreground text-lg mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link href="/" className="inline-flex items-center justify-center bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all">
            Browse Restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      
      <main className="pt-24 md:pt-32 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href={`/restaurant/${restaurantId}`} className="w-10 h-10 flex items-center justify-center bg-card border border-border rounded-full hover:bg-secondary transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="text-3xl font-display font-bold tracking-tight">Checkout</h1>
          </div>
          <button onClick={clearCart} className="text-destructive font-medium flex items-center gap-2 hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column - Items & Details */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Restaurant Info */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Order from</h2>
              <p className="text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-primary" /> {restaurantName}
              </p>
            </div>

            {/* Items List */}
            <div className="bg-card border border-border rounded-3xl p-2 sm:p-6 shadow-sm space-y-4">
              {items.map((item) => (
                <div key={item.menuItemId} className="flex items-center gap-4 p-4 hover:bg-secondary/50 rounded-2xl transition-colors">
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground text-lg">{item.name}</h4>
                    <p className="text-primary font-bold mt-1">{formatMoney(item.price)}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <p className="font-bold text-foreground">{formatMoney(item.price * item.quantity)}</p>
                    <div className="flex items-center gap-3 bg-background border border-border rounded-full p-1 shadow-sm">
                      <button 
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="px-4 py-3 bg-secondary/50 rounded-xl flex justify-between font-bold text-foreground">
                <span>Subtotal ({totalItems} items)</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Delivery Details
              </h3>
              
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Address</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Enter full delivery address"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Delivery Instructions <span className="text-muted-foreground font-normal">(Optional)</span></label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px] resize-none"
                  placeholder="E.g., Leave at the door, building gate code is 1234"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Checkout */}
          <div className="lg:col-span-5">
            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-lg sticky top-32">
              <h3 className="text-xl font-bold mb-6">Order Summary</h3>
              
              <div className="space-y-4 text-muted-foreground font-medium mb-6 pb-6 border-b border-border">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-foreground">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-foreground">{formatMoney(deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Taxes</span>
                  <span className="text-foreground">{formatMoney(taxes)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8">
                <span className="text-2xl font-bold text-foreground">Total</span>
                <span className="text-3xl font-display font-extrabold text-primary">{formatMoney(total)}</span>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={placeOrderMutation.isPending || !address}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {placeOrderMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Place Order"}
              </button>
              {!address && <p className="text-center text-sm text-destructive mt-3 font-medium">Please provide a delivery address</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
