/**
 * Forked and heavily modified from https://github.com/akameco/babel-plugin-react-intl-auto
 * License: https://github.com/akameco/babel-plugin-react-intl-auto/blob/master/license
 */
import * as t from '@babel/types';

export default function() {
  return {
    name: 'react-intl-wrapper',
    visitor: {
      JSXElement: (path, state) => {
        const jsxOpeningElement = path.get('openingElement');

        if (t.isJSXIdentifier(jsxOpeningElement.node.name) && jsxOpeningElement.node.name.name === 'F') {
          const attributesPath = jsxOpeningElement.get('attributes');
          const id = attributesPath.find(attrPath => attrPath.node.name && attrPath.node.name.name === 'id');
          const msg = attributesPath.find(attrPath => attrPath.node.name && attrPath.node.name.name === 'msg');
          const desc = attributesPath.find(attrPath => attrPath.node.name && attrPath.node.name.name === 'description');

          if (!id && msg) {
            const idValue = getId(msg.get('value').node.value, desc && desc.get('value').node.value);
            msg.insertBefore(t.jsxAttribute(t.jsxIdentifier('id'), t.stringLiteral(idValue)));
          }
          const msgValue = msg.get('value').node.value;
          msg.insertBefore(t.jsxAttribute(t.jsxIdentifier('defaultMessage'), t.stringLiteral(msgValue)));
        }
      },

      CallExpression(path, state) {
        const callee = path.get('callee');
        if (!(callee.isIdentifier() && callee.node.name === 'defineMessages') || !path.get('arguments.0')) {
          return;
        }

        const argPath = path.get('arguments.0');
        const properties = argPath.get('properties');

        if (!properties) {
          return;
        }

        for (const prop of properties) {
          const objectValuePath = prop.get('value');
          const objectKeyPath = prop.get('key');
          if (Array.isArray(objectKeyPath)) {
            return;
          }

          const messageDescriptorProperties = [];
          const objProps = objectValuePath.get('properties');

          let literalObject = {};
          objProps.forEach(v => {
            const keyPath = v.get('key');
            literalObject[keyPath.node.name] = v.get('value').node.value;
          });

          if (!literalObject['id']) {
            const id = getId(literalObject['msg'], literalObject['description']);
            messageDescriptorProperties.push(t.objectProperty(t.stringLiteral('id'), t.stringLiteral(id)));
          }
          messageDescriptorProperties.push(
            t.objectProperty(t.stringLiteral('defaultMessage'), t.stringLiteral(literalObject['msg']))
          );

          messageDescriptorProperties.push(...objProps.map(v => v.node));
          objectValuePath.replaceWith(t.objectExpression(messageDescriptorProperties));
        }
      },
    },
  };
}

// NOTE: This is in sync with i18n/index.js id generation.
function getId(msg = '', description = '') {
  const scrubbedMsg = msg.replace(/\W/g, '_');
  const scrubbedDesc = description.replace(/\W/g, '_');

  return scrubbedMsg + (scrubbedDesc ? '___' : '') + scrubbedDesc;
}
