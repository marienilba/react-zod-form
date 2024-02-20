"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapArray = exports.mapObject = void 0;
const utils_1 = require("./utils");
/**
 * Map the data from form to object
 * @param raw
 * @returns object
 */
function mapObject(raw) {
    const result = {};
    for (const key in raw) {
        const value = raw[key];
        const keys = key.split(/\]\[|\[|\]/).filter((k) => k !== "");
        let obj = result;
        keys.forEach((k, index) => {
            if (!obj[k]) {
                obj[k] = {};
            }
            if (index === keys.length - 1) {
                obj[k] = value;
            }
            obj = obj[k];
        });
    }
    return mapArray(result);
}
exports.mapObject = mapObject;
/**
 * Map mapObject object-arrays to arrays
 * @param obj
 * @returns object
 */
function mapArray(obj) {
    if (typeof obj !== "object" || obj === null) {
        return obj;
    }
    if (Array.isArray(obj) || (0, utils_1.isNumericKeys)(obj)) {
        return Object.values(obj).map(mapArray);
    }
    const result = {};
    for (const key in obj) {
        result[key] = mapArray(obj[key]);
    }
    return result;
}
exports.mapArray = mapArray;
