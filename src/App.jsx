import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Aurora from './components/Aurora';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Home from './pages/Home';
import Work from './pages/Work';
import Contact from './pages/Contact';

export default function App(){
  return (
    <BrowserRouter>
      <Aurora/>
      <Nav/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/work" element={<Work/>}/>
        <Route path="/contact" element={<Contact/>}/>
        <Route path="*" element={<Home/>}/>
      </Routes>
      <Footer/>
    </BrowserRouter>
  );
}
