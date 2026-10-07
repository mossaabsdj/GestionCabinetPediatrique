"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Trash2, FileText, Clock, Loader2 } from "lucide-react";
import { printOrdonnance, printBilan, printJustification } from "@/lib/printer";
import AlertModal from "@/app/component/success/page";
// ✅ Pediatric Age Calculation
function calculateAge(dateString) {
  if (!dateString) return "";

  const birthDate = new Date(dateString);
  const today = new Date();

  const diffMs = today - birthDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30.44);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffDays < 30) return `${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  if (diffMonths < 24) return `${diffMonths} mois`;

  const remainingMonths = diffMonths % 12;
  if (remainingMonths === 0)
    return `${diffYears} an${diffYears > 1 ? "s" : ""}`;
  return `${diffYears} an${
    diffYears > 1 ? "s" : ""
  } et ${remainingMonths} mois`;
}

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

export default function OrdBilanPage({
  patientId,
  query,
  dateFilter,
  selectedPatient,
}) {
  const [tab, setTab] = useState("ord");
  const [ordonnances, setOrdonnances] = useState([]);
  const [bilans, setBilans] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [selectedOrdonnance, setSelectedOrdonnance] = useState(null);
  const [selectedBilan, setSelectedBilan] = useState(null);
  const [selectedJustification, setSelectedJustification] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isSavingBilan, setIsSavingBilan] = useState(false);
  const [isSavingJustif, setIsSavingJustif] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const showAlert = (type, title, message) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };
  const [filtredOrd, setFiltredOrd] = useState([]);
  const [filtredBilan, setFiltredBilan] = useState([]);
  const [filtredJustif, setFiltredJustif] = useState([]);

  // 🧾 Fetch ordonnances
  const fetchOrdonnances = async () => {
    if (!patientId) return;
    try {
      const res = await fetch(`/api/Ordonnance?patientId=${patientId}`);
      const data = await res.json();
      setOrdonnances(Array.isArray(data) ? data : []);
      setFiltredOrd(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching ordonnances:", err);
    }
  };

  // 🧪 Fetch bilans reçus
  const fetchBilans = async () => {
    if (!patientId) return;
    try {
      const res = await fetch(`/api/BilanRecip?patientId=${patientId}`);
      const data = await res.json();
      setBilans(Array.isArray(data) ? data : []);
      setFiltredBilan(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching bilans:", err);
    }
  };

  // 📄 Fetch justifications
  const fetchJustifications = async () => {
    if (!patientId) return;
    try {
      const res = await fetch(`/api/Justifications?patientId=${patientId}`);
      const data = await res.json();
      setJustifications(Array.isArray(data) ? data : []);
      setFiltredJustif(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching justifications:", err);
    }
  };

  useEffect(() => {
    fetchOrdonnances();
    fetchBilans();
    fetchJustifications();
  }, [patientId, selectedPatient]);

  useEffect(() => {
    const q = query ? query.trim().toLowerCase() : "";

    const filtredO =
      ordonnances?.filter((v) => {
        const matchesQuery = !q || v.id.toString().includes(q);
        const matchesDate = isSameDate(v.createdAt, dateFilter);
        return matchesQuery && matchesDate;
      }) || [];
    setFiltredOrd(filtredO);

    const filtredB =
      bilans?.filter((v) => {
        const matchesQuery = !q || v.id.toString().includes(q);
        const matchesDate = isSameDate(v.createdAt, dateFilter);
        return matchesQuery && matchesDate;
      }) || [];
    setFiltredBilan(filtredB);

    const filtredJ =
      justifications?.filter((v) => {
        const matchesQuery =
          !q ||
          v.id.toString().includes(q) ||
          (v.titre && v.titre.toLowerCase().includes(q)) ||
          (v.texte && v.texte.toLowerCase().includes(q));
        const matchesDate = isSameDate(v.createdAt, dateFilter);
        return matchesQuery && matchesDate;
      }) || [];
    setFiltredJustif(filtredJ);
  }, [query, dateFilter, tab, ordonnances, bilans, justifications]);

  // 🗑 Delete Handling
  const confirmDelete = (type, item) => {
    setDeleteType(type);
    setItemToDelete(item);
    setDeleteError("");
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete || !deleteType) return;
    setLoading(true);
    setDeleteError("");
    try {
      const endpoint =
        deleteType === "ord"
          ? `/api/Ordonnance?id=${itemToDelete.id}`
          : deleteType === "bilan"
          ? `/api/BilanRecip?id=${itemToDelete.id}`
          : `/api/Justifications?id=${itemToDelete.id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression.");

      setDeleteDialogOpen(false);
      setItemToDelete(null);
      if (deleteType === "ord") fetchOrdonnances();
      else if (deleteType === "bilan") fetchBilans();
      else fetchJustifications();
    } catch (err) {
      console.error("❌ Error deleting:", err);
      setDeleteError(err?.message || "Erreur lors de la suppression.");
    } finally {
      setLoading(false);
    }
  };

  // 🖨️ Print Ordonnance
  const handlePrintOrdonnanceElectron = async (ord) => {
    try {
      if (!ord.items || ord.items.length === 0) {
        showAlert("warning", "Attention", "Aucune donnée à imprimer.");
        return;
      }
      // console.log(JSON.stringify(ord));
      const fullname = selectedPatient?.nom || "";
      let prenom = "";
      let nom = "";

      if (fullname.trim()) {
        const parts = fullname.trim().split(" ");
        if (parts.length === 1) nom = parts[0];
        else {
          prenom = parts.slice(0, -1).join(" ");
          nom = parts[parts.length - 1];
        }
      }

      const datenaissance = selectedPatient?.dateDeNaissance;
      const age = calculateAge(datenaissance);

      // const res = await fetch("/api/last-records");
      // const data = await res.json();

      const nextConsultationId = ord.consultationId;
      const nextOrdonnanceId = ord.id;
      console.log(
        "nextConsultationId" +
          nextConsultationId +
          "/nextOrdonnanceId" +
          nextOrdonnanceId,
      );
      printOrdonnance({
        consultationId: nextConsultationId,
        ordonnanceId: nextOrdonnanceId,
        nom,
        prenom,
        age,
        items: ord.items.map((it) => ({
          name: it.medicament?.nom,
          dosage: it.dosage,
          duration: it.duree,
          frequency: it.frequence,
          quantity: it.quantite,
        })),
      });
    } catch (err) {
      console.error("Erreur lors de l'impression de l'ordonnance:", err);
      showAlert("error", "Erreur d'impression", "Erreur lors de l'impression de l'ordonnance.");
    }
  };

  // 🖨️ Print Bilan
  const handlePrintBilanElectron = async (bilan) => {
    try {
      if (!bilan.items || bilan.items.length === 0) {
        showAlert("warning", "Attention", "Aucun examen à imprimer.");
        return;
      }
      // console.log(JSON.stringify(bilan));
      const fullname = selectedPatient?.nom || "";
      let prenom = "";
      let nom = "";

      if (fullname.trim()) {
        const parts = fullname.trim().split(" ");
        if (parts.length === 1) nom = parts[0];
        else {
          prenom = parts.slice(0, -1).join(" ");
          nom = parts[parts.length - 1];
        }
      }

      const datenaissance = selectedPatient?.dateDeNaissance;
      const age = calculateAge(datenaissance);

      // const res = await fetch("/api/last-records");
      // const data = await res.json();

      const nextBilanId = bilan.id || 0;
      const nextConsultationId = bilan.consultationId || 0;

      printBilan({
        bilanId: nextBilanId,
        consultationId: nextConsultationId,
        nom,
        prenom,
        age,
        items: bilan.items.map((exam) => ({
          id: exam.id,
          nom: exam.bilan?.nom,
        })),
      });
    } catch (err) {
      console.error("Erreur lors de l'impression du bilan:", err);
      showAlert("error", "Erreur d'impression", "Erreur lors de l'impression du bilan.");
    }
  };

  // 💾 Save updated bilan items (each has resultat & remarque)
  const handleSaveBilan = async (bilan) => {
    setIsSavingBilan(true);
    try {
      const res = await fetch(`/api/BilanRecip`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bilan.id, // ✅ now included in body, as your API expects
          items: bilan?.items?.map((it) => ({
            bilanId: it.bilanId, // ✅ backend expects this to recreate items
            resultat: it.resultat || null,
            remarque: it.remarque || null,
          })),
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde du bilan");
      const updated = await res.json();

      //   setBilans((prev) => prev.map((b) => (b.id === bilan.id ? updated : b)));
      fetchBilans();
      showAlert("success", "Succès", "Bilan mis à jour avec succès !");
    } catch (err) {
      console.error("❌ Erreur lors de la sauvegarde du bilan:", err);
      showAlert("error", "Erreur", err?.message || "Erreur lors de la sauvegarde du bilan.");
    } finally {
      setIsSavingBilan(false);
    }
  };
  // 🧠 Handle input change for Bilan item (résultat / remarque)
  const handleChangeBilanItem = (bilanId, itemIndex, field, value) => {
    // نصنع نسخة جديدة من قائمة bilans
    const updatedBilans = bilans.map((b) => {
      if (b.id !== bilanId) return b;

      // نصنع نسخة جديدة من items
      const updatedItems = b.items.map((item, index) =>
        index === itemIndex ? { ...item, [field]: value } : item,
      );

      return { ...b, items: updatedItems };
    });

    setBilans(updatedBilans);

    // تحديث bilan المفتوح في الحوار (Dialog)
    setSelectedBilan((prev) =>
      prev?.id === bilanId
        ? {
            ...prev,
            items: prev.items.map((item, index) =>
              index === itemIndex ? { ...item, [field]: value } : item,
            ),
          }
        : prev,
    );
  };

  // 📄 Print Justification
  const handlePrintJustificationElectron = async (justif) => {
    try {
      if (!justif.texte || !justif.texte.trim()) {
        showAlert("warning", "Attention", "Aucun texte de justification à imprimer.");
        return;
      }
      const fullname = selectedPatient?.nom || "";
      let prenom = "";
      let nom = "";

      if (fullname.trim()) {
        const parts = fullname.trim().split(" ");
        if (parts.length === 1) nom = parts[0];
        else {
          prenom = parts.slice(0, -1).join(" ");
          nom = parts[parts.length - 1];
        }
      }

      const datenaissance = selectedPatient?.dateDeNaissance;
      const age = calculateAge(datenaissance);

      printJustification({
        justificationId: justif.id,
        consultationId: justif.consultationId,
        nom,
        prenom,
        age,
        titre: justif.titre || "JUSTIFICATION MÉDICALE",
        texte: justif.texte,
        duree: justif.duree,
        dateDebut: justif.dateDebut,
        dateFin: justif.dateFin,
      });
    } catch (err) {
      console.error("Erreur lors de l'impression de la justification:", err);
      showAlert("error", "Erreur d'impression", "Erreur lors de l'impression de la justification.");
    }
  };

  // 💾 Save updated justification
  const handleSaveJustification = async (justif) => {
    setIsSavingJustif(true);
    try {
      const res = await fetch(`/api/Justifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: justif.id,
          titre: justif.titre,
          texte: justif.texte,
          duree: justif.duree,
          dateDebut: justif.dateDebut,
          dateFin: justif.dateFin,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde de la justification");
      fetchJustifications();
      showAlert("success", "Succès", "Justification mise à jour avec succès !");
    } catch (err) {
      console.error("❌ Erreur lors de la sauvegarde de la justification:", err);
      showAlert("error", "Erreur", err?.message || "Erreur lors de la sauvegarde de la justification.");
    } finally {
      setIsSavingJustif(false);
    }
  };

  // 🧠 Handle input change for Justification
  const handleChangeJustification = (id, field, value) => {
    const updated = justifications.map((j) =>
      j.id === id ? { ...j, [field]: value } : j,
    );
    setJustifications(updated);

    setSelectedJustification((prev) =>
      prev?.id === id ? { ...prev, [field]: value } : prev,
    );
  };

  if (!patientId)
    return <p className="text-gray-500 text-center mt-10">Aucun patient.</p>;
  return (
    <div className="p-0 max-w-6xl mx-auto">
      <Tabs
        defaultValue="ord"
        value={tab}
        onValueChange={setTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 bg-[var(--color-100)] p-1 rounded-lg">
          <TabsTrigger
            value="ord"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[var(--color-700)]"
          >
            Ordonnances ({ordonnances.length})
          </TabsTrigger>
          <TabsTrigger
            value="bilan"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[var(--color-700)]"
          >
            Bilans reçus ({bilans.length})
          </TabsTrigger>
          <TabsTrigger
            value="justif"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[var(--color-700)]"
          >
            Justifications ({justifications.length})
          </TabsTrigger>
        </TabsList>

        {/* 🧾 Ordonnances */}
        <TabsContent value="ord" className="mt-6">
          {filtredOrd?.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
              Aucune ordonnance trouvée.
            </p>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[var(--color-100)]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r bg-[var(--color-400)] text-white">
                      <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                        #
                      </th>
                      <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtredOrd.map((ord, index) => (
                      <Dialog
                        key={ord.id}
                        open={selectedOrdonnance?.id === ord.id}
                        onOpenChange={(open) =>
                          !open && setSelectedOrdonnance(null)
                        }
                      >
                        <tr
                          className={`cursor-pointer transition-colors hover:bg-[var(--color-50)] ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                          onClick={() => setSelectedOrdonnance(ord)}
                        >
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-[var(--color-100)] text-[var(--color-800)]">
                              Ordonnance #{ord.id}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                              <Calendar
                                size={16}
                                className="text-[var(--color-500)]"
                              />
                              {new Date(ord.createdAt).toLocaleDateString(
                                "fr-FR",
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete("ord", ord);
                              }}
                            >
                              <Trash2 size={18} className="text-red-500" />
                            </Button>
                          </td>
                        </tr>

                        <DialogContent className="sm:min-w-4xl w-full bg-white rounded-xl p-6 shadow-lg">
                          <DialogHeader>
                            <DialogTitle className="text-[var(--color-700)] text-lg font-semibold">
                              Détails de l'Ordonnance #{ord.id}
                            </DialogTitle>
                          </DialogHeader>

                          {ord.items?.length > 0 ? (
                            <>
                              <div className="mt-4 border border-[var(--color-100)] rounded-xl overflow-hidden">
                                <table className="w-full border-collapse text-sm">
                                  <thead className="bg-[var(--color-100)] text-[var(--color-700)]">
                                    <tr>
                                      <th className="text-left py-3 px-4 font-semibold">
                                        Médicament
                                      </th>
                                      <th className="text-left py-3 px-4 font-semibold">
                                        Dosage
                                      </th>
                                      <th className="text-left py-3 px-4 font-semibold">
                                        Fréquence
                                      </th>
                                      <th className="text-left py-3 px-4 font-semibold">
                                        Durée
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ord.items.map((item, i) => (
                                      <tr
                                        key={i}
                                        className="border-b border-[var(--color-100)] hover:bg-[var(--color-50)] transition-colors"
                                      >
                                        <td className="py-3 px-4 font-medium text-gray-800">
                                          {item.medicament?.nom || "—"}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                          {item.dosage || "—"}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                          {item.frequence || "—"}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                          {item.duree || "—"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <div className="flex justify-end mt-4">
                                <Button
                                  onClick={() =>
                                    handlePrintOrdonnanceElectron(ord)
                                  }
                                  className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white"
                                >
                                  🖨️ Imprimer l'Ordonnance
                                </Button>
                              </div>
                            </>
                          ) : (
                            <p className="text-gray-500 text-center py-4">
                              Aucun médicament dans cette ordonnance.
                            </p>
                          )}
                        </DialogContent>
                      </Dialog>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 🧪 Bilans reçus */}
        <TabsContent value="bilan" className="mt-6">
          {filtredBilan?.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
              Aucun bilan reçu trouvé.
            </p>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[var(--color-400)] text-white">
                      <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                        #
                      </th>
                      <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtredBilan.map((bilan, index) => (
                      <Dialog
                        key={bilan.id}
                        open={selectedBilan?.id === bilan.id}
                        onOpenChange={(open) => !open && setSelectedBilan(null)}
                      >
                        <tr
                          className={`cursor-pointer transition-colors hover:bg-blue-50 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                          onClick={() => setSelectedBilan(bilan)}
                        >
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-[var(--color-100)] text-[var(--color-800)]">
                              Bilan reçu #{bilan.id}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                              <Calendar
                                size={16}
                                className="text-[var(--color-500)]"
                              />
                              {new Date(bilan.createdAt).toLocaleDateString(
                                "fr-FR",
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete("bilan", bilan);
                              }}
                            >
                              <Trash2 size={18} className="text-red-500" />
                            </Button>
                          </td>
                        </tr>

                        {selectedBilan?.id === bilan.id && (
                          <DialogContent className="sm:min-w-4xl w-full bg-white rounded-xl p-6 shadow-lg">
                            <DialogHeader>
                              <DialogTitle className="text-green-700 text-lg font-semibold">
                                Détails du Bilan #{selectedBilan.id}
                              </DialogTitle>
                            </DialogHeader>

                            {selectedBilan.items?.length > 0 ? (
                              <>
                                <div className="mt-4 border border-green-100 rounded-xl overflow-hidden">
                                  <table className="w-full border-collapse text-sm">
                                    <thead className="bg-green-100 text-green-700">
                                      <tr>
                                        <th className="text-left py-3 px-4 font-semibold">
                                          Nom du Bilan
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold">
                                          Résultat
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold">
                                          Remarque
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedBilan.items.map((item, i) => (
                                        <tr
                                          key={i}
                                          className="border-b border-green-100 hover:bg-green-50 transition-colors"
                                        >
                                          <td className="py-3 px-4 font-medium text-gray-800">
                                            {item.bilan?.nom || "—"}
                                          </td>
                                          <td className="py-3 px-4">
                                            <input
                                              type="text"
                                              placeholder="Résultat..."
                                              value={item.resultat || ""}
                                              onChange={(e) =>
                                                handleChangeBilanItem(
                                                  selectedBilan.id,
                                                  i,
                                                  "resultat",
                                                  e.target.value,
                                                )
                                              }
                                              className="w-full border rounded-lg px-3 py-1 focus:ring-2 focus:ring-green-500"
                                            />
                                          </td>
                                          <td className="py-3 px-4">
                                            <textarea
                                              placeholder="Remarques..."
                                              value={item.remarque || ""}
                                              onChange={(e) =>
                                                handleChangeBilanItem(
                                                  selectedBilan.id,
                                                  i,
                                                  "remarque",
                                                  e.target.value,
                                                )
                                              }
                                              className="w-full border rounded-lg px-3 py-1 focus:ring-2 focus:ring-green-500"
                                              rows={1}
                                            />
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                  <Button
                                    onClick={() =>
                                      handlePrintBilanElectron(selectedBilan)
                                    }
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    🖨️ Imprimer le Bilan
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={() =>
                                      handleSaveBilan(selectedBilan)
                                    }
                                    disabled={isSavingBilan}
                                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                                  >
                                    {isSavingBilan && (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    )}
                                    💾 Enregistrer
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <p className="text-gray-500 text-center py-4">
                                Aucun élément dans ce bilan.
                              </p>
                            )}
                          </DialogContent>
                        )}
                      </Dialog>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 📄 Justifications Médicales */}
        <TabsContent value="justif" className="mt-6">
          {filtredJustif?.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
              Aucune justification médicale trouvée.
            </p>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-purple-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                      <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                        #
                      </th>
                      <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                        Objet / Titre
                      </th>
                      <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-6 py-4 font-semibold text-sm uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtredJustif.map((justif, index) => (
                      <Dialog
                        key={justif.id}
                        open={selectedJustification?.id === justif.id}
                        onOpenChange={(open) =>
                          !open && setSelectedJustification(null)
                        }
                      >
                        <tr
                          className={`cursor-pointer transition-colors hover:bg-purple-50/50 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                          onClick={() => setSelectedJustification({ ...justif })}
                        >
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                              Justification #{justif.id}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">
                                {justif.titre || "Justification médicale"}
                              </span>
                              {justif.duree && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                  <Clock size={12} /> {justif.duree}
                                </span>
                              )}
                            </div>
                            {justif.texte && (
                              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                {justif.texte}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                              <Calendar
                                size={16}
                                className="text-purple-600"
                              />
                              {new Date(justif.createdAt).toLocaleDateString(
                                "fr-FR",
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete("justif", justif);
                              }}
                            >
                              <Trash2 size={18} className="text-red-500" />
                            </Button>
                          </td>
                        </tr>

                        {selectedJustification?.id === justif.id && (
                          <DialogContent className="sm:max-w-2xl w-full bg-white rounded-xl p-6 shadow-xl">
                            <DialogHeader>
                              <DialogTitle className="text-purple-700 text-lg font-semibold flex items-center gap-2">
                                <FileText size={20} />
                                Détails de la Justification Médicale #{selectedJustification.id}
                              </DialogTitle>
                            </DialogHeader>

                            <div className="mt-4 space-y-4">
                              {/* Titre & Durée */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Objet / Titre
                                  </label>
                                  <input
                                    type="text"
                                    value={selectedJustification.titre || ""}
                                    onChange={(e) =>
                                      handleChangeJustification(
                                        selectedJustification.id,
                                        "titre",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Ex: Arrêt de travail / Dispense de sport"
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Durée
                                  </label>
                                  <input
                                    type="text"
                                    value={selectedJustification.duree || ""}
                                    onChange={(e) =>
                                      handleChangeJustification(
                                        selectedJustification.id,
                                        "duree",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Ex: 7 jours"
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                  />
                                </div>
                              </div>

                              {/* Dates */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Date de début (optionnel)
                                  </label>
                                  <input
                                    type="date"
                                    value={
                                      selectedJustification.dateDebut
                                        ? new Date(selectedJustification.dateDebut)
                                            .toISOString()
                                            .slice(0, 10)
                                        : ""
                                    }
                                    onChange={(e) =>
                                      handleChangeJustification(
                                        selectedJustification.id,
                                        "dateDebut",
                                        e.target.value || null,
                                      )
                                    }
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Date de fin (optionnel)
                                  </label>
                                  <input
                                    type="date"
                                    value={
                                      selectedJustification.dateFin
                                        ? new Date(selectedJustification.dateFin)
                                            .toISOString()
                                            .slice(0, 10)
                                        : ""
                                    }
                                    onChange={(e) =>
                                      handleChangeJustification(
                                        selectedJustification.id,
                                        "dateFin",
                                        e.target.value || null,
                                      )
                                    }
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                  />
                                </div>
                              </div>

                              {/* Texte médical */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Description / Texte de la justification
                                </label>
                                <textarea
                                  rows={6}
                                  value={selectedJustification.texte || ""}
                                  onChange={(e) =>
                                    handleChangeJustification(
                                      selectedJustification.id,
                                      "texte",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Saisissez la justification médicale..."
                                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                              <Button
                                onClick={() =>
                                  handlePrintJustificationElectron(
                                    selectedJustification,
                                  )
                                }
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                🖨️ Imprimer la Justification
                              </Button>
                              <Button
                                type="button"
                                onClick={() =>
                                  handleSaveJustification(selectedJustification)
                                }
                                disabled={isSavingJustif}
                                className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white flex items-center gap-2"
                              >
                                {isSavingJustif && (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                                💾 Enregistrer
                              </Button>
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 🗑 Delete Confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!loading) {
            setDeleteDialogOpen(open);
            if (!open) {
              setDeleteError("");
              setItemToDelete(null);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Confirmation de suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {deleteError}
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteError("");
                setItemToDelete(null);
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
}
