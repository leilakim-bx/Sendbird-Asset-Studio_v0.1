import {
  Hotel, Utensils, Waves, Camera, Plane, Car, MapPin, Clock,
  type LucideIcon,
} from "lucide-react";
import type { ItineraryIcon } from "@/lib/store";

/**
 * Curated itinerary row icons — shared by the preview (FeatureMockup) and the
 * editor dropdown (FormPanel) so the option list and the rendered glyph never
 * drift. Keys are the data values (ItineraryIcon in store.ts); the lucide
 * component is UI-only and lives here.
 */
export const ITINERARY_ICONS: { key: ItineraryIcon; label: string; Icon: LucideIcon }[] = [
  { key: "lodging",     label: "Lodging",     Icon: Hotel },
  { key: "dining",      label: "Dining",      Icon: Utensils },
  { key: "activity",    label: "Activity",    Icon: Waves },
  { key: "sightseeing", label: "Sightseeing", Icon: Camera },
  { key: "flight",      label: "Flight",      Icon: Plane },
  { key: "transport",   label: "Transport",   Icon: Car },
  { key: "place",       label: "Place",       Icon: MapPin },
  { key: "time",        label: "Time",        Icon: Clock },
];

const BY_KEY: Record<ItineraryIcon, LucideIcon> = ITINERARY_ICONS.reduce(
  (acc, { key, Icon }) => { acc[key] = Icon; return acc; },
  {} as Record<ItineraryIcon, LucideIcon>,
);

/** Lookup the lucide component for an itinerary icon key (falls back to MapPin). */
export function itineraryIcon(key: ItineraryIcon): LucideIcon {
  return BY_KEY[key] ?? MapPin;
}
