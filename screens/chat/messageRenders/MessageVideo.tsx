import { Avatar, Icon } from '@rneui/themed';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import * as Progress from 'react-native-progress';


import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
// TODO: support web
import { StylePropType } from 'react-native-gifted-chat';
import { useNavigation } from '@react-navigation/native';
import { getHttpUriForMxc } from 'matrix-js-sdk';
import { useMatrixClient } from '../../../store/useMatrixClient';


export default function MessageVideoRender({ containerStyle, imageProps = {}, imageStyle, currentMessage, onLongPress }) {

  const downloader = useRef<FileSystem.DownloadResumable>(null)
  const [progress, setProgress] = useState<number>(null)
  const navigation: any = useNavigation()
  const { client } = useMatrixClient()

  const onPress = async () => {
    if (downloader.current !== null) {
      return
    }

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
      const status = await dl.downloadAsync()
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
          width: currentMessage.w, height: currentMessage.h, maxHeight: 150, maxWidth: 150
        }}>
          {progress
            ? <Progress.Circle size={50} progress={progress}></Progress.Circle>
            : <Avatar icon={{ name: 'play', type: 'octicon', color: '#a0a0a0', size: 50 }} size={50}></Avatar>}
        </View>
        <Image {...imageProps} style={[styles.image, imageStyle, {
          opacity: 0.8,
          width: currentMessage.w, height: currentMessage.h, maxHeight: 150, maxWidth: 150
        }]} source={{ uri: currentMessage.video }} />
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