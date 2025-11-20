import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lightbulb, ExternalLink, Plus, ThumbsUp, ThumbsDown, Loader2, Database, Sparkles, Save } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ECASuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  onECAAdded?: () => void;
}

export const ECASuggestionsDialog = ({
  open,
  onOpenChange,
  studentId,
  studentName,
  onECAAdded
}: ECASuggestionsDialogProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState<string | null>(null);
  const [databaseCount, setDatabaseCount] = useState(0);
  const [aiGeneratedCount, setAiGeneratedCount] = useState(0);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-ecas", {
        body: { studentId }
      });

      if (error) {
        if (error.message?.includes("429") || error.message?.includes("Rate limit")) {
          toast.error("Rate limit exceeded. Please try again in a moment.");
        } else if (error.message?.includes("402") || error.message?.includes("credits")) {
          toast.error("AI credits exhausted. Please add credits to your workspace.");
        } else {
          toast.error("Failed to generate suggestions");
        }
        console.error(error);
        return;
      }

      setSuggestions(data.suggestions || []);
      setDatabaseCount(data.database_count || 0);
      setAiGeneratedCount(data.ai_generated_count || 0);
      
      if (data.suggestions?.length === 0) {
        if (data.message) {
          toast.info(data.message);
        } else {
          toast.info("No suitable opportunities found at this time");
        }
      } else {
        const dbMsg = data.database_count ? `${data.database_count} from database` : "";
        const aiMsg = data.ai_generated_count ? `${data.ai_generated_count} AI-discovered` : "";
        const parts = [dbMsg, aiMsg].filter(Boolean);
        toast.success(`Found ${data.suggestions.length} recommendations (${parts.join(", ")})`);
      }
    } catch (error: any) {
      toast.error("Failed to fetch suggestions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToProfile = async (suggestion: any) => {
    const oppId = suggestion.opportunity.id || suggestion.opportunity.name;
    setLoadingAdd(oppId);
    
    try {
      const { error } = await supabase.from("student_ecas").insert([{
        student_id: studentId,
        eca_name: suggestion.opportunity.name,
        eca_type: suggestion.opportunity.type,
        description: `${suggestion.reasoning}\n\nKey Benefits:\n${suggestion.key_benefits?.join("\n")}`,
        status: "planning",
      }]);

      if (error) throw error;

      toast.success(`Added ${suggestion.opportunity.name} to student profile`);
      if (onECAAdded) onECAAdded();
      
      // Create task reminder
      await supabase.from("tasks").insert([{
        title: `Research ${suggestion.opportunity.name}`,
        description: suggestion.action_items?.join("\n") || "Research requirements and deadlines",
        student_id: studentId,
        task_type: "ECA Planning",
        priority: "medium",
        status: "pending",
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
      }]);
    } catch (error: any) {
      toast.error("Failed to add ECA");
      console.error(error);
    } finally {
      setLoadingAdd(null);
    }
  };

  const handleSaveAndAddToProfile = async (suggestion: any) => {
    const oppId = suggestion.opportunity.name;
    setLoadingAdd(oppId);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // First, save to eca_opportunities database
      const { data: newOpp, error: oppError } = await supabase
        .from("eca_opportunities")
        .insert([{
          name: suggestion.opportunity.name,
          type: suggestion.opportunity.type,
          subject_areas: suggestion.opportunity.subject_areas || [],
          eligibility: suggestion.opportunity.eligibility,
          time_commitment: suggestion.opportunity.time_commitment,
          cost: suggestion.opportunity.cost,
          prestige_level: suggestion.opportunity.prestige_level,
          deadline_type: suggestion.opportunity.deadline_type,
          deadline_date: suggestion.opportunity.deadline_date,
          website: suggestion.opportunity.website,
          is_active: true,
          is_recommended: false,
          created_by: user.id,
          internal_notes: `AI-discovered opportunity. ${suggestion.reasoning}`
        }])
        .select()
        .single();

      if (oppError) throw oppError;

      // Then add to student profile
      const { error: ecaError } = await supabase.from("student_ecas").insert([{
        student_id: studentId,
        eca_name: suggestion.opportunity.name,
        eca_type: suggestion.opportunity.type,
        description: `${suggestion.reasoning}\n\nKey Benefits:\n${suggestion.key_benefits?.join("\n")}`,
        status: "planning",
      }]);

      if (ecaError) throw ecaError;

      toast.success(`Added ${suggestion.opportunity.name} to database and student profile`);
      if (onECAAdded) onECAAdded();
      
      // Create task reminder
      await supabase.from("tasks").insert([{
        title: `Research ${suggestion.opportunity.name}`,
        description: suggestion.action_items?.join("\n") || "Research requirements and deadlines",
        student_id: studentId,
        task_type: "ECA Planning",
        priority: "medium",
        status: "pending",
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      }]);
    } catch (error: any) {
      toast.error("Failed to save ECA");
      console.error(error);
    } finally {
      setLoadingAdd(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            ECA Suggestions for {studentName}
          </DialogTitle>
        </DialogHeader>

        {!loading && suggestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Click below to get AI-powered ECA suggestions tailored to {studentName}'s profile
            </p>
            <Button onClick={fetchSuggestions}>
              <Lightbulb className="mr-2 h-4 w-4" />
              Generate Suggestions
            </Button>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4">Analyzing student profile and discovering opportunities...</p>
          </div>
        ) : (
          <>
            {(databaseCount > 0 || aiGeneratedCount > 0) && (
              <div className="flex gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                {databaseCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">{databaseCount} from your database</span>
                  </div>
                )}
                {aiGeneratedCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">{aiGeneratedCount} AI-discovered</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {suggestions.map((suggestion, index) => {
                const opp = suggestion.opportunity;
                return (
                  <Card key={index} className="border-2">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-3">
                            {opp.name}
                            <Badge variant={
                              suggestion.fit_score >= 8 ? "default" :
                              suggestion.fit_score >= 6 ? "secondary" : "outline"
                            }>
                              Fit: {suggestion.fit_score}/10
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {opp.type} • {opp.prestige_level} prestige
                          </p>
                        </div>
                        <Button
                          onClick={() => handleAddToProfile(suggestion)}
                          disabled={loadingAdd === opp.id}
                          size="sm"
                        >
                          {loadingAdd === opp.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Add to Profile
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Why This Fits:</h4>
                        <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                      </div>

                      {suggestion.key_benefits && suggestion.key_benefits.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <ThumbsUp className="h-4 w-4" />
                            Key Benefits:
                          </h4>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            {suggestion.key_benefits.map((benefit: string, i: number) => (
                              <li key={i}>✓ {benefit}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="space-y-1 text-sm">
                          {opp.subject_areas?.length > 0 && (
                            <div>
                              <span className="text-muted-foreground">Subjects:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {opp.subject_areas.map((subject: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {subject}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-right">
                          {opp.cost && (
                            <div>
                              <span className="text-muted-foreground">Cost: </span>
                              <span className="font-medium">{opp.cost}</span>
                            </div>
                          )}
                          {opp.time_commitment && (
                            <div>
                              <span className="text-muted-foreground">Time: </span>
                              <span className="font-medium">{opp.time_commitment}</span>
                            </div>
                          )}
                          {opp.deadline_date && (
                            <div>
                              <span className="text-muted-foreground">Deadline: </span>
                              <span className="font-medium">
                                {new Date(opp.deadline_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {opp.website && (
                        <a
                          href={opp.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          View Official Website
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};