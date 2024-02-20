declare global {
  interface ObjectConstructor {
    keys<T extends object>(o: T): (keyof T)[];
  }
}

import {
  Dispatch,
  FormEvent,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { ZodArray, ZodError, ZodObject, ZodSchema, z } from "zod";
import { mapObject } from "./form-utils";
import { implied, outObject, pathArray } from "./utils";
import {
  array,
  findError,
  object,
  promises,
  shapeOut,
  through,
} from "./zod-utils";

export function useForm<TSchema extends ZodSchema>(
  schema: TSchema,
  submit: (
    event: FormEvent<HTMLFormElement> &
      z.SafeParseReturnType<z.infer<TSchema>, z.infer<TSchema>>
  ) => ZodError<TSchema> | void | Promise<void | ZodError<TSchema>>
) {
  const [errors, setErrors] = useState<z.ZodError<z.infer<TSchema>>>(
    new ZodError([])
  );

  const mock = FormUtil.mock(schema);

  return {
    form: {
      submit: async (event: FormEvent<HTMLFormElement>) => {
        if (promises(schema)) event.preventDefault();
        const result = await FormUtil.process(schema, event);
        // @ts-ignore
        setErrors(result.success ? new ZodError([]) : result.error);
        const ctx = await submit(Object.assign(event, result));
        if (ctx) setErrors(ctx);
      },
    },
    fields: FormUtil.generateFields(mock),
    errors: Object.assign(FormUtil.generateErrors(mock, errors), {
      errors: () => errors.errors,
    }),
    watch: FormUtil.generateWatch(schema, setErrors),
  };
}

class FormUtil {
  static generateWatch<TSchema extends ZodSchema>(
    schema: TSchema,
    setError: Dispatch<SetStateAction<ZodError>>
  ) {
    return <TPath extends string>(
      ref: RefObject<HTMLFormElement>,
      path: WatchPatcher<TPath, DeepRemoveOptionals<TSchema["_type"]>>
    ): WatchResult<TPath, DeepRemoveOptionals<TSchema["_type"]>> | null => {
      const [state, setState] = useState<WatchResult<
        TPath,
        DeepRemoveOptionals<TSchema["_type"]>
      > | null>(null);

      const validation = useRef(FormUtil.extraction(schema, pathArray(path)));

      useEffect(() => {
        const listener = async (event: Event) => {
          if (!ref.current || !validation.current) return;
          const target = event.target as HTMLInputElement;

          const impl = implied(pathArray(target.name), pathArray(path));

          if (impl) {
            const raw = Object.fromEntries(new FormData(ref.current));
            const mapped = mapObject(raw);

            const nestOut = outObject(pathArray(path), mapped);

            const validate = await validation.current.safeParseAsync(nestOut);

            if (validate.success) {
              setState(validate.data);
              setError(
                (errors) =>
                  new ZodError(
                    errors.errors.filter(
                      (error) => !implied(error.path, pathArray(path))
                    )
                  )
              );
            } else {
              setError((error) => {
                const input = ref.current!.querySelector(
                  `[name="${path}"]`
                ) as HTMLInputElement | null;
                if (input) input.reportValidity();

                const ep = pathArray(path);
                validate.error.errors.forEach((error) => {
                  error.path = ep;
                });
                return new ZodError([
                  ...error.errors.filter((error) => !implied(error.path, ep)),
                  ...validate.error.errors,
                ]);
              });
            }
          }
        };

        if (ref.current) ref.current.addEventListener("input", listener);
        return () => ref.current?.removeEventListener("input", listener);
      }, [ref]);

      return state;
    };
  }

  /**
   * Get schema based from path
   * @param schema
   * @param path
   */
  static extraction<TSchema extends ZodSchema>(
    schema: TSchema,
    path: string[]
  ): ZodSchema<any> | undefined {
    const tar = path.shift();
    if (tar === undefined) return schema;

    const throughed = through(schema);
    const obj = object(throughed);

    const shape = obj[tar]!;
    if (through(shape) instanceof ZodObject) {
      return FormUtil.extraction(shape, path);
    } else if (through(shape) instanceof ZodArray) {
      if (path.length) return FormUtil.extraction(array(shape), path);
      else return shape;
    }

    return shape;
  }

  /**
   * safeParse the form data with the schema
   * @param schema
   * @param event
   * @returns ZodSafeParse
   */
  static async process<TSchema extends ZodSchema>(
    schema: TSchema,
    event: FormEvent<HTMLFormElement>
  ) {
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const mapped = mapObject(raw);
    return await schema.safeParseAsync(mapped);
  }

  /**
   * Generate fields name based on object
   * @param object
   * @param path
   */
  static generateFields<TObject extends Record<PropertyKey, any>>(
    object: TObject,
    path: string = ""
  ): DeepWrapField<DeepRemoveOptionals<TObject>> {
    return Object.keys(object).reduce((prev, key) => {
      const value = object[key];
      if (z.object({}).safeParse(value).success) {
        return {
          ...prev,
          [key]: () =>
            Object.assign(
              FormUtil.generateFields(value, path + `[${key.toString()}]`),
              { name: () => path + `[${key.toString()}]` }
            ),
        };
      }
      if (z.array(z.any()).min(1).safeParse(value).success) {
        const inside = value[0];
        if (
          z.object({}).safeParse(inside).success ||
          z.array(z.any()).min(1).safeParse(inside).success
        ) {
          return {
            ...prev,
            [key]: (index?: number) =>
              typeof index === "number"
                ? Object.assign(
                    FormUtil.generateFields(
                      inside,
                      path + `[${key.toString()}]` + `[${index}]`
                    ),
                    { name: () => path + `[${key.toString()}]` + `[${index}]` }
                  )
                : { name: () => path + `[${key.toString()}]` },
          };
        } else {
          return {
            ...prev,
            [key]: (index?: number) => ({
              name: () =>
                path + typeof index === "number"
                  ? `[${key.toString()}]` + `[${index}]`
                  : `[${key.toString()}]`,
            }),
          };
        }
      }

      return {
        ...prev,
        [key]: () => ({
          name: () => path + `[${key.toString()}]`,
        }),
      };
    }, {} as any);
  }

  /**
   * Generate errors name based on object
   * @param object
   * @param path
   */
  static generateErrors<
    TObject extends Record<PropertyKey, any>,
    TError extends ZodError
  >(
    object: TObject,
    errors: TError,
    path: PropertyKey[] = []
  ): DeepWrapError<DeepRemoveOptionals<TObject>> {
    return Object.keys(object).reduce((prev, key) => {
      const value = object[key];
      if (z.object({}).safeParse(value).success) {
        return {
          ...prev,
          [key]: () =>
            Object.assign(
              {},
              FormUtil.generateErrors(value, errors, [...path, key]),
              { errors: () => findError(errors, [...path, key]) }
            ),
        };
      }
      if (z.array(z.any()).min(1).safeParse(value).success) {
        const inside = value[0];
        if (
          z.object({}).safeParse(inside).success ||
          z.array(z.any()).min(1).safeParse(inside).success
        ) {
          return {
            ...prev,
            [key]: (index?: number) =>
              typeof index === "number"
                ? Object.assign(
                    {},
                    FormUtil.generateErrors(inside, errors, [
                      ...path,
                      key,
                      index,
                    ]),
                    {
                      errors: () => findError(errors, [...path, key, index]),
                    }
                  )
                : { errors: () => findError(errors, [...path, key]) },
          };
        } else {
          return {
            ...prev,
            [key]: (index?: number) => ({
              errors: () =>
                findError(
                  errors,
                  typeof index === "number"
                    ? [...path, key, index]
                    : [...path, key]
                ),
            }),
          };
        }
      }

      return {
        ...prev,
        [key]: () => ({
          errors: () => findError(errors, [...path, key]),
        }),
      };
    }, {} as any);
  }

  /**
   * Mock a value object based from a zod schema
   * @param schema
   * @returns mock
   */
  static mock<TSchema extends ZodSchema>(schema: TSchema): TSchema["_type"] {
    const shape = object(schema);
    const mock = shapeOut(shape);

    return mock ?? {};
  }
}

type DeepRemoveOptionals<T> = T extends object
  ? {
      [K in keyof T]-?: DeepRemoveOptionals<T[K]>;
    }
  : T;

type DeepWrapFieldArray<T extends any[], P extends string> = <I>(
  index?: I
) => I extends number
  ? DeepWrapField<T[number], `${P}[${number}]`> & {
      name: () => `${P}[${number}]`;
    }
  : {
      name: () => `${P}[]`;
    };

type DeepWrapFieldObject<T, P extends string> = () => DeepWrapField<
  T,
  `${P}[${string}]`
> & {
  name: () => `${P}[${string}]`;
};

type DeepWrapField<T, P extends string = ""> = {
  [K in keyof T]: T[K] extends any[]
    ? DeepWrapFieldArray<T[K], `${P}[${K & string}]`>
    : T[K] extends { [x: string]: any }
    ? DeepWrapFieldObject<T[K], `${P}[${K & string}]`>
    : () => { name: () => `${P}[${K & string}]` };
} & {};

type DeepWrapErrorArray<T extends any[]> = <I>(index?: I) => I extends number
  ? DeepWrapError<T[number]> & {
      errors: () => ZodError<T[number]>["errors"] | undefined;
    }
  : { errors: () => ZodError<T[number]>["errors"] | undefined };

type DeepWrapErrorObject<T> = () => DeepWrapError<T> & {
  errors: () => ZodError<T>["errors"] | undefined;
};

type DeepWrapError<T> = {
  [K in keyof T]: T[K] extends any[]
    ? DeepWrapErrorArray<T[K]>
    : T[K] extends { [x: string]: any }
    ? DeepWrapErrorObject<T[K]>
    : () => { errors: () => ZodError<T[K]>["errors"] | undefined };
} & {};

type WatchPatcher<
  T extends string,
  M,
  N = false
> = T extends `[${infer K}]${infer R}`
  ? N extends true
    ? R extends `[${infer RK}]${infer RR}`
      ? RK extends keyof M
        ? RR extends `[${string | number}]`
          ? M[RK] extends any[]
            ? `[${K}][${RK}]${WatchPatcher<RR, M[RK][number], true>}`
            : `[${K}][${RK}]${WatchPatcher<RR, M[RK]>}`
          : RR extends ""
          ? T
          : never
        : never
      : K extends `${number}`
      ? T
      : never
    : K extends keyof M
    ? R extends `[${string | number}]`
      ? M[K] extends any[]
        ? `[${K}]${WatchPatcher<R, M[K][number], true>}`
        : `[${K}]${WatchPatcher<R, M[K]>}`
      : R extends ""
      ? T
      : never
    : never
  : never;

type WatchResult<T extends string, M> = T extends `[${infer K}]${infer R}`
  ? K extends `${number}`
    ? M extends any[]
      ? WatchResult<R, M[number]>
      : never
    : K extends keyof M
    ? WatchResult<R, M[K]>
    : never
  : M;
