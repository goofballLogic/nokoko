export default function JSONFetcher({ url, method = "GET", activationMessage, headersHandler, successMessage, failureMessage }) {

    headersHandler = headersHandler || (x => x);
    method = method || "GET";

    return async ({ type, data }) => {

        if (type === activationMessage) {

            const headers = headersHandler({}, { type, data });
            const resp = await fetch(url, { method, headers });

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
                return result;
            }
        }

    };

}
