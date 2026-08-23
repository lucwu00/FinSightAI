
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Avatar,
  Stack,
  IconButton,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  LinearProgress,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import EmailIcon from "@mui/icons-material/Email";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import Reveal from "reveal.js";

import Chart from "chart.js/auto";
import { useParams, useNavigate } from "react-router-dom";
import ClientNoteModal from "../ken-components/ClientNoteModal";
import CalendarEventModal from "../ken-components/CalendarEventModal";

import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/white.css';


export default function ClientProfile() {
  const { id: clientId } = useParams();
  const [client, setClient] = useState(null);
  const [gapsData, setGapsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealInitialized, setRevealInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  const coverageChartRef = useRef(null);
  const gapsRadarRef = useRef(null);
  const chartsRendered = useRef(false);
  const revealRef = useRef(null);
  const ganttChartRef = useRef(null);
  
  const navigate = useNavigate();

  // Fullscreen functionality
  const toggleFullscreen = () => {
    const revealElement = document.querySelector('.reveal');
    if (!isFullscreen) {
      if (revealElement.requestFullscreen) {
        revealElement.requestFullscreen();
      } else if (revealElement.webkitRequestFullscreen) {
        revealElement.webkitRequestFullscreen();
      } else if (revealElement.msRequestFullscreen) {
        revealElement.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleOpenNoteModal = () => {
    setNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setNoteModalOpen(false);
  };

  const handleNoteSaved = (note) => {
    // Optionally update the client in the local state
    if (client) {
      setClient(prevClient => ({ ...prevClient, notes: note }));
    }
  };

  const handleOpenCalendarModal = () => {
    setCalendarModalOpen(true);
  };

  const handleCloseCalendarModal = () => {
    setCalendarModalOpen(false);
  };

  const handleEventCreated = (event) => {
    // Optionally show success message or update UI
    console.log('Event created:', event);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [clientRes, gapsRes] = await Promise.all([
          fetch(`/api/clients/${clientId}/details`),
          fetch(`/api/clients/${clientId}/gaps-insights`),
        ]);

        if (!clientRes.ok || !gapsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const clientJson = await clientRes.json();
        const gapsJson = await gapsRes.json();
        
        setClient(clientJson);
        setGapsData(gapsJson);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setClient(null);
        setGapsData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [clientId]);

  // Initialize Reveal.js after data is loaded and DOM is ready
  useEffect(() => {
    let mounted = true;

    if (!loading && client && gapsData && !revealInitialized) {
      // Render charts first
      renderCharts();

      // Initialize Reveal.js only once after a delay
      requestAnimationFrame(() => {
        const timer = setTimeout(() => {
        if (mounted && !revealInitialized) {
          const deck = document.querySelector('.reveal');
          if (deck) {
            try {
              const reveal = new Reveal(deck, {
                embedded: true,
                hash: false,
                controls: true,
                progress: true,
                center: true,
                transition: 'slide',
                width: 800,     
                height: 600,
                margin: 0.04,
                minScale: 0.2,
                maxScale: 1.5,
                scale: 0.75,
          
              });
              
              reveal.initialize().then(() => {
                if (mounted) {
                  revealRef.current = reveal;
                  setRevealInitialized(true);
                }
              });
            } catch (err) {
              console.error("Failed to initialize Reveal.js:", err);
            }
          }
        }
      }, 500);

      return () => {
        mounted = false;
        clearTimeout(timer);
      };
      })
      
    }
  }, [loading, client, gapsData, revealInitialized]);

  // Cleanup function
  useEffect(() => {
    return () => {
      chartsRendered.current = false;
      
      // Cleanup charts first
      if (coverageChartRef.current) {
        coverageChartRef.current.destroy();
        coverageChartRef.current = null;
      }

      if (gapsRadarRef.current) {
        gapsRadarRef.current.destroy();
        gapsRadarRef.current = null;
      }

      // Cleanup Reveal.js last
      if (revealRef.current) {
        try {
          const deck = document.querySelector('.reveal');
          if (deck) {
            revealRef.current.destroy();
          }
        } catch (err) {
          console.warn("Reveal cleanup failed:", err);
        }
        revealRef.current = null;
        setRevealInitialized(false);
      }
    };
  }, []);

  function renderCharts() {
    console.log('Attempting to render charts with:', {
      hasClientPolicies: !!client?.policies,
      policiesLength: client?.policies?.length,
      hasGapsData: !!gapsData,
      alreadyRendered: chartsRendered.current
    });

    if (!client?.policies || !gapsData || chartsRendered.current) return;

    // Coverage Donut
    const ctxPie = document.getElementById("coverageChart");
    console.log('Found pie chart element:', !!ctxPie);
    if (ctxPie && Array.isArray(client.policies) && client.policies.length > 0) {
      // Destroy previous chart if exists
      if (coverageChartRef.current) {
        coverageChartRef.current.destroy();
      }

      const counts = {};
      client.policies.forEach((p) => {
        counts[p.productType] = (counts[p.productType] || 0) + 1;
      });

      coverageChartRef.current = new Chart(ctxPie, {
        type: "doughnut",
        data: {
          labels: Object.keys(counts),
          datasets: [
            {
              data: Object.values(counts),
              backgroundColor: ["#42a5f5", "#66bb6a", "#ffa726", "#ab47bc"],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        },
      });
    }

    // Radar Chart from Gemini
    const ctxRadar = document.getElementById("gapsRadar");
    const radarLabels = [
      "Life Coverage",
      "Critical Illness",
      "Accident Protection",
      "Education Planning",
      "Retirement Income",
      "Property Insurance",
    ];

    // Convert radarData object into an array matching the above labels order
    const scores = radarLabels.map(label => gapsData?.radarData?.[label] ?? 0) || [50, 50, 50, 50, 50, 50];

    console.log("gapsData scores:", scores);
    
    if (ctxRadar && scores.length > 0) {
      if (gapsRadarRef.current) {
        gapsRadarRef.current.destroy();
      }
      
      gapsRadarRef.current = new Chart(ctxRadar, {
        type: "radar",
        data: {
          labels: radarLabels,
          datasets: [
            {
              label: "Coverage Score",
              data: scores,
              backgroundColor: "rgba(66, 165, 245, 0.2)",
              borderColor: "#42a5f5",
              borderWidth: 2,
              pointBackgroundColor: "#42a5f5",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              ticks: {
                stepSize: 10,
                max: 100,
              },
            },
          },
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
          },
        },
      });
    }

    // Gantt Chart (Maturity Timeline)
    const ctxGantt = document.getElementById("ganttChart");
    if (ctxGantt && Array.isArray(client.policies) && client.policies.length > 0) {
      if (ganttChartRef.current) {
        ganttChartRef.current.destroy();
      }

      // Prepare data for Gantt chart
      const labels = client.policies.map(p => p.policyName);
      const startDates = client.policies.map(p => new Date(p.startDate));
      const endDates = client.policies.map(p => new Date(p.endDate));
      const minDate = Math.min(...startDates.map(d => d.getTime()));
      const maxDate = Math.max(...endDates.map(d => d.getTime()));
      const data = client.policies.map((p, i) => {
        const start = new Date(p.startDate).getTime();
        const end = new Date(p.endDate).getTime();
        return [start, end];
      });

      ganttChartRef.current = new Chart(ctxGantt, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Maturity Timeline',
            data: data.map(([start, end]) => end - start),
            backgroundColor: '#42a5f5',
            base: data.map(([start]) => start - minDate),
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.8,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const i = context.dataIndex;
                  const start = new Date(startDates[i]).toLocaleDateString();
                  const end = new Date(endDates[i]).toLocaleDateString();
                  return ` ${start} → ${end}`;
                }
              }
            }
          },
          scales: {
            x: {
              min: 0,
              max: maxDate - minDate,
              ticks: {
                callback: function(value) {
                  const date = new Date(minDate + value);
                  return date.getFullYear();
                }
              },
              title: { display: true, text: 'Year' },
              grid: { display: false },
            },
            y: {
              title: { display: false },
              grid: { display: false },
            }
          }
        }
      });
    }

    chartsRendered.current = true;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading client data...</Typography>
      </Box>
    );
  }

  if (!client) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography color="error">Failed to load client data</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: "100%", overflow: "hidden" }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/dashboard")}
      >
        Back to Dashboard
      </Button>
      
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Overview</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar>{client?.fullName?.[0] || '?'}</Avatar>
          <Box>
            <Typography fontWeight="bold">{client?.fullName || 'Loading...'}</Typography>
            <Typography variant="body2" color="text.secondary">ID: {client?.clientId || 'N/A'}</Typography>
          </Box>
          <IconButton onClick={handleOpenCalendarModal}><CalendarTodayIcon /></IconButton>
          <IconButton onClick={handleOpenNoteModal}><NoteAddIcon /></IconButton>
          <IconButton 
            onClick={() => client?.email && window.open(`mailto:${client.email}`, "_blank")}
            disabled={!client?.email}
          >
            <EmailIcon />
          </IconButton>
          <IconButton 
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Show loading state while Reveal.js initializes */}
      {!revealInitialized && (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress size={24} />
          <Typography sx={{ ml: 2 }}>Loading presentation...</Typography>
        </Box>
      )}

      {/* Reveal Slides */}
      <div 
        className="reveal" 
        style={{
          height: "650px",
          maxHeight: "650px", 
          maxWidth: "900px", 
          margin: "0 auto",
          visibility: revealInitialized ? 'visible' : 'hidden',     
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)"
        }}
      >
        <div className="slides" style={{ height: "100%" }}>
          {/* Slide 1: Policy Coverage */}
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              minHeight: "300px",
              padding: 16,
              
              boxSizing: "border-box",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Policy Coverage
            </Typography>
            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              alignItems="center"
              justifyContent="center"
              gap={4}
              width="100%"
              height="100%"
            >
              <div style={{ width: "300px", height: "300px", position: "relative" }}>
                <canvas
                  id="coverageChart"
                  style={{ width: "100%", height: "100%" }}
                ></canvas>
              </div>
              <Box>
                {Array.isArray(client?.policies) && client.policies.length > 0 ? (
                  Object.entries(
                    client.policies.reduce((acc, p) => {
                      acc[p.productType] = (acc[p.productType] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([type, count]) => {
                    const percent = ((count / client.policies.length) * 100).toFixed(1);
                    return (
                      <Typography key={type} sx={{ mb: 1 }}>
                        {type}: {count} ({percent}%)
                      </Typography>
                    );
                  })
                ) : (
                  <Typography color="text.secondary">No policies found</Typography>
                )}
              </Box>
            </Box>
          </section>
           {/* Slide 2: Maturity Timeline (Gantt Chart) */}
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              minHeight: "300px",
              padding: 16,
              boxSizing: "border-box",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Maturity Timeline
            </Typography>
            <Box sx={{ width: '90%', height: 340, maxWidth: 900 }}>
              <canvas id="ganttChart" style={{ width: '100%', height: 340 }}></canvas>
            </Box>
          </section>
          {/* Slide 3: Policy Breakdown */}
          <section
            style={{
              minHeight: "700px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              padding: 16,
              boxSizing: "border-box",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Policy Breakdown
            </Typography>
            <Table size="small" sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Premium</TableCell>
                  <TableCell>Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {client.policies.map((p) => {
                  const totalDays = new Date(p.endDate) - new Date(p.startDate);
                  const elapsed = Date.now() - new Date(p.startDate);
                  const pct =
                    totalDays > 0 ? Math.min(100, Math.max(0, (elapsed / totalDays) * 100)) : 0;
                  return (
                    <TableRow key={p.policyId}>
                      <TableCell>{p.policyName}</TableCell>
                      <TableCell>{p.productType}</TableCell>
                      <TableCell>{p.startDate}</TableCell>
                      <TableCell>{p.endDate}</TableCell>
                      <TableCell>{p.status}</TableCell>
                      <TableCell>${p.premium?.toFixed(2) ?? "0.00"}</TableCell>
                      <TableCell sx={{ width: 150 }}>
                        <LinearProgress variant="determinate" value={pct} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </section>

          {/* Slide 4: Gaps & Opportunities */}
          <section
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              padding: 16,
              boxSizing: "border-box",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                flexWrap: "wrap",
                justifyContent: "center",
                textAlign: "left",
              }}
            >
              <Box sx={{ maxWidth: 300, minWidth: 280 }}>
                <Typography variant="h6" gutterBottom>
                  Gaps & Opportunities
                </Typography>
                <ul style={{ paddingLeft: 16, fontSize: "0.9rem", lineHeight: 1.5 }}>
                  {(gapsData?.insights || []).map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </Box>
              <div style={{ width: "320px", height: "320px", position: "relative" }}>
                <canvas
                  id="gapsRadar"
                  style={{ width: "100%", height: "100%" }}
                ></canvas>
              </div>
            </Box>
          </section>
        </div>
      </div>

      {/* Client Note Modal */}
      <ClientNoteModal
        open={noteModalOpen}
        onClose={handleCloseNoteModal}
        clientId={client?.clientId}
        clientName={client?.fullName}
        onNoteSaved={handleNoteSaved}
      />

      {/* Calendar Event Modal */}
      <CalendarEventModal
        open={calendarModalOpen}
        onClose={handleCloseCalendarModal}
        clientId={client?.clientId}
        clientName={client?.fullName}
        clientEmail={client?.email}
        onEventCreated={handleEventCreated}
      />
    </Box>
  );
}