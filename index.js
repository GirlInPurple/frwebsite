/*

Copyright 2023 Final Republic contributors
Under GPL v3 license
Most of this code isnt mine anyway, thanks stackoverflow

*/

const { commitFileToRepo, wikiChannelWebhook } = require('./apis')
const { getBlockedIps, genHexString } = require('./misc')
const dotenv = require('dotenv');
const http = require('http');
const url = require('url');
const fs = require('fs');

// fl0 injects port into the docker container; uses that port unless it cant be found
dotenv.config(); const listenPort = process.env.PORT ?? 8080;

// create the server
http.createServer(async function (req, res) {
    if (req.method === 'POST' && req.url === '/submit') {

        let body = '';
        req.on('data', async function (chunk) {
            body += chunk;

            // run safety checks here
            // size check
            if (body.length > 1e6) {
                res.writeHead(413, { 'Content-Type': 'text/plain' }).end("413 Request Too Large");
                req.socket.destroy();
            }
            if (await getBlockedIps(req.socket.remoteAddress) === false) {
                res.writeHead(403, { 'Content-Type': 'text/plain' }).end("403 Forbidden");
                req.socket.destroy();
            }
        });

        req.on('end', async function () {
            // parse form data
            let formData = new URLSearchParams(body);
            let hexEditId = genHexString(16)

            let dropdown = formData.get('dropdown');
            let pageCreation = formData.get('page');

            let userAlias = formData.get('name');
            let userIp = req.socket.remoteAddress

            let content = formData.get('content');
            let notes = formData.get('notes');

            await wikiChannelWebhook(userAlias, userIp, `${dropdown}`, hexEditId, notes, content)
            await commitFileToRepo('GirlInPurple', 'frwebsite', 'wiki', 
                `${dropdown}.md`, 
                `${content}`, // sanitized = sanitize(fileContent, {allowedTags: ['br', 'div']})
                `Update ${dropdown}.md; Notes from Editor; ${notes}`
            );

            res.writeHead(202, { 'Content-Type': 'text/plain' }).end("Request Accepted");
        });

        req.on('error', function (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'text/plain' }).end("Internal Server Error");
        });

    } else if (req.method === 'GET') {
        // parsing request
        var q = url.parse(req.url, true);

        // posting html files
        var filename = "." + q.pathname;
        fs.readFile(filename, async function (err, data) {

            // error handling
            // sends you to index.html if its an empty link
            if (filename == "./" || filename == "/" || filename == "") {
                res.writeHead(200, "OK", { 'Content-Type': 'text/html' });
                fs.readFile('./index.html', function (err, data) {
                    res.write(data)
                    res.end();
                });
            }
            if (err) {
                // sends you to error.html if it cant find the file you're looking for
                res.writeHead(404, "File Not Found", { 'Content-Type': 'text/html' });
                fs.readFile('./error.html', function (err, data) {
                    res.write(data)
                    res.end();
                });
            }

            try {
                // send files
                var contentType = 'text/html';
                if (filename.endsWith('.css')) {
                    contentType = 'text/css';
                } else if (filename.endsWith('.js')) {
                    contentType = 'application/javascript';
                } else if (filename.endsWith('.json')) {
                    contentType = 'application/json';
                }

                // otherwise, post to client
                res.writeHead(200, "OK", { 'Content-Type': contentType });
                res.write(data);
                res.end();
            } catch {
                console.log(`could not find ${filename}, skipping`)
            }
        });
    } else { response.writeHead(405, { 'Content-Type': 'text/plain' }).end(); };
}).listen(listenPort);