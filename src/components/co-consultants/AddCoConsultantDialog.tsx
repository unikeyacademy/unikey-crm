import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface AddCoConsultantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editProfile?: any | null;
}

const AddCoConsultantDialog = ({ open, onOpenChange, onSuccess, editProfile }: AddCoConsultantDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    default_hourly_rate: "",
    specialisation: "",
    contract_start_date: "",
    contract_end_date: "",
    payment_terms: "",
    bank_details: "",
    notes: "",
    is_active: true,
  });

  useEffect(() => {
    if (editProfile) {
      setForm({
        full_name: editProfile.full_name || "",
        email: editProfile.email || "",
        phone: editProfile.phone || "",
        default_hourly_rate: editProfile.default_hourly_rate?.toString() || "",
        specialisation: editProfile.specialisation || "",
        contract_start_date: editProfile.contract_start_date || "",
        contract_end_date: editProfile.contract_end_date || "",
        payment_terms: editProfile.payment_terms || "",
        bank_details: editProfile.bank_details || "",
        notes: editProfile.notes || "",
        is_active: editProfile.is_active ?? true,
      });
    } else {
      setForm({
        full_name: "", email: "", phone: "", default_hourly_rate: "",
        specialisation: "", contract_start_date: "", contract_end_date: "",
        payment_terms: "", bank_details: "", notes: "", is_active: true,
      });
    }
  }, [editProfile, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        default_hourly_rate: parseFloat(form.default_hourly_rate || "0"),
        specialisation: form.specialisation || null,
        contract_start_date: form.contract_start_date || null,
        contract_end_date: form.contract_end_date || null,
        payment_terms: form.payment_terms || null,
        bank_details: form.bank_details || null,
        notes: form.notes || null,
        is_active: form.is_active,
      };

      if (editProfile) {
        const { error } = await supabase.from("co_consultant_profiles").update(payload).eq("id", editProfile.id);
        if (error) throw error;
        toast.success("Co-consultant updated!");
      } else {
        const { error } = await supabase.from("co_consultant_profiles").insert([payload]);
        if (error) throw error;
        toast.success("Co-consultant added!");
      }
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editProfile ? "Edit Co-Consultant" : "Add Co-Consultant"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+852 1234 5678" />
            </div>
            <div className="space-y-2">
              <Label>Default Hourly Rate ($)</Label>
              <Input type="number" step="0.01" value={form.default_hourly_rate} onChange={e => setForm({ ...form, default_hourly_rate: e.target.value })} placeholder="50.00" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Specialisation / Expertise</Label>
            <Input value={form.specialisation} onChange={e => setForm({ ...form, specialisation: e.target.value })} placeholder="e.g., US admissions, essay coaching, interview prep" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contract Start Date</Label>
              <Input type="date" value={form.contract_start_date} onChange={e => setForm({ ...form, contract_start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contract End Date</Label>
              <Input type="date" value={form.contract_end_date} onChange={e => setForm({ ...form, contract_end_date: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Terms</Label>
            <Input value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} placeholder="e.g., Net 30, paid monthly" />
          </div>

          <div className="space-y-2">
            <Label>Bank Details</Label>
            <Textarea rows={2} value={form.bank_details} onChange={e => setForm({ ...form, bank_details: e.target.value })} placeholder="Bank name, account number, routing..." />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            <Label>Active</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : editProfile ? "Update" : "Add Co-Consultant"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCoConsultantDialog;
