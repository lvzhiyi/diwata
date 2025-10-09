(function () {
	// 获取URL参数
	const getUrlParameters = () => {
		const params = {};
		const queryString = window.location.search.substring(1);
		const pairs = queryString.split('&');

		for (const pair of pairs) {
			if (pair === '') continue;
			const [key, value] = pair.split('=');
			params[decodeURIComponent(key)] = decodeURIComponent(value || '');
		}

		return params;
	};


	// 使用构建时生成的hash值构建文件路径
	function buildFilePath(packageType, fileType) {
		if (!window.BUILD_HASHES || !window.BUILD_HASHES[packageType]) {
			console.error(`Build hashes not found for package ${packageType}`);
			return null;
		}

		const hashes = window.BUILD_HASHES[packageType];

		if (fileType === 'importMap') {
			return packageType === 'B'
				? `./src/import-map.${hashes.importMap}.json`
				: `./src/import-map.${hashes.importMap}.json`;
		} else if (fileType === 'index') {
			return packageType === 'B'
				? `./index.${hashes.index}.js`
				: `./index.${hashes.index}.js`;
		}

		return null;
	}

	const urlParams = getUrlParameters();
	const testParam = urlParams.ut;

	// 动态创建和加载相应的包
	async function loadPackage() {
		try {
			if (testParam === 'aff' || !testParam) {
				// 加载 B 包
				console.log('Loading package B aff...');

				const bImportMapPath = buildFilePath('B', 'importMap');
				const bIndexPath = buildFilePath('B', 'index');

				if (!bImportMapPath || !bIndexPath) {
					console.error('Failed to build file paths for package B');
					// 回退到A包
					await loadPackageA();
					return;
				}

				console.log(`B包文件路径: ${bImportMapPath}, ${bIndexPath}`);

				// 动态创建 import map 脚本
				const importMapScript = document.createElement('script');
				importMapScript.src = bImportMapPath;
				importMapScript.type = 'systemjs-importmap';
				importMapScript.charset = 'utf-8';

				// 添加到页面
				document.body.appendChild(importMapScript);

				// 等待 import map 加载完成后加载主文件
				importMapScript.onload = function () {};
				System.import(bIndexPath).catch(function (err) {
					console.error('Failed to load package B:', err);
					// 回退到A包
					loadPackageA();
				});

				importMapScript.onerror = function () {
					console.error('Failed to load import map for package B');
					// 回退到A包
					loadPackageA();
				};
			} else {
				// 加载 A 包（默认）
				await loadPackageA();
			}
		} catch (error) {
			console.error('Error in loadPackage:', error);
			// 回退到A包
			await loadPackageA();
		}
	}

	// 加载A包的函数
	async function loadPackageA() {
		console.log('Loading package A afe...');

		const aImportMapPath = buildFilePath('A', 'importMap');
		const aIndexPath = buildFilePath('A', 'index');

		if (!aImportMapPath || !aIndexPath) {
			console.error('Failed to build file paths for package A');
			return;
		}

		console.log(`A包文件路径: ${aImportMapPath}, ${aIndexPath}`);

		// 动态创建A包的 import map 脚本
		const importMapScript = document.createElement('script');
		importMapScript.src = aImportMapPath;
		importMapScript.type = 'systemjs-importmap';
		importMapScript.charset = 'utf-8';

		// 添加到页面
		document.body.appendChild(importMapScript);

		// 等待 import map 加载完成后加载主文件
		importMapScript.onload = function () {};

		System.import(aIndexPath).catch(function (err) {
			console.error('Failed to load package A:', err);
		});

		importMapScript.onerror = function () {
			console.error('Failed to load import map for package A');
		};
	}

	// 确保 SystemJS 已加载后再执行
	if (typeof System !== 'undefined') {
		loadPackage();
	} else {
		// 如果 SystemJS 还没加载完成，等待加载
		document.addEventListener('DOMContentLoaded', function () {
			// 再次检查 SystemJS 是否可用
			if (typeof System !== 'undefined') {
				loadPackage();
			} else {
				// 如果还是不可用，等待一段时间后重试
				setTimeout(loadPackage, 100);
			}
		});
	}
})();