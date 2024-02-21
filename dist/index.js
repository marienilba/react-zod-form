"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useForm = void 0;
const react_1 = require("react");
const zod_1 = require("zod");
const form_utils_1 = require("./form-utils");
const utils_1 = require("./utils");
const zod_utils_1 = require("./zod-utils");
function useForm(schema, submit) {
    const [errors, setErrors] = (0, react_1.useState)(new zod_1.z.ZodError([]));
    const mock = FormUtil.mock(schema);
    return {
        form: {
            submit: async (event) => {
                if ((0, zod_utils_1.promises)(schema))
                    event.preventDefault();
                const result = await FormUtil.process(schema, event);
                // @ts-ignore
                setErrors(result.success ? new ZodError([]) : result.error);
                const ctx = await submit(Object.assign(event, result));
                if (ctx)
                    setErrors(ctx);
            },
        },
        fields: FormUtil.generateFields(mock),
        errors: Object.assign(FormUtil.generateErrors(mock, errors), {
            errors: () => errors.errors,
        }),
        watch: FormUtil.generateWatch(schema, setErrors),
    };
}
exports.useForm = useForm;
class FormUtil {
    static generateWatch(schema, setError) {
        return (ref, path) => {
            const [state, setState] = (0, react_1.useState)(null);
            const validation = (0, react_1.useRef)(FormUtil.extraction(schema, (0, utils_1.pathArray)(path)));
            (0, react_1.useEffect)(() => {
                const listener = async (event) => {
                    if (!ref.current || !validation.current)
                        return;
                    const target = event.target;
                    const impl = (0, utils_1.implied)((0, utils_1.pathArray)(target.name), (0, utils_1.pathArray)(path));
                    if (impl) {
                        const raw = Object.fromEntries(new FormData(ref.current));
                        const mapped = (0, form_utils_1.mapObject)(raw);
                        const nestOut = (0, utils_1.outObject)((0, utils_1.pathArray)(path), mapped);
                        const validate = await validation.current.safeParseAsync(nestOut);
                        if (validate.success) {
                            setState(validate.data);
                            setError((errors) => new zod_1.z.ZodError(errors.errors.filter((error) => !(0, utils_1.implied)(error.path, (0, utils_1.pathArray)(path)))));
                        }
                        else {
                            setError((error) => {
                                const input = ref.current.querySelector(`[name="${path}"]`);
                                if (input)
                                    input.reportValidity();
                                const ep = (0, utils_1.pathArray)(path);
                                validate.error.errors.forEach((error) => {
                                    error.path = ep;
                                });
                                return new zod_1.z.ZodError([
                                    ...error.errors.filter((error) => !(0, utils_1.implied)(error.path, ep)),
                                    ...validate.error.errors,
                                ]);
                            });
                        }
                    }
                };
                if (ref.current)
                    ref.current.addEventListener("input", listener);
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
    static extraction(schema, path) {
        const tar = path.shift();
        if (tar === undefined)
            return schema;
        const throughed = (0, zod_utils_1.through)(schema);
        const obj = (0, zod_utils_1.object)(throughed);
        const shape = obj[tar];
        if ((0, zod_utils_1.through)(shape) instanceof zod_1.z.ZodObject) {
            return FormUtil.extraction(shape, path);
        }
        else if ((0, zod_utils_1.through)(shape) instanceof zod_1.z.ZodArray) {
            if (path.length)
                return FormUtil.extraction((0, zod_utils_1.array)(shape), path);
            else
                return shape;
        }
        return shape;
    }
    /**
     * safeParse the form data with the schema
     * @param schema
     * @param event
     * @returns ZodSafeParse
     */
    static async process(schema, event) {
        const raw = Object.fromEntries(new FormData(event.currentTarget));
        const mapped = (0, form_utils_1.mapObject)(raw);
        return await schema.safeParseAsync(mapped);
    }
    /**
     * Generate fields name based on object
     * @param object
     * @param path
     */
    static generateFields(object, path = "") {
        return Object.keys(object).reduce((prev, key) => {
            const value = object[key];
            if (zod_1.z.object({}).safeParse(value).success) {
                return {
                    ...prev,
                    [key]: () => Object.assign(FormUtil.generateFields(value, path + `[${key.toString()}]`), { name: () => path + `[${key.toString()}]` }),
                };
            }
            if (zod_1.z.array(zod_1.z.any()).min(1).safeParse(value).success) {
                const inside = value[0];
                if (zod_1.z.object({}).safeParse(inside).success ||
                    zod_1.z.array(zod_1.z.any()).min(1).safeParse(inside).success) {
                    return {
                        ...prev,
                        [key]: (index) => typeof index === "number"
                            ? Object.assign(FormUtil.generateFields(inside, path + `[${key.toString()}]` + `[${index}]`), { name: () => path + `[${key.toString()}]` + `[${index}]` })
                            : { name: () => path + `[${key.toString()}]` },
                    };
                }
                else {
                    return {
                        ...prev,
                        [key]: (index) => ({
                            name: () => path + typeof index === "number"
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
        }, {});
    }
    /**
     * Generate errors name based on object
     * @param object
     * @param path
     */
    static generateErrors(object, errors, path = []) {
        return Object.keys(object).reduce((prev, key) => {
            const value = object[key];
            if (zod_1.z.object({}).safeParse(value).success) {
                return {
                    ...prev,
                    [key]: () => Object.assign({}, FormUtil.generateErrors(value, errors, [...path, key]), { errors: () => (0, zod_utils_1.findError)(errors, [...path, key]) }),
                };
            }
            if (zod_1.z.array(zod_1.z.any()).min(1).safeParse(value).success) {
                const inside = value[0];
                if (zod_1.z.object({}).safeParse(inside).success ||
                    zod_1.z.array(zod_1.z.any()).min(1).safeParse(inside).success) {
                    return {
                        ...prev,
                        [key]: (index) => typeof index === "number"
                            ? Object.assign({}, FormUtil.generateErrors(inside, errors, [
                                ...path,
                                key,
                                index,
                            ]), {
                                errors: () => (0, zod_utils_1.findError)(errors, [...path, key, index]),
                            })
                            : { errors: () => (0, zod_utils_1.findError)(errors, [...path, key]) },
                    };
                }
                else {
                    return {
                        ...prev,
                        [key]: (index) => ({
                            errors: () => (0, zod_utils_1.findError)(errors, typeof index === "number"
                                ? [...path, key, index]
                                : [...path, key]),
                        }),
                    };
                }
            }
            return {
                ...prev,
                [key]: () => ({
                    errors: () => (0, zod_utils_1.findError)(errors, [...path, key]),
                }),
            };
        }, {});
    }
    /**
     * Mock a value object based from a zod schema
     * @param schema
     * @returns mock
     */
    static mock(schema) {
        const shape = (0, zod_utils_1.object)(schema);
        const mock = (0, zod_utils_1.shapeOut)(shape);
        return mock ?? {};
    }
}
//# sourceMappingURL=index.js.map