import { CoinConfig, ICoinConfig } from "../../models/coinConfig.model";

let cachedConfig: ICoinConfig | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class CoinConfigService {
  public static async getConfig(): Promise<ICoinConfig> {
    const now = Date.now();
    if (cachedConfig && now < cacheExpiry) {
      return cachedConfig;
    }

    let config = await CoinConfig.findOne();
    if (!config) {
      config = await CoinConfig.create({
        coinToRupeeRatio: 1,
        welcomeBonusCoins: 50,
        expiryInactivityDays: 30,
        extendExpiryOnEarn: false,
        isCoinSystemEnabled: true,
      });
    }

    cachedConfig = config;
    cacheExpiry = now + CACHE_TTL_MS;
    return config;
  }

  public static async updateConfig(updateData: Partial<ICoinConfig>, adminId?: string): Promise<ICoinConfig> {
    let config = await CoinConfig.findOne();
    if (!config) {
      config = new CoinConfig(updateData);
    } else {
      Object.assign(config, updateData);
    }
    if (adminId) {
      config.updatedBy = adminId as any;
    }
    await config.save();
    cachedConfig = config;
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return config;
  }

  public static clearCache(): void {
    cachedConfig = null;
    cacheExpiry = 0;
  }
}
