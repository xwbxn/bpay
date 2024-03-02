import React, { useCallback, useEffect, useState } from 'react';
import { GiftedChat, IMessage, Send, SendProps } from 'react-native-gifted-chat';
import { Avatar, Icon } from '@rneui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@rneui/themed';
import { Alert, View, StyleSheet } from 'react-native';
import { NavBar } from './components/navbar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMatrixClient } from '../../store/chat';
import moment from 'moment';
import { MatrixEvent, RoomEvent } from 'matrix-js-sdk';

export function Room({ route }) {

  const { client, rooms, user } = useMatrixClient()
  const { roomId } = route.params
  const room = rooms.find(r => r.roomId === roomId)
  const [messages, setMessages] = useState([])
  const { theme } = useTheme()

  useEffect(() => {
    const historyMessages = []
    room.getLiveTimeline().getEvents().forEach(e => {
      console.log('eeeeeeeeeeeeeeeeee', e.event.event_id)
      historyMessages.push({
        _id: e.event.event_id,
        text: e.event.type !== "m.room.encrypted" ? e.event.content.body : '加密消息',
        createdAt: moment(e.localTimestamp),
        user: {
          _id: e.event.sender,
          name: e.event.sender,
          avatar: () => <Avatar size={40} rounded title={e.event.sender[1]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
        }
      })
    })
    setMessages(historyMessages)
  }, [])


  const recvMessage = function (event: MatrixEvent, room, toStartOfTimeline) {
    if (toStartOfTimeline) {
      return; // don't print paginated results
    }

    const newMessage = {
      _id: event.event.event_id,
      text: event.event.type !== "m.room.encrypted" ? event.event.content.body : '加密消息',
      createdAt: moment(event.event.origin_server_ts),
      user: {
        _id: event.event.sender,
        name: event.event.sender,
        avatar: () => <Avatar size={40} rounded title={event.event.sender[1]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
      }
    };

    console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', event.event.event_id)
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, [newMessage]),
    )
  };

  room.on(RoomEvent.Timeline, recvMessage);

  const onSend = useCallback((messages = []) => {
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages),
    )
    client.sendTextMessage(roomId, messages[0].text)
  }, [])

  const renderSend = useCallback((props: SendProps<IMessage>) => {
    return (
      <Send {...props} alwaysShowSend containerStyle={{ justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
          {props.text === "" && <Icon name='plus-circle' type='feather' size={30}></Icon>}
          {props.text !== "" && <MaterialIcons size={30} color={theme.colors.primary} name={'send'} />}
        </View>
      </Send>
    )
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <NavBar title={room.name || ''}></NavBar>
      <View style={styles.content}>
        <GiftedChat
          messages={messages}
          scrollToBottom
          keyboardShouldPersistTaps='never'
          onSend={messages => onSend(messages)}
          user={{
            _id: user.userId,
            name: user.displayName,
            avatar: () => <Avatar size={40} rounded title={user.displayName} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
          }}
          renderSend={renderSend}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { backgroundColor: '#ffffff', flex: 1 },
})