export default function Gather({

    messagesToGather,
    gatherMessage

}) {

    if (!Array.isArray(messagesToGather)) throw new Error("messageToGather is not an array");
    if (!gatherMessage) throw new Error("Missing gatherMessage");

    const gathered = {};
    let sent = false;
    return async message => {

        if (messagesToGather.includes(message.type)) {
            gathered[message.type] = message;
            sent = false;
        }
        if (!sent && messagesToGather.every(m => gathered[m])) {
            sent = true;
            return {
                type: gatherMessage,
                data: gathered
            };
        }

    };

}
