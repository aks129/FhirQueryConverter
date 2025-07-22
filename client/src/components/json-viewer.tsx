import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Minimize2, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JsonViewerProps {
  title: string;
  data: any;
  className?: string;
}

export function JsonViewer({ title, data, className = "" }: JsonViewerProps) {
  const [isCompact, setIsCompact] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast({
        title: "Copied to clipboard",
        description: "JSON data has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy JSON data to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatJson = (obj: any, indent = 0): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    const spacing = isCompact ? "" : "  ".repeat(indent);
    const newLine = isCompact ? "" : "\n";

    if (obj === null) {
      elements.push(<span key={Math.random()} className="text-gray-500">null</span>);
    } else if (typeof obj === "string") {
      elements.push(<span key={Math.random()} className="text-green-600">"{obj}"</span>);
    } else if (typeof obj === "number") {
      elements.push(<span key={Math.random()} className="text-orange-600">{obj}</span>);
    } else if (typeof obj === "boolean") {
      elements.push(<span key={Math.random()} className="text-purple-600">{String(obj)}</span>);
    } else if (Array.isArray(obj)) {
      elements.push(<span key={Math.random()} className="text-purple-600">[</span>);
      if (!isCompact) elements.push(<span key={Math.random()}>{newLine}</span>);
      
      obj.forEach((item, index) => {
        if (!isCompact) elements.push(<span key={Math.random()}>{spacing}  </span>);
        elements.push(...formatJson(item, indent + 1));
        if (index < obj.length - 1) {
          elements.push(<span key={Math.random()} className="text-gray-600">,</span>);
        }
        if (!isCompact) elements.push(<span key={Math.random()}>{newLine}</span>);
      });
      
      if (!isCompact) elements.push(<span key={Math.random()}>{spacing}</span>);
      elements.push(<span key={Math.random()} className="text-purple-600">]</span>);
    } else if (typeof obj === "object") {
      elements.push(<span key={Math.random()} className="text-blue-600">{"{"}</span>);
      if (!isCompact) elements.push(<span key={Math.random()}>{newLine}</span>);
      
      const entries = Object.entries(obj);
      entries.forEach(([key, value], index) => {
        if (!isCompact) elements.push(<span key={Math.random()}>{spacing}  </span>);
        elements.push(<span key={Math.random()} className="text-blue-800">"{key}"</span>);
        elements.push(<span key={Math.random()}>: </span>);
        elements.push(...formatJson(value, indent + 1));
        if (index < entries.length - 1) {
          elements.push(<span key={Math.random()} className="text-gray-600">,</span>);
        }
        if (!isCompact) elements.push(<span key={Math.random()}>{newLine}</span>);
      });
      
      if (!isCompact) elements.push(<span key={Math.random()}>{spacing}</span>);
      elements.push(<span key={Math.random()} className="text-blue-600">{"}"}</span>);
    }

    return elements;
  };

  return (
    <div className={`border border-gray-300 rounded-md overflow-hidden ${className}`}>
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCompact(!isCompact)}
            className="text-xs text-gray-600 hover:text-gray-900 h-auto p-1"
          >
            {isCompact ? (
              <>
                <Maximize2 className="w-3 h-3 mr-1" />
                Expand
              </>
            ) : (
              <>
                <Minimize2 className="w-3 h-3 mr-1" />
                Compact
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="text-xs text-gray-600 hover:text-gray-900 h-auto p-1"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
        </div>
      </div>
      <div className="p-4 bg-white overflow-auto font-mono text-sm" style={{ height: "calc(100% - 40px)" }}>
        <pre className="text-gray-800 whitespace-pre-wrap">
          {formatJson(data)}
        </pre>
      </div>
    </div>
  );
}
