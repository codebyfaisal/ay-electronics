import React from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const ErrorPage = ({ error }) => {
    const navigate = useNavigate();
    const handleReload = () => window.location.reload();

    const handleGoHome = () => {
        navigate('/');
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="bg-gray-800 p-8 md:p-12 rounded-xl shadow-2xl max-w-xl w-full text-center border-t-4 border-red-500 grid place-items-center">
                <Zap className="w-16 h-16 mx-auto text-red-500 mb-6 animate-pulse" />
                <h1 className="text-4xl font-extrabold mb-4 text-red-400">
                    Application Error
                </h1>
                <p className="text-gray-300 mb-6 text-lg grid">
                    Something went wrong. Don't worry, your data should be safe.
                    This usually happens due to a temporary issue.
                </p>

                <div class="relative text-center text-lg font-semibold mb-4 w-max pb-1">
                    <a href="">if this keeps happening, please contact developer.</a>
                    <div class="absolute bottom-0 left-0 w-full h-[3px] overflow-hidden">
                        <div class="w-[200%] h-full bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 animate-gradient-move"></div>
                    </div>
                </div>


                <div className="text-left bg-gray-700 p-4 rounded-lg mb-6 overflow-x-auto text-sm w-full">
                    <p className="font-mono text-red-300 mb-2">Error Details:</p>
                    <pre className="whitespace-pre-wrap break-all text-red-200">
                        {error?.toString() || 'Unknown Error'}
                    </pre>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <Button
                        onClick={handleReload}
                        className="bg-red-600 hover:bg-red-700 w-max"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Reload Application
                    </Button>
                    <Button
                        type='button'
                        onClick={handleGoHome}
                        variant="secondary"
                        className="w-max"
                    >
                        Go Home
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
