import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListDrivers, 
  getListDriversQueryKey,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver
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

export default function Drivers() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = { page, limit: 10, ...(statusFilter !== "all" ? { status: statusFilter } : {}) };
  const { data, isLoading } = useListDrivers(queryParams);
  const { mutate: create, isPending: isCreating } = useCreateDriver();
  const { mutate: update, isPending: isUpdating } = useUpdateDriver();
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteDriver();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      vehicle: fd.get("vehicle") as string,
      licensePlate: fd.get("licensePlate") as string,
      rating: parseFloat(fd.get("rating") as string) || 5.0,
      ...(editingItem ? { status: fd.get("status") as string } : {})
    };

    if (editingItem) {
      update({ id: editingItem.id, data: payload }, {
        onSuccess: () => {
          toast({ title: "Driver Updated" });
          queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() });
          setEditingItem(null);
        }
      });
    } else {
      create({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Driver Created" });
          queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() });
          setIsCreateOpen(false);
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this driver?")) return;
    deleteItem({ id }, {
      onSuccess: () => {
        toast({ title: "Driver Deleted" });
        queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return "bg-green-500/10 text-green-500 border-green-500/20";
      case 'busy': return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case 'offline': return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Delivery Drivers</h1>
          <p className="text-muted-foreground mt-1">Manage fleet, status, and track earnings.</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 glass-panel">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add Driver
          </Button>
        </div>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="font-semibold">Driver Info</TableHead>
                <TableHead className="font-semibold">Vehicle</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Deliveries</TableHead>
                <TableHead className="font-semibold text-right">Earnings</TableHead>
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
                    No drivers found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((d) => (
                  <TableRow key={d.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium text-foreground">
                      <div>{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{d.vehicle || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground font-mono">{d.licensePlate}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${getStatusColor(d.status)}`}>
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{d.totalDeliveries}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      ${d.totalEarnings.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingItem(d)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
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
            <DialogTitle className="text-xl">{editingItem ? "Edit Driver" : "New Driver"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Name</label>
                <Input name="name" defaultValue={editingItem?.name} required className="bg-background border-white/10" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" name="email" defaultValue={editingItem?.email} required className="bg-background border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input name="phone" defaultValue={editingItem?.phone} className="bg-background border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rating (0-5)</label>
                <Input name="rating" type="number" step="0.1" defaultValue={editingItem?.rating || 5} className="bg-background border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vehicle</label>
                <Input name="vehicle" defaultValue={editingItem?.vehicle} className="bg-background border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">License Plate</label>
                <Input name="licensePlate" defaultValue={editingItem?.licensePlate} className="bg-background border-white/10 uppercase" />
              </div>
              {editingItem && (
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select name="status" defaultValue={editingItem.status}>
                    <SelectTrigger className="bg-background border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={() => { setIsCreateOpen(false); setEditingItem(null); }}>Cancel</Button>
              <Button type="submit" disabled={isCreating || isUpdating} className="bg-primary hover:bg-primary/90">
                {isCreating || isUpdating ? "Saving..." : "Save Driver"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
