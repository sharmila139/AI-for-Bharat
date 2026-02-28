/**
 * Knowledge Base Seed Data Generator
 * Generates 500+ articles on sustainable farming practices
 * 
 * Categories:
 * - Organic Farming (150 articles)
 * - Pest Management (150 articles)
 * - Soil Conservation (100 articles)
 * - Water Management (100 articles)
 * - Crop Rotation (50 articles)
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { 
  ArticleCategory, 
  EvidenceLevel, 
  MultiLanguageText,
  ScientificReference,
  ImplementationGuide,
  ArticleBenefits
} from '../../services/agriculture/knowledge-base-types';

// ============================================================================
// Configuration
// ============================================================================

const TOTAL_ARTICLES_TARGET = 550;

// ============================================================================
// Multi-language Translation Helper
// ============================================================================

function createMultiLangText(en: string, hi?: string): MultiLanguageText {
  return {
    en,
    hi: hi || en // Fallback to English if Hindi not provided
  };
}

// ============================================================================
// Article Templates by Category
// ============================================================================

interface ArticleTemplate {
  titleEn: string;
  titleHi: string;
  category: ArticleCategory;
  subcategory: string;
  tags: string[];
  evidenceLevel: EvidenceLevel;
  contentEn: string;
  contentHi: string;
  applicableCrops?: string[];
  applicableRegions?: string[];
  applicableSeasons?: string[];
}

// ============================================================================
// Article Data Structures
// ============================================================================

const CROPS = ['rice', 'wheat', 'maize', 'cotton', 'sugarcane', 'pulses', 'vegetables', 'fruits', 'millets', 'oilseeds'];
const REGIONS = ['punjab', 'haryana', 'uttar-pradesh', 'maharashtra', 'karnataka', 'tamil-nadu', 'andhra-pradesh', 'west-bengal', 'all-india'];
const SEASONS = ['kharif', 'rabi', 'zaid', 'year-round'];

// ============================================================================
// ORGANIC FARMING TEMPLATES (150 articles)
// ============================================================================

const organicFarmingTopics = {
  composting: [
    { name: 'Vermicomposting', hindi: 'वर्मीकम्पोस्टिंग', evidence: 'strong' as EvidenceLevel },
    { name: 'Pit Composting', hindi: 'गड्ढा खाद', evidence: 'strong' as EvidenceLevel },
    { name: 'Heap Composting', hindi: 'ढेर खाद', evidence: 'strong' as EvidenceLevel },
    { name: 'NADEP Composting', hindi: 'नाडेप खाद', evidence: 'moderate' as EvidenceLevel },
    { name: 'Biogas Slurry Composting', hindi: 'बायोगैस स्लरी खाद', evidence: 'strong' as EvidenceLevel },
  ],
  greenManure: [
    { name: 'Dhaincha Green Manure', hindi: 'ढैंचा हरी खाद', evidence: 'strong' as EvidenceLevel },
    { name: 'Sunhemp Green Manure', hindi: 'सनई हरी खाद', evidence: 'strong' as EvidenceLevel },
    { name: 'Cowpea Green Manure', hindi: 'लोबिया हरी खाद', evidence: 'moderate' as EvidenceLevel },
    { name: 'Sesbania Green Manure', hindi: 'सेसबानिया हरी खाद', evidence: 'strong' as EvidenceLevel },
  ],
  biofertilizers: [
    { name: 'Rhizobium Biofertilizer', hindi: 'राइजोबियम जैव उर्वरक', evidence: 'strong' as EvidenceLevel },
    { name: 'Azotobacter Application', hindi: 'एजोटोबैक्टर उपयोग', evidence: 'strong' as EvidenceLevel },
    { name: 'PSB (Phosphate Solubilizing Bacteria)', hindi: 'पीएसबी जैव उर्वरक', evidence: 'strong' as EvidenceLevel },
    { name: 'Azospirillum for Cereals', hindi: 'अनाज के लिए एजोस्पिरिलम', evidence: 'moderate' as EvidenceLevel },
  ],
  organicInputs: [
    { name: 'Panchagavya Preparation', hindi: 'पंचगव्य तैयारी', evidence: 'traditional' as EvidenceLevel },
    { name: 'Jeevamrut Application', hindi: 'जीवामृत उपयोग', evidence: 'traditional' as EvidenceLevel },
    { name: 'Beejamrut Seed Treatment', hindi: 'बीजामृत बीज उपचार', evidence: 'traditional' as EvidenceLevel },
    { name: 'Neemastra Pest Repellent', hindi: 'नीमास्त्र कीट प्रतिरोधी', evidence: 'moderate' as EvidenceLevel },
  ]
};


// ============================================================================
// PEST MANAGEMENT TEMPLATES (150 articles)
// ============================================================================

const pestManagementTopics = {
  naturalPesticides: [
    { name: 'Neem Oil Spray', hindi: 'नीम तेल स्प्रे', evidence: 'strong' as EvidenceLevel },
    { name: 'Garlic-Chili Spray', hindi: 'लहसुन-मिर्च स्प्रे', evidence: 'moderate' as EvidenceLevel },
    { name: 'Tobacco Decoction', hindi: 'तंबाकू काढ़ा', evidence: 'traditional' as EvidenceLevel },
    { name: 'Cow Urine Pesticide', hindi: 'गोमूत्र कीटनाशक', evidence: 'traditional' as EvidenceLevel },
  ],
  biologicalControl: [
    { name: 'Trichogramma Parasitoid', hindi: 'ट्राइकोग्रामा परजीवी', evidence: 'strong' as EvidenceLevel },
    { name: 'Ladybird Beetle Release', hindi: 'लेडीबर्ड बीटल छोड़ना', evidence: 'strong' as EvidenceLevel },
    { name: 'Bacillus thuringiensis (Bt)', hindi: 'बीटी जैव कीटनाशक', evidence: 'strong' as EvidenceLevel },
    { name: 'Chrysoperla Predator', hindi: 'क्राइसोपर्ला शिकारी', evidence: 'moderate' as EvidenceLevel },
  ],
  ipm: [
    { name: 'Pheromone Traps', hindi: 'फेरोमोन ट्रैप', evidence: 'strong' as EvidenceLevel },
    { name: 'Light Traps for Moths', hindi: 'पतंगों के लिए प्रकाश जाल', evidence: 'strong' as EvidenceLevel },
    { name: 'Yellow Sticky Traps', hindi: 'पीले चिपचिपे जाल', evidence: 'strong' as EvidenceLevel },
    { name: 'Border Cropping', hindi: 'सीमा फसल', evidence: 'moderate' as EvidenceLevel },
  ],
  diseaseManagement: [
    { name: 'Trichoderma for Soil Diseases', hindi: 'मिट्टी रोगों के लिए ट्राइकोडर्मा', evidence: 'strong' as EvidenceLevel },
    { name: 'Pseudomonas Biocontrol', hindi: 'स्यूडोमोनास जैव नियंत्रण', evidence: 'moderate' as EvidenceLevel },
    { name: 'Bordeaux Mixture', hindi: 'बोर्डो मिश्रण', evidence: 'strong' as EvidenceLevel },
  ]
};

// ============================================================================
// SOIL CONSERVATION TEMPLATES (100 articles)
// ============================================================================

const soilConservationTopics = {
  mulching: [
    { name: 'Organic Mulching', hindi: 'जैविक मल्चिंग', evidence: 'strong' as EvidenceLevel },
    { name: 'Plastic Mulch', hindi: 'प्लास्टिक मल्च', evidence: 'strong' as EvidenceLevel },
    { name: 'Living Mulch', hindi: 'जीवित मल्च', evidence: 'moderate' as EvidenceLevel },
    { name: 'Stone Mulching', hindi: 'पत्थर मल्चिंग', evidence: 'traditional' as EvidenceLevel },
  ],
  terracing: [
    { name: 'Bench Terracing', hindi: 'बेंच टेरेसिंग', evidence: 'strong' as EvidenceLevel },
    { name: 'Contour Bunding', hindi: 'समोच्च बांध', evidence: 'strong' as EvidenceLevel },
    { name: 'Graded Bunding', hindi: 'ग्रेडेड बांध', evidence: 'strong' as EvidenceLevel },
  ],
  coverCrops: [
    { name: 'Legume Cover Crops', hindi: 'दलहन आवरण फसलें', evidence: 'strong' as EvidenceLevel },
    { name: 'Grass Cover Crops', hindi: 'घास आवरण फसलें', evidence: 'moderate' as EvidenceLevel },
    { name: 'Mixed Cover Cropping', hindi: 'मिश्रित आवरण फसल', evidence: 'moderate' as EvidenceLevel },
  ],
  erosionControl: [
    { name: 'Vetiver Grass Barriers', hindi: 'खस घास बाधाएं', evidence: 'strong' as EvidenceLevel },
    { name: 'Check Dams', hindi: 'चेक डैम', evidence: 'strong' as EvidenceLevel },
    { name: 'Gully Plugging', hindi: 'नाली बंद करना', evidence: 'moderate' as EvidenceLevel },
  ]
};

// ============================================================================
// WATER MANAGEMENT TEMPLATES (100 articles)
// ============================================================================

const waterManagementTopics = {
  irrigation: [
    { name: 'Drip Irrigation System', hindi: 'ड्रिप सिंचाई प्रणाली', evidence: 'strong' as EvidenceLevel },
    { name: 'Sprinkler Irrigation', hindi: 'स्प्रिंकलर सिंचाई', evidence: 'strong' as EvidenceLevel },
    { name: 'Micro-Sprinkler System', hindi: 'माइक्रो-स्प्रिंकलर प्रणाली', evidence: 'strong' as EvidenceLevel },
    { name: 'Furrow Irrigation', hindi: 'कुंड सिंचाई', evidence: 'moderate' as EvidenceLevel },
  ],
  rainwaterHarvesting: [
    { name: 'Farm Pond Construction', hindi: 'फार्म तालाब निर्माण', evidence: 'strong' as EvidenceLevel },
    { name: 'Percolation Tank', hindi: 'रिसाव टैंक', evidence: 'strong' as EvidenceLevel },
    { name: 'Roof Water Harvesting', hindi: 'छत जल संचयन', evidence: 'strong' as EvidenceLevel },
    { name: 'Contour Trenching', hindi: 'समोच्च खाई', evidence: 'moderate' as EvidenceLevel },
  ],
  watershedManagement: [
    { name: 'Watershed Planning', hindi: 'जलग्रहण योजना', evidence: 'strong' as EvidenceLevel },
    { name: 'Ridge to Valley Treatment', hindi: 'रिज से घाटी उपचार', evidence: 'strong' as EvidenceLevel },
    { name: 'Groundwater Recharge', hindi: 'भूजल पुनर्भरण', evidence: 'strong' as EvidenceLevel },
  ],
  waterConservation: [
    { name: 'Mulching for Moisture', hindi: 'नमी के लिए मल्चिंग', evidence: 'strong' as EvidenceLevel },
    { name: 'Alternate Wetting and Drying', hindi: 'वैकल्पिक गीला और सूखा', evidence: 'strong' as EvidenceLevel },
    { name: 'Deficit Irrigation', hindi: 'घाटा सिंचाई', evidence: 'moderate' as EvidenceLevel },
  ]
};

// ============================================================================
// CROP ROTATION TEMPLATES (50 articles)
// ============================================================================

const cropRotationTopics = {
  cerealBased: [
    { name: 'Rice-Wheat Rotation', hindi: 'धान-गेहूं चक्र', evidence: 'strong' as EvidenceLevel },
    { name: 'Maize-Wheat Rotation', hindi: 'मक्का-गेहूं चक्र', evidence: 'strong' as EvidenceLevel },
    { name: 'Rice-Pulses Rotation', hindi: 'धान-दलहन चक्र', evidence: 'strong' as EvidenceLevel },
  ],
  legumeBased: [
    { name: 'Legume-Cereal Rotation', hindi: 'दलहन-अनाज चक्र', evidence: 'strong' as EvidenceLevel },
    { name: 'Soybean-Wheat System', hindi: 'सोयाबीन-गेहूं प्रणाली', evidence: 'strong' as EvidenceLevel },
  ],
  vegetableBased: [
    { name: 'Vegetable Crop Rotation', hindi: 'सब्जी फसल चक्र', evidence: 'moderate' as EvidenceLevel },
    { name: 'Tomato-Cabbage Rotation', hindi: 'टमाटर-पत्तागोभी चक्र', evidence: 'moderate' as EvidenceLevel },
  ]
};


// ============================================================================
// Article Generation Functions
// ============================================================================

function generateArticleContent(topic: string, category: string, subcategory: string): { en: string; hi: string } {
  const templates = {
    organic_farming: {
      en: `${topic} is an essential organic farming practice that helps improve soil health and crop productivity. This sustainable method reduces dependency on chemical inputs while maintaining environmental balance. Implementation requires proper planning, suitable materials, and regular monitoring. Benefits include improved soil structure, enhanced microbial activity, and long-term sustainability. Farmers across India have successfully adopted this practice with positive results in yield and soil quality.`,
      hi: `${topic} एक आवश्यक जैविक खेती प्रथा है जो मिट्टी के स्वास्थ्य और फसल उत्पादकता में सुधार करती है। यह टिकाऊ विधि पर्यावरणीय संतुलन बनाए रखते हुए रासायनिक इनपुट पर निर्भरता कम करती है।`
    },
    pest_management: {
      en: `${topic} is an effective integrated pest management strategy that controls pests while minimizing environmental impact. This approach combines biological, cultural, and mechanical methods for sustainable pest control. Regular monitoring and timely application ensure optimal results. The method is safe for beneficial insects and maintains ecological balance. Farmers report significant reduction in pest damage and improved crop quality.`,
      hi: `${topic} एक प्रभावी एकीकृत कीट प्रबंधन रणनीति है जो पर्यावरणीय प्रभाव को कम करते हुए कीटों को नियंत्रित करती है। यह दृष्टिकोण टिकाऊ कीट नियंत्रण के लिए जैविक, सांस्कृतिक और यांत्रिक विधियों को जोड़ता है।`
    },
    soil_conservation: {
      en: `${topic} is a proven soil conservation technique that prevents erosion and maintains soil fertility. This practice protects topsoil, improves water retention, and enhances soil structure. Implementation is suitable for various terrains and climatic conditions. Long-term benefits include reduced runoff, improved infiltration, and sustained productivity. The method has been successfully adopted across different agro-climatic zones.`,
      hi: `${topic} एक सिद्ध मृदा संरक्षण तकनीक है जो कटाव को रोकती है और मिट्टी की उर्वरता बनाए रखती है। यह प्रथा ऊपरी मिट्टी की रक्षा करती है, जल प्रतिधारण में सुधार करती है।`
    },
    water_management: {
      en: `${topic} is an efficient water management practice that optimizes water use and improves irrigation efficiency. This system reduces water wastage, lowers energy costs, and ensures uniform water distribution. Suitable for various crops and soil types, it enhances water productivity. Farmers experience significant water savings and improved crop yields. The technology is adaptable to different farm sizes and conditions.`,
      hi: `${topic} एक कुशल जल प्रबंधन प्रथा है जो पानी के उपयोग को अनुकूलित करती है और सिंचाई दक्षता में सुधार करती है। यह प्रणाली पानी की बर्बादी को कम करती है।`
    },
    crop_rotation: {
      en: `${topic} is a strategic crop rotation system that improves soil health and breaks pest cycles. This rotation pattern optimizes nutrient use, reduces disease pressure, and enhances overall farm productivity. The system is designed for specific agro-climatic conditions and soil types. Benefits include improved soil fertility, reduced input costs, and diversified income. Successful implementation requires proper planning and crop selection.`,
      hi: `${topic} एक रणनीतिक फसल चक्र प्रणाली है जो मिट्टी के स्वास्थ्य में सुधार करती है और कीट चक्र को तोड़ती है। यह चक्र पैटर्न पोषक तत्व उपयोग को अनुकूलित करता है।`
    }
  };

  return templates[category as keyof typeof templates] || templates.organic_farming;
}

function generateImplementationGuide(topic: string, category: string): ImplementationGuide {
  return {
    steps: [
      {
        step: 1,
        description: createMultiLangText(
          `Prepare the site and gather necessary materials for ${topic}`,
          `${topic} के लिए स्थल तैयार करें और आवश्यक सामग्री एकत्र करें`
        ),
        duration: '1-2 days'
      },
      {
        step: 2,
        description: createMultiLangText(
          'Set up the system according to specifications',
          'विनिर्देशों के अनुसार प्रणाली स्थापित करें'
        ),
        duration: '2-3 days'
      },
      {
        step: 3,
        description: createMultiLangText(
          'Monitor and maintain regularly for optimal results',
          'इष्टतम परिणामों के लिए नियमित रूप से निगरानी और रखरखाव करें'
        ),
        duration: 'Ongoing'
      }
    ],
    materials: [
      {
        name: createMultiLangText('Basic materials', 'बुनियादी सामग्री'),
        quantity: 'As required',
        cost: 500
      }
    ],
    tools: [
      {
        name: createMultiLangText('Standard farm tools', 'मानक कृषि उपकरण'),
        optional: false
      }
    ],
    timeline: '1-2 weeks',
    difficulty_level: 'medium'
  };
}

function generateBenefits(category: string): ArticleBenefits {
  return {
    environmental: {
      description: createMultiLangText(
        'Reduces environmental impact and promotes biodiversity',
        'पर्यावरणीय प्रभाव को कम करता है और जैव विविधता को बढ़ावा देता है'
      ),
      impact: 'high',
      metrics: {
        carbon_reduction: '20-30%',
        water_saved: '30-40%',
        soil_improvement: '25-35%'
      }
    },
    economic: {
      description: createMultiLangText(
        'Reduces input costs and increases profitability',
        'इनपुट लागत कम करता है और लाभप्रदता बढ़ाता है'
      ),
      roi: '150-200%',
      payback_period: '1-2 years',
      cost_reduction: '25-40%'
    },
    social: {
      description: createMultiLangText(
        'Improves farmer livelihoods and community well-being',
        'किसान आजीविका और समुदाय कल्याण में सुधार करता है'
      )
    }
  };
}

function generateScientificReferences(topic: string): ScientificReference[] {
  return [
    {
      title: `Study on ${topic} effectiveness`,
      authors: 'Indian Council of Agricultural Research',
      year: 2022,
      journal: 'Journal of Sustainable Agriculture',
      url: 'https://example.com/research'
    }
  ];
}


// ============================================================================
// Main Seed Function
// ============================================================================

async function generateArticles(pool: Pool): Promise<void> {
  console.log('Starting knowledge base seed...');
  
  const articles: any[] = [];
  let articleCount = 0;

  // Helper function to create article variations
  function createArticleVariations(
    baseTopic: { name: string; hindi: string; evidence: EvidenceLevel },
    category: ArticleCategory,
    subcategory: string,
    count: number
  ) {
    const variations = [
      { suffix: 'Complete Guide', suffixHi: 'संपूर्ण गाइड' },
      { suffix: 'Best Practices', suffixHi: 'सर्वोत्तम प्रथाएं' },
      { suffix: 'Step-by-Step Method', suffixHi: 'चरण-दर-चरण विधि' },
      { suffix: 'for Small Farms', suffixHi: 'छोटे खेतों के लिए' },
      { suffix: 'for Large Farms', suffixHi: 'बड़े खेतों के लिए' },
      { suffix: 'in Different Seasons', suffixHi: 'विभिन्न मौसमों में' },
      { suffix: 'Cost-Effective Method', suffixHi: 'लागत प्रभावी विधि' },
      { suffix: 'Advanced Techniques', suffixHi: 'उन्नत तकनीकें' },
      { suffix: 'for Beginners', suffixHi: 'शुरुआती के लिए' },
      { suffix: 'Success Stories', suffixHi: 'सफलता की कहानियां' }
    ];

    for (let i = 0; i < count && i < variations.length; i++) {
      const variation = variations[i];
      const content = generateArticleContent(baseTopic.name, category, subcategory);
      
      articles.push({
        article_id: uuidv4(),
        title: JSON.stringify({
          en: `${baseTopic.name}: ${variation.suffix}`,
          hi: `${baseTopic.hindi}: ${variation.suffixHi}`
        }),
        content: JSON.stringify({
          en: content.en,
          hi: content.hi
        }),
        summary: JSON.stringify({
          en: `Learn about ${baseTopic.name.toLowerCase()} techniques and implementation`,
          hi: `${baseTopic.hindi} तकनीकों और कार्यान्वयन के बारे में जानें`
        }),
        category,
        subcategory,
        tags: `{${subcategory},sustainable,organic,${baseTopic.name.toLowerCase().replace(/\s+/g, '-')}}`,
        media: JSON.stringify({ images: [], videos: [], audio: [] }),
        evidence_level: baseTopic.evidence,
        scientific_references: JSON.stringify(generateScientificReferences(baseTopic.name)),
        implementation_guide: JSON.stringify(generateImplementationGuide(baseTopic.name, category)),
        benefits: JSON.stringify(generateBenefits(category)),
        view_count: Math.floor(Math.random() * 1000),
        rating_sum: Math.floor(Math.random() * 500),
        rating_count: Math.floor(Math.random() * 100),
        success_story_count: Math.floor(Math.random() * 20),
        applicable_crops: `{${CROPS.slice(0, Math.floor(Math.random() * 5) + 2).join(',')}}`,
        applicable_regions: `{${REGIONS.slice(0, Math.floor(Math.random() * 3) + 1).join(',')}}`,
        applicable_seasons: `{${SEASONS.slice(0, Math.floor(Math.random() * 2) + 1).join(',')}}`,
        available_languages: '{en,hi}',
        primary_language: 'en',
        status: 'published',
        published_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      articleCount++;
    }
  }

  // Generate Organic Farming articles (150 total)
  console.log('Generating organic farming articles...');
  Object.entries(organicFarmingTopics).forEach(([subcategory, topics]) => {
    const articlesPerTopic = Math.ceil(150 / Object.keys(organicFarmingTopics).length / topics.length);
    topics.forEach(topic => {
      createArticleVariations(topic, 'organic_farming', subcategory, articlesPerTopic);
    });
  });

  // Generate Pest Management articles (150 total)
  console.log('Generating pest management articles...');
  Object.entries(pestManagementTopics).forEach(([subcategory, topics]) => {
    const articlesPerTopic = Math.ceil(150 / Object.keys(pestManagementTopics).length / topics.length);
    topics.forEach(topic => {
      createArticleVariations(topic, 'pest_management', subcategory, articlesPerTopic);
    });
  });

  // Generate Soil Conservation articles (100 total)
  console.log('Generating soil conservation articles...');
  Object.entries(soilConservationTopics).forEach(([subcategory, topics]) => {
    const articlesPerTopic = Math.ceil(100 / Object.keys(soilConservationTopics).length / topics.length);
    topics.forEach(topic => {
      createArticleVariations(topic, 'soil_conservation', subcategory, articlesPerTopic);
    });
  });

  // Generate Water Management articles (100 total)
  console.log('Generating water management articles...');
  Object.entries(waterManagementTopics).forEach(([subcategory, topics]) => {
    const articlesPerTopic = Math.ceil(100 / Object.keys(waterManagementTopics).length / topics.length);
    topics.forEach(topic => {
      createArticleVariations(topic, 'water_management', subcategory, articlesPerTopic);
    });
  });

  // Generate Crop Rotation articles (50 total)
  console.log('Generating crop rotation articles...');
  Object.entries(cropRotationTopics).forEach(([subcategory, topics]) => {
    const articlesPerTopic = Math.ceil(50 / Object.keys(cropRotationTopics).length / topics.length);
    topics.forEach(topic => {
      createArticleVariations(topic, 'crop_rotation', subcategory, articlesPerTopic);
    });
  });

  console.log(`Generated ${articles.length} articles`);

  // Insert articles in batches
  const batchSize = 50;
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(articles.length / batchSize)}...`);
    
    const numFields = 20; // Number of fields per article
    const values = batch.map((_, idx) => {
      const fieldPlaceholders = Array.from({ length: numFields }, (_, fieldIdx) => 
        `$${idx * numFields + fieldIdx + 1}`
      ).join(', ');
      return `(${fieldPlaceholders})`;
    }).join(',');

    const params = batch.flatMap(article => [
      article.article_id,
      article.title,
      article.content,
      article.summary,
      article.category,
      article.subcategory,
      article.tags,
      article.media,
      article.evidence_level,
      article.scientific_references,
      article.implementation_guide,
      article.benefits,
      article.view_count,
      article.rating_sum,
      article.rating_count,
      article.success_story_count,
      article.applicable_crops,
      article.applicable_regions,
      article.applicable_seasons,
      article.published_at
    ]);

    await pool.query(`
      INSERT INTO knowledge_articles (
        article_id, title, content, summary, category, subcategory, tags, media,
        evidence_level, scientific_references, implementation_guide, benefits,
        view_count, rating_sum, rating_count, success_story_count,
        applicable_crops, applicable_regions, applicable_seasons, published_at
      ) VALUES ${values}
    `, params);
  }

  console.log(`Successfully seeded ${articles.length} articles!`);
}


// ============================================================================
// Generate Statistics Summary
// ============================================================================

async function generateSummary(pool: Pool): Promise<void> {
  console.log('\n=== Knowledge Base Statistics ===\n');

  // Total articles
  const totalResult = await pool.query('SELECT COUNT(*) as count FROM knowledge_articles');
  console.log(`Total Articles: ${totalResult.rows[0].count}`);

  // By category
  const categoryResult = await pool.query(`
    SELECT category, COUNT(*) as count 
    FROM knowledge_articles 
    GROUP BY category 
    ORDER BY count DESC
  `);
  console.log('\nArticles by Category:');
  categoryResult.rows.forEach(row => {
    console.log(`  ${row.category}: ${row.count}`);
  });

  // By evidence level
  const evidenceResult = await pool.query(`
    SELECT evidence_level, COUNT(*) as count 
    FROM knowledge_articles 
    GROUP BY evidence_level 
    ORDER BY count DESC
  `);
  console.log('\nArticles by Evidence Level:');
  evidenceResult.rows.forEach(row => {
    console.log(`  ${row.evidence_level}: ${row.count}`);
  });

  // By language
  const languageResult = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE 'en' = ANY(available_languages)) as english,
      COUNT(*) FILTER (WHERE 'hi' = ANY(available_languages)) as hindi
    FROM knowledge_articles
  `);
  console.log('\nArticles by Language:');
  console.log(`  English: ${languageResult.rows[0].english}`);
  console.log(`  Hindi: ${languageResult.rows[0].hindi}`);

  // Top subcategories
  const subcategoryResult = await pool.query(`
    SELECT subcategory, COUNT(*) as count 
    FROM knowledge_articles 
    GROUP BY subcategory 
    ORDER BY count DESC 
    LIMIT 10
  `);
  console.log('\nTop 10 Subcategories:');
  subcategoryResult.rows.forEach(row => {
    console.log(`  ${row.subcategory}: ${row.count}`);
  });

  console.log('\n=================================\n');
}

// ============================================================================
// Main Execution
// ============================================================================

export async function seedKnowledgeBase(pool: Pool): Promise<void> {
  try {
    console.log('Starting knowledge base seed process...\n');
    
    // Check if articles already exist
    const existingResult = await pool.query('SELECT COUNT(*) as count FROM knowledge_articles');
    const existingCount = parseInt(existingResult.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`Warning: ${existingCount} articles already exist in the database.`);
      console.log('Skipping seed to avoid duplicates. Delete existing articles first if you want to reseed.\n');
      return;
    }

    await generateArticles(pool);
    await generateSummary(pool);
    
    console.log('Knowledge base seed completed successfully!');
  } catch (error) {
    console.error('Error seeding knowledge base:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ruralconnect',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });

  seedKnowledgeBase(pool)
    .then(() => {
      pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      pool.end();
      process.exit(1);
    });
}
