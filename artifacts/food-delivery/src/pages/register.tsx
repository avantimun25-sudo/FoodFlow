import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCustomerRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2, ArrowRight } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const registerMutation = useCustomerRegister();
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast({ title: "Error", description: "Name, email, and password are required", variant: "destructive" });
      return;
    }

    registerMutation.mutate({ data: formData }, {
      onSuccess: (data) => {
        login(data.customer, data.token);
        toast({ title: "Account Created!", description: "Welcome to FoodDrop." });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({ title: "Registration Failed", description: err?.message || "Could not create account", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-background min-h-screen overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-8"
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <ShoppingBag className="w-5 h-5 fill-white/20" />
            </div>
            <span className="font-display font-bold text-2xl">Food<span className="text-primary">Drop</span></span>
          </div>

          <h1 className="text-4xl font-display font-bold text-foreground mb-2 tracking-tight">Create an account</h1>
          <p className="text-muted-foreground mb-8 text-lg">Start ordering your favorite food today.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="you@example.com"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Password</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Create a strong password"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Phone Number <span className="text-muted-foreground font-normal">(Optional)</span></label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="(555) 000-0000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Delivery Address <span className="text-muted-foreground font-normal">(Optional)</span></label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="123 Main St, Apt 4B"
              />
            </div>

            <button 
              type="submit" 
              disabled={registerMutation.isPending}
              className="w-full py-3.5 mt-6 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="text-center mt-8 text-muted-foreground font-medium">
            Already have an account? <Link href="/login" className="text-primary hover:underline font-bold">Sign in</Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block w-1/2 relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-primary/20 mix-blend-multiply" />
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-food.png`} 
          alt="Delicious food" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-16">
          <div className="text-white max-w-lg">
            <h2 className="text-4xl font-display font-bold mb-4 leading-tight">Discover new flavors in your city.</h2>
            <p className="text-white/80 text-lg">Hundreds of local restaurants are just a tap away.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
