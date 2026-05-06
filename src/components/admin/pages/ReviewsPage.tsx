"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Star,
  Search,
  CheckCircle,
  Clock,
  MoreHorizontal,
  MessageSquare,
  Loader2,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Review {
  _id: string;
  productSlug: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  createdAt: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/reviews?${params}`);
      const json = await res.json();
      if (json.success) setReviews(json.data);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchReviews, 300);
    return () => clearTimeout(timer);
  }, [fetchReviews]);

  const updateReview = async (id: string, verified: boolean) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      });
      const json = await res.json();
      if (json.success) {
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, verified } : r))
        );
        toast.success(verified ? "Review approved" : "Review flagged");
      }
    } catch {
      toast.error("Failed to update review");
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setReviews((prev) => prev.filter((r) => r._id !== id));
        toast.success("Review deleted");
        setSelectedReview(null);
      }
    } catch {
      toast.error("Failed to delete review");
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";
  const verifiedCount = reviews.filter((r) => r.verified).length;
  const pendingCount = reviews.filter((r) => !r.verified).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">Customer feedback and ratings</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                <Star className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgRating}</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/15">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold">All Reviews</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-56 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Product</th>
                    <th className="pb-3 font-medium">Rating</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Comment</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium hidden lg:table-cell">Date</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/30" />
                        <p className="mt-3 text-sm text-muted-foreground">No reviews found</p>
                      </td>
                    </tr>
                  ) : (
                    reviews.map((r) => (
                      <tr
                        key={r._id}
                        className="border-b last:border-0 transition-colors hover:bg-muted/30 cursor-pointer"
                        onClick={() => setSelectedReview(r)}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                              {r.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                            <span className="font-medium">{r.userName}</span>
                          </div>
                        </td>
                        <td className="py-3 hidden sm:table-cell text-muted-foreground">
                          {r.productSlug}
                        </td>
                        <td className="py-3">
                          <StarRating rating={r.rating} />
                        </td>
                        <td className="py-3 hidden md:table-cell">
                          <p className="max-w-[250px] truncate text-muted-foreground">
                            {r.comment}
                          </p>
                        </td>
                        <td className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-[11px] ${
                              r.verified
                                ? "bg-green-500/15 text-green-600 border-green-500/20"
                                : "bg-yellow-500/15 text-yellow-600 border-yellow-500/20"
                            }`}
                          >
                            {r.verified ? "Approved" : "Pending"}
                          </Badge>
                        </td>
                        <td className="py-3 hidden lg:table-cell text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td
                          className="py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => updateReview(r._id, true)}>
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateReview(r._id, false)}>
                                Flag as Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteReview(r._id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={(v) => !v && setSelectedReview(null)}>
        <DialogContent className="max-w-md">
          {selectedReview && (
            <>
              <DialogHeader>
                <DialogTitle>Review by {selectedReview.userName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="flex items-center justify-between">
                  <StarRating rating={selectedReview.rating} />
                  <Badge
                    variant="outline"
                    className={`text-[11px] ${
                      selectedReview.verified
                        ? "bg-green-500/15 text-green-600 border-green-500/20"
                        : "bg-yellow-500/15 text-yellow-600 border-yellow-500/20"
                    }`}
                  >
                    {selectedReview.verified ? "Approved" : "Pending"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Product: {selectedReview.productSlug}
                  </p>
                  <p className="font-medium text-sm mb-1">{selectedReview.title}</p>
                  <p className="text-sm">{selectedReview.comment}</p>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      updateReview(selectedReview._id, true);
                      setSelectedReview(null);
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateReview(selectedReview._id, false);
                      setSelectedReview(null);
                    }}
                  >
                    Flag
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={() => deleteReview(selectedReview._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
