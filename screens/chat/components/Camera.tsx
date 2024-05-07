import { ResizeMode } from 'expo-av';
import { Camera, CameraType } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import VideoPlayer from 'expo-video-player';
import { useRef, useState } from 'react';
import { Animated, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Icon, Overlay } from '@rneui/themed';

const opacity = new Animated.Value(0);
const startBlinking = () => {
    Animated.sequence([
        Animated.timing(opacity, {
            toValue: 1,
            duration: 500, // 变亮的时间
            useNativeDriver: true,
        }),
        Animated.timing(opacity, {
            toValue: 0,
            duration: 500, // 变暗的时间
            useNativeDriver: true,
        }),
    ]).start(startBlinking); // 动画结束后重新开始，形成循环
};
startBlinking(); // 开始闪烁动画

export default function CameraPicker(opts) {
    const { isVisible, onOk, onClose } = opts
    const [facing] = useState<CameraType>(CameraType.back);
    const [permission, requestPermission] = Camera.useCameraPermissions();
    const [micStatus, requestMicroPhonePermission] = Camera.useMicrophonePermissions();

    const cameraRef = useRef<Camera>()

    const [media, setMedia] = useState<{ uri: string, type: 'video' | 'picture' }>(null)
    const [isRecording, setIsRecording] = useState(false)

    if (!permission) {
        // Camera permissions are still loading
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet
        return (
            <Overlay isVisible={isVisible} fullScreen>
                <View style={styles.container}>
                    <Text style={{ textAlign: 'center' }}>我们需要申请您的摄像头权限</Text>
                    <Button onPress={requestPermission} title="设置" />
                </View>
            </Overlay>
        );
    }

    const onCapture = async () => {
        const pic = await cameraRef.current.takePictureAsync()
        setMedia({ uri: pic.uri, type: 'picture' })
    }

    const onRecordVideo = async () => {
        if (!micStatus.granted) {
            requestMicroPhonePermission()
            return
        }
        setIsRecording(true)
        const video = await cameraRef.current.recordAsync({
            maxDuration: 15
        })
        setMedia({ uri: video.uri, type: 'video' })
    }

    const onStop = async () => {
        setIsRecording(false)
        await cameraRef.current.stopRecording()
    }

    const onCancel = async () => {
        await FileSystem.deleteAsync(media.uri)
        setMedia(null)
    }

    const onConfirm = async () => {
        onOk(media)
        setMedia(null)
    }

    return (
        <Overlay overlayStyle={{ padding: 0 }} onRequestClose={onClose} isVisible={isVisible} fullScreen>
            <View style={styles.container}>
                {isRecording && <Animated.View
                    style={[
                        styles.blinkingDot,
                        {
                            opacity: opacity, // 应用动画效果
                        },
                    ]}
                ></Animated.View>}
                {!media ?
                    <Camera ref={cameraRef} style={styles.camera} type={facing} /> :
                    (media.uri.endsWith('.mp4') ?
                        <View style={{ flex: 1 }}>
                            <VideoPlayer videoProps={{ source: { uri: media.uri }, resizeMode: ResizeMode.COVER, shouldPlay: false }}
                                defaultControlsVisible={true} />
                        </View> :
                        <Image source={media.uri} style={{ flex: 1 }} resizeMode='cover' />
                    )}
                <View style={[styles.buttonContainer, (media) && { justifyContent: 'space-between' }]}>
                    {!media && <TouchableOpacity style={styles.button}
                        onPress={onCapture} onLongPress={onRecordVideo} onPressOut={onStop}>
                        <View style={{ height: 60, width: 60, borderWidth: 5, borderColor: '#fff', borderRadius: 50, backgroundColor: 'red' }} />
                        <Text style={{ color: 'yellow', marginTop: 20 }}>轻触拍照 长按摄像</Text>
                    </TouchableOpacity>}
                    {media && <TouchableOpacity style={styles.button} onPress={onCancel}>
                        <Icon name='x' type='feather' size={50} color='red'></Icon>
                    </TouchableOpacity>}
                    {media && <TouchableOpacity style={styles.button} onPress={onConfirm}>
                        <Icon name='check' type='feather' size={50} color='green'></Icon>
                    </TouchableOpacity>}
                </View>
            </View>
        </Overlay >
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',

    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        backgroundColor: 'black',
        paddingTop: 40,
        paddingBottom: 44,
        paddingHorizontal: 24,
        justifyContent: 'center'
    },
    button: {
        alignItems: 'center',
    },
    blinkingDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'red', // 红色圆点
        position: 'absolute', // 根据需要调整位置
        zIndex: 9999,
        top: 15, // 示例位置
        left: 15, // 示例位置
    },
});
