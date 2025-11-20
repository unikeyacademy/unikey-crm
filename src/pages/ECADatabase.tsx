import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Star, RefreshCw, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { AddECAOpportunityDialog } from "@/components/eca/AddECAOpportunityDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ECADatabase = () => {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [editingOpportunity, setEditingOpportunity] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("eca_opportunities")
      .select("*")
      .order("is_recommended", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load opportunities");
      console.error(error);
    } else {
      setOpportunities(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;

    const { error } = await supabase
      .from("eca_opportunities")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete opportunity");
    } else {
      toast.success("Opportunity deleted");
      fetchOpportunities();
    }
  };

  const toggleRecommended = async (opportunity: any) => {
    const { error } = await supabase
      .from("eca_opportunities")
      .update({ is_recommended: !opportunity.is_recommended })
      .eq("id", opportunity.id);

    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success(opportunity.is_recommended ? "Removed from recommended" : "Marked as recommended");
      fetchOpportunities();
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         opp.type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || opp.type === selectedType;
    return matchesSearch && matchesType;
  });

  const types = ["all", ...new Set(opportunities.map(o => o.type).filter(Boolean))];

  const handleMonitor = async () => {
    setMonitoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('monitor-eca-updates');
      
      if (error) throw error;

      if (data.success) {
        setUpdates(data.updates || []);
        if (data.updates?.length > 0) {
          toast.success(`Found ${data.updates.length} opportunities with changes`);
        } else {
          toast.info("No changes detected in current opportunities");
        }
      }
    } catch (error) {
      console.error('Monitor error:', error);
      toast.error("Failed to monitor opportunities");
    } finally {
      setMonitoring(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-eca-gaps');
      
      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
        toast.success("Analysis complete");
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("Failed to analyze gaps");
    } finally {
      setAnalyzing(false);
    }
  };

  const applyUpdate = async (update: any) => {
    try {
      const { error } = await supabase
        .from('eca_opportunities')
        .update(update.recommended_updates)
        .eq('id', update.id);

      if (error) throw error;

      toast.success("Update applied successfully");
      fetchOpportunities();
      setUpdates(updates.filter(u => u.id !== update.id));
    } catch (error) {
      console.error('Apply update error:', error);
      toast.error("Failed to apply update");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">ECA Opportunity Database</h1>
            <p className="text-muted-foreground">Manage and curate extracurricular opportunities</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleMonitor} disabled={monitoring}>
              <RefreshCw className={`mr-2 h-4 w-4 ${monitoring ? 'animate-spin' : ''}`} />
              {monitoring ? "Monitoring..." : "Monitor Changes"}
            </Button>
            <Button variant="outline" onClick={handleAnalyze} disabled={analyzing}>
              <TrendingUp className="mr-2 h-4 w-4" />
              {analyzing ? "Analyzing..." : "Analyze Gaps"}
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Opportunity
            </Button>
          </div>
        </div>

        <Tabs defaultValue="database" className="space-y-6">
          <TabsList>
            <TabsTrigger value="database">Database</TabsTrigger>
            {updates.length > 0 && (
              <TabsTrigger value="updates">
                Updates ({updates.length})
              </TabsTrigger>
            )}
            {analysis && <TabsTrigger value="analysis">Analysis</TabsTrigger>}
          </TabsList>

          <TabsContent value="database" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {types.map(type => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    onClick={() => setSelectedType(type)}
                    className="capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading opportunities...</div>
            ) : filteredOpportunities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No opportunities found. Add your first one!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOpportunities.map((opp) => (
                  <Card key={opp.id} className="relative">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {opp.name}
                            {opp.is_recommended && (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            )}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{opp.type}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleRecommended(opp)}
                          >
                            <Star className={`h-4 w-4 ${opp.is_recommended ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingOpportunity(opp);
                              setShowAddDialog(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(opp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {opp.subject_areas && opp.subject_areas.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {opp.subject_areas.map((subject: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="space-y-1 text-sm">
                        {opp.prestige_level && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Prestige:</span>
                            <Badge variant="outline">{opp.prestige_level}</Badge>
                          </div>
                        )}
                        {opp.cost && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cost:</span>
                            <span className="font-medium">{opp.cost}</span>
                          </div>
                        )}
                        {opp.time_commitment && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time:</span>
                            <span className="font-medium">{opp.time_commitment}</span>
                          </div>
                        )}
                        {opp.deadline_date && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Deadline:</span>
                            <span className="font-medium">
                              {new Date(opp.deadline_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {opp.website && (
                        <a
                          href={opp.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline block truncate"
                        >
                          {opp.website}
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="updates" className="space-y-4">
            <Alert>
              <AlertDescription>
                These opportunities have detected changes on their websites. Review and apply updates as needed.
              </AlertDescription>
            </Alert>
            {updates.map((update) => (
              <Card key={update.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{update.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {update.changes?.map((change: any, i: number) => (
                    <div key={i} className="border-l-2 border-yellow-500 pl-4">
                      <p className="font-medium capitalize">{change.field}</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="line-through">{change.old_value}</span> → {change.new_value}
                      </p>
                      <p className="text-sm">{change.description}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button onClick={() => applyUpdate(update)}>
                      Apply Updates
                    </Button>
                    <Button variant="outline" onClick={() => setUpdates(updates.filter(u => u.id !== update.id))}>
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {analysis && (
              <>
                {analysis.missing_categories?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Missing Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysis.missing_categories.map((cat: any, i: number) => (
                        <div key={i} className="border-l-2 border-primary pl-4">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{cat.category}</p>
                            <Badge variant={cat.priority === 'high' ? 'destructive' : 'secondary'}>
                              {cat.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{cat.reason}</p>
                          {cat.example_opportunities?.length > 0 && (
                            <p className="text-sm mt-1">
                              Examples: {cat.example_opportunities.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {analysis.underrepresented_subjects?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Underrepresented Subjects</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.underrepresented_subjects.map((subj: any, i: number) => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{subj.subject}</p>
                            <p className="text-sm text-muted-foreground">{subj.student_demand}</p>
                          </div>
                          <Badge variant="outline">
                            Current: {subj.current_count} | Recommended: +{subj.recommended_additions}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {analysis.trending_opportunities?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Trending Opportunities to Add</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysis.trending_opportunities.map((trend: any, i: number) => (
                        <div key={i} className="border-b last:border-0 pb-2 last:pb-0">
                          <p className="font-medium">{trend.name}</p>
                          <p className="text-sm text-muted-foreground">{trend.relevance}</p>
                          <Badge variant="secondary" className="mt-1">{trend.type}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {analysis.geographic_gaps?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Geographic Gaps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.geographic_gaps.map((gap: any, i: number) => (
                        <div key={i}>
                          <p className="font-medium">{gap.region}</p>
                          <p className="text-sm text-muted-foreground">{gap.gap_description}</p>
                          <p className="text-sm mt-1"><strong>Suggested:</strong> {gap.suggested_focus}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {analysis.overall_recommendations?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Strategic Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 list-disc list-inside">
                        {analysis.overall_recommendations.map((rec: string, i: number) => (
                          <li key={i} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddECAOpportunityDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setEditingOpportunity(null);
        }}
        opportunity={editingOpportunity}
        onSuccess={() => {
          fetchOpportunities();
          setShowAddDialog(false);
          setEditingOpportunity(null);
        }}
      />
    </DashboardLayout>
  );
};

export default ECADatabase;