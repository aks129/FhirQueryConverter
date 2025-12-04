import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Database, FileCode, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'sql' | 'cql' | 'data';
  data?: any;
  timestamp: Date;
}

export function AgentChat() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Healthcare Analytics Agent. I can help you analyze your FHIR data, generate CQL logic, or write SQL queries. Try asking me to 'Find all diabetic patients' or 'Create a measure for HbA1c screening'.",
      timestamp: new Date(),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate agent processing
    setTimeout(() => {
      const response = generateResponse(userMessage.content);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const generateResponse = (query: string): Message => {
    const lowerQuery = query.toLowerCase();
    const id = Date.now().toString();

    // Simulated Logic
    if (lowerQuery.includes('diabetes') || lowerQuery.includes('diabetic')) {
      if (lowerQuery.includes('sql')) {
        return {
          id,
          role: 'assistant',
          content: "Here is the SQL query to identify patients with Diabetes (E11) using the SQL on FHIR views:",
          type: 'sql',
          data: `SELECT p.id, p.name_family, p.birthdate
FROM patient_view p
JOIN condition_view c ON p.id = c.subject_id
WHERE c.code_coding_code LIKE 'E11%'
  AND c.clinical_status = 'active'`,
          timestamp: new Date(),
        };
      } else {
        return {
          id,
          role: 'assistant',
          content: "I found 847 patients with active Diabetes (E11) in your cohort. Would you like to see the breakdown by age group or generate a care gap report?",
          type: 'data',
          data: {
            summary: '847 Patients',
            details: [
              { label: 'Type 1', value: '124' },
              { label: 'Type 2', value: '723' },
              { label: 'Avg Age', value: '64.2' },
            ]
          },
          timestamp: new Date(),
        };
      }
    }

    if (lowerQuery.includes('hba1c') || lowerQuery.includes('screening')) {
      return {
        id,
        role: 'assistant',
        content: "I can help you define a CQL measure for HbA1c screening. Here is a draft logic based on HEDIS specifications:",
        type: 'cql',
        data: `define "Initial Population":
  [Patient] P
  where AgeInYearsAt(start of "Measurement Period") between 18 and 75

define "Denominator":
  "Initial Population"
  and exists ([Condition: "Diabetes"])

define "Numerator":
  exists ([Observation: "HbA1c Test"] O
    where O.effectiveDateTime during "Measurement Period")`,
        timestamp: new Date(),
      };
    }

    return {
      id,
      role: 'assistant',
      content: "I understand you're asking about healthcare data. I can help you with:\n1. Generating SQL queries for patient cohorts\n2. Drafting CQL measure logic\n3. Analyzing current FHIR data\n\nCould you be more specific about what you need?",
      timestamp: new Date(),
    };
  };

  return (
    <Card className="w-full h-[600px] flex flex-col shadow-xl border-slate-200 bg-white/50 backdrop-blur-sm">
      <CardHeader className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Bot className="h-6 w-6" />
          AI Analytics Agent
          <Badge variant="secondary" className="ml-2 text-xs font-normal">
            Powered by FireMetrics
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                  msg.role === 'user' ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
                )}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                
                <div className={cn(
                  "rounded-2xl px-4 py-3 shadow-sm text-sm",
                  msg.role === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-sm" 
                    : "bg-white border border-slate-100 rounded-tl-sm"
                )}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  
                  {msg.type === 'sql' && (
                    <div className="mt-3 bg-slate-950 rounded-md overflow-hidden border border-slate-800">
                      <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-800">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Database className="h-3 w-3" /> SQL
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white">
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                      <pre className="p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
                        {msg.data}
                      </pre>
                    </div>
                  )}

                  {msg.type === 'cql' && (
                    <div className="mt-3 bg-slate-50 rounded-md overflow-hidden border border-slate-200">
                      <div className="flex items-center px-3 py-1 bg-slate-100 border-b border-slate-200">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <FileCode className="h-3 w-3" /> CQL
                        </span>
                      </div>
                      <pre className="p-3 text-xs font-mono text-slate-700 overflow-x-auto">
                        {msg.data}
                      </pre>
                    </div>
                  )}

                  {msg.type === 'data' && msg.data && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {msg.data.details.map((item: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                          <div className="text-xs text-slate-500">{item.label}</div>
                          <div className="font-semibold text-slate-900">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className={cn(
                    "text-[10px] mt-1 opacity-70 text-right",
                    msg.role === 'user' ? "text-blue-100" : "text-slate-400"
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-4 bg-white border-t">
        <form 
          className="flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input 
            placeholder="Ask about your data..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
            disabled={isTyping}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isTyping} className="bg-purple-600 hover:bg-purple-700">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
