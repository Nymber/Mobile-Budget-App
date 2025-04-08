"use client";

import * as React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { X } from "lucide-react";

export type ToastVariant = "default" | "destructive";

export interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toast: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast provider component that manages toast notifications
 * This simplified version doesn't depend on external packages
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(ToastProps & { id: number })[]>([]);
  
  const toast = (props: ToastProps) => {
    const id = Math.random();
    const newToast = { id, ...props, duration: props.duration || 5000 };
    
    setToasts((prev) => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, newToast.duration);
  };
  
  // We need to clear toasts when component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts
      setToasts([]);
    };
  }, []);
  
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${
              toast.variant === "destructive"
                ? "bg-red-600 text-white"
                : "bg-white text-gray-800"
            } p-4 rounded-lg shadow-lg border border-gray-200 flex gap-3 items-start transition-opacity duration-200 ease-in-out opacity-100`}
            style={{ animation: 'slideIn 0.3s ease-out' }}
          >
            <div className="flex-1">
              <div className="font-semibold mb-1">{toast.title}</div>
              {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-sm bg-transparent hover:bg-transparent p-0"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast notifications within a component
 */
export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
}

/**
 * Global toast function for use outside of React components
 */
export const toast = (props: ToastProps) => {
  if (typeof document !== 'undefined') {
    // When used outside a component, create a simple notification
    const toastContainer = document.createElement('div');
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '1rem';
    toastContainer.style.right = '1rem';
    toastContainer.style.zIndex = '9999';
    toastContainer.style.maxWidth = '24rem';
    document.body.appendChild(toastContainer);
    
    const { title, description, variant, duration = 5000 } = props;
    
    const toastElement = document.createElement('div');
    toastElement.className = `p-4 rounded-lg shadow-lg border border-gray-200 animate-in slide-in-from-right`;
    toastElement.style.backgroundColor = variant === 'destructive' ? '#dc2626' : '#ffffff';
    toastElement.style.color = variant === 'destructive' ? '#ffffff' : '#1f2937';
    toastElement.style.marginTop = '0.5rem';
    
    toastElement.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 0.25rem;">${title}</div>
      ${description ? `<div style="font-size: 0.875rem;">${description}</div>` : ''}
    `;
    
    toastContainer.appendChild(toastElement);
    
    setTimeout(() => {
      toastElement.style.opacity = '0';
      toastElement.style.transition = 'opacity 0.3s ease-out';
      
      setTimeout(() => {
        if (document.body.contains(toastContainer)) {
          document.body.removeChild(toastContainer);
        }
      }, 300);
    }, duration);
  }
};

export { ToastProvider as default };
