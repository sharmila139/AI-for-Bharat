# Evidence Level Classification System

## Overview

The Evidence Level Classification System provides a standardized way to categorize and display the reliability and scientific backing of agricultural knowledge articles in the RuralConnect AI platform. This system helps farmers make informed decisions by clearly indicating the level of evidence supporting each farming technique or practice.

## Evidence Levels

### 1. Traditional Knowledge (पारंपरिक ज्ञान)

**Icon:** 🌾  
**Color:** Brown (#8B4513)

**Definition:**  
Time-tested traditional knowledge passed down through generations. Based on centuries of practical experience and cultural wisdom.

**Criteria:**
- Practiced for multiple generations (50+ years)
- Widely adopted in traditional farming communities
- Based on indigenous knowledge systems
- Documented in cultural or historical records
- Minimal or no scientific validation

**Examples:**
- Panchagavya preparation using cow products
- Neem-based traditional pest repellents
- Moon phase-based planting calendars
- Traditional seed treatment methods
- Indigenous composting techniques

**When to Use:**
- Documenting traditional farming practices
- Preserving indigenous agricultural knowledge
- Sharing cultural farming wisdom
- Techniques without formal scientific studies

**Validation Requirements:**
- No scientific references required
- Historical documentation recommended
- Cultural context should be provided
- Success stories from traditional practitioners

---

### 2. Field-Tested / Moderate Evidence (क्षेत्र-परीक्षित)

**Icon:** ✓  
**Color:** Orange (#FF8C00)

**Definition:**  
Field-tested with documented success stories and practical validation. Proven effective through farmer experiences and extension programs.

**Criteria:**
- Tested by farmers or extension officers
- Multiple documented success stories
- Recommended by agricultural universities
- Some scientific studies or trials conducted
- Positive results in field demonstrations

**Examples:**
- Vermicomposting techniques
- Integrated Pest Management (IPM) practices
- Drip irrigation systems
- Crop rotation patterns validated by farmers
- Organic fertilizer applications

**When to Use:**
- Techniques validated through field trials
- Practices recommended by extension services
- Methods with farmer success stories
- Techniques with preliminary research

**Validation Requirements:**
- At least one of the following:
  - Scientific reference or field trial report
  - Verification by agricultural extension officer
  - Multiple documented success stories (3+)
- Practical implementation guide
- Cost-benefit analysis from field experience

---

### 3. Scientifically Validated / Strong Evidence (वैज्ञानिक रूप से मान्य)

**Icon:** 🔬  
**Color:** Green (#228B22)

**Definition:**  
Scientifically validated with research backing and peer-reviewed studies. Supported by rigorous scientific evidence and published research.

**Criteria:**
- Published in peer-reviewed scientific journals
- Replicated studies with consistent results
- Backed by research institutions (ICAR, universities)
- Statistical validation of effectiveness
- Mechanism of action scientifically explained

**Examples:**
- Bt (Bacillus thuringiensis) for pest control
- Rhizobium biofertilizer application
- Precision agriculture techniques
- Hybrid seed varieties with documented yield improvements
- Scientifically optimized fertilizer schedules

**When to Use:**
- Techniques backed by published research
- Methods validated by research institutions
- Practices with statistical proof of effectiveness
- Technologies with scientific explanation

**Validation Requirements:**
- Minimum 2 scientific references from peer-reviewed sources
- References must include:
  - Title, authors, year
  - Journal name or DOI/URL
  - Preferably recent (within last 10 years)
- Verification by agricultural expert recommended
- Quantified results and statistical data

---

## Classification Guidelines

### Automatic Classification

The system can automatically suggest an evidence level based on:

1. **Number of Scientific References:**
   - 0 references → Traditional
   - 1 reference → Moderate
   - 2+ complete references → Strong

2. **Quality of References:**
   - Complete metadata (title, authors, year, journal/DOI)
   - Recency (published within last 10 years)
   - Source credibility (peer-reviewed journals, research institutions)

3. **Expert Verification:**
   - Verified by extension officer → +10% confidence
   - Verified by researcher → +15% confidence

4. **Community Validation:**
   - Success stories → +5% confidence per story (up to 25%)
   - High rating (4.5+) → +5% confidence
   - High implementation count → +5% confidence

### Confidence Scoring

The system calculates a confidence score (0-100) for each classification:

- **90-100%:** Very high confidence, all criteria met
- **70-89%:** High confidence, most criteria met
- **50-69%:** Moderate confidence, some criteria met
- **Below 50%:** Low confidence, minimal criteria met

### Upgrading Evidence Levels

Articles can be upgraded to higher evidence levels by:

1. **Traditional → Moderate:**
   - Add field trial results
   - Collect farmer success stories
   - Get verification from extension officer
   - Document practical implementation

2. **Moderate → Strong:**
   - Add peer-reviewed scientific references
   - Include statistical validation
   - Get verification from researcher
   - Provide mechanism of action explanation

---

## API Integration

### Get Evidence Level Information

```http
GET /api/knowledge-base/evidence-levels
```

Returns detailed information about all evidence levels including descriptions, criteria, and examples in multiple languages.

### Get Evidence Level Filters

```http
GET /api/knowledge-base/evidence-levels/filters?language=en
```

Returns filter options for searching articles by evidence level.

### Validate Article Evidence Level

```http
POST /api/knowledge-base/articles/:id/validate-evidence
```

Validates if the current evidence level is appropriate for the article based on its scientific references and verification status.

### Classify Article Evidence Level

```http
POST /api/knowledge-base/articles/:id/classify-evidence
```

Automatically suggests an appropriate evidence level based on article content, references, and community validation.

### Get Evidence Badge

```http
GET /api/knowledge-base/articles/:id/evidence-badge?language=en
```

Returns badge information for displaying the evidence level in the UI.

---

## UI Display Guidelines

### Article List View

Display evidence level badge prominently:
```
[Icon] Evidence Level Name
```

Example:
```
🔬 Scientifically Validated
✓ Field-Tested
🌾 Traditional Knowledge
```

### Article Detail View

Show comprehensive evidence information:

1. **Evidence Badge:** Large, colored badge with icon
2. **Description:** Brief explanation of what the evidence level means
3. **Scientific References:** Formatted list of all references
4. **Verification Status:** Show if verified and by whom
5. **Success Stories:** Link to community validation

### Search Filters

Provide evidence level as a filter option:
```
Evidence Level:
☐ Traditional Knowledge
☐ Field-Tested
☐ Scientifically Validated
```

### Mobile Display

Use color-coded badges with icons for quick recognition:
- Green badge with 🔬 for Strong
- Orange badge with ✓ for Moderate
- Brown badge with 🌾 for Traditional

---

## Scientific Reference Formatting

### Standard Format

```
Authors. (Year). "Title". Journal. DOI/URL.
```

### Example

```
Smith, J., Doe, A. (2022). "Effectiveness of Vermicomposting in Soil Health Improvement". 
Journal of Sustainable Agriculture. DOI: 10.1234/jsa.2022.001
```

### Required Fields

- **Title:** Full title of the study
- **Authors:** All authors or "et al." for many
- **Year:** Publication year
- **Journal/Source:** Where it was published (for Strong evidence)
- **DOI or URL:** Digital identifier or web link

---

## Content Creation Guidelines

### For Traditional Knowledge Articles

1. Document historical context and cultural significance
2. Explain traditional reasoning and beliefs
3. Include regional variations
4. Cite elder farmers or traditional practitioners
5. Note any modern adaptations
6. Be respectful of indigenous knowledge

### For Field-Tested Articles

1. Describe field trial methodology
2. Include farmer testimonials
3. Document success rates and conditions
4. Provide cost-benefit analysis
5. Note regional suitability
6. Include implementation challenges

### For Scientifically Validated Articles

1. Cite all relevant research papers
2. Explain scientific mechanism
3. Include statistical data
4. Note study limitations
5. Provide practical application guidelines
6. Keep language accessible despite scientific backing

---

## Quality Assurance

### Review Process

1. **Draft Stage:** Author selects evidence level
2. **Validation:** System validates appropriateness
3. **Review:** Editor checks references and classification
4. **Verification:** Expert verifies if needed
5. **Publication:** Article published with evidence badge

### Periodic Re-evaluation

Articles should be re-evaluated when:
- New scientific research becomes available
- Additional success stories are documented
- Expert verification is obtained
- Community feedback indicates issues

---

## Multi-Language Support

All evidence level information is available in:
- English (en)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Bengali (bn)
- Marathi (mr)
- Gujarati (gu)
- Kannada (kn)
- Malayalam (ml)
- Punjabi (pa)
- Odia (or)
- Assamese (as)
- Urdu (ur)
- Kashmiri (ks)
- Konkani (kok)
- Manipuri (mni)

---

## Best Practices

### For Content Creators

1. **Be Honest:** Choose the evidence level that truly reflects the backing
2. **Provide Context:** Explain why this level is appropriate
3. **Add References:** Include all available scientific references
4. **Seek Verification:** Get expert verification when possible
5. **Update Regularly:** Add new evidence as it becomes available

### For Farmers

1. **Understand Levels:** Learn what each evidence level means
2. **Consider Context:** Strong evidence doesn't mean it works everywhere
3. **Start Small:** Test new techniques on small plots first
4. **Share Experience:** Contribute success stories to help others
5. **Combine Knowledge:** Traditional and scientific knowledge can complement each other

### For Extension Officers

1. **Verify Carefully:** Ensure verification is based on actual field experience
2. **Document Thoroughly:** Provide detailed verification notes
3. **Be Objective:** Base verification on evidence, not personal preference
4. **Educate Farmers:** Help farmers understand evidence levels
5. **Collect Data:** Gather field data to support evidence classification

---

## Frequently Asked Questions

### Q: Can traditional knowledge be as effective as scientifically validated techniques?

A: Yes! Traditional knowledge has been proven effective over centuries. The evidence level indicates the type of backing, not necessarily the effectiveness. Many traditional techniques are highly effective but simply haven't been formally studied.

### Q: Why should I trust field-tested techniques without scientific studies?

A: Field-tested techniques have been validated through real-world farmer experiences. While they may lack formal scientific studies, they have practical proof of effectiveness. Many successful farming practices started as field-tested before being scientifically validated.

### Q: How often are evidence levels updated?

A: Evidence levels are reviewed when new information becomes available, such as new research publications, additional success stories, or expert verification. Authors and editors can request re-evaluation at any time.

### Q: Can an article have multiple evidence levels?

A: No, each article has one primary evidence level. However, the article may contain techniques with different levels of evidence, which should be noted in the content.

### Q: What if I disagree with an article's evidence level?

A: You can report the article for review through the platform. Provide specific reasons and any supporting evidence. The editorial team will re-evaluate the classification.

---

## Technical Implementation

### Database Schema

```sql
evidence_level VARCHAR(20) NOT NULL 
  CHECK (evidence_level IN ('traditional', 'moderate', 'strong'))
```

### TypeScript Types

```typescript
export type EvidenceLevel = 'traditional' | 'moderate' | 'strong';

export interface ScientificReference {
  title: string;
  authors: string;
  year: number;
  journal?: string;
  url?: string;
  doi?: string;
}
```

### Service Methods

- `getEvidenceLevelInfo()` - Get all evidence level information
- `validateEvidenceLevel()` - Validate evidence level appropriateness
- `classifyEvidenceLevel()` - Auto-classify based on content
- `formatScientificReference()` - Format references for display
- `getEvidenceLevelBadge()` - Get badge for UI display
- `getEvidenceLevelFilters()` - Get filter options

---

## Conclusion

The Evidence Level Classification System provides transparency and helps farmers make informed decisions about which agricultural practices to adopt. By clearly indicating the type and strength of evidence supporting each technique, we empower rural communities to choose practices that best fit their needs, resources, and risk tolerance.

Remember: All three evidence levels have value. Traditional knowledge preserves cultural wisdom, field-tested techniques provide practical validation, and scientifically validated methods offer rigorous proof. The best farming approach often combines knowledge from all three levels.

---

**Version:** 1.0  
**Last Updated:** 2024  
**Maintained by:** RuralConnect AI Knowledge Base Team
