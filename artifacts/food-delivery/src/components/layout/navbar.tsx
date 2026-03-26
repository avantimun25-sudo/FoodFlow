import { Link, useLocation } from "wouter";
import { ShoppingBag, User, LogOut, Menu, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
          scrolled 
            ? "bg-background/80 backdrop-blur-lg border-border/50 shadow-sm py-3" 
            : "bg-background border-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5 fill-white/20" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-foreground">
              Food<span className="text-primary">Drop</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full border border-secondary">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="truncate max-w-[200px]">{user?.address || "Add delivery address"}</span>
              </div>
              
              <Link href="/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                My Orders
              </Link>
              
              <Link href="/cart" className="relative group">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-destructive text-white text-[10px] font-bold rounded-full shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>

              <div className="h-8 w-px bg-border mx-2" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                </div>
                <button onClick={handleLogout} className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          {isAuthenticated && (
            <button 
              className="md:hidden w-10 h-10 flex items-center justify-center bg-secondary rounded-full text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 px-6 md:hidden flex flex-col gap-6"
          >
            <div className="flex items-center gap-4 pb-6 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-lg text-foreground">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-lg font-medium">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors">
                <ShoppingBag className="w-5 h-5 text-primary" /> Browse Restaurants
              </Link>
              <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary transition-colors">
                <span className="flex items-center gap-3"><ShoppingBag className="w-5 h-5 text-primary" /> My Cart</span>
                {totalItems > 0 && <span className="bg-primary text-white text-sm px-3 py-1 rounded-full">{totalItems} items</span>}
              </Link>
              <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors">
                <User className="w-5 h-5 text-primary" /> Order History
              </Link>
            </div>

            <div className="mt-auto pb-8">
              <button 
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-destructive/10 text-destructive font-bold hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
