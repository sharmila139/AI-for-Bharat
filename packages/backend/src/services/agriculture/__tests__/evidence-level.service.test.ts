/**
 * Evidence Level Service Tests
 * Tests for evidence level classification and validation
 */

import { EvidenceLevelService } from '../evidence-level.service';
import { EvidenceLevel, ScientificReference } from '../knowledge-base-types';

describe('EvidenceLevelService', () => {
  describe('getEvidenceLevelInfo', () => {
    it('should return information for all evidence levels', () => {
      const info = EvidenceLevelService.getEvidenceLevelInfo();

      expect(info).toHaveProperty('traditional');
      expect(info).toHaveProperty('moderate');
      expect(info).toHaveProperty('strong');

      // Check structure for each level
      Object.values(info).forEach(levelInfo => {
        expect(levelInfo).toHaveProperty('level');
        expect(levelInfo).toHaveProperty('displayName');
        expect(levelInfo.displayName).toHaveProperty('en');
        expect(levelInfo.displayName).toHaveProperty('hi');
        expect(levelInfo).toHaveProperty('description');
        expect(levelInfo.description).toHaveProperty('en');
        expect(levelInfo.description).toHaveProperty('hi');
        expect(levelInfo).toHaveProperty('icon');
        expect(levelInfo).toHaveProperty('color');
        expect(levelInfo).toHaveProperty('criteria');
        expect(levelInfo).toHaveProperty('examples');
      });
    });

    it('should have non-empty descriptions and criteria', () => {
      const info = EvidenceLevelService.getEvidenceLevelInfo();

      Object.values(info).forEach(levelInfo => {
        expect(levelInfo.description.en.length).toBeGreaterThan(0);
        expect(levelInfo.description.hi.length).toBeGreaterThan(0);
        expect(levelInfo.criteria.en.length).toBeGreaterThan(0);
        expect(levelInfo.criteria.hi.length).toBeGreaterThan(0);
        expect(levelInfo.examples.en.length).toBeGreaterThan(0);
        expect(levelInfo.examples.hi.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateEvidenceLevel', () => {
    describe('Strong evidence level', () => {
      it('should require scientific references', () => {
        const result = EvidenceLevelService.validateEvidenceLevel('strong', []);

        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain(
          'Strong evidence level requires at least one scientific reference from peer-reviewed sources.'
        );
      });

      it('should validate with proper scientific references', () => {
        const refs: ScientificReference[] = [
          {
            title: 'Study on Organic Farming',
            authors: 'Smith, J. et al.',
            year: 2022,
            journal: 'Journal of Agriculture',
            doi: '10.1234/example',
          },
        ];

        const result = EvidenceLevelService.validateEvidenceLevel('strong', refs);

        expect(result.isValid).toBe(true);
        expect(result.warnings.length).toBe(0);
      });

      it('should warn about incomplete references', () => {
        const refs: ScientificReference[] = [
          {
            title: 'Study on Organic Farming',
            authors: '',
            year: 2022,
          },
        ];

        const result = EvidenceLevelService.validateEvidenceLevel('strong', refs);

        expect(result.warnings.some(w => w.includes('missing required fields'))).toBe(true);
      });

      it('should warn about outdated references', () => {
        const refs: ScientificReference[] = [
          {
            title: 'Old Study',
            authors: 'Smith, J.',
            year: 2010,
          },
        ];

        const result = EvidenceLevelService.validateEvidenceLevel('strong', refs);

        expect(result.warnings.some(w => w.includes('No recent scientific references'))).toBe(
          true
        );
      });

      it('should suggest verification if not verified', () => {
        const refs: ScientificReference[] = [
          {
            title: 'Study',
            authors: 'Smith, J.',
            year: 2023,
          },
        ];

        const result = EvidenceLevelService.validateEvidenceLevel('strong', refs);

        expect(result.suggestions.some(s => s.includes('verified'))).toBe(true);
      });
    });

    describe('Moderate evidence level', () => {
      it('should warn if no references and no verification', () => {
        const result = EvidenceLevelService.validateEvidenceLevel('moderate', []);

        expect(result.warnings.some(w => w.includes('either scientific references or verification'))).toBe(
          true
        );
      });

      it('should be valid with verification but no references', () => {
        const result = EvidenceLevelService.validateEvidenceLevel(
          'moderate',
          [],
          'verifier-id'
        );

        expect(result.warnings.length).toBe(0);
      });

      it('should suggest upgrading to strong with multiple references', () => {
        const refs: ScientificReference[] = [
          { title: 'Study 1', authors: 'A', year: 2022 },
          { title: 'Study 2', authors: 'B', year: 2021 },
          { title: 'Study 3', authors: 'C', year: 2023 },
        ];

        const result = EvidenceLevelService.validateEvidenceLevel('moderate', refs);

        expect(result.suggestions.some(s => s.includes('Strong'))).toBe(true);
      });
    });

    describe('Traditional evidence level', () => {
      it('should be valid without references', () => {
        const result = EvidenceLevelService.validateEvidenceLevel('traditional', []);

        expect(result.isValid).toBe(true);
      });

      it('should suggest upgrading if references exist', () => {
        const refs: ScientificReference[] = [
          { title: 'Study', authors: 'Smith', year: 2022 },
        ];

        const result = EvidenceLevelService.validateEvidenceLevel('traditional', refs);

        expect(result.suggestions.some(s => s.includes('upgrading'))).toBe(true);
      });

      it('should suggest documenting historical usage', () => {
        const result = EvidenceLevelService.validateEvidenceLevel('traditional', []);

        expect(result.suggestions.some(s => s.includes('historical usage'))).toBe(true);
      });
    });
  });

  describe('classifyEvidenceLevel', () => {
    it('should classify as strong with multiple complete references', () => {
      const refs: ScientificReference[] = [
        {
          title: 'Study 1',
          authors: 'Smith, J.',
          year: 2022,
          journal: 'Journal A',
          doi: '10.1234/a',
        },
        {
          title: 'Study 2',
          authors: 'Doe, J.',
          year: 2023,
          journal: 'Journal B',
          url: 'https://example.com',
        },
      ];

      const result = EvidenceLevelService.classifyEvidenceLevel(refs, 'verifier-id');

      expect(result.level).toBe('strong');
      expect(result.confidence).toBeGreaterThan(70);
      expect(result.reasoning).toContain('scientific reference');
    });

    it('should classify as moderate with incomplete references', () => {
      const refs: ScientificReference[] = [
        {
          title: 'Study 1',
          authors: 'Smith',
          year: 2022,
        },
        {
          title: 'Study 2',
          authors: 'Doe',
          year: 2010, // Old reference
        },
      ];

      const result = EvidenceLevelService.classifyEvidenceLevel(refs);

      expect(result.level).toBe('moderate');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should classify as moderate with verification but no references', () => {
      const result = EvidenceLevelService.classifyEvidenceLevel([], 'verifier-id');

      expect(result.level).toBe('moderate');
      expect(result.reasoning).toContain('verification');
    });

    it('should classify as moderate with success stories', () => {
      const result = EvidenceLevelService.classifyEvidenceLevel([], undefined, 5);

      expect(result.level).toBe('moderate');
      expect(result.reasoning).toContain('success stories');
    });

    it('should classify as traditional with no evidence', () => {
      const result = EvidenceLevelService.classifyEvidenceLevel([]);

      expect(result.level).toBe('traditional');
      expect(result.confidence).toBeLessThan(50);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should increase confidence with verification', () => {
      const refs: ScientificReference[] = [
        {
          title: 'Study',
          authors: 'Smith',
          year: 2023,
          journal: 'Journal',
          doi: '10.1234/x',
        },
      ];

      const withoutVerification = EvidenceLevelService.classifyEvidenceLevel(refs);
      const withVerification = EvidenceLevelService.classifyEvidenceLevel(refs, 'verifier-id');

      expect(withVerification.confidence).toBeGreaterThan(withoutVerification.confidence);
    });
  });

  describe('formatScientificReference', () => {
    it('should format complete reference', () => {
      const ref: ScientificReference = {
        title: 'Study on Organic Farming',
        authors: 'Smith, J., Doe, A.',
        year: 2022,
        journal: 'Journal of Agriculture',
        doi: '10.1234/example',
      };

      const formatted = EvidenceLevelService.formatScientificReference(ref);

      expect(formatted).toContain('Smith, J., Doe, A.');
      expect(formatted).toContain('(2022)');
      expect(formatted).toContain('"Study on Organic Farming"');
      expect(formatted).toContain('Journal of Agriculture');
      expect(formatted).toContain('DOI: 10.1234/example');
    });

    it('should format reference with URL instead of DOI', () => {
      const ref: ScientificReference = {
        title: 'Study',
        authors: 'Smith, J.',
        year: 2022,
        url: 'https://example.com/study',
      };

      const formatted = EvidenceLevelService.formatScientificReference(ref);

      expect(formatted).toContain('Available at: https://example.com/study');
      expect(formatted).not.toContain('DOI');
    });

    it('should handle partial reference data', () => {
      const ref: ScientificReference = {
        title: 'Study',
        authors: 'Smith',
        year: 2022,
      };

      const formatted = EvidenceLevelService.formatScientificReference(ref);

      expect(formatted).toContain('Smith');
      expect(formatted).toContain('(2022)');
      expect(formatted).toContain('"Study"');
    });
  });

  describe('getEvidenceLevelBadge', () => {
    it('should return badge info for each level in English', () => {
      const levels: EvidenceLevel[] = ['traditional', 'moderate', 'strong'];

      levels.forEach(level => {
        const badge = EvidenceLevelService.getEvidenceLevelBadge(level, 'en');

        expect(badge).toHaveProperty('label');
        expect(badge).toHaveProperty('icon');
        expect(badge).toHaveProperty('color');
        expect(badge).toHaveProperty('description');
        expect(badge.label.length).toBeGreaterThan(0);
        expect(badge.icon.length).toBeGreaterThan(0);
        expect(badge.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('should return badge info in Hindi', () => {
      const badge = EvidenceLevelService.getEvidenceLevelBadge('strong', 'hi');

      expect(badge.label).toContain('वैज्ञानिक');
      expect(badge.description.length).toBeGreaterThan(0);
    });

    it('should have different colors for different levels', () => {
      const traditional = EvidenceLevelService.getEvidenceLevelBadge('traditional');
      const moderate = EvidenceLevelService.getEvidenceLevelBadge('moderate');
      const strong = EvidenceLevelService.getEvidenceLevelBadge('strong');

      expect(traditional.color).not.toBe(moderate.color);
      expect(moderate.color).not.toBe(strong.color);
      expect(traditional.color).not.toBe(strong.color);
    });
  });

  describe('getEvidenceLevelFilters', () => {
    it('should return all evidence level filters', () => {
      const filters = EvidenceLevelService.getEvidenceLevelFilters('en');

      expect(filters).toHaveLength(3);
      expect(filters.map(f => f.value)).toEqual(['traditional', 'moderate', 'strong']);
    });

    it('should return filters in Hindi', () => {
      const filters = EvidenceLevelService.getEvidenceLevelFilters('hi');

      expect(filters).toHaveLength(3);
      filters.forEach(filter => {
        expect(filter.label.length).toBeGreaterThan(0);
        expect(filter.description.length).toBeGreaterThan(0);
      });
    });

    it('should include icons for all filters', () => {
      const filters = EvidenceLevelService.getEvidenceLevelFilters();

      filters.forEach(filter => {
        expect(filter.icon.length).toBeGreaterThan(0);
      });
    });
  });
});
