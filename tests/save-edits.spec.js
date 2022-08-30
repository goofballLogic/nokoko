const { test, test: { describe, beforeEach, afterEach }, expect } = require('@playwright/test');
const { installFakeNoko, VALID_TOKEN, POSTrequests, decorateAPIRequests } = require('./fake-noko.js');

const exampleData = [
    ["31234567_2022-07-31", "0"], ["31234567_2022-08-01", "1"], ["31234567_2022-08-02", "2"], ["31234567_2022-08-03", "3"], ["31234567_2022-08-04", "4"], ["31234567_2022-08-05", "5"], ["31234567_2022-08-06", "7"],
    ["31234568_2022-07-31", "4"], ["31234568_2022-08-01", "5"], ["31234568_2022-08-02", "6"], ["31234568_2022-08-03", "7"], ["31234568_2022-08-04", "8"], ["31234568_2022-08-05", "9"], ["31234568_2022-08-06", "0"],
    ["31234569_2022-07-31", "1:30"], ["31234569_2022-08-01", "1:05"]
];

function parseDuration(timey) {
    const [hours, minutes] = timey.split(":");
    return (Number(hours) || 0) * 60 + (Number(minutes) || 0);
}

const exampleDataPOSTBodies = exampleData.map(([name, value]) => ({
    date: name.split("_")[1],
    minutes: parseDuration(value),
    project_id: Number(name.split("_")[0])
}));

async function waitForNewPOSTRequests(countBeforeAction = 0, pollTime = 100) {
    while (POSTrequests.length === countBeforeAction) {
        await new Promise(resolve => setTimeout(resolve, pollTime));
    }
}

async function waitForNewPOSTRequestsToSettle(pollTime = 100) {
    let runningCount = -1;
    while (POSTrequests.length > runningCount) {
        runningCount = POSTrequests.length;
        await new Promise(resolve => setTimeout(resolve, pollTime));
    }
}

describe("Background", () => {

    beforeEach(async ({ context, page }) => {

        await installFakeNoko(context);
        page.on("pageerror", console.error.bind(console));

    });

    describe("Given entries have loaded", () => {

        beforeEach(async ({ page }) => {

            await page.goto("http://localhost:8080?exposeFetchCounter=true");
            await page.locator("aside.auth").locator("text=Access token").fill(VALID_TOKEN);

        });

        describe("and times have been entered for each day", () => {

            beforeEach(async ({ page }) => {

                await page.locator(`#weekends`).click();
                for (let [name, value] of exampleData) {
                    await page.locator(`input[name="${name}"]`).fill(value);
                }

            });

            describe("When I try to submit the form twice", () => {

                beforeEach(async ({ page }) => {

                    const beforeCount = POSTrequests.length;
                    await page.locator("form.time-entry").evaluate(f => {

                        const forceSubmitButton = document.createElement("INPUT");
                        forceSubmitButton.setAttribute("type", "submit");
                        f.appendChild(forceSubmitButton);
                        forceSubmitButton.click();
                        forceSubmitButton.click(); // and again

                    });
                    // wait for network to settle
                    await waitForNewPOSTRequests(beforeCount);
                    await waitForNewPOSTRequestsToSettle();

                });

                test("Then the second saving of entries is blocked", async ({ page }) => {

                    const received = POSTrequests.filter(r => r.url.toString() === "https://api.nokotime.com/v2/entries").map(x => x.body);
                    const expected = exampleDataPOSTBodies.filter(x => x.minutes > 0);
                    expect(received).toEqual(expected);

                });

            });

            describe("When I press the Save button", () => {

                beforeEach(async ({ page }) => {

                    await page.locator("form.time-entry button[type=submit]").click();
                    await page.locator("dialog.save-complete").waitFor();

                });

                test("Then it should submit all the entries", async ({ page }) => {

                    const actualBodies = POSTrequests
                        .filter(r => r.url.toString() === "https://api.nokotime.com/v2/entries")
                        .map(r => r.body);

                    exampleDataPOSTBodies.forEach(expected => {

                        if (expected.minutes) {
                            expect(actualBodies).toContainEqual(expected);
                        } else {
                            expect(actualBodies).not.toContainEqual(expected);
                        }

                    });

                });

            });

            describe("but the server is slow receiving requests", () => {

                let requestBarrierLatch; // call this to unblock server requests
                let requestBarrier = new Promise((resolve) => { requestBarrierLatch = resolve; });
                let dispose;

                beforeEach(({ context }) => {

                    dispose = decorateAPIRequests(context, async () => {

                        await requestBarrier;
                        return false;

                    });

                });

                afterEach(() => {

                    requestBarrierLatch();
                    dispose()

                });

                describe("When I press the Save button", () => {

                    beforeEach(async ({ page }) => {

                        await page.locator("form.time-entry button[type=submit]").click();

                    });

                    test("Then the status of the operation is shown", async ({ page }) => {

                        await expect(page.locator("dialog")).toContainText("Saving data. Please wait...");
                        await expect(page.locator(`dialog:has-text("Saving data")`)).toBeVisible();

                    });

                    describe("and the server finally responds", () => {

                        beforeEach(() => requestBarrierLatch());

                        test("Then the status of the operation is no longer shown", async ({ page }) => {

                            await expect(page.locator(`dialog:has-text("Saving data")`)).not.toBeVisible();

                        });

                    });

                });

            });

            describe("but the server is throttling nine out of ten requests (thanks Noko....)", () => {

                let counter = 0;
                let dispose;

                beforeEach(({ context }) => {

                    dispose = decorateAPIRequests(context, (_req, route) => {

                        const shouldThrottle = !!(counter++ % 10);
                        if (shouldThrottle) {

                            route.fulfill({ body: "You are throttled", status: 409 });
                            return true;

                        }

                    });

                });

                afterEach(() => dispose());

                describe("When I press the Save button", () => {

                    beforeEach(async ({ page }) => {

                        await page.locator("form.time-entry button[type=submit]").click();
                        await page.locator("dialog.save-complete").waitFor();

                    });

                    test("Then it should eventually submit all the entries", async ({ page }) => {

                        const actualBodies = POSTrequests
                            .filter(r => r.url.toString() === "https://api.nokotime.com/v2/entries")
                            .map(r => r.body);

                        exampleDataPOSTBodies.forEach(expected => {

                            if (expected.minutes) {
                                expect(actualBodies).toContainEqual(expected);
                            } else {
                                expect(actualBodies).not.toContainEqual(expected);
                            }

                        });

                    });

                    test("Then it should eventually display a Save Succeeded dialog", async ({ page }) => {

                        await expect(page.locator("dialog")).toContainText("Save succeeded");

                    });

                });

            });

            describe("but the server is responding with 500 server errors", () => {

                let dispose;

                beforeEach(async ({ context }) => {

                    dispose = decorateAPIRequests(context, (request, route) => {

                        if (request.method() === "POST" && request.url().endsWith("/v2/entries")) {

                            route.fulfill({ body: "Error", status: 500 });
                            return true;

                        }

                    });

                });

                afterEach(async () => dispose());

                describe("When I press the Save button", () => {

                    beforeEach(async ({ page }) => {

                        await page.locator("form.time-entry button[type=submit]").click();
                        await page.locator("dialog.save-complete").waitFor();

                    });

                    test("Then it should not have saved all the entries", async () => {

                        const actualBodies = POSTrequests
                            .filter(r => r.url.toString() === "https://api.nokotime.com/v2/entries")
                            .map(r => r.body);
                        expect(actualBodies).toHaveLength(0);

                    });

                    test("Then it should display a Save Failed dialog", async ({ page }) => {

                        await expect(page.locator("dialog")).toContainText("Save failed");

                    });

                });

            });

        });

    });

});
