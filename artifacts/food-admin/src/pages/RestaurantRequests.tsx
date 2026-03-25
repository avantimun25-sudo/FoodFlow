import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListRestaurantRequests,
  getListRestaurantRequestsQueryKey,
  useReviewRestaurantRequest,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Clock, Store, Mail, Phone, MapPin, User, ChefHat } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  declined: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  approved: <CheckCircle2 className="w-3.5 h-3.5" />,
  declined: <XCircle className="w-3.5 h-3.5" />,
};

export default function RestaurantRequests() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListRestaurantRequests(
    { status: statusFilter !== "all" ? statusFilter : undefined, page, limit: 10 },
    { query: { enabled: true } }
  );
  const { mutate: review, isPending: isReviewing } = useReviewRestaurantRequest();

  const handleReview = (status: "approved" | "declined") => {
    if (!reviewing) return;
    review(
      { id: reviewing.id, data: { status, reviewerNotes: reviewNotes } },
      {
        onSuccess: () => {
          toast({ title: status === "approved" ? "Restaurant Approved!" : "Request Declined" });
          queryClient.invalidateQueries({ queryKey: getListRestaurantRequestsQueryKey() });
          setReviewing(null);
          setReviewNotes("");
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err?.data?.error || "Failed", variant: "destructive" });
        },
      }
    );
  };

  const filters = ["pending", "approved", "declined", "all"];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Restaurant Requests</h1>
          <p className="text-muted-foreground mt-1">Review and manage incoming restaurant registration requests.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                statusFilter === f
                  ? "bg-primary text-background shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data?.data.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No {statusFilter} requests found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data?.data.map((req) => (
            <Card key={req.id} className="glass-card border-white/10 hover:border-white/20 transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <ChefHat className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-lg text-foreground">{req.name}</h3>
                      <Badge variant="outline" className={STATUS_COLORS[req.status] || ""}>
                        <span className="flex items-center gap-1.5">
                          {STATUS_ICONS[req.status]}
                          {req.status}
                        </span>
                      </Badge>
                      <Badge variant="secondary" className="bg-secondary/20 text-secondary border-none">
                        {req.cuisine}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{req.ownerName}</span>
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{req.email}</span>
                      {req.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{req.phone}</span>}
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{req.address}</span>
                    </div>
                    {req.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 italic">"{req.description}"</p>
                    )}
                    {req.reviewerNotes && (
                      <p className="text-sm mt-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                        <span className="text-muted-foreground">Notes: </span>{req.reviewerNotes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                      Submitted {new Date(req.createdAt).toLocaleDateString()}
                      {req.reviewedAt && ` · Reviewed ${new Date(req.reviewedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  {req.status === "pending" && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20"
                        onClick={() => setReviewing(req)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Review
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && data.total > data.limit && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Showing page {page} of {Math.ceil(data.total / data.limit)}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-transparent border-white/10">Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * data.limit >= data.total} className="bg-transparent border-white/10">Next</Button>
          </div>
        </div>
      )}

      <Dialog open={!!reviewing} onOpenChange={(open) => { if (!open) { setReviewing(null); setReviewNotes(""); } }}>
        <DialogContent className="glass-panel border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl">Review: {reviewing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm border border-white/10">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Owner:</span> <span className="text-foreground font-medium">{reviewing?.ownerName}</span></div>
                <div><span className="text-muted-foreground">Cuisine:</span> <span className="text-foreground font-medium">{reviewing?.cuisine}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Email:</span> <span className="text-foreground font-medium">{reviewing?.email}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="text-foreground font-medium">{reviewing?.address}</span></div>
              </div>
              {reviewing?.description && <p className="text-muted-foreground italic border-t border-white/10 pt-2">"{reviewing.description}"</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="Add any notes for the applicant..."
                className="bg-background/60 border-white/10 resize-none h-20"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                onClick={() => handleReview("approved")}
                disabled={isReviewing}
              >
                {isReviewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Approve
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => handleReview("declined")}
                disabled={isReviewing}
              >
                {isReviewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                Decline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
