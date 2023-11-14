/*

Copyright 2023 Final Republic contributors
Under GPL v3 license
Most of this code isnt mine anyway, thanks stackoverflow

*/

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
    const sanitizedHtml = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['div', 'span'] });
    // Convert the sanitized HTML back to Markdown
    const sanitizedMarkdown = turndownService.turndown(sanitizedHtml);
    // Sanitize the Markdown using sanitize-markdown
    return sanitizeMarkdown(sanitizedMarkdown, { allowedTags: ['div','span'] });
}

function checkIPAddress(ip) {
    const regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!regex.test(ip)) {
        return "0:0:0:0";
    }
    return ip;
}

function hexToDecimal(hex) {
    return parseInt(hex.replace("#", ""), 16)
}

function genHexString(len) {
    const hex = '0123456789ABCDEF';
    let output = '';
    for (let i = 0; i < len; ++i) {
        output += hex.charAt(Math.floor(Math.random() * hex.length));
    }
    return output;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getBlockedIps(ip) {
    try {
        let response
        let data

        // try VPN ip list
        response = await fetch('https://raw.githubusercontent.com/X4BNet/lists_vpn/main/output/vpn/ipv4.txt');
        data = await response.text();
        data = data.split('\n');
        for (let i = 0; i < data.length; i++) {
            data[i] = data[i].split("/")[0];
        }
        if (ip in data) {
            return false // false means unsafe
        }

        // try get-ip-intel
        response = await fetch(`https://www.getipintel.net/check.php?ip=${ip}&flags=m`); // https://www.getipintel.net/ open an issue to change the flags
        data = await response.text();
        if (data === '1') {
            return false // false means unsafe
        }

        // if it passes both checks;
        return true // true means safe

    } catch (error) {
        console.error(`An error has occurred ; ${error} ; this user has been excused from the ip blocker`);
        return true // you could cause an error to occur and get around the block, but its so unlikely that ill leave it alone
    }
}

module.exports = {
    sleep,
    getBlockedIps,
    genHexString,
    hexToDecimal,
    checkIPAddress,
    sanitizeMarkdownInput
};