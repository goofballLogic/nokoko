export default function Transform({ transformMessages, inner, after }) {

    return async message => {

        const result = await inner(message);
        return (transformMessages.includes(result?.type))
            ? (await after(result))
            : result;

    };

}
