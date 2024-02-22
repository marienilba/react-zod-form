import {
  ZodArray,
  ZodBranded,
  ZodDefault,
  ZodEffects,
  ZodNullable,
  ZodObject,
  ZodOptional,
  ZodPromise,
  ZodRecord,
  ZodError,
  ZodRawShape,
  ZodSchema,
  ZodTypeAny,
} from "zod";
import { z } from "zod";
import { implied } from "./utils";

export function findError(errors: z.ZodError, path: PropertyKey[]) {
  return errors.errors.filter((error) => implied(error.path, path));
}

/**
 * Remove all effects, optionals etc
 */
export function through<TSchema extends z.ZodSchema>(
  schema: TSchema,
  promise = true
) {
  let outed = schema;
  while (outable(outed, promise))
    try {
      outed = out(outed, promise);
    } catch (error) {
      break;
    }

  return outed;
}

/**
 * Out schema from other effects
 * @param schema
 * @returns
 */
export function out<TSchema extends z.ZodSchema>(
  schema: TSchema,
  effect = true
) {
  if (
    isZodOptional(schema) ||
    isZodNullable(schema) ||
    isZodBranded(schema) ||
    isZodPromise(schema)
  )
    return schema.unwrap();

  if (isZodDefault(schema)) return schema.removeDefault();
  if (effect && isZodEffects(schema)) return schema.innerType();

  throw new Error(`schema ${schema.description} can't be outed`);
}

/**
 * Return if schema have effects
 * @param schema
 * @returns boolean
 */
export function outable<TSchema extends z.ZodSchema>(
  schema: TSchema,
  effect = true
) {
  return (
    (effect && isZodEffects(schema)) ||
    isZodOptional(schema) ||
    isZodBranded(schema) ||
    isZodNullable(schema) ||
    isZodDefault(schema) ||
    isZodPromise(schema)
  );
}

/**
 * Assert schema is a ZodObject
 * @param schema
 * @returns boolean
 */
export function object<TSchema extends z.ZodSchema>(
  schema: TSchema
): z.ZodRawShape {
  const schemaObject = through(schema);
  if (isZodObject(schemaObject)) return schemaObject.shape;
  throw new Error("The schema type must be a object");
}

/**
 * Assert schema is a ZodArray
 * @param schema
 * @returns boolean
 */
export function array<TSchema extends z.ZodSchema>(
  schema: TSchema
): z.ZodSchema {
  const schemaArray = through(schema);
  if (isZodArray(schemaArray)) return schemaArray.element;
  throw new Error("The schema type must be a array");
}

/**
 * Assert schema has a promise function
 * @param schema
 */
export function promises<TSchema extends z.ZodSchema>(
  schema: TSchema
): boolean {
  try {
    schema.parse(z.NEVER, { async: true });
  } catch (error) {
    return (
      error instanceof Error &&
      error.message === "Synchronous parse encountered promise."
    );
  }
  return false;
}

/**
 * Recursive transform zod schema to native object
 * @param schema
 * @returns object
 */
export function shapeOut<TSchema extends z.ZodRawShape>(
  schema: TSchema
): Record<PropertyKey, any> | null {
  if (schema.constructor === Object) {
    const keys = Object.keys(schema);
    if (keys.length === 0) return null;
    return keys.reduce((obj, key) => {
      const value = through(schema[key] as z.ZodSchema);

      if (isZodObject(value)) {
        return { ...obj, [key]: shapeOut(shape(value)) };
      }

      if (isZodArray(value)) {
        return { ...obj, [key]: [shapeOut(shape(value))] };
      }

      return { ...obj, [key]: null };
    }, {});
  }

  return null;
}

/**
 * Get schema shape
 * @param schema
 * @returns shape
 */
export function shape<TSchema extends z.ZodSchema>(schema: TSchema): any {
  if (isZodArray(schema) || isZodRecord(schema))
    return shape(through(schema.element));

  if (isZodObject(schema)) return schema.shape;

  return schema;
}

export function isZodArray(schema: ZodTypeAny): schema is ZodArray<any> {
  return (schema._def as any)?.typeName === "ZodArray";
}
export function isZodBranded(
  schema: ZodTypeAny
): schema is ZodBranded<any, any> {
  return (schema._def as any)?.typeName === "ZodBranded";
}
export function isZodDefault(schema: ZodTypeAny): schema is ZodDefault<any> {
  return (schema._def as any)?.typeName === "ZodDefault";
}
export function isZodEffects(schema: ZodTypeAny): schema is ZodEffects<any> {
  return (schema._def as any)?.typeName === "ZodEffects";
}
export function isZodNullable(schema: ZodTypeAny): schema is ZodNullable<any> {
  return (schema._def as any)?.typeName === "ZodNullable";
}
export function isZodObject(schema: ZodTypeAny): schema is ZodObject<any> {
  return (schema._def as any)?.typeName === "ZodObject";
}
export function isZodOptional(schema: ZodTypeAny): schema is ZodOptional<any> {
  return (schema._def as any)?.typeName === "ZodOptional";
}
export function isZodPromise(schema: ZodTypeAny): schema is ZodPromise<any> {
  return (schema._def as any)?.typeName === "ZodPromise";
}
export function isZodRecord(schema: ZodTypeAny): schema is ZodRecord<any> {
  return (schema._def as any)?.typeName === "ZodRecord";
}
