"use client";
import { useEffect, useState, useRef } from "react";
import { Star, Camera, X, Loader2, ThumbsUp, CheckCircle2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface Review {
  _id: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  verified: boolean;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface Props {
  slug: string;
}

const MAX_IMAGES = 4;
const MAX_SIZE_MB = 2;

function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "lg" ? "h-8 w-8" : size === "md" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHovered(i)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${i} star`}
        >
          <Star
            className={`${sz} transition-colors ${
              i <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-8 text-right text-muted-foreground shrink-0">{label}</span>
      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-yellow-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-muted-foreground shrink-0">{count}</span>
    </div>
  );
}

export default function ProductReviews({ slug }: Props) {
  const { user } = useAuth();
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0 });
  const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Lightbox
  const [lightbox, setLightbox] = useState<string | null>(null);

  const loadReviews = async (p = 1, append = false) => {
    try {
      const res = await fetch(`/api/reviews?slug=${slug}&page=${p}&limit=5`);
      const json = await res.json();
      if (json.success) {
        setReviews((prev) => (append ? [...prev, ...json.data] : json.data));
        setStats(json.stats);
        setTotalPages(json.pagination.totalPages);

        // Build rating breakdown
        const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        (append ? [...reviews, ...json.data] : json.data).forEach((r: Review) => {
          breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
        });
        setRatingBreakdown(breakdown);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadReviews(1);
  }, [slug]);

  const handleLoadMore = async () => {
    const next = page + 1;
    setPage(next);
    setLoadingMore(true);
    await loadReviews(next, true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    files.slice(0, remaining).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} exceeds ${MAX_SIZE_MB}MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        setImages((prev) => [...prev, src]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to write a review");
      router.push("/login");
      return;
    }
    if (rating === 0) { toast.error("Please select a star rating"); return; }
    if (!title.trim()) { toast.error("Please add a review title"); return; }
    if (comment.trim().length < 10) { toast.error("Review must be at least 10 characters"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: slug,
          userName: user.name,
          userEmail: user.email,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          images,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setSubmitted(true);
      setShowForm(false);
      setRating(0);
      setTitle("");
      setComment("");
      setImages([]);
      toast.success("Review submitted! Thank you.");
      // Reload reviews
      setPage(1);
      loadReviews(1);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabel = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <section className="container pb-20">
      <div className="border-t border-border pt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold">Customer Reviews</h2>
          {!showForm && !submitted && (
            <Button
              variant="hero"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                if (!user) { toast.error("Please sign in to write a review"); router.push("/login"); return; }
                setShowForm(true);
              }}
            >
              <Star className="h-4 w-4" /> Write a Review
            </Button>
          )}
        </div>

        {/* Rating summary */}
        {stats.totalReviews > 0 && (
          <div className="grid sm:grid-cols-[auto_1fr] gap-8 mb-10 p-6 rounded-2xl border border-border bg-card shadow-soft">
            {/* Average */}
            <div className="flex flex-col items-center justify-center text-center min-w-[120px]">
              <span className="text-6xl font-black text-foreground leading-none mb-2">
                {stats.averageRating.toFixed(1)}
              </span>
              <StarRating value={Math.round(stats.averageRating)} size="md" />
              <p className="text-sm text-muted-foreground mt-2">
                {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Breakdown bars */}
            <div className="flex flex-col justify-center gap-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar
                  key={star}
                  label={`${star}`}
                  count={ratingBreakdown[star] || 0}
                  total={stats.totalReviews}
                />
              ))}
            </div>
          </div>
        )}

        {/* Write review form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-primary/20 bg-card p-6 shadow-soft mb-10 space-y-5 animate-fade-up"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Write Your Review</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Star rating */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                Your Rating *
              </Label>
              <div className="flex items-center gap-3">
                <StarRating value={rating} onChange={setRating} size="lg" />
                {rating > 0 && (
                  <span className="text-sm font-semibold text-primary">{ratingLabel[rating]}</span>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Review Title *
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarise your experience"
                maxLength={100}
                required
              />
            </div>

            {/* Comment */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Your Review *
              </Label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell others what you think about this product — fit, quality, comfort..."
                rows={4}
                minLength={10}
                maxLength={1000}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{comment.length}/1000</p>
            </div>

            {/* Image upload */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                Add Photos <span className="normal-case font-normal">(up to {MAX_IMAGES}, max {MAX_SIZE_MB}MB each)</span>
              </Label>
              <div className="flex flex-wrap gap-3">
                {images.map((src, idx) => (
                  <div key={idx} className="relative h-20 w-20 rounded-xl overflow-hidden border border-border group">
                    <img
                      src={src}
                      alt={`Review image ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      aria-label="Remove image"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <label
                    htmlFor="review-images"
                    className="h-20 w-20 rounded-xl border-2 border-dashed border-border hover:border-primary/60 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Add photo</span>
                    <input
                      ref={fileRef}
                      id="review-images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" variant="hero" disabled={submitting} className="gap-1.5">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                Submit Review
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Success banner */}
        {submitted && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 mb-8 animate-fade-up">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 font-medium">
              Your review has been submitted. Thank you for your feedback!
            </p>
          </div>
        )}

        {/* Reviews list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <Star className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold text-lg mb-1">No reviews yet</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Be the first to share your experience with this product.
            </p>
            {!showForm && (
              <Button
                variant="hero"
                size="sm"
                onClick={() => {
                  if (!user) { toast.error("Please sign in to write a review"); router.push("/login"); return; }
                  setShowForm(true);
                }}
              >
                Write the first review
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((r) => (
              <div key={r._id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {r.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{r.userName}</span>
                        {r.verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Verified Purchase
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <StarRating value={r.rating} size="sm" />
                </div>

                <h4 className="font-semibold text-sm mb-1">{r.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>

                {/* Review images */}
                {r.images && r.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {r.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightbox(img)}
                        className="h-20 w-20 rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors group"
                        aria-label={`View image ${idx + 1}`}
                      >
                        <img
                          src={img}
                          alt={`Review photo ${idx + 1}`}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Load more */}
            {page < totalPages && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="gap-2"
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                  Load more reviews
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <img
            src={lightbox}
            alt="Review photo"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
