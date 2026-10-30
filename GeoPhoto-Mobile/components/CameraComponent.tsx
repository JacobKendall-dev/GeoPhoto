import { Image } from "expo-image";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  onImageTaken: (imageUrl: string) => void;
  onClose: () => void;
};

export default function CameraComponent({
  onImageTaken,
  onClose,
}: Props) {
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const takePicture = async () => {
    if (!cameraReady || !cameraRef.current) return;

    try {
      const result = await cameraRef.current.takePictureAsync();

      if (!result) return;

      setCapturedPhoto(result.uri);
    } catch (error) {
      console.log("Camera error:", error);

      Alert.alert(
        "Camera Error",
        "Something went wrong taking the picture."
      );
    }
  };

  const usePhoto = async () => {
    if (!capturedPhoto) return;

    try {
      const formData = new FormData();

      formData.append("image", {
        uri: capturedPhoto,
        name: "image.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(
        "http://192.168.1.174:5198/images/location",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();

      onImageTaken(data.imageUrl);
    } catch (error) {
      console.log("Upload error:", error);

      Alert.alert(
        "Upload Error",
        "Something went wrong uploading the picture."
      );
    }
  };

  // Camera permission hasn't loaded yet
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Camera permission hasn't been granted
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.text}>
          MapApp needs access to your camera.
        </Text>

        <Pressable
          onPress={requestPermission}
          style={styles.button}
        >
          <Text style={styles.text}>
            Allow Camera
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {capturedPhoto ? (
        // --------------------------------
        // PHOTO PREVIEW
        // --------------------------------
        <View style={styles.previewContainer}>

          <Image
            source={{ uri: capturedPhoto }}
            style={styles.preview}
            contentFit="contain"
          />

          <Pressable
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>

          <View style={styles.previewControls}>

            <Pressable
              onPress={() => {
                setCapturedPhoto(null);
                setCameraReady(false);
              }}
              style={styles.retakeButton}
            >
              <Text style={styles.buttonText}>
                Retake
              </Text>
            </Pressable>

            <Pressable
              onPress={usePhoto}
              style={styles.usePhotoButton}
            >
              <Text style={styles.buttonText}>
                Use Photo
              </Text>
            </Pressable>

          </View>

        </View>
      ) : (
        // --------------------------------
        // LIVE CAMERA
        // --------------------------------
        <>
          <View style={styles.cameraCenter}>

            <View style={styles.cameraContainer}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
                onCameraReady={() => setCameraReady(true)}
              />
            </View>

          </View>

          <Pressable
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>
              ×
            </Text>
          </Pressable>

          <View style={styles.controls}>

            <Pressable
              onPress={takePicture}
              style={styles.shutter}
            >
              <View style={styles.shutterInner} />
            </Pressable>

          </View>
        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "black",
  },

  // --------------------------------
  // CAMERA
  // --------------------------------

  cameraCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },

  cameraContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    overflow: "hidden",
  },

  camera: {
    flex: 1,
  },

  controls: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },

  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 5,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },

  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },

  // --------------------------------
  // CLOSE BUTTON
  // --------------------------------

  closeButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  closeText: {
    color: "white",
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 34,
  },

  // --------------------------------
  // PHOTO PREVIEW
  // --------------------------------

  previewContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },

  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
  },

  previewControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  retakeButton: {
    width: 180,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  usePhotoButton: {
    width: 180,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // --------------------------------
  // PERMISSIONS
  // --------------------------------

  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    padding: 20,
  },

  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#333",
    borderRadius: 8,
  },

  text: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});