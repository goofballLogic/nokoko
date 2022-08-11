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
                JSONFetcher({
                    url: message => `https://api.nokotime.com/v2/entries?user_ids=${message.data?.id}&per_page=1000`,
                    activationMessage: accessTokenValidated,
                    headersHandler: (headers, message) => ({ ...headers, "X-NokoToken": message.data?.token }),
                    successMessage: entriesRetrieved
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
                        const whenCode = message[entriesGrouped_groupedEntries][0][0];
                        const when = new Date(message[entriesGrouped_groupedEntries][0][0]);
                        const nextWeek = new Date(when.getFullYear(), when.getMonth(), when.getDate() + 7);
                        message[entriesGrouped_metadata] = {
                            nextWeek,
                            nextWeekText: groupEntryDateFormat(nextWeek),
                            nextWeekCode: whenCode
                        };
                        return message;
                    }
                }),
                Element({
                    tag: "article",
                    className: "view-context",
                    mutationMessages: [entriesGrouped, accessTokenRejected],
                    postMutationMessage: summaryRendered,
                    html: message => `
                        <h2>History</h2>
                        <ol class="entry-groups">${message[entriesGrouped_groupedEntries]?.map(group => `
                            <li>
                                <details>
                                    <summary>
                                        <span>${groupEntryKeyDateFormat(group[0])}</span>
                                        <span>${Number(group[entriesGrouped_groupedEntriesTotals] || "0") / 60} hours</span>
                                    </summary>
                                    ${JSON.stringify(group)}
                                </details>
                            </li>
                        `).join("\n")}
                        </ol>
                    `
                }),
                Filter({
                    messages: [entriesGrouped],
                    outbound: send
                })
            ]
        })

    );

}
