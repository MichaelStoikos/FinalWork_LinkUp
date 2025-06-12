import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

/**
 * Custom hook to access the toast context.
 * Provides access to the showToast function for displaying notifications.
 * 
 * @returns {Object} The toast context value containing showToast function
 */
export function useToast() {
  return useContext(ToastContext);
}

/**
 * ToastProvider component that provides toast notification functionality.
 * Manages toast state and provides a showToast function to display notifications.
 * Automatically removes toasts after a specified duration.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} The provider component with toast functionality
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /**
   * Displays a toast notification with the specified message and type.
   * Automatically removes the toast after the specified duration.
   * 
   * @param {string} message - The message to display in the toast
   * @param {string} type - The type of toast ('success', 'error', 'warning', etc.)
   * @param {number} duration - Duration in milliseconds before auto-removal
   */
  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((toasts) => [...toasts, { id, message, type }]);
    setTimeout(() => {
      setToasts((toasts) => toasts.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
} 