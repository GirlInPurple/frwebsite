/*
 Copyright 2023 Final Republic contributors
 Under GPL v3 license
 Most of this code isnt mine anyway, thanks stackoverflow
*/

const sanitizeHtml = require('sanitize-html');
const dotenv = require('dotenv'); dotenv.config(); // get the .env file working
const http = require('http');
const url = require('url');
const fs = require('fs');
const os = require('os');

const listenPort = process.env.PORT ?? 8080; // fl0 injects port into the docker container; uses that port unless it cant be found

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

async function getBlockedIps() {
    try {
        let response = await fetch('https://raw.githubusercontent.com/X4BNet/lists_vpn/main/output/vpn/ipv4.txt');
        let data = await response.text();

        data = data.split('\n');
        for (let i = 0; i < data.length; i++) {
            data[i] = data[i].split("/")[0];
        }

        return data
    } catch (error) {
        console.error('Error:', error);
        return [];
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

async function webhook() {

    let userIp = await returnIp(document.getElementById('alias').value)
    let editId = `${document.getElementById('mode').value}-${genHexString(16)}`

    let editName = `IP: ${userIp[0]} | Alias: ${document.getElementById('alias').value}`
    let editUser = `Final Republic Wiki (${editId})`
    let editTitle = `Page: ${document.getElementById('page').value} | Mode: ${document.getElementById('mode').value} | Id: ${editId} | Lang: ${document.getElementById('lang').value}`
    let editNotes = `**Notes from the Editor:** \n${document.getElementById('notes').value}`

    // send info embed
    var xml = new XMLHttpRequest();
    xml.open("POST", webhookURL, true);
    xml.setRequestHeader('Content-Type', 'application/json');
    xml.send(JSON.stringify({
        username: editUser,
        embeds: [
            {
                author: {
                    name: editName
                },
                title: editTitle,
                description: editNotes,
                color: hexToDecimal("#88ff00")
            }
        ]
    }));

    // send html file
    let fileContent = document.getElementById("read").value;
    if (fileContent == "" || userIp[1] == 2) {
        alert(`Success! Your suggestion has been sent to the rest of the editors.\nYour edit id is: ${editId}.`)
        return
    }

    let blob = new Blob([fileContent], { type: 'text/html' });
    let file = new File([blob], `${document.getElementById('page').value}.html`, { type: 'text/html' });
    var formData = new FormData();
    formData.append("file", file);
    formData.append("username", editUser)

    var xml = new XMLHttpRequest();
    xml.open("POST", webhookURL, true);
    xml.send(formData);
}

// create the server
http.createServer(async function (req, res) {

    if (req.method == 'POST') {
        req.on('data', function (data) {
            queryData += data;
            if (queryData.length > 1e6) {
                queryData = "";
                res.writeHead(413, { 'Content-Type': 'text/plain' }).end();
                req.socket.destroy();
            }
        });

        request.on('end', function () {
            req.post = querystring.parse(queryData);
            console.log(req.post)
        });

    } else 
    if (req.method == 'GET') {
        // parsing request
        var q = url.parse(req.url, true);

        // posting html files
        var filename = "." + q.pathname;
        fs.readFile(filename, function (err, data) {

            // error handling
            if (err) {
                // sends you to index.html if its an empty link
                if (filename == "./") {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    fs.readFile('./index.html', function (err, data) {
                        res.write(data)
                        return res.end();
                    });
                }
                // sends you to error.html if it cant find the file you're looking for
                res.writeHead(404, { 'Content-Type': 'text/html' });
                fs.readFile('./error.html', function (err, data) {
                    res.write(data)
                    return res.end();
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

                console.log(filename)
                if (filename == "./wikiPages/wiki.json") {
                    let wikiJson = JSON.parse(data)
                    console.log(wikiJson, wikiJson.lastUpdated)
                    if (wikiJson.lastUpdated >= 0) {
                        console.log("test success")
                    }
                }
                

                // otherwise, post to client
                res.writeHead(200, { 'Content-Type': contentType });
                res.write(data);
                return res.end();
            } catch {

            }
        });
    } else 
    { response.writeHead(405, { 'Content-Type': 'text/plain' }).end(); };
}).listen(listenPort);