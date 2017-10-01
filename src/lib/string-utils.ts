export function mapToString(items: any[], formater: (item: any) => string, separator = ''): string {
    return items.map(item => formater(item).trim()).join(separator);
}
