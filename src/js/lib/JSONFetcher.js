export default function JSONFetcher({
    url,
    method = "GET",
    activationMessage, successMessage, failureMessage,
    headersHandler, outputHandler
}) {

    headersHandler = headersHandler || (x => x);
    outputHandler = outputHandler || (x => x);
    method = method || "GET";

    return async message => {

        if (message.type === activationMessage) {

            const headers = headersHandler({}, message);
            const resolvedUrl = typeof url === "function" ? url(message) : url;
            const resp = await fetch(resolvedUrl, { method, headers });

            let caught;
            let result;
            try {
                if (resp.ok) {
                    const json = await resp.json();
                    result = ({ type: successMessage, data: json });
                }
            } catch (err) {
                caught = err;
                result = ({
                    type: failureMessage, data: {
                        status: resp.status,
                        err: err
                    }
                });
            } finally {
                result = outputHandler(result, message);
                return result;
            }
        }

    };

}
