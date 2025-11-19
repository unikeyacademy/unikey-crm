import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { AddECAOpportunityDialog } from "@/components/eca/AddECAOpportunityDialog";

const ECADatabase = () => {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [editingOpportunity, setEditingOpportunity] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

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

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">ECA Opportunity Database</h1>
            <p className="text-muted-foreground">Manage and curate extracurricular opportunities</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Opportunity
          </Button>
        </div>

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
                        <Badge variant={
                          opp.prestige_level === "high" ? "default" : 
                          opp.prestige_level === "medium" ? "secondary" : "outline"
                        }>
                          {opp.prestige_level}
                        </Badge>
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