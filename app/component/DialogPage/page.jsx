"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ConfirmDialog({
  title,
  description,
  onConfirm,
  triggerText,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onConfirm();
      setOpen(false);
    } catch (err) {
      console.error("Erreur confirmation:", err);
      setError(err?.message || "Une erreur est survenue lors de l'opération.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    if (!loading) {
      setOpen(isOpen);
      if (!isOpen) setError("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          {triggerText}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="text-sm font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            {error}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <Button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Suppression..." : "Confirmer"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
