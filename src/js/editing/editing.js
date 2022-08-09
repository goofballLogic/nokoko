import { loadCSS } from "../css-loader.js";
import Outbound from "../lib/Outbound.js";
import Receiver from "../lib/Receiver.js";
import Element from "../lib/Element.js";
import { accessTokenRejected, accessTokenValidated, entriesGrouped, entriesGrouped_groupedEntries, entriesGrouped_metadata, entrySlotsRendered } from "../messages.js";
import JSONFetcher from "../lib/JSONFetcher.js";
import MessageCache from "../lib/MessageCache.js";
import Transform from "../lib/Transform.js";
import Gather from "../lib/Gather.js";
import Calculator from "../lib/Calculator.js";

loadCSS(import.meta.url);

const projectsRetrieved = Symbol("Projects retrieved");
const entryGroupLookbacksCalculated = Symbol("Entry group lookbacks calculated");
const entriesGrouped_and_entryGroupLookbacksCalculated_and_projectsRetrieved = Symbol("Entries grouped AND entry group lookbacks calculated AND projects retrieved");

function htmlEncode(x) {
    const txt = document.createElement("textarea");
    txt.innerHTML = x;
    return txt.value;
}

export default () =>

    Outbound(send =>

        Receiver({
            name: "Editing",
            objects: [
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
                    gatherMessage: entriesGrouped_and_entryGroupLookbacksCalculated_and_projectsRetrieved
                }),
                Element({
                    tag: "form",
                    className: "time-entry",
                    mutationMessages: [entriesGrouped_and_entryGroupLookbacksCalculated_and_projectsRetrieved],
                    html: message => {

                        const entryGroups = message.data[entriesGrouped];
                        const entryGroupMetadata = entryGroups[entriesGrouped_metadata];
                        const entryGroupLookbacks = message.data[entryGroupLookbacksCalculated]?.data;
                        const editWeekCode = entryGroupMetadata.nextWeekCode;
                        const projects = message.data[projectsRetrieved]?.data;

                        let lookbackProjectIds;
                        for (const [lookbackWhenCode, lookback] of entryGroupLookbacks.entries()) {

                            if (editWeekCode >= lookbackWhenCode) {
                                // ahead of (or equal to) this entry
                                lookbackProjectIds = lookback;
                                break;
                            }
                        }

                        console.log(message);
                        console.log(lookbackProjectIds);

                        console.log(projects);

                        const lookbackProjects = Array.from(lookbackProjectIds.keys()).map(pid => projects.find(p => p.id === pid));
                        console.log(lookbackProjects);

                        const projectOption = (project, selectedProjectId) => `
                            <option value="${project.id}"${project.id === selectedProjectId ? " selected" : ""}>
                                ${htmlEncode(project.name)}
                            </option>
                        `;

                        const projectSection = (selectedProjectId, className) => `
                            <section${selectedProjectId ? ` data-projectid="${selectedProjectId}"` : ""}${className ? ` class=${className}` : ""}>
                                <select>
                                    <option></option>
                                    ${projects.map(p => projectOption(p, selectedProjectId))}
                                </select>
                            </section>
                        `;

                        return `
                            <article class="edit-main">
                                <h3>Week beginning ${entryGroupMetadata.nextWeekText}</h3>
                                <section class="headings">
                                    <div></div><div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div></div>
                                </section>
                                ${Array.from(lookbackProjectIds.keys()).map(projectSection).join("\n")}
                                ${projectSection(null, "new")}
                            </article>
                        `;
                    },
                    postMutationMessage: entrySlotsRendered,
                })
            ]
        })

    );
