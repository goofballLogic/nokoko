import AttributeMutator from "../lib/AttributeMutator.js";
import Element from "../lib/Element.js";
import JSONFetcher from "../lib/JSONFetcher.js";
import { accessTokenEntered, accessTokenRejected, accessTokenValidated, elementContainerIsReady } from "../messages.js";

export default function Login() {

    const bodyDecorator = AttributeMutator({
        selector: "body",
        attribute: "class",
        messages: [accessTokenValidated, accessTokenRejected],
        mutate: (previousValue, message) => {
            const values = (previousValue || "").split(" ").filter(x => x.trim());
            if (message.type === accessTokenValidated) {
                if (!values.includes("authenticated"))
                    values.push("authenticated");
            } else {
                values = values.filter(x => x !== "authenticated");
            }
            return values.join(" ");
        }
    });

    const jsonFetcher = JSONFetcher({
        url: "https://api.nokotime.com/v2/current_user/",
        activationMessage: accessTokenEntered,
        headersHandler: (headers, message) => ({ ...headers, "X-NokoToken": message.data.value }),
        successMessage: accessTokenValidated,
        failureMessage: accessTokenRejected
    });

    const loginElement = Element({
        tag: "ASIDE",
        className: "auth",
        html: message => `

            <div>${message.type === accessTokenValidated
                ? `Authenticated as ${message.data.email}`
                : "Not authenticated"
            }</div>
            <label>
                <span class="text">Access token</span>
                <input type="password" name="access-token" />
            </label>

        `,
        mutationMessages: [elementContainerIsReady, accessTokenValidated],
        events: {
            "input": e => {
                if (e.target.name === "access-token") {
                    receiver({
                        type: accessTokenEntered,
                        data: { value: e.target.value }
                    })
                }
            }
        }
    });

    let stack = [];
    async function receiver(message) {

        stack.push(message);
        let next = stack.shift();
        while (next) {
            const results = await Promise.all([
                loginElement(next),
                jsonFetcher(next),
                bodyDecorator(next)
            ]);
            stack.push(...results.filter(x => x));
            next = stack.shift();
            if (stack.length > 100) {
                console.error(stack);
                throw new Error("Stack overflow");
            }
        }

    }

    return receiver;

}
