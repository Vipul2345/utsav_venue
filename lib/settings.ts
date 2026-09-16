import prisma from './prisma';

export interface SystemSettingsConfig {
  commissionPercent: number;
  holdMinutes: number;
  defaultTaxPercent: number;
  maxHallImages: number;
}

export const DEFAULT_SETTINGS: SystemSettingsConfig = {
  commissionPercent: 10,
  holdMinutes: 10,
  defaultTaxPercent: 18,
  maxHallImages: 5,
};

export async function getSystemSettings(): Promise<SystemSettingsConfig> {
  try {
    const records = await prisma.systemSetting.findMany();
    const map = new Map(records.map((r) => [r.key, r.value]));

    return {
      commissionPercent: map.has('commissionPercent')
        ? parseFloat(map.get('commissionPercent')!)
        : DEFAULT_SETTINGS.commissionPercent,
      holdMinutes: map.has('holdMinutes')
        ? parseInt(map.get('holdMinutes')!, 10)
        : DEFAULT_SETTINGS.holdMinutes,
      defaultTaxPercent: map.has('defaultTaxPercent')
        ? parseFloat(map.get('defaultTaxPercent')!)
        : DEFAULT_SETTINGS.defaultTaxPercent,
      maxHallImages: map.has('maxHallImages')
        ? parseInt(map.get('maxHallImages')!, 10)
        : DEFAULT_SETTINGS.maxHallImages,
    };
  } catch (error) {
    console.error('Failed to load system settings from DB, using defaults:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSystemSettings(
  settings: Partial<SystemSettingsConfig>
): Promise<SystemSettingsConfig> {
  const updates: Array<{ key: string; value: string }> = [];

  if (settings.commissionPercent !== undefined) {
    updates.push({ key: 'commissionPercent', value: settings.commissionPercent.toString() });
  }
  if (settings.holdMinutes !== undefined) {
    updates.push({ key: 'holdMinutes', value: settings.holdMinutes.toString() });
  }
  if (settings.defaultTaxPercent !== undefined) {
    updates.push({ key: 'defaultTaxPercent', value: settings.defaultTaxPercent.toString() });
  }
  if (settings.maxHallImages !== undefined) {
    updates.push({ key: 'maxHallImages', value: settings.maxHallImages.toString() });
  }

  for (const item of updates) {
    await prisma.systemSetting.upsert({
      where: { key: item.key },
      create: { key: item.key, value: item.value },
      update: { value: item.value },
    });
  }

  return getSystemSettings();
}
