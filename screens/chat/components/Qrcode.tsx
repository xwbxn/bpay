import { Overlay } from '@rneui/themed';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera/next';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Qrcode(opts) {
  const { isVisible, onBarcodeScanned, onClose, onBarcodeFromGalley } = opts
  const [facing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();

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

  return (
    <Overlay overlayStyle={{ padding: 0 }} isVisible={isVisible} fullScreen>
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={onBarcodeScanned}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.text}></Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.text}>关闭</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onBarcodeFromGalley}>
              <Text style={styles.text}>相册</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    </Overlay>
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
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    marginBottom: 64,
    marginHorizontal: 24,
    justifyContent: 'space-between'
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
