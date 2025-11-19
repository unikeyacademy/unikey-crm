import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddChecklistDialog from "@/components/checklists/AddChecklistDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChecklistItem {
  id: string;
  item_name: string;
  description: string | null;
  is_completed: boolean;
  priority: string | null;
  due_date: string | null;
}

interface Checklist {
  id: string;
  checklist_name: string;
  description: string | null;
  items: ChecklistItem[];
}

interface StudentChecklistsTabProps {
  studentId: string;
}

const StudentChecklistsTab = ({ studentId }: StudentChecklistsTabProps) => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState<Record<string, string>>({});
  const [convertingItem, setConvertingItem] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const { toast } = useToast();

  const fetchChecklists = async () => {
    try {
      const { data: checklistsData, error: checklistsError } = await supabase
        .from('application_checklists')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (checklistsError) throw checklistsError;

      const checklistsWithItems = await Promise.all(
        (checklistsData || []).map(async (checklist) => {
          const { data: itemsData } = await supabase
            .from('checklist_items')
            .select('*')
            .eq('checklist_id', checklist.id)
            .order('order_index', { ascending: true });

          return {
            ...checklist,
            items: itemsData || [],
          };
        })
      );

      setChecklists(checklistsWithItems);
    } catch (error: any) {
      toast({
        title: "Error fetching checklists",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, [studentId]);

  const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('checklist_items')
        .update({
          is_completed: !isCompleted,
          completed_date: !isCompleted ? new Date().toISOString() : null,
          completed_by: !isCompleted ? user?.id : null,
        })
        .eq('id', itemId);

      if (error) throw error;
      fetchChecklists();
    } catch (error: any) {
      toast({
        title: "Error updating item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddItem = async (checklistId: string) => {
    const itemName = newItemName[checklistId]?.trim();
    if (!itemName) return;

    try {
      const { error } = await supabase.from('checklist_items').insert({
        checklist_id: checklistId,
        item_name: itemName,
      });

      if (error) throw error;

      setNewItemName({ ...newItemName, [checklistId]: "" });
      fetchChecklists();
    } catch (error: any) {
      toast({
        title: "Error adding item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;
    const colors: Record<string, string> = {
      high: "bg-red-500",
      medium: "bg-yellow-500",
      low: "bg-green-500",
    };
    return <Badge className={colors[priority]}>{priority}</Badge>;
  };

  const handleConvertToTask = async () => {
    if (!selectedItem) return;

    setConvertingItem(selectedItem.id);
    try {
      const { error } = await supabase
        .from("tasks")
        .insert({
          student_id: studentId,
          title: selectedItem.item_name,
          description: selectedItem.description,
          priority: selectedItem.priority || "medium",
          due_date: selectedItem.due_date,
          status: "pending",
          task_type: "application"
        });

      if (error) throw error;

      toast({
        title: "Converted to task",
        description: "Checklist item converted to task successfully",
      });
      setSelectedItem(null);
    } catch (error: any) {
      toast({
        title: "Error converting to task",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setConvertingItem(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Application Checklists</h3>
        <AddChecklistDialog studentId={studentId} onChecklistAdded={fetchChecklists} />
      </div>

      {checklists.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            No checklists created yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {checklists.map((checklist) => {
            const completedCount = checklist.items.filter((item) => item.is_completed).length;
            const totalCount = checklist.items.length;

            return (
              <Card key={checklist.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{checklist.checklist_name}</CardTitle>
                    <Badge variant="outline">
                      {completedCount} / {totalCount} completed
                    </Badge>
                  </div>
                  {checklist.description && (
                    <p className="text-sm text-muted-foreground">{checklist.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                   {checklist.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <Checkbox
                        checked={item.is_completed}
                        onCheckedChange={() => handleToggleItem(item.id, item.is_completed)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={item.is_completed ? "line-through text-muted-foreground" : ""}>
                            {item.item_name}
                          </span>
                          {getPriorityBadge(item.priority)}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                        disabled={convertingItem === item.id}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Convert to Task
                      </Button>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Add new item..."
                      value={newItemName[checklist.id] || ""}
                      onChange={(e) =>
                        setNewItemName({ ...newItemName, [checklist.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddItem(checklist.id);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddItem(checklist.id)}
                      disabled={!newItemName[checklist.id]?.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new task from the checklist item "{selectedItem?.item_name}". 
              The checklist item will remain in the checklist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvertToTask}>
              Convert to Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentChecklistsTab;
