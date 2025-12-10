// src/components/Spinner.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({ overlay = true, className = 'text-[rgb(var(--primary))]' }) => {
    if (overlay) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--bg))] bg-opacity-60 transition-opacity duration-300 z-50">
                <Loader2 className={`w-8 h-8 animate-spin ${className}`} />
            </div>
        );
    }

    return <Loader2 className={`w-6 h-6 animate-spin ${className}`} />;
};

export default Spinner;