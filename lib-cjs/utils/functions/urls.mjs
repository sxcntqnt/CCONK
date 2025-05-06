"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSearchParams = exports.getUrlFromText = exports.isValidUrl = void 0;
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch (e) {
        return false;
    }
};
exports.isValidUrl = isValidUrl;
const getUrlFromText = (text) => {
    if ((0, exports.isValidUrl)(text))
        return text;
    try {
        if (text.includes('.') && !text.includes(' ')) {
            return new URL(`https://${text}`).toString();
        }
    }
    catch (_) {
        return '';
    }
    return '';
};
exports.getUrlFromText = getUrlFromText;
const getSearchParams = (url) => {
    let params = {};
    new URL(url).searchParams.forEach(function (val, key) {
        params[key] = val;
    });
    return params;
};
exports.getSearchParams = getSearchParams;
