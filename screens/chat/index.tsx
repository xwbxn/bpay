import React, { useCallback, useEffect, useState } from 'react';
import { GiftedChat, IMessage, Send, SendProps } from 'react-native-gifted-chat';
import { Icon } from '@rneui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@rneui/themed';
import { Alert, View, StyleSheet } from 'react-native';
import { NavBar } from './components/navbar';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Chat() {
  const [messages, setMessages] = useState([])
  const { theme } = useTheme()

  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: 'Hello, 大家好',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'D.T 亚军',
          avatar: 'http://47.98.235.243:4880/wp-content/uploads/avatars/7/1705296704-bpthumb.jpg',
        },
      },
      {
        _id: 2,
        createdAt: new Date(Date.UTC(2016, 5, 11, 17, 20, 0)),
        user: {
          _id: 3,
          name: 'dtkai',
          avatar: 'http://47.98.235.243:4880/wp-content/uploads/avatars/9/1705653207-bpthumb.png',
        },
        image: 'http://47.98.235.243:4880/wp-content/uploads/2024/02/39e65c416950e7d1a52c839b9bf39dd8.png',
        // You can also add a video prop:
        // video: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        // Mark the message as sent, using one tick
        sent: true,
        // Mark the message as received, using two tick
        received: true,
        // Mark the message as pending with a clock loader
        pending: true,
        // Any additional custom parameters are passed through
      },
      {
        _id: 3,
        text: '您已加入聊天',
        createdAt: new Date(Date.UTC(2016, 5, 11, 17, 20, 0)),
        system: true,
        // Any additional custom parameters are passed through
      }
    ])
  }, [])

  const onSend = useCallback((messages = []) => {
    messages.unshift({
      _id: Math.round(Math.random() * 1000000),
      text: 'ok, 我收到了',
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'D.T 亚军',
        avatar: 'http://47.98.235.243:4880/wp-content/uploads/avatars/7/1705296704-bpthumb.jpg',
      },
    })
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages),
    )
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
      <NavBar></NavBar>
      <View style={styles.content}>
        <GiftedChat
          messages={messages}
          scrollToBottom
          keyboardShouldPersistTaps='never'
          onSend={onSend}
          user={{
            _id: 1,
            name: "dtlinghai",
            avatar: "http://47.98.235.243:4880/wp-content/uploads/2024/01/FZ-vGOnX0AAHnxE-scaled.jpg"
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