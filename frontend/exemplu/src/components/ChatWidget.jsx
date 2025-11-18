import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchOnlineUsers = useCallback(async () => {
    if (!user?.email) return;
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .neq('email', user.email)
        .order('is_online', { ascending: false })
        .order('last_seen', { ascending: false });

      if (error) throw error;
      setOnlineUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [user?.email]);

  const updateOnlineStatus = useCallback(
    async (isOnline) => {
      if (!user?.email) return;

      try {
        const { error } = await supabase
          .from('chat_users')
          .upsert(
            {
              email: user.email,
              display_name: user.email.split('@')[0],
              is_online: isOnline,
              last_seen: new Date().toISOString(),
            },
            { onConflict: 'email' }
          );

        if (error) throw error;
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    },
    [user?.email]
  );

  useEffect(() => {
    if (user?.email) {
      updateOnlineStatus(true);
      fetchOnlineUsers();

      const interval = setInterval(() => {
        updateOnlineStatus(true);
      }, 30000);

      return () => {
        clearInterval(interval);
        updateOnlineStatus(false);
      };
    }
  }, [user?.email, updateOnlineStatus, fetchOnlineUsers]);

  useEffect(() => {
    if (!user?.email) return;

    const channel = supabase
      .channel('online-users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_users',
        },
        () => {
          fetchOnlineUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, fetchOnlineUsers]);

  useEffect(() => {
    if (isOpen && user?.email) {
      fetchOnlineUsers();
    }
  }, [isOpen, user?.email, fetchOnlineUsers]);

  const fetchMessages = useCallback(
    async (otherUserEmail) => {
      if (!user?.email) return;

      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .or(
            `and(sender_email.eq.${user.email},receiver_email.eq.${otherUserEmail}),and(sender_email.eq.${otherUserEmail},receiver_email.eq.${user.email})`
          )
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          throw error;
        }

        setMessages(data || []);

        // Mark received messages as read
        await supabase
          .from('chat_messages')
          .update({ is_read: true })
          .eq('receiver_email', user.email)
          .eq('sender_email', otherUserEmail)
          .eq('is_read', false);

        setUnreadCounts((prev) => ({ ...prev, [otherUserEmail]: 0 }));
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    },
    [user?.email]
  );

  // Real-time message subscription - THIS IS THE KEY FIX
  useEffect(() => {
    // We need both the current user and an active chat to subscribe
    if (!user?.email || !activeChat?.email) {
      // If there's no active chat, clear the messages
      setMessages([]);
      return;
    }

    // Initial load of messages for the active chat
    fetchMessages(activeChat.email);

    // Create a stable channel name using sorted emails
    const channelName = [user.email, activeChat.email]
      .sort()
      .join('-')
      .replace(/[^a-zA-Z0-9-]/g, '_');

    const channel = supabase
      .channel(`chat-${channelName}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMsg = payload.new;

          const isRelevant =
            (newMsg.sender_email === user.email &&
              newMsg.receiver_email === activeChat.email) ||
            (newMsg.sender_email === activeChat.email &&
              newMsg.receiver_email === user.email);

          if (isRelevant) {
            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === newMsg.id);
              if (exists) {
                return prev;
              }
              return [...prev, newMsg];
            });

            if (newMsg.receiver_email === user.email) {
              supabase
                .from('chat_messages')
                .update({ is_read: true })
                .eq('id', newMsg.id);
            }
          }
        }
      )
      .subscribe();

    // Cleanup function: remove the channel when the component unmounts
    // or when the active chat changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, activeChat?.email, fetchMessages]); // Re-run when activeChat.email changes

  const fetchUnreadCounts = useCallback(async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('sender_email')
        .eq('receiver_email', user.email)
        .eq('is_read', false);

      if (error) throw error;

      const counts = {};
      data?.forEach((msg) => {
        counts[msg.sender_email] = (counts[msg.sender_email] || 0) + 1;
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      fetchUnreadCounts();
      const interval = setInterval(fetchUnreadCounts, 5000);
      return () => clearInterval(interval);
    }
  }, [user?.email, fetchUnreadCounts]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !activeChat || !user?.email || isSending) {
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    const messageData = {
      sender_email: user.email,
      receiver_email: activeChat.email,
      message: messageText,
      is_read: false,
    };

    try {
      console.time('insert-duration');

      // Add timeout to insert operation
      const insertPromise = supabase
        .from('chat_messages')
        .insert([messageData]);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Insert timeout')), 5000)
      );

      const { error } = await Promise.race([insertPromise, timeoutPromise]);

      console.timeEnd('insert-duration');

      if (error) {
        console.error('Error inserting message:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        alert(`Failed to send message: ${error.message}`);
        setNewMessage(messageText);
      }
    } catch (error) {
      console.error('Caught error sending message:', error);
      if (error.message === 'Insert timeout') {
        alert(
          'Message send timed out. Please check your connection and try again.'
        );
      }
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const openChat = (chatUser) => {
    setActiveChat(chatUser);
  };

  const filteredUsers = useMemo(
    () =>
      onlineUsers.filter((u) =>
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [onlineUsers, searchQuery]
  );

  const totalUnread = useMemo(
    () => Object.values(unreadCounts).reduce((sum, count) => sum + count, 0),
    [unreadCounts]
  );

  if (!user) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)',
            fontSize: '28px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          💬
          {totalUnread > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '0',
            right: '20px',
            width: '400px',
            height: '600px',
            background: '#1a1a1a',
            borderRadius: '16px 16px 0 0',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
            border: '1px solid #333',
            borderBottom: 'none',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background:
                'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '24px' }}>💬</span>
              <h3
                style={{
                  color: '#000',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  margin: 0,
                }}
              >
                {activeChat
                  ? activeChat.display_name ||
                    activeChat.email.split('@')[0]
                  : 'Chat'}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {activeChat && (
                <button
                  onClick={() => setActiveChat(null)}
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: 'none',
                    color: '#000',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  ← Back
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: 'none',
                  color: '#000',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {!activeChat ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #333',
                  background: '#0a0a0a',
                }}
              >
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '8px',
                }}
              >
                {filteredUsers.length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#666',
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '48px',
                        marginBottom: '12px',
                        opacity: 0.5,
                      }}
                    >
                      👥
                    </span>
                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                      No users found
                    </p>
                    <p
                      style={{
                        margin: '4px 0',
                        fontSize: '12px',
                        opacity: 0.7,
                      }}
                    >
                      Users will appear here once they log in
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((chatUser) => (
                    <div
                      key={chatUser.email}
                      onClick={() => openChat(chatUser)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        marginBottom: '4px',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          'rgba(34, 197, 94, 0.1)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      <div style={{ position: 'relative' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background:
                              'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '18px',
                          }}
                        >
                          {chatUser.email[0].toUpperCase()}
                        </div>
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: chatUser.is_online
                              ? '#22c55e'
                              : '#6b7280',
                            border: '2px solid #1a1a1a',
                          }}
                        ></span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: '14px',
                            marginBottom: '2px',
                          }}
                        >
                          {chatUser.display_name ||
                            chatUser.email.split('@')[0]}
                        </div>
                        <div
                          style={{
                            color: chatUser.is_online
                              ? '#22c55e'
                              : '#6b7280',
                            fontSize: '12px',
                          }}
                        >
                          {chatUser.is_online ? 'Online' : 'Offline'}
                        </div>
                      </div>
                      {unreadCounts[chatUser.email] > 0 && (
                        <span
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                          }}
                        >
                          {unreadCounts[chatUser.email]}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {messages.length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#666',
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '48px',
                        marginBottom: '12px',
                        opacity: 0.5,
                      }}
                    >
                      💬
                    </span>
                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                      No messages yet
                    </p>
                    <p
                      style={{
                        margin: '4px 0',
                        fontSize: '12px',
                        opacity: 0.7,
                      }}
                    >
                      Start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSent = msg.sender_email === user.email;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: isSent
                            ? 'flex-end'
                            : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '70%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: isSent
                              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                              : '#2a2a2a',
                            color: 'white',
                          }}
                        >
                          <div>{msg.message}</div>
                          <div
                            style={{
                              fontSize: '10px',
                              marginTop: '4px',
                              opacity: 0.7,
                              textAlign: 'right',
                            }}
                          >
                            {new Date(msg.created_at).toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={sendMessage}
                style={{
                  padding: '16px',
                  borderTop: '1px solid #333',
                  display: 'flex',
                  gap: '8px',
                  background: '#0a0a0a',
                }}
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isSending}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    opacity: isSending ? 0.6 : 1,
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  style={{
                    padding: '10px 20px',
                    background:
                      newMessage.trim() && !isSending
                        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                        : '#444',
                    border: 'none',
                    borderRadius: '8px',
                    color:
                      newMessage.trim() && !isSending ? '#000' : '#666',
                    cursor:
                      newMessage.trim() && !isSending
                        ? 'pointer'
                        : 'not-allowed',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  {isSending ? '...' : 'Send'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}