import { PromptTemplate } from './templates';

export class PromptRenderer {
  /**
   * Render a prompt template with variables
   */
  static render(template: PromptTemplate, variables: Record<string, any>): string {
    let rendered = template.userPromptTemplate;

    // Replace all variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value || ''));
    }

    // Check for missing variables
    const missingVars = template.variables.filter((v) => !(v in variables));
    if (missingVars.length > 0) {
      console.warn(`Missing variables in prompt: ${missingVars.join(', ')}`);
    }

    return rendered;
  }

  /**
   * Render with system prompt
   */
  static renderWithSystem(template: PromptTemplate, variables: Record<string, any>): {
    systemPrompt: string;
    userPrompt: string;
  } {
    return {
      systemPrompt: template.systemPrompt,
      userPrompt: this.render(template, variables),
    };
  }

  /**
   * Validate variables
   */
  static validateVariables(template: PromptTemplate, variables: Record<string, any>): {
    valid: boolean;
    missing: string[];
  } {
    const missing = template.variables.filter((v) => !(v in variables));
    return {
      valid: missing.length === 0,
      missing,
    };
  }
}
