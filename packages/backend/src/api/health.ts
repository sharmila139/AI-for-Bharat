/**
 * Health Module API Endpoints
 * Provides symptom assessment, first aid, and health information
 */

import { Router, Request, Response } from 'express';
import { symptomAssessmentService, SymptomAssessmentInput } from '../services/health/symptom-assessment';
import { firstAidProtocolService } from '../services/health/first-aid-protocols';

const router = Router();

// ============================================================================
// SYMPTOM ASSESSMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/health/assess-symptoms
 * Assess symptoms and provide risk level and first aid recommendations
 */
router.post('/assess-symptoms', async (req: Request, res: Response) => {
  try {
    const input: SymptomAssessmentInput = req.body;
    
    // Validate input
    if (!input.symptoms || input.symptoms.length === 0) {
      return res.status(400).json({
        error: 'At least one symptom is required'
      });
    }
    
    if (!input.patientInfo || !input.patientInfo.age) {
      return res.status(400).json({
        error: 'Patient age is required'
      });
    }
    
    // Perform assessment
    const assessment = await symptomAssessmentService.assessSymptoms(input);
    
    // Save assessment to database
    await symptomAssessmentService.saveAssessment(assessment, input);
    
    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error assessing symptoms:', error);
    res.status(500).json({
      error: 'Failed to assess symptoms',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/health/assessment/:assessmentId/outcome
 * Record outcome feedback for an assessment
 */
router.post('/assessment/:assessmentId/outcome', async (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.params;
    const { outcome, notes } = req.body;
    
    if (!outcome) {
      return res.status(400).json({
        error: 'Outcome is required'
      });
    }
    
    const validOutcomes = ['improved', 'no_change', 'worsened', 'sought_medical_help', 'unknown'];
    if (!validOutcomes.includes(outcome)) {
      return res.status(400).json({
        error: `Invalid outcome. Must be one of: ${validOutcomes.join(', ')}`
      });
    }
    
    await symptomAssessmentService.recordOutcome(assessmentId, outcome, notes);
    
    res.json({
      success: true,
      message: 'Outcome recorded successfully'
    });
  } catch (error) {
    console.error('Error recording outcome:', error);
    res.status(500).json({
      error: 'Failed to record outcome',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// FIRST AID PROTOCOL ENDPOINTS
// ============================================================================

/**
 * GET /api/health/first-aid/protocols
 * Get all first aid protocols (for offline caching)
 */
router.get('/first-aid/protocols', (req: Request, res: Response) => {
  try {
    const { severity, offline } = req.query;
    
    let protocols;
    
    if (offline === 'true') {
      // Get high-priority protocols for offline caching
      protocols = firstAidProtocolService.getOfflineProtocols();
    } else if (severity) {
      // Filter by severity
      protocols = firstAidProtocolService.getProtocolsBySeverity(severity as string);
    } else {
      // Get all protocols
      protocols = firstAidProtocolService.getAllProtocols();
    }
    
    res.json({
      success: true,
      data: protocols,
      count: protocols.length
    });
  } catch (error) {
    console.error('Error fetching first aid protocols:', error);
    res.status(500).json({
      error: 'Failed to fetch first aid protocols',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/health/first-aid/protocols/:protocolId
 * Get specific first aid protocol by ID
 */
router.get('/first-aid/protocols/:protocolId', (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params;
    
    const protocol = firstAidProtocolService.getProtocolById(protocolId);
    
    if (!protocol) {
      return res.status(404).json({
        error: 'Protocol not found'
      });
    }
    
    res.json({
      success: true,
      data: protocol
    });
  } catch (error) {
    console.error('Error fetching first aid protocol:', error);
    res.status(500).json({
      error: 'Failed to fetch first aid protocol',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/health/first-aid/search
 * Search first aid protocols by emergency type
 */
router.get('/first-aid/search', (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: 'Search query (q) is required'
      });
    }
    
    const protocols = firstAidProtocolService.searchByEmergencyType(q as string);
    
    res.json({
      success: true,
      data: protocols,
      count: protocols.length
    });
  } catch (error) {
    console.error('Error searching first aid protocols:', error);
    res.status(500).json({
      error: 'Failed to search first aid protocols',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// EMERGENCY CONTACTS ENDPOINT
// ============================================================================

/**
 * GET /api/health/emergency-contacts
 * Get emergency contact information based on location
 */
router.get('/emergency-contacts', (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.query;
    
    // This would integrate with a database of health facilities
    // For now, return basic emergency contacts
    const emergencyContacts = {
      ambulance: '108',
      nationalEmergency: '112',
      poisonControl: '1800-11-4477',
      womenHelpline: '1091',
      childHelpline: '1098',
      nearestHospitals: [
        {
          name: 'Primary Health Center',
          type: 'PHC',
          distance: 'Location-based (to be implemented)',
          phone: 'To be determined',
          address: 'To be determined',
          services: ['Emergency', 'OPD', 'Maternity']
        }
      ]
    };
    
    res.json({
      success: true,
      data: emergencyContacts
    });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({
      error: 'Failed to fetch emergency contacts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// HEALTH PROFILE ENDPOINTS
// ============================================================================

/**
 * GET /api/health/profile/:userId
 * Get user's health profile
 */
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // This would query the health_profiles table
    // For now, return placeholder
    res.json({
      success: true,
      message: 'Health profile endpoint - to be implemented with database'
    });
  } catch (error) {
    console.error('Error fetching health profile:', error);
    res.status(500).json({
      error: 'Failed to fetch health profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/health/profile
 * Create or update user's health profile
 */
router.post('/profile', async (req: Request, res: Response) => {
  try {
    const profileData = req.body;
    
    // Validate required fields
    if (!profileData.userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }
    
    // This would insert/update in health_profiles table
    // For now, return placeholder
    res.json({
      success: true,
      message: 'Health profile saved - to be implemented with database'
    });
  } catch (error) {
    console.error('Error saving health profile:', error);
    res.status(500).json({
      error: 'Failed to save health profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
