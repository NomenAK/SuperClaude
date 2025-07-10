/**
 * TypeScript declarations for tree-sitter
 */

declare module 'tree-sitter' {
  export interface Point {
    row: number;
    column: number;
  }

  export interface Range {
    startPosition: Point;
    endPosition: Point;
    startIndex: number;
    endIndex: number;
  }

  export interface Edit {
    startIndex: number;
    oldEndIndex: number;
    newEndIndex: number;
    startPosition: Point;
    oldEndPosition: Point;
    newEndPosition: Point;
  }

  export interface SyntaxNode {
    readonly type: string;
    readonly typeId: number;
    readonly isNamed: boolean;
    readonly text: string;
    readonly startPosition: Point;
    readonly endPosition: Point;
    readonly startIndex: number;
    readonly endIndex: number;
    readonly parent: SyntaxNode | null;
    readonly children: SyntaxNode[];
    readonly namedChildren: SyntaxNode[];
    readonly childCount: number;
    readonly namedChildCount: number;
    readonly firstChild: SyntaxNode | null;
    readonly firstNamedChild: SyntaxNode | null;
    readonly lastChild: SyntaxNode | null;
    readonly lastNamedChild: SyntaxNode | null;
    readonly nextSibling: SyntaxNode | null;
    readonly nextNamedSibling: SyntaxNode | null;
    readonly previousSibling: SyntaxNode | null;
    readonly previousNamedSibling: SyntaxNode | null;

    child(index: number): SyntaxNode | null;
    namedChild(index: number): SyntaxNode | null;
    childForFieldName(fieldName: string): SyntaxNode | null;
    childForFieldId(fieldId: number): SyntaxNode | null;
    fieldNameForChild(childIndex: number): string | null;
    childrenForFieldName(fieldName: string): SyntaxNode[];
    childrenForFieldId(fieldId: number): SyntaxNode[];
    descendantForIndex(index: number): SyntaxNode;
    descendantForIndex(startIndex: number, endIndex: number): SyntaxNode;
    namedDescendantForIndex(index: number): SyntaxNode;
    namedDescendantForIndex(startIndex: number, endIndex: number): SyntaxNode;
    descendantForPosition(position: Point): SyntaxNode;
    descendantForPosition(startPosition: Point, endPosition: Point): SyntaxNode;
    namedDescendantForPosition(position: Point): SyntaxNode;
    namedDescendantForPosition(startPosition: Point, endPosition: Point): SyntaxNode;
    walk(): TreeCursor;
    toString(): string;
  }

  export interface TreeCursor {
    readonly nodeType: string;
    readonly nodeTypeId: number;
    readonly nodeIsNamed: boolean;
    readonly nodeText: string;
    readonly nodeId: number;
    readonly startPosition: Point;
    readonly endPosition: Point;
    readonly startIndex: number;
    readonly endIndex: number;
    currentNode(): SyntaxNode;
    reset(node: SyntaxNode): void;
    gotoParent(): boolean;
    gotoFirstChild(): boolean;
    gotoFirstChildForIndex(index: number): boolean;
    gotoNextSibling(): boolean;
  }

  export interface Tree {
    readonly rootNode: SyntaxNode;
    copy(): Tree;
    edit(edit: Edit): void;
    walk(): TreeCursor;
    getChangedRanges(other: Tree): Range[];
    getEditedRange(other: Tree): Range;
  }

  export interface Language {
    readonly version: number;
    readonly fieldCount: number;
    readonly nodeTypeCount: number;
    fieldNameForId(fieldId: number): string | null;
    fieldIdForName(fieldName: string): number | null;
    idForNodeType(type: string, named: boolean): number;
    nodeTypeForId(typeId: number): string | null;
    nodeTypeIsNamed(typeId: number): boolean;
    nodeTypeIsVisible(typeId: number): boolean;
  }

  export interface QueryCapture {
    name: string;
    node: SyntaxNode;
  }

  export interface QueryMatch {
    pattern: number;
    captures: QueryCapture[];
  }

  export interface Query {
    matches(node: SyntaxNode): QueryMatch[];
    captures(node: SyntaxNode): QueryCapture[];
  }

  export interface Parser {
    parse(input: string | Input, oldTree?: Tree): Tree;
    getLanguage(): Language | null;
    setLanguage(language: Language | null): void;
    getTimeoutMicros(): number;
    setTimeoutMicros(timeout: number): void;
    reset(): void;
    getIncludedRanges(): Range[];
    setIncludedRanges(ranges: Range[]): void;
  }

  export interface Input {
    (index: number, position?: Point): string | null;
  }

  export interface ParserOptions {
    includedRanges?: Range[];
  }

  class Parser {
    constructor();
    parse(input: string | Input, oldTree?: Tree): Tree;
    getLanguage(): Language | null;
    setLanguage(language: Language | null): void;
    getTimeoutMicros(): number;
    setTimeoutMicros(timeout: number): void;
    reset(): void;
    getIncludedRanges(): Range[];
    setIncludedRanges(ranges: Range[]): void;
  }

  export default Parser;
}

declare module 'tree-sitter-cpp' {
  import { Language } from 'tree-sitter';
  const language: Language;
  export default language;
}
