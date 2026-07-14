import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { TreePine, ArrowLeft, MoreHorizontal } from "lucide-react";
import { FamilyTreeCanvas } from "@/widgets/family-tree-canvas/components/family-tree-canvas";
import { PersonDetailsSheet } from "@/features/person-details/components/person-details-sheet";
import { EditPersonDialog } from "@/features/edit-person/components/edit-person-dialog";
import { DeletePersonDialog } from "@/features/delete-person/components/delete-person-dialog";
import { AddRelationshipDialog } from "@/features/add-relationship/components/add-relationship-dialog";
import { SearchCommand } from "@/features/search-people/components/search-command";
import { ImportExportPanel } from "@/features/import-export/components/import-export-panel";
import { IndexedDbFamilyTreeRepository } from "@/infrastructure/persistence/repositories/indexed-db-family-tree-repository";
import { useFamilyTreeStore } from "@/stores/family-tree-store";
import { useTreeUIStore } from "@/stores/tree-ui-store";
import { addParent } from "@/application/family-tree/add-parent";
import { addChild } from "@/application/family-tree/add-child";
import { addSpouse } from "@/application/family-tree/add-spouse";
import { editPerson } from "@/application/family-tree/edit-person";
import { deletePerson } from "@/application/family-tree/delete-person";
import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import type { AddRelationshipFormValues } from "@/features/add-relationship/schemas/add-relationship-schema";
import type { EditPersonFormValues } from "@/features/edit-person/schemas/edit-person-schema";
import seedData from "@/data/seed/family-tree.json";
import { cn } from "@/lib/utils";

export function TreePage() {
  const { snapshot, isLoading, error, setSnapshot, setLoading, setError } =
    useFamilyTreeStore();
  const { activePersonId, detailsOpen, fullscreen } = useTreeUIStore();

  // Dialog state
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [deletingPersonId, setDeletingPersonId] = useState<string | null>(null);
  const [addRelationshipPersonId, setAddRelationshipPersonId] = useState<
    string | null
  >(null);
  const [addRelationshipType, setAddRelationshipType] = useState<
    "parent" | "child" | "spouse" | undefined
  >(undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        let existing = await IndexedDbFamilyTreeRepository.load();
        if (!existing) {
          // Seed the database
          const seed = seedData as FamilyTreeSnapshot;
          await IndexedDbFamilyTreeRepository.replace(seed);
          existing = seed;
        }
        setSnapshot(existing);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tree");
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Derived ---
  const activePerson = snapshot?.people.find((p) => p.id === activePersonId);
  const editingPerson =
    snapshot?.people.find((p) => p.id === editingPersonId) ?? null;
  const deletingPerson =
    snapshot?.people.find((p) => p.id === deletingPersonId) ?? null;

  // --- Handlers ---
  const handleAddPerson = useCallback(() => {
    setIsAddingPerson(true);
  }, []);

  const handleEdit = useCallback((personId: string) => {
    setEditingPersonId(personId);
  }, []);

  const handleDelete = useCallback((personId: string) => {
    setDeletingPersonId(personId);
  }, []);

  const handleAddRelationship = useCallback((personId: string, type?: "parent" | "child" | "spouse") => {
    setAddRelationshipPersonId(personId);
    setAddRelationshipType(type);
  }, []);

  const handleAddPersonSave = useCallback(
    async (_personId: string | null, values: EditPersonFormValues) => {
      if (!snapshot) return;
      const { addPerson } = await import("@/application/family-tree/add-person");
      const updated = await addPerson({
        snapshot,
        person: {
          firstName: values.firstName,
          lastName: values.lastName || undefined,
          nickname: values.nickname || undefined,
          gender: values.gender as "male" | "female",
          birthDate: values.birthDate || undefined,
          deathDate: values.deathDate || undefined,
          notes: values.notes || undefined,
        },
      });
      setSnapshot(updated);
      setIsAddingPerson(false);
    },
    [snapshot, setSnapshot],
  );

  const handleEditSave = useCallback(
    async (personId: string | null, values: EditPersonFormValues) => {
      if (!snapshot || !personId) return;
      const updated = await editPerson({
        snapshot,
        personId,
        updates: {
          firstName: values.firstName,
          lastName: values.lastName || undefined,
          nickname: values.nickname || undefined,
          gender: values.gender,
          birthDate: values.birthDate || undefined,
          deathDate: values.deathDate || undefined,
          notes: values.notes || undefined,
        },
      });
      setSnapshot(updated);
      setEditingPersonId(null);
    },
    [snapshot, setSnapshot],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!snapshot || !deletingPersonId) return;
    setIsDeleting(true);
    const updated = await deletePerson({ snapshot, personId: deletingPersonId });
    setSnapshot(updated);
    setDeletingPersonId(null);
    setIsDeleting(false);
    useTreeUIStore.getState().setActivePerson(null);
  }, [snapshot, deletingPersonId, setSnapshot]);

  const handleAddRelationshipSave = useCallback(
    async (values: AddRelationshipFormValues, parentIds?: string[]) => {
      if (!snapshot || !addRelationshipPersonId) return;
      const personData = {
        firstName: values.firstName,
        lastName: values.lastName || undefined,
        gender: values.gender as "male" | "female",
        birthDate: values.birthDate || undefined,
        deathDate: values.deathDate || undefined,
        notes: values.notes || undefined,
      };

      let updated: FamilyTreeSnapshot;
      if (values.relationshipType === "parent") {
        updated = await addParent({
          snapshot,
          childId: addRelationshipPersonId,
          parent: personData,
        });
      } else if (values.relationshipType === "child") {
        updated = await addChild({
          snapshot,
          parentIds: parentIds ?? [addRelationshipPersonId],
          child: personData,
        });
      } else {
        updated = await addSpouse({
          snapshot,
          personId: addRelationshipPersonId,
          spouse: personData,
          status: values.partnershipStatus ?? "married",
        });
      }
      setSnapshot(updated);
      setAddRelationshipPersonId(null);
      setAddRelationshipType(undefined);
    },
    [snapshot, addRelationshipPersonId, setSnapshot],
  );

  const handleImport = useCallback(
    async (imported: FamilyTreeSnapshot) => {
      await IndexedDbFamilyTreeRepository.replace(imported);
      setSnapshot(imported);
    },
    [setSnapshot],
  );

  const handleReset = useCallback(async () => {
    const seed = seedData as FamilyTreeSnapshot;
    await IndexedDbFamilyTreeRepository.replace(seed);
    setSnapshot(seed);
    useTreeUIStore.getState().setActivePerson(null);
  }, [setSnapshot]);

  // --- Loading / Error ---
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#faf9f7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-teal-700 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Loading family tree…</p>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#faf9f7]">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-3">{error ?? "No data"}</p>
          <Link to="/" className="text-sm text-teal-700 underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col bg-[#faf9f7]", fullscreen ? "fixed inset-0 z-50" : "h-screen")}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white/80 backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={15} />
          </Link>
          <div className="flex items-center gap-2">
            <TreePine size={15} className="text-teal-700" />
            <h1 className="text-sm font-semibold text-slate-800">
              {snapshot.tree.name}
            </h1>
          </div>
          <span className="text-xs text-slate-400 hidden sm:block">
            {snapshot.people.length} members
          </span>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            id="tree-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <MoreHorizontal size={15} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute top-full right-0 mt-1 z-40 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/60 p-2 min-w-[180px] animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Data
                </div>
                <ImportExportPanel
                  snapshot={snapshot}
                  onImport={handleImport}
                  onReset={handleReset}
                />
              </div>
            </>
          )}
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <FamilyTreeCanvas
          snapshot={snapshot}
          onAddPerson={handleAddPerson}
          onAddRelationship={handleAddRelationship}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Overlays */}
      <PersonDetailsSheet
        person={detailsOpen ? (activePerson ?? null) : null}
        onEdit={handleEdit}
      />

      <SearchCommand people={snapshot.people} />

      {isAddingPerson && (
        <EditPersonDialog
          onSave={handleAddPersonSave}
          onClose={() => setIsAddingPerson(false)}
        />
      )}

      {editingPersonId && (
        <EditPersonDialog
          person={editingPerson}
          onSave={handleEditSave}
          onClose={() => setEditingPersonId(null)}
        />
      )}

      {deletingPersonId && deletingPerson && (
        <DeletePersonDialog
          personName={`${deletingPerson.firstName}${deletingPerson.lastName ? ` ${deletingPerson.lastName}` : ""}`}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingPersonId(null)}
          isDeleting={isDeleting}
        />
      )}

      {addRelationshipPersonId && (
        <AddRelationshipDialog
          personId={addRelationshipPersonId}
          snapshot={snapshot}
          defaultType={addRelationshipType}
          onSave={handleAddRelationshipSave}
          onClose={() => {
            setAddRelationshipPersonId(null);
            setAddRelationshipType(undefined);
          }}
        />
      )}
    </div>
  );
}
