import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChecklistItem {
  name: string;
  description: string;
  priority: string;
  order_index: number;
}

interface ChecklistGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  universityTargetId: string;
  universityName: string;
  applicationSystem: string;
  onGenerated?: () => void;
}

export function ChecklistGenerationDialog({
  open,
  onOpenChange,
  studentId,
  universityTargetId,
  universityName,
  applicationSystem,
  onGenerated
}: ChecklistGenerationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [templateItems, setTemplateItems] = useState<ChecklistItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open && applicationSystem) {
      fetchTemplate();
    }
  }, [open, applicationSystem]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("items")
        .eq("application_system", applicationSystem)
        .single();

      if (error) throw error;

      if (data && data.items) {
        const items = data.items as unknown as ChecklistItem[];
        setTemplateItems(items);
        // Select all items by default
        setSelectedItems(new Set(items.map((_, idx) => idx)));
      } else {
        toast.error("No template found for this application system");
      }
    } catch (error: any) {
      console.error("Error fetching template:", error);
      toast.error("Failed to load checklist template");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleGenerateChecklist = async () => {
    if (selectedItems.size === 0) {
      toast.error("Please select at least one item");
      return;
    }

    setGenerating(true);
    try {
      // Create the checklist
      const { data: checklist, error: checklistError } = await supabase
        .from("application_checklists")
        .insert({
          student_id: studentId,
          university_target_id: universityTargetId,
          checklist_name: `${universityName} - ${applicationSystem}`,
          description: `Application checklist for ${universityName}`
        })
        .select()
        .single();

      if (checklistError) throw checklistError;

      // Insert selected checklist items
      const itemsToInsert = Array.from(selectedItems)
        .map(idx => templateItems[idx])
        .map(item => ({
          checklist_id: checklist.id,
          item_name: item.name,
          description: item.description,
          priority: item.priority,
          order_index: item.order_index
        }));

      const { error: itemsError } = await supabase
        .from("checklist_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success(`Generated ${selectedItems.size} checklist items for ${universityName}`);
      onOpenChange(false);
      onGenerated?.();
    } catch (error: any) {
      console.error("Error generating checklist:", error);
      toast.error("Failed to generate checklist");
    } finally {
      setGenerating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Generate Application Checklist</DialogTitle>
          <DialogDescription>
            Select items to include in the checklist for {universityName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {selectedItems.size} of {templateItems.length} items selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItems(new Set(templateItems.map((_, idx) => idx)))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItems(new Set())}
                >
                  Deselect All
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {templateItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <Checkbox
                      checked={selectedItems.has(index)}
                      onCheckedChange={() => handleToggleItem(index)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <Badge variant={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={generating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateChecklist}
                disabled={generating || selectedItems.size === 0}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Generate Checklist
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
