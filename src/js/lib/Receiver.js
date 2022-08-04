export default function Receiver({ name, objects }) {

    const stack = [];
    name = name || `Receiver ${Date.now()}`;

    const receiver = async message => {

        stack.push(message);
        while (stack.length) {

            const next = stack.shift();
            if (!next) continue;
            console.log(name, next.type);
            const results = await Promise.all(objects.map(o => o(next)));
            stack.push(...results.filter(x => x));
            if (stack.lenth > 100) {

                console.error(stack);
                throw new Error("Stack overflow");

            }

        }

    };
    objects.forEach(o => o(receiver));
    return receiver;
}
