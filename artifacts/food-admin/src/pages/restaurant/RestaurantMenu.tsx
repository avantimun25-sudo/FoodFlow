import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRestaurantMenu,
  getListRestaurantMenuQueryKey,
  useCreateRestaurantMenuItem,
  useUpdateRestaurantMenuItem,
  useDeleteRestaurantMenuItem,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Edit2, Trash2, Loader2, UtensilsCrossed, DollarSign,
  ImageIcon, Tag, ToggleLeft, ToggleRight, Search,
} from "lucide-react";

const FOOD_EMOJIS: Record<string, string> = {
  burger: "🍔", pizza: "🍕", sushi: "🍣", pasta: "🍝", salad: "🥗",
  dessert: "🍰", drink: "🥤", chicken: "🍗", steak: "🥩", fish: "🐟",
  seafood: "🦐", vegetarian: "🥦", vegan: "🌱", breakfast: "🍳",
  sandwich: "🥪", tacos: "🌮", soup: "🍜", rice: "🍚", appetizer: "🫙",
  default: "🍽️",
};

function getEmoji(category?: string | null): string {
  if (!category) return FOOD_EMOJIS.default;
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(FOOD_EMOJIS)) {
    if (key.includes(k)) return v;
  }
  return FOOD_EMOJIS.default;
}

function FoodImage({ url, name, category }: { url?: string | null; name: string; category?: string | null }) {
  const [imgError, setImgError] = useState(false);
  const emoji = getEmoji(category);

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-orange-500/10">
      <span className="text-4xl mb-1">{emoji}</span>
      <span className="text-xs text-muted-foreground text-center px-2 truncate w-full">{category || "Food"}</span>
    </div>
  );
}

interface MenuItemFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
}

const EMPTY_FORM: MenuItemFormData = { name: "", description: "", price: "", category: "", imageUrl: "" };

export default function RestaurantMenu() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [form, setForm] = useState<MenuItemFormData>(EMPTY_FORM);

  const { data, isLoading } = useListRestaurantMenu({ page, limit: 24 });
  const { mutate: createItem, isPending: isCreating } = useCreateRestaurantMenuItem();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateRestaurantMenuItem();
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteRestaurantMenuItem();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListRestaurantMenuQueryKey() });

  const filteredItems = (data?.data ?? []).filter((item) =>
    !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category ?? "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof filteredItems>);

  const openAdd = () => { setForm(EMPTY_FORM); setShowAdd(true); };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      category: item.category ?? "",
      imageUrl: item.imageUrl ?? "",
    });
  };

  const handleCreate = () => {
    createItem(
      { data: { name: form.name, description: form.description || undefined, price: Number(form.price), category: form.category || undefined, imageUrl: form.imageUrl || undefined } },
      {
        onSuccess: () => { toast({ title: "Item added!" }); setShowAdd(false); invalidate(); },
        onError: () => toast({ title: "Failed to add item", variant: "destructive" }),
      }
    );
  };

  const handleUpdate = () => {
    if (!editing) return;
    updateItem(
      { id: editing.id, data: { name: form.name, description: form.description || undefined, price: Number(form.price), category: form.category || undefined, imageUrl: form.imageUrl || undefined } },
      {
        onSuccess: () => { toast({ title: "Item updated!" }); setEditing(null); invalidate(); },
        onError: () => toast({ title: "Failed to update item", variant: "destructive" }),
      }
    );
  };

  const handleToggleAvailable = (item: any) => {
    updateItem(
      { id: item.id, data: { isAvailable: !item.isAvailable } },
      {
        onSuccess: () => { toast({ title: item.isAvailable ? "Item hidden" : "Item visible" }); invalidate(); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      }
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteItem(
      { id: deleting.id },
      {
        onSuccess: () => { toast({ title: "Item deleted" }); setDeleting(null); invalidate(); },
        onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Menu</h1>
          <p className="text-muted-foreground mt-1">{data?.total ?? 0} items on your menu</p>
        </div>
        <Button
          onClick={openAdd}
          className="font-semibold shadow-lg h-11 px-5 text-white"
          style={{ background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search menu items..."
          className="pl-11"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground mb-4">No menu items yet</p>
          <Button onClick={openAdd} className="bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 border-0">
            <Plus className="w-4 h-4 mr-2" />
            Add your first item
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{getEmoji(category)}</span>
                <h3 className="font-bold text-foreground text-lg">{category}</h3>
                <span className="text-sm text-muted-foreground">{items.length} items</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border overflow-hidden transition-all hover:border-orange-500/25 bg-card ${
                      item.isAvailable ? "border-border" : "border-red-500/20"
                    }`}
                  >
                    <div className="h-44 overflow-hidden relative">
                      <FoodImage url={item.imageUrl} name={item.name} category={item.category} />
                      {!item.isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <span className="text-xs font-semibold text-red-400 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30">
                            Unavailable
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-foreground text-sm leading-tight">{item.name}</p>
                        <p className="font-bold flex-shrink-0 text-sm text-orange-500">
                          ${Number(item.price).toFixed(2)}
                        </p>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <button
                          onClick={() => handleToggleAvailable(item)}
                          className={`flex items-center gap-1.5 text-xs font-medium transition-all ${
                            item.isAvailable ? "text-green-500" : "text-muted-foreground"
                          }`}
                        >
                          {item.isAvailable
                            ? <ToggleRight className="w-4 h-4" />
                            : <ToggleLeft className="w-4 h-4" />}
                          {item.isAvailable ? "Available" : "Hidden"}
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleting(item)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/10 text-red-400/60 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.total > data.limit && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Page {page} of {Math.ceil(data.total / data.limit)}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * data.limit >= data.total}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Menu Item</DialogTitle>
          </DialogHeader>
          <MenuItemForm form={form} setForm={setForm} />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} disabled={isCreating || !form.name || !form.price}
              className="flex-1 font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" }}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Item
            </Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit: {editing?.name}</DialogTitle>
          </DialogHeader>
          <MenuItemForm form={form} setForm={setForm} />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleUpdate} disabled={isUpdating || !form.name || !form.price}
              className="flex-1 font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" }}>
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Item?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete <span className="text-foreground font-semibold">"{deleting?.name}"</span>? This cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleDelete} disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenuItemForm({
  form,
  setForm,
}: {
  form: { name: string; description: string; price: string; category: string; imageUrl: string };
  setForm: React.Dispatch<React.SetStateAction<any>>;
}) {
  const update = (key: string, val: string) => setForm((f: any) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" /> Name *
        </label>
        <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Grilled Salmon" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-green-500" /> Price *
          </label>
          <Input value={form.price} onChange={(e) => update("price", e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-blue-500" /> Category
          </label>
          <Input value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="e.g. Burger" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-purple-500" /> Image URL
        </label>
        <Input value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} placeholder="https://..." />
        <p className="text-xs text-muted-foreground/60">Paste any image URL. Leave blank to use a food emoji placeholder.</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Description</label>
        <Textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Short description of the dish..."
          className="resize-none h-20"
        />
      </div>
    </div>
  );
}
