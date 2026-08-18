import { useState } from "react";

export default function App() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [description, setDescription] = useState("");

  const [locations, setLocations] = useState([]);

  const fetchLocations = async () => {
    const res = await fetch("http://localhost:5198/locations");
    const data = await res.json();
    setLocations(data);
  };

  const addLocation = async () => {
    await fetch("http://localhost:5198/locations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        description: description
      })
    });

    // refresh list after insert
    fetchLocations();
  };

  const deleteLocation = async (id) => {
    await fetch(`http://localhost:5198/locations/${id}`, {
      method: "DELETE"
    });

    fetchLocations();
  };

  const updateLocation = async (id) => {
    await fetch(`http://localhost:5198/locations/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        latitude: 50,
        longitude: 50,
        description: "Updated"
      })
    });

    fetchLocations();
  };
   const [isOpen, setIsOpen] = useState(true);

  return (
    
    <main>
      <header>
        <h1>GeoPhoto</h1>
      </header>

      
      <h2>select</h2>
    </main>
    
  );
}

