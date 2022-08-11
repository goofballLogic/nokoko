import { loadCSS } from "../css-loader.js";
import AttributeMutator from "../lib/AttributeMutator.js";
import Element from "../lib/Element.js";
import Filter from "../lib/Filter.js";
import JSONFetcher from "../lib/JSONFetcher.js";
import Receiver from "../lib/Receiver.js";
import Outbound from "../lib/Outbound.js";

import { accessTokenEntered, accessTokenRejected, accessTokenValidated, elementContainerIsReady } from "../messages.js";

loadCSS(import.meta.url);

export default function Login() {

    const receiver = Outbound(send =>

        Receiver({
            name: "Login",
            objects: [
                AttributeMutator({
                    selector: "body",
                    attribute: "class",
                    messages: [accessTokenValidated, accessTokenRejected],
                    mutate: (previousValue, message) => {
                        let values = (previousValue || "").split(" ").filter(x => x.trim());
                        if (message.type === accessTokenValidated) {
                            if (!values.includes("authenticated"))
                                values.push("authenticated");
                        } else {
                            values = values.filter(x => x !== "authenticated");
                        }
                        return values.join(" ");
                    }
                }),
                JSONFetcher({
                    url: "https://api.nokotime.com/v2/current_user/",
                    activationMessage: accessTokenEntered,
                    headersHandler: (headers, message) => ({ ...headers, "X-NokoToken": message.data.value }),
                    outputHandler: (output, message) => output && { ...output, data: { ...output.data, "token": message.data.value } },
                    successMessage: accessTokenValidated,
                    failureMessage: accessTokenRejected
                }),
                Element({
                    tag: "ASIDE",
                    className: "auth",
                    html: message => message.type === accessTokenValidated
                        ? `
                            <div>Authenticated as ${message.data.email}</div>
                            <button class="cancel">Cancel</button>
                        `: `
                            <div>Not authenticated</div>
                            <label>
                                <span class="text">Access token</span>
                                <input type="password" name="access-token" value="${sessionStorage.getItem("access-token") || ""}" />
                            </label>
                        `,
                    mutationMessages: [
                        elementContainerIsReady,
                        accessTokenValidated,
                        accessTokenRejected
                    ],
                    events: {

                        "click": e => {

                            if (e.target.className === "cancel") {

                                sessionStorage.removeItem("access-token");
                                receiver({ type: accessTokenRejected });

                            }

                        },
                        "input": e => {

                            if (e.target.name === "access-token") {

                                sessionStorage.setItem("access-token", e.target.value);
                                receiver({ type: accessTokenEntered, data: { value: e.target.value } });

                            }

                        }

                    }

                }),
                message => {

                    if (message.type === elementContainerIsReady) {

                        const password = document.querySelector("[type=password]");
                        if (password.value) {

                            return {
                                type: accessTokenEntered,
                                data: { value: password.value }
                            };

                        }

                    }
                },
                Filter({
                    messages: [accessTokenValidated, accessTokenRejected],
                    outbound: message => send(message)
                })
            ]
        })
    );
    return receiver;

}
