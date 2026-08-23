import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Chip,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

export default function TopProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    try {
      // Get userId from localStorage
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.warn('No userId found in localStorage');
        setLoading(false);
        return;
      }

      console.log('Fetching top products for userId:', userId);
      const response = await fetch(`/api/policies/top-products?userId=${userId}`);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      if (response.ok) {
        setProducts(data || []); // data is the array directly, not data.products
        // Calculate total revenue from the products
        const total = data.reduce((sum, product) => sum + product.totalRevenue, 0);
        setTotalRevenue(total);
      } else {
        console.error('Failed to fetch top products:', data.error);
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductIcon = (rank) => {
    switch (rank) {
      case 1:
        return <TrophyIcon sx={{ color: '#FFD700' }} />;
      case 2:
        return <TrophyIcon sx={{ color: '#C0C0C0' }} />;
      case 3:
        return <TrophyIcon sx={{ color: '#CD7F32' }} />;
      default:
        return <TrendingUpIcon color="primary" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPercentage = (revenue) => {
    return totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, overflow: 'hidden' }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h2">
            Top Performing Products
          </Typography>
          <Chip
            icon={<MoneyIcon />}
            label={`Total: ${formatCurrency(totalRevenue)}`}
            color="primary"
            size="small"
          />
        </Box>

        {products.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No product data available
            </Typography>
          </Box>
        ) : (
          <List sx={{ 
            py: 0, 
            overflow: 'auto', 
            maxHeight: 'calc(100% - 80px)',
            pr: 1, // Add right padding to prevent scrollbar overlap
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#c1c1c1',
              borderRadius: '3px',
              '&:hover': {
                backgroundColor: '#a8a8a8',
              },
            },
          }}>
            {products.map((product, index) => {
              const rank = index + 1;
              const percentage = getPercentage(product.totalRevenue);
              
              return (
                <ListItem
                  key={product.productType}
                  sx={{
                    px: 0,
                    py: 1,
                    borderBottom: index < products.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getProductIcon(rank)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {product.productType}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(product.totalRevenue)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Stack spacing={0.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {product.policyCount} policies
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: '#f0f0f0',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 2,
                              backgroundColor: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#1976d2'
                            }
                          }}
                        />
                      </Stack>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
