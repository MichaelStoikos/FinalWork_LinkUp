import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';
import '../style/Tutorial.css';

export default function Tutorial() {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  const slides = [
    { title: '1. Getting Started: Post or Find a Job', desc: 'Want to collaborate? Start by creating a job listing where you describe the multimedia service you need or offer. Or, browse existing jobs to find opportunities that match your skills. Once you find a job or an interested partner, you can start the negotiation process.'},
    { title: '2. Connecting & Communicating', desc: 'Once two users agree on a job, they can start communicating! Use text chat within the platform or set up meetings through external platforms like Zoom, Teams, or Discord. Clear communication is key to successful collaboration.'},
    { title: '3. Working on Each Other\'s Projects', desc: 'After agreeing on the details, both parties begin working on their respective tasks. You’ll be helping each other out in a fair exchange—whether it’s video editing, graphic design, coding, or any other multimedia service.'},
    { title: '4. Progress Reviews & Adjustments', desc: 'Every 1 or 2 weeks, you and your collaborator will review progress. This ensures both sides are on track and allows for any necessary adjustments before the final deadline.'},
    { title: '5. Completing the Deal', desc: 'Once the agreed-upon time (e.g., 4 weeks) is up, both parties should be satisfied with the results. When both confirm that the job is completed, the deal is sealed—no loose ends, no unfinished work! '}
  ];

  return (
    <div className="tutorial-container">
        <video autoPlay loop muted playsInline className="trades-bg-" src="https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/waveBG2.mp4?alt=media&token=f41d68c3-7e04-47ac-a5fd-20c326f3c9ae" alt="wave" />
      <h1>How LinkUp Works</h1>
      <Swiper
        modules={[Pagination]} 
        spaceBetween={30}
        slidesPerView={1}
        pagination={{ clickable: true,
            el: '.custom-pagination', }}
        onSwiper={swiper => (swiperRef.current = swiper)}
        onSlideChange={swiper => setActiveIndex(swiper.activeIndex)}
        className="tutorial-swiper"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            <div className="tutorial-slide">
              <div className="tutorial-slide-img">
                <img src={"https://firebasestorage.googleapis.com/v0/b/linkup-c14d5.firebasestorage.app/o/IsoTuto1.png?alt=media&token=a85a4cfe-b027-4042-88ec-a4fd0a2d7a51"} alt="tuto1" />
              </div>
              <div className="tutorial-slide-text">
                <h2>{slide.title}</h2>
                <p>{slide.desc}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="tutorial-controls">
  {activeIndex > 0 && (
    <button onClick={() => swiperRef.current?.slidePrev()}>Previous</button>
  )}
  
  <div className="custom-pagination"></div>

  <button
            onClick={() => {
            if (activeIndex < slides.length - 1) {
                swiperRef.current?.slideNext();
            } else {
                navigate('/');
            }
            }}
        >
            {activeIndex < slides.length - 1 ? "Next" : "Finish"}
        </button>
        </div>
    </div>
  );
}