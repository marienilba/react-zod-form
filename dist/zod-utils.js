"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shape = exports.shapeOut = exports.promises = exports.array = exports.object = exports.outable = exports.out = exports.through = exports.findError = void 0;
const zod_1 = require("zod");
const utils_1 = require("./utils");
function findError(errors, path) {
    return errors.errors.filter((error) => (0, utils_1.implied)(error.path, path));
}
exports.findError = findError;
/**
 * Remove all effects, optionals etc
 */
function through(schema, promise = true) {
    let outed = schema;
    while (outable(outed, promise))
        try {
            outed = out(outed, promise);
        }
        catch (error) {
            break;
        }
    return outed;
}
exports.through = through;
/**
 * Out schema from other effects
 * @param schema
 * @returns
 */
function out(schema, effect = true) {
    if (schema instanceof zod_1.ZodOptional ||
        schema instanceof zod_1.ZodNullable ||
        schema instanceof zod_1.ZodBranded ||
        schema instanceof zod_1.ZodPromise)
        return schema.unwrap();
    if (schema instanceof zod_1.ZodDefault)
        return schema.removeDefault();
    if (effect && schema instanceof zod_1.ZodEffects)
        return schema.innerType();
    throw new Error(`schema ${schema.description} can't be outed`);
}
exports.out = out;
/**
 * Return if schema have effects
 * @param schema
 * @returns boolean
 */
function outable(schema, effect = true) {
    return ((effect && schema instanceof zod_1.ZodEffects) ||
        schema instanceof zod_1.ZodOptional ||
        schema instanceof zod_1.ZodBranded ||
        schema instanceof zod_1.ZodNullable ||
        schema instanceof zod_1.ZodDefault ||
        schema instanceof zod_1.ZodPromise);
}
exports.outable = outable;
/**
 * Assert schema is a ZodObject
 * @param schema
 * @returns boolean
 */
function object(schema) {
    const schemaObject = through(schema);
    if (schemaObject instanceof zod_1.ZodObject)
        return schemaObject.shape;
    throw new Error("The schema type must be a object");
}
exports.object = object;
/**
 * Assert schema is a ZodArray
 * @param schema
 * @returns boolean
 */
function array(schema) {
    const schemaArray = through(schema);
    if (schemaArray instanceof zod_1.ZodArray)
        return schemaArray.element;
    throw new Error("The schema type must be a array");
}
exports.array = array;
/**
 * Assert schema has a promise function
 * @param schema
 */
function promises(schema) {
    try {
        schema.parse(zod_1.z.NEVER, { async: true });
    }
    catch (error) {
        return (error instanceof Error &&
            error.message === "Synchronous parse encountered promise.");
    }
    return false;
}
exports.promises = promises;
/**
 * Recursive transform zod schema to native object
 * @param schema
 * @returns object
 */
function shapeOut(schema) {
    if (schema.constructor === Object) {
        const keys = Object.keys(schema);
        if (keys.length === 0)
            return null;
        return keys.reduce((obj, key) => {
            const value = through(schema[key]);
            if (value instanceof zod_1.ZodObject) {
                return { ...obj, [key]: shapeOut(shape(value)) };
            }
            if (value instanceof zod_1.ZodArray) {
                return { ...obj, [key]: [shapeOut(shape(value))] };
            }
            return { ...obj, [key]: null };
        }, {});
    }
    return null;
}
exports.shapeOut = shapeOut;
/**
 * Get schema shape
 * @param schema
 * @returns shape
 */
function shape(schema) {
    if (schema instanceof zod_1.ZodArray || schema instanceof zod_1.ZodRecord)
        return shape(through(schema.element));
    if (schema instanceof zod_1.ZodObject)
        return schema.shape;
    return schema;
}
exports.shape = shape;
