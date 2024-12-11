import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  CameraCapturedPicture,
  BarcodeScanningResult,
} from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";

export default function Home() {
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState(0);
  const [capturedPhotos, setCapPhotos] = useState<Array<{ uri: string }>>([]);
  const [isBarCode, setIsBarMode] = useState(true);
  const [barCodeResult, setBarCodeResult] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation(); // Initialize navigation hook

  useEffect(() => {
    loadSavedPhotos();
  }, []);

  const loadSavedPhotos = useCallback(async () => {
    try {
      const savedPhotos = await AsyncStorage.getItem("capturedPhotos");
      if (savedPhotos) {
        setCapPhotos(JSON.parse(savedPhotos));
      }
    } catch (error) {
      console.error("Error loading saved photos", error);
    }
  }, []);

  const savePhoto = useCallback(
    async (newPhoto: { uri: string }) => {
      try {
        // Add new photo to captured photos
        const updatedPhotos = [...capturedPhotos, newPhoto];
        setCapPhotos(updatedPhotos);

        // Save updated photos to AsyncStorage
        await AsyncStorage.setItem(
          "capturedPhotos",
          JSON.stringify(updatedPhotos)
        );

        // Navigate to the Gallery screen after saving the new photo
        navigation.navigate("Gallery");
      } catch (error) {
        console.error("Failed to save photo", error);
      }
    },
    [capturedPhotos, navigation]
  );

  const toggleCameraFacing = useCallback(() => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }, []);

  const handleZoom = useCallback((value: number) => {
    setZoom(value);
  }, []);

  const takePhoto = useCallback(async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        exif: false,
      });
      await savePhoto({ uri: photo.uri });
    }
  }, [savePhoto]);

  const toggleBarCodeMode = useCallback(() => {
    setIsBarMode((prev) => !prev);
  }, []);

  const handleBarCodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      setBarCodeResult(data);

      // Show an alert asking the user whether they want to open the URL based on the barcode data
      Alert.alert(
        "Barcode Detected",
        `Do you want to open the link for barcode: ${data}?`,
        [
          {
            text: "Cancel",
            onPress: () => setBarCodeResult(null),
            style: "cancel",
          },
          {
            text: "Open URL",
            onPress: () => openBarcodeURL(data),
          },
        ]
      );
    },
    []
  );
  //   const handleBarCodeScanned = useCallback(
  //     ({ data }: BarcodeScanningResult) => {
  //       setBarCodeResult(data);
  //       openBarcodeURL(data); // Open the dynamic URL based on the scanned barcode
  //     },
  //     []
  //   );

  const openBarcodeURL = (barcodeData: string) => {
    let url = "";

    // Check if the barcode data is a valid URL (starts with http or https)
    if (
      barcodeData.startsWith("http://") ||
      barcodeData.startsWith("https://")
    ) {
      // If barcode data is a URL itself
      url = barcodeData;
    } else {
      // If barcode is not a URL, build a URL based on barcode data
      // For example, you could look up the product or perform any specific action based on the barcode
      url = `https://www.example.com/search?q=${barcodeData}`; // You can adjust this logic as per your need
    }

    // Open the constructed URL in the browser
    Linking.openURL(url).catch((err) =>
      console.error("Error opening URL:", err)
    );
  };
  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const barcodeScannerSettings = isBarCode
    ? {
        barcodeTypes: ["qr", "ean13", "ean8", "aztec", "pdf417", "datamatrix"],
      }
    : {};

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        zoom={zoom}
        barcodeScannerSettings={barcodeScannerSettings}
        onBarcodeScanned={isBarCode ? handleBarCodeScanned : undefined}
      >
        <View style={styles.controlContainer}>
          {/* <View style={styles.row}> */}
          <TouchableOpacity style={styles.button1} onPress={toggleCameraFacing}>
            <Text style={styles.fliptext}>Flip</Text>
          </TouchableOpacity>

          {/* </View> */}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#000",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "#fff",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  controlContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.5",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 20,
  },
  button1: {
    bottom: 600,
    padding: 10,
    width: 70,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  button2: {
    width: 190,
    backgroundColor: "white",
    height: 70,
    borderRadius: 30,
    position: "absolute",
    bottom: 60,
    left: 120,
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    top: 18,
    textAlign: "center",
  },
  text1: {
    fontSize: 20,
    fontWeight: "bold",
    color: "red",
    top: 15,
    textAlign: "center",
  },
  fliptext: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  slider: {
    flex: 1,
    marginLeft: 10,
  },
  capturebutton: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderRadius: 30,
    paddingHorizontal: 30,
  },
  capturetext: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalview: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  modaltext: {
    fontSize: 15,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
  },
  buttonclose: {
    marginTop: 10,
    backgroundColor: "#2196F3",
  },
  barcodeText: {
    fontSize: 15,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
  },
});
