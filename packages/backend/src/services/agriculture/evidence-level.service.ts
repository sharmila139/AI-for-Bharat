/**
 * Evidence Level Classification Service
 * Validates and classifies evidence levels for knowledge articles
 * 
 * Evidence Levels:
 * - Traditional: Time-tested traditional knowledge passed down through generations
 * - Moderate: Field-tested with documented success stories and practical validation
 * - Strong: Scientifically validated with research backing and peer-reviewed studies
 */

import { EvidenceLevel, ScientificReference } from './knowledge-base-types';

export interface EvidenceClassification {
  level: EvidenceLevel;
  confidence: number; // 0-100
  reasoning: string;
  recommendations: string[];
}

export interface EvidenceLevelInfo {
  level: EvidenceLevel;
  displayName: {
    en: string;
    hi: string;
  };
  description: {
    en: string;
    hi: string;
  };
  icon: string;
  color: string;
  criteria: {
    en: string[];
    hi: string[];
  };
  examples: {
    en: string[];
    hi: string[];
  };
}

export class EvidenceLevelService {
  /**
   * Get detailed information about all evidence levels
   */
  static getEvidenceLevelInfo(): Record<EvidenceLevel, EvidenceLevelInfo> {
    return {
      traditional: {
        level: 'traditional',
        displayName: {
          en: 'Traditional Knowledge',
          hi: 'पारंपरिक ज्ञान',
        },
        description: {
          en: 'Time-tested traditional knowledge passed down through generations. Based on centuries of practical experience and cultural wisdom.',
          hi: 'पीढ़ियों से चली आ रही समय-परीक्षित पारंपरिक ज्ञान। सदियों के व्यावहारिक अनुभव और सांस्कृतिक ज्ञान पर आधारित।',
        },
        icon: '🌾',
        color: '#8B4513',
        criteria: {
          en: [
            'Practiced for multiple generations (50+ years)',
            'Widely adopted in traditional farming communities',
            'Based on indigenous knowledge systems',
            'Documented in cultural or historical records',
            'Minimal or no scientific validation',
          ],
          hi: [
            'कई पीढ़ियों से प्रचलित (50+ वर्ष)',
            'पारंपरिक कृषि समुदायों में व्यापक रूप से अपनाया गया',
            'स्वदेशी ज्ञान प्रणालियों पर आधारित',
            'सांस्कृतिक या ऐतिहासिक अभिलेखों में प्रलेखित',
            'न्यूनतम या कोई वैज्ञानिक सत्यापन नहीं',
          ],
        },
        examples: {
          en: [
            'Panchagavya preparation using cow products',
            'Neem-based traditional pest repellents',
            'Moon phase-based planting calendars',
            'Traditional seed treatment methods',
          ],
          hi: [
            'गाय के उत्पादों का उपयोग करके पंचगव्य तैयारी',
            'नीम आधारित पारंपरिक कीट प्रतिरोधी',
            'चंद्रमा चरण आधारित रोपण कैलेंडर',
            'पारंपरिक बीज उपचार विधियां',
          ],
        },
      },
      moderate: {
        level: 'moderate',
        displayName: {
          en: 'Field-Tested',
          hi: 'क्षेत्र-परीक्षित',
        },
        description: {
          en: 'Field-tested with documented success stories and practical validation. Proven effective through farmer experiences and extension programs.',
          hi: 'प्रलेखित सफलता की कहानियों और व्यावहारिक सत्यापन के साथ क्षेत्र-परीक्षित। किसान अनुभवों और विस्तार कार्यक्रमों के माध्यम से प्रभावी साबित हुआ।',
        },
        icon: '✓',
        color: '#FF8C00',
        criteria: {
          en: [
            'Tested by farmers or extension officers',
            'Multiple documented success stories',
            'Recommended by agricultural universities',
            'Some scientific studies or trials conducted',
            'Positive results in field demonstrations',
          ],
          hi: [
            'किसानों या विस्तार अधिकारियों द्वारा परीक्षित',
            'कई प्रलेखित सफलता की कहानियां',
            'कृषि विश्वविद्यालयों द्वारा अनुशंसित',
            'कुछ वैज्ञानिक अध्ययन या परीक्षण किए गए',
            'क्षेत्र प्रदर्शनों में सकारात्मक परिणाम',
          ],
        },
        examples: {
          en: [
            'Vermicomposting techniques',
            'Integrated Pest Management (IPM) practices',
            'Drip irrigation systems',
            'Crop rotation patterns validated by farmers',
          ],
          hi: [
            'वर्मीकम्पोस्टिंग तकनीक',
            'एकीकृत कीट प्रबंधन (आईपीएम) प्रथाएं',
            'ड्रिप सिंचाई प्रणाली',
            'किसानों द्वारा मान्य फसल चक्र पैटर्न',
          ],
        },
      },
      strong: {
        level: 'strong',
        displayName: {
          en: 'Scientifically Validated',
          hi: 'वैज्ञानिक रूप से मान्य',
        },
        description: {
          en: 'Scientifically validated with research backing and peer-reviewed studies. Supported by rigorous scientific evidence and published research.',
          hi: 'अनुसंधान समर्थन और सहकर्मी-समीक्षित अध्ययनों के साथ वैज्ञानिक रूप से मान्य। कठोर वैज्ञानिक साक्ष्य और प्रकाशित शोध द्वारा समर्थित।',
        },
        icon: '🔬',
        color: '#228B22',
        criteria: {
          en: [
            'Published in peer-reviewed scientific journals',
            'Replicated studies with consistent results',
            'Backed by research institutions (ICAR, universities)',
            'Statistical validation of effectiveness',
            'Mechanism of action scientifically explained',
          ],
          hi: [
            'सहकर्मी-समीक्षित वैज्ञानिक पत्रिकाओं में प्रकाशित',
            'सुसंगत परिणामों के साथ दोहराए गए अध्ययन',
            'अनुसंधान संस्थानों (आईसीएआर, विश्वविद्यालयों) द्वारा समर्थित',
            'प्रभावशीलता का सांख्यिकीय सत्यापन',
            'क्रिया का तंत्र वैज्ञानिक रूप से समझाया गया',
          ],
        },
        examples: {
          en: [
            'Bt (Bacillus thuringiensis) for pest control',
            'Rhizobium biofertilizer application',
            'Precision agriculture techniques',
            'Hybrid seed varieties with documented yield improvements',
          ],
          hi: [
            'कीट नियंत्रण के लिए बीटी (बैसिलस थुरिंजिएन्सिस)',
            'राइजोबियम जैव उर्वरक अनुप्रयोग',
            'सटीक कृषि तकनीक',
            'प्रलेखित उपज सुधार के साथ संकर बीज किस्में',
          ],
        },
      },
    };
  }

  /**
   * Validate if an evidence level is appropriate for an article
   */
  static validateEvidenceLevel(
    evidenceLevel: EvidenceLevel,
    scientificReferences: ScientificReference[],
    verifiedBy?: string
  ): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let isValid = true;

    switch (evidenceLevel) {
      case 'strong':
        // Strong evidence requires scientific references
        if (!scientificReferences || scientificReferences.length === 0) {
          warnings.push(
            'Strong evidence level requires at least one scientific reference from peer-reviewed sources.'
          );
          suggestions.push(
            'Add scientific references from journals, research papers, or institutional studies.'
          );
          isValid = false;
        } else {
          // Check if references have proper metadata
          const incompleteRefs = scientificReferences.filter(
            ref => !ref.title || !ref.authors || !ref.year
          );
          if (incompleteRefs.length > 0) {
            warnings.push(
              `${incompleteRefs.length} scientific reference(s) are missing required fields (title, authors, year).`
            );
            suggestions.push('Complete all scientific reference metadata for credibility.');
          }

          // Check for recent references (within last 10 years)
          const currentYear = new Date().getFullYear();
          const recentRefs = scientificReferences.filter(
            ref => ref.year && currentYear - ref.year <= 10
          );
          if (recentRefs.length === 0 && scientificReferences.length > 0) {
            warnings.push('No recent scientific references (within last 10 years) found.');
            suggestions.push(
              'Consider adding recent research to ensure information is up-to-date.'
            );
          }
        }

        // Strong evidence should ideally be verified
        if (!verifiedBy) {
          suggestions.push(
            'Consider getting this article verified by an agricultural extension officer or researcher.'
          );
        }
        break;

      case 'moderate':
        // Moderate evidence should have some references or verification
        if (
          (!scientificReferences || scientificReferences.length === 0) &&
          !verifiedBy
        ) {
          warnings.push(
            'Moderate evidence level should have either scientific references or verification by an expert.'
          );
          suggestions.push(
            'Add field trial results, success stories, or get verification from extension officers.'
          );
        }

        if (scientificReferences && scientificReferences.length >= 3) {
          suggestions.push(
            'This article has multiple scientific references. Consider upgrading to "Strong" evidence level.'
          );
        }
        break;

      case 'traditional':
        // Traditional knowledge doesn't require scientific references
        if (scientificReferences && scientificReferences.length > 0) {
          suggestions.push(
            'This article has scientific references. Consider upgrading to "Moderate" or "Strong" evidence level.'
          );
        }

        suggestions.push(
          'Traditional knowledge articles benefit from documentation of historical usage and cultural context.'
        );
        break;
    }

    return {
      isValid,
      warnings,
      suggestions,
    };
  }

  /**
   * Automatically classify evidence level based on article content
   */
  static classifyEvidenceLevel(
    scientificReferences: ScientificReference[],
    verifiedBy?: string,
    successStoryCount?: number
  ): EvidenceClassification {
    let level: EvidenceLevel;
    let confidence: number;
    let reasoning: string;
    const recommendations: string[] = [];

    const refCount = scientificReferences?.length || 0;
    const hasVerification = !!verifiedBy;
    const hasSuccessStories = (successStoryCount || 0) > 0;

    // Classification logic
    if (refCount >= 2) {
      // Check quality of references
      const completeRefs = scientificReferences.filter(
        ref => ref.title && ref.authors && ref.year && (ref.journal || ref.doi || ref.url)
      );
      const currentYear = new Date().getFullYear();
      const recentRefs = scientificReferences.filter(
        ref => ref.year && currentYear - ref.year <= 10
      );

      if (completeRefs.length >= 2 && recentRefs.length >= 1) {
        level = 'strong';
        confidence = Math.min(70 + refCount * 5 + (hasVerification ? 10 : 0), 95);
        reasoning = `Article has ${refCount} scientific reference(s) with proper metadata and recent research.`;
        
        if (!hasVerification) {
          recommendations.push('Get verification from an expert to increase confidence to 95%+');
        }
      } else {
        level = 'moderate';
        confidence = 60 + refCount * 5 + (hasVerification ? 10 : 0) + (hasSuccessStories ? 5 : 0);
        reasoning = `Article has ${refCount} scientific reference(s) but may lack complete metadata or recent research.`;
        recommendations.push('Add more complete references with journal names and DOIs');
        recommendations.push('Include recent research (within last 10 years)');
      }
    } else if (refCount === 1 || hasVerification || hasSuccessStories) {
      level = 'moderate';
      confidence = 50 + (refCount * 10) + (hasVerification ? 15 : 0) + (hasSuccessStories ? 10 : 0);
      reasoning = 'Article has ';
      const factors: string[] = [];
      if (refCount > 0) factors.push(`${refCount} scientific reference`);
      if (hasVerification) factors.push('expert verification');
      if (hasSuccessStories) factors.push('documented success stories');
      reasoning += factors.join(', ') + '.';
      
      recommendations.push('Add more scientific references to upgrade to "Strong" evidence level');
      if (!hasVerification) {
        recommendations.push('Get verification from agricultural extension officer');
      }
    } else {
      level = 'traditional';
      confidence = 40;
      reasoning = 'Article lacks scientific references and expert verification. Classified as traditional knowledge.';
      recommendations.push('Add scientific references or field trial results to upgrade evidence level');
      recommendations.push('Document historical usage and cultural context');
      recommendations.push('Collect success stories from farmers who have used this technique');
    }

    return {
      level,
      confidence,
      reasoning,
      recommendations,
    };
  }

  /**
   * Format scientific references for display
   */
  static formatScientificReference(ref: ScientificReference): string {
    const parts: string[] = [];

    // Authors
    if (ref.authors) {
      parts.push(ref.authors);
    }

    // Year
    if (ref.year) {
      parts.push(`(${ref.year})`);
    }

    // Title
    if (ref.title) {
      parts.push(`"${ref.title}"`);
    }

    // Journal
    if (ref.journal) {
      parts.push(`${ref.journal}`);
    }

    // DOI or URL
    if (ref.doi) {
      parts.push(`DOI: ${ref.doi}`);
    } else if (ref.url) {
      parts.push(`Available at: ${ref.url}`);
    }

    return parts.join('. ');
  }

  /**
   * Get evidence level badge for UI display
   */
  static getEvidenceLevelBadge(level: EvidenceLevel, language: 'en' | 'hi' = 'en'): {
    label: string;
    icon: string;
    color: string;
    description: string;
  } {
    const info = this.getEvidenceLevelInfo()[level];
    return {
      label: info.displayName[language],
      icon: info.icon,
      color: info.color,
      description: info.description[language],
    };
  }

  /**
   * Get filtering options for evidence levels
   */
  static getEvidenceLevelFilters(language: 'en' | 'hi' = 'en'): Array<{
    value: EvidenceLevel;
    label: string;
    icon: string;
    description: string;
  }> {
    const info = this.getEvidenceLevelInfo();
    return Object.values(info).map(level => ({
      value: level.level,
      label: level.displayName[language],
      icon: level.icon,
      description: level.description[language],
    }));
  }
}
