"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Coins,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  Plus,
  Trash2,
  Receipt,
  Search,
  Filter,
  ArrowDownRight,
  TrendingUp,
  FileText,
  Calendar,
  X,
  Loader2,
  Check,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PatientFinances({
  patient,
  onRefresh,
  externalSearchQuery,
  externalDateFilter,
  openAddVersementModal,
  setOpenAddVersementModal,
}) {
  const [filterStatus, setFilterStatus] = useState("all"); // "all", "paye", "partiel", "impaye"
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const searchQuery =
    externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery =
    externalSearchQuery !== undefined ? () => {} : setInternalSearchQuery;
  const dateFilter = externalDateFilter || "";

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyConsultation, setHistoryConsultation] = useState(null);
const [showDateEdit, setShowDateEdit] = useState(false);
  // Payment form state
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payNote, setPayNote] = useState("Espèces");
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [successBanner, setSuccessBanner] = useState("");

  // Delete versement dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [versementToDelete, setVersementToDelete] = useState(null);
  const [deletingVersement, setDeletingVersement] = useState(false);

  // 1. Process consultations & calculate finances dynamically
  const consultationsData = useMemo(() => {
    if (!patient?.consultations) return [];

    return patient.consultations.map((c, index) => {
      const prix = c.prix !== null && c.prix !== undefined ? Number(c.prix) : 0;
      const versements = c.versements || [];
      const totalPaye = versements.reduce((sum, v) => sum + (Number(v.montant) || 0), 0);
      const reste = Math.max(0, prix - totalPaye);
      let statut = "impaye";
      if (reste <= 0 && (prix > 0 || totalPaye > 0)) {
        statut = "paye";
      } else if (totalPaye > 0 && reste > 0) {
        statut = "partiel";
      }

      return {
        ...c,
        consultationNumber: index + 1,
        calculatedPrix: prix,
        totalPaye,
        reste,
        statut,
        versementsList: versements,
      };
    });
  }, [patient]);

  // 2. Summary aggregates
  const summary = useMemo(() => {
    const totalConsultations = consultationsData.reduce((acc, c) => acc + c.calculatedPrix, 0);
    const totalPaye = consultationsData.reduce((acc, c) => acc + c.totalPaye, 0);
    const totalReste = consultationsData.reduce((acc, c) => acc + c.reste, 0);
    const percentPaid = totalConsultations > 0 ? Math.round((totalPaye / totalConsultations) * 100) : 0;

    return {
      totalConsultations,
      totalPaye,
      totalReste,
      percentPaid,
    };
  }, [consultationsData]);

  // 3. Filtered consultations
  const filteredConsultations = useMemo(() => {
    return consultationsData.filter((c) => {
      if (filterStatus !== "all" && c.statut !== filterStatus) return false;
      if (dateFilter) {
        const cDate = new Date(c.createdAt).toISOString().split("T")[0];
        if (cDate !== dateFilter) return false;
      }
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const dateStr = new Date(c.createdAt).toLocaleDateString("fr-FR");
        const motif = (c.motifDeConsultation || "").toLowerCase();
        const note = (c.note || "").toLowerCase();
        const prixStr = String(c.calculatedPrix);
        const payeStr = String(c.totalPaye);
        const resteStr = String(c.reste);
        return (
          c.id.toString().includes(q) ||
          c.consultationNumber.toString().includes(q) ||
          dateStr.includes(q) ||
          motif.includes(q) ||
          note.includes(q) ||
          prixStr.includes(q) ||
          payeStr.includes(q) ||
          resteStr.includes(q)
        );
      }
      return true;
    });
  }, [consultationsData, filterStatus, searchQuery, dateFilter]);

  // Consultations with credit only (reste > 0)
  const consultationsWithCredit = useMemo(() => {
    return consultationsData.filter((c) => (Number(c.reste) || 0) > 0);
  }, [consultationsData]);

  // Handle Consultation Selection Change
  const handleConsultationChange = (consultId) => {
    const consult = consultationsWithCredit.find(
      (c) => String(c.id) === String(consultId)
    );
    if (consult) {
      setSelectedConsultation(consult);
      setPayAmount(String(consult.reste));
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (consultation) => {
    setSelectedConsultation(consultation);
    setPayAmount(String(consultation.reste));
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayNote("Espèces");
    setPaymentError("");
    setPaymentModalOpen(true);
  };

  // Open Payment Modal from header
  useEffect(() => {
    if (openAddVersementModal) {
      setPaymentError("");
      if (consultationsWithCredit.length > 0) {
        handleOpenPaymentModal(consultationsWithCredit[0]);
      } else {
        setSelectedConsultation(null);
        setPayAmount("");
        setPaymentModalOpen(true);
      }
      if (setOpenAddVersementModal) {
        setOpenAddVersementModal(false);
      }
    }
  }, [openAddVersementModal, consultationsWithCredit]);

  // Submit Payment
  const handleSavePayment = async (e) => {
    e?.preventDefault?.();
    setPaymentError("");

    if (!selectedConsultation) {
      setPaymentError("Veuillez sélectionner une consultation.");
      return;
    }

    const amountNum = parseFloat(
      String(payAmount).replace(/\s+/g, "").replace(/,/g, ".")
    );
    if (isNaN(amountNum) || amountNum <= 0) {
      setPaymentError("Veuillez saisir un montant valide supérieur à 0 DZD.");
      return;
    }

    const maxReste = Number(selectedConsultation.reste) || 0;
    if (amountNum > maxReste) {
      setPaymentError(
        `Le montant ne peut pas dépasser le reste à payer (${maxReste.toLocaleString("fr-FR")} DZD).`
      );
      return;
    }

    const currentTotalPaye = Number(selectedConsultation.totalPaye) || 0;
    const currentPrice =
      Number(selectedConsultation.calculatedPrix ?? selectedConsultation.prix) || 0;
    const finalPrice = Math.max(currentPrice, currentTotalPaye + amountNum);

    try {
      setSavingPayment(true);
      const res = await fetch("/api/versements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montant: amountNum,
          prix: finalPrice,
          patientId: parseInt(patient.id),
          consultationId: parseInt(selectedConsultation.id),
          date: payDate,
          note: payNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || "Erreur lors de l'enregistrement du versement."
        );
      }

      setPaymentModalOpen(false);
      setSuccessBanner(
        `Versement de ${amountNum.toLocaleString("fr-FR")} DZD enregistré avec succès pour la consultation N° ${selectedConsultation.id}.`
      );
      setTimeout(() => setSuccessBanner(""), 4500);

      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error(err);
      setPaymentError(err.message || "Erreur réseau.");
    } finally {
      setSavingPayment(false);
    }
  };

  // Open History Modal
  const handleOpenHistoryModal = (consultation) => {
    setHistoryConsultation(consultation);
    setHistoryModalOpen(true);
  };

  // Delete Versement
  const handleConfirmDeleteVersement = async () => {
    if (!versementToDelete) return;
    try {
      setDeletingVersement(true);
      const res = await fetch(`/api/versements/${versementToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la suppression.");
      }

      setDeleteDialogOpen(false);
      setVersementToDelete(null);
      setSuccessBanner("Versement supprimé avec succès.");
      setTimeout(() => setSuccessBanner(""), 4000);

      // Close history if empty, or refresh
      setHistoryModalOpen(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert(err.message || "Erreur lors de la suppression.");
    } finally {
      setDeletingVersement(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Shadcn Inline Success Alert Banner */}
      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-xs font-semibold shadow-2xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner("")}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION A: PATIENT FINANCIAL SUMMARY CARDS               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Consultations */}
        <Card className="p-4 rounded-2xl border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Consultations
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {summary.totalConsultations.toLocaleString()}{" "}
              <span className="text-xs font-bold text-slate-400">DZD</span>
            </div>
            <p className="text-2xs text-slate-400 mt-1">
              Sur {consultationsData.length} consultation(s) enregistrée(s)
            </p>
          </div>
        </Card>

        {/* Total Payé */}
        <Card className="p-4 rounded-2xl border-emerald-200/80 bg-emerald-50/30 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Total Payé (Encaissé)
            </span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {summary.totalPaye.toLocaleString()}{" "}
              <span className="text-xs font-bold text-emerald-500">DZD</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, summary.percentPaid)}%` }}
                />
              </div>
              <span className="text-2xs font-bold text-emerald-800">
                {summary.percentPaid}%
              </span>
            </div>
          </div>
        </Card>

        {/* Reste à Payer / Crédit */}
        <Card className={`p-4 rounded-2xl shadow-2xs flex flex-col justify-between ${
          summary.totalReste > 0
            ? "border-rose-200/90 bg-rose-50/40"
            : "border-slate-200 bg-slate-50/50"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              summary.totalReste > 0 ? "text-rose-700" : "text-slate-500"
            }`}>
              Reste à Payer (Crédit)
            </span>
            <div className={`p-2 rounded-xl ${
              summary.totalReste > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-500"
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black tracking-tight ${
              summary.totalReste > 0 ? "text-rose-700" : "text-slate-700"
            }`}>
              {summary.totalReste.toLocaleString()}{" "}
              <span className="text-xs font-bold opacity-60">DZD</span>
            </div>
            <p className={`text-2xs mt-1 font-medium ${
              summary.totalReste > 0 ? "text-rose-600" : "text-emerald-600"
            }`}>
              {summary.totalReste > 0
                ? "Solde débiteur restant à régulariser"
                : "Toutes les consultations sont soldées"}
            </p>
          </div>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* SECTION B: CONSULTATION PAYMENTS TABLE                   */}
      {/* ======================================================== */}
      <Card className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
        {/* Header with Search and Filter Tabs */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              Historique Financier des Consultations
            </h3>
            <p className="text-xs text-slate-500">
              Suivi détaillé des honoraires et versements par acte médical
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search input (displayed only if no external search bar in header) */}
            {externalSearchQuery === undefined && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-500)] w-36 sm:w-44"
                />
              </div>
            )}

            {/* Filter status buttons */}
            <div className="flex p-1 bg-slate-200/70 rounded-xl text-xs font-semibold gap-1">
              {[
                { id: "all", label: "Tous" },
                { id: "paye", label: "Soldés" },
                { id: "partiel", label: "Partiels" },
                { id: "impaye", label: "Impayés" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilterStatus(id)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterStatus === id
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Table with Fixed Header */}
        <div className="max-h-[380px] overflow-y-auto">
          {filteredConsultations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Aucune consultation trouvée pour ce filtre.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/80 sticky top-0 z-10 text-slate-600 font-semibold uppercase tracking-wider text-2xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">N° / Date</th>
                  <th className="py-3 px-4">Motif / Acte</th>
                  <th className="py-3 px-4 text-right">Prix</th>
                  <th className="py-3 px-4 text-right">Déjà Payé</th>
                  <th className="py-3 px-4 text-right">Reste</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredConsultations.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Number and Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        Consultation #{c.id}
                      </div>
                      <div className="text-2xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>

                    {/* Motif */}
                    <td className="py-3 px-4 max-w-[200px] truncate text-slate-700">
                      {c.motifDeConsultation || c.note || "Consultation générale"}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      {c.calculatedPrix.toLocaleString()} DZD
                    </td>

                    {/* Paid */}
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      {c.totalPaye.toLocaleString()} DZD
                    </td>

                    {/* Remaining */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          c.reste > 0 ? "text-rose-600" : "text-slate-400"
                        }`}
                      >
                        {c.reste.toLocaleString()} DZD
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {c.statut === "paye" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3" />
                          Payé
                        </span>
                      ) : c.statut === "partiel" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          Partiel
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800">
                          <AlertCircle className="w-3 h-3" />
                          Impayé
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Versement Button */}
                        <button
                          type="button"
                          disabled={c.reste <= 0}
                          onClick={() => handleOpenPaymentModal(c)}
                          className="px-2.5 py-1 text-2xs font-bold rounded-lg bg-[var(--color-600)] text-white hover:bg-[var(--color-700)] disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs inline-flex items-center gap-1 transition-all"
                          title={c.reste <= 0 ? "Consultation déjà soldée" : "Ajouter un versement"}
                        >
                          <Plus className="w-3 h-3" />
                          Versement
                        </button>

                        {/* History Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenHistoryModal(c)}
                          className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                          title="Historique des versements de cette consultation"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* ======================================================== */}
      {/* SHADCN DIALOG: AJOUTER UN VERSEMENT                      */}
      {/* ======================================================== */}
     <Dialog
  open={paymentModalOpen}
  onOpenChange={(open) => {
    setPaymentModalOpen(open);
    if (!open) setShowDateEdit(false);
  }}
>
  <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white border border-[var(--color-100)] shadow-xl">
    <DialogHeader>
      <DialogTitle className="text-xl font-bold text-[var(--color-700)] flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-[var(--color-600)]" />
        Nouveau versement
      </DialogTitle>
    </DialogHeader>

    {paymentError && (
      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{paymentError}</span>
      </div>
    )}

    {consultationsWithCredit.length === 0 ? (
      <div className="py-6 text-center space-y-3">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-800">Aucun solde débiteur</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPaymentModalOpen(false)}
          className="rounded-xl text-xs"
        >
          Fermer
        </Button>
      </div>
    ) : (
      <form onSubmit={handleSavePayment} className="space-y-4">
        {/* Patient (fixe) */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-700)] uppercase tracking-wider mb-1.5">
            Patient
          </label>
          <div className="w-full h-11 px-3 rounded-xl border border-[var(--color-200)] bg-slate-50 flex items-center text-sm font-semibold text-slate-800">
            {patient?.nom} — {summary.totalReste.toLocaleString("fr-FR")} DZD
          </div>
        </div>

        {/* Consultation */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-700)] uppercase tracking-wider mb-1.5">
            Consultation
          </label>
          <select
            required
            value={selectedConsultation?.id || ""}
            onChange={(e) => handleConsultationChange(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-[var(--color-200)] bg-white text-sm outline-none focus:ring-2 focus:ring-[var(--color-400)]"
          >
            {consultationsWithCredit.map((c) => (
              <option key={c.id} value={c.id}>
                {new Date(c.createdAt).toLocaleDateString("fr-FR")} — {c.motifDeConsultation || c.note || "Consultation"} (reste {(Number(c.reste) || 0).toLocaleString("fr-FR")} DZD)
              </option>
            ))}
          </select>
        </div>

        {/* Montant */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[var(--color-700)] uppercase tracking-wider">
              Montant (DZD)
            </label>
            {selectedConsultation && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPayAmount(String(selectedConsultation.reste))}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Tout
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setPayAmount(
                      String(Math.round((Number(selectedConsultation.reste) || 0) / 2))
                    )
                  }
                  className="font-bold text-blue-600 hover:underline"
                >
                  50%
                </button>
              </div>
            )}
          </div>
          <Input
            type="number"
            min="1"
            max={selectedConsultation?.reste}
            step="any"
            required
            autoFocus
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            className={`h-11 rounded-xl text-base font-semibold border-[var(--color-200)] bg-white ${
              selectedConsultation && parseFloat(payAmount) > selectedConsultation.reste
                ? "border-red-400 text-red-600"
                : ""
            }`}
          />
        </div>

        {/* Reste après (rouge = aucun versement, vert = soldé, jaune = partiel) */}
        {selectedConsultation && (() => {
          const amount = parseFloat(payAmount) || 0;
          const resteApres = Math.max(0, (Number(selectedConsultation.reste) || 0) - amount);
          const color =
            amount <= 0
              ? "bg-red-50 border-red-200 text-red-700"
              : resteApres === 0
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-yellow-50 border-yellow-300 text-yellow-700";
          return (
            <div
              className={`flex justify-between items-center text-xs px-3 py-2 rounded-xl border font-medium ${color}`}
            >
              <span>Reste après</span>
              <b className="text-sm">{resteApres.toLocaleString("fr-FR")} DZD</b>
            </div>
          );
        })()}

        {/* Date (masquée au départ) */}
        {!showDateEdit ? (
          <button
            type="button"
            onClick={() => setShowDateEdit(true)}
            className="text-xs font-bold text-[var(--color-600)] hover:underline"
          >
            Modifier la date
          </button>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-[var(--color-700)] uppercase tracking-wider mb-1.5">
              Date *
            </label>
            <Input
              type="date"
              required
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="h-11 rounded-xl border-[var(--color-200)] focus:ring-2 focus:ring-[var(--color-400)] focus:border-[var(--color-500)] bg-white text-sm"
            />
          </div>
        )}

        <DialogFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={savingPayment}
            onClick={() => setPaymentModalOpen(false)}
            className="rounded-xl"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={
              savingPayment ||
              !selectedConsultation ||
              !payAmount ||
              parseFloat(payAmount) <= 0 ||
              parseFloat(payAmount) > selectedConsultation.reste
            }
            className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white rounded-xl flex items-center gap-2"
          >
            {savingPayment ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Valider"
            )}
          </Button>
        </DialogFooter>
      </form>
    )}
  </DialogContent>
</Dialog>

      {/* ======================================================== */}
      {/* MODAL 2: HISTORIQUE DES VERSEMENTS D'UNE CONSULTATION    */}
      {/* ======================================================== */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white rounded-2xl shadow-xl p-6">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Historique des règlements - Consultation #{historyConsultation?.id}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Liste de tous les versements reçus pour cet acte médical
            </DialogDescription>
          </DialogHeader>

          {historyConsultation && (
            <div className="space-y-4 pt-2">
              {/* Summary line */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs">
                <div>
                  <div className="text-slate-400 text-2xs uppercase">Prix</div>
                  <div className="font-bold text-slate-800">
                    {historyConsultation.calculatedPrix.toLocaleString()} DZD
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-2xs uppercase">Encaissé</div>
                  <div className="font-bold text-emerald-600">
                    {historyConsultation.totalPaye.toLocaleString()} DZD
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-2xs uppercase">Reste</div>
                  <div className="font-bold text-rose-600">
                    {historyConsultation.reste.toLocaleString()} DZD
                  </div>
                </div>
              </div>

              {/* Payments List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200">
                {!historyConsultation.versementsList ||
                historyConsultation.versementsList.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Aucun versement enregistré pour cette consultation.
                  </div>
                ) : (
                  historyConsultation.versementsList.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs transition-colors"
                    >
                      <div>
                        <div className="font-bold text-emerald-700">
                          {Number(v.montant).toLocaleString()} DZD
                        </div>
                        <div className="text-2xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>
                            {new Date(v.date).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                          {v.note && (
                            <>
                              <span>•</span>
                              <span className="italic">{v.note}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Delete action */}
                      <button
                        type="button"
                        onClick={() => {
                          setVersementToDelete(v);
                          setDeleteDialogOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Supprimer ce versement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHistoryModalOpen(false)}
                  className="rounded-xl text-xs w-full"
                >
                  Fermer
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* SHADCN ALERT DIALOG: CONFIRMATION SUPPRESSION VERSEMENT  */}
      {/* ======================================================== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white rounded-2xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              Confirmer la suppression du versement ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600">
              Êtes-vous sûr de vouloir supprimer ce versement de{" "}
              <strong className="text-slate-900">
                {versementToDelete ? Number(versementToDelete.montant).toLocaleString() : 0} DZD
              </strong>{" "}
              ? Le reste à payer de la consultation sera automatiquement recalculé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={deletingVersement}
              className="rounded-xl text-xs"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteVersement}
              disabled={deletingVersement}
              className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {deletingVersement ? "Suppression..." : "Confirmer la suppression"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
