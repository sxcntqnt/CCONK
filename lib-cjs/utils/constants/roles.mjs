"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_ORDER = exports.ROLES = void 0;
// src/constants/roles.ts
exports.ROLES = {
    PASSENGER: 'PASSENGER',
    DRIVER: 'DRIVER',
    OWNER: 'OWNER',
};
// Array for ordered switch states: 0 = PASSENGER, 1 = DRIVER, 2 = OWNER
exports.ROLE_ORDER = [exports.ROLES.PASSENGER, exports.ROLES.DRIVER, exports.ROLES.OWNER];
