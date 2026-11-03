import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import PublicOnly from "./components/PublicOnly";
import ConfirmEmail from "./pages/ConfirmEmail";
import ResendConfirmation from "./pages/ResendConfirmation";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";


export default function App() {


  return (

  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/confirm-email" element={<ConfirmEmail />} />
      
      {/* Only accessible while logged out */}
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/resend-confirmation" element={<ResendConfirmation />} />
      </Route>

      {/* Only accessible while logged in */}
      <Route element={<RequireAuth />}>

{/* {        <Route path="/explore" element={<Explore />} />} */}
      </Route>
    </Routes>
  </BrowserRouter>

    
  );
}

