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
  CardContent,
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

export default function AIAnalytics({ open, onClose, userData }) {
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && userData.length > 0) {
      generateAIInsights();
    }
  }, [open, userData]);

  const generateAIInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Perform local AI analysis
      const localAnalysis = performLocalAnalysis(userData);
      
      // Get AI-powered insights from Gemini
      const aiPoweredInsights = await getAIRecommendations(localAnalysis, userData);
      
      setAiInsights({
        ...localAnalysis,
        aiRecommendations: aiPoweredInsights
      });
    } catch (err) {
      console.error('AI Analysis error:', err);
      setError('Failed to generate AI insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const performLocalAnalysis = (users) => {
    // User segmentation
    const segments = performUserSegmentation(users);
    
    // Activity analysis
    const activityData = analyzeUserActivity(users);
    
    // Risk assessment
    const riskAnalysis = assessUserRisks(users);
    
    // Growth trends
    const growthTrends = analyzeGrowthTrends(users);

    return {
      segments,
      activityData,
      riskAnalysis,
      growthTrends,
      totalUsers: users.length
    };
  };

  const performUserSegmentation = (users) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const activeUsers = users.filter(user => {
      const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
      return lastLogin && lastLogin >= oneWeekAgo;
    });
    
    const atRiskUsers = users.filter(user => {
      const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
      return lastLogin && lastLogin < oneWeekAgo && lastLogin >= oneMonthAgo;
    });
    
    const inactiveUsers = users.filter(user => {
      const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
      return !lastLogin || lastLogin < oneMonthAgo;
    });
    
    return [
      { name: 'Active Users', value: activeUsers.length, color: '#4CAF50', users: activeUsers },
      { name: 'At Risk', value: atRiskUsers.length, color: '#FF9800', users: atRiskUsers },
      { name: 'Inactive', value: inactiveUsers.length, color: '#F44336', users: inactiveUsers }
    ];
  };

  const analyzeUserActivity = (users) => {
    const now = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const activeCount = users.filter(user => {
        const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
        return lastLogin && lastLogin >= dayStart && lastLogin <= dayEnd;
      }).length;
      
      days.push({
        day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        users: activeCount
      });
    }
    
    return days;
  };

  const assessUserRisks = (users) => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => {
      const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return lastLogin && lastLogin >= oneWeekAgo;
    }).length;
    
    const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    const churnRisk = 100 - engagementRate;
    
    return {
      engagementRate: Math.round(engagementRate),
      churnRisk: Math.round(churnRisk),
      totalUsers,
      activeUsers,
      riskLevel: churnRisk > 50 ? 'High' : churnRisk > 30 ? 'Medium' : 'Low'
    };
  };

  const analyzeGrowthTrends = (users) => {
    const now = new Date();
    const thisMonth = users.filter(user => {
      const createdAt = new Date(user.dateCreated || user.createdAt);
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;
    
    const lastMonth = users.filter(user => {
      const createdAt = new Date(user.dateCreated || user.createdAt);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return createdAt.getMonth() === lastMonthDate.getMonth() && createdAt.getFullYear() === lastMonthDate.getFullYear();
    }).length;
    
    const growthRate = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
    
    return {
      thisMonth,
      lastMonth,
      growthRate: Math.round(growthRate),
      isGrowing: growthRate > 0
    };
  };

  const getAIRecommendations = async (analysis, users) => {
    try {
      const prompt = `
        You are a data analyst. Analyze this user data and provide actionable recommendations in STRICT JSON format.
        
        Data:
        - Total Users: ${analysis.totalUsers}
        - Active Users: ${analysis.segments[0].value}
        - At Risk Users: ${analysis.segments[1].value}
        - Inactive Users: ${analysis.segments[2].value}
        - Engagement Rate: ${analysis.riskAnalysis.engagementRate}%
        - Churn Risk: ${analysis.riskAnalysis.churnRisk}%
        - Growth Rate: ${analysis.growthTrends.growthRate}%
        
        IMPORTANT: Return ONLY valid JSON in this exact format (no additional text):
        {
          "assessment": "brief overall assessment in 2-3 sentences",
          "recommendations": [
            {
              "title": "recommendation title",
              "description": "detailed description",
              "priority": "High",
              "impact": "expected impact"
            },
            {
              "title": "second recommendation title",
              "description": "detailed description",
              "priority": "Medium",
              "impact": "expected impact"
            },
            {
              "title": "third recommendation title",
              "description": "detailed description",
              "priority": "Low",
              "impact": "expected impact"
            }
          ]
        }
        
        Priority must be exactly: "High", "Medium", or "Low"
        Return only the JSON object, no markdown formatting or additional text.
      `;

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI recommendations');
      }

      const data = await response.json();
      
      try {
        // Clean the response - remove any markdown formatting
        let cleanedResponse = data.reply.trim();
        
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
    const engagementRate = analysis.riskAnalysis.engagementRate;
    const churnRisk = analysis.riskAnalysis.churnRisk;
    const growthRate = analysis.growthTrends.growthRate;
    
    let assessment = "";
    let recommendations = [];
    
    if (engagementRate > 70) {
      assessment = "Your user engagement is healthy with strong activity levels. Focus on maintaining current strategies while exploring growth opportunities.";
    } else if (engagementRate > 40) {
      assessment = "User engagement shows moderate levels with room for improvement. Consider implementing targeted retention strategies.";
    } else {
      assessment = "User engagement is concerning with high churn risk. Immediate action is needed to improve user retention and activity.";
    }
    
    // Generate recommendations based on data
    if (churnRisk > 60) {
      recommendations.push({
        title: "Implement User Retention Program",
        description: "High churn risk detected. Create targeted campaigns to re-engage inactive users with personalized content and incentives.",
        priority: "High",
        impact: "Could reduce churn by 25-40%"
      });
    }
    
    if (engagementRate < 50) {
      recommendations.push({
        title: "Enhance User Onboarding",
        description: "Low engagement suggests users may not be finding value quickly. Improve onboarding flow and initial user experience.",
        priority: "High",
        impact: "Could improve engagement by 30-50%"
      });
    }
    
    if (growthRate < 0) {
      recommendations.push({
        title: "Focus on User Acquisition",
        description: "Negative growth trend requires immediate attention. Invest in marketing and referral programs to attract new users.",
        priority: "Medium",
        impact: "Could reverse negative growth trend"
      });
    } else {
      recommendations.push({
        title: "Optimize User Experience",
        description: "Continuously improve user interface and add features based on user feedback to maintain satisfaction.",
        priority: "Medium",
        impact: "Could increase user satisfaction by 20-30%"
      });
    }
    
    // Ensure we have at least 3 recommendations
    if (recommendations.length < 3) {
      recommendations.push({
        title: "Implement Analytics Dashboard",
        description: "Create comprehensive analytics to track user behavior patterns and identify improvement opportunities.",
        priority: "Low",
        impact: "Better decision-making capabilities"
      });
    }
    
    return {
      assessment,
      recommendations: recommendations.slice(0, 3) // Limit to 3 recommendations
    };
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'High': return <WarningIcon color="error" />;
      case 'Medium': return <TrendingDownIcon color="warning" />;
      case 'Low': return <CheckCircleIcon color="success" />;
      default: return <CheckCircleIcon color="success" />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon />
          AI-Powered User Analytics
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Analyzing user data with AI...</Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {aiInsights && (
          <Grid container spacing={3}>
            {/* User Segmentation Pie Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>User Segmentation</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={aiInsights.segments}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {aiInsights.segments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Activity Trends Bar Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>7-Day Activity Trends</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={aiInsights.activityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="users" fill="#2196F3" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Risk Assessment */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Risk Assessment</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {getRiskIcon(aiInsights.riskAnalysis.riskLevel)}
                    <Typography variant="h6">
                      Risk Level: {aiInsights.riskAnalysis.riskLevel}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Engagement Rate: {aiInsights.riskAnalysis.engagementRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Churn Risk: {aiInsights.riskAnalysis.churnRisk}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users: {aiInsights.riskAnalysis.activeUsers} / {aiInsights.riskAnalysis.totalUsers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Growth Trends */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Growth Trends</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {aiInsights.growthTrends.isGrowing ? 
                      <TrendingUpIcon color="success" /> : 
                      <TrendingDownIcon color="error" />
                    }
                    <Typography variant="h6">
                      {aiInsights.growthTrends.growthRate}% Growth
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    This Month: {aiInsights.growthTrends.thisMonth} new users
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Month: {aiInsights.growthTrends.lastMonth} new users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* AI Recommendations */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>AI-Powered Recommendations</Typography>
                  
                  {aiInsights.aiRecommendations?.assessment && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>AI Assessment:</strong> {aiInsights.aiRecommendations.assessment}
                      </Typography>
                    </Alert>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {aiInsights.aiRecommendations?.recommendations?.map((rec, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {rec.title}
                        </Typography>
                        <Chip 
                          label={rec.priority} 
                          color={getPriorityColor(rec.priority)}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {rec.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Expected Impact: {rec.impact}
                      </Typography>
                      {index < aiInsights.aiRecommendations.recommendations.length - 1 && (
                        <Divider sx={{ mt: 2 }} />
                      )}
                    </Box>
                  ))}
                </CardContent>
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
