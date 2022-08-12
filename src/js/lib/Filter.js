export default function Filter({ messages, object }) {

    return async message => {
        if (messages && messages.includes(message.type)) {
            return await object(message);
        }
    }

}
