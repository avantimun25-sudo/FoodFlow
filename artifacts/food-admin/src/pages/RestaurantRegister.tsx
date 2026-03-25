import { useState } from "react";
import { useLocation } from "wouter";
import { useSubmitRestaurantRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UtensilsCrossed, ArrowLeft, Loader2, CheckCircle2, ChefHat, MapPin, Phone, Mail, User } from "lucide-react";

export default function RestaurantRegister() {
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const { mutate: submit, isPending } = useSubmitRestaurantRequest();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);

    submit(
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
        onSuccess: () => setSubmitted(true),
        onError: (err: any) => {
          setError(err?.data?.error || "Failed to submit. Please try again.");
        },
      }
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="w-full max-w-md px-4 relative z-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Request Submitted!</h2>
          <p className="text-muted-foreground mb-8">
            Your restaurant registration is under review. Our team will get back to you within 24–48 hours. Once approved, you can sign in with your email and password.
          </p>
          <Button onClick={() => navigate("/login")} className="bg-primary hover:bg-primary/90">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-12 relative z-10">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary/30">
            <ChefHat className="w-8 h-8 text-background" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Register Your Restaurant</h1>
          <p className="text-muted-foreground mt-2">Join FoodAdmin's delivery network</p>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Restaurant Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground" />
                      Restaurant Name *
                    </label>
                    <Input name="name" required placeholder="e.g. The Golden Fork" className="bg-background/60 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Cuisine Type *</label>
                    <Input name="cuisine" required placeholder="e.g. Italian, Japanese" className="bg-background/60 border-white/10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Address *
                  </label>
                  <Input name="address" required placeholder="Full street address" className="bg-background/60 border-white/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea
                    name="description"
                    placeholder="Tell us about your restaurant — your specialty dishes, ambiance, story..."
                    className="bg-background/60 border-white/10 resize-none h-24"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Contact & Account</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Owner / Manager Name *
                  </label>
                  <Input name="ownerName" required placeholder="Your full name" className="bg-background/60 border-white/10" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      Phone
                    </label>
                    <Input name="phone" type="tel" placeholder="+1 555 000 0000" className="bg-background/60 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      Email *
                    </label>
                    <Input name="email" type="email" required placeholder="you@restaurant.com" className="bg-background/60 border-white/10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password *</label>
                  <Input name="password" type="password" required placeholder="Choose a secure password" className="bg-background/60 border-white/10" />
                  <p className="text-xs text-muted-foreground">You'll use this to log into your restaurant portal once approved.</p>
                </div>
              </div>
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
              Submit Registration Request
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
