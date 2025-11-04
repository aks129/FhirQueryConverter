import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SqlViewerProps {
  sql: string;
  title?: string;
  showExport?: boolean;
  darkMode?: boolean;
  maxHeight?: string;
}

export function SqlViewer({
  sql,
  title = "Generated SQL Query",
  showExport = true,
  darkMode = false,
  maxHeight = "400px"
}: SqlViewerProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "SQL query copied successfully",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const exportSQL = () => {
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-query-${Date.now()}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "SQL Exported",
      description: "Generated SQL query has been downloaded",
    });
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </Button>
          {showExport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={exportSQL}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* SQL Content with Syntax Highlighting */}
      <div
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <SyntaxHighlighter
          language="sql"
          style={darkMode ? vscDarkPlus : vs}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            background: darkMode ? '#1e1e1e' : '#ffffff',
          }}
          showLineNumbers
          wrapLines
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            color: darkMode ? '#858585' : '#999',
            userSelect: 'none',
          }}
        >
          {sql}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
