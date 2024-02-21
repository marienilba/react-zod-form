import { z } from "zod";
export declare function findError(errors: z.ZodError, path: PropertyKey[]): z.ZodIssue[];
/**
 * Remove all effects, optionals etc
 */
export declare function through<TSchema extends z.ZodSchema>(schema: TSchema, promise?: boolean): TSchema;
/**
 * Out schema from other effects
 * @param schema
 * @returns
 */
export declare function out<TSchema extends z.ZodSchema>(schema: TSchema, effect?: boolean): any;
/**
 * Return if schema have effects
 * @param schema
 * @returns boolean
 */
export declare function outable<TSchema extends z.ZodSchema>(schema: TSchema, effect?: boolean): boolean;
/**
 * Assert schema is a ZodObject
 * @param schema
 * @returns boolean
 */
export declare function object<TSchema extends z.ZodSchema>(schema: TSchema): z.ZodRawShape;
/**
 * Assert schema is a ZodArray
 * @param schema
 * @returns boolean
 */
export declare function array<TSchema extends z.ZodSchema>(schema: TSchema): z.ZodSchema;
/**
 * Assert schema has a promise function
 * @param schema
 */
export declare function promises<TSchema extends z.ZodSchema>(schema: TSchema): boolean;
/**
 * Recursive transform zod schema to native object
 * @param schema
 * @returns object
 */
export declare function shapeOut<TSchema extends z.ZodRawShape>(schema: TSchema): Record<PropertyKey, any> | null;
/**
 * Get schema shape
 * @param schema
 * @returns shape
 */
export declare function shape<TSchema extends z.ZodSchema>(schema: TSchema): any;
//# sourceMappingURL=zod-utils.d.ts.map