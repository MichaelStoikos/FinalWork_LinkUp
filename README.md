# LinkUp

**LinkUp** is a collaborative platform for multimedia professionals to connect, swap skills, and work together on creative projects. Users can showcase their profiles, request collaborations, and manage trades in a modern, user-friendly interface.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [References](#References)
- [License](#license)
- [Contact](#contact)

---

## Features

- User authentication (Firebase)
- Profile management with avatar, bio, specialization, and social links
- Browse and create trades (swaps)
- Request and manage collaborations with custom counterpart messages
- Real-time notifications
- Responsive, modern UI with custom popups and modals
- Specialization-based user discovery
- In-app messaging and file delivery

---

## Tech Stack

- **Frontend:** React, React Router, Framer Motion, Lucide Icons
- **Backend/Database:** Firebase (Firestore, Auth, Storage)
- **Styling:** CSS Modules, Custom CSS
- **Other:** React Helmet, Firebase Hooks

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MichaelStoikos/FinalWork_LinkUp.git
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend/LinkUp
   npm install
   # or
   yarn install
   ```

3. **Set up Firebase:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore, Authentication, and Storage
   - Copy your Firebase config to `src/firebase/config.js`

4. **Configure environment variables:**
   - See [Environment Variables](#environment-variables) below.

---

## Environment Variables

Create a `.env` file in your `frontend/LinkUp` directory and add:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

> _You may also need to update `src/firebase/config.js` with your Firebase config object._

---

## Project Structure

```
frontend/LinkUp/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── style/
│   ├── firebase/
│   ├── App.jsx
│   └── index.js
├── package.json
└── README.md
```

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

---

## References
**setup Firebase:** https://firebase.google.com/docs/web/setup?hl=en <br/>
**CRUD Trades & Connection:** https://youtu.be/jCY6DH8F4oc?si=Ta07a4w6UFi7dX14 <br/>
**CRUD explain Firebase:** https://chatgpt.com/share/6820f204-3a9c-8004-b93d-931927905b1f<br/>
**Base64 Image Strings:** https://chatgpt.com/share/68250ec2-7330-8004-bcaa-b085a155c8a7<br/>
**Base64 Image Strings readAsDataURL Documentation:** https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL<br/>
**Google Authentification:** https://firebase.google.com/docs/auth?hl=fr <br/>
**handleGoogleSignIn:** https://medium.com/%40josephpay911/how-to-connect-firebase-auth-and-firestore-database-in-react-js-fc4109e2be39<br/>
**FileReader:** https://developer.mozilla.org/en-US/docs/Web/API/FileReader<br/>
**Drag:** https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API<br/>
**Example for CreateTradeModal.jsx:** https://chatgpt.com/share/68251741-4f10-8004-abe9-47a86b63982c<br/>
**FadeInWrapper:** Google AI Overview, Searched this: "fade in framer motion component" <br/>
**createPortal React-Router-Dom usage for pop-ups and previews:** https://react.dev/reference/react-dom/createPortal <br/>
**React Helmet for video-background preload:** https://www.npmjs.com/package/react-helmet
**Pop up TOAST React:** https://latteandcode.medium.com/react-toast-an-implementation-with-the-context-api-and-hooks-f52fa564e4a8<br/>
**Swiper React for Tutorial slideshow:** https://swiperjs.com/react<br/>
**Watermark Antd for preview videos and pictures:** https://ant.design/components/watermark <br/>
https://youtu.be/i7Jcj-lHuys?si=d6IbpBb1Fv8PlnS- <br/>
**Icons Lucide-React:** https://lucide.dev/icons/<br/>
**Custom Scroll-bar:** https://www.w3schools.com/howto/howto_css_custom_scrollbar.asp<br/>






## License

[MIT](LICENSE)

---

## Contact

- **Project Maintainer:** [Your Name](mailto:your.email@example.com)
- **Project Link:** [https://github.com/yourusername/linkup](https://github.com/yourusername/linkup)
