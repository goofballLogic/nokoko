import { loadCSS } from "../css-loader.js";
import Group from "../lib/Group.js";
import JSONFetcher from "../lib/JSONFetcher.js";
import MessageCache from "../lib/MessageCache.js";
import Outbound from "../lib/Outbound.js";
import Receiver from "../lib/Receiver.js";
import Element from "../lib/Element.js";
import { accessTokenValidated, entriesRetrieved } from "../messages.js";

loadCSS(import.meta.url);

const userData = Symbol("Validated user data");
const groupedEntries = Symbol("Grouped entries");
const groupedEntriesTotals = Symbol("Totals of grouped entries");

const groupEntryFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "full" });
function groupEntryDateFormat(dateString) {
    const parts = groupEntryFormatter.formatToParts(new Date(dateString));
    const partsHash = Object.fromEntries(parts.map(x => [x.type, x.value]));
    return `${partsHash["month"]} ${partsHash["day"]}, ${partsHash["year"]}`;
}

export default function ViewContext() {

    return Outbound(send =>

        Receiver({
            name: "View/Context",
            objects: [
                MessageCache({
                    cacheMessage: accessTokenValidated,
                    extract: message => ({
                        token: message.data?.token,
                        userId: message.data.id
                    }),
                    slot: userData,
                    inner:
                        JSONFetcher({
                            url: message => `https://api.nokotime.com/v2/entries?user_ids=${message[userData].userId}&per_page=1000`,
                            activationMessage: accessTokenValidated,
                            headersHandler: (headers, message) => ({ ...headers, "X-NokoToken": message[userData].token }),
                            successMessage: entriesRetrieved
                        })
                }),
                Group({
                    groupMessage: entriesRetrieved,
                    groupBy: item => {
                        const when = new Date(item.date);
                        const zeroDay = new Date(when.getFullYear(), when.getMonth(), when.getDate() - when.getDay());
                        return `${zeroDay.getFullYear()}-${(zeroDay.getMonth() + 1).leftPad("0", 2)}-${zeroDay.getDate().leftPad("0", 2)}`;
                    },
                    groupsSlot: groupedEntries,
                    aggregate: items => items.map(x => x.minutes).reduce((x, y) => x + y),
                    aggregateSlot: groupedEntriesTotals,
                    inner: Element({
                        tag: "OL",
                        className: "entry-groups",
                        mutationMessages: [entriesRetrieved],
                        html: message => message[groupedEntries].map(group => `
                            <li>
                                <details>
                                    <summary>
                                        <span>${groupEntryDateFormat(group[0])}</span>
                                        <span>${Number(group[groupedEntriesTotals] || "0") / 60} hours</span>
                                    </summary>
                                    ${JSON.stringify(group)}
                                </details>
                            </li>
                        `).join("\n")
                    })
                })
            ]
        })

    );

}
