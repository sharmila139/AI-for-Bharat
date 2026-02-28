/**
 * Implementation Guide Service
 * Provides templates, validation, and generation for step-by-step implementation guides
 */

import {
  ImplementationGuide,
  MultiLanguageText,
} from './knowledge-base-types';

/**
 * Validation errors for implementation guides
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Template for common farming practices
 */
export interface GuideTemplate {
  name: string;
  category: string;
  description: MultiLanguageText;
  guide: ImplementationGuide;
}

export class ImplementationGuideService {
  /**
   * Validate an implementation guide for completeness and correctness
   */
  validateGuide(guide: ImplementationGuide): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate steps
    if (!guide.steps || guide.steps.length === 0) {
      errors.push({
        field: 'steps',
        message: 'Implementation guide must have at least one step',
      });
    } else {
      guide.steps.forEach((step, index) => {
        if (!step.step || step.step !== index + 1) {
          errors.push({
            field: `steps[${index}].step`,
            message: `Step number must be ${index + 1}`,
          });
        }

        if (!step.description || Object.keys(step.description).length === 0) {
          errors.push({
            field: `steps[${index}].description`,
            message: 'Step description is required in at least one language',
          });
        }

        // Validate multi-language text has at least English
        if (!step.description.en) {
          errors.push({
            field: `steps[${index}].description.en`,
            message: 'English description is required for all steps',
          });
        }
      });
    }

    // Validate materials
    if (!guide.materials || guide.materials.length === 0) {
      errors.push({
        field: 'materials',
        message: 'Implementation guide must list required materials',
      });
    } else {
      guide.materials.forEach((material, index) => {
        if (!material.name || Object.keys(material.name).length === 0) {
          errors.push({
            field: `materials[${index}].name`,
            message: 'Material name is required in at least one language',
          });
        }

        if (!material.name.en) {
          errors.push({
            field: `materials[${index}].name.en`,
            message: 'English name is required for all materials',
          });
        }

        if (!material.quantity) {
          errors.push({
            field: `materials[${index}].quantity`,
            message: 'Material quantity is required',
          });
        }
      });
    }

    // Validate tools
    if (!guide.tools || guide.tools.length === 0) {
      errors.push({
        field: 'tools',
        message: 'Implementation guide must list required tools',
      });
    } else {
      guide.tools.forEach((tool, index) => {
        if (!tool.name || Object.keys(tool.name).length === 0) {
          errors.push({
            field: `tools[${index}].name`,
            message: 'Tool name is required in at least one language',
          });
        }

        if (!tool.name.en) {
          errors.push({
            field: `tools[${index}].name.en`,
            message: 'English name is required for all tools',
          });
        }
      });
    }

    // Validate timeline
    if (!guide.timeline || guide.timeline.trim() === '') {
      errors.push({
        field: 'timeline',
        message: 'Overall timeline is required',
      });
    }

    // Validate difficulty level if provided
    if (guide.difficulty_level && !['easy', 'medium', 'hard'].includes(guide.difficulty_level)) {
      errors.push({
        field: 'difficulty_level',
        message: 'Difficulty level must be easy, medium, or hard',
      });
    }

    return errors;
  }

  /**
   * Check if a guide is complete and practical
   */
  isGuideComplete(guide: ImplementationGuide): boolean {
    const errors = this.validateGuide(guide);
    return errors.length === 0;
  }

  /**
   * Get predefined templates for common farming practices
   */
  getTemplates(): GuideTemplate[] {
    return [
      this.getCompostingTemplate(),
      this.getVermicompostTemplate(),
      this.getGreenManureTemplate(),
      this.getMulchingTemplate(),
      this.getDripIrrigationTemplate(),
      this.getNaturalPestControlTemplate(),
    ];
  }

  /**
   * Get a specific template by name
   */
  getTemplateByName(name: string): GuideTemplate | null {
    const templates = this.getTemplates();
    return templates.find(t => t.name === name) || null;
  }

  // ============================================================================
  // Template Definitions
  // ============================================================================

  private getCompostingTemplate(): GuideTemplate {
    return {
      name: 'composting',
      category: 'organic_farming',
      description: {
        en: 'Step-by-step guide to create nutrient-rich compost from farm waste',
        hi: 'खेत के कचरे से पोषक तत्वों से भरपूर खाद बनाने की चरण-दर-चरण मार्गदर्शिका',
      },
      guide: {
        steps: [
          {
            step: 1,
            description: {
              en: 'Select a shaded, well-drained location for your compost pit. Dig a pit 3 feet deep, 3 feet wide, and 9 feet long.',
              hi: 'अपने खाद गड्ढे के लिए छायादार, अच्छी जल निकासी वाली जगह चुनें। 3 फीट गहरा, 3 फीट चौड़ा और 9 फीट लंबा गड्ढा खोदें।',
            },
            duration: '2-3 hours',
            warnings: [
              {
                en: 'Avoid waterlogged areas to prevent anaerobic decomposition',
                hi: 'अवायवीय अपघटन को रोकने के लिए जलभराव वाले क्षेत्रों से बचें',
              },
            ],
          },
          {
            step: 2,
            description: {
              en: 'Layer green materials (fresh leaves, grass clippings, kitchen waste) and brown materials (dry leaves, straw, wood chips) in a 1:3 ratio.',
              hi: 'हरी सामग्री (ताजी पत्तियां, घास की कतरनें, रसोई का कचरा) और भूरी सामग्री (सूखी पत्तियां, पुआल, लकड़ी के चिप्स) को 1:3 के अनुपात में परत लगाएं।',
            },
            duration: '1-2 hours',
          },
          {
            step: 3,
            description: {
              en: 'Add a layer of cow dung slurry or compost activator to speed up decomposition.',
              hi: 'अपघटन को तेज करने के लिए गोबर के घोल या खाद सक्रियक की एक परत डालें।',
            },
            duration: '30 minutes',
          },
          {
            step: 4,
            description: {
              en: 'Sprinkle water to maintain 50-60% moisture. The pile should feel like a wrung-out sponge.',
              hi: '50-60% नमी बनाए रखने के लिए पानी छिड़कें। ढेर को निचोड़े हुए स्पंज की तरह महसूस होना चाहिए।',
            },
            duration: '15 minutes',
          },
          {
            step: 5,
            description: {
              en: 'Turn the pile every 7-10 days to aerate and ensure even decomposition.',
              hi: 'हवा देने और समान अपघटन सुनिश्चित करने के लिए हर 7-10 दिनों में ढेर को पलटें।',
            },
            duration: '30 minutes per turn',
          },
          {
            step: 6,
            description: {
              en: 'After 45-60 days, the compost will be dark, crumbly, and earthy-smelling. Sieve and store in a dry place.',
              hi: '45-60 दिनों के बाद, खाद गहरे रंग की, भुरभुरी और मिट्टी की गंध वाली होगी। छानकर सूखी जगह पर रखें।',
            },
            duration: '1-2 hours',
          },
        ],
        materials: [
          {
            name: { en: 'Green waste (fresh leaves, grass)', hi: 'हरा कचरा (ताजी पत्तियां, घास)' },
            quantity: '100 kg',
            cost: 0,
            where_to_find: { en: 'Farm waste', hi: 'खेत का कचरा' },
          },
          {
            name: { en: 'Brown waste (dry leaves, straw)', hi: 'भूरा कचरा (सूखी पत्तियां, पुआल)' },
            quantity: '300 kg',
            cost: 0,
            where_to_find: { en: 'Farm waste', hi: 'खेत का कचरा' },
          },
          {
            name: { en: 'Cow dung', hi: 'गोबर' },
            quantity: '20 kg',
            cost: 100,
            where_to_find: { en: 'Local dairy farm', hi: 'स्थानीय डेयरी फार्म' },
          },
          {
            name: { en: 'Water', hi: 'पानी' },
            quantity: '50 liters',
            cost: 0,
          },
        ],
        tools: [
          { name: { en: 'Spade or shovel', hi: 'फावड़ा या बेलचा' }, optional: false },
          { name: { en: 'Pitchfork', hi: 'पिचफोर्क' }, optional: false },
          { name: { en: 'Watering can', hi: 'पानी का डिब्बा' }, optional: false },
          { name: { en: 'Sieve', hi: 'छलनी' }, optional: false },
          { name: { en: 'Thermometer', hi: 'थर्मामीटर' }, optional: true },
        ],
        timeline: '45-60 days',
        difficulty_level: 'easy',
      },
    };
  }

  private getVermicompostTemplate(): GuideTemplate {
    return {
      name: 'vermicompost',
      category: 'organic_farming',
      description: {
        en: 'Create high-quality vermicompost using earthworms',
        hi: 'केंचुओं का उपयोग करके उच्च गुणवत्ता वाली वर्मीकम्पोस्ट बनाएं',
      },
      guide: {
        steps: [
          {
            step: 1,
            description: {
              en: 'Prepare a vermicompost bed in a shaded area. Use a concrete tank, wooden box, or dig a pit (10 ft x 3 ft x 1 ft).',
              hi: 'छायादार क्षेत्र में वर्मीकम्पोस्ट बेड तैयार करें। कंक्रीट टैंक, लकड़ी का बक्सा, या गड्ढा (10 फीट x 3 फीट x 1 फीट) खोदें।',
            },
            duration: '2-3 hours',
          },
          {
            step: 2,
            description: {
              en: 'Spread a 6-inch layer of broken bricks or gravel at the bottom for drainage.',
              hi: 'जल निकासी के लिए तल पर टूटी ईंटों या बजरी की 6 इंच की परत बिछाएं।',
            },
            duration: '30 minutes',
          },
          {
            step: 3,
            description: {
              en: 'Add partially decomposed cow dung and farm waste mixed with soil (2:1 ratio) up to 6 inches.',
              hi: 'आंशिक रूप से सड़े हुए गोबर और मिट्टी के साथ मिश्रित खेत के कचरे (2:1 अनुपात) को 6 इंच तक जोड़ें।',
            },
            duration: '1 hour',
          },
          {
            step: 4,
            description: {
              en: 'Introduce 500-1000 earthworms (Eisenia fetida or local species) evenly across the bed.',
              hi: 'बिस्तर पर समान रूप से 500-1000 केंचुए (Eisenia fetida या स्थानीय प्रजाति) डालें।',
            },
            duration: '30 minutes',
            warnings: [
              {
                en: 'Handle earthworms gently to avoid injury',
                hi: 'चोट से बचने के लिए केंचुओं को धीरे से संभालें',
              },
            ],
          },
          {
            step: 5,
            description: {
              en: 'Cover with jute bags or straw to maintain moisture and darkness. Water lightly every 2-3 days.',
              hi: 'नमी और अंधेरा बनाए रखने के लिए जूट के बोरों या पुआल से ढकें। हर 2-3 दिन में हल्का पानी दें।',
            },
            duration: '15 minutes every 2-3 days',
          },
          {
            step: 6,
            description: {
              en: 'After 45-60 days, stop watering for 2-3 days. Harvest the dark, granular vermicompost by separating worms.',
              hi: '45-60 दिनों के बाद, 2-3 दिनों के लिए पानी देना बंद करें। केंचुओं को अलग करके गहरे, दानेदार वर्मीकम्पोस्ट की कटाई करें।',
            },
            duration: '2-3 hours',
          },
        ],
        materials: [
          {
            name: { en: 'Earthworms (Eisenia fetida)', hi: 'केंचुए (Eisenia fetida)' },
            quantity: '500-1000 worms',
            cost: 500,
            where_to_find: { en: 'Agricultural university, vermicompost centers', hi: 'कृषि विश्वविद्यालय, वर्मीकम्पोस्ट केंद्र' },
          },
          {
            name: { en: 'Cow dung (partially decomposed)', hi: 'गोबर (आंशिक रूप से सड़ा हुआ)' },
            quantity: '100 kg',
            cost: 200,
          },
          {
            name: { en: 'Farm waste', hi: 'खेत का कचरा' },
            quantity: '50 kg',
            cost: 0,
          },
          {
            name: { en: 'Soil', hi: 'मिट्टी' },
            quantity: '50 kg',
            cost: 0,
          },
          {
            name: { en: 'Broken bricks or gravel', hi: 'टूटी ईंटें या बजरी' },
            quantity: '20 kg',
            cost: 50,
          },
          {
            name: { en: 'Jute bags', hi: 'जूट के बोरे' },
            quantity: '2-3 bags',
            cost: 100,
          },
        ],
        tools: [
          { name: { en: 'Spade', hi: 'फावड़ा' }, optional: false },
          { name: { en: 'Watering can', hi: 'पानी का डिब्बा' }, optional: false },
          { name: { en: 'Sieve (4mm mesh)', hi: 'छलनी (4mm जाली)' }, optional: false },
        ],
        timeline: '45-60 days',
        difficulty_level: 'medium',
      },
    };
  }

  private getGreenManureTemplate(): GuideTemplate {
    return {
      name: 'green_manure',
      category: 'soil_conservation',
      description: {
        en: 'Improve soil fertility using green manure crops',
        hi: 'हरी खाद फसलों का उपयोग करके मिट्टी की उर्वरता में सुधार करें',
      },
      guide: {
        steps: [
          {
            step: 1,
            description: {
              en: 'Select appropriate green manure crop based on season: Dhaincha (summer), Sunhemp (kharif), Berseem (rabi).',
              hi: 'मौसम के आधार पर उपयुक्त हरी खाद फसल चुनें: ढैंचा (गर्मी), सनई (खरीफ), बरसीम (रबी)।',
            },
            duration: '1 hour',
          },
          {
            step: 2,
            description: {
              en: 'Prepare the field by plowing and leveling. Ensure good drainage.',
              hi: 'जुताई और समतल करके खेत तैयार करें। अच्छी जल निकासी सुनिश्चित करें।',
            },
            duration: '3-4 hours per acre',
          },
          {
            step: 3,
            description: {
              en: 'Sow seeds broadcast or in rows. Seed rate: Dhaincha 25 kg/acre, Sunhemp 20 kg/acre, Berseem 8 kg/acre.',
              hi: 'बीज छिड़काव या पंक्तियों में बोएं। बीज दर: ढैंचा 25 किग्रा/एकड़, सनई 20 किग्रा/एकड़, बरसीम 8 किग्रा/एकड़।',
            },
            duration: '2-3 hours per acre',
          },
          {
            step: 4,
            description: {
              en: 'Irrigate immediately after sowing and maintain adequate moisture during growth.',
              hi: 'बुवाई के तुरंत बाद सिंचाई करें और वृद्धि के दौरान पर्याप्त नमी बनाए रखें।',
            },
            duration: '1-2 hours per irrigation',
          },
          {
            step: 5,
            description: {
              en: 'Incorporate the crop into soil at 50% flowering stage (45-60 days). Plow and mix thoroughly.',
              hi: '50% फूल आने के चरण (45-60 दिन) पर फसल को मिट्टी में मिलाएं। जुताई करें और अच्छी तरह मिलाएं।',
            },
            duration: '4-5 hours per acre',
            warnings: [
              {
                en: 'Do not delay beyond flowering as stems become woody',
                hi: 'फूल आने के बाद देरी न करें क्योंकि तने लकड़ी जैसे हो जाते हैं',
              },
            ],
          },
          {
            step: 6,
            description: {
              en: 'Allow 2-3 weeks for decomposition before planting the main crop.',
              hi: 'मुख्य फसल लगाने से पहले अपघटन के लिए 2-3 सप्ताह की अनुमति दें।',
            },
            duration: '2-3 weeks waiting period',
          },
        ],
        materials: [
          {
            name: { en: 'Green manure seeds (Dhaincha/Sunhemp/Berseem)', hi: 'हरी खाद के बीज (ढैंचा/सनई/बरसीम)' },
            quantity: '20-25 kg per acre',
            cost: 400,
            where_to_find: { en: 'Agricultural stores, seed companies', hi: 'कृषि स्टोर, बीज कंपनियां' },
          },
          {
            name: { en: 'Water for irrigation', hi: 'सिंचाई के लिए पानी' },
            quantity: 'As needed',
            cost: 0,
          },
        ],
        tools: [
          { name: { en: 'Tractor or bullock plow', hi: 'ट्रैक्टर या बैल हल' }, optional: false },
          { name: { en: 'Seed broadcaster', hi: 'बीज छिड़काव यंत्र' }, optional: true },
          { name: { en: 'Irrigation equipment', hi: 'सिंचाई उपकरण' }, optional: false },
        ],
        timeline: '60-75 days',
        difficulty_level: 'easy',
      },
    };
  }

  private getMulchingTemplate(): GuideTemplate {
    return {
      name: 'mulching',
      category: 'water_management',
      description: {
        en: 'Conserve soil moisture and suppress weeds using mulch',
        hi: 'मल्च का उपयोग करके मिट्टी की नमी बनाए रखें और खरपतवार को दबाएं',
      },
      guide: {
        steps: [
          {
            step: 1,
            description: {
              en: 'Select mulching material: organic (straw, dry leaves, grass clippings) or inorganic (plastic film, stones).',
              hi: 'मल्चिंग सामग्री चुनें: जैविक (पुआल, सूखी पत्तियां, घास की कतरनें) या अकार्बनिक (प्लास्टिक फिल्म, पत्थर)।',
            },
            duration: '30 minutes',
          },
          {
            step: 2,
            description: {
              en: 'Prepare the field by removing weeds and leveling the soil surface.',
              hi: 'खरपतवार हटाकर और मिट्टी की सतह को समतल करके खेत तैयार करें।',
            },
            duration: '2-3 hours per acre',
          },
          {
            step: 3,
            description: {
              en: 'Apply mulch around plants in a 2-4 inch layer, keeping 2-3 inches away from plant stems.',
              hi: 'पौधों के चारों ओर 2-4 इंच की परत में मल्च लगाएं, पौधे के तनों से 2-3 इंच दूर रखें।',
            },
            duration: '3-4 hours per acre',
            warnings: [
              {
                en: 'Avoid direct contact with stems to prevent rot',
                hi: 'सड़न को रोकने के लिए तनों के सीधे संपर्क से बचें',
              },
            ],
          },
          {
            step: 4,
            description: {
              en: 'For plastic mulch, lay sheets and secure edges with soil. Make holes for planting.',
              hi: 'प्लास्टिक मल्च के लिए, शीट बिछाएं और किनारों को मिट्टी से सुरक्षित करें। रोपण के लिए छेद बनाएं।',
            },
            duration: '4-5 hours per acre',
          },
          {
            step: 5,
            description: {
              en: 'Monitor mulch thickness and replenish organic mulch as it decomposes (every 2-3 months).',
              hi: 'मल्च की मोटाई की निगरानी करें और जैविक मल्च को फिर से भरें जैसे यह विघटित होता है (हर 2-3 महीने)।',
            },
            duration: '1-2 hours per replenishment',
          },
        ],
        materials: [
          {
            name: { en: 'Organic mulch (straw, dry leaves)', hi: 'जैविक मल्च (पुआल, सूखी पत्तियां)' },
            quantity: '2-3 tons per acre',
            cost: 500,
            where_to_find: { en: 'Farm waste, local suppliers', hi: 'खेत का कचरा, स्थानीय आपूर्तिकर्ता' },
          },
          {
            name: { en: 'Plastic mulch film (optional)', hi: 'प्लास्टिक मल्च फिल्म (वैकल्पिक)' },
            quantity: '25-30 kg per acre',
            cost: 3000,
            where_to_find: { en: 'Agricultural stores', hi: 'कृषि स्टोर' },
          },
        ],
        tools: [
          { name: { en: 'Rake', hi: 'रेक' }, optional: false },
          { name: { en: 'Wheelbarrow', hi: 'ठेला' }, optional: true },
        ],
        timeline: '1-2 days for initial application',
        difficulty_level: 'easy',
      },
    };
  }

  private getDripIrrigationTemplate(): GuideTemplate {
    return {
      name: 'drip_irrigation',
      category: 'water_management',
      description: {
        en: 'Install efficient drip irrigation system to save water',
        hi: 'पानी बचाने के लिए कुशल ड्रिप सिंचाई प्रणाली स्थापित करें',
      },
      guide: {
        steps: [
          {
            step: 1,
            description: {
              en: 'Design the system layout based on field size, crop spacing, and water source location.',
              hi: 'खेत के आकार, फसल की दूरी और पानी के स्रोत के स्थान के आधार पर सिस्टम लेआउट डिजाइन करें।',
            },
            duration: '2-3 hours',
          },
          {
            step: 2,
            description: {
              en: 'Install main pipeline from water source to field. Use PVC pipes (63mm or 75mm diameter).',
              hi: 'पानी के स्रोत से खेत तक मुख्य पाइपलाइन स्थापित करें। PVC पाइप (63mm या 75mm व्यास) का उपयोग करें।',
            },
            duration: '4-6 hours per acre',
          },
          {
            step: 3,
            description: {
              en: 'Lay sub-main and lateral pipes along crop rows. Install drippers at plant spacing intervals.',
              hi: 'फसल की पंक्तियों के साथ उप-मुख्य और पार्श्व पाइप बिछाएं। पौधे की दूरी के अंतराल पर ड्रिपर स्थापित करें।',
            },
            duration: '6-8 hours per acre',
          },
          {
            step: 4,
            description: {
              en: 'Install filter, fertilizer tank, and pressure regulator at the head of the system.',
              hi: 'सिस्टम के शीर्ष पर फिल्टर, उर्वरक टैंक और दबाव नियामक स्थापित करें।',
            },
            duration: '2-3 hours',
          },
          {
            step: 5,
            description: {
              en: 'Test the system for leaks and uniform water distribution. Adjust pressure to 1-1.5 kg/cm².',
              hi: 'रिसाव और समान पानी वितरण के लिए सिस्टम का परीक्षण करें। दबाव को 1-1.5 किग्रा/सेमी² पर समायोजित करें।',
            },
            duration: '1-2 hours',
          },
          {
            step: 6,
            description: {
              en: 'Flush the system weekly and clean filters regularly. Check for clogged drippers.',
              hi: 'सिस्टम को साप्ताहिक रूप से फ्लश करें और फिल्टर को नियमित रूप से साफ करें। बंद ड्रिपर की जांच करें।',
            },
            duration: '30 minutes per week',
          },
        ],
        materials: [
          {
            name: { en: 'Main PVC pipe (63mm)', hi: 'मुख्य PVC पाइप (63mm)' },
            quantity: '100-150 meters per acre',
            cost: 3000,
            where_to_find: { en: 'Hardware stores, irrigation dealers', hi: 'हार्डवेयर स्टोर, सिंचाई डीलर' },
          },
          {
            name: { en: 'Lateral pipes with drippers', hi: 'ड्रिपर के साथ पार्श्व पाइप' },
            quantity: '2000-3000 meters per acre',
            cost: 8000,
          },
          {
            name: { en: 'Filter unit', hi: 'फिल्टर यूनिट' },
            quantity: '1 unit',
            cost: 2000,
          },
          {
            name: { en: 'Fertilizer tank (venturi)', hi: 'उर्वरक टैंक (वेंचुरी)' },
            quantity: '1 unit',
            cost: 1500,
          },
          {
            name: { en: 'Pressure regulator', hi: 'दबाव नियामक' },
            quantity: '1 unit',
            cost: 1000,
          },
          {
            name: { en: 'Connectors, valves, end caps', hi: 'कनेक्टर, वाल्व, एंड कैप' },
            quantity: 'As needed',
            cost: 1500,
          },
        ],
        tools: [
          { name: { en: 'PVC cutter', hi: 'PVC कटर' }, optional: false },
          { name: { en: 'Measuring tape', hi: 'मापने का टेप' }, optional: false },
          { name: { en: 'Spanner set', hi: 'स्पैनर सेट' }, optional: false },
          { name: { en: 'Hole punch for drippers', hi: 'ड्रिपर के लिए होल पंच' }, optional: false },
        ],
        timeline: '3-5 days for 1 acre',
        difficulty_level: 'hard',
      },
    };
  }

  private getNaturalPestControlTemplate(): GuideTemplate {
    return {
      name: 'natural_pest_control',
      category: 'pest_management',
      description: {
        en: 'Control pests using natural methods without chemicals',
        hi: 'रसायनों के बिना प्राकृतिक तरीकों से कीटों को नियंत्रित करें',
      },
      guide: {
        steps: [
          {
            step: 1,
            description: {
              en: 'Prepare neem oil spray: Mix 5ml neem oil + 1ml liquid soap in 1 liter water.',
              hi: 'नीम तेल स्प्रे तैयार करें: 1 लीटर पानी में 5ml नीम तेल + 1ml तरल साबुन मिलाएं।',
            },
            duration: '15 minutes',
          },
          {
            step: 2,
            description: {
              en: 'Spray early morning or evening on affected plants, covering both sides of leaves.',
              hi: 'प्रभावित पौधों पर सुबह जल्दी या शाम को स्प्रे करें, पत्तियों के दोनों तरफ कवर करें।',
            },
            duration: '1-2 hours per acre',
          },
          {
            step: 3,
            description: {
              en: 'Install yellow sticky traps at 15-20 per acre to monitor and trap flying insects.',
              hi: 'उड़ने वाले कीड़ों की निगरानी और जाल के लिए 15-20 प्रति एकड़ पीले चिपचिपे जाल स्थापित करें।',
            },
            duration: '1 hour',
          },
          {
            step: 4,
            description: {
              en: 'Release beneficial insects: Ladybugs (for aphids), Trichogramma wasps (for borers).',
              hi: 'लाभकारी कीड़े छोड़ें: लेडीबग्स (एफिड्स के लिए), ट्राइकोग्रामा ततैया (बोरर के लिए)।',
            },
            duration: '30 minutes',
          },
          {
            step: 5,
            description: {
              en: 'Apply neem cake to soil (200 kg/acre) to control soil-borne pests and nematodes.',
              hi: 'मिट्टी में रहने वाले कीटों और नेमाटोड को नियंत्रित करने के लिए मिट्टी में नीम की खली (200 किग्रा/एकड़) लगाएं।',
            },
            duration: '2-3 hours per acre',
          },
          {
            step: 6,
            description: {
              en: 'Repeat neem spray every 7-10 days until pest population is under control.',
              hi: 'कीट आबादी नियंत्रण में आने तक हर 7-10 दिनों में नीम स्प्रे दोहराएं।',
            },
            duration: '1-2 hours per application',
          },
        ],
        materials: [
          {
            name: { en: 'Neem oil', hi: 'नीम का तेल' },
            quantity: '1 liter',
            cost: 400,
            where_to_find: { en: 'Agricultural stores, organic shops', hi: 'कृषि स्टोर, जैविक दुकानें' },
          },
          {
            name: { en: 'Liquid soap', hi: 'तरल साबुन' },
            quantity: '200 ml',
            cost: 50,
          },
          {
            name: { en: 'Yellow sticky traps', hi: 'पीले चिपचिपे जाल' },
            quantity: '15-20 traps',
            cost: 300,
          },
          {
            name: { en: 'Beneficial insects', hi: 'लाभकारी कीड़े' },
            quantity: 'As per requirement',
            cost: 500,
            where_to_find: { en: 'Bio-control labs, agricultural universities', hi: 'जैव-नियंत्रण प्रयोगशालाएं, कृषि विश्वविद्यालय' },
          },
          {
            name: { en: 'Neem cake', hi: 'नीम की खली' },
            quantity: '200 kg per acre',
            cost: 2000,
          },
        ],
        tools: [
          { name: { en: 'Knapsack sprayer', hi: 'नैपसैक स्प्रेयर' }, optional: false },
          { name: { en: 'Measuring cup', hi: 'मापने का कप' }, optional: false },
          { name: { en: 'Protective gloves', hi: 'सुरक्षात्मक दस्ताने' }, optional: true },
        ],
        timeline: '2-4 weeks for control',
        difficulty_level: 'medium',
      },
    };
  }
}
