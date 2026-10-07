"use client";

import { useState, useEffect } from "react";
import {
  Stethoscope,
  Loader2,
  AlertTriangle,
  AlertCircle,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function AddPatientModal({ open, onClose, onAdd }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    age: "",
    telephone: "",
    adresse: "",
    antecedents: "",
    sexe: "",
    groupeSanguin: "",
    poidsDeNaissance: "",
    dateDeNaissance: "",
  });

  // Reset errors when modal is opened or closed
  useEffect(() => {
    if (open) {
      setError("");
      setErrorDialogOpen(false);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.nom || !form.nom.trim()) {
      const msg = "Le nom du patient est obligatoire.";
      setError(msg);
      setErrorDialogOpen(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await onAdd({
        ...form,
        nom: form.nom.trim(),
        poidsDeNaissance: form.poidsDeNaissance
          ? parseFloat(form.poidsDeNaissance)
          : null,
        age: form.age ? Number(form.age) : null,
        dateDeNaissance: form.dateDeNaissance
          ? new Date(form.dateDeNaissance)
          : null,
        createdAt: new Date().toISOString(),
      });

      if (result && result.success) {
        setForm({
          nom: "",
          sexe: "",
          age: "",
          telephone: "",
          adresse: "",
          antecedents: "",
          groupeSanguin: "",
          poidsDeNaissance: "",
          dateDeNaissance: "",
        });
        setError("");
        setErrorDialogOpen(false);
        onClose();
      } else {
        const errorMsg =
          result?.error || "Erreur lors de la création du patient.";
        setError(errorMsg);
        setErrorDialogOpen(true);
      }
    } catch (err) {
      const errorMsg = err?.message || "Erreur lors de la création du patient.";
      setError(errorMsg);
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    setError("");
    setErrorDialogOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[97vh] rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <DialogHeader className="flex flex-row items-center justify-center space-y-2 text-center pb-2">
            <div className="p-3 bg-[var(--color-100)] rounded-full shadow-md text-[var(--color-700)]">
              <Stethoscope className="w-7 h-7" />
            </div>
            <DialogTitle className="text-2xl font-bold text-[var(--color-800)] dark:text-slate-100">
              Nouveau Patient
            </DialogTitle>
          </DialogHeader>

          {/* Inline Error Message */}

          <form onSubmit={handleSubmit} className="mt-2 space-y-4">
            {/* Nom obligatoire */}
            <div>
              <Label className="text-[var(--color-700)] dark:text-slate-200 font-medium">
                Nom complet *
              </Label>
              <Input
                placeholder="Nom et prénom du patient"
                value={form.nom}
                onChange={(e) => {
                  setForm({ ...form, nom: e.target.value });
                  if (error) setError("");
                }}
                required
                className={`h-12 px-4 mt-1 rounded-xl border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-[var(--color-500)] ${
                  error && error.toLowerCase().includes("nom")
                    ? "border-red-500 focus:ring-red-400"
                    : ""
                }`}
              />
            </div>

            {/* Grid layout for Date de naissance + Sexe */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[var(--color-700)] dark:text-slate-200 font-medium">
                  Date de naissance
                </Label>
                <Input
                  type="date"
                  value={form.dateDeNaissance}
                  onChange={(e) =>
                    setForm({ ...form, dateDeNaissance: e.target.value })
                  }
                  className="h-12 px-4 mt-1 rounded-xl border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-[var(--color-500)]"
                />
              </div>
              <div>
                <Label className="text-[var(--color-700)] dark:text-slate-200 font-medium">
                  Sexe de l'enfant
                </Label>
                <Select
                  value={form.sexe}
                  onValueChange={(val) => {
                    setForm({ ...form, sexe: val });
                  }}
                >
                  <SelectTrigger className="h-12 px-4 mt-1 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-gray-300 dark:border-slate-700">
                    <SelectValue placeholder="Sélectionner le sexe" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="garçon">Garçon</SelectItem>
                    <SelectItem value="fille">Fille</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Poids de naissance + Groupe Sanguin */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500 dark:text-slate-400 font-medium">
                  Poids de naissance (kg)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 3.2"
                  value={form.poidsDeNaissance}
                  onChange={(e) =>
                    setForm({ ...form, poidsDeNaissance: e.target.value })
                  }
                  className="h-12 px-4 mt-1 rounded-xl bg-gray-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-gray-400 border-gray-300 dark:border-slate-700"
                />
              </div>
              <div>
                <Label className="text-gray-500 dark:text-slate-400 font-medium">
                  Groupe sanguin
                </Label>
                <Select
                  value={form.groupeSanguin}
                  onValueChange={(val) =>
                    setForm({ ...form, groupeSanguin: val })
                  }
                >
                  <SelectTrigger className="h-12 px-4 mt-1 rounded-xl bg-gray-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-gray-300 dark:border-slate-700">
                    <SelectValue placeholder="---" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A_POS">A+</SelectItem>
                    <SelectItem value="A_NEG">A-</SelectItem>
                    <SelectItem value="B_POS">B+</SelectItem>
                    <SelectItem value="B_NEG">B-</SelectItem>
                    <SelectItem value="AB_POS">AB+</SelectItem>
                    <SelectItem value="AB_NEG">AB-</SelectItem>
                    <SelectItem value="O_POS">O+</SelectItem>
                    <SelectItem value="O_NEG">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Adresse + Téléphone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500 dark:text-slate-400 font-medium">
                  Adresse
                </Label>
                <Input
                  placeholder="Ville, quartier..."
                  value={form.adresse}
                  onChange={(e) =>
                    setForm({ ...form, adresse: e.target.value })
                  }
                  className="h-12 px-4 mt-1 rounded-xl bg-gray-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-gray-400 border-gray-300 dark:border-slate-700"
                />
              </div>
              <div>
                <Label className="text-gray-500 dark:text-slate-400 font-medium">
                  Téléphone
                </Label>
                <Input
                  placeholder="0X XX XX XX XX"
                  type="tel"
                  value={form.telephone}
                  onChange={(e) =>
                    setForm({ ...form, telephone: e.target.value })
                  }
                  className="h-12 px-4 mt-1 rounded-xl bg-gray-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-gray-400 border-gray-300 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Antécédents */}
            <div>
              <Label className="text-gray-500 dark:text-slate-400 font-medium">
                Antécédents médicaux / remarques
              </Label>
              <Input
                placeholder="Allergies, antécédents familiaux..."
                value={form.antecedents}
                onChange={(e) =>
                  setForm({ ...form, antecedents: e.target.value })
                }
                className="h-12 px-4 mt-1 rounded-xl bg-gray-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-gray-400 border-gray-300 dark:border-slate-700"
              />
            </div>

            <DialogFooter className="flex justify-end space-x-3 pt-3">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={handleClose}
                className="h-11 px-5 rounded-xl border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 px-6 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white font-medium flex items-center gap-2 shadow-md transition"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Création en cours..." : "Ajouter le patient"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* ⚠️ DIALOG DE GESTION D'ERREUR (COMPOSANT DIALOG, PAS SWEETALERT) */}
      {/* ======================================================== */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="max-w-md w-full rounded-2xl p-6 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 shadow-2xl">
          <DialogHeader className="flex flex-col items-center space-y-3 text-center">
            <div className="p-3 bg-red-100 dark:bg-red-950/60 text-red-600 rounded-full shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Impossible d&rsquo;ajouter le patient
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-700 dark:text-slate-300 pt-1 text-center">
              {error ||
                "Une erreur est survenue lors de l'enregistrement du patient."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex justify-center sm:justify-center">
            <Button
              type="button"
              onClick={() => setErrorDialogOpen(false)}
              className="w-full sm:w-auto px-6 py-2 rounded-xl bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white font-medium shadow-sm transition"
            >
              Compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
