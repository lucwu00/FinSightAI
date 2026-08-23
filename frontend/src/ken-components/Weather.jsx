import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

export default function Weather() {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Typography variant="h6">Weather</Typography>
        {/* Additional content here, which will now be able to stretch */}
      </CardContent>
    </Card>
  );
}
