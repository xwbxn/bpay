import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
// TODO: support web
import { StylePropType } from 'react-native-gifted-chat';
import { VideoThumbnails } from './VideoThumbnails';

export const MessageVideo = ({ containerStyle, lightboxProps = {}, imageProps = {}, imageStyle, currentMessage, }) => {
  if (currentMessage == null) {
    return null;
  }

  return (<View style={[styles.container, containerStyle]}>
    <VideoThumbnails uri={currentMessage.video} imageProps imageStyle></VideoThumbnails>
  </View>);
}

MessageVideo.propTypes = {
  currentMessage: PropTypes.object,
  containerStyle: StylePropType,
  imageStyle: StylePropType,
  imageProps: PropTypes.object,
  lightboxProps: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {},
  image: {
    width: 150,
    height: 100,
    borderRadius: 13,
    margin: 3,
    resizeMode: 'cover',
  },
  imageActive: {
    flex: 1,
    resizeMode: 'contain',
  },
})