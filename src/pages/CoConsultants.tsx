import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Clock, DollarSign } from "lucide-react";
import LogHoursDialog from "@/components/co-consultants/LogHoursDialog";
import MonthlySummary from "@/components/co-consultants/MonthlySummary";

interface CoConsultant {
  id: string;
  full_name: string | null;
  email: string;
  studentCount: number;
  monthHours: number;
  monthAmount: number;
}

const CoConsultants = () => {
  const [consultants, setConsultants] = useState<CoConsultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedConsultant, setSelectedConsultant] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => { fetchConsultants(); }, [selectedMonth]);

  const fetchConsultants = async () => {
    setLoading(true);
    try {
      // Get students with secondary_consultant_id set
      const { data: students } = await supabase
        .from("students")
        .select("secondary_consultant_id")
        .not("secondary_consultant_id", "is", null);

      const consultantIds = [...new Set((students || []).map(s => s.secondary_consultant_id).filter(Boolean))] as string[];

      if (consultantIds.length === 0) {
        setConsultants([]);
        setLoading(false);
        return;
      }

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", consultantIds);

      // Get hours for selected month
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(parseInt(selectedMonth.split("-")[0]), parseInt(selectedMonth.split("-")[1]), 0).toISOString().split("T")[0];

      const { data: hours } = await supabase
        .from("co_consultant_hours")
        .select("consultant_id, hours, hourly_rate")
        .in("consultant_id", consultantIds)
        .gte("work_date", startDate)
        .lte("work_date", endDate);

      // Count students per consultant
      const studentCounts: Record<string, number> = {};
      (students || []).forEach(s => {
        const cid = s.secondary_consultant_id as string;
        studentCounts[cid] = (studentCounts[cid] || 0) + 1;
      });

      // Sum hours per consultant
      const hourSums: Record<string, { hours: number; amount: number }> = {};
      (hours || []).forEach(h => {
        if (!hourSums[h.consultant_id]) hourSums[h.consultant_id] = { hours: 0, amount: 0 };
        hourSums[h.consultant_id].hours += Number(h.hours);
        hourSums[h.consultant_id].amount += Number(h.hours) * Number(h.hourly_rate);
      });

      const result: CoConsultant[] = (profiles || []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        studentCount: studentCounts[p.id] || 0,
        monthHours: hourSums[p.id]?.hours || 0,
        monthAmount: hourSums[p.id]?.amount || 0,
      }));

      setConsultants(result);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const monthLabel = new Date(parseInt(selectedMonth.split("-")[0]), parseInt(selectedMonth.split("-")[1]) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (selectedConsultant) {
    return (
      <div>
        <MonthlySummary
          consultantId={selectedConsultant.id}
          consultantName={selectedConsultant.name}
          month={selectedMonth}
          onBack={() => setSelectedConsultant(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Co-Consultants</h1>
          <p className="text-muted-foreground">Manage contractor hours and monthly payments</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-44" />
          <Button onClick={() => setLogOpen(true)} className="gap-1"><Plus className="w-4 h-4" /> Log Hours</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Users className="w-4 h-4" /> Co-Consultants</div>
            <p className="text-2xl font-bold">{consultants.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Clock className="w-4 h-4" /> Total Hours ({monthLabel})</div>
            <p className="text-2xl font-bold">{consultants.reduce((s, c) => s + c.monthHours, 0).toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="w-4 h-4" /> Total Owed ({monthLabel})</div>
            <p className="text-2xl font-bold">${consultants.reduce((s, c) => s + c.monthAmount, 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Consultant list */}
      <Card>
        <CardHeader><CardTitle>Co-Consultant Overview</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-muted-foreground text-sm">Loading...</p></div>
          ) : consultants.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No co-consultants found. Assign a secondary consultant to a student to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Hours ({monthLabel})</TableHead>
                  <TableHead>Amount Owed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultants.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.full_name || "—"}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell><Badge variant="secondary">{c.studentCount}</Badge></TableCell>
                    <TableCell>{c.monthHours.toFixed(1)}h</TableCell>
                    <TableCell className="font-medium">${c.monthAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setSelectedConsultant({ id: c.id, name: c.full_name || c.email })}>
                        View Summary
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LogHoursDialog open={logOpen} onOpenChange={setLogOpen} onSuccess={fetchConsultants} />
    </div>
  );
};

export default CoConsultants;
