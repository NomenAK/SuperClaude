import chalk from "chalk";
import { DatabaseService } from "@services/database-service.js";
import { CommandModel, PersonaModel, RuleModel, UnparsedFile } from "@database";
import { CommandModelSchema, PersonaModelSchema, RuleModelSchema } from "@schemas";

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

interface ReportNode {
  name: string;
  type: "category" | "item";
  valid: boolean;
  details?: string;
  children?: ReportNode[];
}

export class SyncReportGenerator {
  constructor(private readonly databaseService: DatabaseService) {}

  private validateCommand(command: CommandModel): ValidationResult {
    const result = CommandModelSchema.safeParse(command);
    if (result.success) {
      return { valid: true };
    }
    return {
      valid: false,
      errors: result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`),
    };
  }

  private validatePersona(persona: PersonaModel): ValidationResult {
    const result = PersonaModelSchema.safeParse(persona);
    if (result.success) {
      return { valid: true };
    }
    return {
      valid: false,
      errors: result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`),
    };
  }

  private validateRule(rule: RuleModel): ValidationResult {
    const result = RuleModelSchema.safeParse(rule);
    if (result.success) {
      return { valid: true };
    }
    return {
      valid: false,
      errors: result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`),
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().replace("T", " ").split(".")[0];
  }

  private renderTree(node: ReportNode, prefix = "", isLast = true): string {
    const lines: string[] = [];
    const connector = isLast ? "└── " : "├── ";
    const extension = isLast ? "    " : "│   ";

    const nodeText = node.valid ? chalk.green(node.name) : chalk.red(node.name);

    lines.push(
      prefix + connector + nodeText + (node.details ? chalk.gray(` (${node.details})`) : "")
    );

    if (node.children) {
      node.children.forEach((child, index) => {
        const isLastChild = index === node.children!.length - 1;
        lines.push(
          ...this.renderTree(child, prefix + extension, isLastChild)
            .split("\n")
            .filter(Boolean)
        );
      });
    }

    return lines.join("\n");
  }

  async generateReport(): Promise<string> {
    await this.databaseService.initialize();

    const commands = await this.databaseService.getAllCommands();
    const personas = await this.databaseService.getAllPersonas();
    const rules = await this.databaseService.getAllRules();
    const unparsedFiles = await this.databaseService.getUnparsedFiles();
    const lastSync = await this.databaseService.getLastSync();

    const report: string[] = [];

    // Header
    report.push(chalk.bold.cyan("\n📊 SuperClaude MCP Sync Report"));
    report.push(chalk.gray("─".repeat(50)));
    report.push(chalk.yellow(`Last Sync: ${this.formatDate(lastSync)}`));
    report.push("");

    // Build tree structure
    const root: ReportNode = {
      name: "SuperClaude Data",
      type: "category",
      valid: true,
      children: [],
    };

    // Commands section
    const commandsNode: ReportNode = {
      name: `Commands (${commands.length})`,
      type: "category",
      valid: true,
      children: [],
    };

    let invalidCommandCount = 0;
    commands.forEach(command => {
      const validation = this.validateCommand(command);
      if (!validation.valid) {
        invalidCommandCount++;
        commandsNode.valid = false;
      }

      const hasArgs = command.arguments && command.arguments.length > 0;
      const details = [
        hasArgs ? `${command.arguments!.length} args` : "no args",
        `hash: ${command.hash.substring(0, 8)}...`,
      ].join(", ");

      commandsNode.children!.push({
        name: command.name,
        type: "item",
        valid: validation.valid,
        details,
      });
    });

    if (invalidCommandCount > 0) {
      commandsNode.name += chalk.red(` [${invalidCommandCount} invalid]`);
    }

    root.children!.push(commandsNode);

    // Personas section
    const personasNode: ReportNode = {
      name: `Personas (${personas.length})`,
      type: "category",
      valid: true,
      children: [],
    };

    let invalidPersonaCount = 0;
    personas.forEach(persona => {
      const validation = this.validatePersona(persona);
      if (!validation.valid) {
        invalidPersonaCount++;
        personasNode.valid = false;
      }

      const details = `hash: ${persona.hash.substring(0, 8)}...`;

      personasNode.children!.push({
        name: `${persona.name} (${persona.id})`,
        type: "item",
        valid: validation.valid,
        details,
      });
    });

    if (invalidPersonaCount > 0) {
      personasNode.name += chalk.red(` [${invalidPersonaCount} invalid]`);
    }

    root.children!.push(personasNode);

    // Rules section
    const rulesNode: ReportNode = {
      name: `Rules (${rules.length})`,
      type: "category",
      valid: true,
      children: [],
    };

    let invalidRulesCount = 0;
    rules.forEach(rule => {
      const validation = this.validateRule(rule);
      if (!validation.valid) {
        invalidRulesCount++;
        rulesNode.valid = false;
      }

      const details = `hash: ${rule.hash.substring(0, 8)}...`;

      rulesNode.children!.push({
        name: rule.name,
        type: "item",
        valid: validation.valid,
        details,
      });
    });

    if (invalidRulesCount > 0) {
      rulesNode.name += chalk.red(` [${invalidRulesCount} invalid]`);
    }

    root.children!.push(rulesNode);

    // Unparsed files section
    if (unparsedFiles.length > 0) {
      const unparsedNode: ReportNode = {
        name: chalk.yellow(`Unparsed Files (${unparsedFiles.length})`),
        type: "category",
        valid: false,
        children: [],
      };

      unparsedFiles.forEach(file => {
        const source = file.source ? `[${file.source}]` : "";
        const errorPreview =
          file.error.length > 50 ? file.error.substring(0, 50) + "..." : file.error;

        unparsedNode.children!.push({
          name: file.path,
          type: "item",
          valid: false,
          details: `${source} ${errorPreview}`,
        });
      });

      root.children!.push(unparsedNode);
    }

    // Render tree
    report.push(this.renderTree(root, "", true));

    // Summary
    report.push("");
    report.push(chalk.gray("─".repeat(50)));
    report.push(chalk.bold("Summary:"));
    report.push(`  ${chalk.cyan("Total Commands:")} ${commands.length}`);
    report.push(`  ${chalk.cyan("Total Personas:")} ${personas.length}`);

    report.push(`  ${chalk.cyan("Total Rules:")} ${rules.length}`);

    const totalInvalid = invalidCommandCount + invalidPersonaCount + invalidRulesCount;
    if (totalInvalid > 0) {
      report.push(`  ${chalk.red("Invalid Items:")} ${totalInvalid}`);
    } else {
      report.push(`  ${chalk.green("All items valid")} ✓`);
    }

    if (unparsedFiles.length > 0) {
      report.push(`  ${chalk.yellow("Unparsed Files:")} ${unparsedFiles.length}`);
    }

    report.push("");

    return report.join("\n");
  }

  async generateDetailedReport(): Promise<string> {
    await this.databaseService.initialize();

    const commands = await this.databaseService.getAllCommands();
    const personas = await this.databaseService.getAllPersonas();
    const rules = await this.databaseService.getAllRules();
    const unparsedFiles = await this.databaseService.getUnparsedFiles();

    const report: string[] = [];

    report.push(chalk.bold.cyan("\n📊 SuperClaude MCP Detailed Sync Report"));
    report.push(chalk.gray("═".repeat(80)));

    // Commands with validation
    report.push("\n" + chalk.bold.yellow("Commands:"));
    report.push(chalk.gray("─".repeat(80)));

    commands.forEach(command => {
      const validation = this.validateCommand(command);
      const status = validation.valid ? chalk.green("✓") : chalk.red("✗");

      report.push(`${status} ${chalk.bold(command.name)} (${command.id})`);
      report.push(`  Description: ${command.description}`);
      report.push(`  Last Updated: ${this.formatDate(command.lastUpdated)}`);
      report.push(`  Hash: ${command.hash}`);

      if (command.arguments && command.arguments.length > 0) {
        report.push(`  Arguments:`);
        command.arguments.forEach(arg => {
          const required = arg.required ? chalk.red("*") : "";
          report.push(`    - ${arg.name}${required}: ${arg.description}`);
        });
      }

      if (!validation.valid && validation.errors) {
        report.push(chalk.red(`  Validation Errors:`));
        validation.errors.forEach(error => {
          report.push(chalk.red(`    - ${error}`));
        });
      }

      report.push("");
    });

    // Personas with validation
    report.push(chalk.bold.yellow("Personas:"));
    report.push(chalk.gray("─".repeat(80)));

    personas.forEach(persona => {
      const validation = this.validatePersona(persona);
      const status = validation.valid ? chalk.green("✓") : chalk.red("✗");

      report.push(`${status} ${chalk.bold(persona.name)} (${persona.id})`);
      report.push(`  Description: ${persona.description}`);
      report.push(`  Last Updated: ${this.formatDate(persona.lastUpdated)}`);
      report.push(`  Hash: ${persona.hash}`);
      report.push(`  Instructions: ${persona.instructions.substring(0, 100)}...`);

      if (!validation.valid && validation.errors) {
        report.push(chalk.red(`  Validation Errors:`));
        validation.errors.forEach(error => {
          report.push(chalk.red(`    - ${error}`));
        });
      }

      report.push("");
    });

    // Rules with validation
    report.push(chalk.bold.yellow("Rules:"));
    report.push(chalk.gray("─".repeat(80)));

    if (rules.length > 0) {
      rules.forEach(rule => {
        const validation = this.validateRule(rule);
        const status = validation.valid ? chalk.green("✓") : chalk.red("✗");

        report.push(`${status} ${chalk.bold(rule.name)} (${rule.id})`);
        report.push(`  Last Updated: ${this.formatDate(rule.lastUpdated)}`);
        report.push(`  Hash: ${rule.hash}`);
        report.push(`  Content: ${rule.content.substring(0, 100)}...`);

        if (!validation.valid && validation.errors) {
          report.push(chalk.red(`  Validation Errors:`));
          validation.errors.forEach(error => {
            report.push(chalk.red(`    - ${error}`));
          });
        }

        report.push("");
      });
    } else {
      report.push(chalk.red("No rules loaded"));
    }

    // Unparsed files section
    if (unparsedFiles.length > 0) {
      report.push(chalk.bold.yellow("\nUnparsed Files:"));
      report.push(chalk.gray("─".repeat(80)));

      unparsedFiles.forEach(file => {
        const source = file.source ? `[${file.source}]` : "[unknown]";
        report.push(`${chalk.red("✗")} ${chalk.bold(file.path)} ${chalk.gray(source)}`);
        report.push(`  Timestamp: ${this.formatDate(file.timestamp)}`);
        report.push(`  Error: ${chalk.red(file.error)}`);
        report.push("");
      });
    }

    report.push("");

    return report.join("\n");
  }
}
