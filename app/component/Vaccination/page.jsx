"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Syringe, CalendarClock, AlertCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function isSameDate(itemDate, targetDateStr) {
  if (!targetDateStr) return true;
  if (!itemDate) return false;
  const d = new Date(itemDate);
  if (isNaN(d.getTime())) return false;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` === targetDateStr;
}

export default function Vaccination({
  patientId,
  refrech,
  setrefrech,
  query,
  dateFilter,
}) {
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const filteredVaccinations = useMemo(() => {
    return vaccinations.filter((v) => {
      const name = v.vaccine?.name || v.name || "";
      const matchesName =
        !query || name.toLowerCase().includes(query.trim().toLowerCase());
      const itemDate = v.dateGiven || v.createdAt;
      const matchesDate = isSameDate(itemDate, dateFilter);
      return matchesName && matchesDate;
    });
  }, [vaccinations, query, dateFilter]);

  // ✅ Fetch vaccinations
  useEffect(() => {
    if (!patientId) return;

    async function fetchVaccinations() {
      setLoading(true);
      try {
        const res = await fetch(`/api/vaccinations?patientId=${patientId}`);
        if (!res.ok)
          throw new Error("Erreur lors du chargement des vaccinations");

        const data = await res.json();
        setVaccinations(data);
      } catch (error) {
        console.error("❌ Erreur:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchVaccinations();
    if (refrech) {
      setrefrech(false);
    }
  }, [patientId, refrech]);

  // ✅ Delete function
  const handleDelete = async () => {
    if (!selectedVaccine) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/vaccinations?id=${selectedVaccine.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de la suppression");
      }

      setVaccinations((prev) =>
        prev.filter((v) => v.id !== selectedVaccine.id),
      );
      setOpenDialog(false);
      setSelectedVaccine(null);
    } catch (error) {
      console.error("❌ Erreur suppression vaccination:", error);
      setDeleteError(error?.message || "Erreur lors de la suppression de la vaccination.");
    } finally {
      setDeleting(false);
    }
  };

  if (!patientId) {
    return (
      <div className="p-4 flex items-center gap-2 text-gray-500">
        <AlertCircle className="w-5 h-5 text-gray-400" />
        <p>Aucun patient sélectionné.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[var(--color-100)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[var(--color-600)] to-[var(--color-500)] text-white">
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                  Vaccin
                </th>
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                  Dose
                </th>
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                  Notes
                </th>
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`vac-skeleton-${idx}`} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-200)]/60" />
                        <div className="h-4 w-40 bg-[var(--color-200)]/60 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 bg-[var(--color-200)]/60 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-16 bg-[var(--color-200)]/60 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-32 bg-[var(--color-200)]/60 rounded" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="h-8 w-8 mx-auto bg-[var(--color-200)]/60 rounded-full" />
                    </td>
                  </tr>
                ))
              ) : filteredVaccinations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {query || dateFilter
                      ? "Aucune vaccination trouvée pour les critères sélectionnés."
                      : "Aucune vaccination trouvée pour ce patient."}
                  </td>
                </tr>
              ) : (
                filteredVaccinations.map((vaccine, index) => (
                  <tr
                    key={vaccine.id}
                    className={`transition-colors hover:bg-[var(--color-50)] ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--color-100)] rounded-full">
                          <Syringe className="w-4 h-4 text-[var(--color-700)]" />
                        </div>
                        <span className="font-semibold text-gray-900">
                          {vaccine.vaccine?.name || vaccine.name || "Vaccin"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                        <CalendarClock
                          size={16}
                          className="text-[var(--color-500)]"
                        />
                        {new Date(vaccine.dateGiven).toLocaleDateString(
                          "fr-FR",
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {vaccine.doseNumber ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-100)] text-[var(--color-800)]">
                          Dose {vaccine.doseNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {vaccine.notes ? (
                        <span className="text-sm text-gray-600 italic">
                          {vaccine.notes}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="group h-9 w-9 rounded-full border border-red-200 bg-red-50/50 
                    hover:bg-red-100 hover:border-red-300 transition-all duration-300 shadow-sm
                    hover:shadow-md"
                        onClick={() => {
                          setSelectedVaccine(vaccine);
                          setOpenDialog(true);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform duration-300" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Delete confirmation dialog */}
      <Dialog
        open={openDialog}
        onOpenChange={(isOpen) => {
          if (!deleting) {
            setOpenDialog(isOpen);
            if (!isOpen) setDeleteError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-700)]">
              Supprimer la vaccination
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <span className="font-semibold text-[var(--color-700)]">
                {selectedVaccine?.vaccine.name}
              </span>
              ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
              {deleteError}
            </div>
          )}
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => {
                setDeleteError("");
                setOpenDialog(false);
              }}
              className="border-gray-300"
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 cursor-pointer"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
