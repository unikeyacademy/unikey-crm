import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";
import UploadDocumentDialog from "@/components/documents/UploadDocumentDialog";

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_size: number | null;
  upload_date: string;
  notes: string | null;
}

interface StudentDocumentsTabProps {
  studentId: string;
}

const StudentDocumentsTab = ({ studentId }: StudentDocumentsTabProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching documents",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [studentId]);

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('student-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      transcript: "bg-blue-500",
      essay: "bg-purple-500",
      recommendation: "bg-green-500",
      test_scores: "bg-orange-500",
      other: "bg-gray-500",
    };
    return <Badge className={colors[type] || colors.other}>{type}</Badge>;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
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
        <h3 className="text-lg font-semibold">Documents</h3>
        <UploadDocumentDialog studentId={studentId} onUploadComplete={fetchDocuments} />
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            No documents uploaded yet
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{doc.document_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {getDocumentTypeBadge(doc.document_type)}
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistance(new Date(doc.upload_date), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                      {doc.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{doc.notes}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc.file_path, doc.document_name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDocumentsTab;
