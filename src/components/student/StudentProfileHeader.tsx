"use client";

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, Mail, Phone, Calendar } from 'lucide-react';

interface StudentProfileHeaderProps {
  studentName: string;
  registerNumber: string;
}

const getInitials = (name: string) => {
  // Ensure name is a string before splitting
  if (!name) return 'S';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

// Mock detailed student data
const MOCK_STUDENT_DETAILS = {
  email: 'mock.student@college.edu',
  phone: '+1 555 123 4567',
  dob: '1998-05-15',
  department: 'Computer Science',
  year: 'Final Year',
};

const StudentProfileHeader = ({ studentName, registerNumber }: StudentProfileHeaderProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
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
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-4">
        <div className="flex items-center space-x-3 border-b pb-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-600 text-white font-bold text-xl">
              {getInitials(studentName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-bold text-xl">{studentName}</h4>
            <p className="text-sm text-gray-500">Reg No: {registerNumber}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span>{MOCK_STUDENT_DETAILS.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span>{MOCK_STUDENT_DETAILS.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>{MOCK_STUDENT_DETAILS.department} ({MOCK_STUDENT_DETAILS.year})</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>DOB: {MOCK_STUDENT_DETAILS.dob}</span>
          </div>
        </div>

        <p className="text-xs text-red-500 pt-2 border-t">
          *Details updated by Admin. Contact department for changes.
        </p>
      </PopoverContent>
    </Popover>
  );
};

export default StudentProfileHeader;