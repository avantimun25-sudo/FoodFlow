import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCustomerLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useCustomerLogin();
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (data) => {
        login(data.customer, data.token);
        toast({ title: "Welcome back!", description: `Good to see you, ${data.customer.name}!` });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({ title: "Login Failed", description: err?.message || "Invalid email or password", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <ShoppingBag className="w-5 h-5 fill-white/20" />
            </div>
            <span className="font-display font-bold text-2xl">Food<span className="text-primary">Drop</span></span>
          </div>

          <h1 className="text-4xl font-display font-bold text-foreground mb-2 tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mb-8 text-lg">Enter your details to access your account.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                placeholder="you@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Password</label>
                <a href="#" className="text-sm text-primary font-medium hover:underline">Forgot password?</a>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loginMutation.isPending}
              className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="text-center mt-8 text-muted-foreground font-medium">
            Don't have an account? <Link href="/register" className="text-primary hover:underline font-bold">Sign up</Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block w-1/2 relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-orange-400/20 mix-blend-multiply" />
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-food.png`} 
          alt="Delicious food" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-16">
          <div className="text-white max-w-lg">
            <h2 className="text-4xl font-display font-bold mb-4 leading-tight">Your favorite meals, delivered fast.</h2>
            <p className="text-white/80 text-lg">Join thousands of foodies who get their cravings satisfied within minutes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
