import React, { useState } from 'react'
import VideoPlayer from 'expo-video-player'
import { ResizeMode } from 'expo-av'
import { Icon, Overlay, useTheme } from '@rneui/themed'
import { setStatusBarHidden } from 'expo-status-bar'
import * as ScreenOrientation from 'expo-screen-orientation';
import { useWindowDimensions } from 'react-native'

export default function PlayVideo({ navigation, route }) {

  const { uri } = route.params
  console.log('uri', uri)
  const { theme } = useTheme()
  const [fullscreen, setFullscreen] = useState(false)
  const { width, height } = useWindowDimensions()
  if (!uri) {
    return null
  }

  return (
    <Overlay fullScreen isVisible={true} overlayStyle={{ padding: 0 }} onRequestClose={() => {
      navigation.goBack()
    }}>
      <VideoPlayer errorCallback={(err) => console.error(JSON.stringify(err))}
        videoProps={{ source: { uri: uri }, resizeMode: ResizeMode.CONTAIN, shouldPlay: true }}
        defaultControlsVisible={true}
        style={{ width, height }}
        header={<Icon onPress={() => {
          setStatusBarHidden(false)
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT)
          navigation.goBack()
        }} name='arrow-back' color={theme.colors.background} type='ionicon' size={40} style={{ margin: 10 }}></Icon>}
        fullscreen={{
          inFullscreen: fullscreen,
          async enterFullscreen() {
            setStatusBarHidden(true, 'fade')
            setFullscreen(true)
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT)
          },
          async exitFullscreen() {
            setStatusBarHidden(false)
            setFullscreen(false)
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT)
          },
        }}
      ></VideoPlayer>
    </Overlay>
  )
}