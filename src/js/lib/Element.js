import { elementContainerIsReady } from "../messages.js";

export default function Element({ tag, className, html, events, mutationMessages }) {

    const el = document.createElement(tag || "DIV");
    if (className)
        el.className = className;

    const isDynamicHTML = html && typeof html === "function";
    if (html && !isDynamicHTML)
        el.innerHTML = html;

    if (events)
        for (const eventName in events) {
            el.addEventListener(eventName, events[eventName]);
        }

    return (message) => {
        if (isDynamicHTML && mutationMessages && mutationMessages.includes(message.type)) {
            el.innerHTML = html(message);
        }
        if (message.type === elementContainerIsReady) {
            const { container } = message.data || {};
            if (container)
                container.appendChild(el);
            else
                console.warn("Expected data: { container } but got none");
        }
    };
}
