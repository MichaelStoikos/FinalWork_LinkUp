import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { Bell } from 'lucide-react';
import '../style/NotificationBell.css';

function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth.currentUser) {
            console.log('No user logged in, skipping notification subscription');
            setIsLoading(false);
            return;
        }

        console.log('Setting up notification subscription for user:', auth.currentUser.uid);
        setIsLoading(true);
        setError(null);
        
        // First, try to get notifications without ordering to check if basic query works
        const notificationsRef = collection(db, 'notifications');
        const basicQuery = query(
            notificationsRef,
            where('userId', '==', auth.currentUser.uid)
        );

        // Try to get a single document first to verify access
        getDocs(basicQuery)
            .then(snapshot => {
                console.log('Basic query successful, got', snapshot.docs.length, 'documents');
                
                // If basic query works, set up the real-time listener with ordering
                const fullQuery = query(
                    notificationsRef,
                    where('userId', '==', auth.currentUser.uid),
                    orderBy('createdAt', 'desc')
                );

                const unsubscribe = onSnapshot(
                    fullQuery,
                    (snapshot) => {
                        console.log('Received notification update, docs:', snapshot.docs.length);
                        const newNotifications = snapshot.docs.map(doc => {
                            const data = doc.data();
                            console.log('Raw notification data:', data);
                            return {
                                id: doc.id,
                                ...data,
                                createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date()
                            };
                        });
                        console.log('Processed notifications:', newNotifications);
                        setNotifications(newNotifications);
                        const unread = newNotifications.filter(n => !n.read).length;
                        console.log('Unread count:', unread);
                        setUnreadCount(unread);
                        setIsLoading(false);
                    },
                    (error) => {
                        console.error('Error in notification subscription:', error);
                        // Show more detailed error information
                        setError(`Error loading notifications: ${error.code} - ${error.message}`);
                        setIsLoading(false);
                        
                        // If the error is about missing index, show a more helpful message
                        if (error.code === 'failed-precondition') {
                            setError('Database index needs to be created. Please contact support.');
                        }
                    }
                );

                return () => {
                    console.log('Cleaning up notification subscription');
                    unsubscribe();
                };
            })
            .catch(error => {
                console.error('Error in basic query:', error);
                setError(`Error accessing notifications: ${error.code} - ${error.message}`);
                setIsLoading(false);
            });
    }, []);

    // Mark all unread notifications as read when dropdown is opened
    useEffect(() => {
        if (isOpen && notifications.length > 0) {
            const unread = notifications.filter(n => !n.read);
            if (unread.length > 0) {
                const batch = writeBatch(db);
                unread.forEach(n => {
                    const notificationRef = doc(db, 'notifications', n.id);
                    batch.update(notificationRef, { read: true });
                });
                batch.commit().then(() => {
                    console.log('All notifications marked as read');
                }).catch(err => {
                    console.error('Error marking notifications as read:', err);
                });
            }
        }
    }, [isOpen, notifications]);

    const handleNotificationClick = async (notification) => {
        console.log('Notification clicked:', notification);
        // Delete the notification from Firestore
        try {
            await deleteDoc(doc(db, 'notifications', notification.id));
            console.log('Notification deleted:', notification.id);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
        // Navigate based on notification type
        switch (notification.type) {
            case 'collaboration_request':
                console.log('Navigating to My Trades');
                navigate('/my-trades');
                break;
            case 'message':
                console.log('Navigating to Messages:', notification.chatId);
                navigate(`/messages/${notification.chatId}`);
                break;
            default:
                console.log('Unknown notification type:', notification.type);
                break;
        }
        setIsOpen(false);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'collaboration_request':
                return '🤝';
            case 'message':
                return '💬';
            default:
                return '📢';
        }
    };

    // Debug render
    console.log('Rendering NotificationBell:', {
        isOpen,
        unreadCount,
        notificationsCount: notifications.length,
        isLoading,
        error
    });

    return (
        <div className="notification-bell-container" data-testid="notification-bell">
            <button 
                className="notification-bell-button"
                onClick={() => {
                    setIsOpen(!isOpen);
                }}
                title={`${unreadCount} unread notifications`}
                data-testid="notification-bell-button"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="notification-badge" data-testid="notification-badge">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown" data-testid="notification-dropdown">
                    {isLoading ? (
                        <div className="notification-empty">Loading notifications...</div>
                    ) : error ? (
                        <div className="notification-empty error-message">
                            {error}
                            <br />
                            <small>Please try refreshing the page</small>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="notification-empty">No notifications</div>
                    ) : (
                        notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                                data-testid={`notification-item-${notification.id}`}
                            >
                                <span className="notification-icon">
                                    {getNotificationIcon(notification.type)}
                                </span>
                                <div className="notification-content">
                                    <p className="notification-text">{notification.message}</p>
                                    <span className="notification-time">
                                        {notification.createdAt instanceof Date 
                                            ? notification.createdAt.toLocaleString()
                                            : new Date(notification.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell; 