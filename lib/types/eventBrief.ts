export type EventType =
  | 'Wedding'
  | 'Reception'
  | 'Engagement'
  | 'Corporate'
  | 'Birthday'
  | 'Exhibition'
  | 'Anniversary'
  | 'Social Party'
  | string;

export type VenueType =
  | 'Banquet Hall'
  | 'Lawn / Farmhouse'
  | 'Resort'
  | 'Terrace'
  | 'Hotel Ballroom'
  | 'Heritage / Palace'
  | 'Corporate Convention'
  | 'Poolside'
  | string;

export type SlotPreference = 'FULL_DAY' | 'MORNING' | 'EVENING' | 'ANY';

export type CateringPreference =
  | 'ANY'
  | 'VEG_ONLY'
  | 'NON_VEG_ALLOWED'
  | 'JAIN_AVAILABLE'
  | 'OUTSIDE_ALLOWED';

export type SpacePreference = 'ANY' | 'INDOOR' | 'OUTDOOR' | 'BOTH';

export type SeatingStyle = 'FLOATING' | 'THEATRE' | 'ROUND_TABLE' | 'CLASSROOM';

export interface EventBrief {
  eventType: EventType;
  guestCount: number;
  city?: string;
  date?: string; // YYYY-MM-DD
  flexibilityDays?: number; // 0, 3, 7, 14
  slot?: SlotPreference;
  budgetTotal?: number;
  budgetPerPlate?: number;
  cateringPreference?: CateringPreference;
  spaceType?: SpacePreference;
  venueType?: VenueType;
  seatingStyle?: SeatingStyle;
  roomsNeeded?: number;
  parkingNeeded?: boolean;
  alcoholPermitted?: boolean;
  djMusicAllowed?: boolean;
}

export const VENUE_TYPES: VenueType[] = [
  'Banquet Hall',
  'Lawn / Farmhouse',
  'Resort',
  'Terrace',
  'Hotel Ballroom',
  'Heritage / Palace',
  'Corporate Convention',
  'Poolside',
];

export const EVENT_TYPES: EventType[] = [
  'Wedding',
  'Reception',
  'Engagement',
  'Corporate',
  'Birthday',
  'Exhibition',
  'Anniversary',
  'Social Party',
];

export const SEATING_STYLES: { id: SeatingStyle; label: string; ratio: number }[] = [
  { id: 'FLOATING', label: 'Floating / Reception', ratio: 1.0 },
  { id: 'THEATRE', label: 'Theatre / Auditorium', ratio: 0.85 },
  { id: 'ROUND_TABLE', label: 'Round Table / Banquet', ratio: 0.65 },
  { id: 'CLASSROOM', label: 'Classroom / Cluster', ratio: 0.55 },
];

/**
 * Serializes an EventBrief into URL search parameters
 */
export function serializeEventBriefToQuery(brief: Partial<EventBrief>): string {
  const params = new URLSearchParams();
  if (brief.eventType) params.set('eventType', brief.eventType);
  if (brief.guestCount) params.set('guestCount', brief.guestCount.toString());
  if (brief.city) params.set('city', brief.city);
  if (brief.date) params.set('date', brief.date);
  if (brief.flexibilityDays !== undefined) params.set('flex', brief.flexibilityDays.toString());
  if (brief.slot && brief.slot !== 'ANY') params.set('slot', brief.slot);
  if (brief.budgetTotal) params.set('budget', brief.budgetTotal.toString());
  if (brief.budgetPerPlate) params.set('budgetPlate', brief.budgetPerPlate.toString());
  if (brief.cateringPreference && brief.cateringPreference !== 'ANY') {
    params.set('catering', brief.cateringPreference);
  }
  if (brief.spaceType && brief.spaceType !== 'ANY') {
    params.set('space', brief.spaceType);
  }
  if (brief.venueType) params.set('venueType', brief.venueType);
  if (brief.seatingStyle) params.set('seating', brief.seatingStyle);
  if (brief.roomsNeeded) params.set('rooms', brief.roomsNeeded.toString());
  if (brief.parkingNeeded) params.set('parking', 'true');
  if (brief.alcoholPermitted) params.set('alcohol', 'true');
  if (brief.djMusicAllowed) params.set('dj', 'true');

  return params.toString();
}

/**
 * Parses an EventBrief from URL search parameters or dictionary
 */
export function parseEventBriefFromQuery(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): Partial<EventBrief> {
  const getParam = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined;
    }
    const val = searchParams[key];
    if (Array.isArray(val)) return val[0];
    return val || undefined;
  };

  const brief: Partial<EventBrief> = {};

  const eventType = getParam('eventType') || getParam('occasion');
  if (eventType) brief.eventType = eventType;

  const guests = getParam('guestCount') || getParam('guests') || getParam('capacity');
  if (guests && !isNaN(Number(guests))) brief.guestCount = Number(guests);

  const city = getParam('city');
  if (city) brief.city = city;

  const date = getParam('date');
  if (date) brief.date = date;

  const flex = getParam('flex');
  if (flex && !isNaN(Number(flex))) brief.flexibilityDays = Number(flex);

  const slot = getParam('slot');
  if (slot && ['FULL_DAY', 'MORNING', 'EVENING', 'ANY'].includes(slot.toUpperCase())) {
    brief.slot = slot.toUpperCase() as SlotPreference;
  }

  const budget = getParam('budget');
  if (budget && !isNaN(Number(budget))) brief.budgetTotal = Number(budget);

  const budgetPlate = getParam('budgetPlate');
  if (budgetPlate && !isNaN(Number(budgetPlate))) brief.budgetPerPlate = Number(budgetPlate);

  const catering = getParam('catering');
  if (catering) brief.cateringPreference = catering as CateringPreference;

  const space = getParam('space');
  if (space) brief.spaceType = space as SpacePreference;

  const venueType = getParam('venueType');
  if (venueType) brief.venueType = venueType;

  const seating = getParam('seating');
  if (seating) brief.seatingStyle = seating as SeatingStyle;

  const rooms = getParam('rooms');
  if (rooms && !isNaN(Number(rooms))) brief.roomsNeeded = Number(rooms);

  const parking = getParam('parking');
  if (parking === 'true' || parking === '1') brief.parkingNeeded = true;

  const alcohol = getParam('alcohol');
  if (alcohol === 'true' || alcohol === '1') brief.alcoholPermitted = true;

  const dj = getParam('dj');
  if (dj === 'true' || dj === '1') brief.djMusicAllowed = true;

  return brief;
}
