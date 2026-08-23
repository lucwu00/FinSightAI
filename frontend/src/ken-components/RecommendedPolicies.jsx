import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Box,
  TableContainer,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  Stack
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import PolicyIcon from '@mui/icons-material/Policy';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HomeIcon from '@mui/icons-material/Home';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';


function getPolicyIcon(type) {
  switch (type) {
    case 'Health':
      return <HealthAndSafetyIcon color="primary" fontSize="small" />;
    case 'Life':
      return <FavoriteIcon color="error" fontSize="small" />;
    case 'Home':
      return <HomeIcon color="success" fontSize="small" />;
    case 'Auto':
      return <DirectionsCarIcon color="info" fontSize="small" />;
    default:
      return <PolicyIcon color="action" fontSize="small" />;
  }
}

const actionColors = {
  'Contact Client': 'primary',
  'Review': 'warning',
  'Send Quote': 'info',
  'Follow Up': 'secondary',
  'Enroll': 'success',
};

export default function RecommendedPolicies() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      const res = await fetch("/api/policies/recommendedPolicies");
      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      console.error("Failed to fetch recommendations", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line
  }, []);

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6" gutterBottom>
            Recommended Policies
          </Typography>
          <IconButton onClick={fetchRecommendations} disabled={refreshing} size="small" aria-label="Refresh">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress />
          </Box>
        ) : recommendations.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flex={1} py={4}>
            <SentimentDissatisfiedIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
            <Typography color="text.secondary">No recommendations available.</Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            <TableContainer component={Paper}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Client</TableCell>
                    <TableCell>Policy</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Reasoning</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recommendations.map((rec, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{rec.clientName}</TableCell>
                      <TableCell>{rec.recommendedPolicy}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {getPolicyIcon(rec.productType)}
                          <Typography variant="body2">{rec.productType}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={rec.reasoning} arrow placement="top">
                          <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                            {rec.reasoning}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rec.suggestedAction}
                          color={actionColors[rec.suggestedAction] || 'default'}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
