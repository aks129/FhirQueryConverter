import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Play,
    X,
    ChevronRight,
    Sparkles,
    Database,
    Code,
    CheckCircle2,
    ArrowRight,
    Send
} from "lucide-react";
import { AgentCommandCenter } from "./AgentCommandCenter";

interface StoryStep {
    id: string;
    title: string;
    description: string;
    action: string;
    duration: number;
}

const STORY_STEPS: StoryStep[] = [
    {
        id: "input",
        title: "Natural Language Input",
        description: "User asks a complex clinical question in plain English.",
        action: "Analyzing query...",
        duration: 3000
    },
    {
        id: "agent",
        title: "Agent Orchestration",
        description: "AI Agent breaks down the problem and selects the right tools.",
        action: "Connecting to Medplum...",
        duration: 4000
    },
    {
        id: "cql",
        title: "Logic Generation",
        description: "Agent writes standard CQL to define the clinical logic.",
        action: "Generating CQL...",
        duration: 3000
    },
    {
        id: "sql",
        title: "Scale Execution",
        description: "CQL is transpiled to SQL for massive parallel processing.",
        action: "Running SQL on Databricks...",
        duration: 3000
    },
    {
        id: "result",
        title: "Actionable Insight",
        description: "Results are analyzed and care gaps are identified.",
        action: "Found 42 patients.",
        duration: 3000
    },
    {
        id: "close",
        title: "Closing the Loop",
        description: "Agent writes tasks back to the EHR to initiate care.",
        action: "Creating Task resources...",
        duration: 3000
    }
];

export function StoryMode({ onClose }: { onClose: () => void }) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);

    const startStory = () => {
        setIsPlaying(true);
        setCurrentStepIndex(0);
        setLogs([]);
        playStep(0);
    };

    const playStep = (index: number) => {
        if (index >= STORY_STEPS.length) {
            // End of story
            return;
        }

        const step = STORY_STEPS[index];
        setCurrentStepIndex(index);

        // Add log entry
        setLogs(prev => [...prev, {
            id: step.id,
            timestamp: Date.now(),
            type: index % 2 === 0 ? "thought" : "tool",
            message: step.action
        }]);

        setTimeout(() => {
            playStep(index + 1);
        }, step.duration);
    };

    const currentStep = STORY_STEPS[currentStepIndex];
    const progress = ((currentStepIndex + 1) / STORY_STEPS.length) * 100;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]"
            >

                {/* Left Panel: Narrative */}
                <div className="w-full md:w-1/3 bg-slate-950 p-8 flex flex-col border-r border-slate-800">
                    <div className="flex items-center justify-between mb-8">
                        <Badge variant="outline" className="border-purple-500 text-purple-400">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Story Mode
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex-1 space-y-8">
                        <AnimatePresence mode="wait">
                            {!isPlaying ? (
                                <motion.div
                                    key="intro"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6"
                                >
                                    <h2 className="text-3xl font-bold text-white">
                                        From Question to <br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                                            Actionable Insight
                                        </span>
                                    </h2>
                                    <p className="text-slate-400 leading-relaxed">
                                        Watch how an AI Agent orchestrates the entire healthcare analytics workflow—from a simple natural language question to closing a care gap in the EHR.
                                    </p>
                                    <Button size="lg" onClick={startStory} className="w-full bg-purple-600 hover:bg-purple-700 gap-2">
                                        <Play className="w-5 h-5" />
                                        Watch the Magic
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step-content"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="text-sm font-mono text-purple-400 mb-2">
                                        STEP {currentStepIndex + 1} / {STORY_STEPS.length}
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {currentStep.title}
                                    </h2>
                                    <p className="text-slate-300 text-lg">
                                        {currentStep.description}
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden mt-8">
                                        <motion.div
                                            className="h-full bg-purple-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Panel: Visualizer */}
                <div className="w-full md:w-2/3 bg-slate-900 relative">
                    <AgentCommandCenter isActive={isPlaying} logs={logs} />

                    {/* Overlay for "Result" step */}
                    <AnimatePresence>
                        {isPlaying && currentStep.id === "result" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-10"
                            >
                                <Card className="w-80 bg-white border-none shadow-2xl">
                                    <CardContent className="p-6 text-center space-y-4">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">Insight Generated</h3>
                                            <p className="text-slate-500">42 Patients identified with care gaps</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Overlay for "Close Loop" step */}
                    <AnimatePresence>
                        {isPlaying && currentStep.id === "close" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-10"
                            >
                                <Card className="w-96 bg-white border-none shadow-2xl">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center gap-3 border-b pb-4">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Send className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">Task Created</h3>
                                                <p className="text-xs text-slate-500">Sent to Medplum EHR</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Resource Type:</span>
                                                <span className="font-mono font-medium">Task</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Status:</span>
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Requested</Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Priority:</span>
                                                <span className="font-medium text-red-500">High</span>
                                            </div>
                                        </div>
                                        <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" onClick={onClose}>
                                            View in Workflow
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>
        </div>
    );
}
