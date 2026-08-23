import React from "react";
import { Checkbox, FormGroup, FormControlLabel } from "@mui/material";

// Converts camelCase or snake_case to "Title Case"
function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")       // insert space before uppercase
    .replace(/_/g, " ")               // replace underscores
    .replace(/^./, (s) => s.toUpperCase()); // capitalize first letter
}

export default function WidgetSelector({ allKeys, selected, toggle }) {
  return (
    <FormGroup row sx={{ mb: 2 }}>
      {allKeys.map((key) => (
        <FormControlLabel
          key={key}
          control={
            <Checkbox
              checked={selected.has(key)}
              onChange={() => toggle(key)}
            />
          }
          label={formatLabel(key)}
        />
      ))}
    </FormGroup>
  );
}
