declare global {
    interface ObjectConstructor {
        keys<T extends object>(o: T): (keyof T)[];
    }
}
import { FormEvent, RefObject } from "react";
import { z } from "zod";
export declare function useForm<TSchema extends z.ZodSchema>(schema: TSchema, submit: (event: FormEvent<HTMLFormElement> & z.SafeParseReturnType<z.infer<TSchema>, z.infer<TSchema>>) => z.ZodError<TSchema> | void | Promise<void | z.ZodError<TSchema>>): {
    form: {
        submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    };
    fields: DeepRemoveOptionals<TSchema["_type"]> extends infer T ? { [K in keyof T]: DeepRemoveOptionals<TSchema["_type"]>[K] extends any[] ? DeepWrapFieldArray<DeepRemoveOptionals<TSchema["_type"]>[K], `[${K & string}]`> : DeepRemoveOptionals<TSchema["_type"]>[K] extends {
        [x: string]: any;
    } ? DeepWrapFieldObject<DeepRemoveOptionals<TSchema["_type"]>[K], `[${K & string}]`> : () => {
        name: () => `[${K & string}]`;
    }; } : never;
    errors: (DeepRemoveOptionals<TSchema["_type"]> extends infer T_1 ? { [K_1 in keyof T_1]: DeepRemoveOptionals<TSchema["_type"]>[K_1] extends any[] ? DeepWrapErrorArray<DeepRemoveOptionals<TSchema["_type"]>[K_1]> : DeepRemoveOptionals<TSchema["_type"]>[K_1] extends {
        [x: string]: any;
    } ? DeepWrapErrorObject<DeepRemoveOptionals<TSchema["_type"]>[K_1]> : () => {
        errors: () => z.ZodIssue[] | undefined;
    }; } : never) & {
        errors: () => z.ZodIssue[];
    };
    watch: <TPath extends string>(ref: RefObject<HTMLFormElement>, path: WatchPatcher<TPath, DeepRemoveOptionals<TSchema["_type"]>, false>) => WatchResult<TPath, DeepRemoveOptionals<TSchema["_type"]>> | null;
};
type DeepRemoveOptionals<T> = T extends object ? {
    [K in keyof T]-?: DeepRemoveOptionals<T[K]>;
} : T;
type DeepWrapFieldArray<T extends any[], P extends string> = <I>(index?: I) => I extends number ? DeepWrapField<T[number], `${P}[${number}]`> & {
    name: () => `${P}[${number}]`;
} : {
    name: () => `${P}[]`;
};
type DeepWrapFieldObject<T, P extends string> = () => DeepWrapField<T, `${P}[${string}]`> & {
    name: () => `${P}[${string}]`;
};
type DeepWrapField<T, P extends string = ""> = {
    [K in keyof T]: T[K] extends any[] ? DeepWrapFieldArray<T[K], `${P}[${K & string}]`> : T[K] extends {
        [x: string]: any;
    } ? DeepWrapFieldObject<T[K], `${P}[${K & string}]`> : () => {
        name: () => `${P}[${K & string}]`;
    };
} & {};
type DeepWrapErrorArray<T extends any[]> = <I>(index?: I) => I extends number ? DeepWrapError<T[number]> & {
    errors: () => z.ZodError<T[number]>["errors"] | undefined;
} : {
    errors: () => z.ZodError<T[number]>["errors"] | undefined;
};
type DeepWrapErrorObject<T> = () => DeepWrapError<T> & {
    errors: () => z.ZodError<T>["errors"] | undefined;
};
type DeepWrapError<T> = {
    [K in keyof T]: T[K] extends any[] ? DeepWrapErrorArray<T[K]> : T[K] extends {
        [x: string]: any;
    } ? DeepWrapErrorObject<T[K]> : () => {
        errors: () => z.ZodError<T[K]>["errors"] | undefined;
    };
} & {};
type WatchPatcher<T extends string, M, N = false> = T extends `[${infer K}]${infer R}` ? N extends true ? R extends `[${infer RK}]${infer RR}` ? RK extends keyof M ? RR extends `[${string | number}]` ? M[RK] extends any[] ? `[${K}][${RK}]${WatchPatcher<RR, M[RK][number], true>}` : `[${K}][${RK}]${WatchPatcher<RR, M[RK]>}` : RR extends "" ? T : never : never : K extends `${number}` ? T : never : K extends keyof M ? R extends `[${string | number}]` ? M[K] extends any[] ? `[${K}]${WatchPatcher<R, M[K][number], true>}` : `[${K}]${WatchPatcher<R, M[K]>}` : R extends "" ? T : never : never : never;
type WatchResult<T extends string, M> = T extends `[${infer K}]${infer R}` ? K extends `${number}` ? M extends any[] ? WatchResult<R, M[number]> : never : K extends keyof M ? WatchResult<R, M[K]> : never : M;
export {};
//# sourceMappingURL=use-form.d.ts.map