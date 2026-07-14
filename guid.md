# Family Tree Web App — V1 Architecture Blueprint

## 1. Product definition

V1 is a local-first, single-family-tree application.

```text
Landing Page
     │
     ▼
Open Family Tree
     │
     ▼
Interactive Family Tree Canvas
```

There is:

- no backend;
- no authentication;
- one tree in the UI;
- browser-local persistence through IndexedDB;
- bundled seed data for the initial tree;
- JSON import/export;
- full local editing for anyone opening the application.

The architecture remains ready for a future transition to:

```text
V1                         V2

IndexedDB                  Backend API
    │                          │
    ▼                          ▼
Repository                 Repository
    │                          │
    └──── Same application ────┘
```

The frontend must never assume that there is globally only one family tree.

---

# 2. Final technology stack

```text
Application
├── Vite
├── React
├── TypeScript
└── React Router

Styling
├── Tailwind CSS v4+
├── shadcn/ui
└── Lucide React

Tree visualization
├── React Flow
└── ELK.js

State
└── Zustand

Forms and validation
├── React Hook Form
└── Zod

Persistence
├── IndexedDB
└── Dexie

Testing
├── Vitest
└── React Testing Library
```

I would use **React Flow as the viewport/interaction system** and **ELK.js as an initial layout-engine implementation**.

The distinction is important:

```text
React Flow
=
rendering, nodes, edges, zooming, panning, viewport interaction

ELK.js
=
calculating x/y positions
```

Neither should define the application's family-tree domain model.

---

# 3. Core architectural principle

The application should be divided into five conceptual layers:

```text
┌─────────────────────────────────────┐
│              UI Layer               │
│ React components, dialogs, forms    │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│         Application Layer           │
│ Commands, use cases, orchestration  │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│            Domain Layer             │
│ People, relationships, invariants   │
└──────────────────┬──────────────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
┌──────────────┐       ┌────────────────┐
│ Persistence  │       │ Graph Pipeline │
│ Repository   │       │ Projection     │
└──────────────┘       │ Layout         │
                       │ Rendering       │
                       └────────────────┘
```

The key rule is:

> React components should not contain family-tree business logic.

For example, this is undesirable:

```ts
function AddSpouseDialog() {
  // Find all marriages
  // Check current spouse
  // Determine relationship validity
  // Update IndexedDB
  // Recalculate graph
  // Convert to React Flow
}
```

Instead:

```text
UI
 ↓
Application operation
 ↓
Domain validation
 ↓
Repository mutation
 ↓
Derived graph updates
```

---

# 4. Domain model

I recommend these primary entities.

## FamilyTree

```ts
interface FamilyTree {
  id: string;
  name: string;

  createdAt: string;
  updatedAt: string;
}
```

There is deliberately no permanent `rootPersonId`.

The application initially displays the entire tree using `fitView()`.

A clicked person becomes the current active person, but that is UI state rather than persisted tree structure.

---

## Person

```ts
type Gender = "male" | "female";

interface Person {
  id: string;
  treeId: string;

  firstName: string;
  lastName?: string;
  nickname?: string;

  gender: Gender;

  birthDate?: string;
  deathDate?: string;

  notes?: string;

  createdAt: string;
  updatedAt: string;
}
```

The tree node itself should remain compact:

```text
     ◯
   Vijay
```

A deceased person:

```text
     ◯
  Vijay †
```

Full metadata belongs in the details panel.

---

## Partnership

```ts
type PartnershipStatus = "married" | "divorced" | "widowed";

interface Partnership {
  id: string;
  treeId: string;

  personAId: string;
  personBId: string;

  status: PartnershipStatus;

  createdAt: string;
  updatedAt: string;
}
```

Rules:

```text
married
→ active partnership

divorced
→ historical partnership

widowed
→ historical partnership
```

A person may have:

```text
✓ zero current spouses
✓ one current spouse
✓ multiple historical spouses
```

A person may not have:

```text
✗ multiple currently married spouses
```

---

## ParentChildRelationship

```ts
interface ParentChildRelationship {
  id: string;
  treeId: string;

  parentId: string;
  childId: string;

  createdAt: string;
}
```

The model supports:

```text
Person
├── 0..N parents
└── 0..N children
```

Even though most V1 data will probably have one or two parents.

---

# 5. Domain invariants

These should be centralized and tested.

```text
Person cannot be their own parent.

Person cannot be their own child.

Person cannot be their own spouse.

Duplicate parent-child relationships are prohibited.

Duplicate partnerships between the same people are prohibited.

Parent-child cycles are prohibited.

A person can have at most one active married partnership.

Deleting a person does not recursively delete relatives.

Deleting a person removes relationships involving that person.

A relationship can only connect people belonging to the same tree.
```

The cycle rule is particularly important.

This must be rejected:

```text
A
↓
B
↓
C
↓
A
```

The validation should happen in the domain/application layer, not in the React component.

---

# 6. Do not store a nested family tree

Do not persist this:

```ts
const tree = {
  person: {
    children: [
      {
        children: [
          // ...
        ],
      },
    ],
  },
};
```

A family tree is not actually a simple tree.

It is a graph.

For example:

```text
       A ─── B
       │
       C
       │
       D ─── E
           │
           F
```

With divorce, remarriage, half-siblings, and multiple parents, nested objects become increasingly difficult to maintain.

Persist normalized entities:

```text
people[]
partnerships[]
parentChildRelationships[]
```

Then derive whatever structure the UI needs.

---

# 7. The graph pipeline

This is probably the most important part of the architecture.

Do not directly convert database records into React Flow nodes inside components.

Use this pipeline:

```text
Domain Data
    │
    ▼
Family Graph
    │
    ▼
Layout Graph
    │
    ▼
Layout Engine
    │
    ▼
Positioned Graph
    │
    ▼
React Flow Adapter
    │
    ▼
React Flow
```

More concretely:

```text
People
Partnerships
Parent-child relationships
        │
        ▼
projectFamilyGraph()
        │
        ▼
LayoutGraph
        │
        ▼
TreeLayoutEngine.layout()
        │
        ▼
PositionedGraph
        │
        ▼
toReactFlowGraph()
        │
        ▼
nodes[]
edges[]
```

This keeps your application independent of React Flow and ELK.

---

# 8. Virtual partnership nodes

The persisted data might contain:

```text
Person A
Person B

Partnership:
A ↔ B

Parent relationships:
A → C
B → C
```

For layout purposes, transform this into:

```text
[A] ─── [virtual union] ─── [B]
               │
               ▼
              [C]
```

The virtual node:

```ts
interface LayoutUnionNode {
  id: string;
  kind: "union";
  partnershipId: string;
}
```

is not persisted.

It exists only during graph projection.

This makes layouts such as:

```text
      Vijay ─── Gangarati
               │
       ┌───────┼───────┐
       │       │       │
     Child   Child   Child
```

much easier for the layout engine to understand.

For more unusual multiple-parent structures, the projection layer can generate additional layout structures without changing persisted domain data.

---

# 9. Layout engine abstraction

Do not let ELK.js types spread throughout the application.

Define your own interface:

```ts
interface TreeLayoutEngine {
  layout(graph: LayoutGraph): Promise<PositionedGraph>;
}
```

Implementation:

```ts
class ElkTreeLayoutEngine implements TreeLayoutEngine {
  async layout(graph: LayoutGraph): Promise<PositionedGraph> {
    // Convert to ELK
    // Run layout
    // Convert back
  }
}
```

The application sees:

```text
TreeLayoutEngine
```

not:

```text
ELK
```

This allows:

```text
V1
ElkTreeLayoutEngine

Future
CustomGenealogyLayoutEngine
```

without rewriting the rest of the application.

Before building the full UI, create a layout spike containing:

```text
1. Simple parents + children
2. Multiple siblings
3. Multiple generations
4. Divorce
5. Remarriage
6. Half-siblings
7. Three parents
8. 100 generated people
9. 500 generated people
10. 1,000 generated people
```

The biggest technical risk in this project is not forms or IndexedDB. It is **genealogy-specific automatic layout**.

Validate that first.

---

# 10. Stable layout behavior

Clicking a person should not rearrange the tree.

```text
Click person
    │
    ├── activePersonId changes
    ├── node becomes highlighted
    ├── viewport smoothly centers
    └── actions become available
```

But:

```text
✗ no graph reconstruction
✗ no layout recalculation
✗ no movement of relatives
```

Layout should recalculate only after structural mutations:

```text
Add person
Add parent
Add child
Add spouse
Delete person
Change parent-child relationship
Change partnership structure
```

Editing:

```text
Vijay → Vijay Kumar
```

usually does not need a complete layout recalculation unless the node dimensions change materially.

---

# 11. Zustand state

Use Zustand only for client-side application/UI state.

For example:

```ts
interface TreeUIState {
  activePersonId: string | null;

  searchOpen: boolean;
  detailsOpen: boolean;
  fullscreen: boolean;

  setActivePerson: (personId: string | null) => void;

  openSearch: () => void;
  closeSearch: () => void;

  openDetails: () => void;
  closeDetails: () => void;
}
```

Do not create a giant store containing:

```text
people
relationships
database
forms
layout engine
React Flow nodes
dialogs
import logic
export logic
```

I would keep the boundaries approximately:

```text
Persistent data
→ repository/query layer

UI state
→ Zustand

Form state
→ React Hook Form

Validation
→ Zod + domain rules

Graph data
→ derived projection

Viewport
→ React Flow
```

---

# 12. Repository architecture

The UI should never directly call Dexie.

Bad:

```ts
await db.people.add(person);
```

inside:

```tsx
<AddPersonDialog />
```

Instead:

```text
Component
    │
    ▼
Application operation
    │
    ▼
TreeRepository
    │
    ▼
IndexedDbTreeRepository
    │
    ▼
Dexie
```

A repository contract could conceptually expose:

```ts
interface TreeRepository {
  getTree(): Promise<FamilyTree | null>;

  getPeople(treeId: string): Promise<Person[]>;

  getPartnerships(treeId: string): Promise<Partnership[]>;

  getParentChildRelationships(
    treeId: string,
  ): Promise<ParentChildRelationship[]>;

  // mutation methods...
}
```

However, avoid making one enormous repository interface if it becomes unwieldy. You can separate:

```text
TreeRepository
PersonRepository
RelationshipRepository
```

or use a cohesive aggregate repository:

```text
FamilyTreeRepository
```

For this application, I would initially prefer a cohesive `FamilyTreeRepository` because most useful operations require the graph as a whole.

For example:

```ts
interface FamilyTreeSnapshot {
  tree: FamilyTree;
  people: Person[];
  partnerships: Partnership[];
  parentChildRelationships: ParentChildRelationship[];
}
```

Then:

```ts
interface FamilyTreeRepository {
  load(): Promise<FamilyTreeSnapshot | null>;

  savePerson(person: Person): Promise<void>;

  deletePerson(personId: string): Promise<void>;

  savePartnership(partnership: Partnership): Promise<void>;

  saveParentChildRelationship(
    relationship: ParentChildRelationship,
  ): Promise<void>;

  replace(snapshot: FamilyTreeSnapshot): Promise<void>;

  clear(): Promise<void>;
}
```

This interface can later be implemented by:

```text
IndexedDbFamilyTreeRepository
ApiFamilyTreeRepository
```

---

# 13. Application operations

Do not expose low-level persistence operations directly to the UI for complex mutations.

For example:

```text
Add child
```

may require:

```text
1. Validate new person
2. Create person
3. Create parent-child relationship with active person
4. Optionally create relationships with selected additional parents
5. Persist atomically
6. Refresh derived graph
```

Represent this as an application operation:

```ts
addChild({
  parentIds,
  child,
});
```

Similarly:

```text
addParent()
addChild()
addSpouse()
editPerson()
deletePerson()
updatePartnershipStatus()
```

The UI says what the user wants to do.

The application layer determines how many entities need to change.

---

# 14. Atomic operations

This is important with IndexedDB.

Suppose adding a child involves:

```text
Create Person
Create Relationship A → Child
Create Relationship B → Child
```

You do not want:

```text
Person created ✓
Relationship A created ✓
Relationship B failed ✗
```

Use a Dexie transaction so the operation succeeds or fails as one unit.

The repository abstraction should support these aggregate mutations cleanly.

---

# 15. Initial data flow

On application startup:

```text
App starts
    │
    ▼
Initialize persistence
    │
    ▼
Does a local tree exist?
    │
    ├── Yes
    │    │
    │    ▼
    │   Load it
    │
    └── No
         │
         ▼
    Load bundled seed JSON
         │
         ▼
    Validate schema
         │
         ▼
    Store in IndexedDB
         │
         ▼
       Load it
```

The bundled seed file remains immutable.

For example:

```text
src/data/seed/family-tree.json
```

The user's working copy lives in IndexedDB.

---

# 16. Import/export format

Use a versioned document.

Conceptually:

```ts
interface FamilyTreeExport {
  schemaVersion: 1;
  exportedAt: string;

  tree: FamilyTree;
  people: Person[];
  partnerships: Partnership[];
  parentChildRelationships: ParentChildRelationship[];
}
```

Example:

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-07-14T10:00:00.000Z",
  "tree": {},
  "people": [],
  "partnerships": [],
  "parentChildRelationships": []
}
```

Import pipeline:

```text
Select JSON
    │
    ▼
Parse JSON
    │
    ▼
Validate export envelope
    │
    ▼
Check schemaVersion
    │
    ▼
Validate all entities
    │
    ▼
Validate graph integrity
    │
    ▼
Show import summary
    │
    ▼
Confirm replacement
    │
    ▼
Atomic IndexedDB replacement
```

Do not partially import invalid data.

V1 should support:

```text
Import → replace current tree

Export → download complete tree

Reset → restore bundled seed tree
```

No merge.

---

# 17. Import validation

Zod validates structural correctness:

```text
✓ required fields exist
✓ gender is valid
✓ partnership status is valid
✓ IDs are strings
✓ dates have expected representation
```

Domain validation checks semantic correctness:

```text
✓ every person belongs to the tree
✓ every relationship references existing people
✓ no self-parent relationships
✓ no cycles
✓ no duplicate relationships
✓ no invalid simultaneous marriages
```

These are separate concerns.

```text
Zod
→ Is the document structurally valid?

Domain validator
→ Does the family graph make sense?
```

---

# 18. Date representation

Use ISO-compatible date strings in persistence:

```text
YYYY-MM-DD
```

For example:

```ts
birthDate: "2003-08-12";
```

Do not store JavaScript `Date` objects in the domain model.

This makes:

- IndexedDB persistence;
- JSON export;
- API transport;
- schema validation

much simpler.

---

# 19. Add relationship UX

Clicking a person:

```text
             Vijay
               │
               ▼
        ┌───────────────┐
        │ View details  │
        │ Add relation  │
        │ Edit          │
        │ Delete        │
        └───────────────┘
```

Add relationship:

```text
┌──────────────────────┐
│ Add relationship     │
│                      │
│ Parent               │
│ Child                │
│ Spouse               │
└──────────────────────┘
```

Each always creates a new person.

---

# 20. Add parent flow

```text
Active person: Vijay

Add relationship
    ↓
Parent
    ↓
Create new person
    ↓
Save
```

Application operation:

```text
Create Parent
Create Parent → Vijay relationship
```

---

# 21. Add spouse flow

```text
Active person: Vijay

Add relationship
    ↓
Spouse
    ↓
Create new person
    ↓
Status: married
    ↓
Save
```

Before creating a `married` partnership:

```text
Does Vijay already have a married spouse?

Yes
→ Reject or require ending current marriage first

No
→ Create partnership
```

For V1, I would not silently divorce the current spouse.

The user should explicitly change the previous partnership to:

```text
divorced
```

or:

```text
widowed
```

before creating another current marriage.

---

# 22. Add child flow

If the active person has no spouse:

```text
Parents
☑ Vijay
```

If there is a current spouse:

```text
Parents
☑ Vijay
☑ Gangarati — married
```

Historical spouses may also be offered:

```text
☐ Person A — divorced
☐ Person B — widowed
```

The active person should remain selected.

The user creates one new child, and the application creates one parent-child relationship for every selected parent.

---

# 23. Delete behavior

Deleting a person:

```text
Delete Vijay?
```

The confirmation should explain:

```text
This will delete Vijay and all relationships directly connected to Vijay.

Other people will not be deleted.
```

Then:

```text
Delete Person
Delete partnerships involving Person
Delete parent-child relationships involving Person
```

Never recursively delete descendants.

Use one transaction.

---

# 24. Relationship visualization

Current marriage:

```text
Person ───────── Person
```

Divorced:

```text
Person - - - - - Person
```

Widowed can remain a solid relationship with a deceased indicator on the relevant person, or use a subtle historical style.

Given your requirement, I would use:

```text
married
→ solid connector

divorced
→ dashed/dotted connector

widowed
→ solid but visually subdued connector
```

Avoid excessive labels on the canvas.

---

# 25. Person nodes

Keep them compact.

Conceptually:

```text
      ╭─────╮
      │     │
      ╰─────╯
       Vijay
```

Gender can be distinguished visually, as in the reference, but do not encode gender **only** through color.

The component should be roughly:

```text
PersonNode
├── circular avatar placeholder
├── gender-specific visual treatment
├── name
├── deceased indicator
└── active-state indicator
```

No:

```text
birth date
death date
notes
buttons
large cards
```

inside every node.

---

# 26. Details panel

Use a right-side shadcn `Sheet`.

```text
┌───────────────────────────┐
│ Vijay Kumar               │
│                           │
│ Nickname                  │
│ Gender                    │
│ Born                      │
│ Died                      │
│                           │
│ Notes                     │
│ ...                       │
│                           │
│ [Edit]                    │
└───────────────────────────┘
```

The node's contextual menu can contain:

```text
View details
Add relationship
Edit
Delete
```

---

# 27. Search

Use a command-palette experience.

Search fields:

```text
firstName
lastName
nickname
full name
```

Selecting:

```text
Search result
    ↓
Set active person
    ↓
Close search
    ↓
Smoothly center viewport
```

For 1,000 people, client-side search is entirely reasonable.

---

# 28. Canvas controls

V1 should support:

```text
Zoom in
Zoom out
Fit tree to screen
Search
Fullscreen
```

React Flow handles most viewport operations.

The controls should be custom-styled to match the reference rather than using a visibly generic graph-editor interface.

---

# 29. Landing page

Keep it minimal.

```text
Family Tree

Explore the family history and relationships.

┌────────────────────────────┐
│ Avinash's Family Tree      │
│                            │
│ [ View Family Tree ]       │
└────────────────────────────┘
```

Route:

```text
/
```

Tree:

```text
/tree
```

Do not overbuild the landing page.

---

# 30. Recommended directory structure

I would use a feature-oriented architecture with explicit domain and infrastructure boundaries:

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers/
│       └── app-providers.tsx
│
├── pages/
│   ├── home/
│   │   └── home-page.tsx
│   │
│   └── tree/
│       └── tree-page.tsx
│
├── features/
│   ├── add-person/
│   │   ├── components/
│   │   ├── schemas/
│   │   └── index.ts
│   │
│   ├── edit-person/
│   │   ├── components/
│   │   ├── schemas/
│   │   └── index.ts
│   │
│   ├── delete-person/
│   │   ├── components/
│   │   └── index.ts
│   │
│   ├── add-relationship/
│   │   ├── components/
│   │   ├── schemas/
│   │   └── index.ts
│   │
│   ├── person-details/
│   │   ├── components/
│   │   └── index.ts
│   │
│   ├── search-people/
│   │   ├── components/
│   │   ├── lib/
│   │   └── index.ts
│   │
│   └── import-export/
│       ├── components/
│       ├── schemas/
│       ├── services/
│       └── index.ts
│
├── entities/
│   ├── family-tree/
│   │   ├── model/
│   │   ├── schemas/
│   │   └── index.ts
│   │
│   ├── person/
│   │   ├── model/
│   │   ├── schemas/
│   │   └── index.ts
│   │
│   └── relationship/
│       ├── model/
│       ├── schemas/
│       └── index.ts
│
├── widgets/
│   └── family-tree-canvas/
│       ├── components/
│       │   ├── family-tree-canvas.tsx
│       │   ├── person-node.tsx
│       │   ├── tree-controls.tsx
│       │   └── active-person-menu.tsx
│       │
│       ├── graph/
│       │   ├── project-family-graph.ts
│       │   ├── create-layout-graph.ts
│       │   └── to-react-flow-graph.ts
│       │
│       └── index.ts
│
├── domain/
│   └── family-tree/
│       ├── rules/
│       │   ├── validate-partnership.ts
│       │   ├── validate-parent-child.ts
│       │   └── detect-cycle.ts
│       │
│       ├── queries/
│       │   ├── get-parents.ts
│       │   ├── get-children.ts
│       │   ├── get-spouses.ts
│       │   └── get-current-spouse.ts
│       │
│       └── index.ts
│
├── application/
│   └── family-tree/
│       ├── add-parent.ts
│       ├── add-child.ts
│       ├── add-spouse.ts
│       ├── edit-person.ts
│       ├── delete-person.ts
│       └── update-partnership.ts
│
├── infrastructure/
│   ├── persistence/
│   │   ├── database/
│   │   │   ├── family-tree-db.ts
│   │   │   └── schema.ts
│   │   │
│   │   └── repositories/
│   │       └── indexed-db-family-tree-repository.ts
│   │
│   └── layout/
│       ├── tree-layout-engine.ts
│       └── elk/
│           ├── elk-tree-layout-engine.ts
│           ├── to-elk-graph.ts
│           └── from-elk-graph.ts
│
├── stores/
│   └── tree-ui-store.ts
│
├── data/
│   └── seed/
│       └── family-tree.json
│
├── shared/
│   ├── components/
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── ids.ts
│   │   ├── dates.ts
│   │   └── cn.ts
│   │
│   ├── types/
│   └── constants/
│
├── styles/
│   └── globals.css
│
└── main.tsx
```

This is intentionally more structured than a small CRUD app because the graph/layout subsystem is genuinely complex.

However, avoid creating every empty directory on day one. Add directories as functionality appears.

---

# 31. Dependency direction

Keep dependencies flowing inward:

```text
UI / Features
      │
      ▼
Application
      │
      ▼
Domain
```

Infrastructure implements abstractions needed by the application:

```text
Application
      │
      ▼
Repository Contract
      ▲
      │
Infrastructure Implementation
```

The domain should not import:

```text
React
React Flow
Zustand
Dexie
ELK
shadcn
```

The graph projection layer may depend on domain types, but domain entities should know nothing about visualization.

---

# 32. Backend migration path

Later, V2 may introduce:

```text
User
FamilyTree ownership
Authentication
Permissions
API
Database
```

The transition should look like:

```text
V1

Application
    ↓
FamilyTreeRepository
    ↓
IndexedDB
```

Then:

```text
V2

Application
    ↓
FamilyTreeRepository
    ↓
HTTP API
    ↓
Backend
    ↓
Database
```

The UI should not need to know whether:

```ts
await repository.load();
```

reads from IndexedDB or an API.

Realistically, some application changes will still be necessary for:

- async network states;
- optimistic updates;
- authentication;
- authorization;
- conflict handling;
- collaboration.

The goal is not “zero changes.” The goal is **no domain-model rewrite and no UI coupled directly to browser storage**.

---

# 33. Performance strategy

For 100–500 people, the initial architecture should be comfortable.

For 1,000+, pay attention to:

```text
Layout computation
DOM node count
React rerenders
Edge rendering
Graph recalculation frequency
```

Important optimizations:

```text
Memoize custom nodes.

Do not recalculate layout on selection.

Do not store duplicated derived graph state unnecessarily.

Batch repository mutations.

Run layout only after structural changes.

Consider Web Workers if ELK layout becomes expensive.

Avoid subscribing every node to the entire Zustand store.
```

If 1,000+ nodes eventually become a serious target rather than an edge case, profiling should determine whether DOM-based React Flow rendering remains sufficient.

Do not prematurely build a custom canvas renderer.

---

# 34. Recommended implementation sequence

Do not start by building the landing page.

The highest-risk subsystem should come first.

### Phase 1 — Domain model

Implement:

```text
FamilyTree
Person
Partnership
ParentChildRelationship
```

Then:

```text
getParents()
getChildren()
getPartnerships()
getCurrentSpouse()
```

Then validation:

```text
self relationship
duplicate relationship
cycle detection
current-spouse constraint
```

Write tests.

---

### Phase 2 — Layout spike

Create hardcoded datasets for:

```text
basic family
siblings
multiple generations
divorce
remarriage
half-siblings
multiple parents
large generated tree
```

Build:

```text
Domain Graph
→ Layout Graph
→ ELK
→ React Flow
```

Do not proceed deeply into CRUD until the layout approach is proven.

---

### Phase 3 — Read-only tree

Build:

```text
/tree
```

with:

```text
pan
zoom
fit view
person nodes
partnership edges
parent-child edges
active person
center on click
```

At this point, use hardcoded data.

---

### Phase 4 — Persistence

Add:

```text
Dexie
IndexedDB repository
seed initialization
```

The renderer should continue working without major changes.

---

### Phase 5 — CRUD operations

Implement in this order:

```text
Edit person
Add parent
Add child
Add spouse
Update partnership
Delete person
```

Each operation should go through the application/domain layer.

---

### Phase 6 — Details and search

Add:

```text
Person details Sheet
Search command
Jump to person
Fullscreen
```

---

### Phase 7 — Import/export

Implement:

```text
Versioned export schema
JSON export
Import validation
Import preview
Replace tree
Reset to seed
```

---

### Phase 8 — Polish and performance

Test:

```text
100 people
500 people
1,000 people
```

Profile:

```text
initial layout
structural mutation
rerenders
zoom/pan responsiveness
```

Only optimize actual bottlenecks.

---

# 35. First milestone

The first meaningful technical milestone should not be “the app looks like the screenshot.”

It should be:

```text
Given normalized family data containing:

✓ multiple generations
✓ remarriage
✓ divorced spouses
✓ half-siblings

the application can:

✓ project it into a layout graph
✓ automatically position it
✓ render it
✓ pan and zoom
✓ click a person
✓ center the viewport without rearranging the tree
```

Once that works, the major architectural risk has been resolved.

---

# Final architectural summary

The core architecture is:

```text
                    React UI
                       │
                       ▼
              Application Operations
                       │
              ┌────────┴────────┐
              ▼                 ▼
         Domain Rules       Repository
              │                 │
              │                 ▼
              │              Dexie
              │                 │
              │                 ▼
              │             IndexedDB
              │
              ▼
       Graph Projection
              │
              ▼
         Layout Graph
              │
              ▼
      TreeLayoutEngine
              │
              ▼
            ELK
              │
              ▼
       Positioned Graph
              │
              ▼
     React Flow Adapter
              │
              ▼
         React Flow
```

The three most important architectural rules are:

1. **Persist family-domain entities, not React Flow nodes or ELK graphs.**
2. **Keep the layout engine replaceable behind an adapter.**
3. **Keep browser persistence behind a repository boundary so a future backend does not require rewriting the application.**

**TL;DR:** Build the app with Vite, React, TypeScript, React Router, Tailwind v4+, shadcn/ui, Zustand, React Flow, ELK.js, Dexie/IndexedDB, React Hook Form, and Zod. Store normalized `Person`, `Partnership`, and `ParentChildRelationship` entities. Derive a separate layout graph with virtual partnership nodes, run it through a replaceable layout engine, and then adapt the result to React Flow. Start with the domain model and a layout prototype before building CRUD or visual polish.
