import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { addWatermarkToImage } from '../utils/watermark';
import DeliverWorkModal from './DeliverWorkModal';
import { createPortal } from 'react-dom';
import { Watermark, Modal } from 'antd';
import { auth } from '../firebase/config';

// Move WatermarkedImage outside DeliverablesPanel to avoid flicker
const WatermarkedImage = ({ url, alt, style, onClick }) => {
  const [watermarkedUrl, setWatermarkedUrl] = useState(null);
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const wm = await addWatermarkToImage(url, 'PREVIEW');
      if (isMounted) setWatermarkedUrl(wm);
    })();
    return () => { isMounted = false; };
  }, [url]);
  if (!watermarkedUrl) return <div style={{width: 200, height: 120, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading...</div>;
  return (
    <img
      src={watermarkedUrl}
      alt={alt}
      style={style}
      onContextMenu={e => e.preventDefault()}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label="Enlarge image preview"
    />
  );
};

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
  const [modalImage, setModalImage] = useState(null);
  const [modalVideo, setModalVideo] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch deliverables
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
    setMyAccepted(myPreviewArr.some(f => f.accepted) || myFinalArr.some(f => f.accepted));
    setPartnerAccepted(partnerPreviewArr.some(f => f.accepted) || partnerFinalArr.some(f => f.accepted));
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line
  }, [tradeId, userId, partnerId, refreshKey]);

  // Accept partner's work (mark own deliverables as accepted)
  const handleAccept = async () => {
    // Mark all my preview and final files as accepted
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
    // Send notification to partner
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

  // Request changes (reset accepted flag for own deliverables)
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

  // Handler to refresh after delivery
  const handleDeliveryRefresh = () => setRefreshKey(k => k + 1);

  // Render file preview
  const renderFilePreview = (file, isFull = false, isPreview = false) => {
    if (file.fileType && file.fileType.startsWith('image/')) {
      if (isPreview) {
        // Watermarked preview, disable right-click
        return <WatermarkedImage url={file.fileUrl} alt={file.fileName} style={{ maxWidth: 200, cursor: 'zoom-in' }} onClick={() => setModalImage(file.fileUrl)} />;
      } else {
        // Final: show original image, enable download
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={file.fileUrl}
              alt={file.fileName}
              style={{ maxWidth: 200, borderRadius: 8, cursor: 'zoom-in' }}
              onClick={() => setModalImage(file.fileUrl)}
            />
            <a href={file.fileUrl} download={file.fileName} style={{ marginTop: 4, color: '#7b61ff', textDecoration: 'underline', fontSize: '0.95rem' }}>Download</a>
          </div>
        );
      }
    }
    if (file.fileType && file.fileType.startsWith('video/')) {
      if (isPreview) {
        // Watermarked preview, disable download
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
                  onClick={() => setModalVideo(file.fileUrl)}
                />
              </Watermark>
            </div>
          );
        }
        return <div style={{ color: '#b8c1ec' }}>Video file (preview not available)</div>;
      } else {
        // Final: show original video, enable download
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <video
              src={file.fileUrl}
              controls
              style={{ maxWidth: 200, borderRadius: 12, cursor: 'zoom-in' }}
              onClick={() => setModalVideo(file.fileUrl)}
            />
            <a href={file.fileUrl} download={file.fileName} style={{ marginTop: 4, color: '#7b61ff', textDecoration: 'underline', fontSize: '0.95rem' }}>Download</a>
          </div>
        );
      }
    }
    if (file.fileType && file.fileType === 'application/pdf') {
      // PDF preview (show only if full)
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
    // Other file types
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
      {/* Image Modal */}
      {modalImage && createPortal(
        <div className="image-modal-overlay" onClick={() => setModalImage(null)}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setModalImage(null)}>&times;</button>
            <WatermarkedImage url={modalImage} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12 }} />
          </div>
        </div>,
        document.body
      )}
      {/* Video Modal with Watermark */}
      <Modal
        open={!!modalVideo}
        onCancel={() => setModalVideo(null)}
        footer={null}
        centered
        width={1550}
        styles={{ body: { padding: 0, background: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' } }}
        destroyOnHidden
      >
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
      </Modal>
    </>
  );
}

export default DeliverablesPanel;
