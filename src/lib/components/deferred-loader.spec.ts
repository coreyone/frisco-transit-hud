import { describe, expect, it, vi } from 'vitest';
import { createDeferredLoader } from './deferred-loader';

describe('createDeferredLoader', () => {
	it('defers work until load is requested', async () => {
		expect.assertions(2);

		const load = vi.fn(async () => 'map');
		const loader = createDeferredLoader(load);

		expect(load).not.toHaveBeenCalled();
		await loader.load();
		expect(load).toHaveBeenCalledTimes(1);
	});

	it('dedupes concurrent load calls and caches the result', async () => {
		expect.assertions(4);

		const load = vi.fn(
			() =>
				new Promise<string>((resolve) => {
					setTimeout(() => resolve('map'), 0);
				}),
		);
		const loader = createDeferredLoader(load);

		const [first, second] = await Promise.all([loader.load(), loader.load()]);
		const third = await loader.load();

		expect(first).toBe('map');
		expect(second).toBe('map');
		expect(third).toBe('map');
		expect(load).toHaveBeenCalledTimes(1);
	});
});
