import { Overlay } from '@rneui/themed';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera/next';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Qrcode(opts) {
  const { isVisible, onBarcodeScanned, onClose } = opts
  const [facing, setFacing] = useState<CameraType>('back');
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
          <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
          <Button onPress={requestPermission} title="grant permission" />
        </View>
      </Overlay>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <Overlay overlayStyle={{ padding: 0 }} isVisible={isVisible} fullScreen>
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }} onBarcodeScanned={onBarcodeScanned}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.text}>close</Text>
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
    margin: 64,
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
