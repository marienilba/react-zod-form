"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathArray = exports.outObject = exports.implied = exports.arrayEquals = exports.isNumericKeys = void 0;
/**
 * Return if a object have only numeric keys
 * @param obj
 * @returns boolean
 */
function isNumericKeys(obj) {
    return Object.keys(obj).every((key) => !isNaN(parseInt(key)));
}
exports.isNumericKeys = isNumericKeys;
function arrayEquals(array1, array2) {
    return (array1.length === array2.length &&
        array1.every((value, index) => value === array2[index]));
}
exports.arrayEquals = arrayEquals;
/**
 * Compare if target is implied in path
 * @param target
 * @param path
 * @returns
 */
function implied(target, path) {
    if (target.length < path.length)
        return false;
    const trimmed = target.slice(0, path.length);
    return trimmed.every((value, index) => value === path[index]);
}
exports.implied = implied;
function outObject(path, object) {
    return path.reduce((result, key) => result?.[key], object);
}
exports.outObject = outObject;
/**
 * Return path [] format to array format
 * @param path
 * @returns path[]
 */
function pathArray(path) {
    return path
        .match(/\[(.*?)\]/g)
        .filter((match) => !/\d+/.test(match))
        .map((match) => match.slice(1, -1));
}
exports.pathArray = pathArray;
