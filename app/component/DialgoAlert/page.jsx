"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DialogAlert({ open, onClose, title, message }) {
  const handleClose = () => {
    onClose?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-md border border-[var(--color-200)] shadow-lg">
        <DialogHeader className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[var(--color-600)]" />
          <DialogTitle className="text-[var(--color-700)] font-semibold">
            {title || "Alerte"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-gray-700 py-2">
          {message || "Une erreur s’est produite."}
        </DialogDescription>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleClose}
            className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white cursor-pointer"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
