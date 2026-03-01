import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, DollarSign, Package, CreditCard, Clock } from "lucide-react";
import { toast } from "sonner";

interface StudentPackage {
  id: string;
  package_type: string;
  package_name: string;
  price: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  contract_type: string | null;
  status: string;
  notes: string | null;
}

interface Payment {
  id: string;
  package_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_type: string;
  payment_method: string | null;
  status: string;
  invoice_ref: string | null;
  notes: string | null;
}

interface StudentFinancialsTabProps {
  studentId: string;
}

interface CoConsultantHour {
  id: string;
  consultant_id: string;
  work_date: string;
  hours: number;
  hourly_rate: number;
  description: string | null;
  profiles: { full_name: string | null; email: string } | null;
}

const StudentFinancialsTab = ({ studentId }: StudentFinancialsTabProps) => {
  const [packages, setPackages] = useState<StudentPackage[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [coHours, setCoHours] = useState<CoConsultantHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [addPkgOpen, setAddPkgOpen] = useState(false);
  const [addPayOpen, setAddPayOpen] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState("");
  const [pkgForm, setPkgForm] = useState({ package_type: "", package_name: "", price: "", currency: "USD", start_date: "", end_date: "", contract_type: "", status: "active", notes: "" });
  const [payForm, setPayForm] = useState({ amount: "", currency: "USD", payment_date: "", payment_type: "installment", payment_method: "", status: "pending", invoice_ref: "", notes: "" });

  useEffect(() => { fetchData(); }, [studentId]);

  const fetchData = async () => {
    try {
      const [pkgRes, payRes, hoursRes] = await Promise.all([
        supabase.from("student_packages").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
        supabase.from("payments").select("*").eq("student_id", studentId).order("payment_date", { ascending: false }),
        supabase.from("co_consultant_hours").select("*, profiles(full_name, email)").eq("student_id", studentId).order("work_date", { ascending: false }),
      ]);
      if (pkgRes.error) throw pkgRes.error;
      if (payRes.error) throw payRes.error;
      setPackages(pkgRes.data || []);
      setPayments(payRes.data || []);
      setCoHours((hoursRes.data as any[]) || []);
    } catch (e: any) {
      toast.error("Error loading financial data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("student_packages").insert([{
        student_id: studentId,
        package_type: pkgForm.package_type,
        package_name: pkgForm.package_name,
        price: parseFloat(pkgForm.price),
        currency: pkgForm.currency,
        start_date: pkgForm.start_date || null,
        end_date: pkgForm.end_date || null,
        contract_type: pkgForm.contract_type || null,
        status: pkgForm.status,
        notes: pkgForm.notes || null,
      }]);
      if (error) throw error;
      toast.success("Package added!");
      setAddPkgOpen(false);
      setPkgForm({ package_type: "", package_name: "", price: "", currency: "USD", start_date: "", end_date: "", contract_type: "", status: "active", notes: "" });
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("payments").insert([{
        package_id: selectedPkgId,
        student_id: studentId,
        amount: parseFloat(payForm.amount),
        currency: payForm.currency,
        payment_date: payForm.payment_date,
        payment_type: payForm.payment_type,
        payment_method: payForm.payment_method || null,
        status: payForm.status,
        invoice_ref: payForm.invoice_ref || null,
        notes: payForm.notes || null,
      }]);
      if (error) throw error;
      toast.success("Payment recorded!");
      setAddPayOpen(false);
      setPayForm({ amount: "", currency: "USD", payment_date: "", payment_type: "installment", payment_method: "", status: "pending", invoice_ref: "", notes: "" });
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const totalPrice = packages.reduce((sum, p) => sum + Number(p.price), 0);
  const totalPaid = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);
  const outstanding = totalPrice - totalPaid;

  if (loading) {
    return <Card><CardContent className="py-12 text-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-muted-foreground">Loading financials...</p></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Package className="w-4 h-4" /> Total Value</div>
            <p className="text-2xl font-bold">${totalPrice.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><CreditCard className="w-4 h-4" /> Paid</div>
            <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="w-4 h-4" /> Outstanding</div>
            <p className={`text-2xl font-bold ${outstanding > 0 ? "text-destructive" : ""}`}>${outstanding.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Packages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Service Packages</CardTitle>
          <Dialog open={addPkgOpen} onOpenChange={setAddPkgOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Add Package</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Service Package</DialogTitle></DialogHeader>
              <form onSubmit={handleAddPackage} className="space-y-4">
                <div className="space-y-2"><Label>Package Name *</Label><Input required value={pkgForm.package_name} onChange={e => setPkgForm({ ...pkgForm, package_name: e.target.value })} placeholder="e.g., Premium US+UK Package" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Type *</Label>
                    <Select value={pkgForm.package_type} onValueChange={v => setPkgForm({ ...pkgForm, package_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                        <SelectItem value="US Only">US Only</SelectItem>
                        <SelectItem value="UK Only">UK Only</SelectItem>
                        <SelectItem value="Dual">Dual (US+UK)</SelectItem>
                        <SelectItem value="Essay Only">Essay Only</SelectItem>
                        <SelectItem value="Hourly">Hourly Consulting</SelectItem>
                        <SelectItem value="Add-On">Add-On Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Price *</Label><Input required type="number" step="0.01" value={pkgForm.price} onChange={e => setPkgForm({ ...pkgForm, price: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={pkgForm.start_date} onChange={e => setPkgForm({ ...pkgForm, start_date: e.target.value })} /></div>
                  <div className="space-y-2"><Label>End Date</Label><Input type="date" value={pkgForm.end_date} onChange={e => setPkgForm({ ...pkgForm, end_date: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Contract Type</Label>
                    <Select value={pkgForm.contract_type} onValueChange={v => setPkgForm({ ...pkgForm, contract_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fixed">Fixed</SelectItem>
                        <SelectItem value="Retainer">Retainer</SelectItem>
                        <SelectItem value="Hourly">Hourly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Status</Label>
                    <Select value={pkgForm.status} onValueChange={v => setPkgForm({ ...pkgForm, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea rows={2} value={pkgForm.notes} onChange={e => setPkgForm({ ...pkgForm, notes: e.target.value })} /></div>
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAddPkgOpen(false)}>Cancel</Button><Button type="submit">Add Package</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No packages yet.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Package</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead><TableHead>Contract</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {packages.map(pkg => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.package_name}</TableCell>
                    <TableCell>{pkg.package_type}</TableCell>
                    <TableCell>${Number(pkg.price).toLocaleString()}</TableCell>
                    <TableCell>{pkg.contract_type || "—"}</TableCell>
                    <TableCell className="text-xs">{pkg.start_date ? new Date(pkg.start_date).toLocaleDateString() : "—"} — {pkg.end_date ? new Date(pkg.end_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell><Badge variant={pkg.status === "active" ? "default" : "secondary"}>{pkg.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Payments</CardTitle>
          <Dialog open={addPayOpen} onOpenChange={setAddPayOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-1" disabled={packages.length === 0}><Plus className="w-4 h-4" /> Record Payment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="space-y-2"><Label>Package *</Label>
                  <Select value={selectedPkgId} onValueChange={setSelectedPkgId}>
                    <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                    <SelectContent>{packages.map(p => <SelectItem key={p.id} value={p.id}>{p.package_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Amount *</Label><Input required type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Date *</Label><Input required type="date" value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Type</Label>
                    <Select value={payForm.payment_type} onValueChange={v => setPayForm({ ...payForm, payment_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">Deposit</SelectItem>
                        <SelectItem value="installment">Installment</SelectItem>
                        <SelectItem value="final">Final Payment</SelectItem>
                        <SelectItem value="refund">Refund</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Status</Label>
                    <Select value={payForm.status} onValueChange={v => setPayForm({ ...payForm, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Method</Label><Input value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })} placeholder="e.g., Bank transfer" /></div>
                  <div className="space-y-2"><Label>Invoice Ref</Label><Input value={payForm.invoice_ref} onChange={e => setPayForm({ ...payForm, invoice_ref: e.target.value })} placeholder="INV-001" /></div>
                </div>
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAddPayOpen(false)}>Cancel</Button><Button type="submit" disabled={!selectedPkgId}>Record</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No payments recorded yet.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Type</TableHead><TableHead>Method</TableHead><TableHead>Invoice</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {payments.map(pay => (
                  <TableRow key={pay.id}>
                    <TableCell>{new Date(pay.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">${Number(pay.amount).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{pay.payment_type}</TableCell>
                    <TableCell>{pay.payment_method || "—"}</TableCell>
                    <TableCell>{pay.invoice_ref || "—"}</TableCell>
                    <TableCell><Badge variant={pay.status === "paid" ? "default" : pay.status === "overdue" ? "destructive" : "secondary"}>{pay.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* Co-Consultant Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5" /> Co-Consultant Hours</CardTitle>
        </CardHeader>
        <CardContent>
          {coHours.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No co-consultant hours logged for this student.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Consultant</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coHours.map(h => (
                  <TableRow key={h.id}>
                    <TableCell>{new Date(h.work_date).toLocaleDateString()}</TableCell>
                    <TableCell>{h.profiles?.full_name || h.profiles?.email || "—"}</TableCell>
                    <TableCell>{Number(h.hours).toFixed(2)}</TableCell>
                    <TableCell>${Number(h.hourly_rate).toFixed(2)}</TableCell>
                    <TableCell className="font-medium">${(Number(h.hours) * Number(h.hourly_rate)).toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{h.description || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFinancialsTab;
