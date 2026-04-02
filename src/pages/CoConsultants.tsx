import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Clock, DollarSign, Pencil, Filter, X } from "lucide-react";
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
  alevel_subjects?: string | null;
  ib_subjects?: string | null;
  hkdse_subjects?: string | null;
  university_attended?: string | null;
  degree?: string | null;
}

// Normalize subject names to canonical forms
const SUBJECT_ALIASES: Record<string, string> = {
  "math": "Mathematics",
  "maths": "Mathematics",
  "mathematics": "Mathematics",
  "further maths": "Further Mathematics",
  "further mathematics": "Further Mathematics",
  "further math": "Further Mathematics",
  "f. maths": "Further Mathematics",
  "fm": "Further Mathematics",
  "m2": "M2",
  "econ": "Economics",
  "economics": "Economics",
  "bio": "Biology",
  "biology": "Biology",
  "chem": "Chemistry",
  "chemistry": "Chemistry",
  "phy": "Physics",
  "physics": "Physics",
  "eng lit": "English Literature",
  "english literature": "English Literature",
  "english lit": "English Literature",
  "english": "English",
  "english language": "English Language",
  "english lang a": "English Language",
  "english language and literature": "English Language & Literature",
  "history": "History",
  "geography": "Geography",
  "psychology": "Psychology",
  "computer science": "Computer Science",
  "computing": "Computer Science",
  "politics": "Politics",
  "global politics": "Global Politics",
  "philosophy": "Philosophy",
  "japanese": "Japanese",
  "chinese a lit": "Chinese Literature",
  "chinese b sl": "Chinese B",
  "accounting": "Accounting",
  "business": "Business",
  "anthropology": "Anthropology",
  "theory of knowledge": "Theory of Knowledge",
  "ls": "Liberal Studies",
  "epq": "EPQ",
  "science": "Science",
};

function normalizeSubject(raw: string): string {
  const cleaned = raw.trim().replace(/\s*(hl|sl|sl\/hl|hl\/sl|aqa|cie|edexcel|ia)\s*/gi, "").replace(/\s*\(.*?\)\s*/g, "").trim();
  const key = cleaned.toLowerCase();
  return SUBJECT_ALIASES[key] || cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function extractSubjects(text: string | null | undefined): string[] {
  if (!text) return [];
  return text.split(/[,;]+/).map(s => normalizeSubject(s)).filter(s => s.length > 0 && s !== "And");
}

function getProfileSubjects(p: CoConsultantProfile): string[] {
  const all = [
    ...extractSubjects(p.alevel_subjects),
    ...extractSubjects(p.ib_subjects),
    ...extractSubjects(p.hkdse_subjects),
  ];
  return [...new Set(all)];
}

function getProfileCurricula(p: CoConsultantProfile): string[] {
  const curricula: string[] = [];
  if (p.alevel_subjects) curricula.push("A-Level");
  if (p.ib_subjects) curricula.push("IB");
  if (p.hkdse_subjects) curricula.push("HKDSE");
  return curricula;
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

  // Filter state
  const [filterSpecialisation, setFilterSpecialisation] = useState<string>("all");
  const [filterCurriculum, setFilterCurriculum] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");

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

  // Derive filter options from data
  const specialisations = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach(p => { if (p.specialisation) set.add(p.specialisation); });
    return [...set].sort();
  }, [profiles]);

  const curricula = ["A-Level", "IB", "HKDSE"];

  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach(p => getProfileSubjects(p).forEach(s => set.add(s)));
    return [...set].sort();
  }, [profiles]);

  // Apply filters
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      if (filterSpecialisation !== "all" && p.specialisation !== filterSpecialisation) return false;
      if (filterCurriculum !== "all" && !getProfileCurricula(p).includes(filterCurriculum)) return false;
      if (filterSubject !== "all" && !getProfileSubjects(p).includes(filterSubject)) return false;
      return true;
    });
  }, [profiles, filterSpecialisation, filterCurriculum, filterSubject]);

  const hasActiveFilters = filterSpecialisation !== "all" || filterCurriculum !== "all" || filterSubject !== "all";

  const clearFilters = () => {
    setFilterSpecialisation("all");
    setFilterCurriculum("all");
    setFilterSubject("all");
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

  const activeProfiles = filteredProfiles.filter(p => p.is_active);
  const inactiveProfiles = filteredProfiles.filter(p => !p.is_active);

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
            <p className="text-2xl font-bold">{filteredProfiles.reduce((s, c) => s + (c.monthHours || 0), 0).toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="w-4 h-4" /> Total Owed ({monthLabel})</div>
            <p className="text-2xl font-bold">${filteredProfiles.reduce((s, c) => s + (c.monthAmount || 0), 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="w-4 h-4" /> Filters
            </div>
            <Select value={filterSpecialisation} onValueChange={setFilterSpecialisation}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Specialisation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialisations</SelectItem>
                {specialisations.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCurriculum} onValueChange={setFilterCurriculum}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Curriculum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Curricula</SelectItem>
                {curricula.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {allSubjects.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
            {hasActiveFilters && (
              <span className="text-sm text-muted-foreground ml-auto">
                Showing {filteredProfiles.length} of {profiles.length} tutors
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profiles table */}
      <Card>
        <CardHeader><CardTitle>Co-Consultant Profiles</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-muted-foreground text-sm">Loading...</p></div>
          ) : filteredProfiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {hasActiveFilters ? "No co-consultants match the selected filters." : "No co-consultants yet. Click \"Add Co-Consultant\" to create one."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>University / Degree</TableHead>
                  <TableHead>Specialisation</TableHead>
                  <TableHead>A-Level Subjects</TableHead>
                  <TableHead>IB Subjects</TableHead>
                  <TableHead>HKDSE Subjects</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...activeProfiles, ...inactiveProfiles].map(c => (
                  <TableRow key={c.id} className={!c.is_active ? "opacity-50" : ""}>
                    <TableCell className="font-medium whitespace-nowrap">{c.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                      {c.university_attended && <div className="truncate" title={c.university_attended}>{c.university_attended}</div>}
                      {c.degree && <div className="truncate text-xs" title={c.degree}>{c.degree}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.specialisation || "—"}</TableCell>
                    <TableCell className="text-sm max-w-[150px]">
                      {c.alevel_subjects ? <span className="truncate block" title={c.alevel_subjects}>{c.alevel_subjects}</span> : "—"}
                    </TableCell>
                    <TableCell className="text-sm max-w-[150px]">
                      {c.ib_subjects ? <span className="truncate block" title={c.ib_subjects}>{c.ib_subjects}</span> : "—"}
                    </TableCell>
                    <TableCell className="text-sm max-w-[150px]">
                      {c.hkdse_subjects ? <span className="truncate block" title={c.hkdse_subjects}>{c.hkdse_subjects}</span> : "—"}
                    </TableCell>
                    <TableCell>${Number(c.default_hourly_rate).toFixed(2)}/h</TableCell>
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
