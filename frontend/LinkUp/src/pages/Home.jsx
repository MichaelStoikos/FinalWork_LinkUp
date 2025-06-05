import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { CodeXml } from 'lucide-react';
import { Clapperboard } from 'lucide-react';
import { Figma } from 'lucide-react';
import { Copyright } from 'lucide-react';
import { Box } from 'lucide-react';
import { TabletSmartphone } from 'lucide-react';
import '../style/Home.css';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

function Home() {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 2 }}
            exit={{ opacity: 0.3 }}
            transition={{ duration: 0.5 }}
        >
        <Helmet>
            <link
            rel="preload"
            as="video"
            href="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/wave.mp4?alt=media&token=7f183abd-3e77-4258-a283-bac765a4c44c"
            />
        </Helmet>
        <div className="home-container">            
            <div className="home-content">
                <div className="background-mask"></div>
                <video autoPlay loop muted playsInline src="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/wave.mp4?alt=media&token=7f183abd-3e77-4258-a283-bac765a4c44c" alt="wave" />
                <section className="hero-section">
                    <h1>CONNECT. COLLABORATE. CREATE.</h1>
                    <h3 className="hero-sub">Someone out there needs your magic.<br />Go find them.</h3>
                    <button className="ButtonCustom" onClick={() => navigate('/trades')}>Swaps</button>
                </section>
                <section className="skills-section">
                    <h1 className="skills-title">THE SKILLS THAT POWER LINKUP</h1>
                    <div className="skills-grid">
                        <div className="skill-card">
                            <CodeXml className="skill-icon" />
                            <h3>WEB DEVELOPMENT</h3>
                            <p>Build websites, web apps, and everything in between. Frontend, backend, full stack—find your perfect match.</p>
                        </div>
                        <div className="skill-card">
                            <Clapperboard className="skill-icon" />
                            <h3>MOTION GRAPHICS</h3>
                            <p>Add energy and motion to your projects. Animators, video editors, and VFX artists welcome!</p>
                        </div>
                        <div className="skill-card">
                            <Figma className="skill-icon" />
                            <h3>WEB DESIGN</h3>
                            <p>Design beautiful, functional user experiences. UI, UX, and everything in between.</p>
                        </div>
                        <div className="skill-card">
                            <Copyright className="skill-icon" />
                            <h3>BRANDING</h3>
                            <p>Build a memorable brand, project, or business. Designers, strategists, and storytellers unite.</p>
                        </div>
                        <div className="skill-card">
                            <TabletSmartphone className="skill-icon" />
                            <h3>App Development</h3>
                            <p>Bring your ideas to life with powerful mobile and web apps. Whether it's iOS, Android, or cross-platform.</p>
                        </div>
                        <div className="skill-card">
                            <Box className="skill-icon" />
                            <h3>3D MODELLING</h3>
                            <p>Bring your imagination to life in 3D. Modelers, sculptors, and animators collaborate here.</p>
                        </div>
                    </div>
                    <div className="skills-footer">
                        This is just the beginning. In the future, we plan to expand into even more fields to support all kinds of digital collaboration.
                    </div>
                </section>
            </div>
        </div>
        <section className="tutorial-section">
            <div className="tutorial-content">
                <h1 className="tutorial-title">SO EASY TO USE, YOU MIGHT<br />THINK YOU ALREADY USED IT</h1>
                <p className="tutorial-desc">Yes, using&nbsp;<strong>Linkup</strong>&nbsp;is easy, but a quick reminder can make it even smoother. Click the button below to follow our simple tutorial!</p>
                <button className="ButtonCustom" onClick={() => navigate('/tutorial')}>Start Tutorial</button>
            </div>
        </section>
        </motion.div>
    );
}

export default Home;