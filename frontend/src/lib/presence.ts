const colors = ["#f1a66a", "#9b9ff1", "#64c7ae", "#ed8bb1", "#75b9ef", "#dbc16c"];

export function participantColor(id: string): string {
    let hash = 0;
    for (const character of id) {
        hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    }
    return colors[hash % colors.length];
}
