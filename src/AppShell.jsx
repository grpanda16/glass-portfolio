import { Routes, Route } from 'react-router-dom';
import Aurora from './components/Aurora';
import Nav from './components/Nav';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Work from './pages/Work';
import Blog from './pages/Blog';
import Projects from './pages/Projects';
import Post from './pages/Post';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

/**
 * The app minus the router, so the browser can wrap it in BrowserRouter and the
 * build-time prerenderer can wrap it in StaticRouter.
 */
export default function AppShell() {
  return (
    <>
      <ScrollToTop />
      <Aurora />
      <a className="skip" href="#main">Skip to content</a>
      <Nav />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work" element={<Work />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<Post />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
