import { Command, Persona } from "@/schemas.js";
import { SuperClaudeRules } from "@types";
import { UnparsedFile } from "./base-source-loader.js";

export interface ISourceLoader {
  loadCommands(): Promise<Command[]>;
  loadPersonas(): Promise<Persona[]>;
  loadRules(): Promise<SuperClaudeRules>;
  clearCache(): void;
  loadSharedIncludes?(includes: string[]): Promise<string>;
  getUnparsedFiles?(): UnparsedFile[];
}
