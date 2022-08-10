import { elementContainerIsReady } from "../messages.js";

export default function Element({
    tag, className, html, events,
    mutationMessages, postMutationMessage, showMessages, hideMessages
}) {

    const el = document.createElement(tag || "DIV");
    if (className)
        el.className = className;

    const isDynamicHTML = html && typeof html === "function";
    if (html && !isDynamicHTML)
        el.innerHTML = html;

    if (events)
        for (const eventName in events) {
            el.addEventListener(eventName, e => events[eventName](e, el));
        }

    if (showMessages) {
        el.style.display = "none";
    }
    return (message) => {
        let wasMutated = false;
        if (isDynamicHTML && mutationMessages && mutationMessages.includes(message.type)) {
            let previousHTML = el.innerHTML;
            el.innerHTML = html(message) || "";
            wasMutated = previousHTML !== el.innerHTML;
        }
        if (message.type === elementContainerIsReady) {
            wasMutated = true;
            const { container } = message.data || {};
            if (container)
                container.appendChild(el);
            else
                console.warn("Expected data: { container } but got none");
        }
        if (showMessages) {
            if (showMessages.includes(message.type)) {
                el.style.display = "";
            }
        }
        if (hideMessages) {
            if (hideMessages.includes(message.type)) {
                el.style.display = "none";
            }
        }
        if (wasMutated && postMutationMessage) {
            return { type: postMutationMessage };
        }
    };
}
