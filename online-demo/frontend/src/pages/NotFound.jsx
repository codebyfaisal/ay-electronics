// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Frown } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-6">
                <Frown className='w-20 h-20 mx-auto text-[rgb(var(--error))]'/>
                <h1 className="text-6xl font-extrabold text-[rgb(var(--text))]">404</h1>
                <h2 className="text-3xl font-semibold text-gray-600 dark:text-gray-300">
                    Page Not Found
                </h2>
                <p className="text-lg text-gray-500 dark:text-gray-400">
                    Oops! The page you are looking for doesn't exist or an error occurred.
                </p>
                <Link to="/">
                    <Button variant="primary" className="mt-4">
                        Go to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default NotFound;