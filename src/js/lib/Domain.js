import Filter from "./Filter.js";
import Outbound from "./Outbound.js";
import Receiver from "./Receiver.js";

const asArray = x => Array.isArray(x) ? x : x ? [x] : [];

export default function Domain({
    name,
    objects,
    outboundMessages = []
}) {

    if (!objects) throw new Error("Objects (or objects factory) not specified");
    if (!name) throw new Error("Name not specified");

    function objectsForSend(send) {

        if (typeof objects === "function") {
            objects = objects(send);
        }
        return [...asArray(objects), Filter({
            messages: outboundMessages,
            outbound: send
        })];

    }

    return Outbound(send =>
        Receiver({ name, objects: objectsForSend(send) })
    );

}
