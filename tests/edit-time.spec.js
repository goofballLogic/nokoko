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

            test("with a not-yet-populated row", async ({ page }) => await expect(page.locator(`form.time-entry tr.new`)).toBeVisible());

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

            test("with the null project should be selected in the drop down for the new row", async ({ page }) => {

                await expect(page.locator(`form.time-entry tr.new select`)).toHaveValue("");

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

            test("and projects selected for other rows should be disabled for selection", async ({ page }) => {

                await expect(page.locator(`form.time-entry tr[data-projectid="31234567"] select option[value="31234568"]`)).toBeDisabled();

            });

        });

        describe("And I change the project for one of the rows", () => {

            beforeEach(async ({ page }) => {

                await page.locator(`form.time-entry tr[data-projectid="31234567"] select`).selectOption("31234570");

            });

            test("Then the newly selected project is disabled for other rows", async ({ page }) => {

                await expect(page.locator(`form.time-entry tr[data-projectid="31234568"] select option[value="31234570"]`)).toBeDisabled();

            });

            test("Then the deselected project is now enabled for other rows", async ({ page }) => {

                await expect(page.locator(`form.time-entry tr[data-projectid="31234568"] select option[value="31234567"]`)).not.toBeDisabled();

            });

            test("Then the input names change to match the new proejct", async ({ page }) => {

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


    })

});
