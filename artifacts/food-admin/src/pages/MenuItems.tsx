import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListMenuItems, 
  getListMenuItemsQueryKey,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useListRestaurants
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";

export default function MenuItems() {
  const [page, setPage] = useState(1);
  const [restaurantFilter, setRestaurantFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = { page, limit: 10, ...(restaurantFilter !== "all" ? { restaurantId: parseInt(restaurantFilter) } : {}) };
  const { data, isLoading } = useListMenuItems(queryParams);
  const { data: restaurantsData } = useListRestaurants({ limit: 100 }); // fetch restaurants for dropdowns
  
  const { mutate: create, isPending: isCreating } = useCreateMenuItem();
  const { mutate: update, isPending: isUpdating } = useUpdateMenuItem();
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteMenuItem();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      description: fd.get("description") as string,
      price: parseFloat(fd.get("price") as string),
      category: fd.get("category") as string,
    };

    if (editingItem) {
      update({ 
        id: editingItem.id, 
        data: { ...payload, isAvailable: fd.get("isAvailable") === "on" } 
      }, {
        onSuccess: () => {
          toast({ title: "Item Updated" });
          queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
          setEditingItem(null);
        }
      });
    } else {
      create({ 
        data: { ...payload, restaurantId: parseInt(fd.get("restaurantId") as string) } 
      }, {
        onSuccess: () => {
          toast({ title: "Item Created" });
          queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
          setIsCreateOpen(false);
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this menu item?")) return;
    deleteItem({ id }, {
      onSuccess: () => {
        toast({ title: "Item Deleted" });
        queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Menu Items</h1>
          <p className="text-muted-foreground mt-1">Manage global menus and pricing.</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={restaurantFilter} onValueChange={setRestaurantFilter}>
            <SelectTrigger className="w-48 glass-panel">
              <SelectValue placeholder="Filter by Restaurant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Restaurants</SelectItem>
              {restaurantsData?.data.map(r => (
                <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="font-semibold">Item</TableHead>
                <TableHead className="font-semibold">Restaurant</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold text-right">Price</TableHead>
                <TableHead className="font-semibold">Availability</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((item) => (
                  <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium text-foreground">
                      <div>{item.name}</div>
                      <div className="text-xs text-muted-foreground max-w-xs truncate">{item.description}</div>
                    </TableCell>
                    <TableCell>{item.restaurantName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-secondary/20 text-secondary border-none">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      ${Number(item.price).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={item.isAvailable ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {data && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Showing page {page} of {Math.ceil(data.total / data.limit) || 1}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-transparent border-white/10">Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * data.limit >= data.total} className="bg-transparent border-white/10">Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen || !!editingItem} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditingItem(null); } }}>
        <DialogContent className="glass-panel border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingItem ? "Edit Menu Item" : "New Menu Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Name</label>
              <Input name="name" defaultValue={editingItem?.name} required className="bg-background border-white/10" />
            </div>
            {!editingItem && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Restaurant</label>
                <Select name="restaurantId" required>
                  <SelectTrigger className="bg-background border-white/10">
                    <SelectValue placeholder="Select Restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurantsData?.data.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input name="description" defaultValue={editingItem?.description} className="bg-background border-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price ($)</label>
                <Input type="number" step="0.01" name="price" defaultValue={editingItem?.price} required className="bg-background border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input name="category" defaultValue={editingItem?.category} required className="bg-background border-white/10" />
              </div>
            </div>
            {editingItem && (
              <div className="space-y-2 flex items-center gap-2">
                <input type="checkbox" name="isAvailable" id="isAvailable" defaultChecked={editingItem.isAvailable} className="w-4 h-4 rounded bg-background border-white/10 accent-primary" />
                <label htmlFor="isAvailable" className="text-sm font-medium">Available to order</label>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={() => { setIsCreateOpen(false); setEditingItem(null); }}>Cancel</Button>
              <Button type="submit" disabled={isCreating || isUpdating} className="bg-primary hover:bg-primary/90">
                {isCreating || isUpdating ? "Saving..." : "Save Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
