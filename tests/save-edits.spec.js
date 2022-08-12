const { test, test: { describe, beforeEach }, expect } = require('@playwright/test');
const { installFakeNoko, VALID_TOKEN, POSTrequests } = require('./fake-noko.js');

describe("Background", () => {

    beforeEach(async ({ context, page }) => {

        await installFakeNoko(context);
        page.on("pageerror", console.error.bind(console));

    });

    describe("Given entries have loaded", () => {

        beforeEach(async ({ page }) => {

            await page.goto("http://localhost:8080");
            await page.locator("aside.auth").locator("text=Access token").fill(VALID_TOKEN);

        });

        describe("and times have been entered for each day", () => {

            const exampleData = [
                ["31234567_2022-07-31", "0"], ["31234567_2022-08-01", "1"], ["31234567_2022-08-02", "2"], ["31234567_2022-08-03", "3"], ["31234567_2022-08-04", "4"], ["31234567_2022-08-05", "5"], ["31234567_2022-08-06", "7"],
                ["31234568_2022-07-31", "4"], ["31234568_2022-08-01", "5"], ["31234568_2022-08-02", "6"], ["31234568_2022-08-03", "7"], ["31234568_2022-08-04", "8"], ["31234568_2022-08-05", "9"], ["31234568_2022-08-06", "0"],
                ["31234569_2022-07-31", "1:30"], ["31234569_2022-08-01", "1:05"]
            ];

            beforeEach(async ({ page }) => {

                await page.locator(`#weekends`).click();
                for (let [name, value] of exampleData) {
                    await page.locator(`input[name="${name}"]`).fill(value);
                }

            });

            describe("When I press the Save button", () => {

                beforeEach(async ({ page }) => {

                    await page.locator("form.time-entry button[type=submit]").click();
                    await page.screenshot({ path: "screenshot.png" });
                    await page.locator("dialog").waitFor("visible");

                });

                test("Then it should submit all the entries", async ({ page }) => {

                    const actualBodies = POSTrequests
                        .filter(r => r.url.toString() === "https://api.nokotime.com/v2/entries")
                        .map(r => r.body);

                    for (let [name, value] of exampleData) {

                        const expected = {
                            date: name.split("_")[1],
                            minutes: Number(value) * 60,
                            project_id: Number(name.split("_")[0])
                        };
                        if (expected.minutes) {
                            expect(actualBodies).toContainEqual(expected);
                        } else {
                            expect(actualBodies).not.toContainEqual(expected);
                        }

                    }

                });

            });

        });

    });

});
