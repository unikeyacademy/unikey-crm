import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

const Documents = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">
            Manage student documents and files
          </p>
        </div>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Upload File
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Document management features coming soon. You'll be able to upload and organize student documents here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;
