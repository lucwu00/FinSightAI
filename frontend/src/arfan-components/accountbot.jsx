import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, TextField, IconButton, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

export default function AccountBot() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you with your account today?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Uncomment and update this section to connect to your backend
    // try {
    //   const res = await fetch('/api/chatbot', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ message: input })
    //   });
    //   const data = await res.json();
    //   setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    // } catch (err) {
    //   setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, there was an error.' }]);
    // }

    // For now, just echo the message as a bot reply
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: "This is a placeholder response." }]);
    }, 700);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Paper elevation={3} sx={{ width: 400, p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Account Assistant Bot
        </Typography>
        <Box sx={{ height: 250, bgcolor: '#f5f5f5', borderRadius: 2, mb: 2, p: 2, overflowY: 'auto' }}>
          {messages.map((msg, idx) => (
            <Typography
              key={idx}
              align={msg.sender === 'user' ? 'right' : 'left'}
              color={msg.sender === 'user' ? 'primary' : 'text.secondary'}
              fontSize={14}
              sx={{ mb: 1 }}
            >
              {msg.text}
            </Typography>
          ))}
          <div ref={messagesEndRef} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type your message..."
            variant="outlined"
            sx={{ borderRadius: 2 }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <IconButton color="primary" onClick={handleSend}>
            <SendIcon />
          </IconButton>
        </Box>
        <Button
          variant="outlined"
          color="secondary"
          sx={{ mt: 2, width: '100%' }}
          onClick={() => setMessages([
            { sender: 'bot', text: 'Hello! How can I help you with your account today?' }
          ])}
        >
          End Chat
        </Button>
      </Paper>
    </Box>
  );
}