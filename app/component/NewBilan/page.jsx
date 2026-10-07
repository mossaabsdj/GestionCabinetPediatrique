"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddBilanModal({
  open,
  onClose,
  onAdd,
  value,
  setValue,
}) {
  const [form, setForm] = useState({ nom: value || "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setForm({ nom: value || "" });
    }
  }, [open, value]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.nom.trim()) {
      setError("Le nom du bilan est requis.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onAdd({ nom: form.nom.trim() });
      setForm({ nom: "" });
      setError("");
      onClose();
    } catch (err) {
      console.error("Erreur ajout bilan:", err);
      setError(err?.message || "Erreur lors de l'ajout du bilan.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    if (!loading) {
      if (!isOpen) setError("");
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl p-6 shadow-lg border border-[var(--color-200)]">
        <DialogHeader className="flex flex-col items-center space-y-3">
          <div className="p-4 bg-[var(--color-100)] rounded-full shadow-md">
            <ClipboardList className="w-7 h-7 text-[var(--color-700)]" />
          </div>
          <DialogTitle className="text-2xl font-bold text-[var(--color-800)]">
            Nouveau Bilan
          </DialogTitle>
          <p className="text-sm text-gray-500 text-center">
            Remplissez le nom pour ajouter un nouveau type de bilan.
          </p>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          {/* Champ Nom du Bilan */}
          <div>
            <Label htmlFor="nom" className="text-[var(--color-700)] font-medium">
              Nom *
            </Label>
            <Input
              id="nom"
              placeholder="Ex : Bilan sanguin"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              required
              className="h-12 px-4 mt-1 rounded-xl border-gray-300 focus:ring-2 focus:ring-[var(--color-500)] focus:border-[var(--color-400)]"
            />
          </div>

          <DialogFooter className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={onClose}
              className="h-12 px-6 rounded-xl border-gray-300 hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-6 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white font-medium shadow-md flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
