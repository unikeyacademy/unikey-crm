import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentNotionNotesTabProps {
  notionPageId: string | null;
  notionNotes: string | null;
}

const StudentNotionNotesTab = ({ notionPageId, notionNotes }: StudentNotionNotesTabProps) => {
  if (!notionNotes && !notionPageId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No Notion notes linked</p>
            <p className="text-sm mt-1">This student doesn't have a linked Notion page yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderNotesContent = (notes: string) => {
    const sections = notes.split(/(?=###\s)/);
    
    return sections.map((section, idx) => {
      const lines = section.trim().split("\n");
      const titleMatch = lines[0]?.match(/^###\s+(.+)/);
      const title = titleMatch ? titleMatch[1] : null;
      const content = title ? lines.slice(1).join("\n").trim() : section.trim();

      if (!content && !title) return null;

      return (
        <Card key={idx} className="mb-4">
          {title && (
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
          )}
          <CardContent className={title ? "" : "pt-6"}>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-mono">
              {content.split("\n").map((line, i) => {
                const indentMatch = line.match(/^(\s*)([-•]\s*)(.*)/);
                if (indentMatch) {
                  const indent = indentMatch[1].length;
                  const text = indentMatch[3];
                  return (
                    <div key={i} style={{ paddingLeft: `${Math.max(indent * 8, 0)}px` }} className="flex gap-1.5 py-0.5">
                      <span className="text-muted-foreground shrink-0">•</span>
                      <span>{text}</span>
                    </div>
                  );
                }
                if (line.trim() === "") return <div key={i} className="h-2" />;
                return <div key={i} className="py-0.5">{line}</div>;
              })}
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <FileText className="w-3 h-3" />
            Synced from Notion
          </Badge>
        </div>
        {notionPageId && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open(`https://www.notion.so/${notionPageId}`, "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
            Open in Notion
          </Button>
        )}
      </div>

      {notionNotes ? renderNotesContent(notionNotes) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Notion page linked but no notes content available.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentNotionNotesTab;
