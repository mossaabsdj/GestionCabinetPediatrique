"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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

export default function Analyses({
  patientID,
  ShowAddDialogNewAnalyse,
  setShowAddDialogNewAnalyse,
  dateFilter,
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [formData, setFormData] = useState({
    consultationId: "",
    type: "",
    description: "",
    fichier: "",
  });
  const [basePath, setBasePath] = useState("");

  const filteredFiles = useMemo(() => {
    if (!dateFilter) return files;
    return files.filter((file) => isSameDate(file.createdAt, dateFilter));
  }, [files, dateFilter]);

  useEffect(() => {
    // Get Electron path only if available
    if (typeof window !== "undefined" && window?.electron?.getAppPath) {
      window.electron
        .getAppPath()
        .then((path) => {
          setBasePath(path);
        })
        .catch(() => setBasePath(""));
    }
  }, []);
  // ✅ Fetch files (filtered by patient)
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const [radiosRes, bilansRes] = await Promise.all([
        fetch("/api/radio"),
        fetch("/api/bilanfile"),
      ]);

      const [radios, bilans] = await Promise.all([
        radiosRes.json(),
        bilansRes.json(),
      ]);

      // Filter only the patient’s files
      const filteredRadios = Array.isArray(radios)
        ? radios.filter((r) => r.patient && r.patient.id === Number(patientID))
        : [];
      const filteredBilans = Array.isArray(bilans)
        ? bilans.filter((b) => b.patient && b.patient.id === Number(patientID))
        : [];

      const combined = [
        ...filteredRadios.map((r) => ({
          id: r.id,
          name: r.description || "Radio",
          date: new Date(r.createdAt).toLocaleDateString("fr-FR"),
          createdAt: r.createdAt,
          type: "Radio",
          fichier: r.fichier,
        })),
        ...filteredBilans.map((b) => ({
          id: b.id,
          name: b.description || "Bilan",
          date: new Date(b.createdAt).toLocaleDateString("fr-FR"),
          createdAt: b.createdAt,
          type: "Bilan",
          fichier: b.fichier,
        })),
      ];

      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setFiles(combined);
    } catch (err) {
      console.error("Erreur de chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientID) fetchFiles();
  }, [patientID]);

  // ✅ Open file in new tab or Electron shell
  const openFile = (fileName) => {
    if (!fileName) return;
    if (typeof window !== "undefined" && window?.electron?.openFile) {
      const fullPath = basePath
        ? `${basePath}/public/uploads/${fileName}`
        : fileName;
      window.electron.openFile(fullPath);
    } else if (typeof window !== "undefined") {
      window.open(`/uploads/${fileName}`, "_blank");
    }
  };

  // ✅ Add new file
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type) {
      setSubmitError("Veuillez sélectionner un type d'analyse.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const endpoint =
        formData.type.toLowerCase() === "radio"
          ? "/api/radio"
          : "/api/bilanfile";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          patientId: Number(patientID),
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'enregistrement de l'analyse.");
      }

      setShowAddDialogNewAnalyse(false);
      setFormData({
        consultationId: null,
        type: "",
        description: "",
        fichier: "",
      });
      fetchFiles();
    } catch (err) {
      console.error("Erreur lors de l’ajout:", err);
      setSubmitError(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = async (file) => {
    if (file) {
      try {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });
        if (!response.ok) {
          throw new Error("Erreur lors du téléchargement du fichier.");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setSubmitError(error?.message || "Erreur lors du téléchargement du fichier.");
      }
    }
  };

  // ✅ Delete confirmation
  const confirmDelete = (file) => {
    setFileToDelete(file);
    setDeleteError("");
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const endpoint =
        fileToDelete.type === "Radio" ? "/api/radio?id=" : "/api/bilanfile?id=";
      const res = await fetch(endpoint + fileToDelete.id, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Erreur lors de la suppression.");
      }
      setShowDeleteDialog(false);
      setFileToDelete(null);
      fetchFiles();
    } catch (err) {
      console.error("Erreur de suppression:", err);
      setDeleteError(err?.message || "Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-5">
      {/* Content */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[var(--color-100)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--color-600)] text-white">
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                  Nom
                </th>
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`analyse-skel-${idx}`} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 w-48 bg-[var(--color-200)]/60 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-16 bg-[var(--color-200)]/60 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 bg-[var(--color-200)]/60 rounded" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="h-8 w-8 mx-auto bg-[var(--color-200)]/60 rounded-full" />
                    </td>
                  </tr>
                ))
              ) : filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {dateFilter
                      ? "Aucun document ou analyse trouvé pour cette date."
                      : "Aucun document ou analyse trouvé pour ce patient."}
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file, index) => (
                  <tr
                    key={file.id}
                    className={`cursor-pointer transition-colors hover:bg-[var(--color-50)] ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                    onClick={() => openFile(file.fichier)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {file.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          file.type === "Radio"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {file.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                        <Calendar
                          size={16}
                          className="text-[var(--color-500)]"
                        />
                        {file.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(file);
                        }}
                        className="group h-9 w-9 inline-flex items-center justify-center
                    rounded-full border border-red-200 bg-red-50/60 text-red-500
                    hover:bg-red-100 hover:border-red-300 hover:text-red-600
                    shadow-sm hover:shadow-md transition-all duration-300"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Add Dialog */}
      <Dialog
        open={ShowAddDialogNewAnalyse}
        onOpenChange={(open) => {
          if (!submitting) {
            setShowAddDialogNewAnalyse(open);
            if (!open) setSubmitError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-700)]">
              Ajouter une analyse
            </DialogTitle>
          </DialogHeader>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div>
              <Label>Type (Radio / Bilan)</Label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-500)]"
              >
                <option value="">Select Type</option>
                <option value="Radio">Radio</option>
                <option value="Bilan">Bilan</option>
              </select>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Lien du fichier</Label>
              <Input
                type="file"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFormData({ ...formData, fichier: e.target.files[0].name });
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-500)]"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  setShowAddDialogNewAnalyse(false);
                  setSubmitError("");
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ✅ Delete Confirmation */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!deleting) {
            setShowDeleteDialog(open);
            if (!open) {
              setDeleteError("");
              setFileToDelete(null);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-700)]">
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {deleteError}
            </div>
          )}

          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer{" "}
            <span className="font-semibold">{fileToDelete?.name}</span> ?
          </p>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteError("");
                setFileToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
