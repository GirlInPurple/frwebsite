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
    if (req.method === 'POST' && req.url === '/submit.html') {

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

            res.writeHead(202, { 'Content-Type': 'text/html' })
            fs.readFile('./submit.html', function (err, data) {
                res.write(data)
                res.end();
            });
        });

        req.on('error', function (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'text/plain' }).end("Internal Server Error");
        });

    } else if (req.method === 'GET') {
        // parsing request
        var q = url.parse(req.url, true);

        /*
            grabbing files
            i tried to make this more compact and easier to read, but everything i did to it made it immediately break
            just add another extension to it and dont touch it again unless you want to spend an hour on 50 lines of code
        */
        let contentType, filename, statusCode
        if (q.pathname.endsWith('.html')) {
            contentType = 'text/html';
            filename = `./views/${q.pathname}`;
            statusCode = 200

        } else if (q.pathname.endsWith('.css')) {
            contentType = 'text/css';
            filename = `./assets/css/${q.pathname}`;
            statusCode = 200

        } else if (q.pathname.endsWith('.js')) {
            contentType = 'application/javascript';
            filename = `.${q.pathname}`;
            statusCode = 200

        } else if (q.pathname.endsWith('.json')) {
            contentType = 'application/json';
            filename = `./${q.pathname}`;
            statusCode = 200

        } else if (q.pathname.endsWith('.png')) {
            contentType = 'image/png';
            filename = `./assets/img_vid/${q.pathname}`;
            statusCode = 200

        } else if (q.pathname.endsWith('.gif')) {
            contentType = 'image/gif';
            filename = `./assets/img_vid/${q.pathname}`;
            statusCode = 200

        } else if (q.pathname == '/') { // no page specified, go to home page
            contentType = 'text/html';
            filename = './views/index.html'
            statusCode = 300

        } else { // if an error occurs
            if (q.pathname.endsWith('.html')) {
                contentType = 'text/html';
                filename = './views/error.html'
                statusCode = 404
    
            } else {
                contentType = 'text/plain';
                filename = './assets/misc/error.txt'
                statusCode = 404
            }

        }
        console.log(filename, q.pathname)

        // posting files
        fs.readFile(filename, async function (err, data) {
            try {
                // post to client
                res.writeHead(statusCode, { 'Content-Type': contentType });
                res.write(data);
                res.end();
            } catch (err) {
                console.log(`could not find ${filename} because ${err}, skipping`)
                if (q.pathname.endsWith('.html')) {
                    fs.readFile('./views/error.html', async function (err, data) {
                        res.writeHead(404, { 'Content-Type': 'text/html' }).end(data)
                    });
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' }).end();
                }
            }
        });
    } else { res.writeHead(405, { 'Content-Type': 'text/plain' }).end('405 Method Not Allowed'); };
}).listen(listenPort);