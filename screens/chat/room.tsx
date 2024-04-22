import 'dayjs/locale/zh';

import * as Clipboard from 'expo-clipboard';
import * as crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import * as vt from 'expo-video-thumbnails';
import { ImageResult, manipulateAsync } from 'expo-image-manipulator';
import _ from 'lodash';

import {
  Direction, EventStatus, EventType, IContent, IEvent, JoinRule, MatrixEvent, MatrixEventEvent,
  MsgType, RoomEvent
} from 'matrix-js-sdk';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GiftedChat, IMessage, Send, SendProps } from 'react-native-gifted-chat';
import * as mime from 'react-native-mime-types';
import Toast from 'react-native-root-toast';

import { MaterialIcons } from '@expo/vector-icons';
import {
  Avatar, Badge, BottomSheet, Button, Dialog, Divider, Header, Icon, ListItem, Overlay, Text, useTheme
} from '@rneui/themed';

import BpayHeader from '../../components/BpayHeader';
import { useGlobalState } from '../../store/globalContext';
import { hiddenTagName, useMatrixClient } from '../../store/useMatrixClient';
import { eventMessage } from './eventMessage';
import { MessageImage } from './messageRenders/MessageImage';
import { MessageVideo } from './messageRenders/MessageVideo';
import { renderCustomView } from './messageRenders/renderCustomView';
import { CameraType } from 'expo-image-picker';
import URI from 'urijs';
import { Image } from 'react-native';
import { DocumentPickerAsset } from 'expo-document-picker';
import Bubble from './messageRenders/Bubble';
import MessageText from './messageRenders/MessageText';
import MessageTools from './messageRenders/MessageTools';
import Message from './messageRenders/Message';
import { globalStyle } from '../../utils/styles';
import { IListItem, ListView } from './components/ListView';
import { normalizeUserId } from '../../utils';
import MessageRef from './messageRenders/MessageRef';
import { useFocusEffect } from '@react-navigation/native';


export function Room({ route, navigation }) {

  const { theme } = useTheme()
  const { id: roomId, forward, search } = route.params
  const { client } = useMatrixClient()
  const [room, setRoom] = useState(client.getRoom(roomId))
  const [user] = useState(client.getUser(client.getUserId()))
  const [topic, setTopic] = useState('')
  const [showTopic, setShowTopic] = useState(false)
  const isDirectRoom = client.isDirectRoom(roomId)
  const [showSendPanel, setShowSendPanel] = useState(false)
  const size = useWindowDimensions()

  const [messages, setMessages] = useState<IChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState<IChatMessage>()
  const [readupTo, setReadUpTo] = useState('')
  const [refreshKey, setRefreshKey] = useState(crypto.randomUUID())
  const flatlist = useRef(null)

  const [disabled, setDisabled] = useState(false)
  const [knockBadge, setKnockBadge] = useState(0)
  const [inputText, setInputText] = useState('')
  const [mentionSheetState, setMentionSheetState] = useState({ visible: false, search: '', enableSelect: false, selectedValues: [] })

  const windowSize = useWindowDimensions()
  const [tooltipState, setTooltipState] = useState({ visible: false, left: 0, top: 0, options: [], position: 'left' })

  const [reply, setReply] = useState<MatrixEvent>()

  const { setLoading } = useGlobalState()


  useEffect(() => {
    if (!room) {
      client.getStateEvent(roomId, EventType.RoomMember, client.getUserId()).then(evt => {
        setRoom(client.getRoom(roomId))
      })
    }
  }, [])

  interface IChatMessage extends IMessage {
    _id: string,
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
      highlight: event.getContent()['m.mentions']?.user_ids?.includes(client.getUserId()),
      ...message
    }
    return msg
  }

  const refreshMessage = useCallback(_.debounce(() => {
    setRefreshKey(crypto.randomUUID())
  }, 150), [])

  // 处理回声信息，将回声中的content替换回本地
  const onLocalEchoUpdated = async (event: MatrixEvent, room, oldEventId?: string, oldStatus?: EventStatus) => {
    const existsLocal = await client.getEvent(oldEventId)
    if (existsLocal) {
      event.event.content = existsLocal.event.content
      refreshMessage()
    }
  }

  // 初始化
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

    // 进入房间后，取消隐藏
    if (room?.tags[hiddenTagName]) {
      client.deleteRoomTag(room.roomId, hiddenTagName)
    }

    // 处理邀请场景
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
    room.on(RoomEvent.TimelineRefresh, refreshMessage)
    room.on(RoomEvent.LocalEchoUpdated, onLocalEchoUpdated)
    return () => {
      room.off(RoomEvent.Timeline, refreshMessage)
      room.off(RoomEvent.TimelineRefresh, refreshMessage)
      room.off(RoomEvent.LocalEchoUpdated, onLocalEchoUpdated)
    }
  }, [room])

  // 加载历史消息，直到搜索位置已加载
  useEffect(() => {
    (async () => {
      if (search && room) {
        while (!room.findEventById(search.initEventId)) {
          const total = await client.scrollbackLocal(room)
          if (total === 0) {
            break
          }
        }
      }
    })()
  }, [search, room])

  // 进入页面刷新信息
  useFocusEffect(useCallback(() => {
    refreshMessage()
  }, []))

  // timeline event 转为 消息
  useEffect(() => {
    if (!room) {
      return
    }

    if (room.getMember(client.getUserId())?.powerLevel > 0) {
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
      if (lastMsg &&
        lastMsg.event?.status === null &&
        lastMsg.event?.getId().startsWith('$') &&
        lastMsg.event?.getId() !== readupTo) {
        client.sendReadReceipt(lastMsg.event)
        setReadUpTo(lastMsg.event.getId())
      }
    }
  }, [refreshKey])

  // 处理分享消息
  useEffect(() => {
    (async () => {
      if (forward) {
        const { uri, mimetype, message } = forward
        if (mimetype.startsWith('video/')) {
          await sendVideo(uri)
        } else if (mimetype.startsWith('image/')) {
          await sendImage(uri)
        } else if (mimetype.startsWith('application/')) {
          await sendFile(uri)
        }
        if (message) {
          await sendText([message])
        }
      }
    })()
  }, [forward])

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
            await sendImage(a.uri)
          }
          if (a.type === 'video') {
            await sendVideo(a.uri);
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
          sendImage(a.uri)
        })
      }
    })()
  }, [client, room])

  // 文档
  const sendDocument = useCallback(async () => {
    const picker = await DocumentPicker.getDocumentAsync()
    if (!picker.canceled) {
      picker.assets.forEach(async a => {
        await sendFile(a)
      })
    }
  }, [client, room])

  // 查看历史消息
  const LoadEarlier = useCallback(() => {
    if (room) {
      client.scrollbackLocal(room)
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
              type='feather' size={30} onPress={() => { setShowSendPanel((prev) => !prev) }}
              color={disabled ? theme.colors.disabled : theme.colors.black}></Icon>}
            {props.text !== "" && <MaterialIcons size={30} color={disabled ? theme.colors.disabled : theme.colors.primary} name={'send'} />}
          </View>
        </Send>
      </>
    )
  }, [disabled])

  // 触摸消息
  const onMessagePress = (context, message) => {
    const evt: MatrixEvent = message.event
    if (!evt || evt.getType() !== EventType.RoomMessage) {
      return
    }
    if (evt.getContent().msgtype === MsgType.File) {
      const url = evt.getContent().url.startsWith("mxc:/") ? client.mxcUrlToHttp(evt.getContent().url) : evt.getContent().url
      Linking.openURL(url)
      Sharing.shareAsync(url, {
        dialogTitle: '选择应用',
        mimeType: evt.getContent().info.mimetype
      })
    }
  }

  // 撤回
  const onRedAction = (currentMessage) => {
    client.redactEvent(room?.roomId, currentMessage._id as string)
  }

  // 复制消息
  const onCopy = async (currentMessage) => {
    await Clipboard.setStringAsync(currentMessage.text);
    Toast.show('已复制到剪贴板', {
      duration: Toast.durations.LONG,
      position: Toast.positions.CENTER
    });
  }

  // 加入收藏
  const onFavorite = (currentMessage) => {
    const favor = client.getAccountData('m.favor')?.getContent()?.favor || []
    favor.push(currentMessage._id)
    client.setAccountData('m.favor', { favor }).then(() => {
      Toast.show('已加入收藏', {
        duration: Toast.durations.LONG,
        position: Toast.positions.CENTER
      });
    })
  }

  // 转发
  const onForward = (currentMesssage) => {
    navigation.push('ForwardMessage', { target: currentMesssage._id, roomId: room.roomId })
  }

  // 引用
  const onReply = (currentMessage) => {
    setReply(currentMessage.event)
  }

  // 长按工具条
  const onMessageLongPress = (event, message) => {
    const offsetX = windowSize.width / 2
    const offsetY = windowSize.height / 2
    const overlayPadding = 10
    const left = 0 - offsetX + overlayPadding
    const top = event.nativeEvent.pageY - event.nativeEvent.locationY - offsetY - 80

    const content: IContent = message.event.getContent()
    const options = [
      { code: 'forward', name: '转发', icon: 'share', type: 'font-awesome-5' },
      { code: 'refer', name: '引用', icon: 'comment-quotes', type: 'foundation' },
      { code: 'favorite', name: '收藏', icon: 'favorite' },
      { code: 'redact', name: '撤回', icon: 'delete' },
      { code: 'code', name: '代码', icon: 'code' }]
    if (content?.msgtype === MsgType.Text) {
      options.unshift({ code: 'copy', name: '复制', icon: 'copy', type: 'font-awesome-5' })
    }
    setCurrentMessage(message)
    setTooltipState({
      visible: true,
      options,
      left,
      top,
      position: message.event.getSender() === client.getUserId() ? 'right' : 'left'
    })
  }

  // 长按操作
  const onContextPress = async (code) => {
    if (!currentMessage) {
      return
    }
    switch (code) {
      case 'copy':
        onCopy(currentMessage)
        break;
      case 'forward':
        onForward(currentMessage)
        break
      case 'favorite':
        onFavorite(currentMessage)
        break
      case 'redact':
        onRedAction(currentMessage)
        break
      case 'refer':
        onReply(currentMessage)
        break;
      case 'code':
        Alert.alert('代码', JSON.stringify(currentMessage.event.getContent()))
        client.getEvent(currentMessage.event.getId()).then(r => {
          console.debug('--------event.local--------', currentMessage.event.getId(), r)
        })
        console.debug('--------event--------', currentMessage.event.getId(), currentMessage.event)
        break;
      default:
        break;
    }
  }

  // @提醒列表
  const onInputTextChanged = (text) => {
    setShowSendPanel(false)
    setInputText(text)
    if (text.endsWith('@')) {
      setMentionSheetState({ search: '', selectedValues: [], enableSelect: false, visible: true })
    }
  }

  // @提醒
  const onMention = (member) => {
    setInputText(text => text + member.title + ' ')
    setMentionSheetState({ search: '', selectedValues: [], enableSelect: false, visible: false })
  }

  // @提醒列表多选
  const onMutilMention = () => {
    const mentionsText = mentionSheetState.selectedValues.map(i => room.getMember(i).name).join(' @')
    setInputText(text => text + mentionsText + ' ')
    setMentionSheetState({ search: '', selectedValues: [], enableSelect: false, visible: false })
  }

  // 长按头像 @ 提醒
  const onLongPressAvatar = (user) => {
    setInputText(text => text + '@' + user.name + ' ')
  }

  const headerRight = !disabled && <View><Icon name='options' size={30} type='simple-line-icon' color={theme.colors.background}
    onPress={() => { navigation.push('RoomSetting', { id: room?.roomId }) }}></Icon>
    {knockBadge > 0 && <Badge containerStyle={{ position: 'absolute', left: 20, top: -4 }}
      badgeStyle={{ backgroundColor: theme.colors.error }} value={knockBadge}></Badge>}</View>

  // 渲染长按工具条
  const messageTools = useMemo(() => <Overlay isVisible={tooltipState.visible}
    overlayStyle={{
      backgroundColor: 'transparent', shadowColor: 'rgba(0, 0, 0, 0)',
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 0,
    }}
    backdropStyle={{ backgroundColor: 'transparent' }}
    onBackdropPress={() => setTooltipState({ ...tooltipState, visible: false })}>
    <View style={{ position: 'absolute', zIndex: 1, top: tooltipState.top, left: tooltipState.left }}>
      <MessageTools options={tooltipState.options} width={windowSize.width} position={tooltipState.position}
        onContextPress={onContextPress}
        onClose={() => setTooltipState({ ...tooltipState, visible: false })}></MessageTools>
    </View>
  </Overlay>, [tooltipState])

  // 渲染视频、文件等消息按钮
  const sendPanel = <View>
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
  </View>;

  // 引用预览
  const replyBox = useCallback(() => {
    if (reply) {
      return <View style={{
        paddingHorizontal: 10, paddingBottom: 10,
        backgroundColor: '#e0e0e0',
      }}><View style={{
        backgroundColor: '#f0f0f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 6, borderRadius: 10, marginRight: 40
      }}>
          <MessageRef eventId={reply.getId()} width={size.width - 150}></MessageRef>
          <Icon name='close' size={16} onPress={() => setReply(null)}></Icon>
        </View>
      </View>
    }
  }, [reply])

  // 提醒选择框
  const mentionSheet = useCallback(() => {
    const members: IListItem[] = room?.getMembers().filter(i => i.userId !== client.getUserId())
      .map(i => ({
        id: i.userId,
        title: i.name,
        subtitle: normalizeUserId(i.userId),
        avatar: i.getAvatarUrl(client.baseUrl, 30, 30, 'scale', true, true)
      }))

    return <BottomSheet isVisible={mentionSheetState.visible} onBackdropPress={() => setMentionSheetState({ ...mentionSheetState, visible: false })} >
      <Header
        leftComponent={<Button onPress={() => setMentionSheetState({ ...mentionSheetState, visible: false })} size="sm" type='clear' title={'返回'} titleStyle={{ color: theme.colors.background }}></Button>}
        rightComponent={mentionSheetState.enableSelect ?
          <Button onPress={onMutilMention} size="sm" type='clear' title={'确定'} titleStyle={{ color: theme.colors.background }}></Button> :
          <Button onPress={() => setMentionSheetState({ ...mentionSheetState, enableSelect: true })} size="sm" type='clear' title={'多选'} titleStyle={{ color: theme.colors.background }}></Button>}
        centerComponent={<Text style={{ color: '#fff', fontSize: globalStyle.titleFontStyle.fontSize }}>选择提醒的人</Text>}
        centerContainerStyle={{ marginTop: 4 }}
        containerStyle={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}></Header>
      <ListView items={members} size={30} multiSelect {...mentionSheetState} onPressItem={(item) => !mentionSheetState.enableSelect && onMention(item)}></ListView>
    </BottomSheet>;
  }, [room, mentionSheetState])

  const onMessageLayout = useCallback((e, m) => {
    if (m._id === search?.initEventId) {
      const index = messages.indexOf(m)
      if (index > -1) {
        flatlist.current.scrollToIndex({
          index,
          viewPosition: 0.5,
          animated: false
        })
      }
    }
  }, [search, flatlist.current, messages])

  return (<>
    <BpayHeader showback title={room?.name} rightComponent={headerRight} onBack={() => navigation.replace('Sessions')}></BpayHeader>
    <View style={styles.container}>
      {messageTools}
      <Dialog
        isVisible={showTopic}
        onBackdropPress={() => setShowTopic(false)}>
        <Dialog.Title title="群公告" />
        <Text>{topic}</Text>
      </Dialog>
      {topic !== '' && <Text style={{ padding: 8 }} numberOfLines={1} lineBreakMode='clip' onPress={() => setShowTopic(true)}>群公告: {topic}</Text>}
      <View style={styles.content}>
        <GiftedChat
          messageContainerRef={flatlist}
          //@ts-ignore
          locale='zh'
          onPress={onMessagePress}
          onLongPress={onMessageLongPress}
          onLongPressAvatar={onLongPressAvatar}
          // @ts-ignore
          onMessageLayout={onMessageLayout}
          messages={messages}
          onInputTextChanged={onInputTextChanged}
          scrollToBottom
          showAvatarForEveryMessage
          renderUsernameOnMessage
          onLoadEarlier={LoadEarlier}
          keyboardShouldPersistTaps='never'
          onSend={messages => sendText(messages)}
          placeholder='说点什么吧...'
          text={inputText}
          infiniteScroll
          showUserAvatar
          messagesContainerStyle={{ paddingBottom: 10 }}
          parsePatterns={!!search ? () => [{ pattern: new RegExp(search.keyword), style: { color: theme.colors.primary, fontWeight: 'bold' } }] : undefined}
          // @ts-ignore
          primaryStyle={{ paddingTop: 6, paddingBottom: 6, backgroundColor: '#e0e0e0' }}
          textInputStyle={{ backgroundColor: '#ffffff', borderRadius: 10, paddingLeft: 10, lineHeight: 24 }}
          loadEarlier
          user={{
            _id: user?.userId,
            name: user?.displayName,
            avatar: user?.avatarUrl
          }}
          onPressAvatar={(user) => navigation.push('Member', { userId: user._id })}
          scrollToBottomComponent={() => <Icon name='keyboard-double-arrow-down' color={theme.colors.background}></Icon>}
          scrollToBottomStyle={{ backgroundColor: theme.colors.primary }}
          renderMessage={(props) => <Message {...props}></Message>}
          renderMessageImage={MessageImage}
          renderMessageVideo={MessageVideo}
          renderMessageText={MessageText}
          // @ts-ignore
          renderBubble={(props) => <Bubble {...props}></Bubble>}
          renderCustomView={renderCustomView}
          renderSend={renderSend}
        />
        {mentionSheet()}
        {showSendPanel && sendPanel}
        {!!reply && replyBox()}
      </View>
    </View >
  </>

  )

  // 文本消息
  async function sendText(messages = []) {
    const txnId = client.makeTxnId()
    setShowSendPanel(false)
    const message: IChatMessage = messages[0]
    message.pending = true
    setMessages(prev => GiftedChat.append(prev, [message]))
    const mentions = message.text.match(/@\w+/g)
    const user_ids = mentions && mentions.map(i => room?.getMembers().find(m => m.name === i.slice(1))?.userId)
    const content: IContent = {
      msgtype: MsgType.Text,
      body: message.text
    }
    if (user_ids?.length > 0) {
      content['m.mentions'] = {
        user_ids: user_ids || []
      }
    }
    if (reply) {
      content['m.relates_to'] = {
        'm.in_reply_to': {
          event_id: reply.getId()
        }
      }
      if (content['m.mentions']) {
        content['m.mentions'].user_ids.push(reply.getSender())
      } else {
        content['m.mentions'] = {
          user_ids: [reply.getSender()]
        }
      }
    }
    setReply(null)
    client.sendMessage(room?.roomId, content, txnId)
  }

  // 视频消息
  async function sendVideo(uri: string) {
    const parsedUri = new URI(uri)
    const fileinfo = await FileSystem.getInfoAsync(uri, { size: true })
    const thumbnail = await vt.getThumbnailAsync(uri);
    let resizedThumbnail: ImageResult = null
    if (thumbnail.width > 600) {
      resizedThumbnail = await manipulateAsync(uri, [{ resize: { width: 600 } }])
    }

    const txnId = client.makeTxnId()
    const localEventId = "~" + room.roomId + ":" + txnId
    const localContent: IContent = {
      msgtype: MsgType.Video,
      body: parsedUri.filename(),
      url: uri,
      info: {
        h: thumbnail.height,
        w: thumbnail.width,
        mimetype: mime.lookup(uri),
        //@ts-ignore
        size: fileinfo.size,
        thumbnail_url: resizedThumbnail?.uri || thumbnail.uri,
        thumbnail_info: {
          w: resizedThumbnail?.width || thumbnail.width,
          h: resizedThumbnail?.height || thumbnail.height,
          minetype: mime.lookup(resizedThumbnail?.uri || thumbnail.uri),
        }
      },
    }
    const eventObject: Partial<IEvent> = {
      type: EventType.RoomMessage,
      content: localContent
    }
    const localEvent = new MatrixEvent(Object.assign(eventObject, {
      event_id: localEventId,
      user_id: client.credentials.userId,
      sender: client.credentials.userId,
      room_id: room.roomId,
      origin_server_ts: new Date().getTime(),
    }))
    localEvent.setStatus(EventStatus.SENDING)
    localEvent.setTxnId(txnId)
    localEvent.once(MatrixEventEvent.Replaced, async (event) => {
      client.removeLocalEvent(room, localEvent)
      await client.sendMessage(room?.roomId, event.getContent(), txnId)
    })
    client.addLocalEvent(room, localEvent)
    setRefreshKey(crypto.randomUUID())
  }

  // 图片消息
  async function sendImage(uri: string) {
    Image.getSize(uri, async (width, height) => {
      const txnId = client.makeTxnId()
      const localEventId = "~" + roomId + ":" + txnId

      const parsedUri = new URI(uri);
      const fileinfo = await FileSystem.getInfoAsync(uri, { size: true });
      let thumbnail: ImageResult = null;
      if (width > 600) {
        thumbnail = await manipulateAsync(uri, [{ resize: { width: 600 } }])
      }
      const content: IContent = {
        msgtype: MsgType.Image,
        body: parsedUri.filename(),
        url: uri,
        info: {
          h: height,
          w: width,
          mimetype: mime.lookup(uri),
          //@ts-ignore
          size: fileinfo.size,
          thumbnail_url: thumbnail?.uri,
          thumbnail_info: {
            w: thumbnail?.width,
            h: thumbnail?.height,
            minetype: mime.lookup(thumbnail?.uri),
          }
        },
      };
      const eventObject: Partial<IEvent> = {
        type: EventType.RoomMessage,
        content
      }
      const localEvent = new MatrixEvent(Object.assign(eventObject, {
        event_id: localEventId,
        user_id: client.credentials.userId,
        sender: client.credentials.userId,
        room_id: room.roomId,
        origin_server_ts: new Date().getTime(),
      }))
      localEvent.setStatus(EventStatus.SENDING)
      localEvent.setTxnId(txnId)
      localEvent.once(MatrixEventEvent.Replaced, async (event) => {
        client.removeLocalEvent(room, localEvent)
        await client.sendMessage(room?.roomId, event.getContent(), txnId)
      })
      client.addLocalEvent(room, localEvent)
      setRefreshKey(crypto.randomUUID())
    })
  }

  // 文件消息
  async function sendFile(file: DocumentPickerAsset) {
    const txnId = client.makeTxnId()
    const localEventId = "~" + room.roomId + ":" + txnId
    const localContent: IContent = {
      msgtype: MsgType.File,
      body: file.name,
      url: file.uri,
      info: {
        mimetype: file.mimeType,
        //@ts-ignore
        size: file.size,
      },
    }
    const eventObject: Partial<IEvent> = {
      type: EventType.RoomMessage,
      content: localContent
    }
    const localEvent = new MatrixEvent(Object.assign(eventObject, {
      event_id: localEventId,
      user_id: client.credentials.userId,
      sender: client.credentials.userId,
      room_id: room.roomId,
      origin_server_ts: new Date().getTime(),
    }))
    localEvent.setStatus(EventStatus.SENDING)
    localEvent.setTxnId(txnId)
    localEvent.once(MatrixEventEvent.Replaced, async (event) => {
      client.removeLocalEvent(room, localEvent)
      await client.sendMessage(room?.roomId, event.getContent(), txnId)
    })
    client.addLocalEvent(room, localEvent)
    setRefreshKey(crypto.randomUUID())
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { backgroundColor: '#f9f9f9', flex: 1 },
})
