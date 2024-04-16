export function normalizeSize(fileSize) {
    let temp
    if (fileSize < 1024) {
        return fileSize + 'B';
    } else if (fileSize < (1024 * 1024)) {
        temp = fileSize / 1024;
        temp = temp.toFixed(2);
        return temp + 'KB';
    } else if (fileSize < (1024 * 1024 * 1024)) {
        temp = fileSize / (1024 * 1024);
        temp = temp.toFixed(2);
        return temp + 'MB';
    } else {
        temp = fileSize / (1024 * 1024 * 1024);
        temp = temp.toFixed(2);
        return temp + 'GB';
    }
}

export function normalizeUserId(userId: string) {
    if (userId.startsWith('@') && userId.includes(':chat.b-pay.life')) {
        return userId.slice(0).replace(':chat.b-pay.life', '')
    }
    return userId
}