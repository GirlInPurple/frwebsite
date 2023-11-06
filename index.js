/*

Copyright 2023 Final Republic contributors
Under GPL v3 license
Most of this code isnt mine anyway, thanks stackoverflow

*/

const sanitizeHtml = require('sanitize-html');
const FormData = require('form-data');
const dotenv = require('dotenv');
const axios = require('axios');
const http = require('http');
const url = require('url');
const fs = require('fs');
const os = require('os');

// fl0 injects port into the docker container; uses that port unless it cant be found
dotenv.config();
const listenPort = process.env.PORT ?? 8080;
const webhookURL = process.env.WEBHOOK

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
        console.error(`An error has occured ; ${error} ; this user has been excused from the ip blocker`);
        return true // you could cause an error to occur and get around the block, but its so unlikely that ill leave it alone
    }
}

async function readSanitizeWrite(file, newValue) {

    // stage 1: read the file
    file = file + '.html'
    let filePath = path.join(__dirname, file);
    let sanitized = ""

    console.log('reading file');
    fs.readFile(filePath, 'utf-8', function (err, data) {
        if (err) throw err;
        console.log('old file contents:', data);

        // stage 2: make a backup with info of the editor contained
        let now = new Date();
        let year = now.getFullYear();
        let month = ("0" + (now.getMonth() + 1)).slice(-2);
        let day = ("0" + now.getDate()).slice(-2);
        let hour = ("0" + now.getHours()).slice(-2);
        let minute = ("0" + now.getMinutes()).slice(-2);
        let second = ("0" + now.getSeconds()).slice(-2);
        let copyPath = `${__dirname}\\backups\\${year}-${month}-${day}-${hour}-${minute}-${second}-${file}`

        fs.copyFile(filePath, copyPath, (err) => {
            if (err) throw err;
            console.log(`${filePath} was copied to ${copyPath}`);
        });

        // stage 3: sanitize the file and write it

        if (newValue) {
            // "sanitize" the file
            sanitized = sanitizeHtml(newValue, {
                allowedTags: [
                    'a', 'span',
                    'img', 'button',
                    'h1', 'h2', 'h3', 'p',
                    'ul', 'li',
                    'i', 'b', 'br'
                ],
                allowedAttributes: {
                    'a': [],
                    'img': [],
                    'button': []
                }
            });
        }

        // stage 4: write the new file content and check it

        fs.writeFile(filePath, sanitized, 'utf-8', function (err) {
            if (err) throw err;
            console.log('file written');

            fs.readFile(filePath, 'utf-8', function (err, newData) {
                if (err) throw err;
                console.log('new file contents:', newData);
            });
        });
    });
}

async function webhook(alias, ip, page, editId, notes, fileContent) {

    let editName = `IP: ${ip} | Alias: ${alias}`
    let editUser = `Final Republic Wiki (${editId})`
    let editTitle = `Page: \`${page}\` | Id: ${editId}`
    let editNotes = `**Notes from the Editor:** \n${notes}`

    const data = {
        username: editUser,
        embeds: [
            {
                author: {
                    name: editName
                },
                title: editTitle,
                description: editNotes,
                color: hexToDecimal("#88ff00"),
                "thumbnail": {
                    "url": `https://minotar.net/avatar/${alias}/100`
                }
            }
        ]
    };

    axios({
        method: 'post',
        url: webhookURL, // replace with your webhook URL
        headers: {
            'Content-Type': 'application/json',
        },
        data: data
    }).then((response) => {
        console.log(`Response: ${response}`);
    }).catch((error) => {
        console.error(`Problem with request: ${error.message}`);
    });

    // send html file
    if (fileContent == "") {
        return
    }

    let filename = `${page}.md`;
    let formData = new FormData();
    formData.append("file", fs.createReadStream(filename), {
        filename: filename,
        contentType: 'text/html',
    });

    formData.append("username", editUser);

    axios.post(webhookURL, formData, {
        headers: formData.getHeaders()
    }).then((response) => {
        console.log(response);
    }).catch((error) => {
        console.error(error);
    });
}

async function updateWikiJson() {



    let jsonPath = `./wikiPages/wiki.json`
    fs.writeFile(jsonPath, data, function (err) {
        console.error(`Error on updateWikiJson() ; ${err} ; aborting`)
    });
}

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
            // rarse form data
            let formData = new URLSearchParams(body);
            let hexEditId = genHexString(16)

            let dropdown = formData.get('dropdown');
            let pageCreation = formData.get('page');

            let userAlias = formData.get('name');
            let userIp = req.socket.remoteAddress

            let content = formData.get('content');
            let notes = formData.get('notes');


            await webhook(userAlias, userIp, `./wikiPages/${dropdown}`, hexEditId, notes, content)

            // Write the form data to a file or perform any other desired action
            fs.writeFile(`${dropdown}.md`, content, (err) => {
                if (err) {
                    console.error(err);
                    res.statusCode = 500;
                    res.end(`500 Error writing to file: ${err}\n\nPlease send a screenshot or copy the text`);
                } else {
                    res.statusCode = 200;
                    res.end('200 Form data written successfully');
                }
            });
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

            // send files if no errors
            try {
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

            }
        });
    } else { response.writeHead(405, { 'Content-Type': 'text/plain' }).end(); };
}).listen(listenPort);