export function calculateDownloadTime(downloadSpeed: number, totalSize: number, downloaded: number): number {
    let downloadTime: number;
    if (totalSize != downloaded && downloadSpeed != 0) {
        let remainingSize = totalSize - downloaded;
        downloadTime = remainingSize / downloadSpeed;
    } else {
        downloadTime = 0;
    }
    
    return downloadTime;
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
