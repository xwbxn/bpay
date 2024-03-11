import React, { useCallback, useEffect, useState } from 'react';
import { GiftedChat, IMessage, Send, SendProps } from 'react-native-gifted-chat';
import { Avatar, Button, Divider, Icon } from '@rneui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@rneui/themed';
import { View, StyleSheet } from 'react-native';
import { EventType, IContent, MatrixEvent, MsgType, ReceiptType, RoomEvent } from 'matrix-js-sdk';
import { useMatrixClient } from '../../store/chat';
import * as ImagePicker from 'expo-image-picker';
import URI from 'urijs';
import { CameraType } from 'expo-image-picker';
import 'dayjs/locale/zh'
import { useSqliteStore } from './localMessage';

export function Room({ route, navigation }) {

  const { id } = route.params
  const { client, rooms, user } = useMatrixClient()
  const room = rooms.find(r => r.roomId === id)
  const msgStore = useSqliteStore(room.roomId)

  // msgStore.clearMessages()

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


  const [messages, setMessages] = useState([])
  const { theme } = useTheme()
  const [bottomSheetShow, setBottomSheetShow] = useState(false)

  const evtToMsg = (e: MatrixEvent) => {
    let msg: IMessage = null
    switch (e.event.type) {
      case EventType.RoomCreate:
        msg = {
          _id: e.event.event_id,
          text: `${e.event.content.displayname} 创建了聊天`,
          createdAt: e.localTimestamp,
          system: true,
          user: null
        }
        break
      case EventType.RoomMember:
        if (e.event.content.membership === 'join') {
          msg = {
            _id: e.event.event_id,
            text: `${e.event.content.displayname} 加入了聊天`,
            createdAt: e.localTimestamp,
            system: true,
            user: null
          }
        } else if (e.event.content.membership === 'leave') {
          msg = {
            _id: e.event.event_id,
            text: `${e.event.content.displayname} 离开了聊天`,
            createdAt: e.localTimestamp,
            system: true,
            user: null
          }
        }
        break
      case EventType.RoomMessage:
        if (e.event.content.msgtype == MsgType.Text) {
          msg = {
            _id: e.event.event_id,
            text: e.event.content.body,
            createdAt: e.localTimestamp,
            user: {
              _id: e.event.sender,
              name: e.event.sender,
              avatar: () => <Avatar size={40} rounded title={e.event.sender[1]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
            }
          }
        }
        if (e.event.content.msgtype == MsgType.Image) {
          msg = {
            _id: e.event.event_id,
            text: "",
            image: client.mxcUrlToHttp(e.event.content.url),
            createdAt: e.localTimestamp,
            user: {
              _id: e.event.sender,
              name: e.event.sender,
              avatar: () => <Avatar size={40} rounded title={e.event.sender[1]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
            }
          }
        }
        if (e.event.content.msgtype === MsgType.Video) {
          msg = {
            _id: e.event.event_id,
            text: "",
            image: client.mxcUrlToHttp(e.event.content.info.thumbnail_info.thumbnail_url),
            video: client.mxcUrlToHttp(e.event.content.url),
            createdAt: e.localTimestamp,
            user: {
              _id: e.event.sender,
              name: e.event.sender,
              avatar: () => <Avatar size={40} rounded title={e.event.sender[1]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
            }
          }
        }
        break
      default:
        console.log('timeline', e.event.event_id, e.event.type, e.event.membership, e.event.content)
    }
    // console.log('message', msg)
    return msg
  }

  // 接收消息回调
  const recvMsg = (evt: MatrixEvent, room, toStartOfTimeline) => {
    if (toStartOfTimeline) {
      return; // don't print paginated results
    }

    const newMessage = evtToMsg(evt)
    if (newMessage) {
      // 发送已读
      client.sendReadReceipt(evt, ReceiptType.Read)
      msgStore.appendMessage(newMessage)
      setMessages(previousMessages => {
        return GiftedChat.append(previousMessages, [newMessage])
      })
    }
  }

  // 初始化: 显示本地消息 & 监听消息队列
  useEffect(() => {
    // 接收历史消息
    // const historyMessages = []
    // room.getLiveTimeline().getEvents().forEach(e => {
    //   const msg = evtToMsg(e)
    //   if (msg) {
    //     historyMessages.unshift(msg)
    //   }
    // })
    room.on(RoomEvent.Timeline, recvMsg)

    // 发送已读
    client.sendReadReceipt(room.getLastLiveEvent(), ReceiptType.Read)
    return () => {
      room.off(RoomEvent.Timeline, recvMsg)
    }
  }, [])

  // 发送消息
  const onSend = useCallback((messages = []) => {
    setBottomSheetShow(false)
    const message = messages[0]
    client.sendTextMessage(room.roomId, message.text).then(e => {
      message._id = e.event_id
      // console.log('sendmsg', message)
    }).catch(e => {
      console.log('send failed', e)
    })
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
    msgStore.loadMoreMessages().then(msgs => {
      setMessages(previousMessages => {
        return GiftedChat.append(previousMessages, msgs)
      })
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
      <View style={styles.content} onLayout={() => {LoadEarlier()}}>
        <GiftedChat
          locale='zh'
          messages={messages}
          onInputTextChanged={() => { setBottomSheetShow(false) }}
          scrollToBottom
          onLoadEarlier={LoadEarlier}
          keyboardShouldPersistTaps='never'
          onSend={messages => onSend(messages)}
          placeholder='说点什么吧...'
          infiniteScroll
          loadEarlier
          showUserAvatar
          user={{
            _id: user.userId,
            name: user.displayName,
            avatar: () => <Avatar size={40} rounded title={user.displayName} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
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