import 'dayjs/locale/zh';

import * as ImagePicker from 'expo-image-picker';
import {
  EventType, IContent, MatrixEvent, MatrixEventEvent, MsgType, ReceiptType, RoomEvent
} from 'matrix-js-sdk';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GiftedChat, IMessage, Send, SendProps, User } from 'react-native-gifted-chat';
import URI from 'urijs';

import { MaterialIcons } from '@expo/vector-icons';
import { Button, Divider, Icon, useTheme } from '@rneui/themed';

import { useMatrixClient } from '../../store/chat';
import { useSqliteStore } from './localMessage';
import { CameraType } from 'expo-image-picker';

export function Room({ route, navigation }) {

  const { id } = route.params
  const { client, rooms, user } = useMatrixClient()
  const room = rooms.find(r => r.roomId === id)
  const msgStore = useSqliteStore(room.roomId)
  const { theme } = useTheme()
  const [bottomSheetShow, setBottomSheetShow] = useState(false)

  // 导航条样式
  useEffect(() => {
    // set nav bar
    navigation.setOptions({
      title: room.name,
      headerRight: () => {
        return <Icon name='options' size={30} type='simple-line-icon' color={theme.colors.background}
          onPress={() => { navigation.push('RoomSetting', { id: room.roomId }) }}></Icon>
      }
    })
  }, [])

  // event转换为msg格式
  const evtToMsg = (evt: MatrixEvent) => {
    let msg: IMessage = null
    const sender = client.getUser(evt.getSender())
    const msgUser: User = {
      _id: sender.userId,
      name: sender.displayName,
      avatar: sender.avatarUrl,
    }
    switch (evt.event.type) {
      case EventType.RoomCreate:
        msg = {
          _id: evt.event.event_id,
          text: `${evt.event.content.displayname} 创建了聊天`,
          createdAt: evt.localTimestamp,
          system: true,
          user: msgUser
        }
        break
      case EventType.RoomMember:
        if (evt.event.content.membership === 'join') {
          msg = {
            _id: evt.event.event_id,
            text: `${evt.event.content.displayname} 加入了聊天`,
            createdAt: evt.localTimestamp,
            system: true,
            user: msgUser
          }
        } else if (evt.event.content.membership === 'leave') {
          msg = {
            _id: evt.event.event_id,
            text: `${evt.event.content.displayname} 离开了聊天`,
            createdAt: evt.localTimestamp,
            system: true,
            user: msgUser
          }
        }
        break
      case EventType.RoomMessage:
        if (evt.event.content.msgtype == MsgType.Text) {
          msg = {
            _id: evt.event.event_id,
            text: evt.event.content.body,
            createdAt: evt.localTimestamp,
            user: msgUser
          }
        }
        if (evt.event.content.msgtype == MsgType.Image) {
          msg = {
            _id: evt.event.event_id,
            text: "",
            image: client.mxcUrlToHttp(evt.event.content.url),
            createdAt: evt.localTimestamp,
            user: msgUser
          }
        }
        if (evt.event.content.msgtype === MsgType.Video) {
          msg = {
            _id: evt.event.event_id,
            text: "",
            image: client.mxcUrlToHttp(evt.event.content.info.thumbnail_info.thumbnail_url),
            video: client.mxcUrlToHttp(evt.event.content.url),
            createdAt: evt.localTimestamp,
            user: msgUser
          }
        }
        break
      default:
        console.log('timeline', evt.event.event_id, evt.event.type, evt.event.membership, evt.event.content)
    }
    msg.pending = evt.isSending()
    if (evt.isSending()) {
      msg._id = evt.getTxnId()
    }
    return msg
  }

  // 接收消息回调, 消息入库，发送回执
  const recvMsgCallback = (evt: MatrixEvent, room, toStartOfTimeline) => {
    if (toStartOfTimeline) {
      return; // don't print paginated results
    }

    const newMessage = evtToMsg(evt)
    if (newMessage) {
      // 发送已读
      console.log('append evt', evt.event.event_id, evt.event.txn_id, evt.event.content)
      msgStore.appendMessage(newMessage).then(() => {
        if (evt.isSending()) {
          evt.once(MatrixEventEvent.LocalEventIdReplaced, (e => {
            client.sendReadReceipt(e, ReceiptType.Read)
            msgStore.setMessageCompeted(e.getTxnId(), e.event.event_id)
          }))
        } else {
          client.sendReadReceipt(evt, ReceiptType.Read)
        }
      })
    }
  }

  // 同步未接收消息
  const syncUnread = async () => {
    while (room.getEventReadUpTo(user.userId) === null) {
      await client.scrollback(room)
    }

    // no new event
    if (room.getEventReadUpTo(user.userId) === room.getLastLiveEvent().event.event_id) {
      return
    }

    console.log('sync finished')
    const events = room.getLiveTimeline().getEvents()
    const syncIndex = events.findIndex(e => e.event.event_id === room.getEventReadUpTo(user.userId))
    const unReadMsgs = []
    events.slice(syncIndex).forEach(e => {
      console.log('ssssssssssss', e.event.event_id, e.event.type, e.event.content)
      const msg = evtToMsg(e)
      if (msg) {
        unReadMsgs.push(msg)
      }
    })
    msgStore.appendMessages(unReadMsgs)

    client.sendReadReceipt(events[events.length - 1], ReceiptType.Read)
  }

  // 初始化: 显示本地消息 & 监听消息队列 & 同步离线消息
  useEffect(() => {
    if (msgStore.isReady) {
      syncUnread()
      room.on(RoomEvent.Timeline, recvMsgCallback)
    }

    return () => {
      room.off(RoomEvent.Timeline, recvMsgCallback)
    }
  }, [msgStore.isReady])

  // 发送消息
  const sendText = useCallback((messages = []) => {
    setBottomSheetShow(false)
    const message = messages[0]
    client.sendTextMessage(room.roomId, message.text)

  }, [client])

  // 相册
  const sendGalley = useCallback(() => {
    (async () => {
      const picker = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        aspect: [4, 3],
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: 9
      })
      if (!picker.canceled) {
        picker.assets.forEach(async (a) => {
          const fileUri = new URI(a.uri)
          const response = await fetch(a.uri)
          const blob = await response.blob()
          const upload = await client.uploadContent(blob, {
            name: fileUri.filename()
          })
          if (a.type === 'image') {
            client.sendImageMessage(room.roomId, upload.content_uri)
          }
          if (a.type === 'video') {
            const content: IContent = {
              msgtype: 'm.video',
              body: fileUri.filename(),
              url: upload.content_uri,
              info: {
                thumbnail_info: {

                }
              }
            }
            client.sendMessage(room.roomId, content)
          }
        })
      }
    })()
  }, [client])

  // 拍摄
  const sendCamera = useCallback(() => {
    (async () => {
      const picker = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        aspect: [4, 3],
        quality: 1,
        cameraType: CameraType.back
      })
      if (!picker.canceled) {
        picker.assets.forEach(async (a) => {
          const fileUri = new URI(a.uri)
          const response = await fetch(a.uri)
          const blob = await response.blob()
          const upload = await client.uploadContent(blob, {
            name: fileUri.filename()
          })
          client.sendImageMessage(room.roomId, upload.content_uri)
        })
      }
    })()
  }, [client])

  // 查看历史消息
  const LoadEarlier = useCallback(() => {
    console.log('load earlier')
    msgStore.loadMoreMessages().then((res) => {
      console.log('res', res)
    })
  }, [client])

  // 发送按钮
  const renderSend = useCallback((props: SendProps<IMessage>) => {
    return (
      <>
        <Send {...props} alwaysShowSend containerStyle={{ justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
            {props.text === "" && <Icon name='plus-circle' type='feather' size={30} onPress={() => { setBottomSheetShow((prev) => !prev) }}></Icon>}
            {props.text !== "" && <MaterialIcons size={30} color={theme.colors.primary} name={'send'} />}
          </View>
        </Send>
      </>
    )
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.content} onLayout={() => { LoadEarlier() }}>
        <GiftedChat
          locale='zh'
          messages={msgStore.messages}
          onInputTextChanged={() => { setBottomSheetShow(false) }}
          scrollToBottom
          onLoadEarlier={LoadEarlier}
          keyboardShouldPersistTaps='never'
          onSend={messages => sendText(messages)}
          placeholder='说点什么吧...'
          infiniteScroll
          loadEarlier
          showUserAvatar
          user={{
            _id: user.userId,
            name: user.displayName,
            avatar: user.avatarUrl
          }}
          renderSend={renderSend}
        />
        {bottomSheetShow && <View >
          <Divider style={{ width: '100%' }}></Divider>
          <View style={{ flexDirection: 'row' }}>
            <Button color={theme.colors.black} title={'相册'} type='clear' icon={<Icon size={40} name='image' type='font-awesome'></Icon>} iconPosition='top'
              onPress={() => { sendGalley() }}
            ></Button>
            <Button color={theme.colors.black} title={'拍摄'} type='clear' icon={<Icon size={40} name='video' type='font-awesome-5'></Icon>} iconPosition='top'
              onPress={() => { sendCamera() }}>
            </Button>
          </View>
        </View>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { backgroundColor: '#ffffff', flex: 1 },
})