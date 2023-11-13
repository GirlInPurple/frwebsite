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
function checkIPAddressFunc(ip) {
    const regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!regex.test(ip)) {
        return "0:0:0:0";
    }
    return ip;
}
function hexToDecimalFunc(hex) {
    return parseInt(hex.replace("#", ""), 16);
}
function genHexStringFunc(len) {
    const hex = '0123456789ABCDEF';
    let output = '';
    for (let i = 0; i < len; ++i) {
        output += hex.charAt(Math.floor(Math.random() * hex.length));
    }
    return output;
}
function sleepFunc(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function getBlockedIpsFunc(ip) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let response;
            let data;
            // try VPN ip list
            response = yield fetch('https://raw.githubusercontent.com/X4BNet/lists_vpn/main/output/vpn/ipv4.txt');
            data = yield response.text();
            data = data.split('\n');
            for (let i = 0; i < data.length; i++) {
                data[i] = data[i].split("/")[0];
            }
            if (ip in data) {
                return false; // false means unsafe
            }
            // try get-ip-intel
            response = yield fetch(`https://www.getipintel.net/check.php?ip=${ip}&flags=m`); // https://www.getipintel.net/ open an issue to change the flags
            data = yield response.text();
            if (data === '1') {
                return false; // false means unsafe
            }
            // if it passes both checks;
            return true; // true means safe
        }
        catch (error) {
            console.error(`An error has occurred ; ${error} ; this user has been excused from the ip blocker`);
            return true; // you could cause an error to occur and get around the block, but its so unlikely that ill leave it alone
        }
    });
}
module.exports = {
    sleepFunc,
    getBlockedIpsFunc,
    genHexStringFunc,
    hexToDecimalFunc,
    checkIPAddressFunc
};
//# sourceMappingURL=misc.js.map