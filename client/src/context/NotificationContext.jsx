import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Type can be 'success', 'error', or 'info'
  const showNotification = useCallback((message, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Container for Toasts */}
      <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// Individual Toast Component with Animation
const Toast = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entry animation
    requestAnimationFrame(() => setIsVisible(true));

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false); // Trigger exit animation
    setTimeout(onClose, 300); // Remove from DOM after animation finishes
  };

  const styles = {
    success: {
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      border: 'border-green-500/30',
      bg: 'bg-slate-900/95'
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-400" />,
      border: 'border-red-500/30',
      bg: 'bg-slate-900/95'
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-400" />,
      border: 'border-blue-500/30',
      bg: 'bg-slate-900/95'
    }
  };

  const style = styles[type] || styles.info;

  return (
    <div
      onClick={handleClose}
      className={`
        pointer-events-auto cursor-pointer flex items-center gap-3 px-4 py-4 rounded-lg border shadow-xl backdrop-blur-md min-w-[320px] max-w-md
        transition-all duration-300 ease-out transform
        ${style.bg} ${style.border}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="shrink-0">{style.icon}</div>
      <p className="text-slate-200 text-sm font-medium flex-1">{message}</p>
      <button className="text-slate-500 hover:text-white transition-colors shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
