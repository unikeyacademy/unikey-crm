import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Clock, DollarSign, Pencil } from "lucide-react";
import LogHoursDialog from "@/components/co-consultants/LogHoursDialog";
import MonthlySummary from "@/components/co-consultants/MonthlySummary";
import AddCoConsultantDialog from "@/components/co-consultants/AddCoConsultantDialog";

interface CoConsultantProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  default_hourly_rate: number;
  specialisation: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  payment_terms: string | null;
  bank_details: string | null;
  notes: string | null;
  is_active: boolean;
  monthHours?: number;
  monthAmount?: number;
}

const CoConsultants = () => {
  const [profiles, setProfiles] = useState<CoConsultantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<CoConsultantProfile | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedConsultant, setSelectedConsultant] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => { fetchData(); }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from("co_consultant_profiles")
        .select("*")
        .order("full_name");

      if (!profileData || profileData.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Get hours for selected month
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(parseInt(selectedMonth.split("-")[0]), parseInt(selectedMonth.split("-")[1]), 0).toISOString().split("T")[0];

      const { data: hours } = await supabase
        .from("co_consultant_hours")
        .select("co_consultant_profile_id, hours, hourly_rate")
        .not("co_consultant_profile_id", "is", null)
        .gte("work_date", startDate)
        .lte("work_date", endDate);

      const hourSums: Record<string, { hours: number; amount: number }> = {};
      (hours || []).forEach(h => {
        const pid = h.co_consultant_profile_id as string;
        if (!pid) return;
        if (!hourSums[pid]) hourSums[pid] = { hours: 0, amount: 0 };
        hourSums[pid].hours += Number(h.hours);
        hourSums[pid].amount += Number(h.hours) * Number(h.hourly_rate);
      });

      const result: CoConsultantProfile[] = (profileData as any[]).map(p => ({
        ...p,
        monthHours: hourSums[p.id]?.hours || 0,
        monthAmount: hourSums[p.id]?.amount || 0,
      }));

      setProfiles(result);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const monthLabel = new Date(parseInt(selectedMonth.split("-")[0]), parseInt(selectedMonth.split("-")[1]) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (selectedConsultant) {
    return (
      <MonthlySummary
        consultantId={selectedConsultant.id}
        consultantName={selectedConsultant.name}
        month={selectedMonth}
        onBack={() => setSelectedConsultant(null)}
      />
    );
  }

  const activeProfiles = profiles.filter(p => p.is_active);
  const inactiveProfiles = profiles.filter(p => !p.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Co-Consultants</h1>
          <p className="text-muted-foreground">Manage contractor profiles, hours, and monthly payments</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-44" />
          <Button variant="outline" onClick={() => setLogOpen(true)} className="gap-1"><Clock className="w-4 h-4" /> Log Hours</Button>
          <Button onClick={() => { setEditProfile(null); setAddOpen(true); }} className="gap-1"><Plus className="w-4 h-4" /> Add Co-Consultant</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Users className="w-4 h-4" /> Active Co-Consultants</div>
            <p className="text-2xl font-bold">{activeProfiles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Clock className="w-4 h-4" /> Total Hours ({monthLabel})</div>
            <p className="text-2xl font-bold">{profiles.reduce((s, c) => s + (c.monthHours || 0), 0).toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="w-4 h-4" /> Total Owed ({monthLabel})</div>
            <p className="text-2xl font-bold">${profiles.reduce((s, c) => s + (c.monthAmount || 0), 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Profiles table */}
      <Card>
        <CardHeader><CardTitle>Co-Consultant Profiles</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-muted-foreground text-sm">Loading...</p></div>
          ) : profiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No co-consultants yet. Click "Add Co-Consultant" to create one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Specialisation</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Hours ({monthLabel})</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...activeProfiles, ...inactiveProfiles].map(c => (
                  <TableRow key={c.id} className={!c.is_active ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{c.full_name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.specialisation || "—"}</TableCell>
                    <TableCell>${Number(c.default_hourly_rate).toFixed(2)}/h</TableCell>
                    <TableCell>{(c.monthHours || 0).toFixed(1)}h</TableCell>
                    <TableCell className="font-medium">${(c.monthAmount || 0).toFixed(2)}</TableCell>
                    <TableCell><Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditProfile(c); setAddOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedConsultant({ id: c.id, name: c.full_name })}>Summary</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LogHoursDialog open={logOpen} onOpenChange={setLogOpen} onSuccess={fetchData} />
      <AddCoConsultantDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={fetchData} editProfile={editProfile} />
    </div>
  );
};

export default CoConsultants;
