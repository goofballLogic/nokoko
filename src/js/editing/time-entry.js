import { entriesGrouped, entriesGrouped_groupedEntries, entriesGrouped_metadata, entrySlotsUpdated } from "../messages.js";
import { entryGroupLookbacksCalculated, projectsRetrieved } from "./editing.js";

function htmlEncode(x) {
    const txt = document.createElement("textarea");
    txt.innerHTML = x;
    return txt.value;
}

function preProcess(message) {

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
    return { editProjectIds, editWeek, projects, entryGroupMetadata };

}


export default function render(message) {

    const { editProjectIds, editWeek, projects, entryGroupMetadata } = preProcess(message);


    const projectOption = (project, selectedProjectId) => `
        <option value="${project.id}"${project.id === selectedProjectId ? " selected" : editProjectIds.has(project.id) ? " disabled" : ""}>
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
                    <input
                        type="text"
                        name="${nameFor(selectedProjectId, i)}"
                        value="${valueFor(selectedProjectId, i) || ""}"
                        pattern="[0-9]{1,2}(?::[0-9]{2})?" />
                </td>
            `).join("\n")}
        </tr>
    `;

    const ordinals = { "1": "st", "2": "nd", "3": "rd" };
    function headingOffset(index) {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const working = new Date(editWeek.getFullYear(), editWeek.getMonth(), editWeek.getDate() + index);
        const digit = working.getDate();
        const trailingDigit = digit.toString()[1] || digit.toString()[0];
        const postfix = ordinals[trailingDigit] || "th";
        return `${days[index]} ${working.getDate()}${postfix}`;
    }

    return `
        <h2>Week beginning ${entryGroupMetadata.nextWeekText}</h2>
        <label class="incidental-control"><input type="checkbox" id="weekends">Weekends</label>
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
        <button type="submit">Save</button>
    `;
}


export const events = {

    "change": (e, form) => {
        if (e.target.id === "weekends") {

            if (e.target.checked) {
                if (!form.classList.contains("show-weekends"))
                    form.classList.add("show-weekends");
            }
            else {
                while (form.classList.contains("show-weekends"))
                    form.classList.remove("show-weekends");
            }

        } else {

            if (e.target.tagName === "SELECT") {

                const selectedProjectId = e.target.value;
                let row = e.target;
                while (row.tagName !== "TR") row = row.parentElement;
                const previouslySelectedProjectId = row.dataset.projectid;

                // update this row
                row.dataset.projectid = selectedProjectId;
                for (let i of row.querySelectorAll("input[type=text]")) {
                    i.name = i.name.replace(previouslySelectedProjectId, selectedProjectId);
                }

                // update other rows
                for (let r of form.querySelectorAll("TR")) {
                    if (r === row) continue;
                    r.querySelector(`OPTION[value="${previouslySelectedProjectId}"]`)?.removeAttribute("disabled");
                    r.querySelector(`OPTION[value="${selectedProjectId}"]`)?.setAttribute("disabled", "");
                }
            }
            return {
                type: entrySlotsUpdated,
                data: harvestFormData(form)
            };

        }
    }
};

function harvestFormData(form) {
    const data = {};
    new FormData(form).forEach((value, key) => {
        if (!(key in data)) {
            data[key] = value;
        } else {
            const preValue = data[key];
            data[key] = Array.isArray(preValue) ? [...preValue, value] : [preValue, value];
        }
    });
    return data;
}
