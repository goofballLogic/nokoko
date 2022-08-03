import { elementContainerIsReady } from "../messages.js";

export default function Element({ tag, className, html }) {

    const el = document.createElement(tag || "DIV");
    if (className)
        el.className = className;
    if (html)
        el.innerHTML = html;

    return ({ type, data }) => {
        if (type === elementContainerIsReady) {
            const { container } = data || {};
            if (container)
                container.appendChild(el);
            else
                console.warn("Expected data: { container } but got none");
        }
    };
}
