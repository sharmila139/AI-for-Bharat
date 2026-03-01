/**
 * Farm Profile API Endpoints
 * Manages farm profiles for users
 */

import { Request, Response, NextFunction } from 'express';
import { FarmProfileService } from '../services/agriculture/farm-profile';

const farmProfileService = new FarmProfileService();

/**
 * POST /api/farms
 * Create a new farm profile
 */
export async function createFarmProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId; // Assuming auth middleware sets req.user
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { farmName, location, landSize, soilType, irrigationType, currentCrops } = req.body;

    // Validate required fields
    if (!farmName || !location || !landSize) {
      res.status(400).json({
        error: 'Validation error',
        message: 'farmName, location, and landSize are required',
      });
      return;
    }

    const farmProfile = await farmProfileService.createFarmProfile({
      userId,
      farmName,
      location,
      landSize,
      soilType,
      irrigationType,
      currentCrops,
    });

    res.status(201).json(farmProfile);
  } catch (error) {
    console.error('Error creating farm profile:', error);
    next(error);
  }
}

/**
 * GET /api/farms
 * Get all farm profiles for the authenticated user
 */
export async function getUserFarms(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const farms = await farmProfileService.getUserFarms(userId);
    res.json({ farms });
  } catch (error) {
    console.error('Error getting user farms:', error);
    next(error);
  }
}

/**
 * GET /api/farms/:farmId
 * Get a specific farm profile
 */
export async function getFarmProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { farmId } = req.params;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const farm = await farmProfileService.getFarmProfile(userId, farmId);
    
    if (!farm) {
      res.status(404).json({ error: 'Farm profile not found' });
      return;
    }

    res.json(farm);
  } catch (error) {
    console.error('Error getting farm profile:', error);
    next(error);
  }
}

/**
 * PUT /api/farms/:farmId
 * Update a farm profile
 */
export async function updateFarmProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { farmId } = req.params;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const updates = req.body;
    
    // Remove fields that shouldn't be updated
    delete updates.userId;
    delete updates.farmId;
    delete updates.createdAt;

    const updatedFarm = await farmProfileService.updateFarmProfile(userId, farmId, updates);
    res.json(updatedFarm);
  } catch (error) {
    console.error('Error updating farm profile:', error);
    next(error);
  }
}

/**
 * DELETE /api/farms/:farmId
 * Delete a farm profile
 */
export async function deleteFarmProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { farmId } = req.params;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await farmProfileService.deleteFarmProfile(userId, farmId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting farm profile:', error);
    next(error);
  }
}

/**
 * Setup farm profile routes
 */
export function setupFarmProfileRoutes(router: any): void {
  router.post('/farms', createFarmProfile);
  router.get('/farms', getUserFarms);
  router.get('/farms/:farmId', getFarmProfile);
  router.put('/farms/:farmId', updateFarmProfile);
  router.delete('/farms/:farmId', deleteFarmProfile);
}
