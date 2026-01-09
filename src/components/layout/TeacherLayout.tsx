"use client";

import React from 'react';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import BackButton from '@/components/ui/BackButton';

interface TeacherLayoutProps {
    children: React.ReactNode;
    activeView: string;
    title?: string;
}

const TeacherLayout = ({ children, activeView, title = "Teacher Dashboard" }: TeacherLayoutProps) => {
    const isMobile = useIsMobile();

    // Helper to handle sidebar navigation - in a real app this would probably use programmatic navigation
    // but for now we'll pass a dummy setActiveView since the Sidebar expects it.
    // The Sidebar will be updated to use actual Links in the next step.
    const handleSetActiveView = (view: string) => {
        // This will be handled by route-based navigation soon
        console.log(`Navigating to ${view}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm lg:hidden">
                <div className="flex items-center gap-2">
                    <TeacherSidebar activeView={activeView} setActiveView={handleSetActiveView} isMobile={isMobile} />
                    <BackButton />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            </header>

            <div className="flex flex-1">
                {!isMobile && (
                    <ResizablePanelGroup direction="horizontal" className="min-h-screen max-w-full">
                        <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
                            <TeacherSidebar activeView={activeView} setActiveView={handleSetActiveView} isMobile={isMobile} />
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={80}>
                            <main className="flex-1 p-8 overflow-auto">
                                <div className="space-y-4 mb-8">
                                    <BackButton />
                                    <h1 className="text-4xl font-bold text-gray-800 hidden lg:block">{title}</h1>
                                </div>
                                {children}
                            </main>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                )}
                {isMobile && (
                    <main className="flex-1 p-4 overflow-auto">
                        {children}
                    </main>
                )}
            </div>
        </div>
    );
};

export default TeacherLayout;
