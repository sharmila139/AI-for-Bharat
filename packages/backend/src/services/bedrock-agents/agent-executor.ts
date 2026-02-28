import { getBedrockService } from '../bedrock';

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (params: any) => Promise<any>;
}

export interface AgentTask {
  goal: string;
  context?: Record<string, any>;
  maxSteps?: number;
}

export interface AgentStep {
  step: number;
  thought: string;
  action: string;
  actionInput: any;
  observation: string;
}

export interface AgentResult {
  success: boolean;
  result: string;
  steps: AgentStep[];
  totalSteps: number;
}

export class AgentExecutor {
  private bedrock = getBedrockService();
  private tools: Map<string, AgentTool> = new Map();

  /**
   * Register a tool for the agent to use
   */
  registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Execute a multi-step task
   */
  async executeTask(task: AgentTask): Promise<AgentResult> {
    const maxSteps = task.maxSteps || 10;
    const steps: AgentStep[] = [];
    let currentStep = 0;

    // Build tool descriptions for the agent
    const toolDescriptions = this.buildToolDescriptions();

    while (currentStep < maxSteps) {
      currentStep++;

      // Generate next action
      const prompt = this.buildPrompt(task, steps, toolDescriptions);
      const response = await this.bedrock.generateWithCache(prompt, {
        modelType: 'sonnet',
        useCache: false,
      });

      // Parse agent response
      const parsed = this.parseAgentResponse(response.text);

      if (parsed.action === 'FINISH') {
        return {
          success: true,
          result: parsed.actionInput.answer || parsed.thought,
          steps,
          totalSteps: currentStep,
        };
      }

      // Execute the action
      const observation = await this.executeAction(parsed.action, parsed.actionInput);

      steps.push({
        step: currentStep,
        thought: parsed.thought,
        action: parsed.action,
        actionInput: parsed.actionInput,
        observation,
      });

      // Check if we should stop
      if (observation.includes('ERROR') || observation.includes('FAILED')) {
        return {
          success: false,
          result: `Task failed at step ${currentStep}: ${observation}`,
          steps,
          totalSteps: currentStep,
        };
      }
    }

    return {
      success: false,
      result: `Task exceeded maximum steps (${maxSteps})`,
      steps,
      totalSteps: currentStep,
    };
  }

  /**
   * Build prompt for agent reasoning
   */
  private buildPrompt(task: AgentTask, steps: AgentStep[], toolDescriptions: string): string {
    const previousSteps = steps
      .map(
        (s) => `Step ${s.step}:
Thought: ${s.thought}
Action: ${s.action}
Action Input: ${JSON.stringify(s.actionInput)}
Observation: ${s.observation}`
      )
      .join('\n\n');

    return `You are an AI agent helping users with tasks in RuralConnect AI.

Available Tools:
${toolDescriptions}

Task: ${task.goal}
${task.context ? `Context: ${JSON.stringify(task.context)}` : ''}

${previousSteps ? `Previous Steps:\n${previousSteps}\n\n` : ''}

Think step by step about what to do next.

Respond in this exact format:
Thought: [your reasoning about what to do next]
Action: [tool name or FINISH]
Action Input: [JSON object with parameters]

If you have completed the task, use:
Action: FINISH
Action Input: {"answer": "your final answer"}`;
  }

  /**
   * Parse agent response into structured format
   */
  private parseAgentResponse(response: string): {
    thought: string;
    action: string;
    actionInput: any;
  } {
    const thoughtMatch = response.match(/Thought:\s*(.+?)(?=\nAction:)/s);
    const actionMatch = response.match(/Action:\s*(\w+)/);
    const inputMatch = response.match(/Action Input:\s*({.+})/s);

    const thought = thoughtMatch?.[1]?.trim() || 'No thought provided';
    const action = actionMatch?.[1]?.trim() || 'FINISH';
    let actionInput = {};

    if (inputMatch) {
      try {
        actionInput = JSON.parse(inputMatch[1]);
      } catch (e) {
        actionInput = { raw: inputMatch[1] };
      }
    }

    return { thought, action, actionInput };
  }

  /**
   * Execute a tool action
   */
  private async executeAction(action: string, input: any): Promise<string> {
    const tool = this.tools.get(action);

    if (!tool) {
      return `ERROR: Tool '${action}' not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`;
    }

    try {
      const result = await tool.execute(input);
      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (error: any) {
      return `ERROR: ${error.message}`;
    }
  }

  /**
   * Build tool descriptions for prompt
   */
  private buildToolDescriptions(): string {
    const descriptions: string[] = [];

    for (const [name, tool] of this.tools.entries()) {
      const params = Object.entries(tool.parameters)
        .map(([key, value]) => `  - ${key} (${value.type}${value.required ? ', required' : ''}): ${value.description}`)
        .join('\n');

      descriptions.push(`${name}: ${tool.description}
Parameters:
${params}`);
    }

    return descriptions.join('\n\n');
  }

  /**
   * Get registered tools
   */
  getTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }
}

// Singleton instance
let executorInstance: AgentExecutor | null = null;

export function getAgentExecutor(): AgentExecutor {
  if (!executorInstance) {
    executorInstance = new AgentExecutor();
  }
  return executorInstance;
}
