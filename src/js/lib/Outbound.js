export default function Outbound(innerFactory) {

    let outside = async () => { };
    const taint = Symbol(`taint-${Math.random().toString().substring(2)}`);

    // create the inner world with a way to call the outer world (if known)
    const inner = innerFactory(async message => {

        message[taint] = true;
        return await outside(message);

    });

    return async message => {

        if (typeof message === "function") {
            // we have made contact with the outside world. Store this for later
            outside = message;
        } else {

            if (message[taint]) {
                // we passed this out - don't let it back in
                return;
            } else {
                // we are passing things on to the inner world
                inner(message);
            }

        }

    }

}
