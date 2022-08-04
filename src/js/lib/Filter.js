export default function Filter({ messages, outbound }) {

    return async message => {
        if (messages && messages.includes(message.type)) {
            await outbound(message);
        }
    }

}
