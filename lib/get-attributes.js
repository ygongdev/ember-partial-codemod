/**
  Reference: https://github.com/glimmerjs/glimmer-vm/blob/master/packages/%40glimmer/syntax/lib/types/nodes.ts

  Glimmer VM Node AST

  Program: Program;
  Template: Template;
  Block: Block;
  CommentStatement: CommentStatement;
  MustacheCommentStatement: MustacheCommentStatement;
  TextNode: TextNode;
  PathExpression: PathExpression;
  StringLiteral: StringLiteral;
  BooleanLiteral: BooleanLiteral;
  NumberLiteral: NumberLiteral;
  NullLiteral: NullLiteral;
  UndefinedLiteral: UndefinedLiteral;
  MustacheStatement: MustacheStatement;
  BlockStatement: BlockStatement;
  ElementModifierStatement: ElementModifierStatement;
  PartialStatement: PartialStatement;
  ElementNode: ElementNode;
  AttrNode: AttrNode;
  ConcatStatement: ConcatStatement;
  SubExpression: SubExpression;
  Hash: Hash;
  HashPair: HashPair;
 */
const { parse } = require("ember-template-recast");
const { traverse, } = require("@glimmer/syntax");
const DELIMITERS = require("../lib/constant/delimiters");

const EMBER_TEMPLATE_HELPERS = [
  // "action",
  "array",
  "component",
  "concat",
  "debugger",
  "each",
  "each-in",
  "fn",
  "get",
  "hasBlock",
  "hasBlockParams",
  "hash",
  "if",
  "input",
  "let",
  "link-to",
  "loc",
  "log",
  "mount",
  "mut",
  "on",
  "outlet",
  // "partial",
  "query-params",
  "textarea",
  "unbound",
  "unless",
  "with",
  "yield",
];

/**
 * Given a `source`, parse it and extract all of the `attributes` and `actions`.
 * TODO: Make sure this logic works for all scenarios.
 *
 * @param {String} source
 * @returns {Object} containing `attributes` and `actions`.
 */
function getAttributes(source) {

  const attributes = new Set();
  const ast = parse(source);
  const excludeAttributes = new Set(EMBER_TEMPLATE_HELPERS);
  const actions = new Set();
  const partials = new Set();

  traverse(ast, {
    BlockStatement(node) {
      if (node.program && node.program.blockParams && node.program.blockParams.length > 0) {
        // Exclude block params from being counted as a consuming attribute.
        // e.g `bar` from {{#foo as |bar|}}{{/foo}}
        node.program.blockParams.forEach(param => excludeAttributes.add(param));
      }
      excludeAttributes.add(node.path.original);
    },

    MustacheStatement(node) {
      // e.g foo={{action "..."}}
      if (node.path.original === "action") {
        // add string literals, recursively.
        getActionsRecursive(node);
        return;
      }

      // e.g {{partial ...}}
      if (node.path.original === "partial") {
        if (node.params && node.params.length > 0 && node.params[0].type === "StringLiteral") {
          // Grab the first partial string
          // e.g {{partial "string"}} <- add string
          partials.add(node.params[0].original);
          return;
        }
      }

      if ((node.hash && node.hash.pairs.length > 0) || (node.params && node.params.length > 0)) {
        excludeAttributes.add(node.path.original);
      }
    },

    HashPair(node) {
      // Search for any `actions` within the params.
      if (node.value.type === "SubExpression" && node.value.path && node.value.path.original === "action") {
        getActionsRecursive(node.value);
      }
    },

    PathExpression(node) {
      // Don't add `action` and `partial` strings.
      // e.g, {{action}}, {{partial}}
      if (node.original === "action") {
        return;
      }
      if (node.original === "partial") {
        return;
      }

      // Don't add if it is 100% a component invocation.
      // e.g, {{component::foo/bar}}, {{foo/bar}}
      const moduleDelimiters = [...DELIMITERS, "/"];
      for (let i = 0; i < moduleDelimiters.length; i++) {
        if (node.original.includes(moduleDelimiters[i])) {
          return;
        }
      };

      attributes.add(node.parts[0]);
    },

    // Search for `actions` that are subexpressions
    // e.g, {{foo bar=(if baz (action "baz") (action "fizz"))}}
    SubExpression(node) {
      if (node.path.original === "action" && node.params && node.params.length > 0) {
        getActionsRecursive(node);
      }
    }
  });

  /**
   * Recursively extract all the `actions`.
   * @param {Node} node
   */
  function getActionsRecursive(node) {
    if (node.type === "StringLiteral") {
      actions.add(node.value);
    }
    if (!node.path) {
      return;
    }
    if (node.params && node.params.length > 0) {
      node.params.forEach(paramNode => {
        getActionsRecursive(paramNode);
      });
    }
  }

  return {
    attributes: [...attributes].filter(attr => !excludeAttributes.has(attr)),
    actions: [...actions],
    partials: [...partials],
  };
}

module.exports = {
  getAttributes,
};
