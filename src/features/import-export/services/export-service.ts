import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import type { FamilyTreeExport } from "../schemas/export-schema";

export function exportTree(snapshot: FamilyTreeSnapshot): void {
  const data: FamilyTreeExport = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    tree: snapshot.tree,
    people: snapshot.people,
    partnerships: snapshot.partnerships,
    parentChildRelationships: snapshot.parentChildRelationships,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `family-tree-${snapshot.tree.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
