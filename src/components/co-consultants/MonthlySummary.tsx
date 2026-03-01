import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface MonthlySummaryProps {
  consultantId: string;
  consultantName: string;
  month: string; // YYYY-MM
  onBack: () => void;
}

interface HourEntry {
  id: string;
  student_id: string;
  work_date: string;
  hours: number;
  hourly_rate: number;
  description: string | null;
  students: { first_name: string; last_name: string; student_id: string } | null;
}

interface StudentSummary {
  studentName: string;
  studentCode: string;
  totalHours: number;
  totalAmount: number;
  entries: HourEntry[];
}

const MonthlySummary = ({ consultantId, consultantName, month, onBack }: MonthlySummaryProps) => {
  const [entries, setEntries] = useState<HourEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, [consultantId, month]);

  const fetchEntries = async () => {
    setLoading(true);
    const startDate = `${month}-01`;
    const endDate = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("co_consultant_hours")
      .select("*, students(first_name, last_name, student_id)")
      .eq("consultant_id", consultantId)
      .gte("work_date", startDate)
      .lte("work_date", endDate)
      .order("work_date");

    if (error) {
      toast.error("Error loading hours");
    } else {
      setEntries((data as any[]) || []);
    }
    setLoading(false);
  };

  const studentSummaries: StudentSummary[] = entries.reduce((acc, entry) => {
    const name = entry.students ? `${entry.students.first_name} ${entry.students.last_name}` : "Unknown";
    const code = entry.students?.student_id || "";
    let existing = acc.find(s => s.studentCode === code);
    if (!existing) {
      existing = { studentName: name, studentCode: code, totalHours: 0, totalAmount: 0, entries: [] };
      acc.push(existing);
    }
    existing.totalHours += Number(entry.hours);
    existing.totalAmount += Number(entry.hours) * Number(entry.hourly_rate);
    existing.entries.push(entry);
    return acc;
  }, [] as StudentSummary[]);

  const grandTotalHours = studentSummaries.reduce((s, r) => s + r.totalHours, 0);
  const grandTotalAmount = studentSummaries.reduce((s, r) => s + r.totalAmount, 0);

  const monthLabel = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const copySummary = () => {
    let text = `Monthly Summary — ${consultantName}\n${monthLabel}\n${"=".repeat(40)}\n\n`;
    studentSummaries.forEach(s => {
      text += `Student: ${s.studentName} (${s.studentCode})\n`;
      s.entries.forEach(e => {
        text += `  ${e.work_date} | ${e.hours}h @ $${Number(e.hourly_rate).toFixed(2)}/h | ${e.description || "—"}\n`;
      });
      text += `  Subtotal: ${s.totalHours}h = $${s.totalAmount.toFixed(2)}\n\n`;
    });
    text += `${"=".repeat(40)}\nGRAND TOTAL: ${grandTotalHours}h = $${grandTotalAmount.toFixed(2)}\n`;
    navigator.clipboard.writeText(text);
    toast.success("Summary copied to clipboard!");
  };

  if (loading) return <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <div>
            <h3 className="font-semibold text-lg">{consultantName}</h3>
            <p className="text-sm text-muted-foreground">{monthLabel} Summary</p>
          </div>
        </div>
        <Button size="sm" onClick={copySummary} className="gap-1"><Copy className="w-4 h-4" /> Copy Summary</Button>
      </div>

      {studentSummaries.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No hours logged for this month.</CardContent></Card>
      ) : (
        studentSummaries.map(summary => (
          <Card key={summary.studentCode}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{summary.studentName} <span className="text-sm text-muted-foreground font-normal">({summary.studentCode})</span></CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.entries.map(e => (
                    <TableRow key={e.id}>
                      <TableCell>{new Date(e.work_date).toLocaleDateString()}</TableCell>
                      <TableCell>{Number(e.hours).toFixed(2)}</TableCell>
                      <TableCell>${Number(e.hourly_rate).toFixed(2)}</TableCell>
                      <TableCell>${(Number(e.hours) * Number(e.hourly_rate)).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.description || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-medium">Subtotal</TableCell>
                    <TableCell className="font-medium">{summary.totalHours.toFixed(2)}h</TableCell>
                    <TableCell />
                    <TableCell className="font-medium">${summary.totalAmount.toFixed(2)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {studentSummaries.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Grand Total</p>
              <p className="text-2xl font-bold">{grandTotalHours.toFixed(2)} hours</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Amount Owed</p>
              <p className="text-2xl font-bold">${grandTotalAmount.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MonthlySummary;
