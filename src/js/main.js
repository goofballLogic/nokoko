import { loadCSS } from "./css-loader.js";
import { accessTokenRejected, accessTokenValidated, elementContainerIsReady, entriesGrouped, entrySlotsRendered } from "./messages.js";
import Login from "./login/login.js";
import ViewContext from "./view-context/view-context.js";
import Editing from "./editing/editing.js";
import Saving from "./saving/saving.js";
import Domain from "./lib/Domain.js";
import "./prototype-extensions.js";

loadCSS(import.meta.url);

export default async function main() {

    const subdomains = [
        {
            name: "Login",
            objects: Login,
            outboundMessages: [accessTokenValidated, accessTokenRejected],
        },
        {
            name: "Editing",
            objects: Editing,
            outboundMessages: [entrySlotsRendered]
        },
        {
            name: "View/Context",
            objects: ViewContext,
            outboundMessages: [entriesGrouped]
        },
        {
            name: "Saving",
            objects: Saving,
        }
    ].map(Domain);

    const mainDomain = Domain({
        name: "Main",
        objects: subdomains
    });

    await mainDomain({
        type: elementContainerIsReady,
        data: { container: document.body }
    });

}
