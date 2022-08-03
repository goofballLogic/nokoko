const { test, test: { describe, beforeEach }, expect } = require('@playwright/test');

describe("When I open the app", () => {

  beforeEach(async ({ page }) => {

    await page.goto("http://localhost:8080");

  });

  test("Then it shows that I am not authenticated", async ({ page }) => {

    await expect(page.locator("aside.auth")).toHaveText("Not authenticated");

  });

});

//test.describe('homepage has Playwright in title and get started link linking to the intro page', async ({ page }) => {
  // await page.goto('https://playwright.dev/');

  //   // Expect a title "to contain" a substring.
  //   await expect(page).toHaveTitle(/Playwright/);

  //   // create a locator
  //   const getStarted = page.locator('text=Get Started');

  //   // Expect an attribute "to be strictly equal" to the value.
  //   await expect(getStarted).toHaveAttribute('href', '/docs/intro');

  //   // Click the get started link.
  //   await getStarted.click();

  //   // Expects the URL to contain intro.
  //   await expect(page).toHaveURL(/.*intro/);
//});
