import { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Zap, Timer, Database } from "lucide-react";

export function ScaleVisualizer() {
    const [isRunning, setIsRunning] = useState(false);
    const [cqlCount, setCqlCount] = useState(0);
    const [sqlCount, setSqlCount] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const TOTAL_RECORDS = 100000;

    // Animation controls
    const cqlControls = useAnimation();
    const sqlControls = useAnimation();

    const startSimulation = () => {
        setIsRunning(true);
        setIsComplete(false);
        setCqlCount(0);
        setSqlCount(0);

        // SQL Simulation (Fast)
        let sqlCurrent = 0;
        const sqlInterval = setInterval(() => {
            sqlCurrent += 5000; // Process 5000 records per tick
            if (sqlCurrent >= TOTAL_RECORDS) {
                setSqlCount(TOTAL_RECORDS);
                clearInterval(sqlInterval);
            } else {
                setSqlCount(sqlCurrent);
            }
        }, 50);

        // CQL Simulation (Slow)
        let cqlCurrent = 0;
        const cqlInterval = setInterval(() => {
            cqlCurrent += 150; // Process 150 records per tick
            if (cqlCurrent >= TOTAL_RECORDS) {
                setCqlCount(TOTAL_RECORDS);
                clearInterval(cqlInterval);
            } else {
                setCqlCount(cqlCurrent);
            }
        }, 50);

        // Stop simulation after SQL finishes (to show the gap)
        setTimeout(() => {
            setIsComplete(true);
            setIsRunning(false);
            clearInterval(cqlInterval); // Stop CQL early to show it's slower
            clearInterval(sqlInterval);
        }, 2500);
    };

    const resetSimulation = () => {
        setIsRunning(false);
        setIsComplete(false);
        setCqlCount(0);
        setSqlCount(0);
    };

    return (
        <Card className="w-full border-slate-200 shadow-lg bg-white overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Zap className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900">Scale Simulator</CardTitle>
                            <p className="text-sm text-slate-500">Performance Comparison: 100,000 Patient Records</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {!isRunning ? (
                            <Button onClick={startSimulation} className="bg-blue-600 hover:bg-blue-700 gap-2">
                                <Play className="w-4 h-4" />
                                Run Benchmark
                            </Button>
                        ) : (
                            <Button disabled variant="outline" className="gap-2">
                                <Timer className="w-4 h-4 animate-spin" />
                                Running...
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={resetSimulation}>
                            <RotateCcw className="w-4 h-4 text-slate-500" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-8">

                {/* SQL on FHIR Lane (Fast) */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-slate-700">SQL on FHIR Engine</span>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                Massively Parallel
                            </Badge>
                        </div>
                        <span className="font-mono font-bold text-purple-600 text-xl">
                            {sqlCount.toLocaleString()} <span className="text-sm text-slate-400 font-normal">records</span>
                        </span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(sqlCount / TOTAL_RECORDS) * 100}%` }}
                            transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                        />
                        {/* Particle Effect Overlay */}
                        {isRunning && (
                            <div className="absolute top-0 left-0 w-full h-full opacity-50 bg-[url('/particles.png')] animate-slide-right" />
                        )}
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>0</span>
                        <span>50k</span>
                        <span>100k</span>
                    </div>
                </div>

                {/* Traditional CQL Lane (Slow) */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Code className="w-4 h-4 text-slate-600" />
                            <span className="font-semibold text-slate-700">Traditional CQL Engine</span>
                            <Badge variant="outline" className="text-slate-500 text-xs">
                                Sequential Processing
                            </Badge>
                        </div>
                        <span className="font-mono font-bold text-slate-600 text-xl">
                            {cqlCount.toLocaleString()} <span className="text-sm text-slate-400 font-normal">records</span>
                        </span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-slate-400"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(cqlCount / TOTAL_RECORDS) * 100}%` }}
                            transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                        />
                    </div>
                    {isComplete && (
                        <p className="text-xs text-red-500 font-medium mt-1">
                            ⚠ Projection: Would take ~45 minutes to complete
                        </p>
                    )}
                </div>

                {/* Result Summary */}
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-full">
                                <Zap className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-green-800">Performance Insight</h4>
                                <p className="text-sm text-green-700">
                                    SQL on FHIR is <span className="font-bold">150x faster</span> for population-level analysis.
                                </p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                            View Detailed Report
                        </Button>
                    </motion.div>
                )}

            </CardContent>
        </Card>
    );
}

import { Code } from "lucide-react";
