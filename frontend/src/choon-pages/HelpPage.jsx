import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Container, Accordion, AccordionSummary, AccordionDetails, 
  Button, TextField, InputAdornment, Fade, Chip, Alert
} from '@mui/material';
import { ExpandMore, Email, Search, Help } from '@mui/icons-material';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPanel, setExpandedPanel] = useState(false);

  const faqs = [
    {
      question: 'How do I schedule a new meeting?',
      answer: "Navigate to the Schedule page and click the 'Schedule New Meeting' button. Fill in the meeting details and save.",
      tags: ['meeting', 'schedule', 'calendar']
    },
    {
      question: 'How do I edit or delete a meeting?',
      answer: 'On the Schedule page, use the Edit or Delete buttons next to each meeting.',
      tags: ['meeting', 'edit', 'delete', 'manage']
    },
    {
      question: 'How do I view my analytics dashboard?',
      answer: 'Access your analytics from the main dashboard to view meeting metrics and performance trends.',
      tags: ['analytics', 'dashboard', 'metrics', 'reports']
    },
    {
      question: 'Who can I contact for support?',
      answer: 'You can reach our support team through email at support@finsightai.com.',
      tags: ['support', 'contact', 'help', 'email']
    },
    {
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page and follow the email instructions to reset your password.',
      tags: ['password', 'reset', 'login', 'account']
    },
    {
      question: 'Can I integrate with other tools?',
      answer: 'Yes, FinSightAI supports integrations with popular CRM and calendar applications. Check Settings > Integrations.',
      tags: ['integration', 'crm', 'calendar', 'tools']
    }
  ];

  // Filter FAQs based on search query
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    
    return faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, faqs]);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        {/* Header */}
        <Fade in timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Help sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h3" fontWeight="600" color="text.primary" gutterBottom>
              Help Center
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Find answers to common questions
            </Typography>
            
            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: 500,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 4px 20px rgba(25,118,210,0.2)'
                  }
                }
              }}
            />
          </Box>
        </Fade>

        {/* Search Results Info */}
        {searchQuery && (
          <Fade in timeout={400}>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Chip 
                label={`${filteredFaqs.length} article${filteredFaqs.length !== 1 ? 's' : ''} found`}
                color={filteredFaqs.length > 0 ? 'primary' : 'default'}
                variant="outlined"
              />
            </Box>
          </Fade>
        )}

        {/* FAQ Section */}
        <Box sx={{ mb: 6 }}>
          {filteredFaqs.length === 0 ? (
            <Fade in timeout={600}>
              <Alert severity="info" sx={{ textAlign: 'center' }}>
                No articles found matching "{searchQuery}". Try different keywords or browse all articles.
                <Button 
                  size="small" 
                  onClick={() => setSearchQuery('')}
                  sx={{ ml: 2 }}
                >
                  Clear Search
                </Button>
              </Alert>
            </Fade>
          ) : (
            filteredFaqs.map((faq, index) => (
              <Fade in timeout={300 + index * 100} key={index}>
                <Accordion 
                  expanded={expandedPanel === `panel${index}`}
                  onChange={handleAccordionChange(`panel${index}`)}
                  sx={{ 
                    mb: 2, 
                    boxShadow: 'none', 
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    },
                    '&.Mui-expanded': {
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 20px rgba(25,118,210,0.15)'
                    },
                    '&:before': {
                      display: 'none'
                    }
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMore />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        margin: '16px 0'
                      }
                    }}
                  >
                    <Typography fontWeight="500" sx={{ fontSize: '1.1rem' }}>
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
                      {faq.answer}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {faq.tags.map((tag, tagIndex) => (
                        <Chip 
                          key={tagIndex}
                          label={tag}
                          size="small"
                          variant="outlined"
                          onClick={() => setSearchQuery(tag)}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'primary.main',
                              color: 'white'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Fade>
            ))
          )}
        </Box>
        {/* Contact Section */}
        <Fade in timeout={1000}>
          <Box sx={{ 
            textAlign: 'center', 
            py: 4, 
            borderTop: '1px solid #e0e0e0',
            borderRadius: 2,
            backgroundColor: 'rgba(25,118,210,0.02)'
          }}>
            <Typography variant="h5" fontWeight="500" gutterBottom>
              Still need help?
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              Can't find what you're looking for? Our support team is here to help you succeed.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Email />}
              href="mailto:2007arfan@gmail.com"
              size="large"
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(25,118,210,0.3)'
                }
              }}
            >
              2007arfan@gmail.com
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Average response time: 2-4 hours
            </Typography>
          </Box>
        </Fade>
      </Box>
    </Container>
  );
}