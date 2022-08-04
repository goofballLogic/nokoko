import { loadCSS } from "./css-loader.js";
import Login from "./login/login.js";
import { elementContainerIsReady } from "./messages.js";
import Receiver from "./lib/Receiver.js";
import ViewContext from "./view-context/view-context.js";

loadCSS(import.meta.url);

Number.prototype.leftPad = function (padChar, length) {
    const text = this.toString();
    return text.length < length ? `${padChar.repeat(length - text.length)}${text}` : text;
}

export default async function main() {

    const domain = Receiver({
        name: "Main",
        objects: [
            Login(),
            ViewContext(),
        ]
    });

    await domain({

        type: elementContainerIsReady,
        data: { container: document.body }

    });

}
