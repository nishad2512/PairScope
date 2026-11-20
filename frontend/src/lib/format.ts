export function readable(value: string) {
    return value
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^./, (char) => char.toUpperCase());
}
export function dateTime(value: string | null) {
    return value
        ? new Intl.DateTimeFormat(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
          }).format(new Date(value))
        : "Not scheduled";
}
export function errorMessage(error: unknown) {
    return error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.";
}
