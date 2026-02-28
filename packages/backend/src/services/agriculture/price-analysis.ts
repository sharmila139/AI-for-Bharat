import { MarketPriceService } from './market-prices';

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

interface PriceTrend {
  commodity: string;
  period: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  volatility: number;
}

interface TrendAnalysis {
  commodity: string;
  currentPrice: number;
  historicalTrends: PriceTrend[];
  yearOverYearChange: number;
  seasonalPattern: string;
  priceVolatility: 'low' | 'medium' | 'high';
  recommendation: string;
  confidence: number;
}

export class PriceAnalysisService {
  private marketPriceService: MarketPriceService;

  constructor() {
    this.marketPriceService = new MarketPriceService();
  }

  async analyzeHistoricalTrends(
    commodity: string,
    state?: string,
    yearsBack: number = 3
  ): Promise<TrendAnalysis> {
    // Get current prices
    const currentPrices = await this.marketPriceService.getMarketPrices(commodity, state);
    const currentPrice = currentPrices.length > 0 
      ? currentPrices[0].modalPrice 
      : 0;

    // Get historical data (would come from database in production)
    const historicalData = await this.getHistoricalData(commodity, state, yearsBack);
    
    // Calculate trends by year
    const yearlyTrends = this.calculateYearlyTrends(historicalData);
    
    // Calculate year-over-year change
    const yoyChange = this.calculateYoYChange(yearlyTrends);
    
    // Detect seasonal patterns
    const seasonalPattern = this.detectSeasonalPattern(historicalData);
    
    // Calculate volatility
    const volatility = this.calculateVolatility(historicalData);
    const volatilityLevel = this.categorizeVolatility(volatility);
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(
      yoyChange,
      volatilityLevel,
      seasonalPattern,
      currentPrice
    );
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(historicalData.length, volatility);

    return {
      commodity,
      currentPrice,
      historicalTrends: yearlyTrends,
      yearOverYearChange: yoyChange,
      seasonalPattern,
      priceVolatility: volatilityLevel,
      recommendation,
      confidence,
    };
  }

  private async getHistoricalData(
    commodity: string,
    state?: string,
    yearsBack: number = 3
  ): Promise<MarketPrice[]> {
    // In production, this would query historical database
    // For now, generate synthetic historical data
    const historicalPrices: MarketPrice[] = [];
    const today = new Date();
    
    for (let year = 0; year < yearsBack; year++) {
      for (let month = 0; month < 12; month++) {
        const date = new Date(today.getFullYear() - year, today.getMonth() - month, 1);
        const basePrice = 1000 + Math.random() * 500;
        const seasonalFactor = 1 + 0.2 * Math.sin((month / 12) * 2 * Math.PI);
        
        historicalPrices.push({
          commodity,
          market: 'Historical Average',
          district: state || 'N/A',
          state: state || 'N/A',
          minPrice: basePrice * seasonalFactor * 0.9,
          maxPrice: basePrice * seasonalFactor * 1.1,
          modalPrice: basePrice * seasonalFactor,
          date: date.toISOString().split('T')[0],
          unit: 'quintal',
        });
      }
    }
    
    return historicalPrices.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  private calculateYearlyTrends(historicalData: MarketPrice[]): PriceTrend[] {
    const yearlyData: Record<string, MarketPrice[]> = {};
    
    historicalData.forEach(price => {
      const year = new Date(price.date).getFullYear().toString();
      if (!yearlyData[year]) {
        yearlyData[year] = [];
      }
      yearlyData[year].push(price);
    });

    return Object.entries(yearlyData).map(([year, prices]) => {
      const modalPrices = prices.map(p => p.modalPrice);
      const avgPrice = modalPrices.reduce((sum, p) => sum + p, 0) / modalPrices.length;
      const minPrice = Math.min(...modalPrices);
      const maxPrice = Math.max(...modalPrices);
      const volatility = this.calculateVolatility(prices);

      return {
        commodity: prices[0].commodity,
        period: year,
        avgPrice: Math.round(avgPrice),
        minPrice: Math.round(minPrice),
        maxPrice: Math.round(maxPrice),
        volatility: Math.round(volatility * 100) / 100,
      };
    });
  }

  private calculateYoYChange(trends: PriceTrend[]): number {
    if (trends.length < 2) return 0;
    
    const sortedTrends = trends.sort((a, b) => 
      parseInt(b.period) - parseInt(a.period)
    );
    
    const currentYear = sortedTrends[0].avgPrice;
    const previousYear = sortedTrends[1].avgPrice;
    
    return Math.round(((currentYear - previousYear) / previousYear) * 100 * 100) / 100;
  }

  private detectSeasonalPattern(historicalData: MarketPrice[]): string {
    const monthlyAvg: Record<number, number[]> = {};
    
    historicalData.forEach(price => {
      const month = new Date(price.date).getMonth();
      if (!monthlyAvg[month]) {
        monthlyAvg[month] = [];
      }
      monthlyAvg[month].push(price.modalPrice);
    });

    const monthlyPrices = Object.entries(monthlyAvg).map(([month, prices]) => ({
      month: parseInt(month),
      avgPrice: prices.reduce((sum, p) => sum + p, 0) / prices.length,
    }));

    const maxMonth = monthlyPrices.reduce((max, curr) => 
      curr.avgPrice > max.avgPrice ? curr : max
    );
    
    const minMonth = monthlyPrices.reduce((min, curr) => 
      curr.avgPrice < min.avgPrice ? curr : min
    );

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return `Prices typically peak in ${monthNames[maxMonth.month]} and are lowest in ${monthNames[minMonth.month]}`;
  }

  private calculateVolatility(prices: MarketPrice[]): number {
    if (prices.length < 2) return 0;
    
    const modalPrices = prices.map(p => p.modalPrice);
    const mean = modalPrices.reduce((sum, p) => sum + p, 0) / modalPrices.length;
    const variance = modalPrices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / modalPrices.length;
    const stdDev = Math.sqrt(variance);
    
    return (stdDev / mean) * 100; // Coefficient of variation as percentage
  }

  private categorizeVolatility(volatility: number): 'low' | 'medium' | 'high' {
    if (volatility < 10) return 'low';
    if (volatility < 20) return 'medium';
    return 'high';
  }

  private generateRecommendation(
    yoyChange: number,
    volatility: 'low' | 'medium' | 'high',
    seasonalPattern: string,
    currentPrice: number
  ): string {
    const recommendations: string[] = [];

    if (yoyChange > 10) {
      recommendations.push('Prices are trending upward, favorable for selling.');
    } else if (yoyChange < -10) {
      recommendations.push('Prices are declining, consider alternative crops.');
    } else {
      recommendations.push('Prices are stable.');
    }

    if (volatility === 'high') {
      recommendations.push('High price volatility detected - consider risk management strategies.');
    } else if (volatility === 'low') {
      recommendations.push('Low volatility indicates stable market conditions.');
    }

    recommendations.push(seasonalPattern);

    return recommendations.join(' ');
  }

  private calculateConfidence(dataPoints: number, volatility: number): number {
    // Confidence based on data availability and stability
    let confidence = 0;
    
    // More data points = higher confidence (max 50 points)
    confidence += Math.min(dataPoints / 36 * 50, 50); // 36 months = 3 years
    
    // Lower volatility = higher confidence (max 50 points)
    confidence += Math.max(50 - volatility * 2, 0);
    
    return Math.min(Math.round(confidence), 100);
  }
}
