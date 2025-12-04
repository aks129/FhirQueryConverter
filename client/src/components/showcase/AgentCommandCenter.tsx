import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Bot,
    Database,
    Code,
    Server,
    Activity,
    CheckCircle2,
    Loader2,
    Sparkles,
    Terminal
} from "lucide-react";

interface LogEntry {
    id: string;
    timestamp: number;
    type: "thought" | "tool" | "result" | "error";
    message: string;
    details?: string;
}

interface AgentCommandCenterProps {
    isActive: boolean;
    logs: LogEntry[];
}

export function AgentCommandCenter({ isActive, logs }: AgentCommandCenterProps) {
    const [activeTool, setActiveTool] = useState<string | null>(null);

    // Simulate tool activation based on logs
    useEffect(() => {
        if (logs.length > 0) {
            const lastLog = logs[logs.length - 1];
            if (lastLog.type === "tool") {
                setActiveTool(lastLog.message);
                const timer = setTimeout(() => setActiveTool(null), 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [logs]);

    return (
        <Card className="w-full h-full border-slate-200 shadow-xl bg-slate-950 text-slate-50 overflow-hidden flex flex-col">
            <CardHeader className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Bot className="w-5 h-5 text-blue-400" />
                            {isActive && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                        </div>
                        <CardTitle className="text-sm font-mono tracking-wider text-slate-300">
                            AGENT_CORE_V1.0
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-slate-900 border-slate-700 text-xs font-mono">
                            {isActive ? "ONLINE" : "STANDBY"}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 grid grid-cols-1 md:grid-cols-3 h-full overflow-hidden">

                {/* Left Panel: System Status & Tools */}
                <div className="col-span-1 border-r border-slate-800 bg-slate-900/30 p-4 flex flex-col gap-6">

                    {/* Active Process Visualization */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Active Processes
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <ToolStatus
                                icon={Database}
                                label="Medplum"
                                isActive={activeTool?.includes("Medplum")}
                                color="text-orange-400"
                            />
                            <ToolStatus
                                icon={Code}
                                label="CQL Engine"
                                isActive={activeTool?.includes("CQL")}
                                color="text-blue-400"
                            />
                            <ToolStatus
                                icon={Server}
                                label="Databricks"
                                isActive={activeTool?.includes("Databricks")}
                                color="text-red-400"
                            />
                            <ToolStatus
                                icon={Sparkles}
                                label="FireMetrics"
                                isActive={activeTool?.includes("FireMetrics")}
                                color="text-purple-400"
                            />
                        </div>
                    </div>

                    {/* System Metrics (Simulated) */}
                    <div className="space-y-2 mt-auto">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            System Load
                        </h3>
                        <div className="space-y-3">
                            <MetricBar label="CPU" value={isActive ? 65 : 12} color="bg-blue-500" />
                            <MetricBar label="Memory" value={isActive ? 42 : 28} color="bg-purple-500" />
                            <MetricBar label="Network" value={isActive ? 88 : 5} color="bg-green-500" />
                        </div>
                    </div>
                </div>

                {/* Right Panel: Neural Stream (Logs) */}
                <div className="col-span-2 bg-slate-950 p-4 flex flex-col h-full overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none" />

                    <div className="flex items-center gap-2 mb-4 text-slate-400 font-mono text-xs">
                        <Terminal className="w-4 h-4" />
                        <span>NEURAL_STREAM_OUTPUT</span>
                    </div>

                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4 pb-4">
                            <AnimatePresence mode="popLayout">
                                {logs.map((log) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`
                      relative pl-4 border-l-2 py-1 font-mono text-sm
                      ${log.type === 'thought' ? 'border-blue-500/50 text-blue-200' : ''}
                      ${log.type === 'tool' ? 'border-orange-500/50 text-orange-200' : ''}
                      ${log.type === 'result' ? 'border-green-500/50 text-green-200' : ''}
                      ${log.type === 'error' ? 'border-red-500/50 text-red-200' : ''}
                    `}
                                    >
                                        <div className="flex items-center gap-2 mb-1 opacity-50 text-xs">
                                            {log.type === 'thought' && <Activity className="w-3 h-3" />}
                                            {log.type === 'tool' && <Server className="w-3 h-3" />}
                                            {log.type === 'result' && <CheckCircle2 className="w-3 h-3" />}
                                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            <span className="uppercase tracking-wider">[{log.type}]</span>
                                        </div>
                                        <div>
                                            {log.message}
                                        </div>
                                        {log.details && (
                                            <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs text-slate-400 whitespace-pre-wrap font-mono">
                                                {log.details}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="pl-4 border-l-2 border-slate-700 py-1"
                                    >
                                        <div className="flex items-center gap-2 text-slate-500 text-sm font-mono">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}

function ToolStatus({ icon: Icon, label, isActive, color }: any) {
    return (
        <div className={`
      flex items-center gap-3 p-3 rounded-lg border transition-all duration-300
      ${isActive
                ? 'bg-slate-800 border-slate-600 shadow-lg scale-105'
                : 'bg-slate-900/50 border-slate-800 opacity-50'}
    `}>
            <Icon className={`w-5 h-5 ${isActive ? color : 'text-slate-600'}`} />
            <span className={`text-xs font-medium ${isActive ? 'text-slate-200' : 'text-slate-600'}`}>
                {label}
            </span>
            {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            )}
        </div>
    );
}

function MetricBar({ label, value, color }: any) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase">
                <span>{label}</span>
                <span>{value}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                />
            </div>
        </div>
    );
}
