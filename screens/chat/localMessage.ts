import * as SQLite from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { IMessage } from 'react-native-gifted-chat';
import { create } from 'zustand';

const useDatabase = create<{ db: SQLite.SQLiteDatabase }>(set => ({
    db: SQLite.openDatabase("localMessage")
}))

export const useSqliteStore = (roomId: string) => {

    const db = useDatabase(state => state.db)

    // const [db] = useState(SQLite.openDatabase("localMessage"))
    const tableName = roomId.slice(1, 19)
    const readUpTo = useRef(0)
    const [messages, setMessages] = useState<IMessage[]>([])
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
    }, [roomId])

    const createStore = async () => {
        return await db.execAsync([{
            sql: `CREATE TABLE "${tableName}" (
                        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
        const page: IMessage[] = []
        const res = await db.execAsync([{ sql: `select * from ${tableName} order by id desc limit ${readUpTo.current}, ${limit}`, args: [] }], true)
        if (res[0]['rows']) {
            res[0]['rows'].forEach(r => {
                const msg: IMessage = {
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

    const appendMessage = async (msg: IMessage) => {
        await appendMessages([msg])
    }

    const appendMessages = async (msgs: IMessage[]) => {
        msgs.forEach(async msg => {
            console.log('append msg:', msg)
            const args = [msg._id, msg.text, msg.createdAt, JSON.stringify(msg.user) || null, msg.image || null, msg.video || null, msg.audio || null, msg.system ? 1 : 0, msg.sent ? 1 : 0, msg.received ? 1 : 0, msg.pending ? 1 : 0, JSON.stringify(msg.quickReplies) || null]
            const res = await db.execAsync([{
                sql: `INSERT INTO "${tableName}" 
                ("_id", "text", "createdAt", "user", "image", "video", "audio", "system", "sent", "received", "pending", "quickReplies") 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                args
            }], false)
            console.log('append', res)
        })
        setMessages((prev) => msgs.concat(prev))
    }

    const setMessageCompeted = async (txnId: string, eventId: string) => {
        const sql = `update ${tableName} set _id = ?, pending = 0, sent = 1 where _id = ?`
        const args = [eventId, txnId]
        const res = await db.execAsync([{ sql, args }], false)
        setMessages((prev) => {
            const updating = prev.find(m => m._id === txnId)
            if (updating) {
                updating._id = eventId
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

