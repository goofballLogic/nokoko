import Outbound from "./Outbound.js";

export default function EventHandler({ activationMessage, elementLocator, eventName, handler }) {

    return Outbound(send => {

        let activated = false;
        function activate() {

            const element = document.querySelector(elementLocator);
            if (element) {

                activated = true;
                element.addEventListener(eventName, async e => {

                    const result = await handler(e);
                    send(result);

                });

            }

        }

        return async message => {

            if (message.type === activationMessage && !activated)
                activate();

        };

    });

}
