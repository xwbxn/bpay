import moment from "moment";

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
    if (userId && userId.startsWith('@') && userId.includes(':chat.b-pay.life')) {
        return userId.slice(1).replace(':chat.b-pay.life', '')
    }
    return userId
}

export function normalizeTime(time: number) {
    const t = moment(time)
    const now = moment()
    if (t.date() === now.date()) {
        return t.format('a HH:mm')
    }
    if(now.date() - t.date() === 1) {
        return '昨天'
    }
    if(t.week() === now.week()) {
        return t.format('ddd')
    }
    return moment(time).format('MMM Do')
}