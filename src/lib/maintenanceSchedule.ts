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
 * Calculate all upcoming maintenance dates for an appliance
 */
export const calculateMaintenanceDates = (
  applianceType: string,
  purchaseDate: Date | null,
  lastMaintenanceDate: Date | null
): { schedule: MaintenanceSchedule; nextDate: Date }[] => {
  const schedules = getMaintenanceSchedules(applianceType);
  const baseDate = lastMaintenanceDate || purchaseDate || new Date();

  return schedules.map((schedule) => ({
    schedule,
    nextDate: calculateNextMaintenanceDate(baseDate, schedule.frequency),
  }));
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
