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

                        const entryGroupsMessage = message.data[entriesGrouped];
                        const entryGroupMetadata = entryGroupsMessage[entriesGrouped_metadata];
                        const groupedEntries = entryGroupsMessage[entriesGrouped_groupedEntries];
                        const entryGroupLookbacks = message.data[entryGroupLookbacksCalculated]?.data;
                        const editWeekCode = entryGroupMetadata.nextWeekCode;
                        const editWeek = entryGroupMetadata.nextWeek;
                        const projects = message.data[projectsRetrieved]?.data;

                        let editProjectIds;
                        let editGroup;
                        for (const [lookbackWhenCode, lookback] of entryGroupLookbacks.entries()) {

                            if (editWeekCode >= lookbackWhenCode) {
                                editProjectIds = lookback;
                                [, editGroup] = groupedEntries.find(([groupWhenCode]) => lookbackWhenCode === groupWhenCode) || [];
                                break;
                            }

                        }
                        editProjectIds = editProjectIds || new Map();
                        editGroup = editGroup || [];


                        const projectOption = (project, selectedProjectId) => `
                            <option value="${project.id}"${project.id === selectedProjectId ? " selected" :
                                editProjectIds.has(project.id) ? " disabled" : ""}>
                                ${htmlEncode(project.name)}
                            </option>
                        `;

                        const offsetDate = offset => {
                            const when = new Date(editWeek.getFullYear(), editWeek.getMonth(), editWeek.getDate() + offset);
                            return `${when.getFullYear()}-${(when.getMonth() + 1).leftPad("0", 2)}-${when.getDate().leftPad("0", 2)}`;
                        }

                        const nameFor = (projectId, dateOffset) => `${projectId}_${offsetDate(dateOffset)}`;

                        const valueFor = (projectId, dateOffset) => {

                            // const whenCode = offsetDate(dateOffset);
                            // const found = editGroup.filter(e => e.date === whenCode && e.project.id === projectId);

                        }

                        const projectSection = (selectedProjectId, className) => `
                            <tr${selectedProjectId ? ` data-projectid="${selectedProjectId}"` : ""}${className ? ` class=${className}` : ""}>
                                <td>
                                    <select name="project">
                                        <option></option>
                                        ${projects.map(p => projectOption(p, selectedProjectId)).join("\n")}
                                    </select>
                                </td>
                                ${Array.from("0123456").map((_, i) => `
                                    <td>
                                        <input type="number" min="0" max="24" name="${nameFor(selectedProjectId, i)}" value="${valueFor(selectedProjectId, i) || ""}">
                                    </td>
                                `).join("\n")}
                            </tr>
                        `;

                        const ordinals = { "1": "st", "2": "nd", "3": "rd" };
                        const headingOffset = index => {
                            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                            const working = new Date(editWeek.getFullYear(), editWeek.getMonth(), editWeek.getDate() + index);
                            const digit = working.getDate();
                            const trailingDigit = digit.toString()[1] || digit.toString()[0];
                            const postfix = ordinals[trailingDigit] || "th";
                            return `${days[index]} ${working.getDate()}${postfix}`;
                        }

                        return `
                            <h3>Week beginning ${entryGroupMetadata.nextWeekText}</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th></th>
                                        ${Array.from("0123456").map((_, i) => `<th>${headingOffset(i)}</th>`).join("\n")}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Array.from(editProjectIds.keys()).map(projectSection).join("\n")}
                                    ${projectSection("new", "new")}
                                </tbody>
                            </table>
                        `;

                    },
                    events: {
                        "change": (e, form) => {
                            if (e.target.tagName === "SELECT") {
                                const selectedProjectId = e.target.value;
                                let row = e.target;
                                while (row.tagName !== "TR") row = row.parentElement;
                                const previouslySelectedProjectId = row.dataset.projectid;

                                // update this row
                                row.dataset.projectid = selectedProjectId;
                                for (let i of row.querySelectorAll("input[type=number]")) {
                                    i.name = i.name.replace(previouslySelectedProjectId, selectedProjectId);
                                }

                                // update other rows
                                for (let r of form.querySelectorAll("TR")) {
                                    if (r === row) continue;
                                    r.querySelector(`OPTION[value="${previouslySelectedProjectId}"]`)?.removeAttribute("disabled");
                                    r.querySelector(`OPTION[value="${selectedProjectId}"]`)?.setAttribute("disabled", "");
                                }
                            }
                        }
                    },
                    postMutationMessage: entrySlotsRendered,
                })
            ]
        })

    );
