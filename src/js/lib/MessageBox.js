export default function MessageBox({ activationMessage, className, html }) {

    return async message => {

        if (activationMessage === message.type) {

            const concreteHTML = typeof html === "function" ? html(message) : html;
            const dialog = document.createElement("DIALOG");
            dialog.className = className;
            dialog.innerHTML = concreteHTML;
            document.body.appendChild(dialog);
            dialog.addEventListener("close", () => dialog.remove());
            dialog.showModal();


        }

    };

}
