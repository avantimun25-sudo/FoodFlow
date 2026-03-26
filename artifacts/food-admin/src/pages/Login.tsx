import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useCustomerLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { UtensilsCrossed, Loader2, ArrowRight, ChefHat } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { mutate: doAdminLogin, isPending: isAdminPending } = useLogin();
  const { mutate: doCustomerLogin, isPending: isCustomerPending } = useCustomerLogin();

  const isPending = isAdminPending || isCustomerPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    doAdminLogin(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          if (data.user.role === "admin") {
            navigate("/");
          } else {
            navigate("/restaurant/dashboard");
          }
        },
        onError: () => {
          doCustomerLogin(
            { data: { email, password } },
            {
              onSuccess: (data) => {
                localStorage.setItem("delivery_token", data.token);
                localStorage.setItem("delivery_customer", JSON.stringify(data.customer));
                window.location.href = "/delivery/";
              },
              onError: () => {
                setError("Invalid email or password.");
              },
            }
          );
        },
      }
    );
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
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-2xl">
              Food<span className="text-primary">Admin</span>
            </span>
          </div>

          <h1 className="text-4xl font-display font-bold text-foreground mb-2 tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Enter your details to access your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border space-y-3">
            <p className="text-sm text-muted-foreground text-center font-medium">
              New to the platform?
            </p>
            <button
              onClick={() => navigate("/register")}
              className="w-full py-3 rounded-xl border border-border bg-transparent hover:bg-muted text-foreground font-semibold transition-all flex items-center justify-center gap-2"
            >
              <ChefHat className="w-4 h-4" />
              Register Your Restaurant
            </button>
            <button
              onClick={() => { window.location.href = "/delivery/register"; }}
              className="w-full py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-medium transition-all"
            >
              New customer? Create an account
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Admin: admin@foodadmin.com / admin123
          </p>
        </motion.div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block w-1/2 relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-orange-400/20 mix-blend-multiply" />
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt="Food delivery platform"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-16">
          <div className="text-white max-w-lg">
            <h2 className="text-4xl font-display font-bold mb-4 leading-tight">
              Manage your food empire, all in one place.
            </h2>
            <p className="text-white/80 text-lg">
              Oversee restaurants, drivers, orders, and customers from your powerful admin dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
