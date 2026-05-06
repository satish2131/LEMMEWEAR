"use client";
import { Loader2, Save, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminSettings } from "@/lib/useAdminSettings";

// Inline SVG social icons
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);
const IconTwitter = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
const IconYoutube = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

export default function ContactSettingsPage() {
  const { settings, setSettings, loading, saving, save } = useAdminSettings();

  const setContact = (k: keyof typeof settings.contact, v: string) =>
    setSettings((p) => ({ ...p, contact: { ...p.contact, [k]: v } }));

  const setSocial = (k: keyof typeof settings.social, v: string) =>
    setSettings((p) => ({ ...p, social: { ...p.social, [k]: v } }));

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
          <h1 className="text-2xl font-bold tracking-tight">Contact &amp; Social</h1>
          <p className="text-sm text-muted-foreground">
            Manage your store contact details and social media links
          </p>
        </div>
        <Button
          className="gap-2 rounded-xl"
          onClick={() => save({ contact: settings.contact, social: settings.social })}
          disabled={saving}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4" /> Save Changes</>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Details */}
        <Card className="rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                className="mt-1.5"
                value={settings.contact.email}
                onChange={(e) => setContact("email", e.target.value)}
                placeholder="hello@lemmewear.in"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                className="mt-1.5"
                value={settings.contact.phone}
                onChange={(e) => setContact("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <Label>
                WhatsApp Number{" "}
                <span className="text-muted-foreground font-normal">(digits only, with country code)</span>
              </Label>
              <Input
                className="mt-1.5"
                value={settings.contact.whatsapp}
                onChange={(e) => setContact("whatsapp", e.target.value)}
                placeholder="919876543210"
              />
            </div>
            <div>
              <Label>Studio / Office Address</Label>
              <Textarea
                className="mt-1.5"
                value={settings.contact.address}
                onChange={(e) => setContact("address", e.target.value)}
                placeholder="Andheri West, Mumbai, Maharashtra 400058"
                rows={2}
              />
            </div>
            <div>
              <Label>Support Hours</Label>
              <Input
                className="mt-1.5"
                value={settings.contact.hours}
                onChange={(e) => setContact("hours", e.target.value)}
                placeholder="Mon–Sat 10am–7pm IST"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <IconInstagram /> Social Media Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-1.5">
                <span className="text-pink-500"><IconInstagram /></span> Instagram
              </Label>
              <Input
                className="mt-1.5"
                value={settings.social.instagram}
                onChange={(e) => setSocial("instagram", e.target.value)}
                placeholder="https://instagram.com/lemmewear"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                <span className="text-sky-500"><IconTwitter /></span> X / Twitter
              </Label>
              <Input
                className="mt-1.5"
                value={settings.social.twitter}
                onChange={(e) => setSocial("twitter", e.target.value)}
                placeholder="https://twitter.com/lemmewear"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                <span className="text-blue-600"><IconFacebook /></span> Facebook
              </Label>
              <Input
                className="mt-1.5"
                value={settings.social.facebook}
                onChange={(e) => setSocial("facebook", e.target.value)}
                placeholder="https://facebook.com/lemmewear"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                <span className="text-red-500"><IconYoutube /></span> YouTube
              </Label>
              <Input
                className="mt-1.5"
                value={settings.social.youtube}
                onChange={(e) => setSocial("youtube", e.target.value)}
                placeholder="https://youtube.com/@lemmewear"
              />
            </div>

            {/* Live preview */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">Live preview:</p>
              <div className="flex gap-2 flex-wrap">
                {settings.social.instagram && (
                  <a href={settings.social.instagram} target="_blank" rel="noreferrer"
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-border hover:bg-pink-500/10 transition-colors text-pink-500">
                    <IconInstagram />
                  </a>
                )}
                {settings.social.twitter && (
                  <a href={settings.social.twitter} target="_blank" rel="noreferrer"
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-border hover:bg-sky-500/10 transition-colors text-sky-500">
                    <IconTwitter />
                  </a>
                )}
                {settings.social.facebook && (
                  <a href={settings.social.facebook} target="_blank" rel="noreferrer"
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-border hover:bg-blue-600/10 transition-colors text-blue-600">
                    <IconFacebook />
                  </a>
                )}
                {settings.social.youtube && (
                  <a href={settings.social.youtube} target="_blank" rel="noreferrer"
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-border hover:bg-red-500/10 transition-colors text-red-500">
                    <IconYoutube />
                  </a>
                )}
                {settings.contact.whatsapp && (
                  <a href={`https://wa.me/${settings.contact.whatsapp}`} target="_blank" rel="noreferrer"
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-border hover:bg-green-500/10 transition-colors text-green-500">
                    <IconWhatsApp />
                  </a>
                )}
                {!settings.social.instagram && !settings.social.twitter && !settings.social.facebook && !settings.social.youtube && (
                  <p className="text-xs text-muted-foreground">Add links above to see preview</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
