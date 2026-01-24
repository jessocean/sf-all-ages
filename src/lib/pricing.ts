import type { Venue, Event } from "./schema";

export interface Party {
  toddlers: number; // 0-3 years
  kids: number; // 4-8 years
  teens: number; // 9-17 years
  adults: number; // 18+
}

export const DEFAULT_PARTY: Party = {
  toddlers: 0,
  kids: 0,
  teens: 0,
  adults: 1,
};

export function getTotalPartySize(party: Party): number {
  return party.toddlers + party.kids + party.teens + party.adults;
}

/**
 * Calculate the minimum cost for a party to visit a venue or attend an event
 */
export function calculateMinCost(
  item: Venue | Event,
  party: Party
): number {
  // Free venues/events
  if (item.pricingType === "free" || item.pricingType === "donation") {
    return 0;
  }

  // If no pricing data, return -1 to indicate unknown
  if (!item.pricingType) {
    return -1;
  }

  // Calculate cost for each party member
  const toddlerCost = (item.toddlerPrice ?? 0) * party.toddlers;
  const kidCost = (item.childPrice ?? item.adultPrice ?? 0) * party.kids;
  const teenCost = (item.teenPrice ?? item.adultPrice ?? 0) * party.teens;
  const adultCost = (item.adultPrice ?? 0) * party.adults;

  return toddlerCost + kidCost + teenCost + adultCost;
}

/**
 * Get cost per person for the party (for ranking purposes)
 */
export function getCostPerPerson(
  item: Venue | Event,
  party: Party
): number {
  const totalCost = calculateMinCost(item, party);
  if (totalCost <= 0) return 0;

  const partySize = getTotalPartySize(party);
  if (partySize === 0) return 0;

  return totalCost / partySize;
}

/**
 * Format cost for display
 */
export function formatCost(
  item: Venue | Event,
  party: Party
): string {
  const totalCost = calculateMinCost(item, party);

  if (totalCost === 0) {
    return "Free";
  }

  if (totalCost < 0) {
    // Unknown pricing
    if (item.pricingType === "menu") {
      return "Menu prices";
    }
    return "Price varies";
  }

  const partySize = getTotalPartySize(party);

  if (partySize === 1) {
    return `~$${Math.round(totalCost)}`;
  }

  return `~$${Math.round(totalCost)} for your group`;
}

/**
 * Get a cost score for ranking (higher = cheaper = better)
 * Returns 0-100
 */
export function getCostScore(
  item: Venue | Event,
  party: Party
): number {
  const costPerPerson = getCostPerPerson(item, party);

  if (costPerPerson === 0) return 100; // Free is best
  if (costPerPerson < 10) return 80;
  if (costPerPerson < 25) return 60;
  if (costPerPerson < 50) return 40;
  return 20;
}

/**
 * Format parking info for display
 */
export function formatParking(venue: Venue): string {
  if (!venue.parkingType) return "";

  switch (venue.parkingType) {
    case "free":
      return "🅿️ Free parking";
    case "paid":
      if (venue.parkingCost) {
        return `🅿️ Paid parking (~$${venue.parkingCost}/hr)`;
      }
      return "🅿️ Paid parking";
    case "street":
      return "🅿️ Street parking";
    case "none":
      return "🅿️ No parking";
    default:
      return "";
  }
}
