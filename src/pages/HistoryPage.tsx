"use client";

import React from 'react';
import TeacherLayout from '@/components/layout/TeacherLayout';
import HistoryList from '@/components/teacher/HistoryList';

const HistoryPage = () => {
    return (
        <TeacherLayout activeView="history" title="Action History">
            <HistoryList />
        </TeacherLayout>
    );
};

export default HistoryPage;
