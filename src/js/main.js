import Login from "./login/login.js";
import { elementContainerIsReady } from "./messages.js";

export default function main() {

    const login = Login();
    login({

        type: elementContainerIsReady,
        data: { container: document.body }

    });

}
