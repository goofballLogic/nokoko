export default function Group({
    groupMessage, resultMessage,
    groupsSlot, aggregate, aggregateSlot, groupBy
}) {

    if (!groupBy) throw new Error("Missing groupBy function");
    if (!groupsSlot) throw new Error("Missing slot for grouping");
    if (aggregate && !aggregateSlot) throw new Error("Missing slot for aggregate result");
    return async message => {

        if (message.type === groupMessage) {

            const groups = {};
            const items = message.data;
            if (!items.length) {

                groups[null] = [items].filter(x => x);

            } else {

                items.forEach(item => {
                    const key = groupBy(item);
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(item);
                });

            }
            const entries = Object.entries(groups);
            if (aggregate) {

                entries.forEach(entry => {

                    const [key, items] = entry;
                    entry[aggregateSlot] = aggregate(items, key);

                });

            }
            message[groupsSlot] = entries;
            return {
                type: resultMessage,
                data: message.data,
                [groupsSlot]: entries
            };

        }

    }

}
