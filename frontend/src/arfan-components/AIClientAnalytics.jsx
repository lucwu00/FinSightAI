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
        riskProfileDistribution: [],
        occupationDistribution: [],
        growthData: [],
        revenueAnalysis: { totalRevenue: 0, averageRevenue: 0 },
        riskAssessment: { riskLevel: 'Low', totalClients: 0 },
        totalClients: 0
      };
    }

    // Risk profile distribution analysis
    const riskProfileDistribution = analyzeRiskProfileDistribution(clients);
    
    // Occupation distribution analysis
    const occupationDistribution = analyzeOccupationDistribution(clients);
    
    // Client growth analysis
    const growthData = analyzeClientGrowth(clients);
    
    // Revenue analysis
    const revenueAnalysis = analyzeRevenue(clients);
    
    // Risk assessment
    const riskAssessment = assessClientRisks(clients);

    return {
      riskProfileDistribution,
      occupationDistribution,
      growthData,
      revenueAnalysis,
      riskAssessment,
      totalClients: clients.length
    };
  };

  const analyzeRiskProfileDistribution = (clients) => {
    const riskProfileCounts = clients.reduce((acc, client) => {
      const riskProfile = client.riskProfile || 'Unknown';
      acc[riskProfile] = (acc[riskProfile] || 0) + 1;
      return acc;
    }, {});

    const colors = {
      'Conservative': '#4CAF50',
      'Balanced': '#2196F3', 
      'Aggressive': '#FF9800',
      'Unknown': '#757575'
    };

    return Object.entries(riskProfileCounts).map(([profile, count]) => ({
      name: profile,
      value: count,
      color: colors[profile] || '#757575'
    }));
  };

  const analyzeOccupationDistribution = (clients) => {
    const occupationCounts = clients.reduce((acc, client) => {
      const occupation = client.occupation || 'Unknown';
      acc[occupation] = (acc[occupation] || 0) + 1;
      return acc;
    }, {});

    // Get top 5 occupations for better visualization
    const sortedOccupations = Object.entries(occupationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#607D8B'];

    return sortedOccupations.map(([occupation, count], index) => ({
      name: occupation,
      value: count,
      color: colors[index] || '#757575'
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
    const totalRevenue = clients.reduce((sum, client) => {
      const annualIncome = parseFloat(client.annualIncome) || 0;
      return sum + annualIncome;
    }, 0);

    const riskProfileRevenue = clients.reduce((acc, client) => {
      const riskProfile = client.riskProfile || 'Unknown';
      const annualIncome = parseFloat(client.annualIncome) || 0;
      acc[riskProfile] = (acc[riskProfile] || 0) + annualIncome;
      return acc;
    }, {});

    const averageRevenuePerClient = clients.length > 0 ? Math.round(totalRevenue / clients.length) : 0;

    return {
      totalRevenue,
      riskProfileRevenue,
      averageRevenuePerClient,
      totalAnnualIncome: totalRevenue
    };
  };

  const assessClientRisks = (clients) => {
    const totalClients = clients.length;
    const conservativeClients = clients.filter(c => c.riskProfile === 'Conservative').length;
    const aggressiveClients = clients.filter(c => c.riskProfile === 'Aggressive').length;
    const balancedClients = clients.filter(c => c.riskProfile === 'Balanced').length;
    
    const conservativePercentage = totalClients > 0 ? (conservativeClients / totalClients) * 100 : 0;
    const aggressivePercentage = totalClients > 0 ? (aggressiveClients / totalClients) * 100 : 0;
    const balancedPercentage = totalClients > 0 ? (balancedClients / totalClients) * 100 : 0;
    
    // Calculate average annual income for risk assessment
    const averageIncome = clients.length > 0 ? 
      clients.reduce((sum, c) => sum + (parseFloat(c.annualIncome) || 0), 0) / clients.length : 0;
    
    let riskLevel = 'Low';
    if (conservativePercentage > 70 && averageIncome < 50000) riskLevel = 'High';
    else if (conservativePercentage > 50 || averageIncome < 75000) riskLevel = 'Medium';

    return {
      totalClients,
      conservativeClients,
      aggressiveClients,
      balancedClients,
      conservativePercentage: Math.round(conservativePercentage),
      aggressivePercentage: Math.round(aggressivePercentage),
      balancedPercentage: Math.round(balancedPercentage),
      averageIncome: Math.round(averageIncome),
      riskLevel
    };
  };

  const getAIRecommendations = async (analysis, clients) => {
    try {
      const prompt = `
        You are a financial advisory business analyst. Analyze this client data and provide actionable business recommendations in STRICT JSON format.
        
        Client Data:
        - Total Clients: ${analysis.totalClients}
        - Risk Profile Distribution: ${JSON.stringify(analysis.riskProfileDistribution)}
        - Top Occupations: ${JSON.stringify(analysis.occupationDistribution)}
        - Total Annual Income: $${analysis.revenueAnalysis.totalAnnualIncome}
        - Average Annual Income Per Client: $${analysis.revenueAnalysis.averageRevenuePerClient}
        - Conservative Risk Profile: ${analysis.riskAssessment.conservativePercentage}%
        - Balanced Risk Profile: ${analysis.riskAssessment.balancedPercentage}%
        - Aggressive Risk Profile: ${analysis.riskAssessment.aggressivePercentage}%
        - Business Risk Level: ${analysis.riskAssessment.riskLevel}
        - Average Client Income: $${analysis.riskAssessment.averageIncome}
        
        IMPORTANT: Return ONLY valid JSON in this exact format (no additional text):
        {
          "assessment": "brief overall business assessment focusing on client portfolio composition and income potential in 2-3 sentences",
          "recommendations": [
            {
              "title": "recommendation title",
              "description": "detailed financial advisory business recommendation",
              "priority": "High",
              "impact": "expected business impact"
            },
            {
              "title": "second recommendation title", 
              "description": "detailed financial advisory business recommendation",
              "priority": "Medium",
              "impact": "expected business impact"
            },
            {
              "title": "third recommendation title",
              "description": "detailed financial advisory business recommendation", 
              "priority": "Low",
              "impact": "expected business impact"
            }
          ]
        }
        
        Focus on client portfolio diversification, risk profile optimization, and advisory service growth.
        Priority must be exactly: "High", "Medium", or "Low"
        Return only the JSON object, no markdown formatting or additional text.
      `;

      const response = await fetch('/api/gemini-direct/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt })
      });

      console.log('Client Analytics Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Client Analytics API Error:', errorText);
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
    const { conservativePercentage, aggressivePercentage, balancedPercentage, riskLevel, averageIncome } = analysis.riskAssessment;
    const { totalAnnualIncome, averageRevenuePerClient } = analysis.revenueAnalysis;
    
    let assessment = "";
    let recommendations = [];
    
    if (aggressivePercentage > 50) {
      assessment = "Your client portfolio shows strong appetite for aggressive investments with high income potential. Focus on sophisticated investment products and wealth management services.";
    } else if (balancedPercentage > 40) {
      assessment = "Client portfolio demonstrates balanced risk approach with moderate to high income levels. Opportunities exist for diversified portfolio growth and comprehensive financial planning.";
    } else {
      assessment = "Client portfolio is conservative-focused with varying income levels. Significant opportunity for risk education and gradual portfolio diversification to enhance returns.";
    }
    
    // Generate recommendations based on data
    if (conservativePercentage > 60) {
      recommendations.push({
        title: "Risk Profile Education Program",
        description: "High percentage of conservative clients presents opportunity for risk education workshops and gradual portfolio diversification to balanced and aggressive options.",
        priority: "High",
        impact: "Could increase portfolio diversification by 30-40%"
      });
    }
    
    if (averageIncome < 100000) {
      recommendations.push({
        title: "Target High-Net-Worth Clients",
        description: "Current average income suggests opportunity to attract higher-income clients through premium advisory services and sophisticated investment products.",
        priority: "High", 
        impact: "Could increase average client value by 50-100%"
      });
    }
    
    if (riskLevel === 'High') {
      recommendations.push({
        title: "Portfolio Diversification Strategy",
        description: "Implement comprehensive portfolio review program to help conservative clients understand benefits of balanced investment approaches and risk-adjusted returns.",
        priority: "Medium",
        impact: "Could improve client portfolio performance by 20-30%"
      });
    } else {
      recommendations.push({
        title: "Wealth Management Expansion",
        description: "Strong client income base allows for expanded wealth management services including estate planning, tax optimization, and alternative investments.",
        priority: "Medium",
        impact: "Could increase revenue per client by 25-50%"
      });
    }
    
    // Ensure we have at least 3 recommendations
    if (recommendations.length < 3) {
      recommendations.push({
        title: "Client Advisory Enhancement",
        description: "Implement regular portfolio reviews and personalized financial planning sessions to strengthen client relationships and identify growth opportunities.",
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
          AI-Powered Financial Advisory Analytics
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
            {/* Risk Profile Distribution Pie Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Risk Profile Distribution</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={aiInsights.riskProfileDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {aiInsights.riskProfileDistribution.map((entry, index) => (
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
            
            {/* Top Occupations Pie Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Top Client Occupations</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={aiInsights.occupationDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {aiInsights.occupationDistribution.map((entry, index) => (
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
            <Grid item xs={12}>
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
            
            {/* Income Analysis */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Client Income Analysis</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" color="primary">
                      ${aiInsights.revenueAnalysis.totalAnnualIncome.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Annual Client Income
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Income Per Client: ${aiInsights.revenueAnalysis.averageRevenuePerClient.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Clients: {aiInsights.totalClients}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Risk Profile Assessment */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Portfolio Risk Assessment</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {getRiskIcon(aiInsights.riskAssessment.riskLevel)}
                    <Typography variant="h6">
                      Risk Level: {aiInsights.riskAssessment.riskLevel}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Conservative Clients: {aiInsights.riskAssessment.conservativePercentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Balanced Clients: {aiInsights.riskAssessment.balancedPercentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Aggressive Clients: {aiInsights.riskAssessment.aggressivePercentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Income: ${aiInsights.riskAssessment.averageIncome.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* AI Recommendations */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>AI-Powered Financial Advisory Recommendations</Typography>
                  
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
