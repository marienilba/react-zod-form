import { ZodError, ZodRawShape, ZodSchema, z } from "zod";
export declare function findError(errors: ZodError, path: PropertyKey[]): z.ZodIssue[];
/**
 * Remove all effects, optionals etc
 */
export declare function through<TSchema extends ZodSchema>(schema: TSchema, promise?: boolean): TSchema;
/**
 * Out schema from other effects
 * @param schema
 * @returns
 */
export declare function out<TSchema extends ZodSchema>(schema: TSchema, effect?: boolean): any;
/**
 * Return if schema have effects
 * @param schema
 * @returns boolean
 */
export declare function outable<TSchema extends ZodSchema>(schema: TSchema, effect?: boolean): boolean;
/**
 * Assert schema is a ZodObject
 * @param schema
 * @returns boolean
 */
export declare function object<TSchema extends ZodSchema>(schema: TSchema): ZodRawShape;
/**
 * Assert schema is a ZodArray
 * @param schema
 * @returns boolean
 */
export declare function array<TSchema extends ZodSchema>(schema: TSchema): ZodSchema;
/**
 * Assert schema has a promise function
 * @param schema
 */
export declare function promises<TSchema extends ZodSchema>(schema: TSchema): boolean;
/**
 * Recursive transform zod schema to native object
 * @param schema
 * @returns object
 */
export declare function shapeOut<TSchema extends ZodRawShape>(schema: TSchema): Record<PropertyKey, any> | null;
/**
 * Get schema shape
 * @param schema
 * @returns shape
 */
export declare function shape<TSchema extends ZodSchema>(schema: TSchema): any;
