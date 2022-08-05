import { loadCSS } from "../css-loader.js";
import Outbound from "../lib/Outbound.js";
import Receiver from "../lib/Receiver.js";
import Element from "../lib/Element.js";
import { entriesGrouped, entriesGrouped_groupedEntries, entriesGrouped_metadata } from "../messages.js";

loadCSS(import.meta.url);

export default () =>

    Outbound(send =>

        Receiver({
            name: "Editing",
            objects: [
                Element({
                    tag: "form",
                    className: "time-entry",
                    mutationMessages: [entriesGrouped],
                    html: message => `

                        <h3>Week beginning ${message[entriesGrouped_metadata].nextWeekText}</h3>

                    `
                })
            ]
        })

    );
