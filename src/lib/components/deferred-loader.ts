export function createDeferredLoader<T>(load: () => Promise<T>) {
	let cachedPromise: Promise<T> | null = null;
	let resolvedValue: T | null = null;

	return {
		async load() {
			if (resolvedValue !== null) {
				return resolvedValue;
			}

			cachedPromise ??= load().then((value) => {
				resolvedValue = value;
				return value;
			});

			return cachedPromise;
		},
	};
}
