import axios from 'axios';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

interface MarketPrice {
  commodity: string;
  variety?: string;
  market: string;
  district: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  date: string;
  unit: string;
}

interface CachedMarketPrice extends MarketPrice {
  cacheKey: string;
  cachedAt: string;
  ttl: number;
}

export class MarketPriceService {
  private docClient: DynamoDBDocumentClient;
  private cacheTable: string;
  private cacheTTL: number = 3600; // 1 hour cache

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.cacheTable = process.env.MARKET_PRICE_CACHE_TABLE || 'ruralconnect-market-prices';
  }

  async getMarketPrices(
    commodity: string,
    state?: string,
    district?: string
  ): Promise<MarketPrice[]> {
    // Check cache first
    const cacheKey = this.generateCacheKey(commodity, state, district);
    const cached = await this.getCachedPrices(cacheKey);
    
    if (cached && cached.length > 0) {
      return cached;
    }

    // Fetch from AGMARKNET API
    const prices = await this.fetchFromAGMARKNET(commodity, state, district);
    
    // Cache the results
    await this.cachePrices(cacheKey, prices);
    
    return prices;
  }

  private async fetchFromAGMARKNET(
    commodity: string,
    state?: string,
    district?: string
  ): Promise<MarketPrice[]> {
    try {
      // AGMARKNET API endpoint (Note: This is a placeholder - actual API may require authentication)
      const baseUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
      
      const params: any = {
        'api-key': process.env.DATA_GOV_IN_API_KEY,
        format: 'json',
        limit: 100,
        filters: {
          commodity: commodity,
        },
      };

      if (state) {
        params.filters.state = state;
      }
      if (district) {
        params.filters.district = district;
      }

      const response = await axios.get(baseUrl, {
        params,
        timeout: 10000, // 10 second timeout
      });

      // Transform API response to our format
      const records = response.data.records || [];
      return records.map((record: any) => ({
        commodity: record.commodity || commodity,
        variety: record.variety,
        market: record.market,
        district: record.district,
        state: record.state,
        minPrice: parseFloat(record.min_price) || 0,
        maxPrice: parseFloat(record.max_price) || 0,
        modalPrice: parseFloat(record.modal_price) || 0,
        date: record.arrival_date || new Date().toISOString().split('T')[0],
        unit: record.unit || 'quintal',
      }));
    } catch (error) {
      console.error('Error fetching from AGMARKNET:', error);
      
      // Return fallback data if API fails
      return this.getFallbackPrices(commodity);
    }
  }

  private async getCachedPrices(cacheKey: string): Promise<MarketPrice[] | null> {
    try {
      const result = await this.docClient.send(
        new QueryCommand({
          TableName: this.cacheTable,
          KeyConditionExpression: 'cacheKey = :cacheKey',
          ExpressionAttributeValues: {
            ':cacheKey': cacheKey,
          },
          Limit: 100,
        })
      );

      if (result.Items && result.Items.length > 0) {
        // Check if cache is still valid
        const firstItem = result.Items[0] as CachedMarketPrice;
        const cachedTime = new Date(firstItem.cachedAt).getTime();
        const now = Date.now();
        
        if (now - cachedTime < this.cacheTTL * 1000) {
          return result.Items.map(item => {
            const { cacheKey, cachedAt, ttl, ...price } = item as CachedMarketPrice;
            return price;
          });
        }
      }

      return null;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  private async cachePrices(cacheKey: string, prices: MarketPrice[]): Promise<void> {
    try {
      const cachedAt = new Date().toISOString();
      const ttl = Math.floor(Date.now() / 1000) + this.cacheTTL;

      for (const price of prices) {
        const cachedPrice: CachedMarketPrice = {
          ...price,
          cacheKey,
          cachedAt,
          ttl,
        };

        await this.docClient.send(
          new PutCommand({
            TableName: this.cacheTable,
            Item: cachedPrice,
          })
        );
      }
    } catch (error) {
      console.error('Error caching prices:', error);
      // Don't throw - caching failure shouldn't break the request
    }
  }

  private generateCacheKey(commodity: string, state?: string, district?: string): string {
    const parts = [commodity.toLowerCase()];
    if (state) parts.push(state.toLowerCase());
    if (district) parts.push(district.toLowerCase());
    return parts.join('_');
  }

  private getFallbackPrices(commodity: string): MarketPrice[] {
    // Fallback prices for common crops (in INR per quintal)
    const fallbackData: Record<string, Partial<MarketPrice>> = {
      wheat: { minPrice: 2000, maxPrice: 2200, modalPrice: 2100, unit: 'quintal' },
      rice: { minPrice: 1800, maxPrice: 2000, modalPrice: 1900, unit: 'quintal' },
      cotton: { minPrice: 5500, maxPrice: 6000, modalPrice: 5750, unit: 'quintal' },
      sugarcane: { minPrice: 280, maxPrice: 320, modalPrice: 300, unit: 'quintal' },
      potato: { minPrice: 800, maxPrice: 1200, modalPrice: 1000, unit: 'quintal' },
      onion: { minPrice: 1000, maxPrice: 1500, modalPrice: 1250, unit: 'quintal' },
      tomato: { minPrice: 800, maxPrice: 1400, modalPrice: 1100, unit: 'quintal' },
    };

    const fallback = fallbackData[commodity.toLowerCase()] || {
      minPrice: 1000,
      maxPrice: 1500,
      modalPrice: 1250,
      unit: 'quintal',
    };

    return [
      {
        commodity,
        market: 'Average Market',
        district: 'N/A',
        state: 'N/A',
        date: new Date().toISOString().split('T')[0],
        ...fallback,
      } as MarketPrice,
    ];
  }

  async getHistoricalPrices(
    commodity: string,
    state?: string,
    yearsBack: number = 3
  ): Promise<MarketPrice[]> {
    // This would typically query historical data from database or API
    // For now, return empty array as placeholder
    return [];
  }
}
