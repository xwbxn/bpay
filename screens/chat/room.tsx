import 'dayjs/locale/zh';

import * as Clipboard from 'expo-clipboard';
import * as crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import * as vt from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import * as ScreenOrientation from 'expo-screen-orientation';
import _ from 'lodash'

import { Direction, EventType, IContent, JoinRule, MatrixEvent, MsgType, RoomEvent } from 'matrix-js-sdk';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GiftedChat, IMessage, Send, SendProps, User } from 'react-native-gifted-chat';
import Toast from 'react-native-root-toast';

import { MaterialIcons } from '@expo/vector-icons';
import { Avatar, Badge, BottomSheet, Button, Dialog, Divider, Icon, ListItem, Overlay, Text, useTheme } from '@rneui/themed';

import { useGlobalState } from '../../store/globalContext';
import { hiddenTagName, useMatrixClient } from '../../store/useMatrixClient';
import { MessageImage } from './messageRenders/MessageImage';
import { MessageVideo } from './messageRenders/MessageVideo';
import { CameraType } from 'expo-image-picker';
import VideoPlayer from 'expo-video-player';
import { ResizeMode } from 'expo-av';
import { setStatusBarHidden } from 'expo-status-bar';

export function Room({ route, navigation }) {

  const { theme } = useTheme()
  const { id } = route.params
  const { client } = useMatrixClient()
  const [room, setRoom] = useState(client.getRoom(id))
  const [user, setUser] = useState(client.getUser(client.getUserId()))
  const [topic, setTopic] = useState('')
  const [showTopic, setShowTopic] = useState(false)
  const isDirectRoom = client.isDirectRoom(id)
  const [bottomSheetShow, setBottomSheetShow] = useState(false)
  const [actionSheetShow, setActionSheetShow] = useState(false)
  const screenSize = useWindowDimensions()

  const [messages, setMessages] = useState<IChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState<IChatMessage>()
  const [readupTo, setReadUpTo] = useState('')
  const [refreshKey, setRefreshKey] = useState(crypto.randomUUID())
  const [playerState, setPlayerState] = useState({ visible: false, source: '', inFullscreen: false })
  const [disabled, setDisabled] = useState(false)
  const [inviteBadge, setInviteBadge] = useState(0)

  const { setLoading } = useGlobalState()


  useEffect(() => {
    client.getStateEvent(id, EventType.RoomMember, client.getUserId()).then(evt => {
      setRoom(client.getRoom(id))
    })
  }, [])

  // 导航条样式
  useEffect(() => {
    // set nav bar
    navigation.setOptions({
      title: room?.name,
      headerRight: () => {
        return !disabled && <View><Icon name='options' size={30} type='simple-line-icon' color={theme.colors.background}
          onPress={() => { navigation.push('RoomSetting', { id: room?.roomId }) }}></Icon>
          {inviteBadge > 0 && <Badge containerStyle={{ position: 'absolute', left: 20, top: -4 }}
            badgeStyle={{ backgroundColor: theme.colors.error }} value={inviteBadge}></Badge>}</View>
      },
    })
  }, [room?.name, disabled, inviteBadge])

  interface IChatMessage extends IMessage {
    w?: number,
    h?: number,
    origin_uri?: string
    filename?: string,
    event?: MatrixEvent
  }

  // event转换为msg格式
  const evtToMsg = (evt: MatrixEvent) => {
    const sender = room.getMember(evt.getSender())
    const powerLevel = sender?.powerLevel || 0
    let msg: IChatMessage = {
      _id: evt.getId(),
      text: '',
      createdAt: evt.localTimestamp,
      user: {
        _id: evt.getSender(),
        name: sender?.name || evt.getSender(),
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
      sent: evt.status === null,
      pending: evt.status !== null,
      event: evt
    }
    switch (evt.event.type) {
      case EventType.RoomMessageEncrypted:
        msg.text = `[加密消息]`
        break
      case EventType.RoomCreate:
        if (!isDirectRoom) {
          msg.text = `${msg.user.name} 创建了群聊`
          msg.system = true
        } else {
          msg._id = null
        }
        break
      case EventType.RoomMember:
        if (!isDirectRoom) {
          msg.system = true
          if (evt.getContent().membership === 'join') {
            msg.text = `${evt.getContent().displayname} 加入了群聊`
          } else if (evt.getContent().membership === 'leave') {
            msg.text = `${evt.getContent().displayname} 离开了群聊`
          } else {
            msg._id = null
          }
        } else {
          msg._id = null
        }
        break
      case EventType.RoomMessage:
        if (evt.getContent().msgtype == MsgType.Text) {
          msg.text = evt.getContent().body
        }
        if (evt.getContent().msgtype == MsgType.Image) {
          const content = evt.getContent()
          msg.image = content.info?.thumbnail_url || content.url
          if (msg.image.startsWith("mxc://")) {
            msg.image = client.mxcUrlToHttp(msg.image)
          }
          msg.w = content.info?.thumbnail_info?.w || content.w
          msg.h = content.info?.thumbnail_info?.h || content.h
        }
        if (evt.getContent().msgtype === MsgType.Video) {
          msg.video = evt.getContent().info?.thumbnail_url
          if (msg.video.startsWith("mxc://")) {
            msg.video = client.mxcUrlToHttp(msg.video)
          }
          msg.w = evt.getContent().info?.thumbnail_info?.w || 150
          msg.h = evt.getContent().info?.thumbnail_info?.h || 100
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
        break
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
      const tip = `${room.getMember(memberEvt.getSender()).name} 邀请您加入 [${room.name}]`
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

    setInviteBadge(room.getMembers().filter(m => m.membership === JoinRule.Knock).length)
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
    const message: IMessage = messages[0]
    message.pending = true
    setMessages(prev => GiftedChat.append(prev, [message]))
    client.sendTextMessage(room.roomId, message.text)
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
          // 本地预览消息
          const txnId = previewMessage(a);
          // 上传文件
          const uname = crypto.randomUUID()
          const upload = await client.uploadFile({
            uri: a.uri,
            mimeType: a.mimeType,
            name: uname
          })

          // 图片
          if (a.type === 'image') {
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
            client.sendMessage(room.roomId, content, txnId)
          }
          // 视频
          if (a.type === 'video') {
            const ratio = Math.max(a.height, a.width) / 150
            const thumbnail = await vt.getThumbnailAsync(a.uri)
            const uploadedThumb = await client.uploadFile({
              uri: thumbnail.uri,
              name: uname,
              mimeType: a.mimeType
            })
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
            client.sendMessage(room.roomId, content, txnId)
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
          const txnId = previewMessage(a)
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
          client.sendMessage(room.roomId, content, txnId)
        })
      }
    })()
  }, [client, room])

  // 查看历史消息
  const LoadEarlier = useCallback(() => {
    client.scrollback(room)
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
              color={disabled ? theme.colors.disabled : theme.colors.primary}></Icon>}
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
    if (evt && evt.getType() === EventType.RoomMessage && evt.getContent().msgtype === MsgType.Video) {
      const mediaId = new URL(evt.getContent().url).pathname.split('/').slice(-1)[0]
      const cacheFilename = FileSystem.cacheDirectory + mediaId
      FileSystem.getInfoAsync(cacheFilename).then(res => {
        if (res.exists) {
          setPlayerState({
            visible: true,
            source: cacheFilename,
            inFullscreen: false
          })
        } else {
          const callback = downloadProgress => {
            const progress = downloadProgress.totalBytesWritten * 100 / downloadProgress.totalBytesExpectedToWrite
            message.text = `下载中: ${progress.toFixed(0)}%`
            console.log(`下载中: ${JSON.stringify(downloadProgress)}`)
            setMessages([...messages])
          }
          const dl = FileSystem.createDownloadResumable(evt.getContent().url, cacheFilename, {}, callback)
          dl.downloadAsync().then(res => {
            message.text = ''
            setMessages([...messages])
            setPlayerState({
              visible: true,
              source: cacheFilename,
              inFullscreen: false
            })
          })
        }
      })
    }
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
    await downloadResumable.downloadAsync()
    Toast.show('下载完成', {
      duration: Toast.durations.LONG,
      position: Toast.positions.CENTER
    });
  }



  return (<>
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
    <Overlay isVisible={playerState.visible} overlayStyle={{ padding: 0 }} animationType='fade'>
      <VideoPlayer videoProps={{ source: { uri: playerState.source }, resizeMode: ResizeMode.CONTAIN, shouldPlay: true }}
        defaultControlsVisible={true}
        style={{ width: screenSize.width, height: playerState.inFullscreen ? screenSize.height - 40 : screenSize.height }}
        header={<Icon onPress={() => {
          setStatusBarHidden(false)
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT)
          setPlayerState({ visible: false, source: '', inFullscreen: false })
        }} name='arrow-back' color={theme.colors.background} type='ionicon' size={40} style={{ margin: 10 }}></Icon>}
        fullscreen={{
          inFullscreen: playerState.inFullscreen,
          async enterFullscreen() {
            setStatusBarHidden(true, 'fade')
            setPlayerState({ ...playerState, inFullscreen: true })
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT)
          },
          async exitFullscreen() {
            setStatusBarHidden(false)
            setPlayerState({ ...playerState, inFullscreen: false })
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT)
          },
        }}
      ></VideoPlayer>
    </Overlay>
  </>

  )

  function previewMessage(a: ImagePicker.ImagePickerAsset) {
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
      w: Math.floor(a.width / ratio)
    };
    if (a.type === 'image')
      msg.image = a.uri;
    if (a.type === 'video')
      msg.video = a.uri;
    setMessages(prev => GiftedChat.append(prev, [msg]));
    return txnId
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { backgroundColor: '#ffffff', flex: 1 },
})