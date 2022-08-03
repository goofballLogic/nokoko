import Element from "../lib/Element.js";

export default function Login() {

    const loginElement = Element({ tag: "ASIDE", className: "auth", html: "Not authenticated" });
    return async ({ type, data }) => {

        loginElement({ type, data });

    };

}
