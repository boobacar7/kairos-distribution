export type InventorySnapshot = {
  trackInventory: boolean;
  availableQty: number;
} | null;

export type AvailabilityClassification =
  | { status: 'UNTRACKED'; purchasable: true; issue: null }
  | { status: 'IN_STOCK'; purchasable: true; issue: null }
  | { status: 'OUT_OF_STOCK'; purchasable: false; issue: null }
  | { status: 'UNKNOWN'; purchasable: false; issue: 'MISSING_INVENTORY' };

/**
 * Read-only availability. Zero rows and untracked inventory are never collapsed into
 * "out of stock" (architecture.md §5.3.1, confirmed §6).
 */
export function classifyAvailability(item: InventorySnapshot): AvailabilityClassification {
  if (item === null) {
    return { status: 'UNKNOWN', purchasable: false, issue: 'MISSING_INVENTORY' };
  }
  if (!item.trackInventory) {
    return { status: 'UNTRACKED', purchasable: true, issue: null };
  }
  if (item.availableQty > 0) {
    return { status: 'IN_STOCK', purchasable: true, issue: null };
  }
  return { status: 'OUT_OF_STOCK', purchasable: false, issue: null };
}

export function matchesAvailabilityFilter(
  classification: AvailabilityClassification,
  filter: 'all' | 'in_stock' | 'out_of_stock',
): boolean {
  if (filter === 'all') return true;
  if (filter === 'in_stock') {
    return classification.status === 'IN_STOCK' || classification.status === 'UNTRACKED';
  }
  return classification.status === 'OUT_OF_STOCK';
}
