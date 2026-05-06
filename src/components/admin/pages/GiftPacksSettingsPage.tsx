"use client";
import { Loader2, Save, Gift, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminSettings, type GiftPack } from "@/lib/useAdminSettings";

export default function GiftPacksSettingsPage() {
  const { settings, setSettings, loading, saving, save } = useAdminSettings();

  const setGiftPacks = (k: keyof typeof settings.giftPacks, v: unknown) =>
    setSettings((p) => ({ ...p, giftPacks: { ...p.giftPacks, [k]: v } }));

  const updatePack = (i: number, k: keyof GiftPack, v: string | number) =>
    setSettings((p) => {
      const packs = [...p.giftPacks.packs];
      packs[i] = { ...packs[i], [k]: v };
      return { ...p, giftPacks: { ...p.giftPacks, packs } };
    });

  const addPack = () =>
    setSettings((p) => ({
      ...p,
      giftPacks: {
        ...p.giftPacks,
        packs: [...p.giftPacks.packs, { name: "", description: "", price: 0 }],
      },
    }));

  const removePack = (i: number) =>
    setSettings((p) => ({
      ...p,
      giftPacks: {
        ...p.giftPacks,
        packs: p.giftPacks.packs.filter((_, idx) => idx !== i),
      },
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gift Packs</h1>
          <p className="text-sm text-muted-foreground">
            Manage the gift packs section shown on your homepage and gift packs page
          </p>
        </div>
        <Button
          className="gap-2 rounded-xl"
          onClick={() => save({ giftPacks: settings.giftPacks })}
          disabled={saving}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4" /> Save Changes</>
          )}
        </Button>
      </div>

      {/* Section text */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" /> Section Text
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Section Title</Label>
            <Input
              className="mt-1.5"
              value={settings.giftPacks.sectionTitle}
              onChange={(e) => setGiftPacks("sectionTitle", e.target.value)}
              placeholder="Gifts they'll never forget."
            />
          </div>
          <div>
            <Label>Section Subtitle</Label>
            <Textarea
              className="mt-1.5"
              value={settings.giftPacks.sectionSubtitle}
              onChange={(e) => setGiftPacks("sectionSubtitle", e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pack cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Gift Pack Cards</h2>
          <p className="text-xs text-muted-foreground">{settings.giftPacks.packs.length} pack(s)</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {settings.giftPacks.packs.map((pack, i) => (
            <Card key={i} className="rounded-xl">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Gift className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Pack {i + 1}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removePack(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Pack Name</Label>
                  <Input
                    className="mt-1 h-8 text-sm"
                    value={pack.name}
                    onChange={(e) => updatePack(i, "name", e.target.value)}
                    placeholder="Romantic Edit"
                  />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Input
                    className="mt-1 h-8 text-sm"
                    value={pack.description}
                    onChange={(e) => updatePack(i, "description", e.target.value)}
                    placeholder="For the one who lights up your world"
                  />
                </div>
                <div>
                  <Label className="text-xs">Starting Price (₹)</Label>
                  <Input
                    type="number"
                    className="mt-1 h-8 text-sm"
                    value={pack.price || ""}
                    onChange={(e) => updatePack(i, "price", Number(e.target.value))}
                    placeholder="2999"
                  />
                </div>
                <div>
                  <Label className="text-xs">
                    Image URL{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    className="mt-1 h-8 text-sm"
                    value={pack.image || ""}
                    onChange={(e) => updatePack(i, "image", e.target.value)}
                    placeholder="https://..."
                  />
                  {pack.image && (
                    <img
                      src={pack.image}
                      alt={pack.name}
                      className="mt-2 h-16 w-16 rounded-lg object-cover border border-border"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                </div>

                {/* Preview card */}
                {pack.name && (
                  <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-semibold">{pack.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{pack.description}</p>
                    {pack.price > 0 && (
                      <p className="text-xs font-bold text-primary mt-1">
                        From ₹{pack.price.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Add pack */}
          <button
            onClick={addPack}
            className="rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground hover:text-foreground min-h-[280px]"
          >
            <div className="h-12 w-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">Add Gift Pack</span>
          </button>
        </div>
      </div>
    </div>
  );
}
