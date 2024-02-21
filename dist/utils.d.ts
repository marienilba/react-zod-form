/**
 * Return if a object have only numeric keys
 * @param obj
 * @returns boolean
 */
export declare function isNumericKeys(obj: Record<string, any>): boolean;
export declare function arrayEquals(array1: PropertyKey[], array2: PropertyKey[]): boolean;
/**
 * Compare if target is implied in path
 * @param target
 * @param path
 * @returns
 */
export declare function implied(target: PropertyKey[], path: PropertyKey[]): boolean;
export declare function outObject(path: string[], object: Record<PropertyKey, any>): Record<PropertyKey, any>;
/**
 * Return path [] format to array format
 * @param path
 * @returns path[]
 */
export declare function pathArray(path: string): string[];
