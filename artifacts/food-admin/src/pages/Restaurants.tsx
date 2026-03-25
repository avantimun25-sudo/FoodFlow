import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListRestaurants, 
  getListRestaurantsQueryKey,
  useCreateRestaurant,
  useUpdateRestaurant,
  useDeleteRestaurant
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Search, Star } from "lucide-react";

export default function Restaurants() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = { page, limit: 10, ...(search ? { search } : {}) };
  const { data, isLoading } = useListRestaurants(queryParams);
  const { mutate: create, isPending: isCreating } = useCreateRestaurant();
  const { mutate: update, isPending: isUpdating } = useUpdateRestaurant();
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteRestaurant();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      cuisine: fd.get("cuisine") as string,
      address: fd.get("address") as string,
      phone: fd.get("phone") as string,
      email: fd.get("email") as string,
      rating: parseFloat(fd.get("rating") as string) || 0,
      isActive: fd.get("isActive") === "on", // checkbox
    };

    if (editingItem) {
      update({ id: editingItem.id, data: payload }, {
        onSuccess: () => {
          toast({ title: "Restaurant Updated" });
          queryClient.invalidateQueries({ queryKey: getListRestaurantsQueryKey() });
          setEditingItem(null);
        }
      });
    } else {
      create({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Restaurant Created" });
          queryClient.invalidateQueries({ queryKey: getListRestaurantsQueryKey() });
          setIsCreateOpen(false);
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this restaurant?")) return;
    deleteItem({ id }, {
      onSuccess: () => {
        toast({ title: "Restaurant Deleted" });
        queryClient.invalidateQueries({ queryKey: getListRestaurantsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Restaurants</h1>
          <p className="text-muted-foreground mt-1">Manage partner restaurants and vendor settings.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add Restaurant
        </Button>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-white/5">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input 
              placeholder="Search restaurants..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-background border-white/10"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="font-semibold">Restaurant</TableHead>
                <TableHead className="font-semibold">Cuisine</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Rating</TableHead>
                <TableHead className="font-semibold text-right">Revenue</TableHead>
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
                    No restaurants found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((r) => (
                  <TableRow key={r.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium text-foreground">
                      <div>{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.address}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-secondary/20 text-secondary border-none">{r.cuisine}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={r.isActive ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
                        {r.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 font-medium">
                        {r.rating ? Number(r.rating).toFixed(1) : "N/A"} <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      ${Number(r.totalRevenue).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingItem(r)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
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
            <DialogTitle className="text-xl">{editingItem ? "Edit Restaurant" : "New Restaurant"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Name</label>
                <Input name="name" defaultValue={editingItem?.name} required className="bg-background border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cuisine</label>
                <Input name="cuisine" defaultValue={editingItem?.cuisine} required className="bg-background border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <Input name="rating" type="number" step="0.1" defaultValue={editingItem?.rating} className="bg-background border-white/10" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input name="address" defaultValue={editingItem?.address} required className="bg-background border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input name="phone" defaultValue={editingItem?.phone} className="bg-background border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" name="email" defaultValue={editingItem?.email} className="bg-background border-white/10" />
              </div>
              {editingItem && (
                <div className="space-y-2 col-span-2 flex items-center gap-2">
                  <input type="checkbox" name="isActive" id="isActive" defaultChecked={editingItem.isActive} className="w-4 h-4 rounded bg-background border-white/10 accent-primary" />
                  <label htmlFor="isActive" className="text-sm font-medium">Active Status</label>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={() => { setIsCreateOpen(false); setEditingItem(null); }}>Cancel</Button>
              <Button type="submit" disabled={isCreating || isUpdating} className="bg-primary hover:bg-primary/90">
                {isCreating || isUpdating ? "Saving..." : "Save Restaurant"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
