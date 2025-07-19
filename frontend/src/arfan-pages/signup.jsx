import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // Import RouterLink
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Divider,
  Link
} from '@mui/material';

function SignUp() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch('/api/SignUp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const result = await response.json();
      if (response.ok) {
        alert('Sign up successful!');
        localStorage.setItem('email', result.email);
        localStorage.setItem('username', result.username);
        setForm({ username: '', email: '', password: '' });
        navigate('/userManagement'); 
      } 
      else {
        alert(result.error || 'Sign up failed.');
      }

    } 

    catch (error) {
      alert('Error connecting to server.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFF4F4',
        fontFamily: 'Roboto, Arial, sans-serif' 
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 350, maxWidth: '90vw' }}>
        <Typography variant="h5" align="center" gutterBottom>
          Sign Up
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            fullWidth
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <TextField
            margin="normal"
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <TextField
            margin="normal"
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, mb: 2 }}
          >
            Submit
          </Button>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box textAlign="center">
          <Typography variant="body2">Have an account?</Typography>
          <Link component={RouterLink} to="/Login" variant="body2">
            Sign in here!
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}

export default SignUp;
