export function validateFormInline(data) {
  const errors = {};

  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.full_name = "Name must be at least 2 characters.";
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Invalid email format.";
  }

  if (data.phone && !/^\+65\s?[89]\d{7}$/.test(data.phone)) {
    errors.phone = "Phone must start with +65 and be 8 digits long (starting with 8 or 9).";
  }

  if (!data.email && !data.phone) {
    errors.email = "Either email or phone must be provided.";
    errors.phone = "Either phone or email must be provided.";
  }

  if (!data.nric || !/^[STFG]\d{7}[A-Z]$/.test(data.nric.toUpperCase())) {
    errors.nric = "NRIC is required and must follow format: S1234567D.";
  }

  if (!data.start_date) {
    errors.start_date = "Start date is required.";
  }

  if (!data.end_date) {
    errors.end_date = "End date is required.";
  }

  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (start > end) {
      errors.start_date = "Start date must be before end date.";
      errors.end_date = "End date must be after start date.";
    }
  }

  if (data.premium_amount === '' || data.premium_amount === undefined) {
    errors.premium_amount = "Premium amount is required.";
  } else if (isNaN(data.premium_amount) || data.premium_amount < 100) {
    errors.premium_amount = "Amount must be a number and ≥ 100.";
  }

  if (!data.premium_frequency || data.premium_frequency.trim() === "") {
    errors.premium_frequency = "Premium frequency is required.";
  }

  if (!data.product_type || data.product_type.trim() === "") {
    errors.product_type = "Product Type is required.";
  }

  if (
    data.product_type &&
    data.product_type.toLowerCase().includes("investment-linked") &&
    (!data.fund_type || data.fund_type.trim() === "")
  ) {
    errors.fund_type = "Fund Type required for ILPs.";
  }

  return errors;
}
