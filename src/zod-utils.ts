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
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodBranded ||
    schema instanceof z.ZodPromise
  )
    return schema.unwrap();

  if (schema instanceof z.ZodDefault) return schema.removeDefault();
  if (effect && schema instanceof z.ZodEffects) return schema.innerType();

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
    (effect && schema instanceof z.ZodEffects) ||
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodBranded ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault ||
    schema instanceof z.ZodPromise
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
  if (schemaObject instanceof z.ZodObject) return schemaObject.shape;
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
  if (schemaArray instanceof z.ZodArray) return schemaArray.element;
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

      if (value instanceof z.ZodObject) {
        return { ...obj, [key]: shapeOut(shape(value)) };
      }

      if (value instanceof z.ZodArray) {
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
  if (schema instanceof z.ZodArray || schema instanceof z.ZodRecord)
    return shape(through(schema.element));

  if (schema instanceof z.ZodObject) return schema.shape;

  return schema;
}
