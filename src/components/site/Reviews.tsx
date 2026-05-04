import { Star } from "lucide-react";

const reviews = [
  { name: "Aanya K.", text: "The fabric quality is unreal. Customized a tee for my partner — they cried happy tears.", role: "Verified Buyer" },
  { name: "Rohan M.", text: "Gift box arrived like a luxury unboxing. The 3D preview was so accurate it felt magical.", role: "Verified Buyer" },
  { name: "Priya S.", text: "I've ordered 6 designs already. The customizer is addictive. Premium feel end to end.", role: "Verified Buyer" },
];

export const Reviews = () => (
  <section className="container py-20">
    <div className="text-center mb-12">
      <p className="text-sm font-medium text-primary mb-2">Loved by thousands</p>
      <h2 className="text-4xl lg:text-5xl font-bold">What our community says</h2>
    </div>
    <div className="grid md:grid-cols-3 gap-5">
      {reviews.map((r, i) => (
        <figure key={i} className="rounded-2xl border border-border bg-card p-7 shadow-soft transition-smooth hover:shadow-card hover:-translate-y-1">
          <div className="flex gap-0.5 mb-4">
            {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-primary text-primary" />)}
          </div>
          <blockquote className="text-base mb-5 leading-relaxed">"{r.text}"</blockquote>
          <figcaption className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold">{r.name[0]}</div>
            <div>
              <div className="font-semibold text-sm font-sans">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.role}</div>
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  </section>
);
