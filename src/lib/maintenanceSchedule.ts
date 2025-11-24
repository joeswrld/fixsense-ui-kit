// Maintenance schedule calculator based on appliance type and usage patterns

export interface MaintenanceSchedule {
  frequency: number; // in days
  type: string;
  description: string;
}

// Default maintenance schedules by appliance type
const defaultSchedules: Record<string, MaintenanceSchedule[]> = {
  "HVAC": [
    { frequency: 90, type: "Filter Change", description: "Replace HVAC filters" },
    { frequency: 180, type: "Professional Service", description: "Professional HVAC inspection and service" },
  ],
  "Refrigerator": [
    { frequency: 180, type: "Coil Cleaning", description: "Clean condenser coils" },
    { frequency: 365, type: "Seal Inspection", description: "Check door seals and gaskets" },
  ],
  "Washing Machine": [
    { frequency: 90, type: "Filter Cleaning", description: "Clean lint filter and drain pump" },
    { frequency: 180, type: "Deep Clean", description: "Run cleaning cycle and check hoses" },
  ],
  "Dishwasher": [
    { frequency: 90, type: "Filter Cleaning", description: "Clean filter and spray arms" },
    { frequency: 180, type: "Seal Inspection", description: "Check door seal and gasket" },
  ],
  "Water Heater": [
    { frequency: 180, type: "Tank Flush", description: "Flush sediment from tank" },
    { frequency: 365, type: "Professional Service", description: "Professional inspection" },
  ],
  "Dryer": [
    { frequency: 30, type: "Lint Removal", description: "Clean lint trap and exhaust vent" },
    { frequency: 180, type: "Vent Inspection", description: "Inspect and clean dryer vent system" },
  ],
  "Oven": [
    { frequency: 90, type: "Cleaning", description: "Deep clean oven interior" },
    { frequency: 365, type: "Seal Inspection", description: "Check door seals and gaskets" },
  ],
  "Microwave": [
    { frequency: 30, type: "Cleaning", description: "Clean interior and exterior" },
    { frequency: 180, type: "Inspection", description: "Check door seal and magnetron" },
  ],
};

/**
 * Get maintenance schedules for an appliance type
 */
export const getMaintenanceSchedules = (applianceType: string): MaintenanceSchedule[] => {
  return defaultSchedules[applianceType] || [
    { frequency: 180, type: "General Maintenance", description: "Regular inspection and maintenance" },
  ];
};

/**
 * Calculate the next maintenance date based on last maintenance
 */
export const calculateNextMaintenanceDate = (
  lastMaintenanceDate: Date,
  frequency: number
): Date => {
  const nextDate = new Date(lastMaintenanceDate);
  nextDate.setDate(nextDate.getDate() + frequency);
  return nextDate;
};

/**
 * Adjust maintenance frequency based on actual completion patterns
 */
export const adjustMaintenanceFrequency = (
  baseFrequency: number,
  completionHistory: { maintenance_date: string; maintenance_type: string }[]
): number => {
  if (completionHistory.length < 2) return baseFrequency;

  // Calculate average time between actual maintenance completions
  const sortedHistory = completionHistory.sort(
    (a, b) => new Date(a.maintenance_date).getTime() - new Date(b.maintenance_date).getTime()
  );

  let totalDays = 0;
  let intervals = 0;

  for (let i = 1; i < sortedHistory.length; i++) {
    const prev = new Date(sortedHistory[i - 1].maintenance_date);
    const curr = new Date(sortedHistory[i].maintenance_date);
    const days = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    
    // Only count reasonable intervals (not too short, not too long)
    if (days > 7 && days < baseFrequency * 2) {
      totalDays += days;
      intervals++;
    }
  }

  if (intervals === 0) return baseFrequency;

  const avgInterval = totalDays / intervals;

  // Adjust frequency: if user maintains more/less frequently, adjust schedule
  // Keep within 50%-150% of base frequency to avoid extremes
  const adjustedFrequency = Math.round(avgInterval);
  return Math.max(
    Math.floor(baseFrequency * 0.5),
    Math.min(Math.ceil(baseFrequency * 1.5), adjustedFrequency)
  );
};

/**
 * Calculate all upcoming maintenance dates for an appliance with pattern-based adjustments
 */
export const calculateMaintenanceDates = (
  applianceType: string,
  purchaseDate: Date | null,
  lastMaintenanceDate: Date | null,
  completionHistory?: { maintenance_date: string; maintenance_type: string }[]
): { schedule: MaintenanceSchedule; nextDate: Date; adjustedFrequency?: number }[] => {
  const schedules = getMaintenanceSchedules(applianceType);
  const baseDate = lastMaintenanceDate || purchaseDate || new Date();

  return schedules.map((schedule) => {
    // Adjust frequency based on completion history if available
    const adjustedFrequency = completionHistory && completionHistory.length > 0
      ? adjustMaintenanceFrequency(schedule.frequency, completionHistory)
      : schedule.frequency;

    return {
      schedule: {
        ...schedule,
        frequency: adjustedFrequency,
      },
      nextDate: calculateNextMaintenanceDate(baseDate, adjustedFrequency),
      adjustedFrequency: completionHistory && completionHistory.length > 0 ? adjustedFrequency : undefined,
    };
  });
};

/**
 * Get the nearest upcoming maintenance date
 */
export const getNextMaintenanceDate = (
  applianceType: string,
  purchaseDate: Date | null,
  lastMaintenanceDate: Date | null
): Date => {
  const dates = calculateMaintenanceDates(applianceType, purchaseDate, lastMaintenanceDate);
  const sortedDates = dates.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  return sortedDates[0]?.nextDate || new Date();
};

/**
 * Format maintenance schedule for storage
 */
export const formatMaintenanceSchedule = (
  applianceType: string
): MaintenanceSchedule[] => {
  return getMaintenanceSchedules(applianceType);
};
