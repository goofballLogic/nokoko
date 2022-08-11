exports.installFakeNoko = async (context) => {

    await context.route("https://api.nokotime.com/**/*", (route, request) => {

        fakeNoko(request, route);

    });

}

exports.VALID_TOKEN = "d87234kjhsdkfg62374537263t4hdgjgshdgfsdf";

const data = {
    SOME_PERSON: {
        id: 123456,
        email: "some.person@armakuni.com"
    },
    PROJECTS: {
        A: {
            id: 31234567,
            name: "Project A"
        },
        B: {
            id: 31234568,
            name: "Project B"
        },
        C: {
            id: 31234569,
            name: "Project C"
        },
        D: {
            id: 31234570,
            name: "Project D"
        },
        E: {
            id: 31234571,
            name: "Project E"
        }
    }
};

let entryId = Number(Math.random().toString().substring(2));
const fakeEntry = (date, hours, project) => ({ id: entryId++, date, minutes: hours * 60, project });
data.SOME_ENTRIES = [

    /* July 24th 2022 */
    fakeEntry("2022-07-29", 4, data.PROJECTS.A),
    fakeEntry("2022-07-29", 6, data.PROJECTS.B),
    fakeEntry("2022-07-28", 5, data.PROJECTS.A),
    fakeEntry("2022-07-28", 4, data.PROJECTS.B),
    fakeEntry("2022-07-27", 7, data.PROJECTS.A),
    fakeEntry("2022-07-27", 8, data.PROJECTS.C),
    fakeEntry("2022-07-26", 4, data.PROJECTS.A),

    /* June 19th 2022 */
    fakeEntry("2022-06-25", 5, data.PROJECTS.B),
    fakeEntry("2022-06-25", 3, data.PROJECTS.A),
    fakeEntry("2022-06-24", 2, data.PROJECTS.B),
    fakeEntry("2022-06-23", 4, data.PROJECTS.A),

    /* May 22nd 2022 */
    fakeEntry("2022-05-23", 6, data.PROJECTS.B),
    fakeEntry("2022-05-22", 4, data.PROJECTS.C),

    /* May 15th 2022 */
    fakeEntry("2022-05-21", 5, data.PROJECTS.B),
    fakeEntry("2022-05-21", 4, data.PROJECTS.A),
    fakeEntry("2022-05-20", 3, data.PROJECTS.B),
    fakeEntry("2022-05-20", 4, data.PROJECTS.A),
    fakeEntry("2022-05-19", 7, data.PROJECTS.B),
    fakeEntry("2022-05-18", 3, data.PROJECTS.A),
    fakeEntry("2022-05-18", 1, data.PROJECTS.B),
    fakeEntry("2022-05-17", 5, data.PROJECTS.A),

];

function tryParse(maybeJSON) {
    if (maybeJSON) {
        try {
            return JSON.parse(maybeJSON);
        } catch (_) {

        }
    }
    return maybeJSON;
}
function fakeNoko(request, route) {

    const url = new URL(request.url());
    const body = tryParse(request.postData());
    const headers = request.headers();
    const token = headers["x-nokotoken"];
    if (token !== exports.VALID_TOKEN) {

        route.fulfill({
            body: "Nope",
            status: 403
        });

    } else {

        switch (request.method()) {
            case "GET":
                handleGET(url, route);
                break;
            case "POST":
                handlePOST(url, body, route);
                break;
            default:
                route.fulfill({
                    body: "Method not allowed",
                    status: 405
                });
        }

    }

}

exports.POSTrequests = [];

function handlePOST(url, body, route) {

    switch (url.pathname) {
        case "/v2/entries":
            exports.POSTrequests.push({ url, body });
            route.fulfill({
                body: "Ok",
                status: 201
            });
            break;
        default:
            console.warn("Not found POST", url);
            route.fulfill({
                body: "Not found",
                status: 404
            });

    }

}

function handleGET(url, route) {
    switch (url.pathname) {
        case "/v2/current_user/":
            route.fulfill({
                body: JSON.stringify(data.SOME_PERSON),
                status: 200
            });
            break;

        case "/v2/entries":

            route.fulfill({
                body: JSON.stringify(data.SOME_ENTRIES),
                status: 200
            });
            break;

        case "/v2/projects":
            route.fulfill({
                body: JSON.stringify(Object.values(data.PROJECTS)),
                status: 200
            });
            break;

        default:
            console.warn("Not found GET", url);
            route.fulfill({
                body: "Not found",
                status: 404
            });

    }
}
