import { loadCSS } from "../css-loader.js";
import Group from "../lib/Group.js";
import JSONFetcher from "../lib/JSONFetcher.js";
import MessageCache from "../lib/MessageCache.js";
import Outbound from "../lib/Outbound.js";
import Receiver from "../lib/Receiver.js";
import Element from "../lib/Element.js";
import Filter from "../lib/Filter.js";
import Transform from "../lib/Transform.js";
import {
    accessTokenRejected, accessTokenValidated, entriesRetrieved, summaryRendered,
    entriesGrouped, entriesGrouped_groupedEntries, entriesGrouped_groupedEntriesTotals, entriesGrouped_metadata
} from "../messages.js";

loadCSS(import.meta.url);

const userData = Symbol("Validated user data");

const groupEntryFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "full" });
function groupEntryKeyDateFormat(dateString) {
    return groupEntryDateFormat(new Date(dateString));
}
function groupEntryDateFormat(date) {
    const parts = groupEntryFormatter.formatToParts(date);
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
                Element({
                    tag: "DIV",
                    html: `
                        Entries loading
                        <div class="spinner">
                            <div class="bounce1"></div>
                            <div class="bounce2"></div>
                            <div class="bounce3"></div>
                        </div>
                    `,
                    className: "entry-groups-loading",
                    showMessages: [accessTokenValidated],
                    hideMessages: [summaryRendered, accessTokenRejected]
                }),
                Transform({
                    inner: Group({
                        groupMessage: entriesRetrieved,
                        groupBy: item => {
                            const when = new Date(item.date);
                            const zeroDay = new Date(when.getFullYear(), when.getMonth(), when.getDate() - when.getDay());
                            return `${zeroDay.getFullYear()}-${(zeroDay.getMonth() + 1).leftPad("0", 2)}-${zeroDay.getDate().leftPad("0", 2)}`;
                        },
                        groupsSlot: entriesGrouped_groupedEntries,
                        aggregate: items => items.map(x => x.minutes).reduce((x, y) => x + y),
                        aggregateSlot: entriesGrouped_groupedEntriesTotals,
                        resultMessage: entriesGrouped,
                    }),
                    transformMessages: [entriesGrouped],
                    after: message => {
                        console.log(message);
                        const when = new Date(message[entriesGrouped_groupedEntries][0][0]);
                        const nextWeek = new Date(when.getFullYear(), when.getMonth(), when.getDate() + 7);
                        message[entriesGrouped_metadata] = {
                            nextWeek,
                            nextWeekText: groupEntryDateFormat(nextWeek)
                        };
                        return message;
                    }
                }),
                Element({
                    tag: "OL",
                    className: "entry-groups",
                    mutationMessages: [entriesGrouped, accessTokenRejected],
                    postMutationMessage: summaryRendered,
                    html: message => message[entriesGrouped_groupedEntries]?.map(group => `
                        <li>
                            <details>
                                <summary>
                                    <span>${groupEntryKeyDateFormat(group[0])}</span>
                                    <span>${Number(group[entriesGrouped_groupedEntriesTotals] || "0") / 60} hours</span>
                                </summary>
                                ${JSON.stringify(group)}
                            </details>
                        </li>
                    `).join("\n")
                }),
                Filter({
                    messages: [entriesGrouped],
                    outbound: send
                })
            ]
        })

    );

}
