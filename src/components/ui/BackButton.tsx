import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

const BackButton = ({ className }: { className?: string }) => {
    const navigate = useNavigate();
    const location = useLocation(); // Re-render on route change

    // Hide the button if there's no history to go back to in the current session
    // window.history.state.idx is 0 if it's the first page loaded in the app
    const canGoBack = typeof window !== 'undefined' && window.history.state?.idx > 0;

    if (!canGoBack) {
        return null;
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className={`text-gray-500 hover:text-gray-900 font-medium w-fit ${className || ''}`}
        >
            ← Back
        </Button>
    );
};

export default BackButton;
