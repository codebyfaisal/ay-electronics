import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Network, AlertTriangle } from "lucide-react";

const StartupModal = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setTimeout(() => setAnimate(true), 50);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        animate ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-md p-6 mx-4 overflow-hidden shadow-2xl rounded-2xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
          animate ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
        }`}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-6 p-4 rounded-full bg-yellow-500/10 text-yellow-500 ring-1 ring-yellow-500/20 shadow-lg shadow-yellow-500/5">
            <Network className="w-8 h-8" strokeWidth={1.5} />
          </div>

          <h2 className="mb-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[rgb(var(--text))] to-[rgb(var(--text))]">
            Offline Environment
          </h2>

          <div className="mb-8 space-y-3">
            <p className="text-sm font-medium text-[rgb(var(--text))/60] leading-relaxed">
              This project is not actually online.
            </p>
            <div className="flex justify-center gap-2 px-3 py-2 text-xs font-medium text-amber-500 bg-amber-500/5 rounded-lg border border-amber-500/10">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="flex flex-col gap-2">
                Real project is offline in the client system
                <p className="text-xs font-medium text-amber-300 bg-amber-500/5 rounded-lg border border-amber-500/10 p-1">This is a demo version</p>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="group relative w-full px-6 py-3 overflow-hidden font-medium text-white transition-all bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98]"
          >
            <span className="relative flex items-center justify-center gap-2">
              Understood
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StartupModal;
