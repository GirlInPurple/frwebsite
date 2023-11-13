/*

Copyright 2023 Final Republic contributors
Under GPL v3 license
Most of this code isnt mine anyway, thanks stackoverflow

*/

const { sleepFunc: sleep, hexToDecimalFunc: hexToDecimal, checkIPAddressFunc: checkIPAddress } = require('./misc')
const formData = require('form-data');
const sanitize = require('sanitize');
const dotenv = require('dotenv'); 
const axios = require('axios');
const fs = require('fs')

type IPAddress = string;
type hex = string;

dotenv.config();
const webhookURL = process.env.WEBHOOK
const githubApiKey = process.env.GITHUB
let lastCall = Date.now();

async function commitFileToRepo(repoOwner: string, repoName: string, branchName: string, filePath: string, fileContent: string, commitMessage: string) {
    const headers = {
        'Authorization': `token ${githubApiKey}`,
        'Accept': 'application/vnd.github.v3+json'
    };
    const module = await import('node-fetch');
    const fetch = module.default;
    console.log("setup complete")

    // Rate limiting
    const now = Date.now();
    const delay = 6000; // Delay between each API call in milliseconds
    if (now - lastCall < delay) {
        console.log(`${now}, ${lastCall}, ${delay}`)
        console.log("sleeping")
        await sleep(delay - (now - lastCall));
    }
    lastCall = Date.now();

    // Step 1: Get the last commit SHA of the branch
    const branchRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/branches/${branchName}`, { headers });
    console.log(`branchRes: ${branchRes}`)
    const branchData = await branchRes.json();
    const lastCommitSha = branchData.commit.sha;

    // Step 2: Create a blob with the file's content
    const blobRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            content: Buffer.from(fileContent).toString('base64'),
            encoding: 'base64'
        })
    });
    console.log(`blobRes: ${Buffer.from(fileContent).toString('base64')}`)
    console.log(blobRes)
    const blobData = await blobRes.json();
    const blobSha = blobData.sha;

    // Step 3: Create a tree
    const treeRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees`, {
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
    console.log(`FP: ${filePath} | blobSHA: ${blobSha}`)
    console.log(treeRes)
    const treeData = await treeRes.json();
    const treeSha = treeData.sha;

    // Step 4: Create a commit
    const commitRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            message: commitMessage,
            parents: [lastCommitSha],
            tree: treeSha
        })
    });
    console.log(commitMessage, lastCommitSha, treeSha)
    console.log(commitRes)
    const commitData = await commitRes.json();
    const newCommitSha = commitData.sha;

    // Step 5: Update the reference of the branch
    await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/${branchName}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
            sha: newCommitSha
        })
    });
    console.log(newCommitSha)
}

async function wikiChannelWebhook(alias: string, ipAdrs: string, page: string, editId: hex, notes: string, fileContent: string) {

    let ip: IPAddress = checkIPAddress(ipAdrs)

    let editName = `IP: ${ip} | Alias: ${alias}`
    let editUser = `Final Republic Wiki (${editId})`
    let editTitle = `Page: \`${page}\` | Id: ${editId}`
    let editNotes = `**Notes from the Editor:** \n${notes}`
    console.log(editName + "\n" + editUser + "\n" + editTitle + "\n" + editNotes)

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

    await axios({
        method: 'post',
        url: webhookURL, // replace with your webhook URL
        headers: {
            'Content-Type': 'application/json',
        },
        data: data
    }).then((response: any) => {
        console.log(`Response: ${response}`);
    }).catch((error: Error) => {
        console.error(`Problem with request: ${error.message}`);
    });

    // send html file
    if (fileContent == "") {
        return
    }

    let tempFilePath = `${__dirname}/temp/${editUser}.md`;
    fs.writeFileSync(tempFilePath, fileContent);
    
    let form = new formData();
    form.append('username', editUser);
    form.append('file', fs.createReadStream(tempFilePath), `${page}.md`);
    
    await axios.post(webhookURL, form, {
        headers: form.getHeaders()
    }).then((response: any) => {
        console.log(`Response: ${response}`);
    }).catch((error: Error) => {
        console.error(`Problem with request: ${error.message}`);
    });
}

module.exports = {
    commitFileToRepo,
    wikiChannelWebhook
};