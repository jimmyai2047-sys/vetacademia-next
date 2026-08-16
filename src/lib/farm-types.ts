// Shared farm-type taxonomy used by FarmGuide and ProjectReport content,
// the admin forms, and the public farmers page filter tabs.
export type FarmType = "SCIENTIFIC" | "DAIRY" | "GOAT" | "SHEEP" | "POULTRY" | "PIG";

export const FARM_TYPES: { key: FarmType; label: string; icon: string }[] = [
  { key: "SCIENTIFIC", label: "Scientific Farming", icon: "🧪" },
  { key: "DAIRY", label: "Dairy Farm", icon: "🐄" },
  { key: "GOAT", label: "Goat Farm", icon: "🐐" },
  { key: "SHEEP", label: "Sheep Farm", icon: "🐑" },
  { key: "POULTRY", label: "Poultry Farm", icon: "🐔" },
  { key: "PIG", label: "Pig Farm", icon: "🐖" },
];

export function farmTypeLabel(key: string): string {
  return FARM_TYPES.find((f) => f.key === key)?.label ?? key;
}

export function isFarmType(key: string): key is FarmType {
  return FARM_TYPES.some((f) => f.key === key);
}
