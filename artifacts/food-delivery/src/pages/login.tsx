import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin, useCustomerLogin, useSubmitRestaurantRequest } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Loader2, ArrowRight, ChefHat,
  MapPin, Phone, Mail, User, CheckCircle2, UtensilsCrossed,
} from "lucide-react";

type View = "login" | "register";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [view, setView] = useState<View>("login");
  const [registerSubmitted, setRegisterSubmitted] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const { mutate: doAdminLogin, isPending: isAdminPending } = useLogin();
  const { mutate: doCustomerLogin, isPending: isCustomerPending } = useCustomerLogin();
  const { mutate: submitRestaurant, isPending: isRegisterPending } = useSubmitRestaurantRequest();
  const isLoginPending = isAdminPending || isCustomerPending;

  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    doAdminLogin(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          localStorage.setItem("auth_token", data.token);
          localStorage.setItem("auth_user", JSON.stringify(data.user));
          toast({ title: "Welcome back!", description: `Signed in as ${data.user.role}.` });
          window.location.href = data.user.role === "admin" ? "/" : "/restaurant/dashboard";
        },
        onError: () => {
          doCustomerLogin(
            { data: { email, password } },
            {
              onSuccess: (data) => {
                login(data.customer, data.token);
                toast({ title: "Welcome back!", description: `Good to see you, ${data.customer.name}!` });
                setLocation("/");
              },
              onError: () => setLoginError("Invalid email or password."),
            }
          );
        },
      }
    );
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError("");
    const fd = new FormData(e.currentTarget);
    submitRestaurant(
      {
        data: {
          name: fd.get("name") as string,
          cuisine: fd.get("cuisine") as string,
          address: fd.get("address") as string,
          phone: fd.get("phone") as string,
          email: fd.get("email") as string,
          description: fd.get("description") as string,
          ownerName: fd.get("ownerName") as string,
          password: fd.get("password") as string,
        },
      },
      {
        onSuccess: () => setRegisterSubmitted(true),
        onError: (err: any) =>
          setRegisterError(err?.data?.error || "Failed to submit. Please try again."),
      }
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-start justify-center overflow-y-auto bg-background">
        <div className="w-full max-w-md px-8 sm:px-12 py-12">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <ShoppingBag className="w-5 h-5 fill-white/20" />
            </div>
            <span className="font-display font-bold text-2xl">Food<span className="text-primary">Drop</span></span>
          </div>

          {/* Tab toggle */}
          <div className="flex gap-1 mb-8 bg-muted rounded-xl p-1">
            <button
              onClick={() => { setView("login"); setLoginError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                view === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setView("register"); setRegisterError(""); setRegisterSubmitted(false); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                view === "register"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register Restaurant
            </button>
          </div>

          <AnimatePresence mode="wait">
            {view === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className="text-4xl font-display font-bold text-foreground mb-2 tracking-tight">Welcome back</h1>
                <p className="text-muted-foreground mb-8 text-lg">Enter your details to access your account.</p>

                <form onSubmit={handleLogin} className="space-y-5">
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
                      required
                    />
                  </div>

                  {loginError && (
                    <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                      {loginError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoginPending}
                    className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isLoginPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>

                <p className="text-center mt-8 text-muted-foreground font-medium">
                  Don't have an account? <Link href="/register" className="text-primary hover:underline font-bold">Sign up</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                {registerSubmitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-foreground mb-3">Request Submitted!</h2>
                    <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                      Your restaurant registration is under review. Our team will get back to you within 24–48 hours. Once approved, you can sign in with your email and password.
                    </p>
                    <button
                      onClick={() => { setView("login"); setRegisterSubmitted(false); }}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-semibold text-sm shadow-md"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-display font-bold text-foreground mb-1 tracking-tight">Register Your Restaurant</h1>
                    <p className="text-muted-foreground mb-7">Join FoodDrop's delivery network.</p>

                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Restaurant Details</label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                              <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground" /> Name *
                            </label>
                            <input
                              name="name"
                              required
                              placeholder="The Golden Fork"
                              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-foreground mb-1.5 block">Cuisine *</label>
                            <input
                              name="cuisine"
                              required
                              placeholder="Italian, Japanese…"
                              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Address *
                        </label>
                        <input
                          name="address"
                          required
                          placeholder="Full street address"
                          className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Description</label>
                        <textarea
                          name="description"
                          rows={2}
                          placeholder="Tell us about your restaurant…"
                          className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                        />
                      </div>

                      <div className="pt-1 space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact & Account</label>
                        <div>
                          <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" /> Owner Name *
                          </label>
                          <input
                            name="ownerName"
                            required
                            placeholder="Your full name"
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone
                            </label>
                            <input
                              name="phone"
                              type="tel"
                              placeholder="+1 555 000 0000"
                              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email *
                            </label>
                            <input
                              name="email"
                              type="email"
                              required
                              placeholder="you@restaurant.com"
                              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-foreground mb-1.5 block">Password *</label>
                          <input
                            name="password"
                            type="password"
                            required
                            placeholder="Choose a secure password"
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Used to log into your restaurant portal once approved.</p>
                        </div>
                      </div>

                      {registerError && (
                        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                          {registerError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isRegisterPending}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                      >
                        {isRegisterPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <><ChefHat className="w-4 h-4" /> Submit Registration</>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block w-1/2 relative bg-secondary overflow-hidden sticky top-0 h-screen">
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
