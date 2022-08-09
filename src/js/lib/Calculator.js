export default function Calculator({ inputMessages, calculation }) {

    return async message => inputMessages.includes(message.type) && await calculation(message);

}
