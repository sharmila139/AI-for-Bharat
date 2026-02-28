/**
 * Implementation Guide Service Tests
 */

import { ImplementationGuideService } from '../implementation-guide-service';
import { ImplementationGuide } from '../knowledge-base-types';

describe('ImplementationGuideService', () => {
  let service: ImplementationGuideService;

  beforeEach(() => {
    service = new ImplementationGuideService();
  });

  describe('validateGuide', () => {
    it('should validate a complete guide with no errors', () => {
      const guide: ImplementationGuide = {
        steps: [
          {
            step: 1,
            description: { en: 'First step', hi: 'पहला कदम' },
            duration: '1 hour',
          },
          {
            step: 2,
            description: { en: 'Second step', hi: 'दूसरा कदम' },
            duration: '2 hours',
          },
        ],
        materials: [
          {
            name: { en: 'Material 1', hi: 'सामग्री 1' },
            quantity: '10 kg',
            cost: 100,
          },
        ],
        tools: [
          {
            name: { en: 'Tool 1', hi: 'उपकरण 1' },
            optional: false,
          },
        ],
        timeline: '1 week',
        difficulty_level: 'easy',
      };

      const errors = service.validateGuide(guide);
      expect(errors).toHaveLength(0);
    });

    it('should return error when steps are missing', () => {
      const guide: ImplementationGuide = {
        steps: [],
        materials: [{ name: { en: 'Material' }, quantity: '10 kg' }],
        tools: [{ name: { en: 'Tool' } }],
        timeline: '1 week',
      };

      const errors = service.validateGuide(guide);
      expect(errors).toContainEqual({
        field: 'steps',
        message: 'Implementation guide must have at least one step',
      });
    });

    it('should return error when step numbers are incorrect', () => {
      const guide: ImplementationGuide = {
        steps: [
          {
            step: 1,
            description: { en: 'First step' },
          },
          {
            step: 3, // Should be 2
            description: { en: 'Second step' },
          },
        ],
        materials: [{ name: { en: 'Material' }, quantity: '10 kg' }],
        tools: [{ name: { en: 'Tool' } }],
        timeline: '1 week',
      };

      const errors = service.validateGuide(guide);
      expect(errors).toContainEqual({
        field: 'steps[1].step',
        message: 'Step number must be 2',
      });
    });

    it('should return error when English description is missing', () => {
      const guide: ImplementationGuide = {
        steps: [
          {
            step: 1,
            description: { hi: 'पहला कदम' }, // Missing English
          },
        ],
        materials: [{ name: { en: 'Material' }, quantity: '10 kg' }],
        tools: [{ name: { en: 'Tool' } }],
        timeline: '1 week',
      };

      const errors = service.validateGuide(guide);
      expect(errors).toContainEqual({
        field: 'steps[0].description.en',
        message: 'English description is required for all steps',
      });
    });

    it('should return error when materials are missing', () => {
      const guide: ImplementationGuide = {
        steps: [{ step: 1, description: { en: 'Step' } }],
        materials: [],
        tools: [{ name: { en: 'Tool' } }],
        timeline: '1 week',
      };

      const errors = service.validateGuide(guide);
      expect(errors).toContainEqual({
        field: 'materials',
        message: 'Implementation guide must list required materials',
      });
    });

    it('should return error when material quantity is missing', () => {
      const guide: ImplementationGuide = {
        steps: [{ step: 1, description: { en: 'Step' } }],
        materials: [{ name: { en: 'Material' }, quantity: '' }],
        tools: [{ name: { en: 'Tool' } }],
        timeline: '1 week',
      };

      const errors = service.validateGuide(guide);
      expect(errors).toContainEqual({
        field: 'materials[0].quantity',
        message: 'Material quantity is required',
      });
    });

    it('should return error when tools are missing', () => {
      const guide: ImplementationGuide = {
        steps: [{ step: 1, description: { en: 'Step' } }],
        materials: [{ name: { en: 'Material' }, quantity: '10 kg' }],
        tools: [],
        timeline: '1 week',
      };

      const errors = service.validateGuide(guide);
      expect(errors).toContainEqual({
        field: 'tools',
        message: 'Implementation guide must list required tools',
      });
    });

    it('should return error when timeline is missing', () => {
      const guide: ImplementationGuide = {
        steps: [{ step: 1, description: { en: 'Step' } }],
        materials: [{ name: { en: 'Material' }, quantity: '10 kg' }],
        tools: [{ name: { en: 'Tool' } }],
        timeline: '',
      };

      const errors = service.validateGuide(guide);
      expect(errors).toContainEqual({
        field: 'timeline',
        message: 'Overall timeline is required',
      });
    });

    it('should return error for invalid difficulty level', () => {
      const guide: any = {
        steps: [{ step: 1, description: { en: 'Step' } }],
        materials: [{ name: { en: 'Material' }, quantity: '10 kg' }],
        tools: [{ name: { en: 'Tool' } }],
        timeline: '1 week',
        difficulty_level: 'invalid',
      };

      const errors = service.validateGuide(guide);
      expect(errors).toContainEqual({
        field: 'difficulty_level',
        message: 'Difficulty level must be easy, medium, or hard',
      });
    });
  });

  describe('isGuideComplete', () => {
    it('should return true for a complete guide', () => {
      const guide: ImplementationGuide = {
        steps: [{ step: 1, description: { en: 'Step' } }],
        materials: [{ name: { en: 'Material' }, quantity: '10 kg' }],
        tools: [{ name: { en: 'Tool' } }],
        timeline: '1 week',
      };

      expect(service.isGuideComplete(guide)).toBe(true);
    });

    it('should return false for an incomplete guide', () => {
      const guide: ImplementationGuide = {
        steps: [],
        materials: [{ name: { en: 'Material' }, quantity: '10 kg' }],
        tools: [{ name: { en: 'Tool' } }],
        timeline: '1 week',
      };

      expect(service.isGuideComplete(guide)).toBe(false);
    });
  });

  describe('getTemplates', () => {
    it('should return all available templates', () => {
      const templates = service.getTemplates();
      
      expect(templates).toHaveLength(6);
      expect(templates.map(t => t.name)).toEqual([
        'composting',
        'vermicompost',
        'green_manure',
        'mulching',
        'drip_irrigation',
        'natural_pest_control',
      ]);
    });

    it('should return valid guides for all templates', () => {
      const templates = service.getTemplates();
      
      templates.forEach(template => {
        const errors = service.validateGuide(template.guide);
        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('getTemplateByName', () => {
    it('should return composting template', () => {
      const template = service.getTemplateByName('composting');
      
      expect(template).not.toBeNull();
      expect(template?.name).toBe('composting');
      expect(template?.category).toBe('organic_farming');
      expect(template?.guide.difficulty_level).toBe('easy');
      expect(template?.guide.timeline).toBe('45-60 days');
    });

    it('should return vermicompost template', () => {
      const template = service.getTemplateByName('vermicompost');
      
      expect(template).not.toBeNull();
      expect(template?.name).toBe('vermicompost');
      expect(template?.category).toBe('organic_farming');
      expect(template?.guide.difficulty_level).toBe('medium');
    });

    it('should return drip irrigation template', () => {
      const template = service.getTemplateByName('drip_irrigation');
      
      expect(template).not.toBeNull();
      expect(template?.name).toBe('drip_irrigation');
      expect(template?.category).toBe('water_management');
      expect(template?.guide.difficulty_level).toBe('hard');
    });

    it('should return null for non-existent template', () => {
      const template = service.getTemplateByName('non_existent');
      expect(template).toBeNull();
    });
  });

  describe('Template Structure', () => {
    it('composting template should have all required fields', () => {
      const template = service.getTemplateByName('composting');
      
      expect(template?.guide.steps.length).toBeGreaterThan(0);
      expect(template?.guide.materials.length).toBeGreaterThan(0);
      expect(template?.guide.tools.length).toBeGreaterThan(0);
      expect(template?.guide.timeline).toBeTruthy();
      
      // Check multi-language support
      template?.guide.steps.forEach(step => {
        expect(step.description.en).toBeTruthy();
        expect(step.description.hi).toBeTruthy();
      });
      
      template?.guide.materials.forEach(material => {
        expect(material.name.en).toBeTruthy();
        expect(material.name.hi).toBeTruthy();
        expect(material.quantity).toBeTruthy();
      });
    });

    it('all templates should have multi-language descriptions', () => {
      const templates = service.getTemplates();
      
      templates.forEach(template => {
        expect(template.description.en).toBeTruthy();
        expect(template.description.hi).toBeTruthy();
      });
    });

    it('all templates should have cost information for materials', () => {
      const templates = service.getTemplates();
      
      templates.forEach(template => {
        template.guide.materials.forEach(material => {
          expect(material.cost).toBeDefined();
          expect(typeof material.cost).toBe('number');
        });
      });
    });

    it('all templates should distinguish required and optional tools', () => {
      const templates = service.getTemplates();
      
      templates.forEach(template => {
        template.guide.tools.forEach(tool => {
          expect(tool.optional).toBeDefined();
          expect(typeof tool.optional).toBe('boolean');
        });
      });
    });
  });
});
