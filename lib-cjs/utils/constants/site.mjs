"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_HOSTNAMES = exports.APP_DOMAIN = exports.APP_NAME = void 0;
exports.APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'FLAM';
exports.APP_DOMAIN = `https://${process.env.NEXT_PUBLIC_APP_DOMAIN}`;
exports.APP_HOSTNAMES = new Set([process.env.NEXT_PUBLIC_APP_DOMAIN, `www.${process.env.NEXT_PUBLIC_APP_DOMAIN}`]);
