import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function AIAnalytics({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);

  const getAIRecommendations = async (analysis) => {
    try {
      const prompt = `
        You are a financial advisory business analyst. Analyze this business data and provide actionable business recommendations in STRICT JSON format.
        
        Business Data:
        - Total Active Users: ${analysis.activeUsers}
        - Total Administrators: ${analysis.totalAdmins}
        - Growth Rate: ${analysis.growthRate}%
        - Revenue per User: $${analysis.revenuePerUser}
        - Total Business Revenue: $${analysis.totalRevenue}
        - System Health: ${analysis.systemHealth}%
        - User Engagement Rate: ${analysis.userEngagement}%
        - Conversion Rate: ${analysis.conversionRate}%
        
        IMPORTANT: Return ONLY valid JSON in this exact format (no additional text):
        {
          "assessment": "brief overall business assessment focusing on growth opportunities and operational efficiency in 2-3 sentences",
          "recommendations": [
            {
              "title": "recommendation title",
              "description": "detailed business improvement recommendation",
              "priority": "High",
              "impact": "expected business impact"
            },
            {
              "title": "second recommendation title", 
              "description": "detailed business improvement recommendation",
              "priority": "Medium",
              "impact": "expected business impact"
            },
            {
              "title": "third recommendation title",
              "description": "detailed business improvement recommendation", 
              "priority": "Low",
              "impact": "expected business impact"
            }
          ]
        }
        
        Focus on user acquisition, revenue optimization, and operational efficiency.
        Priority must be exactly: "High", "Medium", or "Low"
        Return only the JSON object, no markdown formatting or additional text.
      `;

      const response = await fetch('/api/gemini-direct/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt })
      });

      console.log('AI Analytics Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Analytics API Error:', errorText);
        throw new Error(`Failed to get AI recommendations: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      try {
        // Clean the response - remove any markdown formatting
        let cleanedResponse = data.summary.trim();
        
        // Remove markdown code blocks if present
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Find the JSON object in the response
        const jsonStart = cleanedResponse.indexOf('{');
        const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
          const aiResponse = JSON.parse(jsonString);
          
          // Validate the response structure
          if (aiResponse.assessment && aiResponse.recommendations && Array.isArray(aiResponse.recommendations)) {
            return aiResponse;
          } else {
            throw new Error('Invalid JSON structure');
          }
        } else {
          throw new Error('No JSON object found in response');
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        
        // Return a fallback structured response based on the data
        const fallbackRecommendations = generateFallbackRecommendations(analysis);
        return fallbackRecommendations;
      }
    } catch (error) {
      console.error('AI Recommendations error:', error);
      
      // Return a fallback structured response
      const fallbackRecommendations = generateFallbackRecommendations(analysis);
      return fallbackRecommendations;
    }
  };

  const generateFallbackRecommendations = (analysis) => {
    return {
      assessment: `Based on current metrics showing ${analysis.activeUsers} active users with ${analysis.growthRate}% growth rate and $${analysis.revenuePerUser} revenue per user, the business shows promising potential but requires strategic optimization in key areas.`,
      recommendations: [
        {
          title: "Optimize User Acquisition",
          description: `With current user engagement at ${analysis.userEngagement}%, focus on improving onboarding processes and implementing targeted marketing campaigns to boost user acquisition and retention.`,
          priority: "High",
          impact: "Could increase active users by 25-40% within 6 months"
        },
        {
          title: "Revenue Per User Enhancement",
          description: `Current revenue per user is $${analysis.revenuePerUser}. Implement premium features, tiered pricing models, and upselling strategies to increase average revenue per user.`,
          priority: "Medium", 
          impact: "Potential 15-30% increase in revenue per user"
        },
        {
          title: "System Performance Optimization",
          description: `With ${analysis.systemHealth}% system health, invest in infrastructure improvements and performance monitoring to ensure scalability and user satisfaction.`,
          priority: "Low",
          impact: "Improved user experience and reduced churn"
        }
      ]
    };
  };

  const performLocalAnalysis = () => {
    // Mock business analytics data - replace with actual data in production
    return {
      activeUsers: 1247,
      totalAdmins: 8,
      growthRate: 12.5,
      revenuePerUser: 185.50,
      totalRevenue: 231265,
      systemHealth: 94.2,
      userEngagement: 78.6,
      conversionRate: 4.8
    };
  };

  const generateAIInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Perform local business analysis
      const localAnalysis = performLocalAnalysis();
      
      // Get AI-powered insights from Gemini
      const aiPoweredInsights = await getAIRecommendations(localAnalysis);
      
      setRecommendations({
        ...aiPoweredInsights,
        analysisData: localAnalysis
      });
    } catch (err) {
      console.error('AI Analytics Error:', err);
      setError('Failed to generate AI insights. Please try again.');
      
      // Set fallback recommendations
      const localAnalysis = performLocalAnalysis();
      const fallbackInsights = generateFallbackRecommendations(localAnalysis);
      setRecommendations({
        ...fallbackInsights,
        analysisData: localAnalysis
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      generateAIInsights();
    }
  }, [open]);

  const getMetricTrend = (value, threshold = 50) => {
    if (value >= threshold) {
      return { icon: <TrendingUpIcon color="success" />, color: 'success' };
    } else {
      return { icon: <TrendingDownIcon color="error" />, color: 'error' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'info';
      default: return 'default';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <TrendingUpIcon color="primary" />
          AI Business Analytics & Recommendations
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Analyzing business data with AI...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {recommendations && !loading && (
          <Grid container spacing={3}>
            {/* Key Metrics Overview */}
            <Grid item xs={12}>
              <Card sx={{ p: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Business Metrics Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {recommendations.analysisData.activeUsers}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Active Users
                      </Typography>
                      {getMetricTrend(recommendations.analysisData.activeUsers, 1000).icon}
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {recommendations.analysisData.growthRate}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Growth Rate
                      </Typography>
                      {getMetricTrend(recommendations.analysisData.growthRate, 10).icon}
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        ${recommendations.analysisData.revenuePerUser}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Revenue/User
                      </Typography>
                      {getMetricTrend(recommendations.analysisData.revenuePerUser, 150).icon}
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {recommendations.analysisData.systemHealth}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        System Health
                      </Typography>
                      {getMetricTrend(recommendations.analysisData.systemHealth, 90).icon}
                    </Box>
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* AI Assessment */}
            <Grid item xs={12}>
              <Card sx={{ p: 3, mb: 2 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <CheckCircleIcon color="success" />
                  <Typography variant="h6">
                    AI Business Assessment
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  {recommendations.assessment}
                </Typography>
              </Card>
            </Grid>

            {/* AI Recommendations */}
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Strategic Recommendations
                </Typography>
                <Grid container spacing={2}>
                  {recommendations.recommendations.map((rec, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Card sx={{ p: 2, height: '100%', border: '1px solid #e0e0e0' }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Chip 
                            label={rec.priority} 
                            color={getPriorityColor(rec.priority)}
                            size="small"
                          />
                          <Typography variant="h6" component="div">
                            {rec.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" paragraph>
                          {rec.description}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Expected Impact:
                          </Typography>
                          <Typography variant="body2" color="primary">
                            {rec.impact}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Grid>

            {/* Performance Charts */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Business Performance Metrics
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Users', value: recommendations.analysisData.activeUsers / 10 },
                    { name: 'Growth', value: recommendations.analysisData.growthRate },
                    { name: 'Revenue/User', value: recommendations.analysisData.revenuePerUser / 10 },
                    { name: 'System Health', value: recommendations.analysisData.systemHealth },
                    { name: 'Engagement', value: recommendations.analysisData.userEngagement }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2196F3" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Priority Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'High Priority', value: recommendations.recommendations.filter(r => r.priority === 'High').length },
                        { name: 'Medium Priority', value: recommendations.recommendations.filter(r => r.priority === 'Medium').length },
                        { name: 'Low Priority', value: recommendations.recommendations.filter(r => r.priority === 'Low').length }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {recommendations.recommendations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={generateAIInsights} variant="contained" disabled={loading}>
          Refresh Analysis
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AIAnalytics;
