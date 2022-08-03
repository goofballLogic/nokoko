export default function AttributeMutator({ selector, attribute, messages, mutate }) {

    if (!selector) throw new Error("Invalid selector");
    if (!attribute) throw new Error("Invalid attribute");
    if (!(messages && messages.length)) throw new Error("No messages");
    if (!mutate) throw new Error("Mutate not defined");

    return message => {

        if (messages.includes(message.type)) {
            const element = document.querySelector(selector);
            if (element) {
                const previousValue = element.getAttribute(attribute);
                const nextValue = mutate(previousValue, message);
                element.setAttribute(attribute, nextValue);
            }
        }
    };
}
