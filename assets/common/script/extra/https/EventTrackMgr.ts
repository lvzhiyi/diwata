import pako from 'pako';

export class EventTrackMgr {
    private static _inst: EventTrackMgr;
    public static get instance(): EventTrackMgr {
        if (this._inst == null) {
            this._inst = new EventTrackMgr();
        }
        return this._inst;
    }

    /**
     * 发送埋点事件
     * @param params 参数
     */
    public async sendTrack(params, reportUrl: string): Promise<void> {
        const headers = {
            'Content-Type': 'text/plain',
        };

        const compressedData = await this.compressString(JSON.stringify(params));

        const blobData = new Blob([compressedData], { type: 'text/plain' });

        return new Promise((resolve, reject) => {
            fetch(reportUrl, {
                method: 'POST',
                headers: headers,
                body: blobData,
              })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 1) {
                        resolve();
                    } else {
                        reject();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    reject();
                });
        });
        
    }

    public async compressString(inputString) {
        try {
            const compressedBuffer = await pako.gzip(inputString);
            return compressedBuffer;
        } catch (err) {
            console.error('Compression failed:', err);
            throw err;
        }
    }
   
}