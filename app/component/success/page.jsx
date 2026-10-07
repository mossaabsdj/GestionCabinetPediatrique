"use client";
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
} from "lucide-react";

export function SuccessDialog({
  isOpen,
  onClose,
  type = "success",
  title = "Succès !",
  description = "L'opération s'est déroulée avec succès.",
  icon: CustomIcon,
  autoClose = true,
  autoCloseDelay = 3000,
  loading = false,
  loadingText = "Traitement en cours...",
  actionText = "OK",
}) {
  useEffect(() => {
    if (autoClose && isOpen && !loading && type !== "error") {
      const timer = setTimeout(() => {
        onClose?.();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, isOpen, autoCloseDelay, onClose, loading, type]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  // Choose icon and color scheme based on type
  let DefaultIcon = CheckCircle2;
  let iconBgClass = "from-emerald-100 to-emerald-50 text-emerald-600";
  let buttonClass = "bg-emerald-600 hover:bg-emerald-700 text-white";
  let borderClass = "border-emerald-200/80";

  if (type === "error") {
    DefaultIcon = XCircle;
    iconBgClass = "from-rose-100 to-rose-50 text-rose-600";
    buttonClass = "bg-rose-600 hover:bg-rose-700 text-white";
    borderClass = "border-rose-200/80";
  } else if (type === "warning") {
    DefaultIcon = AlertTriangle;
    iconBgClass = "from-amber-100 to-amber-50 text-amber-600";
    buttonClass = "bg-amber-600 hover:bg-amber-700 text-white";
    borderClass = "border-amber-200/80";
  } else if (type === "info") {
    DefaultIcon = Info;
    iconBgClass = "from-sky-100 to-sky-50 text-sky-600";
    buttonClass = "bg-sky-600 hover:bg-sky-700 text-white";
    borderClass = "border-sky-200/80";
  } else {
    // Primary / Default Success
    iconBgClass =
      "from-[var(--color-100)] to-[var(--color-50)] text-[var(--color-600)]";
    buttonClass =
      "bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white";
    borderClass = "border-[var(--color-200)]";
  }

  const Icon = CustomIcon || DefaultIcon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={loading ? undefined : onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Dialog Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className={`relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border ${borderClass} overflow-hidden z-10`}
      >
        {/* Close Button on top right */}
        {!loading && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col items-center text-center space-y-4">
          {loading ? (
            // Loading State
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <div className="rounded-full bg-gradient-to-br from-gray-100 to-gray-50 p-4 shadow-md">
                  <Loader2 className="h-16 w-16 text-[var(--color-600)]" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="space-y-2"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  {loadingText}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Veuillez patienter quelques instants...
                </p>
              </motion.div>
            </>
          ) : (
            // Success / Error / Warning State
            <>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 18,
                  delay: 0.05,
                }}
              >
                <div
                  className={`rounded-full bg-gradient-to-br ${iconBgClass} p-4 shadow-lg`}
                >
                  <Icon className="h-16 w-16" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="space-y-2 w-full"
              >
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <div className="text-sm text-gray-600 leading-relaxed max-h-48 overflow-y-auto px-2">
                  {description}
                </div>
              </motion.div>

              {/* Action Button */}
              <div className="pt-2 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className={`w-full py-2.5 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-sm ${buttonClass}`}
                >
                  {actionText}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Unified wrapper component compatible with existing code
export default function AlertModal({
  config,
  dialogOpen,
  setDialogOpen,
  loading,
}) {
  return (
    <AnimatePresence>
      {dialogOpen && (
        <SuccessDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          type={config?.type || "success"}
          title={config?.title}
          description={config?.description}
          loadingText={config?.loadingText}
          autoClose={config?.autoClose ?? true}
          autoCloseDelay={config?.autoCloseDelay ?? 3000}
          actionText={config?.actionText || "OK"}
          loading={loading}
        />
      )}
    </AnimatePresence>
  );
}
