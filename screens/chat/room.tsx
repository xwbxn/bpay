import 'dayjs/locale/zh';

import * as Clipboard from 'expo-clipboard';
import * as crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import * as vt from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import _ from 'lodash'

import { Direction, EventStatus, EventType, IContent, IEvent, JoinRule, MatrixEvent, MsgType, Room as RoomType, RoomEvent, UploadProgress } from 'matrix-js-sdk';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GiftedChat, IMessage, Send, SendProps } from 'react-native-gifted-chat';
import Toast from 'react-native-root-toast';

import { MaterialIcons } from '@expo/vector-icons';
import { Avatar, Badge, BottomSheet, Button, Dialog, Divider, Icon, ListItem, Overlay, Text, useTheme } from '@rneui/themed';

import { useGlobalState } from '../../store/globalContext';
import { hiddenTagName, useMatrixClient } from '../../store/useMatrixClient';
import { MessageImage } from './messageRenders/MessageImage';
import { MessageVideo } from './messageRenders/MessageVideo';
import { CameraType } from 'expo-image-picker';
import BpayHeader from '../../components/BpayHeader';
import { eventMessage } from './eventMessage';

export function Room({ route, navigation }) {

  const { theme } = useTheme()
  const { id } = route.params
  const { client } = useMatrixClient()
  const [room, setRoom] = useState(client.getRoom(id))
  const [user] = useState(client.getUser(client.getUserId()))
  const [topic, setTopic] = useState('')
  const [showTopic, setShowTopic] = useState(false)
  const isDirectRoom = client.isDirectRoom(id)
  const [bottomSheetShow, setBottomSheetShow] = useState(false)
  const [actionSheetShow, setActionSheetShow] = useState(false)
  const { setShowBottomTabBar } = useGlobalState()

  const [messages, setMessages] = useState<IChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState<IChatMessage>()
  const [readupTo, setReadUpTo] = useState('')
  const [refreshKey, setRefreshKey] = useState(crypto.randomUUID())

  const [disabled, setDisabled] = useState(false)
  const [knockBadge, setKnockBadge] = useState(0)
  const uploading = useRef<{ [id: string]: any }>({})

  const { setLoading } = useGlobalState()


  // 隐藏底部tapbar
  useEffect(() => {
    client.getStateEvent(id, EventType.RoomMember, client.getUserId()).then(evt => {
      setRoom(client.getRoom(id))
    })
    setShowBottomTabBar(false)
    return () => {
      setShowBottomTabBar(true)
    }
  }, [])

  interface IChatMessage extends IMessage {
    _id: string,
    w?: number,
    h?: number,
    origin_uri?: string
    filename?: string,
    event?: MatrixEvent,
    [id: string]: any
  }

  // event转换为msg格式
  const evtToMsg = (event: MatrixEvent) => {
    const message = eventMessage(event, room, client)
    const sender = event.sender
    const powerLevel = room.getMember(sender.userId)?.powerLevel || 0
    let msg: IChatMessage = {
      _id: event.getId(),
      text: 'm.message',
      createdAt: event.localTimestamp,
      user: {
        _id: event.getSender(),
        name: sender?.name || event.getSender(),
        avatar: powerLevel >= 50 && !isDirectRoom ? (styles) => {
          const uri = sender?.getAvatarUrl(client.baseUrl, 50, 50, 'crop', true, true) || undefined
          return <Avatar size={36} rounded containerStyle={{ backgroundColor: theme.colors.primary }}
            source={uri ? { uri: uri } : null} title={!uri ? sender?.name[0]?.toUpperCase() : null}>
            <Badge textStyle={{ fontSize: 8 }}
              badgeStyle={{ backgroundColor: powerLevel === 100 ? 'gold' : 'silver' }}
              containerStyle={{ position: 'absolute', top: -6, left: 24 }}
              value="V"></Badge>
          </Avatar >
        } : sender?.getAvatarUrl(client.baseUrl, 50, 50, 'crop', true, true) || undefined,
      },
      sent: event.status === null,
      pending: event.status !== null,
      event: event,
      isLocal: event.getSender() === client.getUserId(),
      ...message
    }
    return msg
  }

  useEffect(() => {
    if (!room) {
      return
    }
    setDisabled(client.isDirectRoom(room.roomId) && room.getJoinedMemberCount() === 1)
    setReadUpTo(room.getEventReadUpTo(client.getUserId()))

    const topicEvents = room.getLiveTimeline().getState(Direction.Forward).getStateEvents(EventType.RoomTopic)
    if (topicEvents.length > 0) {
      setTopic(topicEvents[0].getContent().topic || '')
    }

    const refreshMessage = _.debounce(() => {
      setRefreshKey(crypto.randomUUID())
    }, 150)

    if (room?.tags[hiddenTagName]) {
      client.deleteRoomTag(room.roomId, hiddenTagName)
    }

    if (room.getMyMembership() == 'invite') {
      const memberEvt = room.getMember(client.getUserId()).events.member
      const tip = `${room.getMember(memberEvt.getSender()).name} 邀请您加入 [${room?.name}]`
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
            setLoading(true)
            client.joinRoom(room.roomId).then(() => {
              setRefreshKey(crypto.randomUUID())
            }).finally(() => {
              setLoading(false)
            })
          },
        }
      ])
    }

    room.on(RoomEvent.Timeline, refreshMessage)
    room.on(RoomEvent.LocalEchoUpdated, refreshMessage)
    room.on(RoomEvent.TimelineRefresh, refreshMessage)
    return () => {
      room.off(RoomEvent.LocalEchoUpdated, refreshMessage)
      room.off(RoomEvent.Timeline, refreshMessage)
      room.off(RoomEvent.TimelineRefresh, refreshMessage)
    }
  }, [room])

  // timeline event 转为 消息
  useEffect(() => {
    if (!room) {
      return
    }

    if (room.getMember(client.getUserId()).powerLevel > 0) {
      setKnockBadge(room.getMembers().filter(m => m.membership === JoinRule.Knock).length)
    }
    // const _messages = [...messages]
    const _messages = []
    const events = room.getLiveTimeline().getEvents()
    if (events.length > 0) {
      events.forEach(evt => {
        const msg = evtToMsg(evt)
        if (msg._id) _messages.unshift(msg)
      })
      setMessages(_messages)
      const lastMsg = _messages[0]
      if (lastMsg && lastMsg.event?.status === null && lastMsg.event?.getId() !== readupTo) {
        client.sendReadReceipt(lastMsg.event)
        setReadUpTo(lastMsg.event.getId())
      }
    }
  }, [refreshKey])

  // 发送消息
  const sendText = useCallback((messages = []) => {
    setBottomSheetShow(false)
    const message: IChatMessage = messages[0]
    message.pending = true
    setMessages(prev => GiftedChat.append(prev, [message]))
    client.sendTextMessage(room?.roomId, message.text)
  }, [client, room])

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

          if (a.type === 'image') {
            const uname = crypto.randomUUID()

            // 本地预览消息
            const localMessage = previewImageMessage({
              width: a.width,
              height: a.height,
              uri: a.uri,
              type: 'image'
            }, a.uri)
            const txnId = localMessage._id;
            // 上传文件
            const upload = await client.uploadFile({
              uri: a.uri,
              mimeType: a.mimeType,
              name: uname
            })

            let thumbnail = {}
            if (a.width > 150 || a.height > 150) {
              thumbnail = await client.getThumbnails({
                uri: upload.content_uri,
                width: a.width,
                height: a.height,
                mimeType: a.mimeType,
                name: uname
              })
            }
            const content: IContent = {
              msgtype: MsgType.Image,
              body: a.fileName,
              url: upload.content_uri,
              info: {
                h: a.height,
                w: a.width,
                mimetype: a.mimeType,
                size: a.fileSize,
                ...thumbnail
              },
            }
            client.sendMessage(room?.roomId, content, txnId)
          }
          // 视频
          if (a.type === 'video') {
            // 缩略图
            await sendImage(a);
          }
        })
      }
    })()
  }, [client, room])

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
          // 本地预览消息
          const localMessage = previewImageMessage({
            width: a.width,
            height: a.height,
            uri: a.uri,
            type: 'image'
          }, a.uri)
          const txnId = localMessage._id
          const uname = crypto.randomUUID()
          const upload = await client.uploadFile({
            uri: a.uri,
            name: uname,
            mimeType: a.mimeType
          })
          let thumbnail = {}
          if (a.width > 150 || a.height > 150) {
            thumbnail = await client.getThumbnails({
              uri: upload.content_uri,
              width: a.width,
              height: a.height,
              mimeType: a.mimeType,
              name: uname
            })
          }
          const content: IContent = {
            msgtype: MsgType.Image,
            body: a.fileName,
            url: upload.content_uri,
            info: {
              h: a.height,
              w: a.width,
              mimetype: a.mimeType,
              size: a.fileSize,
              ...thumbnail
            },
          }
          client.sendMessage(room?.roomId, content, txnId)
        })
      }
    })()
  }, [client, room])

  // 文档
  const sendDocument = useCallback(async () => {
    const picker = await DocumentPicker.getDocumentAsync()
    if (!picker.canceled) {
      picker.assets.forEach(async a => {
        const localMessage: IChatMessage = {
          _id: client.makeTxnId(),
          text: `[📄${a.name}]`,
          createdAt: new Date(),
          user: {
            _id: user.userId,
            name: user.displayName,
            avatar: user.avatarUrl,
          },
          pending: true
        }
        setMessages(prev => GiftedChat.append(prev, [localMessage]));

        const txnId = localMessage._id
        const uname = crypto.randomUUID()
        const upload = await client.uploadFile({
          uri: a.uri,
          name: uname,
          mimeType: a.mimeType
        })

        const content: IContent = {
          msgtype: MsgType.File,
          body: a.name,
          url: upload.content_uri,
          info: {
            size: a.size,
            mimetype: a.mimeType
          },
        }
        client.sendMessage(room?.roomId, content, txnId)
      })
    }
  }, [client, room])

  // 查看历史消息
  const LoadEarlier = useCallback(() => {
    if (room) {
      client.scrollback(room)
    }
  }, [client, room])

  // 渲染发送按钮
  const renderSend = useCallback((props: SendProps<IMessage>) => {
    return (
      <>
        <Send disabled={disabled}
          {...props} alwaysShowSend containerStyle={{ justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
            {props.text === "" && <Icon name='plus-circle' disabled={disabled} disabledStyle={{ backgroundColor: theme.colors.background }}
              type='feather' size={30} onPress={() => { setBottomSheetShow((prev) => !prev) }}
              color={disabled ? theme.colors.disabled : theme.colors.black}></Icon>}
            {props.text !== "" && <MaterialIcons size={30} color={disabled ? theme.colors.disabled : theme.colors.primary} name={'send'} />}
          </View>
        </Send>
      </>
    )
  }, [disabled])

  // 长按操作
  const onMessageLongPress = (context, message) => {
    setCurrentMessage(message)
    setActionSheetShow(true)
  }

  // 触摸消息
  const onMessagePress = (context, message) => {
    setCurrentMessage(message)
    const evt: MatrixEvent = message.event
    if (!evt || evt.getType() !== EventType.RoomMessage) {
      return
    }
    if (evt.getContent().msgtype === MsgType.File) {
      const url = evt.getContent().url.startsWith("mxc:/") ? client.mxcUrlToHttp(evt.getContent().url) : evt.getContent().url
      Linking.openURL(url)
    }
  }

  // 撤回
  const onRedAction = () => {
    client.redactEvent(room?.roomId, currentMessage._id as string).then(() => {
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
    await downloadResumable.downloadAsync()
    Toast.show('下载完成', {
      duration: Toast.durations.LONG,
      position: Toast.positions.CENTER
    });
  }

  const headerRight = !disabled && <View><Icon name='options' size={30} type='simple-line-icon' color={theme.colors.background}
    onPress={() => { navigation.push('RoomSetting', { id: room?.roomId }) }}></Icon>
    {knockBadge > 0 && <Badge containerStyle={{ position: 'absolute', left: 20, top: -4 }}
      badgeStyle={{ backgroundColor: theme.colors.error }} value={knockBadge}></Badge>}</View>

  return (<>
    <BpayHeader showback title={room?.name} rightComponent={headerRight}></BpayHeader>
    <View style={styles.container}>
      <Dialog
        isVisible={showTopic}
        onBackdropPress={() => setShowTopic(false)}>
        <Dialog.Title title="群公告" />
        <Text>{topic}</Text>
      </Dialog>
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
        {currentMessage?.user._id !== client.getUserId() && client.canDo(id, 'redact') &&
          <ListItem onPress={onRedAction} bottomDivider>
            <Icon name='delete' type='meterialicon'></Icon>
            <ListItem.Title>删除</ListItem.Title>
          </ListItem>}
        <ListItem onPress={() => setActionSheetShow(false)}>
          <Icon name='close' color={theme.colors.error} type='meterialicon'></Icon>
          <ListItem.Title style={{ color: theme.colors.error }}>取消</ListItem.Title>
        </ListItem>
      </BottomSheet>
      {topic !== '' && <Text style={{ padding: 8 }} numberOfLines={1} lineBreakMode='clip' onPress={() => setShowTopic(true)}>群公告: {topic}</Text>}
      <View style={styles.content}>
        <GiftedChat
          locale='zh'
          onLongPress={onMessageLongPress}
          onPress={onMessagePress}
          messages={messages}
          onInputTextChanged={() => { setBottomSheetShow(false) }}
          scrollToBottom
          renderUsernameOnMessage
          onLoadEarlier={LoadEarlier}
          keyboardShouldPersistTaps='never'
          onSend={messages => sendText(messages)}
          placeholder='说点什么吧...'
          infiniteScroll
          showUserAvatar
          messagesContainerStyle={{ paddingBottom: 10 }}
          // @ts-ignore
          primaryStyle={{ paddingTop: 6, paddingBottom: 6, backgroundColor: '#e0e0e0' }}
          textInputStyle={{ backgroundColor: '#ffffff', borderRadius: 10, paddingLeft: 10, lineHeight: 24 }}
          loadEarlier
          user={{
            _id: user?.userId,
            name: user?.displayName,
            avatar: user?.avatarUrl
          }}
          renderSend={renderSend}
          onPressAvatar={(user) => navigation.push('Member', { userId: user._id })}
          renderMessageImage={MessageImage}
          renderMessageVideo={MessageVideo}
        />
        {bottomSheetShow && <View >
          <Divider style={{ width: '100%' }}></Divider>
          <View style={{ flexDirection: 'row' }}>
            <Button containerStyle={{ padding: 10 }} color={theme.colors.black} size='sm' titleStyle={{ color: theme.colors.black }} title={'相册'} type='clear' icon={<Icon name='image' type='font-awesome'></Icon>} iconPosition='top'
              onPress={sendGalley}
            ></Button>
            <Button containerStyle={{ padding: 10 }} color={theme.colors.black} size='sm' titleStyle={{ color: theme.colors.black }} title={'拍摄'} type='clear' icon={<Icon name='video' type='font-awesome-5'></Icon>} iconPosition='top'
              onPress={sendCamera}>
            </Button>
            <Button containerStyle={{ padding: 10 }} color={theme.colors.black} size='sm' titleStyle={{ color: theme.colors.black }} title={'文档'} type='clear' icon={<Icon name='file' type='font-awesome-5'></Icon>} iconPosition='top'
              onPress={sendDocument}>
            </Button>
          </View>
        </View>}
      </View>
    </View >
  </>

  )

  async function sendImage(a: ImagePicker.ImagePickerAsset) {

    const localContent: IContent = {
      msgtype: MsgType.Video,
      body: a.fileName,
      url: a.uri,
      info: {
        duration: a.duration,
        h: a.height,
        w: a.width,
        mimetype: a.mimeType,
        size: a.fileSize,
      },
    };
    const eventObject: Partial<IEvent> = {
      type: EventType.RoomMessage,
      content: localContent
    }
    const txnId = client.makeTxnId()
    const evt = new MatrixEvent(Object.assign(eventObject, {
      event_id: "~" + room.roomId + ":" + txnId,
      user_id: client.credentials.userId,
      sender: client.credentials.userId,
      room_id: room.roomId,
      origin_server_ts: new Date().getTime(),
    }))
    evt.setStatus(EventStatus.SENDING)
    room.getLiveTimeline().addEvent(evt, { toStartOfTimeline: false })
    setRefreshKey(crypto.randomUUID())
    return
    const uname = crypto.randomUUID()
    const localMessage = previewImageMessage({
      height: a.height,
      width: a.width,
      uri: a.uri,
      type: 'video'
    }, a.uri);

    // 生成缩略图
    const ratio = Math.max(a.height, a.width) / 150;
    const thumbnail = await vt.getThumbnailAsync(a.uri);
    const uploadedThumb = await client.uploadFile({
      uri: thumbnail.uri,
      name: uname,
      mimeType: a.mimeType,
    });

    // 上传文件
    const upload = await client.uploadFile({
      uri: a.uri,
      mimeType: a.mimeType,
      name: uname,
      callback: (progress: UploadProgress) => {
        updateProgress(progress, localMessage);
      }
    });
    updateProgress(null, localMessage);

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
      local_uri: a.uri,
      local_img: thumbnail.uri
    };
    client.sendMessage(room?.roomId, content, txnId);

  }

  function updateProgress(progress: UploadProgress, localMessage: IChatMessage) {
    console.log('progress', progress);
    const progressMessage = {
      ...localMessage,
      progress: progress !== null ? progress.loaded / progress.total : null
    }
    messages.splice(messages.findIndex(i => i._id === localMessage._id), 1, progressMessage)
    setMessages([...messages])
  }

  function previewImageMessage(a: { height: number, width: number, uri: string, type: string }, localUri?: string) {
    const ratio = Math.max(a.width, a.height) / 150;
    const txnId = client.makeTxnId()
    const msg: IChatMessage = {
      _id: txnId,
      user: {
        _id: user.userId,
        name: user.displayName,
        avatar: user.avatarUrl
      },
      text: '',
      createdAt: new Date(),
      pending: true,
      h: Math.floor(a.height / ratio),
      w: Math.floor(a.width / ratio),
      localUri
    };
    if (a.type === 'image') {
      msg.image = a.uri
    }
    if (a.type === 'video') {
      msg.video = a.uri
    }
    setMessages(prev => GiftedChat.append(prev, [msg]));
    return msg
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { backgroundColor: '#f9f9f9', flex: 1 },
})