import Handlebars from 'handlebars';

export class TemplateEngine {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers() {
    // Helper: Loop with index
    this.handlebars.registerHelper('eachWithIndex', function(context, options) {
      let ret = '';
      for (let i = 0; i < context.length; i++) {
        ret += options.fn({ ...context[i], index: i });
      }
      return ret;
    });

    // Helper: JSON stringify
    this.handlebars.registerHelper('json', function(context) {
      return JSON.stringify(context, null, 2);
    });

    // Helper: Join array
    this.handlebars.registerHelper('join', function(array, separator) {
      return array.join(separator);
    });

    // Helper: Add numbers
    this.handlebars.registerHelper('add', function(a, b) {
      return a + b;
    });
  }

  /**
   * Compile and render a template with variables
   */
  render(template: string, variables: Record<string, any>): string {
    const compiled = this.handlebars.compile(template);
    return compiled(variables);
  }

  /**
   * Validate that all required variables are present
   */
  validateVariables(template: string, providedVariables: Record<string, any>): {
    valid: boolean;
    missingVariables: string[];
  } {
    // Extract all {{variable}} patterns from template
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const matches = template.matchAll(variablePattern);
    const requiredVariables = new Set<string>();

    for (const match of matches) {
      const varName = match[1].trim().split('.')[0].split(' ')[0];
      // Skip Handlebars helpers
      if (!['#if', '#each', '#unless', '/if', '/each', '/unless', 'else', 'this', 'add', 'json', 'join', '@index'].includes(varName)) {
        requiredVariables.add(varName);
      }
    }

    const missingVariables = Array.from(requiredVariables).filter(
      (varName) => !(varName in providedVariables)
    );

    return {
      valid: missingVariables.length === 0,
      missingVariables,
    };
  }

  /**
   * Extract all variable names from a template
   */
  extractVariables(template: string): string[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const matches = template.matchAll(variablePattern);
    const variables = new Set<string>();

    for (const match of matches) {
      const varName = match[1].trim().split('.')[0].split(' ')[0];
      // Skip Handlebars helpers and keywords
      if (!['#if', '#each', '#unless', '/if', '/each', '/unless', 'else', 'this', 'add', 'json', 'join', '@index'].includes(varName)) {
        variables.add(varName);
      }
    }

    return Array.from(variables);
  }
}
