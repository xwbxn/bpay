import { Avatar } from '@rneui/themed';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import * as Progress from 'react-native-progress';


import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
// TODO: support web
import { StylePropType } from 'react-native-gifted-chat';
import { useNavigation } from '@react-navigation/native';
import { useMatrixClient } from '../../../store/useMatrixClient';


export default function MessageVideoRender({ containerStyle, imageProps = {}, imageStyle, currentMessage, onLongPress }) {

  const downloader = useRef<FileSystem.DownloadResumable>(null)
  const [progress, setProgress] = useState<number>(currentMessage.progress)
  const navigation: any = useNavigation()
  const { client } = useMatrixClient()
  let width = currentMessage.w
  let height = currentMessage.h
  if (width > 150 || height > 150) {
    const ratio = Math.max(width, height) / 150
    width = width / ratio
    height = height / ratio
  }

  console.log('currentMessage.progress', currentMessage.progress,progress || currentMessage.progress)

  const onPress = async () => {
    if (downloader.current !== null) {
      return
    }

    // 本地原始文件
    if (currentMessage.isLocal) {
      navigation.push('PlayVideo', { uri: currentMessage.localUri })
      return
    }

    // 保存为本地缓存
    let url = currentMessage.event.getContent().url
    if (url.startsWith("mxc:/")) {
      url = client.mxcUrlToHttp(url)
    }
    const mediaId = new URL(url).pathname.split('/').slice(-1)[0]
    const cacheFilename = `${FileSystem.cacheDirectory}${mediaId}.video`
    if ((await FileSystem.getInfoAsync(cacheFilename)).exists) {
      navigation.push('PlayVideo', { uri: cacheFilename })
    } else {
      const dl = FileSystem.createDownloadResumable(url, cacheFilename, { cache: false }, (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
        setProgress(progress)
      })

      downloader.current = dl
      await dl.downloadAsync()
      downloader.current = null
      setProgress(null)
      navigation.push('PlayVideo', { uri: cacheFilename })
    }

  }

  return (<View style={[styles.container, containerStyle]}>
    <TouchableOpacity
      onPress={onPress}
      onLongPress={() => onLongPress({}, currentMessage)}>
      <View>
        <View style={{
          position: 'absolute', zIndex: 1, alignItems: 'center', justifyContent: 'center',
          width, height
        }}>
          {progress || currentMessage.progress
            ? <Progress.Circle size={50} progress={progress || currentMessage.progress}></Progress.Circle>
            : <Avatar icon={{ name: 'play', type: 'octicon', color: '#a0a0a0', size: 50 }} size={50}></Avatar>}
        </View>
        <Image {...imageProps} style={[styles.image, imageStyle, { opacity: 0.8, width, height }]}
          placeholder='加载中'
          source={{ uri: currentMessage.isLocal ? currentMessage.localImg : currentMessage.video }} />
      </View>
    </TouchableOpacity >
  </View >);
}

export const MessageVideo = (opts) => {


  if (opts.currentMessage == null) {
    return null;
  }

  return <MessageVideoRender {...opts}></MessageVideoRender>
}

MessageVideo.propTypes = {
  currentMessage: PropTypes.object,
  containerStyle: StylePropType,
  imageStyle: StylePropType,
  imageProps: PropTypes.object,
  lightboxProps: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  image: {
    borderRadius: 13,
    margin: 3,
    resizeMode: 'cover',
  },
  imageActive: {
    flex: 1,
    resizeMode: 'contain',
  },
})