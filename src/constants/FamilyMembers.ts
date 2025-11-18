// Family Members Configuration
// Note: This file is deprecated. Use Redux familySlice instead.
// Kept for backward compatibility only.

export interface FamilyMember {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// Default members - used as initial state in Redux
export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: "wife",
    name: "Vợ",
    icon: "woman",
    color: "#FF6B9D",
  },
  {
    id: "husband",
    name: "Chồng",
    icon: "man",
    color: "#4A90E2",
  },
  {
    id: "child",
    name: "Con",
    icon: "happy",
    color: "#FFA726",
  },
  {
    id: "shared",
    name: "Chung",
    icon: "people",
    color: "#9C27B0",
  },
];
