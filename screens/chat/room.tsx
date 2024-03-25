import 'dayjs/locale/zh';

import * as Clipboard from 'expo-clipboard';
import * as crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import * as vt from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';

import { EventType, IContent, MatrixEvent, MsgType, RoomEvent } from 'matrix-js-sdk';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { GiftedChat, IMessage, Send, SendProps, User } from 'react-native-gifted-chat';
import Toast from 'react-native-root-toast';
import URI from 'urijs';

import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheet, Button, Divider, Icon, ListItem, useTheme } from '@rneui/themed';

import { useGlobalState } from '../../store/globalContext';
import { hiddenTagName, useMatrixClient } from '../../store/useMatrixClient';
import { MessageImage } from './messageRenders/MessageImage';
import { MessageVideo } from './messageRenders/MessageVideo';
import { CameraType } from 'expo-image-picker';

export function Room({ route, navigation }) {

  const { theme } = useTheme()
  const { id } = route.params
  const { client } = useMatrixClient()
  const [room, setRoom] = useState(client.getRoom(id))
  const user = client.getUser(client.getUserId())
  const isFriendRoom = client.isFriendRoom(id)
  const [bottomSheetShow, setBottomSheetShow] = useState(false)
  const [actionSheetShow, setActionSheetShow] = useState(false)

  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState<IChatMessage>()
  const [refreshKey, setRefreshKey] = useState(crypto.randomUUID())

  const { setLoading } = useGlobalState()


  useEffect(() => {
    setRoom(client.getRoom(id))
  }, [client.getRoom(id)])


  // 导航条样式
  useEffect(() => {
    // set nav bar
    navigation.setOptions({
      title: room?.name,
      headerRight: () => {
        return <Icon name='options' size={30} type='simple-line-icon' color={theme.colors.background}
          onPress={() => { navigation.push('RoomSetting', { id: room?.roomId }) }}></Icon>
      },
    })
  }, [room])

  interface IChatMessage extends IMessage {
    w?: number,
    h?: number,
    origin_uri?: string
    filename?: string,
    event?: MatrixEvent
  }

  // event转换为msg格式
  const evtToMsg = (evt: MatrixEvent) => {
    const sender = client.getUser(evt.getSender())
    let msg: IChatMessage = {
      _id: evt.getId(),
      text: '',
      createdAt: evt.localTimestamp,
      user: {
        _id: evt.getSender(),
        name: sender.displayName || evt.getSender(),
        avatar: sender.avatarUrl || '',
      },
      sent: evt.status === null,
      pending: evt.status !== null
    }
    switch (evt.event.type) {
      case EventType.RoomMessageEncrypted:
        msg.text = `[加密消息]`
        break
      case EventType.RoomCreate:
        if (!isFriendRoom) {
          msg.text = `${msg.user.name} 创建了群聊`
          msg.system = true
        }
        break
      case EventType.RoomMember:
        msg.system = true
        if (evt.getContent().membership === 'join') {
          msg.text = isFriendRoom ? `${evt.getContent().displayname} 开始了聊天` : `${evt.getContent().displayname} 加入了群聊`
        } else if (evt.getContent().membership === 'leave') {
          msg.text = isFriendRoom ? `${evt.getContent().displayname} 已将您从好友中删除` : `${evt.getContent().displayname} 离开了群聊`
        } else if (isFriendRoom && evt.getContent().membership === 'invite') {
          msg.text = `向 ${evt.getContent().displayname} 发起了好友申请`
        }
        break
      case EventType.RoomMessage:
        if (evt.getContent().msgtype == MsgType.Text) {
          msg.text = evt.getContent().body
        }
        if (evt.getContent().msgtype == MsgType.Image) {
          const thumbnail_info = client.getThumbnails(
            evt.getContent().url,
            evt.getContent().info?.w,
            evt.getContent().info?.h)
          msg.image = thumbnail_info.thumbnail_url
          msg.w = thumbnail_info.width
          msg.h = thumbnail_info.height
        }
        if (evt.getContent().msgtype === MsgType.Video) {
          msg.video = client.mxcUrlToHttp(evt.getContent().info.thumbnail_url)
          msg.w = evt.getContent().info?.thumbnail_info?.w || 150
          msg.h = evt.getContent().info?.thumbnail_info?.h || 100
          // msg.video = client.mxcUrlToHttp(evt.getContent().url)
        }
        if (evt.isRedacted()) {
          msg.text = "[消息已被撤回]"
          msg.createdAt = 0
          msg.pending = false
          msg.sent = false
        }
        break
      default:
        msg._id = null
        msg.text = `[不支持的消息(${evt.getType()})]`
        console.log('timeline', evt.getId(), evt.event.type, evt.event.membership, evt.getContent())
        break
    }
    return msg
  }

  useEffect(() => {
    if (!room) {
      return
    }
    const refreshMessage = () => {
      setRefreshKey(crypto.randomUUID())
    }
    if (room?.tags[hiddenTagName]) {
      client.deleteRoomTag(room.roomId, hiddenTagName)
    }

    if (room.getMyMembership() == 'invite') {
      const invitor = room.getMember(room.getDMInviter())
      const tip = invitor ? `是否同意 ${invitor?.name} 的好友申请` : `是否同意加入[${room.name}]`
      Alert.alert("提示", tip, [
        {
          text: '拒绝', onPress(value?) {
            setLoading(true)
            client.leave(room.roomId).then(() => {
              return client.forget(room.roomId)
            }).then(() => {
              navigation.goBack()
            }).finally(() => {
              setLoading(false)
            })
          },
        }, {
          text: '同意', onPress(value?) {
            if (invitor) {
              setLoading(true)
              client.acceptFriend(invitor.userId, room.roomId).then(() => {
                setRefreshKey(crypto.randomUUID())
              }).catch(err => {
                if (err.httpStatus === 404) {
                  Alert.alert('该请求已失效')
                  client.leave(room.roomId)
                  navigation.goBack()
                }
              }).finally(() => {
                setLoading(false)
              })
            } else {
              setLoading(true)
              client.joinRoom(room.roomId).then(() => {
                setRefreshKey(crypto.randomUUID())
              }).finally(() => {
                setLoading(false)
              })
            }
          },
        }
      ])
    }

    room.on(RoomEvent.Timeline, refreshMessage)
    room.on(RoomEvent.LocalEchoUpdated, refreshMessage)
    return () => {
      room.off(RoomEvent.LocalEchoUpdated, refreshMessage)
      room.off(RoomEvent.Timeline, refreshMessage)
    }
  }, [room])

  // timeline event 转为 消息
  useEffect(() => {
    if (!room) {
      return
    }
    const newMessages = []
    const msgEvts = room.getLiveTimeline().getEvents()
    if (msgEvts.length > 0) {
      msgEvts.forEach(evt => {
        const msg = evtToMsg(evt)
        if (msg._id) newMessages.unshift(msg)
      })
      setMessages(newMessages)
      const lastEvt = msgEvts[msgEvts.length - 1]
      if (lastEvt.status === null) {
        client.sendReadReceipt(lastEvt)
      }
    }
  }, [refreshKey])

  // 发送消息
  const sendText = useCallback((messages = []) => {
    setBottomSheetShow(false)
    const message: IMessage = messages[0]
    message.pending = true
    setMessages(prev => GiftedChat.append(prev, [message]))
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
          // 本地预览消息
          previewMessage(a);
          // 上传文件
          const upload = await client.uploadFile(a.uri)

          // 图片
          if (a.type === 'image') {
            const thumbnail = client.getThumbnails(upload.content_uri, a.width, a.height)
            const content: IContent = {
              msgtype: MsgType.Image,
              body: a.fileName,
              url: upload.content_uri,
              info: {
                h: a.height,
                w: a.width,
                mimetype: a.mimeType,
                size: a.fileSize,
                thumbnail_url: thumbnail.thumbnail_url,
                thumbnail_info: {
                  w: thumbnail.width,
                  h: thumbnail.height,
                  mimetype: a.mimeType
                }
              },
            }
            client.sendMessage(room.roomId, content)
          }
          // 视频
          if (a.type === 'video') {
            const ratio = Math.max(a.height, a.width) / 150
            const thumbnail = await vt.getThumbnailAsync(a.uri)
            const uploadedThumb = await client.uploadFile(thumbnail.uri)
            const content: IContent = {
              msgtype: MsgType.Video,
              body: a.fileName,
              url: upload.content_uri,
              info: {
                duration: a.duration,
                h: a.height,
                w: a.width,
                mimetype: a.mimeType,
                size: a.fileSize,
                thumbnail_url: uploadedThumb.content_uri,
                thumbnail_info: {
                  w: Math.floor(thumbnail.width / ratio),
                  h: Math.floor(thumbnail.height / ratio),
                  minetype: ''
                }
              },
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
          previewMessage(a)
          const upload = await client.uploadFile(a.uri)
          client.sendImageMessage(room.roomId, upload.content_uri)
        })
      }
    })()
  }, [client])

  // 查看历史消息
  const LoadEarlier = useCallback(() => {
    client.scrollback(room)
  }, [client])

  // 发送按钮
  const renderSend = useCallback((props: SendProps<IMessage>) => {
    const disabled = client.isFriendRoom(room.roomId) && room.getJoinedMemberCount() === 1
    return (
      <>
        <Send disabled={disabled}
          {...props} alwaysShowSend containerStyle={{ justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
            {props.text === "" && <Icon name='plus-circle' disabled={disabled} disabledStyle={{ backgroundColor: theme.colors.background }}
              type='feather' size={30} onPress={() => { setBottomSheetShow((prev) => !prev) }}
              color={disabled ? theme.colors.disabled : theme.colors.primary}></Icon>}
            {props.text !== "" && <MaterialIcons size={30} color={disabled ? theme.colors.disabled : theme.colors.primary} name={'send'} />}
          </View>
        </Send>
      </>
    )
  }, [])

  // 右键操作
  const onMessageLongPress = (context, message) => {
    setCurrentMessage(message)
    setActionSheetShow(true)
  }

  // 撤回
  const onRedAction = () => {
    client.redactEvent(room.roomId, currentMessage._id as string).then(() => {
      setActionSheetShow(false)
    })
  }

  // 复制消息
  const onCopy = async () => {
    await Clipboard.setStringAsync(currentMessage.text);
    setActionSheetShow(false)
    Toast.show('已复制到剪贴板', {
      duration: Toast.durations.LONG,
      position: Toast.positions.CENTER
    });
  }

  // 加入收藏
  const setMessageFavor = () => {
    const favor = client.getAccountData('m.favor')?.getContent()?.favor || []
    favor.push(currentMessage)
    client.setAccountData('m.favor', { favor }).then(() => {
      setActionSheetShow(false)
      Toast.show('已加入收藏', {
        duration: Toast.durations.LONG,
        position: Toast.positions.CENTER
      });
    })
  }

  // 下载
  const onDownload = async () => {
    const downloadResumable = FileSystem.createDownloadResumable(
      currentMessage.origin_uri,
      FileSystem.documentDirectory + currentMessage.filename
    );
    console.log('FileSystem.', FileSystem.documentDirectory, currentMessage.filename)
    await downloadResumable.downloadAsync()
    Toast.show('下载完成', {
      duration: Toast.durations.LONG,
      position: Toast.positions.CENTER
    });
  }

  return (
    <View style={styles.container}>
      <BottomSheet isVisible={actionSheetShow} onBackdropPress={() => setActionSheetShow(false)}>
        <ListItem bottomDivider onPress={onCopy}>
          <Icon name='copy' type='octicon'></Icon>
          <ListItem.Title>复制</ListItem.Title>
        </ListItem>
        <ListItem bottomDivider onPress={setMessageFavor}>
          <Icon name='favorite-border' type='meterialicon'></Icon>
          <ListItem.Title>收藏</ListItem.Title>
        </ListItem>
        {currentMessage?.origin_uri &&
          <ListItem onPress={onDownload} bottomDivider>
            <Icon name='download' type='meterialicon'></Icon>
            <ListItem.Title>下载</ListItem.Title>
          </ListItem>}
        {currentMessage?.user._id === client.getUserId() && currentMessage.text != '[消息已被撤回]' &&
          <ListItem onPress={onRedAction} bottomDivider>
            <Icon name='undo' type='meterialicon'></Icon>
            <ListItem.Title>撤回</ListItem.Title>
          </ListItem>}
        <ListItem onPress={() => setActionSheetShow(false)}>
          <Icon name='close' color={theme.colors.error} type='meterialicon'></Icon>
          <ListItem.Title style={{ color: theme.colors.error }}>取消</ListItem.Title>
        </ListItem>
      </BottomSheet>
      <View style={styles.content}>
        <GiftedChat
          locale='zh'
          onLongPress={onMessageLongPress}
          messages={messages}
          onInputTextChanged={() => { setBottomSheetShow(false) }}
          scrollToBottom
          onLoadEarlier={LoadEarlier}
          keyboardShouldPersistTaps='never'
          onSend={messages => sendText(messages)}
          placeholder='说点什么吧...'
          infiniteScroll
          showUserAvatar
          loadEarlier
          user={{
            _id: user.userId,
            name: user.displayName,
            avatar: user.avatarUrl
          }}
          renderSend={renderSend}
          onPressAvatar={(user) => navigation.push('Member', { userId: user._id })}
          renderMessageImage={MessageImage}
          renderMessageVideo={MessageVideo}
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
    </View >
  )

  function previewMessage(a: ImagePicker.ImagePickerAsset) {
    const ratio = Math.max(a.width, a.height) / 150;
    const msg: IChatMessage = {
      _id: client.makeTxnId(),
      user: {
        _id: user.userId,
        name: user.displayName,
        avatar: user.avatarUrl
      },
      text: '',
      createdAt: new Date(),
      pending: true,
      h: Math.floor(a.height / ratio),
      w: Math.floor(a.width / ratio)
    };
    if (a.type === 'image')
      msg.image = a.uri;
    if (a.type === 'video')
      msg.video = a.uri;
    setMessages(prev => GiftedChat.append(prev, [msg]));
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { backgroundColor: '#ffffff', flex: 1 },
})