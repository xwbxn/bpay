import { Icon, Overlay } from '@rneui/themed';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera/next';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';

import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Camera(opts) {
    const { isVisible, onRecord, onTakePicture, onClose } = opts
    const [facing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>()
    const [takedPicture, setTakedPicture] = useState<{ uri: string, height: number, width: number }>(null)


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

    const onPress = async () => {
        const pic = await cameraRef.current.takePictureAsync()
        setTakedPicture(pic)
    }

    const onCancel = async () => {
        await FileSystem.deleteAsync(takedPicture.uri)
        setTakedPicture(null)
    }

    return (
        <Overlay overlayStyle={{ padding: 0 }} isVisible={isVisible} fullScreen>
            <View style={styles.container}>
                {!takedPicture && <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
                </CameraView>}
                {takedPicture && <Image source={takedPicture.uri} style={{ flex: 1 }} resizeMode='cover' />}
                <View style={[styles.buttonContainer, takedPicture && { justifyContent: 'space-between' }]}>
                    {!takedPicture && <TouchableOpacity style={styles.button} onPress={onPress}>
                        <Icon containerStyle={{ borderWidth: 5, borderColor: '#fffF', borderRadius: 50 }}
                            name='record' type='fontisto' size={50} color='red'></Icon>
                    </TouchableOpacity>}
                    {takedPicture && <TouchableOpacity style={styles.button} onPress={onCancel}>
                        <Icon name='x' type='feather' size={50} color='red'></Icon>
                    </TouchableOpacity>}
                    {takedPicture && <TouchableOpacity style={styles.button} onPress={onPress}>
                        <Icon name='check' type='feather' size={50} color='green'></Icon>
                    </TouchableOpacity>}

                </View>
            </View>
        </Overlay >
    );
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
});
