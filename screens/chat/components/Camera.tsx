import { ResizeMode } from 'expo-av';
import {
    CameraType, CameraView, useCameraPermissions, useMicrophonePermissions
} from 'expo-camera/next';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import VideoPlayer from 'expo-video-player';
import { useRef, useState } from 'react';
import { Animated, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Icon, Overlay, Tab } from '@rneui/themed';

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

export default function Camera(opts) {
    const { isVisible, onRecord, onClose } = opts
    const [facing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [micStatus, requestMicroPhonePermission] = useMicrophonePermissions();

    const cameraRef = useRef<CameraView>()
    const [recordedVideo, setRecordedVideo] = useState<{ uri: string }>(null)
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

    const onStart = () => {
        if (!micStatus.granted) {
            requestMicroPhonePermission()
            return
        }
        setIsRecording(true)
        cameraRef.current.recordAsync().then(video => {
            setRecordedVideo(video)
            setIsRecording(false)
        })
    }

    const onStop = async () => {
        await cameraRef.current.stopRecording()
    }

    const onCancelVideo = async () => {
        await FileSystem.deleteAsync(recordedVideo.uri)
        setRecordedVideo(null)
    }

    const onConfirmVideo = async () => {
        onRecord(recordedVideo)
        setRecordedVideo(null)
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
                {!recordedVideo ?
                    <CameraView ref={cameraRef} style={styles.camera} facing={facing} mode='video' /> :
                    <View style={{ flex: 1 }}>
                        <VideoPlayer videoProps={{ source: { uri: recordedVideo?.uri }, resizeMode: ResizeMode.COVER, shouldPlay: false }}
                            defaultControlsVisible={true} />
                    </View>}
                <View style={[styles.buttonContainer, (recordedVideo) && { justifyContent: 'space-between' }]}>
                    {!recordedVideo && (!isRecording ? <TouchableOpacity style={styles.button}
                        onPress={onStart}>
                        <View style={{ height: 60, width: 60, borderWidth: 5, borderColor: '#fff', borderRadius: 50, backgroundColor: 'red' }} />
                    </TouchableOpacity> :
                        <TouchableOpacity style={styles.button}
                            onPress={onStop}>
                            <View style={{ height: 60, width: 60, borderWidth: 5, borderColor: '#fff', borderRadius: 50, backgroundColor: 'silver' }} />
                        </TouchableOpacity>)}
                    {recordedVideo && <TouchableOpacity style={styles.button} onPress={onCancelVideo}>
                        <Icon name='x' type='feather' size={50} color='red'></Icon>
                    </TouchableOpacity>}
                    {recordedVideo && <TouchableOpacity style={styles.button} onPress={onConfirmVideo}>
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
        paddingBottom: 64,
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
