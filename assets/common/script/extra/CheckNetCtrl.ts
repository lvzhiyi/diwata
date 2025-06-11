import { assetManager } from 'cc';
import { DEBUG } from 'cc/env';

class _CheckNetCtrl {
	/** 图片处理服务地址 */
	IMAGE_HANDLER_API_POINT_URL: string =
  'https://d26qtmqq28kv6s.cloudfront.net';

	private checkNetTime: number = 230;
  /** 忽略压缩图片的包的URL */
	private _ignoreUrl: string[] = ['backpack'];

	private gameIdMapPath: Record<string, string> = {
		'zhumeng001': 'wegame-cocos',
		'zhumeng002': 'malakas-cocos',
		'zhumeng003': 'ibong-cocos',
		'zhumeng004': 'lam-cocos',
		'zhumeng005': 'bakunawa-cocos',
	}

	private gameId = 'zhumeng001';

	downloadDelay = (url: string, disableCache: boolean = false): Promise<number | null> => {
		url = disableCache ? `${url}?t=${Date.now()}` : url;
		console.log('downloadDelay', url, 'disableCache', disableCache);

		return new Promise((resolve) => {
			const startTime = Date.now();
			fetch(url, {
				method: 'GET',
				mode: 'no-cors',
				headers: {
					'Cache-Control': 'no-cache',
				}
			}).then((response) => {
				if (response.ok) {
					const endTime = Date.now();
					resolve(endTime - startTime);
				} else {
					resolve(null);
				}
			});
		});
	};

	/**
	* 检查网络质量
	*
	* @param fileUrl 要检查网络质量的文件URL
	* @returns 返回网络质量：'slow'（慢）或'fast'（快）
	* @param disableCache 是否禁用缓存
	*/
	checkQuality = async (gameId: string, disableCache: boolean = false) => {
		this.gameId = gameId;
		const time = await this.downloadDelay(
			document.location.origin + '/images/logo.ico',
			disableCache
		);

		const netType = (time !== null && time > this.checkNetTime ? 'slow' : 'fast');
		// 非debug模式下，上报加载 图片的时间
		if (!DEBUG) {
			const armsRum = window.RumSDK.default;
			armsRum.sendCustom({
				type: 'loadTime',
				name: 'checkNetImgTime',
				value: time,
				properties: {
					netType,
				}
			});
		}

		console.log('checkNetworkQuality', time);
		return netType;
	};


	public registerDownloader() {
    const extensions = ['png', 'jpg', 'jpeg'];
    extensions.forEach((extension) => {
      assetManager.downloader.register(
        `.${extension}`,
        (url, options, onComplete) => {
          console.log('url:', url);
          this._fetchAssetFile(url, options, onComplete);
        }
      );
    });
  }
  /**
   * 是否忽略压缩图片的包的URL
   * @param url 需要检查的URL
   * @returns 是否忽略
   */
	private _isIgnoreUrl(url: string): boolean {
		if(localStorage.getItem('force_h')){
			return true;
		}
		if(url.startsWith('http')){
			return true;
		}
		return this._ignoreUrl.some((ignoreUrl) => url.includes(ignoreUrl));
	}

	private _fetchAssetFile(
    url: string,
    quality: any,
    onComplete: (err: any, asset: any) => void
  ) {
    // console.log("this.quality:", quality);
    const adjustedUrl =
      quality !== 'fast'
        ? this.adjustImageUrlFiltersParams(
            url,
            {
              quality: '30',
            },
          )
        : url;
        // 使用默认的 fetch 逻辑下载
    const fetchUrl = this._isIgnoreUrl(url) ? url : adjustedUrl;

    fetch(fetchUrl)
      .then((response) => {
        if (response.ok) {
          return response.blob();
        } else {
          throw new Error(`Download failed: ${response.statusText}`);
        }
      })
      .then((data) => {
        onComplete(null, data);
      })
      .catch((err) => {
        onComplete(err, null);
      });
		}
		/**
		* 调整图片URL的参数，添加图片处理服务的参数
		* @param url 需要调整的URL
		* @param params 需要调整的参数
		* @returns 调整后的URL
		*/
		adjustImageUrlFiltersParams(
			url: string,
			params: Record<string, any>,
		){
			const filterParams = Object.keys(params)
				.map((key) => {
					const value = params[key];
					return `${key}(${value})`;
				})
				.join(':');
			const suffixDomain = `${this.IMAGE_HANDLER_API_POINT_URL}/filters:${filterParams}/${this.gameIdMapPath[this.gameId]}`;
			const replacedUrl = this.replaceImageUrlDomain(url, suffixDomain);
			return replacedUrl;
		}

	/**
	* 将URL的domain部分替换成指定的domain URL
	* @param url 需要替换的URL
	* @param domain 指定的domain URL
	* @returns 替换后的URL
	*/
	replaceImageUrlDomain(url: string, domain: string){
		const domainRegexp = url.match(/assets/);
		if (domainRegexp) {
			return url.replace(domainRegexp[0], domain);
		}

		return `${domain}/${url}`;
	}
}

export default new _CheckNetCtrl();
