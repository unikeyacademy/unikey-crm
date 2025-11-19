import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Edit3 } from "lucide-react";
import StageChangeDialog from "./StageChangeDialog";

interface EditStageDialogProps {
  studentId: string;
  studentName: string;
  currentStage: string;
  onStageChanged: () => void;
}

const stageOptions = [
  "Initial Consultation",
  "Kickoff / Year 1",
  "Year 2",
  "Year 3 Pre-Application",
  "Application Season",
  "Post-Application",
  "Offer Evaluation",
  "Pre-Departure",
  "Alumni",
];

const EditStageDialog = ({ studentId, studentName, currentStage, onStageChanged }: EditStageDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(currentStage);
  const [showAutomation, setShowAutomation] = useState(false);

  const handleStageSelect = (stage: string) => {
    setSelectedStage(stage);
  };

  const handleConfirmStage = async () => {
    if (selectedStage === currentStage) {
      toast.info("No stage change detected");
      setOpen(false);
      return;
    }

    // Show automation dialog
    setShowAutomation(true);
    setOpen(false);
  };

  const handleAutomationConfirm = async () => {
    try {
      const { error } = await supabase
        .from("students")
        .update({ current_stage: selectedStage })
        .eq("id", studentId);

      if (error) throw error;

      toast.success("Student stage updated");
      setShowAutomation(false);
      onStageChanged();
    } catch (error: any) {
      console.error("Error updating stage:", error);
      toast.error("Failed to update stage");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit3 className="w-4 h-4" />
            Change Stage
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Student Stage</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Select a new stage for {studentName}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Stage</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{currentStage}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Stage</Label>
              <Select value={selectedStage} onValueChange={handleStageSelect}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stageOptions.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmStage}>
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <StageChangeDialog
        open={showAutomation}
        onOpenChange={setShowAutomation}
        studentId={studentId}
        studentName={studentName}
        newStage={selectedStage}
        oldStage={currentStage}
        onConfirm={handleAutomationConfirm}
      />
    </>
  );
};

export default EditStageDialog;
