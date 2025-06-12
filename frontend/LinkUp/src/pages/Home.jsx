import React, { useState } from 'react';
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
import FadeInWrapper from '../components/FadeInWrapper';
import SpecializationPopup from '../components/SpecializationPopup';

function Home() {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();
    const [popupOpen, setPopupOpen] = useState(false);
    const [selectedSpecialization, setSelectedSpecialization] = useState('');

    const handleSkillCardClick = (specialization) => {
        setSelectedSpecialization(specialization);
        setPopupOpen(true);
    };

    const closePopup = () => {
        setPopupOpen(false);
        setSelectedSpecialization('');
    };

    return (
        <>
                <Helmet>
                    <link
                    rel="preload"
                    as="video"
                    href="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/wave.mp4?alt=media&token=7f183abd-3e77-4258-a283-bac765a4c44c"
                    />
                    <link
                    rel="preload"
                    as="image"
                    href="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/IsoHero.png?alt=media&token=00cdd34d-3952-4b0f-8d39-cfdfccec9cc09-4398-b862-0d57f3435759"
                    type="image/png"
                    />
                </Helmet>
                <div className="home-container">            
                    <div className="home-content">
                        <div className="background-mask"></div>
                        <video autoPlay loop muted playsInline src="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/wave.mp4?alt=media&token=7f183abd-3e77-4258-a283-bac765a4c44c" alt="wave" />
                        <FadeInWrapper>
                        <section className="hero-section">
                            <div className="hero-left">
                                <h1>CONNECT. COLLABORATE. CREATE.</h1>
                                <h3 className="hero-sub">Someone out there needs your magic.<br />Go find them.</h3>
                                <button className="ButtonCustom" onClick={() => navigate('/swaps')}>Swaps</button>
                            </div>
                            <div className="hero-right">
                                <img src="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/IsoHero.png?alt=media&token=00cdd34d-3952-4b0f-8d39-cfdfccec9cc0" alt="hero" />
                            </div>
                        </section>
                        <section className="skills-section">
                            <h1 className="skills-title">THE SKILLS THAT POWER LINKUP</h1>
                            <div className="skills-grid">
                                <div className="skill-card" onClick={() => handleSkillCardClick('Web Development')}>
                                    <CodeXml className="skill-icon" />
                                    <h3>WEB DEVELOPMENT</h3>
                                    <p>Build websites, web apps, and everything in between. Frontend, backend, full stack—find your perfect match.</p>
                                </div>
                                <div className="skill-card" onClick={() => handleSkillCardClick('Motion Graphics')}>
                                    <Clapperboard className="skill-icon" />
                                    <h3>MOTION GRAPHICS</h3>
                                    <p>Add energy and motion to your projects. Animators, video editors, and VFX artists welcome!</p>
                                </div>
                                <div className="skill-card" onClick={() => handleSkillCardClick('Web Design')}>
                                    <Figma className="skill-icon" />
                                    <h3>WEB DESIGN</h3>
                                    <p>Design beautiful, functional user experiences. UI, UX, and everything in between.</p>
                                </div>
                                <div className="skill-card" onClick={() => handleSkillCardClick('Branding')}>
                                    <Copyright className="skill-icon" />
                                    <h3>BRANDING</h3>
                                    <p>Build a memorable brand, project, or business. Designers, strategists, and storytellers unite.</p>
                                </div>
                                <div className="skill-card" onClick={() => handleSkillCardClick('App Development')}>
                                    <TabletSmartphone className="skill-icon" />
                                    <h3>App Development</h3>
                                    <p>Bring your ideas to life with powerful mobile and web apps. Whether it's iOS, Android, or cross-platform.</p>
                                </div>
                                <div className="skill-card" onClick={() => handleSkillCardClick('3D Modeling')}>
                                    <Box className="skill-icon" />
                                    <h3>3D MODELING</h3>
                                    <p>Bring your imagination to life in 3D. Modelers, sculptors, and animators collaborate here.</p>
                                </div>
                            </div>
                            <div className="skills-footer">
                                This is just the beginning. In the future, we plan to expand into even more fields to support all kinds of digital collaboration.
                            </div>
                        </section>
                        </FadeInWrapper>
                    </div>
                </div>
                <section className="tutorial-section">
                    <div className="tutorial-content">
                        <h1 className="tutorial-title">SO EASY TO USE, YOU MIGHT<br />THINK YOU ALREADY USED IT</h1>
                        <p className="tutorial-desc">Yes, using&nbsp;<strong>Linkup</strong>&nbsp;is easy, but a quick reminder can make it even smoother. Click the button below to follow our simple tutorial!</p>
                        <button className="ButtonCustom" onClick={() => navigate('/tutorial')}>Start Tutorial</button>
                    </div>
                </section>
                
                <SpecializationPopup 
                    isOpen={popupOpen}
                    onClose={closePopup}
                    specialization={selectedSpecialization}
                />
        </>
    );
}

export default Home;