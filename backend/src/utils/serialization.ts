export function serializeJsonSafe<T>(data: T): unknown {
    const replacer = (key: string, value: any) => {
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
    };
    // Using JSON.stringify with a replacer and then JSON.parse is a robust way
    // to convert all nested Date objects and remove any `undefined` values.
    return JSON.parse(JSON.stringify(data, replacer));
}
