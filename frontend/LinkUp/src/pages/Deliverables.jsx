import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import DeliverWorkModal from '../components/DeliverWorkModal';
import TradeCompletionModal from '../components/TradeCompletionModal';
import { Watermark, Modal } from 'antd';
import '../style/Deliverables.css';

/**
 * Deliverables page for managing and viewing deliverables in a trade collaboration.
 * Shows all deliverables from both users and provides delivery functionality.
 * 
 * @returns {JSX.Element} The rendered deliverables page component
 */
function Deliverables() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [myPreviewFiles, setMyPreviewFiles] = useState([]);
  const [myFinalFiles, setMyFinalFiles] = useState([]);
  const [partnerPreviewFiles, setPartnerPreviewFiles] = useState([]);
  const [partnerFinalFiles, setPartnerFinalFiles] = useState([]);
  const [bothUploaded, setBothUploaded] = useState(false);
  const [myAccepted, setMyAccepted] = useState(false);
  const [partnerAccepted, setPartnerAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDeliverModalOpen, setDeliverModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [tradeName, setTradeName] = useState('');
  const [completionShown, setCompletionShown] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [modalVideo, setModalVideo] = useState(null);
  const [modalIsPreview, setModalIsPreview] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chatPartner, setChatPartner] = useState(null);
  const [partnerId, setPartnerId] = useState(null);

  /**
   * Fetches trade name and completion status for the completion modal.
   */
  const fetchTradeName = async () => {
    try {
      const requestRef = doc(db, 'collaborationRequests', chatId);
      const requestSnap = await getDoc(requestRef);
      if (requestSnap.exists()) {
        const requestData = requestSnap.data();
        setTradeName(requestData.tradeName || 'Trade');
        setCompletionShown(requestData.completionShown || false);
      }
    } catch (error) {
      console.error('Error fetching trade name:', error);
      setTradeName('Trade');
    }
  };

  /**
   * Fetches all deliverables from Firebase for both users in the trade.
   */
  const fetchDeliverables = async () => {
    try {
      const deliverablesRef = collection(db, 'deliverables');
      const q = query(
        deliverablesRef,
        where('tradeId', '==', chatId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const myPreview = [];
        const myFinal = [];
        const partnerPreview = [];
        const partnerFinal = [];

        const allDeliverables = [];
        snapshot.forEach((doc) => {
          allDeliverables.push({ id: doc.id, ...doc.data() });
        });

        // Sort by createdAt in descending order (newest first)
        allDeliverables.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toDate() - a.createdAt.toDate();
          }
          return 0;
        });

        // Separate into categories
        allDeliverables.forEach((data) => {
          if (data.userId === auth.currentUser?.uid) {
            if (data.type === 'preview') {
              myPreview.push(data);
            } else if (data.type === 'final') {
              myFinal.push(data);
            }
          } else {
            if (data.type === 'preview') {
              partnerPreview.push(data);
            } else if (data.type === 'final') {
              partnerFinal.push(data);
            }
          }
        });

        setMyPreviewFiles(myPreview);
        setMyFinalFiles(myFinal);
        setPartnerPreviewFiles(partnerPreview);
        setPartnerFinalFiles(partnerFinal);

        // Check if both users have uploaded preview deliverables
        setBothUploaded(myPreview.length > 0 && partnerPreview.length > 0);

        // Check acceptance status for preview deliverables
        const myPreviewAccepted = myPreview.some(f => f.accepted);
        const partnerPreviewAccepted = partnerPreview.some(f => f.accepted);
        
        setMyAccepted(myPreviewAccepted);
        setPartnerAccepted(partnerPreviewAccepted);

        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching deliverables:', error);
      setLoading(false);
    }
  };

  /**
   * Fetches chat details and partner information.
   */
  const fetchChatDetails = async () => {
    try {
      const requestRef = doc(db, 'collaborationRequests', chatId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Chat not found');
      }

      const requestData = requestSnap.data();
      if (requestData.status !== 'accepted') {
        throw new Error('Chat is not available');
      }

      const partnerId = requestData.creatorUid === auth.currentUser?.uid 
        ? requestData.requesterUid 
        : requestData.creatorUid;
      setPartnerId(partnerId);

      const partnerRef = doc(db, 'users', partnerId);
      const partnerSnap = await getDoc(partnerRef);
      if (partnerSnap.exists()) {
        setChatPartner(partnerSnap.data());
      }
    } catch (err) {
      console.error("Error fetching chat:", err);
      navigate('/messages');
    }
  };

  /**
   * Refreshes deliverables after a new delivery.
   */
  const handleDeliveryRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  /**
   * Accepts the partner's preview work by marking all current user's preview deliverables as accepted.
   * Sends a notification to the partner and refreshes the file list.
   */
  const handleAccept = async () => {
    try {
      // Mark all current user's preview deliverables as accepted
      for (const file of myPreviewFiles) {
        await updateDoc(doc(db, 'deliverables', file.id), { accepted: true });
      }
      
      setMyAccepted(true);
      
      // Send notification to partner
      if (partnerId) {
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
          userId: partnerId,
          type: 'accept',
          message: `${auth.currentUser?.displayName || 'Someone'} has accepted your preview work`,
          tradeId: chatId,
          fromUserId: auth.currentUser?.uid,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error accepting work:', error);
    }
  };

  /**
   * Requests changes by resetting the acceptance flag for all current user's preview deliverables.
   */
  const handleRequestChanges = async () => {
    try {
      // Mark all current user's preview deliverables as not accepted
      for (const file of myPreviewFiles) {
        await updateDoc(doc(db, 'deliverables', file.id), { accepted: false });
      }
      
      setMyAccepted(false);
    } catch (error) {
      console.error('Error requesting changes:', error);
    }
  };

  /**
   * Renders file preview with appropriate controls and watermarks.
   */
  const renderFilePreview = (file, isPreview, canDelete) => {
    const isImage = file.fileType?.startsWith('image/');
    const isVideo = file.fileType?.startsWith('video/');
    const isLink = file.isLink;

    if (isImage) {
      if (isPreview) {
        return (
          <div style={{ position: 'relative', width: 200, margin: '0 auto' }}>
            <Watermark 
              content="PREVIEW"
              font={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: 16, fontWeight: 'bold' }}
              gap={[20, 20]}
              offset={[0, 0]}
            >
              <img
                src={file.downloadURL}
                alt={file.fileName}
                style={{ maxWidth: 200, cursor: 'zoom-in' }}
                onContextMenu={e => e.preventDefault()}
                onClick={() => {
                  setModalImage(file.downloadURL);
                  setModalIsPreview(true);
                }}
                tabIndex={0}
                role="button"
                aria-label="Enlarge image preview"
              />
            </Watermark>
          </div>
        );
      } else {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={file.downloadURL}
              alt={file.fileName}
              style={{ maxWidth: 200, borderRadius: 8, cursor: 'zoom-in' }}
              onClick={() => {
                setModalImage(file.downloadURL);
                setModalIsPreview(false);
              }}
            />
            <a href={file.downloadURL} download={file.fileName} style={{ marginTop: 4, color: '#7b61ff', textDecoration: 'underline', fontSize: '0.95rem' }}>Download</a>
          </div>
        );
      }
    }
    
    if (isVideo) {
      if (isPreview) {
        return (
          <div style={{ position: 'relative', width: 200, margin: '0 auto' }}>
            <Watermark 
              content="PREVIEW"
              font={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: 16, fontWeight: 'bold' }}
              gap={[20, 20]}
              offset={[0, 0]}
            >
              <video
                src={file.downloadURL}
                controls
                controlsList="nodownload nofullscreen"
                style={{ maxWidth: 200, borderRadius: 12, cursor: 'zoom-in' }}
                onContextMenu={e => e.preventDefault()}
                onClick={() => {
                  setModalVideo(file.downloadURL);
                  setModalIsPreview(true);
                }}
              />
            </Watermark>
          </div>
        );
      } else {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <video
              src={file.downloadURL}
              controls
              style={{ maxWidth: 200, borderRadius: 12, cursor: 'zoom-in' }}
              onClick={() => {
                setModalVideo(file.downloadURL);
                setModalIsPreview(false);
              }}
            />
            <a href={file.downloadURL} download={file.fileName} style={{ marginTop: 4, color: '#7b61ff', textDecoration: 'underline', fontSize: '0.95rem' }}>Download</a>
          </div>
        );
      }
    }
    
    if (file.fileType === 'application/pdf') {
      return (
        <a href={file.downloadURL} target="_blank" rel="noopener noreferrer">
          <span role="img" aria-label="pdf">📄</span> {file.fileName}
        </a>
      );
    }
    
    if (isLink) {
      return (
        <a href={file.downloadURL} target="_blank" rel="noopener noreferrer">
          {file.downloadURL}
        </a>
      );
    }
    
    return (
      <div>
        <span role="img" aria-label="file">📎</span> {file.fileName}
      </div>
    );
  };

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/');
      return;
    }

    fetchChatDetails();
    fetchDeliverables();
    fetchTradeName();
  }, [chatId, navigate, refreshKey]);

  if (loading) return <div className="deliverables-loading">Loading deliverables...</div>;

  return (
    <div className="deliverables-page">
      <div className="deliverables-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back to Chat
        </button>
        <h1>Deliverables - {tradeName}</h1>
        {chatPartner && (
          <div className="partner-info">
            <img 
              src={chatPartner.photoBase64 || '/User.png'} 
              alt={chatPartner.nickname || 'Partner'}
              className="partner-avatar"
            />
            <span className="partner-name">{chatPartner.nickname || 'Partner'}</span>
          </div>
        )}
      </div>

      <div className="deliverables-content">
        <div className="deliverables-columns">
          {/* Left Column - Your Deliverables */}
          <div className="deliverables-column">
            <div className="deliverables-section">
              <div className="section-header">
                <h2>Your Preview Deliverables</h2>
                <button 
                  onClick={() => setDeliverModalOpen(true)} 
                  className="deliver-work-btn"
                >
                  Deliver Work
                </button>
              </div>
              
              {myPreviewFiles.length === 0 ? (
                <div className="no-files">No preview files uploaded yet.</div>
              ) : (
                <div className="files-grid">
                  {myPreviewFiles.map(file => (
                    <div key={file.id} className="file-item">
                      {renderFilePreview(file, true, true)}
                      <div className="file-description">{file.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Only show your final deliverables when both parties accept preview deliverables */}
            {(myAccepted && partnerAccepted) && (
              <div className="deliverables-section">
                <h2>Your Final Deliverables</h2>
                {myFinalFiles.length === 0 ? (
                  <div className="no-files">No final files uploaded yet.</div>
                ) : (
                  <div className="files-grid">
                    {myFinalFiles.map(file => (
                      <div key={file.id} className="file-item">
                        {renderFilePreview(file, false, false)}
                        <div className="file-description">{file.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Partner's Deliverables */}
          <div className="deliverables-column">
            <div className="deliverables-section">
              <h2>Partner's Preview Deliverables</h2>
              {partnerPreviewFiles.length === 0 ? (
                <div className="no-files">No preview files uploaded yet.</div>
              ) : (
                <div className="files-grid">
                  {partnerPreviewFiles.map(file => (
                    <div key={file.id} className="file-item">
                      {renderFilePreview(file, true, false)}
                      <div className="file-description">{file.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Only show partner's final deliverables when both parties accept preview deliverables */}
            {(myAccepted && partnerAccepted) && (
              <div className="deliverables-section">
                <h2>Partner's Final Deliverables</h2>
                {partnerFinalFiles.length === 0 ? (
                  <div className="no-files">No final files uploaded yet.</div>
                ) : (
                  <div className="files-grid">
                    {partnerFinalFiles.map(file => (
                      <div key={file.id} className="file-item">
                        {renderFilePreview(file, false, false)}
                        <div className="file-description">{file.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Accept/Reject buttons when both have uploaded preview deliverables */}
        {bothUploaded && (
          <div className="acceptance-section">
            <h2>Review Partner's Preview Work</h2>
            <div className="acceptance-buttons">
              <button 
                onClick={handleAccept} 
                disabled={myAccepted}
                className={`accept-btn ${myAccepted ? 'accepted' : ''}`}
              >
                {myAccepted ? '✓ You Accepted!' : "Accept Partner's Work"}
              </button>
              {myAccepted && (
                <button 
                  onClick={handleRequestChanges}
                  className="request-changes-btn"
                >
                  Request Changes
                </button>
              )}
            </div>
            <div className="acceptance-status">
              <span className={`status ${myAccepted ? 'accepted' : 'pending'}`}>
                {myAccepted ? '✓ You have accepted the preview work' : '⏳ You have not accepted yet'}
              </span>
              <span className={`status ${partnerAccepted ? 'accepted' : 'pending'}`}>
                {partnerAccepted ? '✓ Partner has accepted your preview work' : '⏳ Partner has not accepted yet'}
              </span>
            </div>
          </div>
        )}

        {(myAccepted && partnerAccepted) && (
          <div className="completion-section">
            <h2>Trade Completion</h2>
            <p>Both parties have accepted the deliverables!</p>
            <button 
              onClick={() => setIsCompletionModalOpen(true)}
              className="completion-btn"
              disabled={completionShown}
            >
              {completionShown ? 'Completion Already Shown' : 'Show Completion'}
            </button>
          </div>
        )}
      </div>

      <DeliverWorkModal
        tradeId={chatId}
        userId={auth.currentUser?.uid}
        isOpen={isDeliverModalOpen}
        onClose={() => setDeliverModalOpen(false)}
        onDelivery={handleDeliveryRefresh}
        partnerId={partnerId}
      />

      <TradeCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        tradeName={tradeName}
        tradeId={chatId}
      />

      {/* Image Modal */}
      {modalImage && (
        <div className="image-modal-overlay" onClick={() => {
          setModalImage(null);
          setModalIsPreview(false);
        }}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => {
              setModalImage(null);
              setModalIsPreview(false);
            }}>&times;</button>
                         {modalIsPreview ? (
               <Watermark 
                 content="PREVIEW"
                 font={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: 32, fontWeight: 'bold' }}
                 gap={[50, 50]}
                 offset={[0, 0]}
               >
                 <img
                   src={modalImage}
                   alt="Preview"
                   style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12 }}
                 />
               </Watermark>
             ) : (
              <img
                src={modalImage}
                alt="Final Deliverable"
                style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12 }}
              />
            )}
          </div>
        </div>
      )}

      {/* Video Modal */}
      <Modal
        open={!!modalVideo}
        onCancel={() => {
          setModalVideo(null);
          setModalIsPreview(false);
        }}
        footer={null}
        centered
        width={1550}
        styles={{ body: { padding: 0, background: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' } }}
        destroyOnHidden
      >
                 {modalIsPreview ? (
           <Watermark 
             content="PREVIEW"
             font={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 32, fontWeight: 'bold' }}
             gap={[50, 50]}
             offset={[0, 0]}
           >
             <video
               src={modalVideo}
               controls
               controlsList="nodownload nofullscreen"
               style={{ maxWidth: '98vw', maxHeight: '90vh', borderRadius: 12, background: '#000' }}
               onContextMenu={e => e.preventDefault()}
               autoPlay
             />
           </Watermark>
         ) : (
          <video
            src={modalVideo}
            controls
            style={{ maxWidth: '98vw', maxHeight: '90vh', borderRadius: 12, background: '#000' }}
            autoPlay
          />
        )}
      </Modal>
    </div>
  );
}

export default Deliverables;
