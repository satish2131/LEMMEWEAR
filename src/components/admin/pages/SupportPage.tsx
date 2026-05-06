"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Headphones,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Send,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

interface SupportTicket {
  _id: string;
  ticketNumber: string;
  customer: string;
  email: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  replies: Array<{ message: string; author: string; authorType: string; createdAt: string }>;
  createdAt: string;
  _isContact?: boolean;
}

const statusConfig: Record<TicketStatus, { icon: typeof AlertTriangle; class: string }> = {
  Open: { icon: AlertTriangle, class: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  "In Progress": { icon: Clock, class: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  Resolved: { icon: CheckCircle2, class: "bg-green-500/15 text-green-600 border-green-500/20" },
  Closed: { icon: XCircle, class: "bg-muted text-muted-foreground border-border" },
};

const priorityClass: Record<TicketPriority, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-blue-500/15 text-blue-600",
  High: "bg-yellow-500/15 text-yellow-600",
  Urgent: "bg-red-500/15 text-red-600",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [sheetStatus, setSheetStatus] = useState<TicketStatus>("Open");
  const [replyText, setReplyText] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPriority, setNewPriority] = useState<TicketPriority>("Medium");
  const [newDescription, setNewDescription] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/support?${params}`);
      const json = await res.json();
      if (json.success) setTickets(json.data);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchTickets, 300);
    return () => clearTimeout(timer);
  }, [fetchTickets]);

  const openSheet = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setSheetStatus(ticket.status);
    setReplyText("");
  };

  const updateTicketStatus = async (status: TicketStatus) => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedTicket.ticketNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        setTickets((prev) =>
          prev.map((t) =>
            t.ticketNumber === selectedTicket.ticketNumber ? { ...t, status } : t
          )
        );
        setSelectedTicket((prev) => (prev ? { ...prev, status } : null));
        setSheetStatus(status);
        toast.success("Ticket status updated");
      }
    } catch {
      toast.error("Failed to update ticket");
    } finally {
      setUpdating(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedTicket.ticketNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedTicket(json.data);
        setReplyText("");
        toast.success("Reply sent");
      }
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setUpdating(false);
    }
  };

  const createTicket = async () => {
    if (!newSubject || !newCustomer || !newEmail) {
      toast.error("Please fill in all required fields");
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: newCustomer,
          email: newEmail,
          subject: newSubject,
          description: newDescription,
          priority: newPriority,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTickets((prev) => [json.data, ...prev]);
        setCreateOpen(false);
        setNewSubject("");
        setNewCustomer("");
        setNewEmail("");
        setNewDescription("");
        setNewPriority("Medium");
        toast.success("Ticket created");
      }
    } catch {
      toast.error("Failed to create ticket");
    } finally {
      setUpdating(false);
    }
  };

  const openCount = tickets.filter((t) => t.status === "Open").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support</h1>
          <p className="text-sm text-muted-foreground">Manage customer support tickets</p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-xs text-muted-foreground">Open Tickets</p>
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
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resolvedCount}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold">All Tickets</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-56 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
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
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
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
                    <th className="pb-3 font-medium">Ticket</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Subject</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <Headphones className="mx-auto h-10 w-10 text-muted-foreground/30" />
                        <p className="mt-3 text-sm text-muted-foreground">No tickets found</p>
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => {
                      const sc = statusConfig[t.status];
                      const StatusIcon = sc.icon;
                      return (
                        <tr
                          key={t._id}
                          className="border-b last:border-0 transition-colors hover:bg-muted/30 cursor-pointer"
                          onClick={() => openSheet(t)}
                        >
                          <td className="py-3 font-medium">
                            <div className="flex items-center gap-1.5">
                              {t.ticketNumber}
                              {t._isContact && (
                                <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                                  Contact
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <div>
                              <p className="font-medium">{t.customer}</p>
                              <p className="text-xs text-muted-foreground">{t.email}</p>
                            </div>
                          </td>
                          <td className="py-3 hidden md:table-cell">
                            <p className="max-w-[250px] truncate text-muted-foreground">
                              {t.subject}
                            </p>
                          </td>
                          <td className="py-3">
                            <Badge
                              variant="secondary"
                              className={`text-[11px] ${priorityClass[t.priority]}`}
                            >
                              {t.priority}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge variant="outline" className={`text-[11px] gap-1 ${sc.class}`}>
                              <StatusIcon className="h-3 w-3" /> {t.status}
                            </Badge>
                          </td>
                          <td className="py-3 hidden lg:table-cell text-muted-foreground">
                            {new Date(t.createdAt).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Sheet */}
      <Sheet open={!!selectedTicket} onOpenChange={(v) => !v && setSelectedTicket(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedTicket && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedTicket.ticketNumber}
                  <Badge
                    variant="outline"
                    className={`text-[11px] gap-1 ${statusConfig[selectedTicket.status].class}`}
                  >
                    {selectedTicket.status}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`text-[11px] ${priorityClass[selectedTicket.priority]}`}
                  >
                    {selectedTicket.priority}
                  </Badge>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Customer
                  </h4>
                  <p className="text-sm font-medium">{selectedTicket.customer}</p>
                  <p className="text-sm text-muted-foreground">{selectedTicket.email}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Subject
                  </h4>
                  <p className="text-sm font-medium">{selectedTicket.subject}</p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Description
                  </h4>
                  <p className="text-sm">{selectedTicket.description}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Update Status
                  </h4>
                  <div className="flex gap-2">
                    <Select value={sheetStatus} onValueChange={(v) => setSheetStatus(v as TicketStatus)}>
                      <SelectTrigger className="h-9 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => updateTicketStatus(sheetStatus)}
                      disabled={updating}
                      className="h-9"
                    >
                      {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Reply
                  </h4>
                  <Textarea
                    placeholder="Type your response..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="mb-3"
                  />
                  <Button
                    className="w-full gap-2 rounded-xl"
                    onClick={sendReply}
                    disabled={updating || !replyText.trim()}
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Customer Name</Label>
              <Input
                placeholder="Customer name"
                className="mt-1.5"
                value={newCustomer}
                onChange={(e) => setNewCustomer(e.target.value)}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="customer@email.com"
                className="mt-1.5"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                placeholder="Brief issue summary"
                className="mt-1.5"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={newPriority} onValueChange={(v) => setNewPriority(v as TicketPriority)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Detailed description..."
                className="mt-1.5"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <Button className="w-full rounded-xl" onClick={createTicket} disabled={updating}>
              {updating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                "Create Ticket"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
