/**
 * Government Scheme Matching System
 * Matches farmers with relevant government schemes and subsidies
 */

export interface FarmerProfile {
  farmerId: string;
  name: string;
  landArea: number;
  landOwnership: 'owned' | 'leased' | 'sharecropper';
  farmerCategory: 'small' | 'marginal' | 'medium' | 'large';
  socialCategory: 'general' | 'sc' | 'st' | 'obc';
  gender: 'male' | 'female' | 'other';
  age: number;
  annualIncome: number;
  hasKisanCreditCard: boolean;
  hasSoilHealthCard: boolean;
  crops: string[];
  region: string;
  state: string;
}

export interface GovernmentScheme {
  schemeId: string;
  name: string;
  category: 'subsidy' | 'insurance' | 'credit' | 'training' | 'infrastructure' | 'marketing';
  description: string;
  benefits: string[];
  eligibility: {
    landArea?: { min?: number; max?: number };
    farmerCategory?: string[];
    socialCategory?: string[];
    gender?: string[];
    ageRange?: { min?: number; max?: number };
    income?: { max?: number };
    crops?: string[];
    states?: string[];
  };
  subsidy: {
    type: 'percentage' | 'fixed' | 'variable';
    amount?: number;
    percentage?: number;
    maxAmount?: number;
  };
  applicationProcess: string[];
  documents: string[];
  authority: string;
  website: string;
  helpline: string;
  lastUpdated: Date;
}

export interface SchemeMatch {
  scheme: GovernmentScheme;
  matchScore: number; // 0-100
  eligibilityStatus: 'eligible' | 'partially_eligible' | 'not_eligible';
  missingRequirements: string[];
  estimatedBenefit: number; // in INR
  priority: 'high' | 'medium' | 'low';
  applicationDeadline?: Date;
}

export interface SchemeRecommendation {
  farmerId: string;
  matches: SchemeMatch[];
  totalPotentialBenefit: number;
  recommendedActions: string[];
  generatedAt: Date;
}

// Government schemes database
const GOVERNMENT_SCHEMES: GovernmentScheme[] = [
  {
    schemeId: 'pmfby',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    category: 'insurance',
    description: 'Comprehensive crop insurance scheme covering yield losses due to natural calamities',
    benefits: [
      'Premium subsidy of 50-90%',
      'Coverage for pre-sowing to post-harvest',
      'Quick claim settlement',
      'Coverage for localized calamities'
    ],
    eligibility: {
      farmerCategory: ['small', 'marginal', 'medium', 'large']
    },
    subsidy: {
      type: 'percentage',
      percentage: 50
    },
    applicationProcess: [
      'Visit nearest bank or CSC',
      'Fill application form',
      'Submit land records',
      'Pay premium amount',
      'Receive policy document'
    ],
    documents: ['Aadhaar card', 'Land records', 'Bank account details', 'Sowing certificate'],
    authority: 'Ministry of Agriculture',
    website: 'https://pmfby.gov.in',
    helpline: '1800-180-1551',
    lastUpdated: new Date('2024-01-01')
  },
  {
    schemeId: 'pm-kisan',
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    category: 'subsidy',
    description: 'Direct income support of ₹6000 per year to all farmer families',
    benefits: [
      '₹6000 per year in 3 installments',
      'Direct bank transfer',
      'No application fee',
      'Automatic renewal'
    ],
    eligibility: {
      farmerCategory: ['small', 'marginal', 'medium', 'large']
    },
    subsidy: {
      type: 'fixed',
      amount: 6000
    },
    applicationProcess: [
      'Visit PM-KISAN portal',
      'Register with Aadhaar',
      'Enter land details',
      'Submit bank account',
      'Verify through village officer'
    ],
    documents: ['Aadhaar card', 'Land ownership documents', 'Bank account details'],
    authority: 'Ministry of Agriculture',
    website: 'https://pmkisan.gov.in',
    helpline: '155261 / 1800115526',
    lastUpdated: new Date('2024-01-01')
  },
  {
    schemeId: 'kcc',
    name: 'Kisan Credit Card (KCC)',
    category: 'credit',
    description: 'Credit facility for farmers to meet agricultural expenses',
    benefits: [
      'Credit up to ₹3 lakh at 7% interest',
      'Interest subvention of 2%',
      'Additional 3% incentive on timely repayment',
      'Effective interest rate of 4%',
      'Flexible repayment'
    ],
    eligibility: {
      farmerCategory: ['small', 'marginal', 'medium', 'large']
    },
    subsidy: {
      type: 'percentage',
      percentage: 5
    },
    applicationProcess: [
      'Visit nearest bank branch',
      'Fill KCC application form',
      'Submit required documents',
      'Bank verification',
      'Receive KCC card'
    ],
    documents: ['Aadhaar card', 'Land records', 'Passport photo', 'Address proof'],
    authority: 'NABARD / Banks',
    website: 'https://www.nabard.org',
    helpline: '1800-180-6999',
    lastUpdated: new Date('2024-01-01')
  },
  {
    schemeId: 'pmksy',
    name: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)',
    category: 'infrastructure',
    description: 'Subsidy for micro-irrigation systems (drip and sprinkler)',
    benefits: [
      '55% subsidy for general farmers',
      '75% subsidy for SC/ST farmers',
      'Water saving of 40-60%',
      'Yield increase of 30-50%'
    ],
    eligibility: {
      farmerCategory: ['small', 'marginal', 'medium', 'large'],
      landArea: { min: 0.5 }
    },
    subsidy: {
      type: 'percentage',
      percentage: 55,
      maxAmount: 100000
    },
    applicationProcess: [
      'Apply through state agriculture department',
      'Submit land documents',
      'Get technical approval',
      'Install system through approved vendor',
      'Receive subsidy after verification'
    ],
    documents: ['Land records', 'Aadhaar card', 'Bank account', 'Quotation from vendor'],
    authority: 'Ministry of Jal Shakti',
    website: 'https://pmksy.gov.in',
    helpline: '1800-180-1551',
    lastUpdated: new Date('2024-01-01')
  },
  {
    schemeId: 'soil-health-card',
    name: 'Soil Health Card Scheme',
    category: 'subsidy',
    description: 'Free soil testing and health card for farmers',
    benefits: [
      'Free soil testing',
      'Customized fertilizer recommendations',
      'Reduce fertilizer cost by 10-15%',
      'Improve soil health'
    ],
    eligibility: {
      farmerCategory: ['small', 'marginal', 'medium', 'large']
    },
    subsidy: {
      type: 'fixed',
      amount: 0
    },
    applicationProcess: [
      'Contact local agriculture office',
      'Collect soil sample as per guidelines',
      'Submit sample at testing center',
      'Receive soil health card within 30 days'
    ],
    documents: ['Aadhaar card', 'Land records'],
    authority: 'Department of Agriculture',
    website: 'https://soilhealth.dac.gov.in',
    helpline: '1800-180-1551',
    lastUpdated: new Date('2024-01-01')
  },
  {
    schemeId: 'paramparagat-krishi',
    name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
    category: 'subsidy',
    description: 'Support for organic farming through cluster approach',
    benefits: [
      '₹50,000 per hectare for 3 years',
      'Organic certification support',
      'Premium prices for organic produce',
      'Training and capacity building'
    ],
    eligibility: {
      farmerCategory: ['small', 'marginal', 'medium'],
      landArea: { min: 0.5 }
    },
    subsidy: {
      type: 'fixed',
      amount: 50000
    },
    applicationProcess: [
      'Form cluster of 50 farmers',
      'Apply through state agriculture department',
      'Get PGS certification',
      'Follow organic practices',
      'Receive subsidy in installments'
    ],
    documents: ['Land records', 'Aadhaar card', 'Cluster formation certificate'],
    authority: 'Ministry of Agriculture',
    website: 'https://pgsindia-ncof.gov.in',
    helpline: '1800-180-1551',
    lastUpdated: new Date('2024-01-01')
  },
  {
    schemeId: 'mahila-kisan',
    name: 'Mahila Kisan Sashaktikaran Pariyojana (MKSP)',
    category: 'training',
    description: 'Empowerment program for women farmers',
    benefits: [
      'Free training on sustainable agriculture',
      'Capacity building programs',
      'Access to credit and inputs',
      'Market linkages'
    ],
    eligibility: {
      gender: ['female'],
      farmerCategory: ['small', 'marginal']
    },
    subsidy: {
      type: 'variable',
      amount: 0
    },
    applicationProcess: [
      'Contact local agriculture office',
      'Join women farmer groups',
      'Attend training programs',
      'Access scheme benefits'
    ],
    documents: ['Aadhaar card', 'Land records (if available)'],
    authority: 'Ministry of Rural Development',
    website: 'https://rural.nic.in',
    helpline: '1800-180-1551',
    lastUpdated: new Date('2024-01-01')
  },
  {
    schemeId: 'kisan-call-center',
    name: 'Kisan Call Centre (KCC)',
    category: 'training',
    description: 'Toll-free helpline for agricultural advice',
    benefits: [
      'Free agricultural advice',
      '24x7 availability',
      'Expert guidance',
      'Local language support'
    ],
    eligibility: {
      farmerCategory: ['small', 'marginal', 'medium', 'large']
    },
    subsidy: {
      type: 'fixed',
      amount: 0
    },
    applicationProcess: [
      'Dial 1800-180-1551',
      'Select language',
      'Speak to agricultural expert',
      'Get instant advice'
    ],
    documents: [],
    authority: 'Ministry of Agriculture',
    website: 'https://mkisan.gov.in',
    helpline: '1800-180-1551',
    lastUpdated: new Date('2024-01-01')
  }
];

export class GovernmentSchemeService {
  /**
   * Match farmer with eligible schemes
   */
  matchSchemes(profile: FarmerProfile): SchemeRecommendation {
    const matches: SchemeMatch[] = [];

    for (const scheme of GOVERNMENT_SCHEMES) {
      const match = this.evaluateScheme(scheme, profile);
      if (match.eligibilityStatus !== 'not_eligible') {
        matches.push(match);
      }
    }

    // Sort by match score and priority
    matches.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.matchScore - a.matchScore;
    });

    const totalPotentialBenefit = matches.reduce((sum, match) => sum + match.estimatedBenefit, 0);
    const recommendedActions = this.generateRecommendedActions(matches, profile);

    return {
      farmerId: profile.farmerId,
      matches,
      totalPotentialBenefit: Math.round(totalPotentialBenefit),
      recommendedActions,
      generatedAt: new Date()
    };
  }

  /**
   * Evaluate scheme eligibility and match score
   */
  private evaluateScheme(scheme: GovernmentScheme, profile: FarmerProfile): SchemeMatch {
    let matchScore = 100;
    const missingRequirements: string[] = [];
    let eligibilityStatus: 'eligible' | 'partially_eligible' | 'not_eligible' = 'eligible';

    // Check land area
    if (scheme.eligibility.landArea) {
      if (scheme.eligibility.landArea.min && profile.landArea < scheme.eligibility.landArea.min) {
        missingRequirements.push(`Minimum land area: ${scheme.eligibility.landArea.min} acres`);
        eligibilityStatus = 'not_eligible';
        matchScore -= 50;
      }
      if (scheme.eligibility.landArea.max && profile.landArea > scheme.eligibility.landArea.max) {
        missingRequirements.push(`Maximum land area: ${scheme.eligibility.landArea.max} acres`);
        eligibilityStatus = 'not_eligible';
        matchScore -= 50;
      }
    }

    // Check farmer category
    if (scheme.eligibility.farmerCategory) {
      if (!scheme.eligibility.farmerCategory.includes(profile.farmerCategory)) {
        missingRequirements.push(`Farmer category: ${scheme.eligibility.farmerCategory.join(', ')}`);
        eligibilityStatus = 'not_eligible';
        matchScore -= 40;
      }
    }

    // Check social category
    if (scheme.eligibility.socialCategory) {
      if (!scheme.eligibility.socialCategory.includes(profile.socialCategory)) {
        matchScore -= 10;
        eligibilityStatus = eligibilityStatus === 'eligible' ? 'partially_eligible' : eligibilityStatus;
      }
    }

    // Check gender
    if (scheme.eligibility.gender) {
      if (!scheme.eligibility.gender.includes(profile.gender)) {
        missingRequirements.push(`Gender: ${scheme.eligibility.gender.join(', ')}`);
        eligibilityStatus = 'not_eligible';
        matchScore -= 40;
      }
    }

    // Check age range
    if (scheme.eligibility.ageRange) {
      if (scheme.eligibility.ageRange.min && profile.age < scheme.eligibility.ageRange.min) {
        missingRequirements.push(`Minimum age: ${scheme.eligibility.ageRange.min}`);
        eligibilityStatus = 'not_eligible';
        matchScore -= 30;
      }
      if (scheme.eligibility.ageRange.max && profile.age > scheme.eligibility.ageRange.max) {
        missingRequirements.push(`Maximum age: ${scheme.eligibility.ageRange.max}`);
        eligibilityStatus = 'not_eligible';
        matchScore -= 30;
      }
    }

    // Check income
    if (scheme.eligibility.income?.max) {
      if (profile.annualIncome > scheme.eligibility.income.max) {
        missingRequirements.push(`Maximum income: ₹${scheme.eligibility.income.max}`);
        eligibilityStatus = 'not_eligible';
        matchScore -= 40;
      }
    }

    // Check crops
    if (scheme.eligibility.crops) {
      const hasCropMatch = profile.crops.some(crop => 
        scheme.eligibility.crops?.includes(crop.toLowerCase())
      );
      if (!hasCropMatch) {
        matchScore -= 15;
      }
    }

    // Check states
    if (scheme.eligibility.states) {
      if (!scheme.eligibility.states.includes(profile.state.toLowerCase())) {
        missingRequirements.push(`Available in states: ${scheme.eligibility.states.join(', ')}`);
        eligibilityStatus = 'not_eligible';
        matchScore -= 50;
      }
    }

    // Calculate estimated benefit
    const estimatedBenefit = this.calculateEstimatedBenefit(scheme, profile);

    // Determine priority
    const priority = this.determinePriority(scheme, profile, estimatedBenefit);

    return {
      scheme,
      matchScore: Math.max(0, matchScore),
      eligibilityStatus,
      missingRequirements,
      estimatedBenefit,
      priority
    };
  }

  /**
   * Calculate estimated benefit
   */
  private calculateEstimatedBenefit(scheme: GovernmentScheme, profile: FarmerProfile): number {
    switch (scheme.subsidy.type) {
      case 'fixed':
        return scheme.subsidy.amount || 0;
      
      case 'percentage':
        // Estimate based on typical investment
        const typicalInvestment = profile.landArea * 30000; // ₹30,000 per acre average
        let benefit = (typicalInvestment * (scheme.subsidy.percentage || 0)) / 100;
        if (scheme.subsidy.maxAmount) {
          benefit = Math.min(benefit, scheme.subsidy.maxAmount);
        }
        return benefit;
      
      case 'variable':
        return 0; // Cannot estimate variable benefits
      
      default:
        return 0;
    }
  }

  /**
   * Determine priority
   */
  private determinePriority(
    scheme: GovernmentScheme,
    profile: FarmerProfile,
    estimatedBenefit: number
  ): 'high' | 'medium' | 'low' {
    // High priority for insurance and credit schemes
    if (scheme.category === 'insurance' || scheme.category === 'credit') {
      return 'high';
    }

    // High priority for high-value subsidies
    if (estimatedBenefit > 50000) {
      return 'high';
    }

    // High priority for small/marginal farmers
    if ((profile.farmerCategory === 'small' || profile.farmerCategory === 'marginal') && 
        estimatedBenefit > 10000) {
      return 'high';
    }

    // Medium priority for infrastructure and training
    if (scheme.category === 'infrastructure' || scheme.category === 'training') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate recommended actions
   */
  private generateRecommendedActions(matches: SchemeMatch[], profile: FarmerProfile): string[] {
    const actions: string[] = [];

    // Priority actions
    const highPriorityMatches = matches.filter(m => m.priority === 'high' && m.eligibilityStatus === 'eligible');
    
    if (highPriorityMatches.length > 0) {
      actions.push(`Apply for ${highPriorityMatches[0].scheme.name} immediately - High priority scheme`);
    }

    // Missing documents
    if (!profile.hasKisanCreditCard) {
      actions.push('Apply for Kisan Credit Card to access low-interest credit');
    }

    if (!profile.hasSoilHealthCard) {
      actions.push('Get Soil Health Card for free soil testing and fertilizer recommendations');
    }

    // Category-specific actions
    if (profile.farmerCategory === 'small' || profile.farmerCategory === 'marginal') {
      actions.push('Explore PM-KISAN for direct income support of ₹6000/year');
    }

    if (profile.gender === 'female') {
      actions.push('Join Mahila Kisan Sashaktikaran Pariyojana for women farmer empowerment');
    }

    // General actions
    actions.push('Register on PM-KISAN portal if not already registered');
    actions.push('Keep all documents (Aadhaar, land records, bank details) ready for applications');

    return actions;
  }

  /**
   * Get scheme by ID
   */
  getSchemeById(schemeId: string): GovernmentScheme | undefined {
    return GOVERNMENT_SCHEMES.find(s => s.schemeId === schemeId);
  }

  /**
   * Get schemes by category
   */
  getSchemesByCategory(category: string): GovernmentScheme[] {
    return GOVERNMENT_SCHEMES.filter(s => s.category === category);
  }

  /**
   * Search schemes
   */
  searchSchemes(query: string): GovernmentScheme[] {
    const lowerQuery = query.toLowerCase();
    return GOVERNMENT_SCHEMES.filter(s => 
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.benefits.some(b => b.toLowerCase().includes(lowerQuery))
    );
  }
}
