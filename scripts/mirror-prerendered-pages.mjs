import { cp, mkdir, readdir } from 'node:fs/promises';
import { join, parse } from 'node:path';

const buildDir = new URL('../build/', import.meta.url);

async function mirrorHtmlPages(dir) {
	const entries = await readdir(dir, { withFileTypes: true });

	await Promise.all(
		entries.map(async (entry) => {
			const absolutePath = join(dir.pathname, entry.name);

			if (entry.isDirectory()) {
				await mirrorHtmlPages(new URL(`${entry.name}/`, dir));
				return;
			}

			if (!entry.isFile() || !entry.name.endsWith('.html')) {
				return;
			}

			const { name, dir: relativeDir } = parse(absolutePath);

			if (name === 'index' || name === '200' || name === '404') {
				return;
			}

			const targetDir = join(relativeDir, name);
			const targetFile = join(targetDir, 'index.html');

			await mkdir(targetDir, { recursive: true });
			await cp(absolutePath, targetFile);
		}),
	);
}

await mirrorHtmlPages(buildDir);
