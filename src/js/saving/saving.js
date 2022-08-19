import { loadCSS } from "../css-loader.js";
import EventHandler from "../lib/EventHandler.js";
import JSONFetcher from "../lib/JSONFetcher.js";
import MessageCache from "../lib/MessageCache.js";
import { accessTokenValidated, entrySlotsRendered, saveFailed, saveRequested, saveSucceeded } from "../messages.js";
import MessageBox from "../lib/MessageBox.js";
import AttributeMutator from "../lib/AttributeMutator.js";

loadCSS(import.meta.url);

const token = Symbol("token");

export default [

    EventHandler({
        activationMessage: entrySlotsRendered,
        elementLocator: "form.time-entry",
        eventName: "submit",
        handler: e => {

            e.preventDefault();
            const form = e.target;
            if (form.dataset.saving === "true") {
                console.warn("Save already in progress");
            } else {
                form.dataset.saving = "true"; // this gets reset by the attribute mutator below
                const data = Array.from(new FormData(e.target).entries());
                const entries = data
                    .map(([name, value]) => ({
                        project_id: Number(name.split("_")[0]),
                        date: name.split("_")[1],
                        minutes: Number(value.split(":")[0]) * 60 + Number(value.split(":")[1] || 0)
                    }))
                    .filter(({ project_id, minutes }) => !!minutes && !!project_id);
                return {
                    type: saveRequested,
                    data: entries
                }
            }
        }
    }),

    AttributeMutator({

        selector: "form.time-entry",
        attribute: "data-saving",
        messages: [saveSucceeded, saveFailed],
        mutate: () => "false"

    }),

    MessageCache({
        cacheMessage: accessTokenValidated,
        extract: x => x.data.token,
        slot: token,
        inner: JSONFetcher({
            url: "https://api.nokotime.com/v2/entries",
            method: "POST",
            activationMessage: saveRequested,
            bodiesExtractor: message => message.data.map(entry => JSON.stringify(entry)),
            headersHandler: (headers, message) => ({ ...headers, "X-NokoToken": message[token] }),
            successMessage: saveSucceeded,
            failureMessage: saveFailed
        })
    }),

    MessageBox({
        className: "save-in-progress",
        activationMessage: saveRequested,
        html: "Saving data. Please wait...",
        deactivationMessages: [saveSucceeded, saveFailed]
    }),

    MessageBox({
        className: "save-failure save-complete",
        activationMessage: saveFailed,
        html: "Save failed"
    }),

    MessageBox({
        className: "save-success save-complete",
        activationMessage: saveSucceeded,
        html: "Save succeeded"
    })

];
