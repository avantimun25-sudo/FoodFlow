import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useGetDeliveryRestaurantMenu } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart, CartItem } from "@/hooks/use-cart";
import { getCuisineEmoji, formatMoney } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { Star, MapPin, ChevronLeft, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function RestaurantDetail() {
  const [, params] = useRoute("/restaurant/:id");
  const id = parseInt(params?.id || "0");
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const { items, addItem, updateQuantity, removeItem, totalItems, subtotal } = useCart();

  const { data, isLoading } = useGetDeliveryRestaurantMenu(id, {
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 animate-pulse">
          <div className="h-64 bg-secondary rounded-3xl mb-8" />
          <div className="h-10 bg-secondary w-1/3 rounded-xl mb-6" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card border border-border rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background pt-32 flex flex-col items-center justify-center">
        <Navbar />
        <h2 className="text-2xl font-bold mb-4">Restaurant not found</h2>
        <Link href="/" className="text-primary font-bold hover:underline flex items-center gap-2">
          <ChevronLeft className="w-5 h-5" /> Back to restaurants
        </Link>
      </div>
    );
  }

  const { restaurant, items: menuItems } = data;

  // Group items by category
  const groupedMenu = menuItems.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <div className="min-h-screen bg-background pb-32">
      <Navbar />
      
      <main className="pt-24 md:pt-32 max-w-5xl mx-auto px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>

        {/* Hero */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden mb-12 shadow-sm relative">
          <div className="h-48 md:h-64 bg-gradient-to-r from-primary/80 to-accent/80 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
            <span className="text-8xl md:text-9xl relative z-10 opacity-80 drop-shadow-md transform scale-150 translate-y-10">{getCuisineEmoji(restaurant.cuisine)}</span>
          </div>
          <div className="p-6 md:p-8 relative z-20 bg-card">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold tracking-wide uppercase">
                    {restaurant.cuisine}
                  </span>
                  {!restaurant.isActive && (
                    <span className="bg-destructive/10 text-destructive px-3 py-1 rounded-lg text-sm font-bold">Closed</span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-display font-extrabold text-foreground tracking-tight mb-3">
                  {restaurant.name}
                </h1>
                <p className="text-muted-foreground flex items-center gap-2 font-medium">
                  <MapPin className="w-4 h-4" /> {restaurant.address}
                </p>
              </div>
              
              <div className="flex items-center gap-4 bg-secondary/50 p-4 rounded-2xl border border-border">
                <div className="text-center px-4 border-r border-border">
                  <div className="flex items-center justify-center gap-1 text-green-600 font-bold text-xl">
                    <Star className="w-5 h-5 fill-current" /> {restaurant.rating || "New"}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase font-bold mt-1">Rating</div>
                </div>
                <div className="text-center px-4">
                  <div className="font-bold text-xl text-foreground">{restaurant.totalOrders}+</div>
                  <div className="text-xs text-muted-foreground uppercase font-bold mt-1">Orders</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-12">
          {Object.entries(groupedMenu).map(([category, items]) => (
            <section key={category} className="scroll-mt-32">
              <h2 className="text-2xl font-display font-bold text-foreground mb-6 pb-2 border-b-2 border-secondary inline-block">
                {category}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {items.map(item => {
                  const cartItem = useCart().items.find(i => i.menuItemId === item.id);
                  const quantity = cartItem?.quantity || 0;

                  return (
                    <div key={item.id} className={`bg-card rounded-2xl p-5 border transition-all ${quantity > 0 ? 'border-primary shadow-md shadow-primary/5' : 'border-border/60 hover:border-border hover:shadow-sm'}`}>
                      <div className="flex justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-foreground leading-tight mb-1">{item.name}</h3>
                          <p className="text-primary font-bold mb-2">{formatMoney(item.price)}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                        {item.imageUrl && (
                          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        {!item.isAvailable ? (
                          <span className="text-sm text-destructive font-semibold">Sold out</span>
                        ) : quantity > 0 ? (
                          <div className="flex items-center gap-3 bg-secondary rounded-full p-1 border border-border">
                            <button 
                              onClick={() => updateQuantity(item.id, quantity - 1)}
                              className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-foreground hover:bg-destructive hover:text-white transition-colors shadow-sm"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center font-bold">{quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, quantity + 1)}
                              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-sm hover:bg-primary/90"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItem({ menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl }, restaurant.id, restaurant.name)}
                            disabled={!restaurant.isActive}
                            className="bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold px-5 py-2 rounded-full transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" /> Add to order
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Floating Cart Bar */}
      {totalItems > 0 && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 inset-x-0 p-4 z-40"
        >
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => setLocation("/cart")}
              className="w-full bg-foreground text-background p-4 rounded-2xl shadow-2xl flex items-center justify-between hover:bg-foreground/90 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-background/20 text-background w-10 h-10 flex items-center justify-center rounded-full font-bold">
                  {totalItems}
                </div>
                <span className="font-bold text-lg hidden sm:inline">View order</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-lg">{formatMoney(subtotal)}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
