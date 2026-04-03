import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Search, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const LOCATION_OPTIONS = [
  "Hong Kong",
  "United Kingdom",
  "United States",
  "Singapore",
  "Australia",
  "Canada",
  "Europe",
  "Online / Remote",
];

const SCHOOL_LOCATION_OPTIONS = [
  "Hong Kong (Day School)",
  "UK Boarding School",
  "US Boarding School",
  "International School (Asia)",
  "International School (Europe)",
  "Local School (Hong Kong)",
  "Other",
];

const ECADiscovery = () => {
  const [subject, setSubject] = useState("");
  const [interests, setInterests] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [studentAge, setStudentAge] = useState("");
  const [schoolLocation, setSchoolLocation] = useState("");
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [selectedOpps, setSelectedOpps] = useState<Set<number>>(new Set());

  const toggleLocation = (location: string) => {
    setPreferredLocations((prev) =>
      prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location]
    );
  };

  const handleDiscover = async () => {
    if (!subject) {
      toast.error("Please enter a subject area");
      return;
    }

    setDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke('discover-eca-opportunities', {
        body: {
          subject,
          interests,
          gradeLevel,
          studentAge,
          schoolLocation,
          preferredLocations,
          additionalRequirements,
        }
      });

      if (error) throw error;

      if (data.success && data.opportunities?.length > 0) {
        setOpportunities(data.opportunities);
        toast.success(`Found ${data.opportunities.length} opportunities!`);
      } else {
        toast.info("No opportunities found. Try different search terms.");
      }
    } catch (error) {
      console.error('Discovery error:', error);
      toast.error("Failed to discover opportunities");
    } finally {
      setDiscovering(false);
    }
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedOpps);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedOpps(newSelected);
  };

  const handleBulkAdd = async () => {
    const selectedOppsList = Array.from(selectedOpps).map(i => opportunities[i]);
    
    if (selectedOppsList.length === 0) {
      toast.error("Please select opportunities to add");
      return;
    }

    try {
      const { error } = await supabase
        .from('eca_opportunities')
        .insert(selectedOppsList);

      if (error) throw error;

      toast.success(`Added ${selectedOppsList.length} opportunities to database`);
      setSelectedOpps(new Set());
      setOpportunities([]);
      setSubject("");
      setInterests("");
      setGradeLevel("");
      setStudentAge("");
      setSchoolLocation("");
      setPreferredLocations([]);
      setAdditionalRequirements("");
    } catch (error) {
      console.error('Bulk add error:', error);
      toast.error("Failed to add opportunities");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI ECA Discovery
          </h1>
          <p className="text-muted-foreground">Discover new opportunities using AI-powered search</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Parameters</CardTitle>
            <CardDescription>Provide student details for more targeted results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Subject Area *</label>
                <Input
                  placeholder="e.g., Computer Science, Biology, Mathematics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Specific Interests</label>
                <Input
                  placeholder="e.g., AI/ML, research, environmental science"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Grade Level</label>
                <Input
                  placeholder="e.g., 9-12, 11"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Student Age</label>
                <Input
                  type="number"
                  placeholder="e.g., 16"
                  value={studentAge}
                  onChange={(e) => setStudentAge(e.target.value)}
                  min={10}
                  max={20}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Current School Location</label>
                <Select value={schoolLocation} onValueChange={setSchoolLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Where does the student study?" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_LOCATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  UK boarding school students may be eligible for additional UK-based programmes
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Preferred Locations</label>
              <div className="flex flex-wrap gap-2">
                {LOCATION_OPTIONS.map((loc) => (
                  <label
                    key={loc}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer text-sm transition-colors ${
                      preferredLocations.includes(loc)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input hover:bg-accent"
                    }`}
                  >
                    <Checkbox
                      checked={preferredLocations.includes(loc)}
                      onCheckedChange={() => toggleLocation(loc)}
                      className="hidden"
                    />
                    {loc}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Additional Requirements</label>
              <Textarea
                placeholder="e.g., Must be free / low-cost, visa sponsorship needed, student has a research paper in progress, student is a UK citizen, preference for team-based activities..."
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleDiscover} 
              disabled={discovering || !subject}
              className="w-full"
            >
              <Search className="mr-2 h-4 w-4" />
              {discovering ? "Discovering..." : "Discover Opportunities"}
            </Button>
          </CardContent>
        </Card>

        {opportunities.length > 0 && (
          <>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {selectedOpps.size} of {opportunities.length} selected
              </p>
              <Button 
                onClick={handleBulkAdd}
                disabled={selectedOpps.size === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Selected to Database
              </Button>
            </div>

            <div className="grid gap-4">
              {opportunities.map((opp, index) => (
                <Card key={index} className="relative">
                  <div className="absolute top-4 right-4">
                    <Checkbox
                      checked={selectedOpps.has(index)}
                      onCheckedChange={() => toggleSelection(index)}
                    />
                  </div>
                  <CardHeader>
                    <div className="space-y-2 pr-12">
                      <CardTitle className="text-lg">{opp.name}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{opp.type}</Badge>
                        {opp.prestige_level && (
                          <Badge variant="outline">{opp.prestige_level}</Badge>
                        )}
                        {opp.subject_areas?.map((subject: string, i: number) => (
                          <Badge key={i} variant="outline">{subject}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {opp.eligibility && (
                      <div>
                        <span className="text-sm font-medium">Eligibility:</span>
                        <p className="text-sm text-muted-foreground">{opp.eligibility}</p>
                      </div>
                    )}
                    {opp.cost && (
                      <div>
                        <span className="text-sm font-medium">Cost:</span>
                        <p className="text-sm text-muted-foreground">{opp.cost}</p>
                      </div>
                    )}
                    {opp.time_commitment && (
                      <div>
                        <span className="text-sm font-medium">Time:</span>
                        <p className="text-sm text-muted-foreground">{opp.time_commitment}</p>
                      </div>
                    )}
                    {opp.deadline_date && (
                      <div>
                        <span className="text-sm font-medium">Deadline:</span>
                        <p className="text-sm text-muted-foreground">{opp.deadline_date}</p>
                      </div>
                    )}
                    {opp.internal_notes && (
                      <div>
                        <span className="text-sm font-medium">Notes:</span>
                        <p className="text-sm text-muted-foreground">{opp.internal_notes}</p>
                      </div>
                    )}
                    {opp.website && (
                      <a
                        href={opp.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit Website
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ECADiscovery;
