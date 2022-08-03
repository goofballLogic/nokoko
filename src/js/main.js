import { loadCSS } from "./css-loader.js";
import Login from "./login/login.js";
import { elementContainerIsReady } from "./messages.js";

loadCSS(import.meta.url);

export default function main() {

    const login = Login();
    login({

        type: elementContainerIsReady,
        data: { container: document.body }

    });

}
