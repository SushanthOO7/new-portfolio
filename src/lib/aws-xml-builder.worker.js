// Cloudflare Workers do not expose DOMParser. Keep the SDK's browser-safe request
// stack while selecting its runtime-neutral streaming XML parser for SES responses.
export { XmlNode } from '../../node_modules/@aws-sdk/xml-builder/dist-es/XmlNode.js';
export { XmlText } from '../../node_modules/@aws-sdk/xml-builder/dist-es/XmlText.js';
export { parseXML } from '../../node_modules/@aws-sdk/xml-builder/dist-es/xml-parser.js';
