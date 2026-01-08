"use client";

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface StudentProfileHeaderProps {
  studentName: string;
  registerNumber: string;
}

const getInitials = (name: string) => {
  // Ensure name is a string before splitting
  if (!name) return 'S';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const StudentProfileHeader = ({ studentName, registerNumber }: StudentProfileHeaderProps) => {
  return (
    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border shadow-sm">
      <div className="text-right">
        <h3 className="text-lg font-bold truncate text-gray-800">{studentName || 'Student'}</h3>
        <p className="text-sm text-gray-500">Reg No: {registerNumber || 'N/A'}</p>
      </div>
      <Avatar className="h-10 w-10 border-2 border-primary">
        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
          {getInitials(studentName)}
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

export default StudentProfileHeader;