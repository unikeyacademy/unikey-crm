import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, ExternalLink, FolderOpen, RefreshCw } from "lucide-react";
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

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
  iconLink?: string;
}

interface StudentDocumentsTabProps {
  studentId: string;
}

const StudentDocumentsTab = ({ studentId }: StudentDocumentsTabProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
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

  const fetchDriveUrl = async () => {
    const { data } = await supabase
      .from('students')
      .select('google_drive_folder_url')
      .eq('id', studentId)
      .single();

    const url = (data as any)?.google_drive_folder_url || null;
    setDriveUrl(url);
    return url;
  };

  const fetchDriveFiles = async (url: string) => {
    setDriveLoading(true);
    setDriveError(null);
    try {
      const { data, error } = await supabase.functions.invoke('list-drive-files', {
        body: { folderUrl: url },
      });

      if (error) throw error;
      if (data?.error) {
        setDriveError(data.error);
        return;
      }

      setDriveFiles(data?.files || []);
    } catch (error: any) {
      setDriveError(error.message || 'Failed to fetch Drive files');
    } finally {
      setDriveLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchDriveUrl().then((url) => {
      if (url) fetchDriveFiles(url);
    });
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

  const formatFileSize = (bytes: number | null | string) => {
    const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (!numBytes) return "Unknown size";
    const kb = numBytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getDriveMimeLabel = (mimeType: string) => {
    const typeMap: Record<string, string> = {
      'application/vnd.google-apps.document': 'Google Doc',
      'application/vnd.google-apps.spreadsheet': 'Google Sheet',
      'application/vnd.google-apps.presentation': 'Google Slides',
      'application/vnd.google-apps.folder': 'Folder',
      'application/pdf': 'PDF',
      'image/jpeg': 'Image',
      'image/png': 'Image',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Doc',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    };
    return typeMap[mimeType] || mimeType.split('/').pop() || 'File';
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
    <div className="space-y-6">
      {/* Google Drive Section */}
      {driveUrl && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Google Drive Files</h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDriveFiles(driveUrl)}
                disabled={driveLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${driveLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={driveUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in Drive
                </a>
              </Button>
            </div>
          </div>

          {driveError && (
            <Card>
              <CardContent className="text-center py-6 text-muted-foreground">
                <p className="text-sm text-destructive">{driveError}</p>
                <p className="text-xs mt-1">Make sure Google is connected in Settings with Drive permissions.</p>
              </CardContent>
            </Card>
          )}

          {driveLoading && !driveError && (
            <Card>
              <CardContent className="flex justify-center items-center py-6">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading Drive files...</span>
              </CardContent>
            </Card>
          )}

          {!driveLoading && !driveError && driveFiles.length === 0 && (
            <Card>
              <CardContent className="text-center py-6 text-muted-foreground">
                No files found in the linked Drive folder
              </CardContent>
            </Card>
          )}

          {!driveLoading && !driveError && driveFiles.length > 0 && (
            <div className="grid gap-2">
              {driveFiles.map((file) => (
                <Card key={file.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {file.iconLink ? (
                          <img src={file.iconLink} alt="" className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{file.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-xs">
                              {getDriveMimeLabel(file.mimeType)}
                            </Badge>
                            {file.size && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistance(new Date(file.modifiedTime), new Date(), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {!driveUrl && (
        <Card>
          <CardContent className="text-center py-6 text-muted-foreground">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No Google Drive folder linked.</p>
            <p className="text-xs mt-1">Add a Drive folder URL in the Profile tab to see files here.</p>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Documents Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Uploaded Documents</h3>
          <UploadDocumentDialog studentId={studentId} onUploadComplete={fetchDocuments} />
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-6 text-muted-foreground">
              No documents uploaded yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{doc.document_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {getDocumentTypeBadge(doc.document_type)}
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistance(new Date(doc.upload_date), new Date(), { addSuffix: true })}
                          </span>
                        </div>
                        {doc.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{doc.notes}</p>
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
    </div>
  );
};

export default StudentDocumentsTab;
