"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import LoadingScreen from "../component/LoadingScreen/page";

import { Trash2, Plus, Search, Pill, TestTube, Loader2 } from "lucide-react";
import DialogPage from "@/app/component/DialogPage/page";
import SearchBarPage from "@/app/component/SearchBar/SearchBar";
// Mock data

const MEDICAMENTS = [
  "Metformine",
  "Glibenclamide",
  "Paracétamol",
  "Ibuprofen",
  "Metformine9",
  "Glibenclamid2e",
  "Paracétamol3",
  "Ibuprofen4",
  "Metformine4",
  "Glibenclamide",
  "Paracétamol",
  "Ibuprofen",
  "Metformine",
  "Glibenclamide",
  "Paracétamol",
  "Ibuprofen",
];
const BILANS = [
  "Glycémie à jeun",
  "Créatinine",
  "NFS",
  "CRP",
  "Glycémie à jeun2",
  "Cré2atinine",
  "NF2S",
  "C2RP",

  "Glycémie à jeun",
  "Créatinine",
  "NFS",
  "CRP",
  "Glycémie à jeun",
  "Créatinine",
  "NFS",
  "CRP",
  "Glycémie à jeun",
  "Créatinine",
  "NFS",
  "CRP",
  "Glycémie à jeun",
  "Créatinine",
  "NFS",
  "CRP",
];

export default function TypesPage() {
  const [ordTypes, setOrdTypes] = useState([]);
  const [bilanTypes, setBilanTypes] = useState([]);
  const [justifTypes, setJustifTypes] = useState([]);
  const [ordSearch, setOrdSearch] = useState("");
  const [bilanSearch, setBilanSearch] = useState("");
  const [justifSearch, setJustifSearch] = useState("");

  // modal
  const [modal, setModal] = useState({
    open: false,
    section: "",
    mode: "add",
    type: null,
  });

  const [typeLabel, setTypeLabel] = useState("");
  const [medQuery, setMedQuery] = useState("");
  const [selectedMeds, setSelectedMeds] = useState([]);
  const [bilanQuery, setBilanQuery] = useState("");
  const [selectedBilans, setSelectedBilans] = useState([]);
  const [MEDICAMENTS, setMedicaments] = useState([]);
  const [BILANS, setBilans] = useState([]);
  const [tmpStrength, setTmpStrength] = useState("");
  const [tmpDose, setTmpDose] = useState("1 fois/jour");
  const [tmpDuration, setTmpDuration] = useState("5 jours");
  const [tmpQuantite, setTmpQuantite] = useState(1);
  const [openMedDialog, setOpenMedDialog] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // justifs
  const [newJustif, setNewJustif] = useState({ nom: "", texte: "" });
  const [justifList, setJustifList] = useState([]);
  const [Dejaexist, setDejaExistDialog] = useState(false);
  const [DejaexistB, setDejaExistDialogB] = useState(false);
  const openAdd = (section) => {
    setSaveError("");
    setModal({ open: true, section, mode: "add", type: null });
    setTypeLabel("");
    setSelectedMeds([]);
    setSelectedBilans([]);
    setJustifList([]);
  };
  async function fetchJustifTypes() {
    try {
      const response = await fetch("/api/JustificationsType", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(
          err.error || "Erreur lors du chargement des justifications types"
        );
      }

      const data = await response.json();
      setJustifTypes(data);
    } catch (err) {
      console.error("❌ fetchJustifTypes error:", err);
    }
  }

  async function fetchBilanTypes() {
    try {
      const response = await fetch("/api/BilansType", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store", // ensures fresh data
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(
          err.error || "Erreur lors du chargement des bilans types"
        );
      }

      const data = await response.json();
      setBilanTypes(data);
    } catch (err) {
      console.error("❌ fetchBilanTypes error:", err);
    } finally {
    }
  }
  async function fetchRecettes() {
    try {
      const response = await fetch("/api/OrdanaceType", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        let message = "Erreur lors du chargement des recettes types";
        try {
          const error = await response.json();
          message = error.error || message;
        } catch {
          // fallback if no JSON
        }
        throw new Error(message);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ fetchRecettes error:", err);
      throw err;
    }
  }
  const loadRecettes = async () => {
    try {
      const data = await fetchRecettes();
      console.log("ordertypes" + JSON.stringify(data));
      setOrdTypes(data);
    } catch (err) {
      console.error(err);
      // Optionally: toast.error(err.message);
    }
  };
  useEffect(() => {
    async function fetchMedicaments() {
      try {
        const res = await fetch("/api/medicaments");
        const data = await res.json();
        if (Array.isArray(data)) setMedicaments(data);
      } catch (err) {
        console.error("Erreur de chargement des médicaments", err);
      }
    }
    async function fetchBilans() {
      try {
        const res = await fetch("/api/bilans");
        const data = await res.json();
        if (Array.isArray(data)) setBilans(data);
      } catch (err) {
        console.error("Erreur de chargement des bilans", err);
      }
    }

    async function loadAllInitialData() {
      setLoading(true);
      try {
        await Promise.allSettled([
          loadRecettes(),
          fetchMedicaments(),
          fetchBilans(),
          fetchBilanTypes(),
          fetchJustifTypes(),
        ]);
      } catch (err) {
        console.error("Erreur de chargement des données prédéfinies:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAllInitialData();
  }, []);

  const openEdit = (section, type) => {
    setSaveError("");
    setModal({ open: true, section, mode: "edit", type });
    setTypeLabel(type.nom);
    console.log(section);
    if (section === "ord") {
      console.log(type.items);

      setSelectedMeds(type.items || []);
    }
    if (section === "bilan") {
      console.log(JSON.stringify(type.items));
      setSelectedBilans(type.items || []);
    }
    if (section === "justif") {
      setNewJustif({ nom: type.nom, texte: type.texte || "" });
    }
  };
  async function createRecette(data) {
    try {
      const payload = {
        nom: data.label,
        items: data.meds.map((item) => ({
          medicamentId: item.id,
          frequence:
            item.tmpDose === "custom" ? item.tmpCustomDose : item.tmpDose,
          dosage:
            item.tmpStrength === "custom"
              ? item.tmpCustomStrength
              : item.tmpStrength,
          duree:
            item.tmpDuration === "custom"
              ? item.tmpCustomDuration
              : item.tmpDuration,
          quantite: item.tmpQuantite,
        })),
      };

      const response = await fetch("/api/OrdanaceType", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la création de la recette";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {
          // fallback in case response is not JSON
        }
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ createRecette error:", err);
      throw err;
    }
  }
  async function createBilanType(data) {
    console.log(JSON.stringify(data));
    try {
      const payload = {
        nom: data.label,
        items: data.bilans.map((item) => ({
          bilanId: item.id, // assuming each selected bilan has an id
          remarque: item.remarque || null,
        })),
      };
      console.log(JSON.stringify(payload));
      const response = await fetch("/api/BilansType", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la création du type de bilan";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {
          // response not JSON
        }
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ createBilanType error:", err);
      throw err;
    }
  }
  async function updateBilanType(data) {
    console.log("📝 update payload:", JSON.stringify(data));

    try {
      const payload = {
        id: data.id,
        nom: data.label,
        items: data.bilans.map((item) => ({
          bilanId: item.id, // chaque bilan sélectionné a un id
          remarque: item.remarque || null,
        })),
      };

      console.log("📦 PUT payload:", JSON.stringify(payload));

      const response = await fetch("/api/BilansType", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la mise à jour du type de bilan";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {
          // si la réponse n’est pas du JSON
        }
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ updateBilanType error:", err);
      throw err;
    }
  }

  async function updateRecette(data) {
    try {
      const payload = {
        id: data.id,
        nom: data.label,
        items: data.meds.map((item) => ({
          medicamentId: item.id,
          dosage:
            item.tmpDose === "custom"
              ? item.tmpCustomDose
              : item.tmpDose || item.dosage || null,
          frequence:
            item.tmpStrength === "custom"
              ? item.tmpCustomStrength
              : item.tmpStrength || item.frequence || null,
          duree:
            item.tmpDuration === "custom"
              ? item.tmpCustomDuration
              : item.tmpDuration || item.duree || null,
          quantite: item.tmpQuantite || item.quantite || null,
        })),
      };

      const response = await fetch("/api/OrdanaceType", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Erreur lors de la mise à jour de la recette";
        try {
          const error = await response.json();
          message = error.error || error.message || message;
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(message);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ updateRecette error:", err);
      throw err;
    }
  }
  async function deleteBilanType(id) {
    try {
      if (!id) throw new Error("ID est requis pour la suppression");

      const response = await fetch(`/api/BilansType?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la suppression du type de bilan";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {
          // non-JSON response
        }
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ deleteBilanType error:", err);
      throw err;
    }
  }
  async function deleteRecetteType(id) {
    try {
      if (!id) throw new Error("ID de la recette requis");

      const response = await fetch(`/api/OrdanaceType?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la suppression de la recette";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {
          // not JSON
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      return result.message || "Recette supprimée avec succès";
    } catch (err) {
      console.error("❌ deleteRecetteType error:", err);
      throw err;
    }
  }

  async function createJustifType(data) {
    try {
      const payload = {
        nom: data.label,
        texte: newJustif.texte || "",
      };

      const response = await fetch("/api/JustificationsType", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la création du type de justification";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ createJustifType error:", err);
      throw err;
    }
  }

  async function updateJustifType(data) {
    try {
      const payload = {
        id: data.id,
        nom: data.label,
        texte: newJustif.texte || "",
      };

      const response = await fetch("/api/JustificationsType", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la mise à jour du type de justification";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err) {
      console.error("❌ updateJustifType error:", err);
      throw err;
    }
  }

  async function deleteJustifType(id) {
    try {
      if (!id) throw new Error("ID requis pour la suppression");

      const response = await fetch(`/api/JustificationsType?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMsg = "Erreur lors de la suppression du type de justification";
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const result = await response.json();
      return result.message || "Supprimé avec succès";
    } catch (err) {
      console.error("❌ deleteJustifType error:", err);
      throw err;
    }
  }

  const handleSave = async () => {
    if (!typeLabel.trim()) return;

    const newType = {
      id: modal.type?.id || Date.now().toString(),
      label: typeLabel.trim(),
      meds: selectedMeds,
      bilans: selectedBilans,
      justifs: justifList,
    };

    setSaving(true);
    setSaveError("");
    try {
      if (modal.section === "ord") {
        if (modal.mode === "add") {
          console.log("📦 Sending:", JSON.stringify(newType, null, 2));
          await createRecette(newType);
          await loadRecettes();
        } else {
          await updateRecette(newType);
          await loadRecettes();
        }
      }

      if (modal.section === "bilan") {
        if (modal.mode === "add") {
          await createBilanType(newType);
          await fetchBilanTypes();
        } else {
          await updateBilanType(newType);
          await fetchBilanTypes();
        }
      }

      if (modal.section === "justif") {
        if (modal.mode === "add") {
          await createJustifType(newType);
          await fetchJustifTypes();
        } else {
          await updateJustifType(newType);
          await fetchJustifTypes();
        }
      }

      // ✅ Reset modal after success
      setSaveError("");
      setModal({ open: false, section: "", mode: "add", type: null });
    } catch (err) {
      console.error("❌ handleSave error:", err);
      setSaveError(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (section, id) => {
    try {
      if (section === "ord") {
        await deleteRecetteType(id);
        await loadRecettes();
      } else if (section === "bilan") {
        await deleteBilanType(id);
        await fetchBilanTypes();
      } else if (section === "justif") {
        await deleteJustifType(id);
        await fetchJustifTypes();
      }
    } catch (err) {
      console.error("❌ handleDelete error:", err);
      throw err;
    }
  };
  const addMedication = () => {
    !selectedMeds.some((sm) => sm.id === selectedMed.id) &&
      setSelectedMeds([...selectedMeds, selectedMed]) + setOpenMedDialog(false);
  };
  // render table
  const renderTable = (section, data) => (
    <div className="overflow-x-auto ">
      <table className="w-full text-sm border border-[var(--color-200)] rounded-lg">
        <thead className="bg-[var(--color-100)] text-[var(--color-700)] font-semibold">
          <tr>
            <th className="px-4 py-2 text-left">Nom du type</th>
            <th className="px-4 py-2">Aperçu</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="border-t animate-pulse">
                <td className="px-4 py-3">
                  <div className="h-4 w-3/4 bg-[var(--color-200)]/60 rounded" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-1/3 bg-[var(--color-200)]/60 rounded" />
                </td>
                <td className="px-4 py-3 flex justify-center gap-2">
                  <div className="h-8 w-16 bg-[var(--color-200)]/60 rounded" />
                  <div className="h-8 w-20 bg-[var(--color-200)]/60 rounded" />
                </td>
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center text-gray-400 py-6 italic">
                Aucun type ajouté
              </td>
            </tr>
          ) : (
            data.map((t) => (
              <tr key={t.id} className="border-t hover:bg-[var(--color-50)]/40 transition-colors">
                <td className="px-4 py-2 font-medium">{t.nom}</td>
                <td className="px-4 py-2 text-gray-600 max-w-md truncate">
                  {section === "ord" ? `${t.items?.length || 0} médicaments` : ""}
                  {section === "bilan" ? ` ${t.items?.length || 0} bilans` : ""}
                  {section === "justif" ? `${t.texte || "Modèle de texte"}` : ""}
                </td>
                <td className="px-4 py-2 flex gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[var(--color-400)] text-[var(--color-700)]"
                    onClick={() => openEdit(section, t)}
                  >
                    Modifier
                  </Button>
                  <DialogPage
                    title="Supprimer"
                    triggerText={"Supprimer"}
                    description="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
                    onConfirm={() => handleDelete(section, t.id)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-full mx-auto py-12 px-6">
      <Tabs defaultValue="ord" className="w-full">
        <TabsList className="mb-6 grid grid-cols-3 gap-2 bg-[var(--color-100)] rounded-xl">
          <TabsTrigger value="ord" className="text-[var(--color-800)] font-semibold">
            Ordonnances
          </TabsTrigger>
          <TabsTrigger value="bilan" className="text-[var(--color-800)] font-semibold">
            Bilans
          </TabsTrigger>
          <TabsTrigger
            value="justif"
            className="text-[var(--color-800)] font-semibold"
          >
            Justifs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ord">
          <Card className="mb-8 shadow-lg border-[var(--color-200)] border">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-[var(--color-700)] font-bold">
                Types d’ordonnance
              </CardTitle>
              <SearchBarPage
                value={ordSearch}
                onChange={(e) => setOrdSearch(e.target.value)}
                placeholder="Rechercher un type d’ordonnance..."
              />

              <Button
                size="sm"
                className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white"
                onClick={() => openAdd("ord")}
              >
                Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              {" "}
              {renderTable(
                "ord",
                ordTypes.filter((t) =>
                  t.nom.toLowerCase().includes(ordSearch.toLowerCase())
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bilan">
          <Card className="mb-8 shadow-lg border-[var(--color-200)] border">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-[var(--color-700)] font-bold">
                Types de bilan
              </CardTitle>
              <SearchBarPage
                value={bilanSearch}
                onChange={(e) => setBilanSearch(e.target.value)}
                placeholder="Rechercher un type de bilan..."
              />

              <Button
                size="sm"
                className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white"
                onClick={() => openAdd("bilan")}
              >
                Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              {" "}
              {renderTable(
                "bilan",
                bilanTypes.filter((t) =>
                  t.nom.toLowerCase().includes(bilanSearch.toLowerCase())
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="justif">
          <Card className="mb-8 shadow-lg border-[var(--color-200)] border">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-[var(--color-700)] font-bold">
                Types de justifications
              </CardTitle>
              <SearchBarPage
                value={justifSearch}
                onChange={(e) => setJustifSearch(e.target.value)}
                placeholder="Rechercher un type de justification..."
              />

              <Button
                size="sm"
                className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white"
                onClick={() => openAdd("justif")}
              >
                Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              {renderTable(
                "justif",
                justifTypes.filter((t) =>
                  (t.nom || "").toLowerCase().includes(justifSearch.toLowerCase()) ||
                  (t.texte || "").toLowerCase().includes(justifSearch.toLowerCase())
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog
        open={modal.open}
        onOpenChange={(open) => {
          setModal((m) => ({ ...m, open }));
          if (!open) setSaveError("");
        }}
      >
        <DialogContent className="min-h-160 min-w-3xl overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {modal.mode === "add" ? "Ajouter un type" : "Modifier le type"}
            </DialogTitle>
          </DialogHeader>

          <Tabs
            value={modal.section}
            onValueChange={(val) => setModal((m) => ({ ...m, section: val }))}
          >
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="ord">Ordonnance</TabsTrigger>
              <TabsTrigger value="bilan">Bilans</TabsTrigger>
              <TabsTrigger value="justif">Justifs</TabsTrigger>
            </TabsList>

            {/* ORD */}
            <TabsContent value="ord">
              <Label>Nom du type d’ordonnance</Label>
              <Input
                value={typeLabel}
                onChange={(e) => setTypeLabel(e.target.value)}
                placeholder="Nom du type"
                className="my-2"
              />
              <div className="mt-4">
                <Label>Ajouter Médicament</Label>
                <Input
                  value={medQuery}
                  onChange={(e) => setMedQuery(e.target.value)}
                  placeholder="Rechercher médicament"
                  className="my-2"
                />
                <div className="flex flex-wrap gap-2 h-20 overflow-auto">
                  {MEDICAMENTS.filter((m) =>
                    m.nom.toLowerCase().includes(medQuery.toLowerCase())
                  ).map((m) => (
                    <Button
                      key={m.id}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log(
                          JSON.stringify(selectedMeds) +
                            "and" +
                            JSON.stringify(selectedMed)
                        );
                        !selectedMeds.some((sm) => sm.id === m.id)
                          ? setOpenMedDialog(true) + setSelectedMed(m)
                          : setDejaExistDialog(true);
                      }}
                    >
                      {m.nom}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 h-60 overflow-auto space-y-2 p-1 rounded-lg bg-gray-50 border border-gray-200 shadow-inner">
                  {selectedMeds.map((m) => (
                    <div
                      key={m.id}
                      className="flex justify-between items-center bg-white hover:bg-[var(--color-50)] transition-colors px-3 py-2 rounded-xl shadow-sm border border-gray-100"
                    >
                      {/* Left section: icon + med name */}
                      <div className="flex items-center gap-2">
                        <Pill className="w-5 h-5 text-[var(--color-500)]" />
                        <span className="font-medium text-gray-800">
                          {m.nom}
                        </span>
                      </div>

                      {/* Middle section: med details */}
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <p className="px-2 py-0.5 bg-[var(--color-100)] text-[var(--color-700)] rounded-md">
                          {m.tmpStrength === "custom"
                            ? m.tmpCustomStrength
                            : m.tmpStrength || m.frequence || "-"}
                        </p>

                        <p className="px-2 py-0.5 bg-[var(--color-100)] text-[var(--color-700)] rounded-md">
                          {m.tmpDose === "custom"
                            ? m.tmpCustomDose
                            : m.tmpDose || m.dosage || "-"}
                        </p>

                        <p className="px-2 py-0.5 bg-[var(--color-100)] text-[var(--color-700)] rounded-md">
                          {m.tmpDuration === "custom"
                            ? m.tmpCustomDuration
                            : m.tmpDuration || m.duree || "-"}
                        </p>

                        <p className="px-2 py-0.5 bg-[var(--color-200)] text-[var(--color-800)] font-semibold rounded-md">
                          × {m.tmpQuantite || m.quantite || 1}
                        </p>
                      </div>

                      {/* Right section: delete button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-red-100 hover:text-red-600"
                        onClick={() =>
                          setSelectedMeds(
                            selectedMeds.filter((x) => x.id !== m.id)
                          )
                        }
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* BILANS */}
            <TabsContent value="bilan">
              <Label>Nom du type de bilan</Label>
              <Input
                value={typeLabel}
                onChange={(e) => setTypeLabel(e.target.value)}
                placeholder="Nom du type de bilan"
                className="my-2"
              />
              <Label>Ajouter Bilan</Label>
              <Input
                value={bilanQuery}
                onChange={(e) => setBilanQuery(e.target.value)}
                placeholder="Rechercher bilan"
                className="my-2"
              />
              <div className="flex flex-wrap gap-2 h-20 overflow-auto">
                {BILANS.filter((b) =>
                  b.nom.toLowerCase().includes(bilanQuery.toLowerCase())
                ).map((b) => (
                  <Button
                    key={b.id}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      console.log(
                        JSON.stringify(selectedBilans) +
                          "and" +
                          console.log(JSON.stringify(b))
                      );
                      !selectedBilans.some((sm) => sm.id === b.id)
                        ? setSelectedBilans([...selectedBilans, b])
                        : setDejaExistDialogB(true);
                    }}
                  >
                    {b.nom}
                  </Button>
                ))}
              </div>
              <div className="mt-4 h-60 overflow-auto space-y-2 p-1 rounded-lg bg-gray-50 border border-gray-200 shadow-inner">
                {selectedBilans.map((b) => (
                  <div
                    key={b.id}
                    className="flex justify-between items-center bg-white hover:bg-[var(--color-50)] transition-colors px-3 py-2 rounded-xl shadow-sm border border-gray-100"
                  >
                    {/* Left section: icon + bilan name */}
                    <div className="flex items-center gap-2">
                      <TestTube className="w-5 h-5 text-[var(--color-500)]" />
                      <span className="font-medium text-gray-800">{b.nom}</span>
                    </div>

                    {/* Right section: delete button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-red-100 hover:text-red-600"
                      onClick={() =>
                        setSelectedBilans(
                          selectedBilans.filter((x) => x.id !== b.id)
                        )
                      }
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* JUSTIFS */}
            <TabsContent value="justif">
              <Label>Nom du type de justification</Label>
              <Input
                value={typeLabel}
                onChange={(e) => setTypeLabel(e.target.value)}
                placeholder="Ex: Arrêt 7 jours, Dispense EPS..."
                className="my-2"
              />

              <div className="space-y-2 mt-4">
                <Label>Texte prédéfini de la justification</Label>
                <Textarea
                  rows={6}
                  value={newJustif.texte}
                  onChange={(e) =>
                    setNewJustif((j) => ({ ...j, texte: e.target.value }))
                  }
                  placeholder="Texte de la justification..."
                  className="min-h-[140px]"
                />
              </div>
            </TabsContent>
          </Tabs>

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
              {saveError}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              disabled={saving || !typeLabel.trim()}
              className="bg-[var(--color-600)] hover:bg-[var(--color-700)] text-white inline-flex items-center gap-2"
              onClick={handleSave}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {modal.mode === "add" ? "Ajout..." : "Mise à jour..."}
                </>
              ) : (
                modal.mode === "add" ? "Ajouter" : "Mettre à jour"
              )}
            </Button>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() =>
                setModal({ open: false, section: "", mode: "add", type: null })
              }
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openMedDialog} onOpenChange={setOpenMedDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-700)]">
              {selectedMed?.nom} {selectedMed && `(${selectedMed.form})`}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Choisissez la concentration, la posologie, la durée et la
              quantité.
            </p>
          </DialogHeader>

          {selectedMed && (
            <div className="grid gap-3">
              <div>
                {/* === Dosage === */}
                <div>
                  <Label>Dosage</Label>
                  <select
                    className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedMed.tmpStrength}
                    onChange={(e) =>
                      setSelectedMed({
                        ...selectedMed,
                        tmpStrength: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Sélectionner --</option>
                    {selectedMed?.strengths?.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                    <option value="250 mg">250 mg</option>
                    <option value="500 mg">500 mg</option>
                    <option value="1 g">1 g</option>
                    <option value="custom">Autre...</option>
                  </select>

                  {selectedMed.tmpStrength === "custom" && (
                    <input
                      type="text"
                      className="mt-2 w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Entrer un dosage personnalisé..."
                      value={selectedMed.tmpCustomStrength || ""}
                      onChange={(e) =>
                        setSelectedMed({
                          ...selectedMed,
                          tmpCustomStrength: e.target.value,
                        })
                      }
                    />
                  )}
                </div>

                {/* === Posologie === */}
                <div>
                  <Label>Posologie (rythme de prise)</Label>
                  <select
                    className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedMed.tmpDose}
                    onChange={(e) =>
                      setSelectedMed({
                        ...selectedMed,
                        tmpDose: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="1 fois / jour">1 fois / jour</option>
                    <option value="2 fois / jour">2 fois / jour</option>
                    <option value="3 fois / jour">3 fois / jour</option>
                    <option value="Toutes les 8 heures">
                      Toutes les 8 heures
                    </option>
                    <option value="Toutes les 12 heures">
                      Toutes les 12 heures
                    </option>
                    <option value="Avant repas">Avant repas</option>
                    <option value="Après repas">Après repas</option>
                    <option value="Selon besoin">Selon besoin</option>
                    <option value="custom">Autre...</option>
                  </select>

                  {selectedMed.tmpDose === "custom" && (
                    <input
                      type="text"
                      className="mt-2 w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Entrer une posologie personnalisée..."
                      value={selectedMed.tmpCustomDose || ""}
                      onChange={(e) =>
                        setSelectedMed({
                          ...selectedMed,
                          tmpCustomDose: e.target.value,
                        })
                      }
                    />
                  )}
                </div>

                {/* === Durée === */}
                <div>
                  <Label>Durée</Label>
                  <select
                    className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedMed.tmpDuration}
                    onChange={(e) =>
                      setSelectedMed({
                        ...selectedMed,
                        tmpDuration: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="3 jours">3 jours</option>
                    <option value="5 jours">5 jours</option>
                    <option value="7 jours">7 jours</option>
                    <option value="10 jours">10 jours</option>
                    <option value="14 jours">14 jours</option>
                    <option value="1 mois">1 mois</option>
                    <option value="custom">Autre...</option>
                  </select>

                  {selectedMed.tmpDuration === "custom" && (
                    <input
                      type="text"
                      className="mt-2 w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Entrer une durée personnalisée..."
                      value={selectedMed.tmpCustomDuration || ""}
                      onChange={(e) =>
                        setSelectedMed({
                          ...selectedMed,
                          tmpCustomDuration: e.target.value,
                        })
                      }
                    />
                  )}
                </div>
              </div>

              <div>
                <Label>Quantité (boîtes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={selectedMed.tmpQuantite}
                  onChange={(e) =>
                    setSelectedMed({
                      ...selectedMed,
                      tmpQuantite: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setOpenMedDialog(false)}>
              Annuler
            </Button>
            <Button
              className="bg-[var(--color-600)] hover:bg-[var(--color-700)]"
              onClick={addMedication}
            >
              <Plus size={16} className="mr-2" /> Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Dejaexist} onOpenChange={setDejaExistDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Médicament déjà existant</DialogTitle>
            <DialogDescription>
              Ce médicament est déjà présent dans votre sélection. Vous ne
              pouvez pas l’ajouter deux fois.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setDejaExistDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={DejaexistB} onOpenChange={setDejaExistDialogB}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bilan déjà existant</DialogTitle>
            <DialogDescription>
              Ce Bilan est déjà présent dans votre sélection. Vous ne pouvez pas
              l’ajouter deux fois.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setDejaExistDialogB(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

