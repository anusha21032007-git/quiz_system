"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History as HistoryIcon } from 'lucide-react';

interface ActionEntry {
    questionSetId: string;
    totalQuestions: number;
    action: 'Completed' | 'Deleted';
    timestamp: number;
}

const HistoryList = () => {
    const [actionHistory, setActionHistory] = useState<ActionEntry[]>([]);

    useEffect(() => {
        const historyJson = localStorage.getItem('questionActionHistory');
        if (historyJson) {
            try {
                setActionHistory(JSON.parse(historyJson));
            } catch (e) {
                console.error("Failed to parse questionActionHistory", e);
            }
        }
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <Card className="shadow-none border-2 border-black bg-white rounded-xl">
                <CardHeader className="border-b-2 border-gray-100">
                    <CardTitle className="flex items-center gap-2 text-2xl font-bold text-black">
                        <HistoryIcon className="h-6 w-6 text-black" />
                        Action History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {actionHistory.length > 0 ? (
                        <div className="overflow-hidden">
                            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                                <table className="w-full border-collapse">
                                    <thead className="bg-gray-50 border-b sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Question Set ID</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total Questions</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {actionHistory.map((entry, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-mono text-gray-900">
                                                    {entry.questionSetId.includes('_') ? entry.questionSetId.split('_')[1] : entry.questionSetId}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                                                    {entry.totalQuestions || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm font-bold uppercase tracking-wide ${entry.action === 'Completed' ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {entry.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {new Date(entry.timestamp).toLocaleString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <HistoryIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium text-lg">No action history recorded yet.</p>
                            <p className="text-gray-400 text-sm mt-1">Actions like completing or deleting question sets will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default HistoryList;
