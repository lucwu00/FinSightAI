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
import BusinessIcon from '@mui/icons-material/Business';

export default function AIClientAnalytics({ open, onClose, clientData }) {
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && clientData && clientData.length > 0) {
      generateAIInsights();
    } else if (open && (!clientData || clientData.length === 0)) {
      setError('No client data available to analyze.');
    }
  }, [open, clientData]);

  const generateAIInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Perform local AI analysis
      const localAnalysis = performLocalAnalysis(clientData);
      
      // Get AI-powered insights from Gemini
      const aiPoweredInsights = await getAIRecommendations(localAnalysis, clientData);
      
      setAiInsights({
        ...localAnalysis,
        aiRecommendations: aiPoweredInsights
      });
    } catch (err) {
      console.error('AI Client Analysis error:', err);
      setError('Failed to generate AI insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const performLocalAnalysis = (clients) => {
    // Handle empty or invalid data
    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return {
        planDistribution: [],
        growthData: [],
        revenueAnalysis: { totalRevenue: 0, averageRevenue: 0 },
        riskAssessment: { riskLevel: 'Low', totalClients: 0 },
        totalClients: 0
      };
    }

    // Plan distribution analysis
    const planDistribution = analyzePlanDistribution(clients);
    
    // Client growth analysis
    const growthData = analyzeClientGrowth(clients);
    
    // Revenue analysis
    const revenueAnalysis = analyzeRevenue(clients);
    
    // Risk assessment
    const riskAssessment = assessClientRisks(clients);

    return {
      planDistribution,
      growthData,
      revenueAnalysis,
      riskAssessment,
      totalClients: clients.length
    };
  };

  const analyzePlanDistribution = (clients) => {
    const planCounts = clients.reduce((acc, client) => {
      acc[client.plan] = (acc[client.plan] || 0) + 1;
      return acc;
    }, {});

    const colors = {
      'Basic': '#4CAF50',
      'Premium': '#2196F3',
      'Enterprise': '#FF9800',
      'Pro': '#9C27B0',
      'Standard': '#607D8B'
    };

    return Object.entries(planCounts).map(([plan, count]) => ({
      name: plan,
      value: count,
      color: colors[plan] || '#757575'
    }));
  };

  const analyzeClientGrowth = (clients) => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const clientsInMonth = clients.filter(client => {
        const clientDate = new Date(client.createdAt);
        return clientDate.getMonth() === date.getMonth() && 
               clientDate.getFullYear() === date.getFullYear();
      }).length;
      
      months.push({
        month: monthName,
        clients: clientsInMonth
      });
    }
    
    return months;
  };

  const analyzeRevenue = (clients) => {
    const planValues = {
      'Basic': 29,
      'Premium': 79,
      'Enterprise': 199,
      'Pro': 149,
      'Standard': 49
    };

    const totalRevenue = clients.reduce((sum, client) => {
      return sum + (planValues[client.plan] || 0);
    }, 0);

    const planRevenue = clients.reduce((acc, client) => {
      const planValue = planValues[client.plan] || 0;
      acc[client.plan] = (acc[client.plan] || 0) + planValue;
      return acc;
    }, {});

    return {
      totalRevenue,
      planRevenue,
      averageRevenuePerClient: Math.round(totalRevenue / clients.length)
    };
  };

  const assessClientRisks = (clients) => {
    const totalClients = clients.length;
    const basicClients = clients.filter(c => c.plan === 'Basic').length;
    const premiumClients = clients.filter(c => c.plan === 'Premium' || c.plan === 'Pro' || c.plan === 'Enterprise').length;
    
    const basicPercentage = totalClients > 0 ? (basicClients / totalClients) * 100 : 0;
    const premiumPercentage = totalClients > 0 ? (premiumClients / totalClients) * 100 : 0;
    
    let riskLevel = 'Low';
    if (basicPercentage > 70) riskLevel = 'High';
    else if (basicPercentage > 50) riskLevel = 'Medium';

    return {
      totalClients,
      basicClients,
      premiumClients,
      basicPercentage: Math.round(basicPercentage),
      premiumPercentage: Math.round(premiumPercentage),
      riskLevel
    };
  };

  const getAIRecommendations = async (analysis, clients) => {
    try {
      const prompt = `
        You are a business analyst. Analyze this client data and provide actionable business recommendations in STRICT JSON format.
        
        Client Data:
        - Total Clients: ${analysis.totalClients}
        - Plan Distribution: ${JSON.stringify(analysis.planDistribution)}
        - Total Revenue: $${analysis.revenueAnalysis.totalRevenue}
        - Average Revenue Per Client: $${analysis.revenueAnalysis.averageRevenuePerClient}
        - Basic Plan Percentage: ${analysis.riskAssessment.basicPercentage}%
        - Premium Plan Percentage: ${analysis.riskAssessment.premiumPercentage}%
        - Risk Level: ${analysis.riskAssessment.riskLevel}
        
        IMPORTANT: Return ONLY valid JSON in this exact format (no additional text):
        {
          "assessment": "brief overall business assessment in 2-3 sentences",
          "recommendations": [
            {
              "title": "recommendation title",
              "description": "detailed business recommendation",
              "priority": "High",
              "impact": "expected business impact"
            },
            {
              "title": "second recommendation title",
              "description": "detailed business recommendation",
              "priority": "Medium",
              "impact": "expected business impact"
            },
            {
              "title": "third recommendation title",
              "description": "detailed business recommendation",
              "priority": "Low",
              "impact": "expected business impact"
            }
          ]
        }
        
        Focus on revenue optimization, client retention, and business growth.
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
        console.log('Raw AI response:', data.reply);
        
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
    const { basicPercentage, premiumPercentage, riskLevel } = analysis.riskAssessment;
    const { totalRevenue, averageRevenuePerClient } = analysis.revenueAnalysis;
    
    let assessment = "";
    let recommendations = [];
    
    if (premiumPercentage > 60) {
      assessment = "Your client portfolio shows strong premium adoption with healthy revenue streams. Focus on retention and expanding high-value services.";
    } else if (premiumPercentage > 30) {
      assessment = "Client portfolio has moderate premium adoption. Opportunities exist for upselling and revenue growth through plan upgrades.";
    } else {
      assessment = "Client portfolio is heavily weighted toward basic plans. Significant opportunity for revenue growth through strategic upselling and premium feature development.";
    }
    
    // Generate recommendations based on data
    if (basicPercentage > 60) {
      recommendations.push({
        title: "Implement Upselling Strategy",
        description: "High percentage of basic plan clients presents major revenue opportunity. Create targeted campaigns to upgrade clients to premium plans with value-added features.",
        priority: "High",
        impact: "Could increase revenue by 40-70%"
      });
    }
    
    if (averageRevenuePerClient < 100) {
      recommendations.push({
        title: "Develop Premium Features",
        description: "Low average revenue per client suggests need for higher-value service tiers. Introduce advanced features and enterprise solutions.",
        priority: "High",
        impact: "Could increase ARPC by 50-100%"
      });
    }
    
    if (riskLevel === 'High') {
      recommendations.push({
        title: "Client Retention Program",
        description: "Implement loyalty programs and exclusive benefits for long-term clients to reduce churn and increase lifetime value.",
        priority: "Medium",
        impact: "Could reduce churn by 20-30%"
      });
    } else {
      recommendations.push({
        title: "Market Expansion Strategy",
        description: "Strong client base allows for market expansion. Consider new market segments or geographic expansion to grow client portfolio.",
        priority: "Medium",
        impact: "Could increase client base by 25-50%"
      });
    }
    
    // Ensure we have at least 3 recommendations
    if (recommendations.length < 3) {
      recommendations.push({
        title: "Client Success Program",
        description: "Implement dedicated client success initiatives to improve satisfaction, reduce churn, and identify upselling opportunities.",
        priority: "Low",
        impact: "Improved client satisfaction and retention"
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
          <BusinessIcon />
          AI-Powered Client Analytics
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Analyzing client data with AI...</Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {!loading && !error && (!clientData || clientData.length === 0) && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No client data available to analyze. Please add some clients first.
          </Alert>
        )}
        
        {aiInsights && aiInsights.totalClients > 0 && (
          <Grid container spacing={3}>
            {/* Plan Distribution Pie Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Plan Distribution</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={aiInsights.planDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {aiInsights.planDistribution.map((entry, index) => (
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
            
            {/* Client Growth Bar Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>6-Month Client Growth</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={aiInsights.growthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="clients" fill="#4CAF50" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Revenue Analysis */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Revenue Analysis</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" color="primary">
                      ${aiInsights.revenueAnalysis.totalRevenue}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Monthly Revenue
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Revenue Per Client: ${aiInsights.revenueAnalysis.averageRevenuePerClient}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Clients: {aiInsights.totalClients}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Business Risk Assessment */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Business Risk Assessment</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {getRiskIcon(aiInsights.riskAssessment.riskLevel)}
                    <Typography variant="h6">
                      Risk Level: {aiInsights.riskAssessment.riskLevel}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Basic Plan Clients: {aiInsights.riskAssessment.basicPercentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Premium Plan Clients: {aiInsights.riskAssessment.premiumPercentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Clients: {aiInsights.riskAssessment.totalClients}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* AI Recommendations */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>AI-Powered Business Recommendations</Typography>
                  
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
