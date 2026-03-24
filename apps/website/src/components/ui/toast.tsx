'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-[color:var(--fg-strong)]" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-[color:var(--danger)]" />;
      case 'info':
        return <Info className="h-5 w-5 text-[color:var(--fg-muted)]" />;
    }
  };

  const getTone = () => {
    switch (type) {
      case 'success':
        return 'border-border bg-[color:var(--bg-surface)]';
      case 'error':
        return 'border-[color:var(--danger)]/20 bg-[color:var(--bg-surface)]';
      case 'info':
        return 'border-border bg-[color:var(--bg-surface)]';
    }
  };

  return (
    <div className={`fixed right-4 top-4 z-50 border px-4 py-3 shadow-sm ${getTone()}`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <p className="max-w-sm text-[13px] leading-6 text-[color:var(--fg-body)]">{message}</p>
        <button onClick={onClose} className="text-[color:var(--fg-muted)] transition-colors hover:text-[color:var(--fg-strong)]">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).slice(2, 11);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </>
  );

  return { addToast, ToastContainer };
}
