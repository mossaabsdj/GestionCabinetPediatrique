"use client";
import Swal from "sweetalert2";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Trash2,
  User,
  Activity,
  Heart,
  Pill,
  FlaskConical,
  Edit3,
  Save,
  Ruler,
  ChevronLeft,
  ChevronRight,
  Thermometer,
  Droplets,
  Gauge,
  HeartPulse,
  Stethoscope,
  ClipboardList,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function PatientVisits({
  patientId,
  query,
  open,
  setopen,
  fetchPatientById,
}) {
  const [visits, setVisits] = useState([]);
  const [filtredData, setfiltredData] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [currentVisitIndex, setCurrentVisitIndex] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editedData, setEditedData] = useState({});
  const printRef = useRef();
  const bilanPrintRef = useRef();

  // 🔄 Filter by query
  useEffect(() => {
    setfiltredData(visits);
  }, [query, visits]);

  // 🔄 Fetch consultations
  const fetchConsultations = async () => {
    try {
      const res = await fetch(`/api/Consulter?patientId=${patientId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur de chargement");

      if (!data || data.length === 0) {
        setopen(false);
        Swal.fire({
          icon: "info",
          title: "Aucune donnée",
          text: "Aucune consultation trouvée pour ce patient.",
          confirmButtonColor: "#6b21a8", // purple
        });
        setVisits([]);
        setfiltredData([]);
        setSelectedVisit(null);
        return []; // ✅ return empty array
      }
      console.log("🔄 Fetching consultations for patientId:", data);
      const sortedData = data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      setVisits(sortedData);
      setfiltredData(sortedData);
      setSelectedVisit(sortedData[0]);
      return sortedData; // ✅ return fetched data
    } catch (err) {
      console.error("❌ Erreur:", err);
      return []; // ✅ return empty array on error
    }
  };

  useEffect(() => {
    if (!patientId) return;
    fetchConsultations();
  }, [patientId]);

  // 🗑️ Delete consultation
  async function handleDelete(id) {
    if (!id) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/Consulter?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Erreur lors de la suppression de la consultation");
      await fetchConsultations();
      await fetchPatientById(patientId);
      setDeleteConfirm(false);
    } catch (err) {
      console.error(err);
      setDeleteError(err?.message || "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  }

  // 💾 Save modifications
  async function handleSave() {
    setIsSaving(true);
    setSaveError("");
    try {
      const formattedData = {
        ...editedData,
        taille: editedData.taille ? parseFloat(editedData.taille) : null,
        poids: editedData.poids ? parseFloat(editedData.poids) : null,
        perimetreCranien: editedData.perimetreCranien
          ? parseFloat(editedData.perimetreCranien)
          : null,
        tensionSystolique: editedData.tensionSystolique
          ? parseInt(editedData.tensionSystolique)
          : null,
        tensionDiastolique: editedData.tensionDiastolique
          ? parseInt(editedData.tensionDiastolique)
          : null,
        temperature: editedData.temperature
          ? parseFloat(editedData.temperature)
          : null,
        frequenceCardiaque: editedData.frequenceCardiaque
          ? parseInt(editedData.frequenceCardiaque)
          : null,
        frequenceRespiratoire: editedData.frequenceRespiratoire
          ? parseInt(editedData.frequenceRespiratoire)
          : null,
        saturationOxygene: editedData.saturationOxygene
          ? parseInt(editedData.saturationOxygene)
          : null,
        glycemie: editedData.glycemie ? parseFloat(editedData.glycemie) : null,
        createdAt: editedData.createdAt
          ? new Date(editedData.createdAt).toISOString()
          : selectedVisit.createdAt,
      };

      const res = await fetch("/api/Consulter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedVisit.id,
          ...formattedData,
          motifDeConsultation: editedData.motifDeConsultation || null,
          rendezVousDate: editedData.rendezVousDate || null,
          rendezVousDescription: editedData.rendezVousDescription || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour");

      const updatedVisits = await fetchConsultations();
      await fetchPatientById(patientId);

      setSelectedVisit(updatedVisits[currentVisitIndex] || null);
      setIsEditing(false);
    } catch (err) {
      console.error("❌ Erreur lors de la mise à jour:", err);
      setSaveError(err?.message || "Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  }

  // 🔄 Handle form changes
  const handleChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  // Navigate to next/previous visit
  const handleNextVisit = () => {
    if (currentVisitIndex < filtredData.length - 1) {
      const newIndex = currentVisitIndex + 1;
      setCurrentVisitIndex(newIndex);
      setSelectedVisit(filtredData[newIndex]);
      setEditedData(filtredData[newIndex]);
      setIsEditing(false);
    }
  };

  const handlePrevVisit = () => {
    if (currentVisitIndex > 0) {
      const newIndex = currentVisitIndex - 1;
      setCurrentVisitIndex(newIndex);
      setSelectedVisit(filtredData[newIndex]);
      setEditedData(filtredData[newIndex]);
      setIsEditing(false);
    }
  };

  // Get all medical fields (show all in edit mode, only filled in view mode)
  const getMedicalFields = (visit, showAll = false) => {
    const allFields = [
      {
        icon: Stethoscope,
        label: "Motif de consultation",
        value: visit.motifDeConsultation,
        field: "motifDeConsultation",
        type: "textarea",
      },
      {
        icon: ClipboardList,
        label: "Notes",
        value: visit.note,
        field: "note",
        type: "textarea",
      },
      {
        icon: Sparkles,
        label: "Développement psychomoteur",
        value: visit.developpementPsychomoteur,
        field: "developpementPsychomoteur",
        type: "textarea",
      },
      {
        icon: Ruler,
        label: "Périmètre crânien",
        value: visit.perimetreCranien,
        unite: "cm",
        field: "perimetreCranien",
        type: "number",
      },
      {
        icon: Ruler,
        label: "Taille",
        value: visit.taille,
        unite: "cm",
        field: "taille",
        type: "number",
      },
      {
        icon: User,
        label: "Poids",
        value: visit.poids,
        unite: "kg",
        field: "poids",
        type: "number",
      },
      {
        icon: Activity,
        label: "TA Systolique",
        value: visit.tensionSystolique,
        unite: "mmHg",
        field: "tensionSystolique",
        type: "number",
      },
      {
        icon: Activity,
        label: "TA Diastolique",
        value: visit.tensionDiastolique,
        unite: "mmHg",
        field: "tensionDiastolique",
        type: "number",
      },
      {
        icon: Thermometer,
        label: "Température",
        value: visit.temperature,
        unite: "°C",
        field: "temperature",
        type: "number",
      },
      {
        icon: HeartPulse,
        label: "Fréquence cardiaque",
        value: visit.frequenceCardiaque,
        unite: "bpm",
        field: "frequenceCardiaque",
        type: "number",
      },
      {
        icon: Gauge,
        label: "Fréquence respiratoire",
        value: visit.frequenceRespiratoire,
        unite: "cpm",
        field: "frequenceRespiratoire",
        type: "number",
      },
      {
        icon: Droplets,
        label: "Saturation O₂",
        value: visit.saturationOxygene,
        unite: "%",
        field: "saturationOxygene",
        type: "number",
      },
      {
        icon: ClipboardList,
        label: "Glycémie",
        value: visit.glycemie,
        unite: "g/L",
        field: "glycemie",
        type: "number",
      },
    ];

    // In edit mode, show all fields. In view mode, only show filled fields
    if (showAll) {
      return allFields;
    }

    return allFields.filter(
      (field) =>
        field.value !== null && field.value !== undefined && field.value !== "",
    );
  };

  // ⚕️ Medical Info Grid (show all fields in edit mode, only filled in view mode)
  const renderMedicalInfo = (visit) => {
    const fields = getMedicalFields(visit, isEditing);

    if (!isEditing && fields.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Aucune donnée médicale disponible pour cette consultation
        </div>
      );
    }

    return (
      <div className="mt-4 space-y-3">
        {/* Textarea fields in responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {fields
            .filter((f) => f.type === "textarea")
            .map((info, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-sm p-3.5 sm:p-4 border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <info.icon className="text-[var(--color-500)]" size={18} />
                    <span className="text-gray-700 font-medium text-sm">
                      {info.label}
                    </span>
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm bg-gray-50 focus:ring-2 focus:ring-[var(--color-500)] focus:border-[var(--color-500)]"
                      value={editedData[info.field] ?? visit[info.field] ?? ""}
                      onChange={(e) => handleChange(info.field, e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                      {info.value}
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Number fields in responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {fields
            .filter((f) => f.type === "number")
            .map((info, idx) => (
              <Card
                key={idx}
                className="flex items-center justify-between p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-row items-center min-w-0 pr-2">
                  <info.icon
                    className="text-[var(--color-500)] mr-2 flex-shrink-0"
                    size={18}
                  />
                  <span className="text-gray-600 text-xs sm:text-sm truncate">
                    {info.label}
                  </span>
                </div>
                <div className="text-right text-gray-800 flex-shrink-0">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:ring-2 focus:ring-[var(--color-500)]"
                      value={editedData[info.field] ?? visit[info.field] ?? ""}
                      onChange={(e) => handleChange(info.field, e.target.value)}
                    />
                  ) : (
                    <span className="font-semibold text-xs sm:text-sm">
                      {info.value} {info.unite}
                    </span>
                  )}
                </div>
              </Card>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* ====================== */}
      {/* DETAILS DIALOG */}
      {/* ====================== */}
      <Dialog
        open={open}
        onOpenChange={() => {
          setopen(false);
          setIsEditing(false);
        }}
      >
        <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[95vw] md:max-w-[92vw] lg:max-w-6xl xl:max-w-7xl max-h-[92vh] bg-gradient-to-br from-[var(--color-50)] to-white rounded-2xl p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar shadow-2xl">
          {selectedVisit && (
            <>
              <DialogHeader>
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Title and Navigation Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pr-8 sm:pr-10">
                    <DialogTitle className="text-xl sm:text-2xl font-bold text-[var(--color-700)]">
                      Consultation #{selectedVisit.id}
                    </DialogTitle>

                    {/* Center: Pagination Navigation */}
                    {filtredData.length > 1 && (
                      <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-md border border-gray-100">
                        <button
                          onClick={handlePrevVisit}
                          disabled={currentVisitIndex === 0}
                          className={`p-2 sm:p-2.5 rounded-lg transition-all font-semibold ${
                            currentVisitIndex === 0
                              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                              : "bg-[var(--color-500)] text-white hover:bg-[var(--color-600)] shadow-md hover:shadow-lg"
                          }`}
                          title="Précédente"
                        >
                          <ChevronLeft size={18} />
                        </button>

                        <span className="text-xs sm:text-sm font-semibold text-gray-700 min-w-[85px] sm:min-w-[100px] text-center">
                          Visite {currentVisitIndex + 1} / {filtredData.length}
                        </span>

                        <button
                          onClick={handleNextVisit}
                          disabled={
                            currentVisitIndex === filtredData.length - 1
                          }
                          className={`p-2 sm:p-2.5 rounded-lg transition-all font-semibold ${
                            currentVisitIndex === filtredData.length - 1
                              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                              : "bg-[var(--color-500)] text-white hover:bg-[var(--color-600)] shadow-md hover:shadow-lg"
                          }`}
                          title="Suivante"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    )}

                    {/* Right: Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => {
                              setIsEditing(false);
                              setSaveError("");
                              setEditedData(selectedVisit);
                            }}
                            className="px-3.5 sm:px-5 py-2 sm:py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold text-gray-700 text-sm sm:text-base shadow-sm disabled:opacity-50"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleSave}
                            className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition font-semibold shadow-md hover:shadow-lg flex items-center gap-2 text-sm sm:text-base disabled:opacity-50"
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save size={18} />
                            )}{" "}
                            Enregistrer
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-semibold shadow-md hover:shadow-lg flex items-center gap-2 text-sm sm:text-base"
                        >
                          <Edit3 size={15} /> Modifier
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError("");
                          setDeleteConfirm(true);
                        }}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                        title="Supprimer la consultation"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {saveError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mt-2">
                      {saveError}
                    </div>
                  )}

                  {/* Date/Time Row */}
                  <div className="flex flex-wrap justify-end items-center gap-2">
                    {isEditing ? (
                      <input
                        type="datetime-local"
                        className="border-2 border-[var(--color-200)] rounded-xl px-3 sm:px-4 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[var(--color-500)] focus:border-[var(--color-500)] w-full sm:w-auto"
                        value={
                          editedData.createdAt
                            ? typeof editedData.createdAt === "string" &&
                              editedData.createdAt.length === 16
                              ? editedData.createdAt
                              : new Date(editedData.createdAt)
                                  .toISOString()
                                  .slice(0, 16)
                            : selectedVisit.createdAt
                              ? new Date(selectedVisit.createdAt)
                                  .toISOString()
                                  .slice(0, 16)
                              : ""
                        }
                        onChange={(e) => {
                          handleChange("createdAt", e.target.value);
                        }}
                      />
                    ) : (
                      <div className="inline-flex items-center gap-2 sm:gap-3 rounded-xl bg-white px-3.5 sm:px-5 py-2 sm:py-2.5 border-2 border-[var(--color-100)] shadow-md text-xs sm:text-sm">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-600)]" />
                        <span className="text-xs uppercase tracking-wider text-[var(--color-600)] font-semibold">
                          Date & heure
                        </span>
                        <span className="font-bold text-[var(--color-900)] text-sm sm:text-base">
                          {selectedVisit.createdAt
                            ? new Date(selectedVisit.createdAt).toLocaleString(
                                "fr-FR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "—"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* 🗓️ Rendez-vous */}
              {(selectedVisit.rendezVous || isEditing) && (
                <div className="mt-4 bg-white p-3 rounded-lg shadow-sm">
                  <h4 className="text-[var(--color-700)] font-semibold flex items-center gap-2 mb-2">
                    <Calendar size={18} /> Rendez-vous
                  </h4>
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">
                          Date du rendez-vous
                        </label>
                        <input
                          type="datetime-local"
                          className="border rounded-md px-3 py-2 w-full text-sm"
                          value={
                            editedData.rendezVousDate ??
                            (selectedVisit.rendezVous?.date
                              ? new Date(selectedVisit.rendezVous.date)
                                  .toISOString()
                                  .slice(0, 16)
                              : "")
                          }
                          onChange={(e) =>
                            handleChange("rendezVousDate", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">
                          Description
                        </label>
                        <input
                          type="text"
                          className="border rounded-md px-3 py-2 w-full text-sm"
                          value={
                            editedData.rendezVousDescription ??
                            selectedVisit.rendezVous?.description ??
                            ""
                          }
                          onChange={(e) =>
                            handleChange(
                              "rendezVousDescription",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 text-sm">
                      <b>Date :</b>{" "}
                      {selectedVisit.rendezVous?.date
                        ? new Date(
                            selectedVisit.rendezVous.date,
                          ).toLocaleDateString("fr-FR")
                        : "—"}{" "}
                      | <b>Description :</b>{" "}
                      {selectedVisit.rendezVous?.description || "—"}
                    </p>
                  )}
                </div>
              )}

              {/* 🧪 Infos médicales */}
              {renderMedicalInfo(selectedVisit)}

              {/* ====================== */}
              {/* 🔬 BILAN RECIP (Analyses) */}
              {/* ====================== */}
              {selectedVisit?.bilanRecip?.items?.length > 0 && (
                <div ref={bilanPrintRef} className="mt-5">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h3 className="text-[var(--color-700)] font-semibold text-sm sm:text-base flex items-center gap-2">
                      <FlaskConical size={18} /> Bilans / Analyses #
                      {selectedVisit.bilanRecip.id}
                    </h3>
                  </div>
                  <div className="mt-2 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse min-w-[500px]">
                        <thead>
                          <tr className="border-b bg-[var(--color-50)]">
                            <th className="text-left p-2.5 font-semibold text-gray-700">Bilan</th>
                            <th className="text-left p-2.5 font-semibold text-gray-700">Résultat</th>
                            <th className="text-left p-2.5 font-semibold text-gray-700">Remarque</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedVisit.bilanRecip.items.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="p-2.5 text-gray-900 font-medium">{item.bilan?.nom || "—"}</td>
                              <td className="p-2.5 text-gray-700">{item.resultat || "—"}</td>
                              <td className="p-2.5 text-gray-600">{item.remarque || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ====================== */}
              {/* 💊 ORDONNANCE (Prescription) */}
              {/* ====================== */}
              {selectedVisit?.ordonnance?.items?.length > 0 && (
                <div ref={printRef} className="mt-5">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h3 className="text-[var(--color-700)] font-semibold text-sm sm:text-base flex items-center gap-2">
                      <Pill size={18} /> Ordonnance #
                      {selectedVisit.ordonnance.id}
                    </h3>
                    <button
                      onClick={() => {
                        // handlePrintElectron();
                      }}
                      className="text-[var(--color-600)] hover:text-[var(--color-800)] text-sm font-medium"
                    >
                      Imprimer
                    </button>
                  </div>

                  <div className="mt-2 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse min-w-[600px]">
                        <thead>
                          <tr className="border-b bg-[var(--color-50)]">
                            <th className="text-left p-2.5 font-semibold text-gray-700">Médicament</th>
                            <th className="text-left p-2.5 font-semibold text-gray-700">Dosage</th>
                            <th className="text-left p-2.5 font-semibold text-gray-700">Fréquence</th>
                            <th className="text-left p-2.5 font-semibold text-gray-700">Durée</th>
                            <th className="text-left p-2.5 font-semibold text-gray-700">Quantité</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedVisit.ordonnance.items.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="p-2.5 text-gray-900 font-semibold">
                                {item.medicament?.nom || "—"}
                              </td>
                              <td className="p-2.5 text-gray-700">{item.dosage || "—"}</td>
                              <td className="p-2.5 text-gray-700">{item.frequence || "—"}</td>
                              <td className="p-2.5 text-gray-700">{item.duree || "—"}</td>
                              <td className="p-2.5 text-gray-700">{item.quantite || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="mt-8 flex justify-center"></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 🗑️ DELETE CONFIRM DIALOG */}
      <Dialog
        open={deleteConfirm}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setDeleteConfirm(open);
            if (!open) setDeleteError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg bg-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <Trash2 size={24} />
              Supprimer la consultation ?
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-3">
              Cette action est <b className="text-red-600">irréversible</b>.
              Êtes-vous sûr de vouloir continuer ?
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mt-2">
              {deleteError}
            </div>
          )}

          <DialogFooter className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                setDeleteConfirm(false);
                setDeleteError("");
              }}
              className="px-6 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold text-gray-700 shadow-sm disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => handleDelete(selectedVisit?.id)}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition font-semibold shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Supprimer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
