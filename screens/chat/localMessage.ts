import { useEffect, useRef, useState } from "react";
import { IMessage } from "react-native-gifted-chat";
import * as SQLite from 'expo-sqlite'

export interface ILocalMessage extends IMessage {
    txnId: string
}

let sqlQueue = []
let sqlRunning = false

export const useSqliteStore = (roomId: string) => {

    const [db] = useState(SQLite.openDatabase("localMessage"))
    const tableName = roomId.slice(1, 19)
    const readUpTo = useRef(0)
    const [messages, setMessages] = useState<ILocalMessage[]>([])
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        (async () => {
            console.log('init database')
            const res = await db.execAsync([{
                sql: "SELECT count(*) total FROM sqlite_master WHERE type='table' and name=?",
                args: [tableName]
            }], true)

            if (res[0]['rows'][0]["total"] === 0) {
                const res = await createStore()
                console.log(`room: ${tableName} created:`, res)
            } else {
                console.log(`room: ${tableName} opened`,)
            }
            setIsReady(true)
        })()
        return () => {
            console.log('stop database')
            db.closeAsync()
        }
    }, [roomId])

    const createStore = async () => {
        return await db.execAsync([{
            sql: `CREATE TABLE "${tableName}" (
                        "txnId" text(255) NOT NULL PRIMARY KEY,
                        "_id" text(255),
                        "text" text(255),
                        "createdAt" integer,
                        "user" TEXT(255),
                        "image" text(255),
                        "video" text(255),
                        "audio" TEXT(255),
                        "system" integer,
                        "sent" integer,
                        "received" integer,
                        "pending" integer,
                        "quickReplies" text(1000)
                      )`, args: []
        }], false);
    }

    const loadMoreMessages = async (limit: number = 30) => {
        const page: ILocalMessage[] = []
        const res = await db.execAsync([{ sql: `select * from ${tableName} order by txnId desc limit ${readUpTo.current}, ${limit}`, args: [] }], true)
        if (res[0]['rows']) {
            res[0]['rows'].forEach(r => {
                const msg: ILocalMessage = {
                    txnId: null,
                    _id: null,
                    text: null,
                    createdAt: 0,
                    user: null
                }
                Object.keys(r).forEach(k => {
                    if (r[k] !== null) {
                        if (k === 'user' || k === 'quickReplies') {
                            msg[k] = JSON.parse(r[k])
                        } else {
                            msg[k] = r[k]
                        }
                    }
                })
                page.push(msg)
            })
            readUpTo.current = readUpTo.current + limit
        }
        console.log('loadmsg', page)
        setMessages((prev) => page.concat(prev))
    }

    const clearMessages = async () => {
        await db.execAsync([{ sql: `drop table ${tableName}`, args: [] }], false)
        createStore()
        setMessages(() => [])
    }

    const appendMessage = async (msg: ILocalMessage) => {
        return appendMessages([msg])
    }

    const appendMessages = async (msgs: ILocalMessage[]) => {
        msgs.forEach(async msg => {
            const args = [msg.txnId, msg._id, msg.text, msg.createdAt, JSON.stringify(msg.user) || null, msg.image || null, msg.video || null, msg.audio || null, msg.system ? 1 : 0, msg.sent ? 1 : 0, msg.received ? 1 : 0, msg.pending ? 1 : 0, JSON.stringify(msg.quickReplies) || null]
            const res = await db.execAsync([{
                sql: `INSERT INTO "${tableName}" 
                ("txnId", "_id", "text", "createdAt", "user", "image", "video", "audio", "system", "sent", "received", "pending", "quickReplies") 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                args
            }], false)
            console.log('append', res)
        })
        setMessages((prev) => msgs.concat(prev))
    }

    const setMessageCompeted = async (txnId: string) => {
        const sql = `update ${tableName} set pending = 0, sent = 1 where txnId = ?`
        const args = [txnId]
        const res = await db.execAsync([{ sql, args }], false)
        setMessages((prev) => {
            const updating = prev.find(m => m.txnId === txnId)
            if (updating) {
                updating.pending = false
                updating.sent = true
            }
            return [...prev]
        })
    }

    return {
        appendMessage,
        appendMessages,
        loadMoreMessages,
        clearMessages,
        setMessageCompeted,
        messages,
        isReady
    }
}

