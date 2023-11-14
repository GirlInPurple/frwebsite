const { JSDOM } = require('jsdom');
const { window } = new JSDOM('');
const createDOMPurify = require('dompurify');
const DOMPurify = createDOMPurify(window);

const sanitizeMarkdown = require('sanitize-markdown');
const TurndownService = require('turndown');
const marked = require('marked')

function sanitizeMarkdownInput(markdownInput) {
    const turndownService = new TurndownService();
    // Convert the Markdown input to HTML
    const html = marked.parse(markdownInput);
    // Sanitize the HTML using DOMPurify
    const sanitizedHtml = DOMPurify.sanitize(html);
    // Convert the sanitized HTML back to Markdown
    const sanitizedMarkdown = turndownService.turndown(sanitizedHtml);
    // Sanitize the Markdown using sanitize-markdown
    return sanitizeMarkdown(sanitizedMarkdown);
}

module.exports = {
    sanitizeMarkdownInput
}