"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users as UsersIcon } from 'lucide-react';

interface DemoUser {
    username: string;
    password: string;
}

const UsersList = () => {
    const demoUsers: DemoUser[] = useMemo(() =>
        Array.from({ length: 100 }, (_, i) => ({
            username: `user${i + 1}`,
            password: `pass@${i + 1}`
        })),
        []
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <Card className="shadow-lg border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UsersIcon className="h-6 w-6 text-blue-600" />
                        Users
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                        A total of {demoUsers.length} auto-generated users for testing and demonstration purposes.
                    </p>
                    <div className="border rounded-md overflow-hidden bg-white">
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {demoUsers.map((user) => (
                                        <tr key={user.username} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.username}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-mono italic">{user.password}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UsersList;