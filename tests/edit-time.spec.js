const { test, test: { describe, beforeEach }, expect } = require('@playwright/test');
const { installFakeNoko, VALID_TOKEN } = require('./fake-noko.js');

describe("Background", () => {

    beforeEach(async ({ context, page }) => {

        await installFakeNoko(context);
        page.on("pageerror", console.error.bind(console));

    });

    describe("When entries have loaded", () => {

        beforeEach(async ({ page }) => {

            await page.goto("http://localhost:8080");
            await page.locator("aside.auth").locator("text=Access token").fill(VALID_TOKEN);

        });

        describe("Then an entry table for the latest unpopulated week loads", () => {

            test("identifying the week", async ({ page }) => await expect(page.locator("form.time-entry h2")).toContainText("July 31, 2022"));

            test("with a column heading for each day of the week", async ({ page }) => {

                const headings = await page.locator(`form.time-entry`).evaluate(h => Array.from(h.querySelectorAll("th")).map(d => d.textContent.trim()));
                expect(headings).toEqual(["", "Sun 31st", "Mon 1st", "Tue 2nd", "Wed 3rd", "Thu 4th", "Fri 5th", "Sat 6th"]);

            });

            test("with a row per recent project", async ({ page }) => {

                await expect(page.locator(`form.time-entry tr[data-projectid="31234567"]`)).toBeVisible();
                await expect(page.locator(`form.time-entry tr[data-projectid="31234568"]`)).toBeVisible();
                await expect(page.locator(`form.time-entry tr[data-projectid="31234569"]`)).toBeVisible();
                await expect(page.locator(`form.time-entry tr[data-projectid="31234570"]`)).not.toBeVisible();
                await expect(page.locator(`form.time-entry tr[data-projectid="31234571"]`)).not.toBeVisible();

            });

            test("with a not-yet-populated row", async ({ page }) => {

                await expect(page.locator(`form.time-entry tr[data-projectid="new"]`)).toBeVisible();

            });

            test("with each dropdown containing the available projects", async ({ page }) => {

                const options = await page
                    .locator(`form.time-entry tr[data-projectid="31234567"] select`)
                    .evaluate(select => Array.from(select.querySelectorAll("option")).map(o => [o.getAttribute("value") || "", o.textContent.trim()]));
                expect(options).toEqual([
                    ["", ""],
                    ["31234567", "Project A"],
                    ["31234568", "Project B"],
                    ["31234569", "Project C"],
                    ["31234570", "Project D"],
                    ["31234571", "Project E"],
                ]);

            });

            test("with the correct project selected in each project drop-down", async ({ page }) => {

                await expect(page.locator(`form.time-entry tr[data-projectid="31234567"] select`)).toHaveValue("31234567");

            });

            test("with the null project selected in the drop down for the new row", async ({ page }) => {

                await expect(page.locator(`form.time-entry tr[data-projectid="new"] select`)).toHaveValue("");

            });

            test("with empty input boxes", async ({ page }) => {

                const inputs = await page
                    .locator(`form.time-entry table`)
                    .evaluate(table => Array.from(table.querySelectorAll("input[type=text]")).map(input => [input.name, input.value]));

                expect(inputs).toEqual([

                    ["31234567_2022-07-31", ""], ["31234567_2022-08-01", ""], ["31234567_2022-08-02", ""], ["31234567_2022-08-03", ""], ["31234567_2022-08-04", ""], ["31234567_2022-08-05", ""], ["31234567_2022-08-06", ""],
                    ["31234568_2022-07-31", ""], ["31234568_2022-08-01", ""], ["31234568_2022-08-02", ""], ["31234568_2022-08-03", ""], ["31234568_2022-08-04", ""], ["31234568_2022-08-05", ""], ["31234568_2022-08-06", ""],
                    ["31234569_2022-07-31", ""], ["31234569_2022-08-01", ""], ["31234569_2022-08-02", ""], ["31234569_2022-08-03", ""], ["31234569_2022-08-04", ""], ["31234569_2022-08-05", ""], ["31234569_2022-08-06", ""],
                    ["new_2022-07-31", ""], ["new_2022-08-01", ""], ["new_2022-08-02", ""], ["new_2022-08-03", ""], ["new_2022-08-04", ""], ["new_2022-08-05", ""], ["new_2022-08-06", ""],

                ]);

            });

            test("projects selected for other rows should be disabled for selection", async ({ page }) => {

                await expect(page.locator(`form.time-entry tr[data-projectid="31234567"] select option[value="31234568"]`)).toBeDisabled();

            });

            test("focus should be on the top Monday input", async ({ page }) => {

                await expect(page.locator(`form.time-entry input[name="31234567_2022-08-01"]`)).toBeFocused();

            });

        });

        describe("and I change the project for one of the rows", () => {

            beforeEach(async ({ page }) => {

                await page.locator(`form.time-entry tr[data-projectid="31234567"] select`).selectOption("31234570");

            });

            test("Then the newly selected project is disabled for other rows", async ({ page }) => {

                await expect(page.locator(`form.time-entry tr[data-projectid="31234568"] select option[value="31234570"]`)).toBeDisabled();

            });

            test("Then the deselected project is now enabled for other rows", async ({ page }) => {

                await expect(page.locator(`form.time-entry tr[data-projectid="31234568"] select option[value="31234567"]`)).not.toBeDisabled();

            });

            test("Then the input names change to match the new project", async ({ page }) => {

                const inputs = await page
                    .locator(`form.time-entry table`)
                    .evaluate(table => Array.from(table.querySelectorAll("input[type=text]")).map(input => [input.name, input.value]));

                expect(inputs).toEqual([

                    ["31234570_2022-07-31", ""], ["31234570_2022-08-01", ""], ["31234570_2022-08-02", ""], ["31234570_2022-08-03", ""], ["31234570_2022-08-04", ""], ["31234570_2022-08-05", ""], ["31234570_2022-08-06", ""],
                    ["31234568_2022-07-31", ""], ["31234568_2022-08-01", ""], ["31234568_2022-08-02", ""], ["31234568_2022-08-03", ""], ["31234568_2022-08-04", ""], ["31234568_2022-08-05", ""], ["31234568_2022-08-06", ""],
                    ["31234569_2022-07-31", ""], ["31234569_2022-08-01", ""], ["31234569_2022-08-02", ""], ["31234569_2022-08-03", ""], ["31234569_2022-08-04", ""], ["31234569_2022-08-05", ""], ["31234569_2022-08-06", ""],
                    ["new_2022-07-31", ""], ["new_2022-08-01", ""], ["new_2022-08-02", ""], ["new_2022-08-03", ""], ["new_2022-08-04", ""], ["new_2022-08-05", ""], ["new_2022-08-06", ""],

                ]);

            });

        });

        describe("and focus is on the first visible input", () => {

            beforeEach(async ({ page }) => {

                await page.locator("form.time-entry input[type=text]:visible").first().focus();

            });

            describe("and I press the right arrow, and then the down arrow", () => {

                beforeEach(async ({ page }) => {

                    await page.keyboard.press("ArrowRight");
                    await page.keyboard.press("ArrowDown");

                });

                test("Then I should be focused on the next row, next day's entry slot", async ({ page }) => {

                    await expect(page.locator(`input[name="31234568_2022-08-02"]`)).toBeFocused();

                });

            });

            describe("and I press the up arrow, and then the left arrow", () => {

                beforeEach(async ({ page }) => {

                    await page.keyboard.press("ArrowUp");
                    await page.keyboard.press("ArrowLeft");

                });

                test("Then focus should have wrapped around to be focused on the bottom row, last column entry slot", async ({ page }) => {

                    await expect(page.locator(`input[name="new_2022-08-05"]`)).toBeFocused();

                });

            })

        });

        describe("and some values are entered", () => {

            beforeEach(async ({ page }) => {

                // column 1 - contains a 0 entry
                await page.locator("form.time-entry input[type=text]:visible").nth(0).type("3:30");
                await page.locator("form.time-entry input[type=text]:visible").nth(5).type("2:15");
                await page.locator("form.time-entry input[type=text]:visible").nth(10).type("0:00");
                // column 2 - contains invalid entry "hello"
                await page.locator("form.time-entry input[type=text]:visible").nth(1).type("7");
                await page.locator("form.time-entry input[type=text]:visible").nth(6).type("0:10");
                await page.locator("form.time-entry input[type=text]:visible").nth(11).type("hello");
                // column 3
                await page.locator("form.time-entry input[type=text]:visible").nth(2).type("6:45");
                await page.locator("form.time-entry input[type=text]:visible").nth(7).type("0:23");
                // column 4 - contains allowed hour value "25"
                await page.locator("form.time-entry input[type=text]:visible").nth(3).type("25");
                await page.locator("form.time-entry input[type=text]:visible").nth(8).type("0:45");
                // column 5 - contains invalid entry "0:99"
                await page.locator("form.time-entry input[type=text]:visible").nth(4).type("2:15");
                await page.locator("form.time-entry input[type=text]:visible").nth(9).type("0:99");

                await page.locator("form.time-entry input[type=text]:visible").first().focus(); // triggers input/change event

            });

            test("Then the total for each day should be shown", async ({ page }) => {

                await expect(page.locator("form.time-entry .total_2022-08-01")).toContainText("5:45");
                await expect(page.locator("form.time-entry .total_2022-08-02")).toContainText("");
                await expect(page.locator("form.time-entry .total_2022-08-03")).toContainText("7:08");
                await expect(page.locator("form.time-entry .total_2022-08-04")).toContainText("25:45");
                await expect(page.locator("form.time-entry .total_2022-08-05")).toContainText("");

            });

            describe("but the page is refreshed", () => {

                beforeEach(async ({ page }) => {

                    await page.reload();

                });

                test("Then the input values should have been preserved", async ({ page }) => {

                    await expect(page.locator(`form.time-entry input[name="31234567_2022-08-01"]`)).toHaveValue("3:30");

                });

            });

        });


    })

});
