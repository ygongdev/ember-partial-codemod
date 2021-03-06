const chalk = require("chalk");
const { transform } = require("ember-template-recast");
const DELIMITERS = [
  "@", "$", "::"
]

function _buildHashPairs(attrs, b) {
  const pairs = [];

  // Builds attr=attr
  attrs.attributes.forEach(attr => {
    pairs.push(b.pair(attr, b.path(attr)));
  });

  // Builds action2=(action "action2")
  attrs.actions.forEach(action2 => {
    pairs.push(b.pair(action2, b.sexpr(b.path("action"), [b.literal("StringLiteral", action2)])));
  });

  return pairs;
}

function customPartialTransform(template, attributesMap, { replaceDelimiter = false } = {}) {
  let attributes = {};
  const { code } = transform(template, env => {
    let { builders: b } = env.syntax;

    return {
      MustacheStatement(node) {
        if (node.path.original === "partial" && node.params && node.params.length > 0  && node.params[0].type === "StringLiteral") {
          const value = node.params[0].value;
          if (value in attributesMap) {
            let moduleName = value;
            attributes = attributesMap[value];
            console.info(chalk.green(`Recasting ${value}`));
            if (replaceDelimiter) {
              DELIMITERS.forEach(delim =>
                moduleName = moduleName.replace(delim, replaceDelimiter)
              );
            }
            return b.mustache(b.path(value.replace('@', '$').replace('::', '$')), [], b.hash(_buildHashPairs(attributes, b)));
          }
        }
      },
    };
  });

  return {
    code,
    attributes
  };
}

module.exports = customPartialTransform;
