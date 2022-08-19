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
            let resolvedUrl = overrideExampleData(typeof url === "function" ? url(message) : url);

            let resp;
            let result;
            try {

                if (bodiesExtractor) {

                    ({ resp, result } = (await multiBodiedRequest(message, resolvedUrl, headers)));

                } else {

                    ({ resp, result } = (await singleRequest(message, resolvedUrl, headers)));

                }

            } catch (err) {

                result = {
                    type: failureMessage,
                    data: {
                        status: resp?.status,
                        message: err?.message,
                        err: err
                    }
                };

            } finally {

                return outputHandler(result, message);

            }

        }

    };

    async function singleRequest(message, url, headers) {

        const options = { method, headers };
        if (bodyExtractor)
            options.body = await bodyExtractor(message); // with body?
        const resp = await fetchWithRetry({ url, ...options });
        let result;
        if (resp.ok) {

            const json = await resp.json();
            result = { type: successMessage, data: json };

        } else {

            result = {
                type: failureMessage,
                data: {
                    status: resp.status,
                    message: resp.statusText
                }
            };

        }
        return { resp, result };

    }

    async function multiBodiedRequest(message, url, headers) {

        const bodies = await bodiesExtractor(message);
        const resp = await Promise.all(bodies.map(body => fetchWithRetry({ url, method, headers, body })));
        resp.ok = resp.every(r => r.ok);
        let result;
        if (!resp.ok)
            resp.status = Math.min(...resp.map(r => r.status).filter(s => s >= 400)); // the lowest error code
        if (resp.ok) {

            const jsons = await Promise.all(resp.map(r => r.json()));
            result = { type: successMessage, data: jsons };

        } else {

            result = {
                type: failureMessage,
                data: resp.map(r => ({ status: r.status, message: r.statusText }))
            };

        }
        return { resp, result };

    }

}

const retryLimit = 5;
const backoff = 250;

function overrideExampleData(resolvedUrl) {
    if (!document.location.search.includes("data=example"))
        return resolvedUrl;
    return resolvedUrl.includes("entries")
        ? "/example_data/entries.json"
        : resolvedUrl.includes("projects")
            ? "/example_data/projects.json"
            : resolvedUrl.includes("/current_user")
                ? "/example_data/current_user.json"
                : resolvedUrl;

}

let liveFetchRequests = 0;

if (new URL(window?.location).searchParams.get("exposeFetchCounter") === "true") {
    window.nokoko = { ...window.nokoko, fetchRequests: () => liveFetchRequests };
}

async function fetchWithRetry({ url, method, headers, body }) {

    let statusFloor = 0;
    let retries = 0;
    let resp;
    const isResolved = () => (statusFloor !== 200) && (statusFloor !== 500);
    const shouldRetry = () => isResolved() && (retries < retryLimit);
    while (shouldRetry()) {

        try {

            liveFetchRequests++;
            resp = await fetch(url, { method, headers, body });
            statusFloor = Math.floor(resp.status / 100) * 100;

        } catch (err) {

            statusFloor = -1;

        } finally {

            liveFetchRequests--;

        }
        if (shouldRetry()) {

            retries++;
            await new Promise(resolve => setTimeout(resolve, backoff));

        }

    }
    return resp;

}

