export default function JSONFetcher({
    url,
    method = "GET",
    activationMessage, successMessage, failureMessage,
    bodyExtractor, bodiesExtractor, headersHandler, outputHandler
}) {

    headersHandler = headersHandler || (x => x);
    outputHandler = outputHandler || (x => x);
    method = method || "GET";

    return async message => {

        if (message.type === activationMessage) {

            const headers = headersHandler({}, message);
            let resolvedUrl = typeof url === "function" ? url(message) : url;
            if (document.location.search.includes("data=example"))
                resolvedUrl = resolvedUrl.includes("entries")
                    ? "/example_data/entries.json"
                    : resolvedUrl.includes("projects")
                        ? "/example_data/projects.json"
                        : resolvedUrl.includes("/current_user")
                            ? "/example_data/current_user.json"
                            : resolvedUrl;

            let resp;
            let result;
            try {

                if (bodiesExtractor) {

                    console.log(1);

                    // multi request with body
                    const bodies = await bodiesExtractor(message);
                    resp = await Promise.all(bodies.map(body => fetch(resolvedUrl, { method, headers, body })));
                    resp.ok = resp.every(r => r.ok);
                    if (!resp.ok) resp.status = Math.min(...resp.map(r => r.status).filter(s => s >= 400)); // the lowest error code
                    if (resp.ok) {

                        console.log(12);

                        const jsons = await Promise.all(resp.map(r => r.json()));
                        result = { type: successMessage, data: jsons };

                    } else {

                        result = {
                            type: failureMessage,
                            data: resp.map(r => ({ status: r.status, message: r.statusText }))
                        };

                    }

                } else {

                    console.log(2);

                    // single request
                    const options = { method, headers };
                    if (bodyExtractor) options.body = await bodyExtractor(message); // with body?
                    resp = await fetch(resolvedUrl, options);
                    if (resp.ok) {

                        console.log(22);

                        const json = await resp.json();
                        result = { type: successMessage, data: json };

                    } else {

                        result = {
                            type: failureMessage,
                            data: {
                                status: resp.status,
                                message: resp.statusText
                            }
                        }
                    }

                }

            } catch (err) {

                console.log(3);

                result = {
                    type: failureMessage,
                    data: {
                        status: resp.status,
                        err: err
                    }
                };

            } finally {

                console.log(4);

                return outputHandler(result, message);

            }

        }

    };

}
