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

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <header className="flex items-center justify-between p-4 border-b border-slate-800 bg-card shadow-sm lg:hidden">
                <div className="flex items-center gap-2">
                    <TeacherSidebar activeView={activeView} isMobile={isMobile} />
                    <BackButton className="text-slate-400 font-bold" />
                </div>
                <h1 className="text-xl font-black text-slate-50 uppercase tracking-tight">{title}</h1>
            </header>

            <div className="flex flex-1">
                {!isMobile && (
                    <ResizablePanelGroup direction="horizontal" className="min-h-screen max-w-full">
                        <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
                            <TeacherSidebar activeView={activeView} isMobile={isMobile} />
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={80}>
                            <main className="flex-1 p-8 overflow-auto CustomScrollbar">
                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-6">
                                        <BackButton className="bg-card border-slate-800 text-slate-400 rounded-[14px] px-5 py-2.5 shadow-xl hover:shadow-primary/5 hover:text-primary hover:border-primary/30 transition-all font-bold uppercase text-[10px] tracking-widest" />
                                        <h1 className="text-4xl font-black text-slate-50 hidden lg:block uppercase tracking-tighter leading-none">{title}</h1>
                                    </div>
                                </div>
                                {children}
                            </main>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                )}
                {isMobile && (
                    <main className="flex-1 p-4 overflow-auto CustomScrollbar">
                        <div className="mb-6">
                            <BackButton className="bg-card border-slate-800 text-slate-400 rounded-xl px-4 py-2.5 shadow-lg font-bold uppercase text-[10px] tracking-widest" />
                        </div>
                        {children}
                    </main>
                )}
            </div>
        </div>
    );
};

export default TeacherLayout;
