"use client";

import React, { useEffect, useState } from "react";
import {
  Save,
  AlertCircle,
  User,
  Activity,
  Heart,
  FileText,
  Plus,
  FlaskConical,
  Calendar,
  Pill,
  Ruler,
  Clock,
  Trash2,
  Edit2,
  Paperclip,
  Image as ImageIcon,
  CheckCircle2,
  UploadCloud,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
import NewOrdanance from "@/app/component/NewOrdanance/page";

export default function NewConsultationPage({
  selectedPatient = {},
  onSave,
  viderForm,
  setViderForm,
  openAttachModal: externalOpenAttachModal,
  setOpenAttachModal: externalSetOpenAttachModal,
}) {
  const [internalOpenAttachModal, setInternalOpenAttachModal] = useState(false);
  const openAttachModal =
    externalOpenAttachModal !== undefined
      ? externalOpenAttachModal
      : internalOpenAttachModal;
  const setOpenAttachModal =
    externalSetOpenAttachModal || setInternalOpenAttachModal;

  const [form, setForm] = useState({
    note: "",
    ordonnance: {},
    bilanRecip: {},
    justification: null,
    radios: [],
    taille: "",
    poids: "",
    tensionSystolique: "",
    tensionDiastolique: "",
    temperature: "",
    frequenceCardiaque: "",
    frequenceRespiratoire: "",
    saturationOxygene: "",
    glycemie: "",
    developpementPsychomoteur: "",
    motifDeConsultation: "",
    perimetreCranien: "",
    rendezVousDate: "",
    rendezVousDescription: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sub-modal states
  const [showNewOrdonnance, setShowNewOrdonnance] = useState(false);
  const [editingTab, setEditingTab] = useState("ordonnance");

  const [showRadioModal, setShowRadioModal] = useState(false);
  const [editingRadioIndex, setEditingRadioIndex] = useState(null);
  const [radioForm, setRadioForm] = useState({ description: "", fichier: "" });
  const [radioUploading, setRadioUploading] = useState(false);

  const [showRendezVousModal, setShowRendezVousModal] = useState(false);
  const [rdvForm, setRdvForm] = useState({ date: "", description: "" });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: "",
    index: null,
    title: "",
    message: "",
  });

  const setordananceData = (data) => {
    setForm((prev) => {
      const next = { ...prev };
      if (data?.ordonnance?.items && data.ordonnance.items.length > 0) {
        next.ordonnance = data.ordonnance;
      } else if (editingTab === "ordonnance") {
        next.ordonnance = {};
      }

      if (data?.bilanRecip?.items && data.bilanRecip.items.length > 0) {
        next.bilanRecip = data.bilanRecip;
      } else if (editingTab === "labs") {
        next.bilanRecip = {};
      }

      if (data?.justification !== undefined) {
        next.justification = data.justification;
      } else if (editingTab === "justif") {
        next.justification = null;
      }

      return next;
    });

    setShowNewOrdonnance(false);
  };

  useEffect(() => {
    if (selectedPatient && Object.keys(selectedPatient).length > 0) {
      setForm((prev) => ({
        ...prev,
        note: selectedPatient.note ?? "",
        ordonnance: selectedPatient.ordonnance ?? {},
        bilanRecip: selectedPatient.bilanRecip ?? {},
        justification:
          selectedPatient.justificationRecord ||
          (typeof selectedPatient.justification === "object"
            ? selectedPatient.justification
            : selectedPatient.justification
              ? {
                  titre: "Justification médicale",
                  texte: selectedPatient.justification,
                }
              : null),
        radios: Array.isArray(selectedPatient.radios)
          ? selectedPatient.radios
          : [],
        taille: selectedPatient.taille ?? "",
        poids: selectedPatient.poids ?? "",
        tensionSystolique: selectedPatient.tensionSystolique ?? "",
        tensionDiastolique: selectedPatient.tensionDiastolique ?? "",
        temperature: selectedPatient.temperature ?? "",
        frequenceCardiaque: selectedPatient.frequenceCardiaque ?? "",
        frequenceRespiratoire: selectedPatient.frequenceRespiratoire ?? "",
        saturationOxygene: selectedPatient.saturationOxygene ?? "",
        glycemie: selectedPatient.glycemie ?? "",
        developpementPsychomoteur:
          selectedPatient.developpementPsychomoteur ?? "",
        motifDeConsultation: selectedPatient.motifDeConsultation ?? "",
        perimetreCranien: selectedPatient.perimetreCranien ?? "",
        rendezVousDate: selectedPatient?.rendezVous?.date
          ? new Date(selectedPatient.rendezVous.date).toISOString().slice(0, 16)
          : "",
        rendezVousDescription: selectedPatient?.rendezVous?.description ?? "",
      }));
    }
  }, [selectedPatient]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  useEffect(() => {
    if (viderForm) {
      setForm({
        note: "",
        ordonnance: {},
        bilanRecip: {},
        justification: null,
        radios: [],
        taille: "",
        poids: "",
        tensionSystolique: "",
        tensionDiastolique: "",
        temperature: "",
        frequenceCardiaque: "",
        frequenceRespiratoire: "",
        saturationOxygene: "",
        glycemie: "",
        developpementPsychomoteur: "",
        motifDeConsultation: "",
        perimetreCranien: "",
        rendezVousDate: "",
        rendezVousDescription: "",
      });
      setViderForm(false);
    }
  }, [viderForm]);

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await Promise.resolve(onSave?.({ ...form }));
      setSaving(false);
    } catch (e) {
      setSaving(false);
      setError(e?.message ?? "Erreur lors de l'enregistrement");
    }
  }

  // File upload for radio
  const handleRadioFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRadioUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Échec du téléversement du fichier");
      }

      const data = await res.json();
      const savedName = file.name.replace(/ /g, "_");
      setRadioForm((prev) => ({
        ...prev,
        fichier: savedName,
        description: prev.description || file.name.replace(/\.[^/.]+$/, ""),
      }));
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setRadioUploading(false);
    }
  };

  // Radio save
  const handleSaveRadio = () => {
    if (!radioForm.description.trim() && !radioForm.fichier) return;

    if (editingRadioIndex !== null) {
      // Update existing
      setForm((prev) => {
        const nextRadios = [...prev.radios];
        nextRadios[editingRadioIndex] = {
          ...nextRadios[editingRadioIndex],
          description: radioForm.description.trim(),
          fichier: radioForm.fichier,
        };
        return { ...prev, radios: nextRadios };
      });
    } else {
      // Add new
      setForm((prev) => ({
        ...prev,
        radios: [
          ...(prev.radios || []),
          {
            description: radioForm.description.trim() || "Radio",
            fichier: radioForm.fichier,
          },
        ],
      }));
    }

    setShowRadioModal(false);
    setEditingRadioIndex(null);
    setRadioForm({ description: "", fichier: "" });
  };

  // Rendez-vous save
  const handleSaveRendezVous = () => {
    setForm((prev) => ({
      ...prev,
      rendezVousDate: rdvForm.date,
      rendezVousDescription: rdvForm.description,
    }));
    setShowRendezVousModal(false);
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    const { type, index } = deleteDialog;

    if (type === "ordonnance") {
      setForm((prev) => ({ ...prev, ordonnance: {} }));
    } else if (type === "bilan") {
      setForm((prev) => ({ ...prev, bilanRecip: {} }));
    } else if (type === "justification") {
      setForm((prev) => ({ ...prev, justification: null }));
    } else if (type === "rendezVous") {
      setForm((prev) => ({
        ...prev,
        rendezVousDate: "",
        rendezVousDescription: "",
      }));
    } else if (type === "radio" && index !== null && index !== undefined) {
      const targetRadio = form.radios[index];
      if (targetRadio?.id) {
        try {
          await fetch(`/api/radio?id=${targetRadio.id}`, { method: "DELETE" });
        } catch (err) {
          console.error("Delete radio error:", err);
        }
      }
      setForm((prev) => ({
        ...prev,
        radios: prev.radios.filter((_, i) => i !== index),
      }));
    }

    setDeleteDialog({
      open: false,
      type: "",
      index: null,
      title: "",
      message: "",
    });
  };

  const hasOrdonnance = form?.ordonnance?.items?.length > 0;
  const hasBilan = form?.bilanRecip?.items?.length > 0;
  const hasJustification =
    form?.justification &&
    (typeof form.justification === "string"
      ? form.justification.trim()
      : form.justification.texte?.trim());
  const hasRadios = Array.isArray(form?.radios) && form.radios.length > 0;
  const hasRdv = Boolean(form?.rendezVousDate);

  const totalAttachedCount =
    (hasOrdonnance ? 1 : 0) +
    (hasBilan ? 1 : 0) +
    (hasJustification ? 1 : 0) +
    (hasRadios ? form.radios.length : 0) +
    (hasRdv ? 1 : 0);

  const formatRdvDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const medicalInfo = [
    {
      icon: User,
      label: "Taille",
      name: "taille",
      value: form.taille,
      type: "number",
      unite: "cm",
    },
    {
      icon: User,
      label: "Poids",
      name: "poids",
      value: form.poids,
      type: "number",
      unite: "kg",
    },
    {
      icon: Ruler,
      label: "Périmètre crânien",
      name: "perimetreCranien",
      value: form.perimetreCranien,
      type: "number",
      unite: "cm",
    },
    {
      icon: Activity,
      label: "TA systolique",
      name: "tensionSystolique",
      value: form.tensionSystolique,
      type: "number",
      unite: "mmHg",
    },
    {
      icon: Activity,
      label: "TA diastolique",
      name: "tensionDiastolique",
      value: form.tensionDiastolique,
      type: "number",
      unite: "mmHg",
    },
    {
      icon: Activity,
      label: "Température",
      name: "temperature",
      value: form.temperature,
      type: "number",
      unite: "°C",
    },
    {
      icon: Heart,
      label: "Fréquence cardiaque",
      name: "frequenceCardiaque",
      value: form.frequenceCardiaque,
      type: "number",
      unite: "bpm",
    },
    {
      icon: Activity,
      label: "Fréquence respiratoire",
      name: "frequenceRespiratoire",
      value: form.frequenceRespiratoire,
      type: "number",
      unite: "cpm",
    },
    {
      icon: Activity,
      label: "Saturation O₂",
      name: "saturationOxygene",
      value: form.saturationOxygene,
      type: "number",
      unite: "%",
    },
    {
      icon: Activity,
      label: "Glycémie",
      name: "glycemie",
      value: form.glycemie,
      type: "number",
      unite: "g/L",
    },
  ];

  return (
    <div className="min-h-screen w-full dark:bg-gray-900 p-0">
      <div className="max-w-full mx-auto dark:bg-gray-800 rounded-2xl p-6 pt-0 md:p-6 md:pt-0">
        {error && (
          <div className="flex items-center gap-2 mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 🌟 SECTION ÉLÉMENTS ASSOCIÉS (AFFICHÉE EN HAUT) */}
        {/* ======================================================== */}
        <div className="mb-6">
          {/* Empty State Banner */}
          {totalAttachedCount === 0 && (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm text-slate-400">
                  <Paperclip size={18} />
                </div>
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    Aucun document ou élément associé
                  </p>
                  <p className="text-xs text-slate-400">
                    Cliquez sur &laquo; Ajouter &raquo; pour joindre une
                    ordonnance, un bilan, une radio ou planifier un rendez-vous.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => setOpenAttachModal(true)}
                className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white text-xs px-3.5 py-1.5 rounded-lg shadow-sm shrink-0"
              >
                <Plus size={14} className="mr-1.5" />
                Ajouter
              </Button>
            </div>
          )}

          {/* Attached Elements Grid */}
          {totalAttachedCount > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* 💊 Ordonnance Card */}
              {hasOrdonnance && (
                <div className="flex flex-col justify-between p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 dark:bg-blue-950/20 shadow-sm transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        <Pill size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold tracking-wider text-blue-800 dark:text-blue-300 uppercase">
                          Ordonnance
                        </span>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {form.ordonnance.items.length}{" "}
                          {form.ordonnance.items.length > 1
                            ? "médicaments prescrits"
                            : "médicament prescrit"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTab("ordonnance");
                          setShowNewOrdonnance(true);
                        }}
                        className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/40 transition"
                        title="Modifier l'ordonnance"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteDialog({
                            open: true,
                            type: "ordonnance",
                            title: "Supprimer l'ordonnance",
                            message:
                              "Êtes-vous sûr de vouloir retirer cette ordonnance de la consultation ?",
                          })
                        }
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                        title="Supprimer l'ordonnance"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 🔬 Bilan Card */}
              {hasBilan && (
                <div className="flex flex-col justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/20 shadow-sm transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                        <FlaskConical size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase">
                          Bilan Biologique
                        </span>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          {form.bilanRecip.items.length}{" "}
                          {form.bilanRecip.items.length > 1
                            ? "analyses demandées"
                            : "analyse demandée"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTab("labs");
                          setShowNewOrdonnance(true);
                        }}
                        className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40 transition"
                        title="Modifier le bilan"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteDialog({
                            open: true,
                            type: "bilan",
                            title: "Supprimer le bilan",
                            message:
                              "Êtes-vous sûr de vouloir retirer ce bilan biologique de la consultation ?",
                          })
                        }
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                        title="Supprimer le bilan"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 📄 Justification Card */}
              {hasJustification && (
                <div className="flex flex-col justify-between p-3.5 rounded-xl border border-purple-200 bg-purple-50/70 dark:bg-purple-950/20 shadow-sm transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                        <FileText size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold tracking-wider text-purple-800 dark:text-purple-300 uppercase">
                          Justification Médicale
                        </span>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium truncate max-w-[200px]">
                          {form.justification?.titre || "Certificat médical"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTab("justif");
                          setShowNewOrdonnance(true);
                        }}
                        className="p-1.5 rounded-lg text-purple-700 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900/40 transition"
                        title="Modifier la justification"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteDialog({
                            open: true,
                            type: "justification",
                            title: "Supprimer la justification",
                            message:
                              "Êtes-vous sûr de vouloir retirer cette justification / certificat médical ?",
                          })
                        }
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                        title="Supprimer la justification"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 🩻 Radio Cards */}
              {hasRadios &&
                form.radios.map((radio, idx) => (
                  <div
                    key={radio.id || idx}
                    className="flex flex-col justify-between p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70 dark:bg-indigo-950/20 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                          <ImageIcon size={16} />
                        </div>
                        <div>
                          <span className="text-xs font-semibold tracking-wider text-indigo-800 dark:text-indigo-300 uppercase">
                            Radio / Imagerie
                          </span>
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {radio.description || "Examen radiologique"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRadioIndex(idx);
                            setRadioForm({
                              description: radio.description || "",
                              fichier: radio.fichier || "",
                            });
                            setShowRadioModal(true);
                          }}
                          className="p-1.5 rounded-lg text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition"
                          title="Modifier la radio"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              type: "radio",
                              index: idx,
                              title: "Supprimer la radio",
                              message: `Êtes-vous sûr de vouloir retirer cet examen radio (${radio.description || "sans nom"}) ?`,
                            })
                          }
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                          title="Supprimer la radio"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {/* 📅 Prochain Rendez-vous Card */}
              {hasRdv && (
                <div className="flex flex-col justify-between p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 shadow-sm transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold tracking-wider text-amber-800 dark:text-amber-300 uppercase">
                          Prochain Rendez-vous
                        </span>
                        <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                          {formatRdvDate(form.rendezVousDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setRdvForm({
                            date: form.rendezVousDate,
                            description: form.rendezVousDescription || "",
                          });
                          setShowRendezVousModal(true);
                        }}
                        className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40 transition"
                        title="Modifier le rendez-vous"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteDialog({
                            open: true,
                            type: "rendezVous",
                            title: "Supprimer le rendez-vous",
                            message:
                              "Êtes-vous sûr de vouloir supprimer ce prochain rendez-vous ?",
                          })
                        }
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                        title="Supprimer le rendez-vous"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 🩺 Motif de consultation */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-200">
            Motif de consultation
          </label>
          <textarea
            name="motifDeConsultation"
            value={form.motifDeConsultation}
            onChange={handleChange}
            rows={2}
            placeholder="Ex: Fièvre, toux, contrôle systématique, etc."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--color-300)] dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-200">
            Notes cliniques
          </label>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            rows={4}
            placeholder="Observations, antécédents, examen clinique détaillé..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--color-300)] dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Développement psychomoteur */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-200">
            Développement psychomoteur
          </label>
          <textarea
            name="developpementPsychomoteur"
            value={form.developpementPsychomoteur}
            onChange={handleChange}
            rows={2}
            placeholder="Tenue de tête, marche, langage, motricité fine..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--color-300)] dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Infos médicales / Constantes */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">
            Constantes et mesures
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {medicalInfo.map((info) => (
              <Card
                key={info.label}
                className="flex items-center gap-3 p-3 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-row items-center">
                    <info.icon className="text-[var(--color-500)]" size={18} />
                    <span className="text-slate-600 dark:text-slate-300 text-sm font-medium ml-2.5">
                      {info.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type={info.type}
                      name={info.name}
                      value={info.value}
                      onChange={handleChange}
                      placeholder="—"
                      className="text-right w-20 border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-[var(--color-500)] bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100"
                    />
                    {info.unite && (
                      <span className="text-slate-400 text-xs ml-1 font-medium">
                        {info.unite}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-600)] text-white hover:bg-[var(--color-700)] shadow-md disabled:opacity-60 transition-all font-medium text-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer la consultation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🎯 MODAL SÉLECTION DU TYPE D'ÉLÉMENT À AJOUTER */}
      {/* ======================================================== */}
      <Dialog open={openAttachModal} onOpenChange={setOpenAttachModal}>
        <DialogContent className="sm:max-w-lg w-full rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader className="text-left space-y-1 mb-2">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Ajouter à la consultation
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Choisissez le type d&rsquo;élément que vous souhaitez associer à
              cette consultation :
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 py-2">
            {/* Option 1: Ordonnance / Bilan / Justification */}
            <button
              type="button"
              onClick={() => {
                setOpenAttachModal(false);
                setEditingTab("ordonnance");
                setShowNewOrdonnance(true);
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-blue-50/50 hover:border-blue-300 dark:hover:bg-blue-950/20 transition-all group text-left shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 group-hover:scale-105 transition-transform">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    Ordonnance / Bilan / Justification
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Prescriptions médicamenteuses, examens biologiques ou
                    certificats médicaux.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* Option 2: Radio */}
            <button
              type="button"
              onClick={() => {
                setOpenAttachModal(false);
                setEditingRadioIndex(null);
                setRadioForm({ description: "", fichier: "" });
                setShowRadioModal(true);
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-indigo-50/50 hover:border-indigo-300 dark:hover:bg-indigo-950/20 transition-all group text-left shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                    Radio & Imagerie
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Joindre un examen de radiographie, échographie ou
                    compte-rendu d&rsquo;imagerie.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>

            {/* Option 3: Prochain RDV */}
            <button
              type="button"
              onClick={() => {
                setOpenAttachModal(false);
                setRdvForm({
                  date: form.rendezVousDate || "",
                  description: form.rendezVousDescription || "",
                });
                setShowRendezVousModal(true);
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-amber-50/50 hover:border-amber-300 dark:hover:bg-amber-950/20 transition-all group text-left shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    Prochain rendez-vous
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Programmer une date de contrôle, suivi vaccinal ou prochaine
                    visite.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenAttachModal(false)}
              className="w-full rounded-xl"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 💊 MODAL ORDONNANCE / BILAN / JUSTIFICATION (EXISTANT REUTILISÉ) */}
      {/* ======================================================== */}
      {showNewOrdonnance && (
        <NewOrdanance
          open={showNewOrdonnance}
          onOpenChange={setShowNewOrdonnance}
          onsave={setordananceData}
          selectedPatient={selectedPatient}
          initialData={{
            ordonnance: form.ordonnance,
            bilanRecip: form.bilanRecip,
            justification: form.justification,
          }}
          initialTab={editingTab}
        />
      )}

      {/* ======================================================== */}
      {/* 🩻 MODAL RADIO & IMAGERIE */}
      {/* ======================================================== */}
      <Dialog open={showRadioModal} onOpenChange={setShowRadioModal}>
        <DialogContent className="sm:max-w-md w-full rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader className="text-left space-y-1 mb-2">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-600" />
              {editingRadioIndex !== null
                ? "Modifier la radio"
                : "Ajouter une radio"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Renseignez la description et téléversez le document radiologique.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Description / Indication
              </Label>
              <Input
                type="text"
                placeholder="Ex: Radio thorax face, Écho abdominale..."
                value={radioForm.description}
                onChange={(e) =>
                  setRadioForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Fichier d&rsquo;imagerie
              </Label>
              <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <input
                  type="file"
                  id="radio-file-input"
                  className="hidden"
                  onChange={handleRadioFileUpload}
                  disabled={radioUploading}
                />
                <label
                  htmlFor="radio-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  {radioUploading ? (
                    <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Téléversement en cours...
                    </div>
                  ) : radioForm.fichier ? (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="truncate max-w-[220px]">
                        {radioForm.fichier}
                      </span>
                      <span className="text-xs text-slate-400">
                        (cliquer pour changer)
                      </span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-indigo-500" />
                      <span className="text-xs font-semibold text-indigo-600">
                        Choisir un fichier
                      </span>
                      <span className="text-2xs text-slate-400">
                        PNG, JPG, PDF, DICOM
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRadioModal(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSaveRadio}
              disabled={
                radioUploading ||
                (!radioForm.description.trim() && !radioForm.fichier)
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 📅 MODAL PROCHAIN RENDEZ-VOUS */}
      {/* ======================================================== */}
      <Dialog open={showRendezVousModal} onOpenChange={setShowRendezVousModal}>
        <DialogContent className="sm:max-w-md w-full rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader className="text-left space-y-1 mb-2">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Planifier le prochain rendez-vous
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Fixez la date, l&rsquo;heure et le motif de la prochaine visite.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Date et heure du rendez-vous
              </Label>
              <Input
                type="datetime-local"
                value={rdvForm.date}
                onChange={(e) =>
                  setRdvForm((prev) => ({ ...prev, date: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Motif / Description
              </Label>
              <Input
                type="text"
                placeholder="Ex: Contrôle post-traitement, vaccin 9 mois..."
                value={rdvForm.description}
                onChange={(e) =>
                  setRdvForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRendezVousModal(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSaveRendezVous}
              disabled={!rdvForm.date}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* ⚠️ DIALOGUE DE CONFIRMATION DE SUPPRESSION */}
      {/* ======================================================== */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md w-full rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader className="text-left space-y-1.5">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {deleteDialog.title || "Confirmer la suppression"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 pt-1">
              {deleteDialog.message}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDeleteDialog({
                  open: false,
                  type: "",
                  index: null,
                  title: "",
                  message: "",
                })
              }
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Oui, supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
