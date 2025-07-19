import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel
} from '@mui/material';

import {
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // <-- Add this import

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); 

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      // Only try to parse JSON if there is content
      let data = {};
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }

      console.log(data);

      if (response.ok && data.username) {
        localStorage.setItem('username', data.username);
        localStorage.setItem('email', data.email);
        localStorage.setItem('status', data.status); // Store user status
        navigate('/userManagement');
      } else {
        alert(data.error || 'Login failed');
        console.log("Has error")
      }
    } catch (err) {
      alert('Network error');
      console.error(err);
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
        padding: 2
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ padding: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              textAlign: 'center',
              fontWeight: 600,
              color: '#333',
              marginBottom: 1
            }}
          >
            Welcome Back
          </Typography>

          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: '#666',
              marginBottom: 3
            }}>
            Sign in to your account
          </Typography>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              sx={{ marginBottom: 2 }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              required
              sx={{ marginBottom: 2 }}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 3
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" color="textSecondary">
                    Remember me
                  </Typography>
                }
              />

              <Link
                href="#"
                variant="body2"
                sx={{
                  textDecoration: 'none',
                  color: '#1976d2',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{
                background: 'linear-gradient(45deg, #1976d2, #1565c0)',
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: 3,
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0, #0d47a1)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              SIGN IN
            </Button>
          </Box>

          {/* Sign Up Link */}
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: '#666'
            }}
          >
            Don't have an account?{' '}
            <RouterLink
              to="/signup"
              style={{
                color: '#1976d2',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Sign up here!
            </RouterLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}