import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, updateDoc, doc, addDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import DeliverWorkModal from './DeliverWorkModal';
import TradeCompletionModal from './TradeCompletionModal';
import { createPortal } from 'react-dom';
import { Watermark, Modal } from 'antd';
import { auth } from '../firebase/config';

/**
 * DeliverablesPanel component for managing and displaying deliverables in a trade collaboration.
 * Handles file uploads, previews, acceptance workflows, and modal interactions.
 * 
 * @param {Object} props - Component props
 * @param {string} props.tradeId - The unique identifier for the trade/collaboration
 * @param {string} props.userId - The current user's unique identifier
 * @param {string} props.partnerId - The partner's unique identifier
 * @returns {JSX.Element} The rendered deliverables panel component
 */
function DeliverablesPanel({ tradeId, userId, partnerId }) {
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

  /**
   * Fetches trade name and completion status for the completion modal.
   * 
   * @async
   * @returns {Promise<void>}
   */
  const fetchTradeName = async () => {
    try {
      const tradeRef = doc(db, 'trades', tradeId);
      const tradeSnap = await getDoc(tradeRef);
      if (tradeSnap.exists()) {
        const tradeData = tradeSnap.data();
        setTradeName(tradeData.name || 'Trade');
        setCompletionShown(tradeData.completionShown || false);
      }
    } catch (error) {
      console.error('Error fetching trade name:', error);
      setTradeName('Trade');
    }
  };

  /**
   * Fetches all deliverables from Firebase for both users in the trade.
   * Updates state with preview and final files, and determines acceptance status.
   * 
   * @async
   * @returns {Promise<void>}
   */
  const fetchFiles = async () => {
    setLoading(true);
    const myPreviewSnap = await getDocs(collection(db, `trades/${tradeId}/deliverables/${userId}/previewFiles`));
    const myFinalSnap = await getDocs(collection(db, `trades/${tradeId}/deliverables/${userId}/finalFiles`));
    const partnerPreviewSnap = await getDocs(collection(db, `trades/${tradeId}/deliverables/${partnerId}/previewFiles`));
    const partnerFinalSnap = await getDocs(collection(db, `trades/${tradeId}/deliverables/${partnerId}/finalFiles`));
    const myPreviewArr = myPreviewSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const myFinalArr = myFinalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const partnerPreviewArr = partnerPreviewSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const partnerFinalArr = partnerFinalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    setMyPreviewFiles(myPreviewArr);
    setMyFinalFiles(myFinalArr);
    setPartnerPreviewFiles(partnerPreviewArr);
    setPartnerFinalFiles(partnerFinalArr);
    setBothUploaded(myPreviewArr.length > 0 && partnerPreviewArr.length > 0);
    
    const myAcceptedStatus = myPreviewArr.some(f => f.accepted) || myFinalArr.some(f => f.accepted);
    const partnerAcceptedStatus = partnerPreviewArr.some(f => f.accepted) || partnerFinalArr.some(f => f.accepted);
    
    setMyAccepted(myAcceptedStatus);
    setPartnerAccepted(partnerAcceptedStatus);
    
    // Check completion status and trade name from trade document
    try {
      const tradeRef = doc(db, 'trades', tradeId);
      const tradeSnap = await getDoc(tradeRef);
      if (tradeSnap.exists()) {
        const tradeData = tradeSnap.data();
        if (!tradeName) {
          setTradeName(tradeData.name || 'Trade');
        }
        setCompletionShown(tradeData.completionShown || false);
      }
    } catch (error) {
      console.error('Error fetching trade completion status:', error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
    fetchTradeName();
    window.setIsCompletionModalOpen = setIsCompletionModalOpen;
  }, [tradeId, userId, partnerId, refreshKey]);

  useEffect(() => {
    const checkAndShowModal = async () => {
      if (myAccepted && partnerAccepted && tradeId && userId) {
        const voteRef = doc(db, `trades/${tradeId}/votes/${userId}`);
        const voteSnap = await getDoc(voteRef);
        if (!voteSnap.exists()) {
          setIsCompletionModalOpen(true);
        }
      }
    };
    checkAndShowModal();
  }, [myAccepted, partnerAccepted, tradeId, userId]);

  /**
   * Accepts the partner's work by marking all current user's deliverables as accepted.
   * Sends a notification to the partner and refreshes the file list.
   * 
   * @async
   * @returns {Promise<void>}
   */
  const handleAccept = async () => {
    const myPreviewSnap = await getDocs(collection(db, `trades/${tradeId}/deliverables/${userId}/previewFiles`));
    const myFinalSnap = await getDocs(collection(db, `trades/${tradeId}/deliverables/${userId}/finalFiles`));
    for (const fileDoc of myPreviewSnap.docs) {
      await updateDoc(doc(db, `trades/${tradeId}/deliverables/${userId}/previewFiles/${fileDoc.id}`), { accepted: true });
    }
    for (const fileDoc of myFinalSnap.docs) {
      await updateDoc(doc(db, `trades/${tradeId}/deliverables/${userId}/finalFiles/${fileDoc.id}`), { accepted: true });
    }
    setMyAccepted(true);
    fetchFiles();
    
    if (partnerId) {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        userId: partnerId,
        type: 'accept',
        message: `${auth.currentUser?.displayName || 'Someone'} has accepted your work`,
        tradeId,
        fromUserId: userId,
        read: false,
        createdAt: serverTimestamp()
      });
    }
  };

  /**
   * Requests changes by resetting the acceptance flag for all current user's deliverables.
   * Refreshes the file list to reflect the changes.
   * 
   * @async
   * @returns {Promise<void>}
   */
  const handleRequestChanges = async () => {
    const myPreviewSnap = await getDocs(collection(db, `trades/${tradeId}/deliverables/${userId}/previewFiles`));
    const myFinalSnap = await getDocs(collection(db, `trades/${tradeId}/deliverables/${userId}/finalFiles`));
    for (const fileDoc of myPreviewSnap.docs) {
      await updateDoc(doc(db, `trades/${tradeId}/deliverables/${userId}/previewFiles/${fileDoc.id}`), { accepted: false });
    }
    for (const fileDoc of myFinalSnap.docs) {
      await updateDoc(doc(db, `trades/${tradeId}/deliverables/${userId}/finalFiles/${fileDoc.id}`), { accepted: false });
    }
    setMyAccepted(false);
    fetchFiles();
  };

  /**
   * Triggers a refresh of the deliverables by incrementing the refresh key.
   * This forces the useEffect to re-run and fetch updated data.
   */
  const handleDeliveryRefresh = () => setRefreshKey(k => k + 1);

  /**
   * Renders a file preview based on its type and preview status.
   * Handles images, videos, PDFs, links, and other file types with appropriate previews.
   * 
   * @param {Object} file - The file object containing metadata and URL
   * @param {boolean} isFull - Whether to show full preview (for PDFs)
   * @param {boolean} isPreview - Whether this is a preview file (affects watermarking and download restrictions)
   * @returns {JSX.Element} The rendered file preview component
   */
  const renderFilePreview = (file, isFull = false, isPreview = false) => {
    if (file.fileType && file.fileType.startsWith('image/')) {
      if (isPreview) {
        return (
          <div style={{ position: 'relative', width: 200, margin: '0 auto' }}>
            <Watermark content="PREVIEW">
              <img
                src={file.fileUrl}
                alt={file.fileName}
                style={{ maxWidth: 200, cursor: 'zoom-in' }}
                onContextMenu={e => e.preventDefault()}
                onClick={() => {
                  setModalImage(file.fileUrl);
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
              src={file.fileUrl}
              alt={file.fileName}
              style={{ maxWidth: 200, borderRadius: 8, cursor: 'zoom-in' }}
              onClick={() => {
                setModalImage(file.fileUrl);
                setModalIsPreview(false);
              }}
            />
            <a href={file.fileUrl} download={file.fileName} style={{ marginTop: 4, color: '#7b61ff', textDecoration: 'underline', fontSize: '0.95rem' }}>Download</a>
          </div>
        );
      }
    }
    if (file.fileType && file.fileType.startsWith('video/')) {
      if (isPreview) {
        if (isFull) {
          return (
            <div style={{ position: 'relative', width: 200, margin: '0 auto' }}>
              <Watermark content="PREVIEW">
                <video
                  src={file.fileUrl}
                  controls
                  controlsList="nodownload nofullscreen"
                  style={{ maxWidth: 200, borderRadius: 12, cursor: 'zoom-in' }}
                  onContextMenu={e => e.preventDefault()}
                  onClick={() => {
                    setModalVideo(file.fileUrl);
                    setModalIsPreview(true);
                  }}
                />
              </Watermark>
            </div>
          );
        }
        return <div style={{ color: '#b8c1ec' }}>Video file (preview not available)</div>;
      } else {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <video
              src={file.fileUrl}
              controls
              style={{ maxWidth: 200, borderRadius: 12, cursor: 'zoom-in' }}
              onClick={() => {
                setModalVideo(file.fileUrl);
                setModalIsPreview(false);
              }}
            />
            <a href={file.fileUrl} download={file.fileName} style={{ marginTop: 4, color: '#7b61ff', textDecoration: 'underline', fontSize: '0.95rem' }}>Download</a>
          </div>
        );
      }
    }
    if (file.fileType && file.fileType === 'application/pdf') {
      if (isFull) {
        return (
          <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
            <span role="img" aria-label="pdf">📄</span> {file.fileName}
          </a>
        );
      }
      return <div style={{ color: '#b8c1ec' }}>PDF file (preview not available)</div>;
    }
    if (file.link) {
      return (
        <a href={file.link} target="_blank" rel="noopener noreferrer">
          {file.link}
        </a>
      );
    }
    return (
      <div>
        <span role="img" aria-label="file">📎</span> {file.fileName}
      </div>
    );
  };

  if (loading) return <div>Loading deliverables...</div>;

  return (
    <>
      <div className="deliverables-panel">
        <DeliverWorkModal
          tradeId={tradeId}
          userId={userId}
          isOpen={isDeliverModalOpen}
          onClose={() => setDeliverModalOpen(false)}
          onDelivery={handleDeliveryRefresh}
          partnerId={partnerId}
        />
        <button onClick={() => setDeliverModalOpen(true)} className="deliver-work-btn" style={{marginBottom: '1rem'}}>
          Deliver Work
        </button>
        <h3>Your Preview Deliverables</h3>
        {myPreviewFiles.length === 0 ? <div>No preview files uploaded yet.</div> : (
          <ul>
            {myPreviewFiles.map(file => (
              <li key={file.id}>
                {renderFilePreview(file, true, true)}
                <div>{file.description}</div>
              </li>
            ))}
          </ul>
        )}
        <h3>Your Final Deliverables</h3>
        {myFinalFiles.length === 0 ? <div>No final files uploaded yet.</div> : (
          <ul>
            {myFinalFiles.map(file => (
              <li key={file.id}>
                {renderFilePreview(file, true, false)}
                <div>{file.description}</div>
              </li>
            ))}
          </ul>
        )}
        <h3>Partner's Preview Deliverables</h3>
        {partnerPreviewFiles.length === 0 ? <div>No preview files uploaded yet.</div> : (
          <ul>
            {partnerPreviewFiles.map(file => (
              <li key={file.id}>
                {renderFilePreview(file, true, true)}
                <div>{file.description}</div>
              </li>
            ))}
          </ul>
        )}
        {(myAccepted && partnerAccepted) && (
          <>
            <h3>Partner's Final Deliverables</h3>
            {partnerFinalFiles.length === 0 ? <div>No final files uploaded yet.</div> : (
              <ul>
                {partnerFinalFiles.map(file => (
                  <li key={file.id}>
                    {renderFilePreview(file, true, false)}
                    <div>{file.description}</div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {bothUploaded && (
          <div style={{ marginTop: 16 }}>
            <button onClick={handleAccept} disabled={myAccepted} style={{ background: myAccepted ? '#7bffb2' : undefined }}>
              {myAccepted ? 'You Accepted!' : "Accept Partner's Work"}
            </button>
            <div style={{ marginTop: 8, color: partnerAccepted ? '#7bffb2' : '#b8c1ec' }}>
              {partnerAccepted ? 'Partner has accepted!' : 'Partner has not accepted yet.'}
            </div>
          </div>
        )}
      </div>
      
      {/* Trade Completion Modal */}
      <TradeCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        tradeId={tradeId}
        partnerId={partnerId}
        tradeName={tradeName}
      />
      
      {modalImage && createPortal(
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
              <Watermark content="PREVIEW">
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
        </div>,
        document.body
      )}
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
          <Watermark content="PREVIEW">
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
    </>
  );
}

export default DeliverablesPanel;
