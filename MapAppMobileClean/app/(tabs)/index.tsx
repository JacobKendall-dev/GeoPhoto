import { Image } from 'expo-image';
import { Alert, StyleSheet, View, Text, Button, Pressable, Keyboard } from 'react-native';
import {Callout, Region, Marker, AnimatedRegion} from 'react-native-maps';
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import  Mapbox, { Annotation }   from '@rnmapbox/maps'

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import BottomSheet, { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { BottomSheetModalProvider, BottomSheetView } from '@gorhom/bottom-sheet';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useRef, useState } from 'react';

//setting access token
Mapbox.setAccessToken('pk.eyJ1IjoiZ2F3YWluNDA0IiwiYSI6ImNtb3kwMDd4ZzBwczIycG9hY3IxOXlrNDgifQ.hOaIRSPrzr2DfND3GM_CBQ');


export default function HomeScreen() {
  const [latitude, setLatitude] = useState<number | null>(null); //latitude of a photo just taken
  const [longitude, setLongitude] = useState<number | null>(null); //longitude of a photo just taken
  const [imageUrl, setImageUrl] = useState<string | null>(null); //url of where the photoimage is just taken
  const [description, setDescription] = useState(''); //description of a photo just taken

  //all the locations/pins stored in the database
  const [locations, setLocations] = useState<Location[]>([])
  //currently selected location marker
  const [selectedLocation, setSelectedLocations] = useState<Location | null>(null);

  const cameraRef = useRef<Mapbox.Camera>(null);
  

  // the instance of the sheet after the photo is chosen
  const bottomSheetRef = useRef<BottomSheet>(null);


  // Height positions the sheet can snap to
  const snapPoints = useMemo(() => ['25%'], []);

  // the instance of a location being clicked
  const locationSheetRef = useRef<BottomSheet>(null);


  //putting my recieves locations into a new type
  type Location = {
    id: string,
    latitude: number;
    longitude: number;
    description: string;
    imageUrl: string;
  }


 
  //grabbing all the pin locations and their info
  const fetchLocations = async () => {
    const res = await fetch("http://192.168.1.174:5198/locations");
    const data = await res.json();
    setLocations(data);
  };

  //taking picture and location info
  const takeLocation = async () => {

    //Requesting permission for location while phone is open
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Error('Permission to access location was denied');
      return;
    }

    //requesting permission for camera
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the Camera is required.');
      return;
    }

    console.log("before camera")

    try {
    //result is the image taken
    let result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
    });

    console.log("after camera result: ")
    console.log(result);

    //creating uri if result is not canceled
    if (!result.canceled) {

      //sending file
      const formData = new FormData();

      formData.append('image', {
        uri: result.assets[0].uri,
        name: 'image.jpg',
        type: 'image/jpeg',
      } as any);
      console.log(formData);

      //posting uri to get a public URL
      const response = await fetch("http://192.168.1.174:5198/images", {
      method: "POST",
      body: formData,
      })

      //file has been received back with public URL
      const data = await response.json();
      console.log(data);
      setImageUrl(data.imageUrl);
    




    //Getting the fields on the position/pin
    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });


    const lat = location.coords.latitude;
    const lng = location.coords.longitude;

    setLatitude(lat)
    setLongitude(lng)


    {/*//guard for animated region and gps failure
    if (latitude == null || longitude == null) 
    {
        console.log("State", latitude),
        console.log("GPS", location.coords.latitude)
        return;
    }*/}

    cameraRef.current?.flyTo(
      [lng, lat],
      1000
    );

    openSheet();


    }
    } catch(error) {
      console.log("Camera ERRORL: ", error)
    }

  };

  //sending current location info to the backend
  const addLocation = async() => {
      const res = await fetch("http://192.168.1.174:5198/locations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        latitude: latitude,
        longitude: longitude,
        description: description,
        imageUrl: imageUrl,
        createdAt: new Date()
      })
    });

  const createdLocation = await res.json();
  return createdLocation;

  }

  //confirming if we want to add location and animating map to new one
  const confirmUpload = async() => {

    console.log(
      latitude,
      longitude
    )
    //send this to the backend
    const newLocation = await addLocation();

    setLocations(prev => [...prev, newLocation]);
    openLocation(newLocation)
    // refresh list after insert
    fetchLocations();
    closeSheet();

    
  }

  //opening sheet of location just taken
  const openSheet = () => {
    console.log("opening sheet");
    bottomSheetRef.current?.expand();
  }

  //closing sheet of location just taken
  const closeSheet = () => {
    Keyboard.dismiss();
    bottomSheetRef.current?.close();
  }

  //opening sheet of location just taken
  const openLocation = (marker: Location) => {
    setSelectedLocations(marker)
    locationSheetRef.current?.expand();
  }

  //closing sheet of location just taken
  const closeLocation = () => {
    locationSheetRef.current?.close();
  }

  const handleLocationPress = (location: Location) => {
    openLocation(location);
    console.log("Selected:", location);
  };


  return (
<GestureHandlerRootView style={{ flex: 1 }}>
<BottomSheetModalProvider>
<View style={styles.container}>


  <Mapbox.MapView style={styles.map}>

  <Mapbox.Camera
    ref={cameraRef}
    zoomLevel={12}
    centerCoordinate={[-95.3011, 32.3513]}
  />

  {locations.map((location) => (
    <Mapbox.PointAnnotation
      key={location.id}
      id={location.id.toString()}
      coordinate={[location.longitude, location.latitude]}
      onSelected={() => handleLocationPress(location)}
    >
      <Image
        source={require('../../assets/images/map-pin.png')}
        style={{ width: 40, height: 40 }}
      />
    </Mapbox.PointAnnotation>
  ))}

  </Mapbox.MapView>
   
  



<Pressable
  onPress={fetchLocations}
  style={{
    position: 'absolute',
    bottom: 75,

    backgroundColor: 'yellow',
    paddingVertical: 15,
    paddingHorizontal: 25,

    borderRadius: 999,
    borderWidth: 2,
  }}
>
  <Text style={{ color: 'black' }}>Refresh</Text>
</Pressable>

<Pressable
  onPress={takeLocation}
  style={{
    position: 'absolute',
    bottom: 0,

    backgroundColor: 'yellow',
    paddingVertical: 15,
    paddingHorizontal: 25,

    borderRadius: 999,
    borderWidth: 2,
  }}
>
  <Text style={{ color: 'black' }}>Take Picture</Text>
</Pressable>
  

<BottomSheet
  ref={locationSheetRef}
  index={-1}
  snapPoints={snapPoints}
  enablePanDownToClose={true}
  enableContentPanningGesture={true}
  enableHandlePanningGesture={true}
  style={styles.locationSheet}
>
  {selectedLocation && (
    <BottomSheetView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Location</Text>

        <Pressable
          onPress={closeLocation}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </Pressable>
      </View>

      {/* Image */}
      {selectedLocation.imageUrl && (
        <Image
          source={{ uri: selectedLocation.imageUrl }}
          style={styles.image}
        />
      )}

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {selectedLocation.description || 'No description available.'}
        </Text>
      </View>

      {/* Coordinates */}
      <View style={styles.infoContainer}>
        <View>
          <Text style={styles.infoLabel}>Latitude</Text>
          <Text style={styles.infoValue}>
            {selectedLocation.latitude}
          </Text>
        </View>

        <View>
          <Text style={styles.infoLabel}>Longitude</Text>
          <Text style={styles.infoValue}>
            {selectedLocation.longitude}
          </Text>
        </View>
      </View>

    </BottomSheetView>
  )}
</BottomSheet>


  <BottomSheet
    ref={bottomSheetRef}
    index={-1}
    snapPoints={snapPoints}
    detached={true}
    bottomInset={46}
    enablePanDownToClose={false} // User can't "swipe" it away
    enableContentPanningGesture={false} // User can't drag the content area
    enableHandlePanningGesture={false}
    handleComponent={null}
    keyboardBehavior='interactive'
    keyboardBlurBehavior='restore'
    style={styles.sheetContainer}
  >
      <BottomSheetView style={styles.container}>
        <BottomSheetTextInput
        style={styles.input}
        placeholder="Write a description about your picture"
        placeholderTextColor={"black"}
        onChangeText={setDescription}
        value={description}
        />
        <Button title="Confirm Upload" onPress={confirmUpload} />
        <Button title="Close" onPress={closeSheet} />
        <View style={styles.pictureContainer}>
        {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} />}
        <Text>{latitude}</Text>
        <Text>{longitude}</Text>
        </View>
    </BottomSheetView>

  </BottomSheet>


  </View>
</BottomSheetModalProvider>
</GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  pictureContainer: {
    justifyContent: 'center',
    alignContent: 'center'
  },
    input: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 6,
    marginHorizontal: 50,
    height: 50,
    width: 300,
  },
  sheetContainer: {
    // Adds horizontal space so it doesn't touch the screen edges
    marginHorizontal: 24, 
  },
  locationSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  contentContainer: {
    padding: 16,
    alignItems: 'center',
    // Ensure the background of the card looks clean
    backgroundColor: 'white',
    borderRadius: 20,
},
  containerPadding: {
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eeeeee',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonText: {
    fontSize: 24,
    color: '#444',
    lineHeight: 26,
  },

  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 18,
  },

  descriptionContainer: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#777',
    marginBottom: 6,
  },

  description: {
    fontSize: 16,
    color: '#222',
    lineHeight: 23,
  },

  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },

  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },

});
