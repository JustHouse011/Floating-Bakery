export async function designAction(page, name) {
  await page.locator('.studio-action-bar').waitFor();
  const button = page.getByRole("button", { name, exact: true });
  if ((await page.evaluate(()=>matchMedia('(max-width: 760px)').matches)) && !(await button.isVisible()))
    await page.getByText("More design actions", { exact: true }).click();
  await button.click();
}
