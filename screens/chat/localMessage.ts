import { useEffect, useRef, useState } from "react";
import { IMessage } from "react-native-gifted-chat";
import * as SQLite from 'expo-sqlite';

export const useSqliteStore = (roomId: string) => {

    const [db] = useState(SQLite.openDatabase("message"))
    const tableName = roomId.slice(1, 19)
    const readUpTo = useRef(0)

    useEffect(() => {
        (async () => {
            console.log('init database')
            const res = await db.execAsync([{
                sql: "SELECT count(*) total FROM sqlite_master WHERE type='table' and name=?",
                args: [tableName]
            }], true)

            if (res[0]['rows'][0]["total"] === 0) {
                const res = await db.execAsync([{
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
                }], false)
                console.log(`room: ${tableName} created:`, res)
            } else {
                console.log(`room: ${tableName} opened`,)
            }
        })()
        return () => {
            console.log('stop database')
            db.closeAsync()
        }
    }, [roomId])

    const loadMoreMessages = async (limit: number = 50) => {
        const page: IMessage[] = []
        const res = await db.execAsync([{ sql: `select * from ${tableName} order by id desc limit ${readUpTo.current}, ${limit}`, args: [] }], true)
        console.log('loadMsg', res)
        if (res[0]['rows']) {
            res[0]['rows'].forEach(r => {
                const msg: IMessage = {
                    _id: null,
                    text: null,
                    createdAt: 0,
                    user: null
                }
                console.log('r', r)
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
        return page
    }

    const clearMessages = async () => {
        await db.execAsync([{ sql: `drop table ${tableName}`, args: [] }], false)
    }

    const appendMessage = async (msg: IMessage) => {

        const args = [msg._id, msg.text, msg.createdAt, JSON.stringify(msg.user) || null, msg.image || null, msg.video || null, msg.audio || null, msg.system || null, msg.sent || null, msg.received || null, msg.pending || null, JSON.stringify(msg.quickReplies) || null]
        const res = await db.execAsync([{
            sql: `INSERT INTO "${tableName}" 
            ("_id", "text", "createdAt", "user", "image", "video", "audio", "system", "sent", "received", "pending", "quickReplies") 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            args
        }], false)
        console.log('appendMsg', args, res)
    }

    const appendMessages = async (msgs: IMessage[]) => {
        msgs.forEach(async m => {
            await appendMessage(m)
        })
    }

    return {
        appendMessage,
        appendMessages,
        loadMoreMessages,
        clearMessages
    }
}