export default function MessageBox({ activationMessage, deactivationMessages, className, html }) {

    let dialog;

    return async message => {

        if (activationMessage === message.type) {

            if (dialog) {
                try {
                    dialog.remove();
                } catch (_) {

                } finally {
                    dialog = null;
                }
            }

            const concreteHTML = typeof html === "function" ? html(message) : html;
            dialog = document.createElement("DIALOG");
            dialog.className = className;
            dialog.innerHTML = concreteHTML + `<div class="controls"><button class="close">Close</button></div>`;
            document.body.appendChild(dialog);
            dialog.addEventListener("close", () => dialog.remove());
            dialog.querySelector("button.close").addEventListener("click", () => dialog.remove());
            dialog.showModal();

        } else if (deactivationMessages && deactivationMessages.includes(message.type)) {

            if (dialog) {
                dialog.remove();
                dialog = null;
            }

        }

    };

}
