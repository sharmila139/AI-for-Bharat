/**
 * Interactive Simulations and Games Service
 * Handles simulation metadata, game mechanics, and progress tracking
 * 
 * Features:
 * - Simulation metadata management
 * - Game mechanics tracking
 * - Interactive element configuration
 * - Progress tracking for simulations
 * - Scoring and achievements
 */

import { Pool } from 'pg';

export interface Simulation {
  simulation_id?: string;
  content_id: string;
  simulation_type: 'physics' | 'chemistry' | 'biology' | 'math' | 'geography' | 'other';
  title: string;
  description: string;
  difficulty_level: 'easy' | 'medium' | 'hard' | 'advanced';
  estimated_duration_minutes: number;
  learning_objectives: string[];
  interactive_elements: InteractiveElement[];
  configuration: SimulationConfig;
}

export interface InteractiveElement {
  element_id: string;
  element_type: 'slider' | 'button' | 'input' | 'drag_drop' | 'click' | 'draw';
  label: string;
  description?: string;
  parameters: any;
  validation_rules?: any;
}

export interface SimulationConfig {
  initial_state: any;
  variables: Variable[];
  constraints: Constraint[];
  success_criteria: SuccessCriteria;
  hints?: Hint[];
}

export interface Variable {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array';
  initial_value: any;
  min_value?: number;
  max_value?: number;
  unit?: string;
}

export interface Constraint {
  constraint_id: string;
  description: string;
  rule: string; // Expression to evaluate
  error_message: string;
}

export interface SuccessCriteria {
  criteria_type: 'target_value' | 'range' | 'sequence' | 'time_based' | 'custom';
  target?: any;
  tolerance?: number;
  max_attempts?: number;
  time_limit_seconds?: number;
}

export interface Hint {
  hint_id: string;
  trigger_condition: string;
  hint_text: string;
  hint_type: 'text' | 'visual' | 'audio';
  cost_points?: number;
}

export interface Game {
  game_id?: string;
  content_id: string;
  game_type: 'quiz' | 'puzzle' | 'strategy' | 'adventure' | 'simulation';
  title: string;
  description: string;
  difficulty_level: 'easy' | 'medium' | 'hard' | 'advanced';
  max_score: number;
  time_limit_seconds?: number;
  levels: GameLevel[];
  mechanics: GameMechanics;
}

export interface GameLevel {
  level_number: number;
  level_name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  objectives: string[];
  max_score: number;
  unlock_criteria?: string;
}

export interface GameMechanics {
  scoring_rules: ScoringRule[];
  power_ups?: PowerUp[];
  achievements?: Achievement[];
  leaderboard_enabled: boolean;
}

export interface ScoringRule {
  action: string;
  points: number;
  multiplier?: number;
  conditions?: string;
}

export interface PowerUp {
  power_up_id: string;
  name: string;
  description: string;
  effect: string;
  duration_seconds?: number;
  cost_points?: number;
}

export interface Achievement {
  achievement_id: string;
  name: string;
  description: string;
  criteria: string;
  points: number;
  badge_icon?: string;
}

export interface SimulationProgress {
  progress_id?: string;
  student_id: string;
  simulation_id: string;
  attempts: number;
  completed: boolean;
  best_score: number;
  completion_time_seconds?: number;
  hints_used: number;
  last_state: any;
  started_at: Date;
  completed_at?: Date;
}

export interface GameProgress {
  progress_id?: string;
  student_id: string;
  game_id: string;
  current_level: number;
  total_score: number;
  levels_completed: number[];
  achievements_earned: string[];
  power_ups_collected: string[];
  last_played_at: Date;
}

export class InteractiveSimulationsService {
  constructor(private pool: Pool) {}

  /**
   * Create a new simulation
   */
  async createSimulation(simulation: Simulation): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO simulations (
        content_id, simulation_type, title, description, difficulty_level,
        estimated_duration_minutes, learning_objectives, interactive_elements, configuration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING simulation_id`,
      [
        simulation.content_id,
        simulation.simulation_type,
        simulation.title,
        simulation.description,
        simulation.difficulty_level,
        simulation.estimated_duration_minutes,
        simulation.learning_objectives,
        JSON.stringify(simulation.interactive_elements),
        JSON.stringify(simulation.configuration)
      ]
    );

    return result.rows[0].simulation_id;
  }

  /**
   * Get simulation by ID
   */
  async getSimulationById(simulation_id: string): Promise<Simulation | null> {
    const result = await this.pool.query(
      'SELECT * FROM simulations WHERE simulation_id = $1',
      [simulation_id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      interactive_elements: row.interactive_elements,
      configuration: row.configuration
    };
  }

  /**
   * Get simulations by content
   */
  async getSimulationsByContent(content_id: string): Promise<Simulation[]> {
    const result = await this.pool.query(
      'SELECT * FROM simulations WHERE content_id = $1',
      [content_id]
    );

    return result.rows.map(row => ({
      ...row,
      interactive_elements: row.interactive_elements,
      configuration: row.configuration
    }));
  }

  /**
   * Create a new game
   */
  async createGame(game: Game): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO games (
        content_id, game_type, title, description, difficulty_level,
        max_score, time_limit_seconds, levels, mechanics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING game_id`,
      [
        game.content_id,
        game.game_type,
        game.title,
        game.description,
        game.difficulty_level,
        game.max_score,
        game.time_limit_seconds,
        JSON.stringify(game.levels),
        JSON.stringify(game.mechanics)
      ]
    );

    return result.rows[0].game_id;
  }

  /**
   * Get game by ID
   */
  async getGameById(game_id: string): Promise<Game | null> {
    const result = await this.pool.query(
      'SELECT * FROM games WHERE game_id = $1',
      [game_id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      levels: row.levels,
      mechanics: row.mechanics
    };
  }

  /**
   * Start simulation session
   */
  async startSimulation(
    student_id: string,
    simulation_id: string
  ): Promise<string> {
    // Get simulation config
    const simulation = await this.getSimulationById(simulation_id);
    if (!simulation) {
      throw new Error('Simulation not found');
    }

    // Check for existing progress
    const existingProgress = await this.pool.query(
      `SELECT progress_id FROM simulation_progress 
       WHERE student_id = $1 AND simulation_id = $2 AND completed = FALSE`,
      [student_id, simulation_id]
    );

    if (existingProgress.rows.length > 0) {
      return existingProgress.rows[0].progress_id;
    }

    // Create new progress record
    const result = await this.pool.query(
      `INSERT INTO simulation_progress (
        student_id, simulation_id, attempts, completed, best_score,
        hints_used, last_state, started_at
      ) VALUES ($1, $2, 1, FALSE, 0, 0, $3, CURRENT_TIMESTAMP)
      RETURNING progress_id`,
      [student_id, simulation_id, JSON.stringify(simulation.configuration.initial_state)]
    );

    return result.rows[0].progress_id;
  }

  /**
   * Update simulation progress
   */
  async updateSimulationProgress(
    progress_id: string,
    updates: {
      current_state?: any;
      score?: number;
      hints_used?: number;
      completed?: boolean;
      completion_time_seconds?: number;
    }
  ): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.current_state !== undefined) {
      updateFields.push(`last_state = $${paramIndex}`);
      values.push(JSON.stringify(updates.current_state));
      paramIndex++;
    }

    if (updates.score !== undefined) {
      updateFields.push(`best_score = GREATEST(best_score, $${paramIndex})`);
      values.push(updates.score);
      paramIndex++;
    }

    if (updates.hints_used !== undefined) {
      updateFields.push(`hints_used = $${paramIndex}`);
      values.push(updates.hints_used);
      paramIndex++;
    }

    if (updates.completed !== undefined) {
      updateFields.push(`completed = $${paramIndex}`);
      values.push(updates.completed);
      paramIndex++;
      
      if (updates.completed) {
        updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
      }
    }

    if (updates.completion_time_seconds !== undefined) {
      updateFields.push(`completion_time_seconds = $${paramIndex}`);
      values.push(updates.completion_time_seconds);
      paramIndex++;
    }

    if (updateFields.length > 0) {
      values.push(progress_id);
      await this.pool.query(
        `UPDATE simulation_progress 
         SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE progress_id = $${paramIndex}`,
        values
      );
    }
  }

  /**
   * Get simulation progress
   */
  async getSimulationProgress(
    student_id: string,
    simulation_id: string
  ): Promise<SimulationProgress | null> {
    const result = await this.pool.query(
      `SELECT * FROM simulation_progress 
       WHERE student_id = $1 AND simulation_id = $2
       ORDER BY started_at DESC LIMIT 1`,
      [student_id, simulation_id]
    );

    if (result.rows.length === 0) return null;

    return result.rows[0];
  }

  /**
   * Start game session
   */
  async startGame(student_id: string, game_id: string): Promise<string> {
    // Check for existing progress
    const existingProgress = await this.pool.query(
      `SELECT progress_id FROM game_progress 
       WHERE student_id = $1 AND game_id = $2`,
      [student_id, game_id]
    );

    if (existingProgress.rows.length > 0) {
      // Update last played
      await this.pool.query(
        `UPDATE game_progress SET last_played_at = CURRENT_TIMESTAMP 
         WHERE progress_id = $1`,
        [existingProgress.rows[0].progress_id]
      );
      return existingProgress.rows[0].progress_id;
    }

    // Create new progress record
    const result = await this.pool.query(
      `INSERT INTO game_progress (
        student_id, game_id, current_level, total_score,
        levels_completed, achievements_earned, power_ups_collected, last_played_at
      ) VALUES ($1, $2, 1, 0, ARRAY[]::INTEGER[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], CURRENT_TIMESTAMP)
      RETURNING progress_id`,
      [student_id, game_id]
    );

    return result.rows[0].progress_id;
  }

  /**
   * Update game progress
   */
  async updateGameProgress(
    progress_id: string,
    updates: {
      current_level?: number;
      score_delta?: number;
      level_completed?: number;
      achievement_earned?: string;
      power_up_collected?: string;
    }
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      if (updates.current_level !== undefined) {
        await client.query(
          `UPDATE game_progress SET current_level = $1, last_played_at = CURRENT_TIMESTAMP 
           WHERE progress_id = $2`,
          [updates.current_level, progress_id]
        );
      }

      if (updates.score_delta !== undefined) {
        await client.query(
          `UPDATE game_progress SET total_score = total_score + $1, last_played_at = CURRENT_TIMESTAMP 
           WHERE progress_id = $2`,
          [updates.score_delta, progress_id]
        );
      }

      if (updates.level_completed !== undefined) {
        await client.query(
          `UPDATE game_progress 
           SET levels_completed = array_append(levels_completed, $1),
               last_played_at = CURRENT_TIMESTAMP
           WHERE progress_id = $2 AND NOT ($1 = ANY(levels_completed))`,
          [updates.level_completed, progress_id]
        );
      }

      if (updates.achievement_earned) {
        await client.query(
          `UPDATE game_progress 
           SET achievements_earned = array_append(achievements_earned, $1),
               last_played_at = CURRENT_TIMESTAMP
           WHERE progress_id = $2 AND NOT ($1 = ANY(achievements_earned))`,
          [updates.achievement_earned, progress_id]
        );
      }

      if (updates.power_up_collected) {
        await client.query(
          `UPDATE game_progress 
           SET power_ups_collected = array_append(power_ups_collected, $1),
               last_played_at = CURRENT_TIMESTAMP
           WHERE progress_id = $2`,
          [updates.power_up_collected, progress_id]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get game progress
   */
  async getGameProgress(student_id: string, game_id: string): Promise<GameProgress | null> {
    const result = await this.pool.query(
      `SELECT * FROM game_progress 
       WHERE student_id = $1 AND game_id = $2`,
      [student_id, game_id]
    );

    if (result.rows.length === 0) return null;

    return result.rows[0];
  }

  /**
   * Get leaderboard for a game
   */
  async getGameLeaderboard(
    game_id: string,
    limit: number = 10
  ): Promise<Array<{ student_id: string; total_score: number; rank: number }>> {
    const result = await this.pool.query(
      `SELECT student_id, total_score,
              RANK() OVER (ORDER BY total_score DESC) as rank
       FROM game_progress
       WHERE game_id = $1
       ORDER BY total_score DESC
       LIMIT $2`,
      [game_id, limit]
    );

    return result.rows;
  }

  /**
   * Get simulation statistics
   */
  async getSimulationStatistics(simulation_id: string): Promise<{
    total_attempts: number;
    completion_rate: number;
    average_score: number;
    average_time_seconds: number;
    average_hints_used: number;
  }> {
    const result = await this.pool.query(
      `SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_count,
        AVG(best_score) as avg_score,
        AVG(completion_time_seconds) as avg_time,
        AVG(hints_used) as avg_hints
       FROM simulation_progress
       WHERE simulation_id = $1`,
      [simulation_id]
    );

    const row = result.rows[0];
    const totalAttempts = parseInt(row.total_attempts);
    const completedCount = parseInt(row.completed_count);

    return {
      total_attempts: totalAttempts,
      completion_rate: totalAttempts > 0 ? (completedCount / totalAttempts) * 100 : 0,
      average_score: parseFloat(row.avg_score) || 0,
      average_time_seconds: parseFloat(row.avg_time) || 0,
      average_hints_used: parseFloat(row.avg_hints) || 0
    };
  }
}
