export default function MessageCache({ cacheMessage, extract, invalidateMessage, slot, inner }) {

    let cached = null;
    extract = extract || (x => x);
    return async message => {

        if (cacheMessage === message.type) {
            cached = extract(message);
        }

        if (invalidateMessage === message.type) {
            cached = null;
        }

        return await inner({ ...message, [slot]: cached });

    }

}
