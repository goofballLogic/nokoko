exports.installFakeNoko = async (context) => {

    await context.route("https://api.nokotime.com/**/*", (route, request) => {

        fakeNoko(request, route);

    });

}

function fakeNoko(request, route) {

    const url = new URL(request.url());

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
