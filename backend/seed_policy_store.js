// seed_policy_store.js - Seed script to populate Policy Store with data from policyConfig.js
const db = require('./models');

// Policy data from your policyConfig.js (converted to backend format)
const policyData = [
  {
    policyId: "PT001",
    name: "Whole Life",
    category: "Life Insurance",
    description: "Permanent life insurance with guaranteed death benefit and cash value accumulation",
    detailedDescription: "Whole Life Insurance provides lifelong coverage with a guaranteed death benefit that will never decrease, premiums that will never increase, and cash value that grows at a guaranteed rate. The policy combines insurance protection with a savings component that builds cash value over time. Policyholders can borrow against the cash value or withdraw funds, making it a versatile financial planning tool.",
    defaultCoverageAmount: 500000,
    defaultPremium: 2500,
    defaultFrequency: "Annually",
    protections: [
      "Guaranteed death benefit for beneficiaries",
      "Cash value accumulation with guaranteed growth",
      "Loan facility against cash value",
      "Tax-deferred cash value growth",
      "Dividend participation (for participating policies)",
      "Estate planning benefits",
      "Final expense coverage"
    ],
    legalTerms: [
      "Death Benefit: The amount paid to beneficiaries upon the insured's death",
      "Cash Surrender Value: The amount available if the policy is terminated early",
      "Non-forfeiture Values: Guaranteed benefits that cannot be lost",
      "Incontestability Clause: Policy cannot be contested after 2 years",
      "Grace Period: 30-day period to pay overdue premiums",
      "Automatic Premium Loan: Feature that pays premiums using cash value",
      "Dividend: Annual distribution of profits to policyholders"
    ],
    coverage: {
      deathBenefit: "Guaranteed death benefit ranging from $50,000 to $10,000,000",
      cashValue: "Guaranteed cash value growth with potential dividends",
      premiums: "Level premiums for life"
    },
    eligibility: "Ages 0-75, medical underwriting required",
    exclusions: "Suicide within first 2 years, war exclusion, aviation exclusion (non-commercial)"
  },
  {
    policyId: "PT002",
    name: "Term Life",
    category: "Life Insurance",
    description: "Affordable temporary life insurance for specific period with renewable options",
    detailedDescription: "Term Life Insurance provides coverage for a specific period (term) at lower premiums compared to permanent insurance. It offers pure insurance protection without cash value accumulation. Ideal for income replacement, debt protection, and temporary financial obligations. Available in level term (fixed premiums) and increasing/decreasing term options.",
    defaultCoverageAmount: 750000,
    defaultPremium: 500,
    defaultFrequency: "Annually",
    protections: [
      "High coverage amounts at low cost",
      "Income replacement for dependents",
      "Debt and mortgage protection",
      "Business loan coverage",
      "Convertibility to permanent insurance",
      "Renewable without medical exam",
      "Waiver of premium rider available"
    ],
    legalTerms: [
      "Level Term: Premiums remain constant during term period",
      "Renewable Term: Right to renew without medical examination",
      "Convertible Term: Option to convert to permanent insurance",
      "Return of Premium: Feature returning premiums if no claim is made",
      "Term Period: Specific duration of coverage (10, 15, 20, 30 years)",
      "Premium Guarantee Period: Period during which premiums cannot increase",
      "Conversion Period: Time limit for converting to permanent insurance"
    ],
    coverage: {
      deathBenefit: "Coverage from $100,000 to $5,000,000",
      termPeriods: "10, 15, 20, or 30-year terms available",
      renewability: "Renewable up to age 95 without medical exam"
    },
    eligibility: "Ages 18-70, simplified underwriting available",
    exclusions: "Suicide within first 2 years, misrepresentation, aviation exclusion"
  },
  {
    policyId: "PT003",
    name: "Investment-Linked",
    category: "Life Insurance",
    description: "Life insurance combined with investment opportunities in various funds",
    detailedDescription: "Investment-Linked Policies (ILP) combine life insurance protection with investment opportunities. Premiums are allocated between insurance costs and investment funds chosen by the policyholder. The cash value and death benefit fluctuate based on investment performance. Offers flexibility in premium payments and fund switching options.",
    defaultCoverageAmount: 300000,
    defaultPremium: 1800,
    defaultFrequency: "Annually",
    protections: [
      "Life insurance protection with investment growth potential",
      "Multiple fund options for diversification",
      "Flexibility in premium payments",
      "Fund switching capabilities",
      "Partial withdrawals allowed",
      "Top-up facility for additional investments",
      "Professional fund management"
    ],
    legalTerms: [
      "Investment Risk: Policyholder bears investment risk",
      "Unit Price: Daily valuation of fund units",
      "Allocation Rate: Percentage of premium invested after charges",
      "Fund Management Charge: Annual fee for fund management",
      "Surrender Charge: Fee for early policy termination",
      "Free Look Period: 14-day period to review and cancel policy",
      "Fund Switching: Right to move investments between funds"
    ],
    coverage: {
      deathBenefit: "Variable death benefit based on fund performance",
      investmentOptions: "Equity, bond, balanced, and money market funds",
      flexibility: "Flexible premium payments and fund switching"
    },
    eligibility: "Ages 18-65, investment knowledge assessment required",
    exclusions: "Investment losses, currency fluctuation risks, fund closure risks"
  },
  {
    policyId: "PT004",
    name: "Endowment",
    category: "Life Insurance",
    description: "Life insurance with guaranteed maturity benefit for savings and protection",
    detailedDescription: "Endowment Insurance provides both life insurance protection and a savings component with guaranteed maturity benefit. If the insured survives the policy term, the full sum assured plus bonuses are paid. Combines protection with forced savings, making it ideal for specific financial goals like education funding or retirement planning.",
    defaultCoverageAmount: 400000,
    defaultPremium: 2000,
    defaultFrequency: "Annually",
    protections: [
      "Guaranteed maturity benefit upon survival",
      "Death benefit for family protection",
      "Annual bonus declarations",
      "Terminal bonus at maturity",
      "Loan facility against surrender value",
      "Tax benefits on premiums and maturity",
      "Forced savings discipline"
    ],
    legalTerms: [
      "Maturity Benefit: Amount payable if insured survives policy term",
      "Annual Bonus: Yearly addition to sum assured",
      "Terminal Bonus: Additional payment at maturity or death",
      "Reversionary Bonus: Bonus that becomes part of sum assured",
      "Vesting Bonus: Bonus guaranteed once declared",
      "Paid-up Value: Reduced coverage if premiums are discontinued",
      "Surrender Value: Amount receivable on early termination"
    ],
    coverage: {
      deathBenefit: "Sum assured plus accrued bonuses",
      maturityBenefit: "Guaranteed payment at policy maturity",
      bonuses: "Annual and terminal bonuses based on company performance"
    },
    eligibility: "Ages 18-55, policy term 10-35 years",
    exclusions: "Suicide within first year, natural disasters, war risks"
  },
  {
    policyId: "PT005",
    name: "Retirement Plan",
    category: "Life Insurance",
    description: "Long-term retirement savings with annuity options and tax benefits",
    detailedDescription: "Retirement Planning Insurance provides systematic savings for post-retirement income. Offers various annuity options including immediate and deferred annuities. Features include flexible premium payments, investment choices, and guaranteed income streams. Designed to supplement government retirement benefits and maintain lifestyle post-retirement.",
    defaultCoverageAmount: 800000,
    defaultPremium: 3000,
    defaultFrequency: "Annually",
    protections: [
      "Guaranteed retirement income for life",
      "Protection against longevity risk",
      "Multiple annuity payout options",
      "Spouse continuation benefits",
      "Inflation protection riders available",
      "Tax-deferred growth during accumulation",
      "Estate protection features"
    ],
    legalTerms: [
      "Annuitant: Person who receives annuity payments",
      "Accumulation Phase: Period of premium payments and growth",
      "Annuitization: Conversion of accumulated value to income stream",
      "Life Annuity: Payments continue for annuitant's lifetime",
      "Period Certain: Guaranteed payments for specific period",
      "Joint and Survivor: Payments continue for two lives",
      "Mortality Credits: Enhanced returns from pooled longevity risk"
    ],
    coverage: {
      accumulationPhase: "Flexible premiums with investment growth",
      annuityPhase: "Guaranteed income for life or specific period",
      options: "Life annuity, joint life, certain period annuities"
    },
    eligibility: "Ages 25-60 for accumulation phase",
    exclusions: "Early withdrawal penalties, market risks (variable annuities)"
  },
  {
    policyId: "PT006",
    name: "Personal Accident",
    category: "Health Insurance",
    description: "Comprehensive coverage for accidental injuries, disability, and death",
    detailedDescription: "Personal Accident Insurance provides financial protection against accidents resulting in injury, disability, or death. Covers medical expenses, income replacement during recovery, and compensation for permanent disabilities. Essential for active individuals and those in high-risk occupations. Offers worldwide coverage with 24/7 emergency assistance.",
    defaultCoverageAmount: 200000,
    defaultPremium: 300,
    defaultFrequency: "Annually",
    protections: [
      "Accidental death benefit up to sum assured",
      "Permanent total disability compensation",
      "Permanent partial disability benefits",
      "Temporary total disability income",
      "Medical expense reimbursement",
      "Emergency medical evacuation",
      "Worldwide coverage including travel"
    ],
    legalTerms: [
      "Accident: Sudden, unforeseen, and involuntary event",
      "Permanent Total Disability: Complete inability to work permanently",
      "Permanent Partial Disability: Loss of use of body parts",
      "Temporary Total Disability: Temporary inability to work",
      "Medical Expenses: Reasonable and necessary treatment costs",
      "Disability Scale: Predetermined compensation percentages",
      "Waiting Period: Time before disability benefits commence"
    ],
    coverage: {
      accidentalDeath: "Lump sum payment to beneficiaries",
      permanentDisability: "Compensation based on disability scale",
      temporaryDisability: "Weekly income replacement"
    },
    eligibility: "Ages 16-70, occupation-based underwriting",
    exclusions: "Self-inflicted injuries, war, terrorism, extreme sports without riders"
  },
  {
    policyId: "PT007",
    name: "Long-Term Care",
    category: "Health Insurance",
    description: "Coverage for extended care services due to chronic illness or disability",
    detailedDescription: "Long-Term Care Insurance covers the cost of extended care services when you cannot perform basic activities of daily living due to chronic illness, disability, or cognitive impairment. Includes coverage for nursing home care, assisted living facilities, adult day care, and home healthcare services. Essential protection against the high costs of long-term care.",
    defaultCoverageAmount: 150000,
    defaultPremium: 1200,
    defaultFrequency: "Annually",
    protections: [
      "Nursing home care coverage",
      "Home healthcare services",
      "Assisted living facility benefits",
      "Adult day care services",
      "Respite care for family caregivers",
      "Care coordination services",
      "Inflation protection options"
    ],
    legalTerms: [
      "Activities of Daily Living (ADL): Basic self-care tasks",
      "Cognitive Impairment: Loss of intellectual capacity",
      "Elimination Period: Waiting period before benefits begin",
      "Benefit Period: Maximum duration of benefit payments",
      "Care Plan: Formal assessment of care needs",
      "Informal Care: Care provided by family/friends",
      "Restoration of Benefits: Renewal of full benefits after recovery"
    ],
    coverage: {
      nursingHome: "Daily benefit for nursing home care",
      homeCare: "Coverage for home healthcare services",
      assistedLiving: "Benefits for assisted living facilities"
    },
    eligibility: "Ages 40-75, health questionnaire required",
    exclusions: "Pre-existing conditions, self-inflicted conditions, alcohol/drug abuse"
  },
  {
    policyId: "PT008",
    name: "Hospitalization",
    category: "Health Insurance",
    description: "Medical insurance covering hospital expenses and related healthcare costs",
    detailedDescription: "Hospitalization Insurance provides comprehensive coverage for hospital expenses including room charges, surgical procedures, diagnostic tests, and specialist consultations. Offers cashless treatment at network hospitals and reimbursement for eligible medical expenses. Includes pre and post-hospitalization coverage with optional riders for enhanced protection.",
    defaultCoverageAmount: 100000,
    defaultPremium: 800,
    defaultFrequency: "Annually",
    protections: [
      "Inpatient hospitalization expenses",
      "Surgical and medical procedures",
      "ICU and CCU charges",
      "Diagnostic tests and imaging",
      "Specialist doctor consultations",
      "Pre and post-hospitalization care",
      "Cashless treatment at network hospitals"
    ],
    legalTerms: [
      "Hospitalization: Admission as inpatient for minimum 24 hours",
      "Pre-existing Disease: Medical condition before policy inception",
      "Waiting Period: Time before certain conditions are covered",
      "Sublimits: Maximum amounts for specific benefits",
      "Network Hospital: Hospitals with cashless facility",
      "Room Rent Capping: Limit on daily room charges",
      "Copayment: Percentage of claim borne by insured"
    ],
    coverage: {
      roomCharges: "Daily room and boarding expenses",
      surgicalExpenses: "Coverage for surgical procedures",
      diagnostics: "Laboratory tests and imaging studies"
    },
    eligibility: "Ages 18-65, family floater options available",
    exclusions: "Cosmetic surgery, experimental treatments, non-allopathic treatments"
  },
  {
    policyId: "PT009",
    name: "Critical Illness",
    category: "Health Insurance",
    description: "Lump sum benefit upon diagnosis of specified critical illnesses",
    detailedDescription: "Critical Illness Insurance provides a lump sum benefit upon diagnosis of specified critical illnesses such as cancer, heart attack, stroke, and kidney failure. The benefit can be used for treatment costs, income replacement, or lifestyle modifications. Offers peace of mind and financial security during health crises with worldwide coverage and second medical opinion services.",
    defaultCoverageAmount: 250000,
    defaultPremium: 1000,
    defaultFrequency: "Annually",
    protections: [
      "Lump sum payment upon diagnosis",
      "Coverage for 30+ critical illnesses",
      "Cancer care including all stages",
      "Heart attack and stroke coverage",
      "Kidney failure and organ transplants",
      "Second medical opinion services",
      "Worldwide emergency treatment"
    ],
    legalTerms: [
      "Critical Illness: Specified diseases covered by policy",
      "Diagnosis: Confirmation by qualified medical practitioner",
      "Survival Period: Time insured must survive post-diagnosis",
      "Partial Payment: Benefit for early-stage conditions",
      "Moratorium: Time when claims cannot be made",
      "Medical Practitioner: Qualified doctor for diagnosis",
      "Specialist: Doctor specializing in relevant field"
    ],
    coverage: {
      lumpSum: "100% of sum assured upon diagnosis",
      multipleClaims: "Coverage for multiple unrelated conditions",
      partialPayment: "Partial benefits for early-stage conditions"
    },
    eligibility: "Ages 18-60, medical underwriting required",
    exclusions: "Pre-existing conditions, genetic disorders, self-inflicted conditions"
  },
  {
    policyId: "PT010",
    name: "Home",
    category: "Property Insurance",
    description: "Comprehensive protection for home structure and contents against various perils",
    detailedDescription: "Home Insurance provides comprehensive protection for your dwelling and personal belongings against fire, theft, natural disasters, and other covered perils. Includes structure coverage for the building, contents coverage for personal belongings, and liability protection for accidents on your property. Additional living expenses covered if home becomes uninhabitable.",
    defaultCoverageAmount: 500000,
    defaultPremium: 600,
    defaultFrequency: "Annually",
    protections: [
      "Fire and explosion damage",
      "Theft and burglary protection",
      "Natural disaster coverage",
      "Water damage from burst pipes",
      "Vandalism and malicious damage",
      "Personal liability protection",
      "Additional living expenses"
    ],
    legalTerms: [
      "Dwelling: Main structure of the home",
      "Personal Property: Moveable belongings in the home",
      "Replacement Cost: Cost to replace item with new equivalent",
      "Actual Cash Value: Replacement cost minus depreciation",
      "Deductible: Amount paid out-of-pocket before coverage applies",
      "Liability: Legal responsibility for damages to others",
      "Additional Living Expenses: Costs when home is uninhabitable"
    ],
    coverage: {
      buildingStructure: "Reconstruction costs for dwelling",
      contents: "Personal belongings and household items",
      liability: "Legal liability for third-party injuries"
    },
    eligibility: "Property owners and renters, property inspection required",
    exclusions: "War, nuclear risks, intentional damage, normal wear and tear"
  },
  {
    policyId: "PT011",
    name: "Travel",
    category: "Specialty Insurance",
    description: "Protection for domestic and international travel including medical emergencies",
    detailedDescription: "Travel Insurance provides essential protection for domestic and international trips including medical emergencies, trip cancellation, baggage loss, and travel delays. Covers emergency medical treatment abroad, evacuation services, and repatriation. Includes 24/7 assistance services and coverage for adventure sports with appropriate riders.",
    defaultCoverageAmount: 50000,
    defaultPremium: 150,
    defaultFrequency: "One-time",
    protections: [
      "Emergency medical treatment abroad",
      "Medical evacuation and repatriation",
      "Trip cancellation and interruption",
      "Baggage loss and delay coverage",
      "Travel delay compensation",
      "Personal liability abroad",
      "24/7 emergency assistance"
    ],
    legalTerms: [
      "Trip: Journey from departure to return home",
      "Medical Emergency: Sudden illness or injury requiring treatment",
      "Evacuation: Emergency transportation to medical facility",
      "Repatriation: Return to home country for treatment",
      "Trip Cancellation: Unable to travel due to covered reasons",
      "Travel Delay: Delayed departure due to covered reasons",
      "Pre-existing Condition: Medical condition before policy purchase"
    ],
    coverage: {
      medicalEmergency: "Emergency medical treatment abroad",
      tripCancellation: "Reimbursement for cancelled trips",
      baggageProtection: "Coverage for lost or delayed baggage"
    },
    eligibility: "All ages, trip duration limits apply",
    exclusions: "Pre-existing medical conditions, extreme sports, war zones"
  },
  {
    policyId: "PT012",
    name: "Car",
    category: "Property Insurance",
    description: "Comprehensive motor insurance covering vehicle damage and third-party liability",
    detailedDescription: "Car Insurance provides comprehensive protection for your vehicle including damage coverage, theft protection, and mandatory third-party liability. Covers repair costs from accidents, natural disasters, vandalism, and provides legal protection against claims from other parties. Includes roadside assistance and replacement vehicle services.",
    defaultCoverageAmount: 100000,
    defaultPremium: 1200,
    defaultFrequency: "Annually",
    protections: [
      "Accident damage repairs",
      "Theft and total loss coverage",
      "Third-party legal liability",
      "Natural disaster damage",
      "Vandalism and malicious damage",
      "Roadside assistance services",
      "Replacement vehicle provision"
    ],
    legalTerms: [
      "Own Damage: Coverage for insured vehicle damage",
      "Third Party: Other people affected by insured's vehicle",
      "Total Loss: When repair costs exceed vehicle value",
      "Constructive Total Loss: Vehicle cannot be economically repaired",
      "No Claim Bonus: Discount for claim-free periods",
      "Compulsory Excess: Mandatory amount borne by insured",
      "Agreed Value: Pre-agreed vehicle value for claims"
    ],
    coverage: {
      ownDamage: "Repair costs for accident damage",
      thirdPartyLiability: "Legal liability for injuries/damage to others",
      theft: "Total loss due to theft or total damage"
    },
    eligibility: "Valid driving license holders, vehicle registration required",
    exclusions: "Driving without license, under influence, racing, normal wear"
  },
  {
    policyId: "PT013",
    name: "Disability",
    category: "Health Insurance",
    description: "Income replacement during periods of inability to work due to disability",
    detailedDescription: "Disability Insurance provides income replacement when you cannot work due to illness or injury. Covers both short-term and long-term disabilities with benefits based on pre-disability income. Essential protection for maintaining lifestyle and meeting financial obligations during recovery periods. Includes rehabilitation benefits and return-to-work incentives.",
    defaultCoverageAmount: 60000,
    defaultPremium: 800,
    defaultFrequency: "Annually",
    protections: [
      "Monthly income replacement up to 75% of salary",
      "Short-term disability benefits",
      "Long-term disability benefits",
      "Partial and residual disability coverage",
      "Rehabilitation and training benefits",
      "Return-to-work incentives",
      "Cost of living adjustments"
    ],
    legalTerms: [
      "Total Disability: Complete inability to perform work duties",
      "Partial Disability: Reduced capacity to perform work",
      "Benefit Period: Maximum duration of benefit payments",
      "Elimination Period: Waiting time before benefits begin",
      "Own Occupation: Cannot perform specific job duties",
      "Any Occupation: Cannot perform any work for which suited",
      "Residual Benefits: Proportional benefits for income loss"
    ],
    coverage: {
      shortTerm: "Benefits for disabilities lasting 3-24 months",
      longTerm: "Benefits for disabilities lasting over 24 months",
      partialDisability: "Proportionate benefits for partial work capacity"
    },
    eligibility: "Ages 18-60, employed or self-employed persons",
    exclusions: "Pre-existing conditions, self-inflicted injuries, war, imprisonment"
  },
  {
    policyId: "PT014",
    name: "Child Education",
    category: "Life Insurance",
    description: "Guaranteed education funding with life insurance protection for parents",
    detailedDescription: "Child Education Insurance ensures guaranteed funding for your child's education expenses from primary school through university. Combines life insurance protection with systematic savings to build an education corpus. Features include waiver of premium on parent's death, guaranteed payouts at specific educational milestones, and bonus benefits for academic excellence.",
    defaultCoverageAmount: 300000,
    defaultPremium: 1500,
    defaultFrequency: "Annually",
    protections: [
      "Guaranteed education fund accumulation",
      "Life insurance on parent/guardian",
      "Waiver of premium benefit",
      "Milestone payments for school/college",
      "Academic achievement bonuses",
      "Inflation protection for education costs",
      "Tax benefits on premiums and maturity"
    ],
    legalTerms: [
      "Education Benefit: Payments at specified educational stages",
      "Waiver of Premium: Continuation without premium if parent dies",
      "Milestone Payments: Benefits at specific education levels",
      "Maturity Benefit: Final payment when policy term ends",
      "Academic Bonus: Additional benefit for academic performance",
      "Child: Person for whom education benefits are provided",
      "Policy Term: Duration until child reaches specified age"
    ],
    coverage: {
      educationBenefit: "Guaranteed payments at educational milestones",
      parentProtection: "Waiver of premiums if parent dies/disabled",
      maturityBenefit: "Lump sum at policy maturity"
    },
    eligibility: "Child ages 0-15, parent/guardian as life assured",
    exclusions: "Suicide of parent within 2 years, misrepresentation of facts"
  },
  {
    policyId: "PT015",
    name: "Income Protection",
    category: "Health Insurance",
    description: "Comprehensive income replacement for inability to work due to illness or injury",
    detailedDescription: "Income Protection Insurance provides comprehensive income replacement when you cannot work due to illness, injury, or involuntary unemployment. Offers monthly benefits to maintain lifestyle and meet financial commitments during periods of incapacity. Includes coverage for mental health conditions, pregnancy complications, and gradual return-to-work support.",
    defaultCoverageAmount: 80000,
    defaultPremium: 1000,
    defaultFrequency: "Annually",
    protections: [
      "Monthly income up to 85% of pre-disability earnings",
      "Coverage for illness and injury",
      "Mental health condition coverage",
      "Involuntary unemployment benefits",
      "Partial incapacity benefits",
      "Worldwide coverage",
      "Indexation for inflation protection"
    ],
    legalTerms: [
      "Incapacity: Inability to perform work due to illness/injury",
      "Involuntary Unemployment: Job loss beyond insured's control",
      "Benefit Period: Maximum time benefits are payable",
      "Waiting Period: Time before benefits commence",
      "Indexed Benefits: Benefits that increase with inflation",
      "Agreed Value: Pre-agreed benefit amount",
      "Indemnity Value: Benefits based on actual income loss"
    ],
    coverage: {
      illnessInjury: "Income replacement for health-related incapacity",
      involuntaryUnemployment: "Temporary benefits for job loss",
      partialIncapacity: "Proportionate benefits for reduced work capacity"
    },
    eligibility: "Ages 18-55, employed or self-employed, income verification required",
    exclusions: "Voluntary unemployment, criminal activities, war, existing disabilities"
  },
  {
    policyId: "PT016",
    name: "Universal Life",
    category: "Life Insurance",
    description: "Flexible permanent life insurance with investment options and adjustable premiums",
    detailedDescription: "Universal Life Insurance offers flexible permanent life insurance with adjustable premiums and death benefits. Combines insurance protection with cash value accumulation in investment accounts. Provides transparency in costs and investment returns while offering flexibility to adjust coverage and premiums based on changing needs and circumstances.",
    defaultCoverageAmount: 600000,
    defaultPremium: 3000,
    defaultFrequency: "Annually",
    protections: [
      "Flexible premium payment schedule",
      "Adjustable death benefit options",
      "Cash value accumulation",
      "Investment account options",
      "Loan facility against cash value",
      "Partial withdrawal facility",
      "No-lapse guarantee options"
    ],
    legalTerms: [
      "Flexible Premium: Ability to vary premium payments",
      "Cash Value: Investment account within the policy",
      "Cost of Insurance: Monthly charges for insurance coverage",
      "Current Interest Rate: Rate credited to cash value",
      "Surrender Charge: Fee for early policy termination",
      "No-Lapse Guarantee: Protection against policy lapse",
      "Target Premium: Recommended premium for illustrated benefits"
    ],
    coverage: {
      flexiblePremiums: "Adjustable premium payments within limits",
      adjustableDeathBenefit: "Option to increase/decrease coverage",
      cashValue: "Investment account with various fund options"
    },
    eligibility: "Ages 18-70, medical underwriting required",
    exclusions: "Suicide within first 2 years, misrepresentation, war exclusion"
  }
];

async function seedPolicyStore() {
  try {
    console.log('🚀 Starting Policy Store seeding...');

    // Ensure DB connection + table exists (creates if missing)
    await db.sequelize.authenticate();
    await db.PolicyStore.sync(); // or await db.sequelize.sync(); to sync all models

    // Clear existing
    await db.PolicyStore.destroy({ where: {} });
    console.log('🧹 Cleared existing Policy Store data');

    // Insert
    const created = await db.PolicyStore.bulkCreate(policyData, {
      validate: true,
      individualHooks: true
    });

    console.log(`✅ Successfully seeded ${created.length} policies to Policy Store!`);

    const counts = {};
    created.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    console.log('\n📊 Seeding Summary:');
    Object.entries(counts).forEach(([k,v]) => console.log(`   ${k}: ${v} policies`));
    console.log('\n🎉 Policy Store seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding Policy Store:', error);
    console.error('Details:', error?.original?.message || error.message);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

seedPolicyStore();