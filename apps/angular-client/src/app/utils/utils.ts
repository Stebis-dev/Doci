export function generateUUID(prefix: string, tag: string): string {
    return prefix + "-" + tag;
}