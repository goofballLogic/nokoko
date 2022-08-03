exports.installFakeNoko = async (context) => {

    await context.route("https://api.nokotime.com/**/*", (route, request) => {

        fakeNoko(request, route);

    });

}

exports.VALID_TOKEN = "d87234kjhsdkfg62374537263t4hdgjgshdgfsdf";

function fakeNoko(request, route) {

    const url = new URL(request.url());
    const headers = request.headers();
    const token = headers["x-nokotoken"];

    if (token !== exports.VALID_TOKEN) {

        route.fulfill({
            body: "Nope",
            status: 403
        });

    } else {

        switch (url.pathname) {
            case "/v2/current_user/":
                route.fulfill({
                    body: JSON.stringify({ email: "some.person@armakuni.com" }),
                    status: 200
                });
                break;
            default:
                route.fulfill({
                    body: "Not found",
                    status: 404
                });
        }

    }

}
