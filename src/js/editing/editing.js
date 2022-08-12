import { loadCSS } from "../css-loader.js";
import Element from "../lib/Element.js";
import { accessTokenRejected, accessTokenValidated, entriesGrouped, entriesGrouped_groupedEntries, entrySlotsRendered } from "../messages.js";
import JSONFetcher from "../lib/JSONFetcher.js";
import Gather from "../lib/Gather.js";
import Calculator from "../lib/Calculator.js";
import timeEntry, { events as timeEntryEvents } from "./time-entry.js";
import Filter from "../lib/Filter.js";

loadCSS(import.meta.url);

export const projectsRetrieved = Symbol("Projects retrieved");
export const entryGroupLookbacksCalculated = Symbol("Entry group lookbacks calculated");
const readyToRenderTimeEntryForm = Symbol("Ready to render time entry form");

export default [

    JSONFetcher({
        url: `https://api.nokotime.com/v2/projects?per_page=1000`,
        activationMessage: accessTokenValidated,
        headersHandler: (headers, message) => ({ ...headers, "X-NokoToken": message.data?.token }),
        successMessage: projectsRetrieved
    }),

    Element({
        tag: "DIV",
        html: `
            Projects loading
            <div class="spinner">
                <div class="bounce1"></div>
                <div class="bounce2"></div>
                <div class="bounce3"></div>
            </div>
        `,
        className: "entry-slots-loading",
        showMessages: [accessTokenValidated],
        hideMessages: [entrySlotsRendered, accessTokenRejected]
    }),

    Calculator({
        inputMessages: [entriesGrouped],
        calculation: message => {
            const groups = message[entriesGrouped_groupedEntries]
                .map(([when, entries]) => [when, new Set(entries.map(x => x.project?.id))]);

            groups.forEach((group, i) => {
                let [, projectIds] = group;
                while (projectIds.size < 5 && (++i < groups.length - 1)) {
                    for (const x of groups[i][1]) {
                        projectIds.add(x);
                        if (projectIds.size === 5) break;
                    }
                }
            });
            return {
                type: entryGroupLookbacksCalculated,
                data: new Map(groups)
            };
        }
    }),

    Gather({
        messagesToGather: [entriesGrouped, entryGroupLookbacksCalculated, projectsRetrieved],
        gatherMessage: readyToRenderTimeEntryForm
    }),

    Element({
        tag: "form",
        className: "time-entry",
        mutationMessages: [readyToRenderTimeEntryForm],
        html: timeEntry,
        events: timeEntryEvents,
        postMutationMessage: entrySlotsRendered,
    }),

    Filter({
        messages: [entrySlotsRendered],
        object: () => {
            document.querySelectorAll("form.time-entry input.time-entry")[1]?.focus()
        }
    })

];
