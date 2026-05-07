"use client";
import React, { useEffect, useState } from "react";
import {
  UserCog, Plus, Trash2, Pencil, Loader2, Eye, EyeOff,
  ShieldCheck, Shield, X, Check, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  createdAt: string;
}

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "admin" as "admin" | "superadmin",
};

export default function AdminUsersPage() {
  const { admin: currentAdmin } = useAdminAuth();
  const isSuperAdmin = currentAdmin?.role === "superadmin";

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showResetFor, setShowResetFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    document.title = "Admin Users — LemmeWear Admin";
    if (isSuperAdmin) loadAdmins();
    else setLoading(false);
  }, [isSuperAdmin]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins");
      const json = await res.json();
      if (json.success) setAdmins(json.data);
    } catch {
      toast.error("Failed to load admin users");
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
    setShowPassword(false);
  };

  const handleEdit = (a: AdminUser) => {
    setForm({ name: a.name, email: a.email, password: "", role: a.role });
    setEditingId(a._id);
    setShowForm(true);
    setShowPassword(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error("Name and email are required"); return; }
    if (!editingId && !form.password) { toast.error("Password is required"); return; }
    if (form.password && form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {
        name: form.name,
        email: form.email,
        role: form.role,
      };
      if (form.password) body.password = form.password;

      const res = await fetch(
        editingId ? `/api/admin/admins/${editingId}` : "/api/admin/admins",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success(editingId ? "Admin updated" : "Admin created");
      resetForm();
      loadAdmins();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this admin user? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Admin deleted");
      setAdmins((prev) => prev.filter((a) => a._id !== id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Password updated");
      setShowResetFor(null);
      setNewPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setResetting(false);
    }
  };

  // ── Access denied for non-superadmins ──────────────────────────────────────
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 grid place-items-center mb-4">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Superadmin Only</h2>
        <p className="text-muted-foreground max-w-sm">
          Managing admin users requires superadmin privileges. Contact your superadmin to make changes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage who has access to the admin dashboard
          </p>
        </div>
        {!showForm && (
          <Button variant="hero" size="sm" className="gap-1.5" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4" /> Add Admin
          </Button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-primary/20 bg-card p-6 shadow-soft space-y-4 animate-fade-up"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">
              {editingId ? "Edit Admin User" : "Create Admin User"}
            </h2>
            <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={set("name")} placeholder="Rahul Sharma" className="mt-1.5" required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={set("email")} placeholder="admin@lemmewear.in" className="mt-1.5" required />
            </div>
            <div>
              <Label>{editingId ? "New Password" : "Password *"}</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder={editingId ? "Leave blank to keep current" : "Min. 8 characters"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Role *</Label>
              <select
                value={form.role}
                onChange={set("role")}
                className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Superadmins can manage other admin users.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="hero" disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editingId ? "Update Admin" : "Create Admin"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Admin list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : admins.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <UserCog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">No admin users yet</h2>
          <p className="text-muted-foreground mb-6">Create your first admin user to get started.</p>
          <Button variant="hero" onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Admin
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">User</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Role</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground hidden md:table-cell">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <React.Fragment key={a._id}>
                  <tr className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          a.role === "superadmin"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}>
                          {a.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold">{a.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">{a.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        a.role === "superadmin"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-secondary text-secondary-foreground"
                      }`}>
                        {a.role === "superadmin"
                          ? <><ShieldCheck className="h-3 w-3" /> Superadmin</>
                          : <><Shield className="h-3 w-3" /> Admin</>}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">
                      {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Reset password"
                          onClick={() => { setShowResetFor(showResetFor === a._id ? null : a._id); setNewPassword(""); }}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleEdit(a)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {a._id !== currentAdmin?.id && (
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(a._id)}
                            disabled={deletingId === a._id}
                          >
                            {deletingId === a._id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Inline password reset row */}
                  {showResetFor === a._id && (
                    <tr className="bg-muted/30 border-b border-border">
                      <td colSpan={5} className="px-5 py-4">
                        <div className="flex items-center gap-3 max-w-md">
                          <KeyRound className="h-4 w-4 text-primary shrink-0" />
                          <div className="relative flex-1">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="New password (min. 8 chars)"
                              className="pr-10 h-9 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          <Button
                            size="sm" variant="hero" className="gap-1.5 shrink-0"
                            onClick={() => handleResetPassword(a._id)}
                            disabled={resetting}
                          >
                            {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Update
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => { setShowResetFor(null); setNewPassword(""); }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
