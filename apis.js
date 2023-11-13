/*

Copyright 2023 Final Republic contributors
Under GPL v3 license
Most of this code isnt mine anyway, thanks stackoverflow

*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { sleepFunc: sleep, hexToDecimalFunc: hexToDecimal, checkIPAddressFunc: checkIPAddress } = require('./misc');
const formData = require('form-data');
const sanitize = require('sanitize');
const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');
dotenv.config();
const webhookURL = process.env.WEBHOOK;
const githubApiKey = process.env.GITHUB;
let lastCall = Date.now();
function commitFileToRepo(repoOwner, repoName, branchName, filePath, fileContent, commitMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = {
            'Authorization': `token ${githubApiKey}`,
            'Accept': 'application/vnd.github.v3+json'
        };
        const module = yield Promise.resolve().then(() => require('node-fetch'));
        const fetch = module.default;
        console.log("setup complete");
        // Rate limiting
        const now = Date.now();
        const delay = 6000; // Delay between each API call in milliseconds
        if (now - lastCall < delay) {
            console.log(`${now}, ${lastCall}, ${delay}`);
            console.log("sleeping");
            yield sleep(delay - (now - lastCall));
        }
        lastCall = Date.now();
        // Step 1: Get the last commit SHA of the branch
        const branchRes = yield fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/branches/${branchName}`, { headers });
        console.log(`branchRes: ${branchRes}`);
        const branchData = yield branchRes.json();
        const lastCommitSha = branchData.commit.sha;
        // Step 2: Create a blob with the file's content
        const blobRes = yield fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/blobs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                content: Buffer.from(fileContent).toString('base64'),
                encoding: 'base64'
            })
        });
        console.log(`blobRes: ${Buffer.from(fileContent).toString('base64')}`);
        console.log(blobRes);
        const blobData = yield blobRes.json();
        const blobSha = blobData.sha;
        // Step 3: Create a tree
        const treeRes = yield fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                base_tree: lastCommitSha,
                tree: [{
                        path: filePath,
                        mode: '100644',
                        type: 'blob',
                        sha: blobSha
                    }]
            })
        });
        console.log(`FP: ${filePath} | blobSHA: ${blobSha}`);
        console.log(treeRes);
        const treeData = yield treeRes.json();
        const treeSha = treeData.sha;
        // Step 4: Create a commit
        const commitRes = yield fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/commits`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                message: commitMessage,
                parents: [lastCommitSha],
                tree: treeSha
            })
        });
        console.log(commitMessage, lastCommitSha, treeSha);
        console.log(commitRes);
        const commitData = yield commitRes.json();
        const newCommitSha = commitData.sha;
        // Step 5: Update the reference of the branch
        yield fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/${branchName}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                sha: newCommitSha
            })
        });
        console.log(newCommitSha);
    });
}
function wikiChannelWebhook(alias, ipAdrs, page, editId, notes, fileContent) {
    return __awaiter(this, void 0, void 0, function* () {
        let ip = checkIPAddress(ipAdrs);
        let editName = `IP: ${ip} | Alias: ${alias}`;
        let editUser = `Final Republic Wiki (${editId})`;
        let editTitle = `Page: \`${page}\` | Id: ${editId}`;
        let editNotes = `**Notes from the Editor:** \n${notes}`;
        console.log(editName + "\n" + editUser + "\n" + editTitle + "\n" + editNotes);
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
        yield axios({
            method: 'post',
            url: webhookURL,
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
            return;
        }
        let tempFilePath = `${__dirname}/temp/${editUser}.md`;
        fs.writeFileSync(tempFilePath, fileContent);
        let form = new formData();
        form.append('username', editUser);
        form.append('file', fs.createReadStream(tempFilePath), `${page}.md`);
        yield axios.post(webhookURL, form, {
            headers: form.getHeaders()
        }).then((response) => {
            console.log(`Response: ${response}`);
        }).catch((error) => {
            console.error(`Problem with request: ${error.message}`);
        });
    });
}
module.exports = {
    commitFileToRepo,
    wikiChannelWebhook
};
//# sourceMappingURL=apis.js.map