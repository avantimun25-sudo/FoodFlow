import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useCustomerLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UtensilsCrossed, Loader2, ChefHat } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState("");

  const { mutate: doAdminLogin, isPending: isAdminPending } = useLogin();
  const { mutate: doCustomerLogin, isPending: isCustomerPending } = useCustomerLogin();

  const isPending = isAdminPending || isCustomerPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

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
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md px-4 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary/30">
            <UtensilsCrossed className="w-8 h-8 text-background" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Food<span className="text-primary">Admin</span>
          </h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="bg-background/60 border-white/10 h-11 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-background/60 border-white/10 h-11 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-semibold"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
            <p className="text-sm text-muted-foreground text-center">New to the platform?</p>
            <Button
              variant="outline"
              className="w-full bg-transparent border-white/10 hover:bg-white/5 text-foreground"
              onClick={() => navigate("/register")}
            >
              <ChefHat className="w-4 h-4 mr-2" />
              Register Your Restaurant
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm"
              onClick={() => { window.location.href = "/delivery/register"; }}
            >
              New customer? Create an account
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin: admin@foodadmin.com / admin123
        </p>
      </div>
    </div>
  );
}
