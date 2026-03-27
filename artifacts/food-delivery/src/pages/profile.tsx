import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateCustomer } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Edit2, Check, X, ShieldCheck,
} from "lucide-react";

export default function Profile() {
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
  });

  const { mutate: updateCustomer, isPending } = useUpdateCustomer();

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const startEdit = () => {
    setForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? "",
    });
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = () => {
    if (!user) return;
    updateCustomer(
      {
        id: user.id,
        data: {
          name: form.name || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
        },
      },
      {
        onSuccess: (updated) => {
          updateUser({ ...user, ...updated });
          setEditing(false);
          toast({ title: "Profile updated", description: "Your details have been saved." });
        },
        onError: () => {
          toast({ title: "Update failed", description: "Something went wrong. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  const fields = [
    { key: "name",    label: "Full Name",        icon: User,    type: "text",  placeholder: "Your full name" },
    { key: "email",   label: "Email Address",     icon: Mail,    type: "email", placeholder: "your@email.com" },
    { key: "phone",   label: "Phone Number",      icon: Phone,   type: "tel",   placeholder: "+1 (555) 000-0000" },
    { key: "address", label: "Delivery Address",  icon: MapPin,  type: "text",  placeholder: "123 Main St, City, State" },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Avatar card */}
          <div className="rounded-3xl border border-border bg-card p-8 flex flex-col items-center text-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-primary/20">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user?.name}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{user?.email}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified customer
            </div>
          </div>

          {/* Details card */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-1">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">Personal Details</h2>
              {!editing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEdit}
                  className="gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={cancel} className="gap-1.5 text-muted-foreground">
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={save} disabled={isPending} className="gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    {isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
                <div key={key}>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </label>
                  {editing ? (
                    <Input
                      type={type}
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="rounded-xl"
                    />
                  ) : (
                    <p className={`text-sm px-1 py-2 border-b border-border ${
                      form[key] || user?.[key as keyof typeof user]
                        ? "text-foreground font-medium"
                        : "text-muted-foreground italic"
                    }`}>
                      {(user?.[key as keyof typeof user] as string) || `No ${label.toLowerCase()} set`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Account info */}
          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Account Info</h2>
            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">Customer ID</span>
              <span className="text-sm font-mono font-semibold text-foreground">#{user?.id}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Account type</span>
              <span className="text-sm font-semibold text-foreground">Customer</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
