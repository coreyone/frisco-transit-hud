import { expect, test } from '@playwright/test';

test('renders the nearby departures shell', async ({ page }) => {
	await page.goto('/');

	await expect(
		page.getByRole('heading', { name: 'Nearby', level: 1 }),
	).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Right now' })).toBeVisible();
	await expect(page.getByText('Nearby lines at a glance')).toBeVisible();
});

test('renders the route detail without crashing on map fallback', async ({
	page,
}) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Open line detail' }).click();
	await page.waitForURL(/\/route\/.+/);

	await expect(page.getByText('Line map and vehicles')).toBeVisible();
	await expect(page).toHaveURL(/\/route\/.+/);
});
