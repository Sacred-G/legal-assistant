# Comprehensive Guide to Disability Rating and Calculations

## 1. Initial Data Collection

### Required Information
- Patient Information:
  - Name
  - Date of Birth (DOB)
  - Date of Injury (DOI)
  - Occupation
- Medical Information:
  - WPI ratings and impairment codes
  - Affected body parts
  - Permanent & Stationary (P&S) date
  - Future medical recommendations

## 2. Rating Calculation Process

### A. Base WPI Calculation (Post-2013)
```
FEC Adjusted WPI = WPI × 1.4
```

### B. Occupational Adjustment
1. Match occupation to group in occupation_groups_and_variant.json
2. Find variant (A-J) for each body part within group
3. Apply occupational adjustment:
```
OccupationalAdjusted = FEC_Adjusted_WPI × Occupational_Variant_Factor
```

### C. Age Adjustment
1. Calculate age at injury:
```
Age = DOI_Year - Birth_Year
(Adjust if DOI is before birthday)
```
2. Find age bracket in age_adjustments.json
3. Apply age factor:
```
Final_PD = OccupationalAdjusted × Age_Factor
```

## 3. Multiple Impairment Combinations

### When to Add
- Same joint ROM measurements
- Spinal impairments under Table 15-7
- When specified in rating instructions

### When to Combine
- Different body parts
- Different evaluation methods
- All other cases

### Combination Formula
```
Combined_Value = A + B(1-A)
Where:
A = larger impairment (as decimal)
B = smaller impairment (as decimal)

Example:
20% and 10%
0.20 + 0.10(1-0.20) = 0.28 or 28%
```

## 4. PD Payout Calculation

### A. Weekly Rate (Post-2013)
- PD < 70%: $230-$290/week
- PD 70-99%: $315/week
- PD 100%: $315-$480/week

### B. Number of Weeks
- PD 1-69%: Weeks = PD% × 3
- PD 70-99%: Weeks = PD% × 4
- PD 100%: Lifetime payments

### C. Total Award Calculation
```
Basic_Award = Weekly_Rate × Number_of_Weeks

Employer Adjustment:
>50 employees: Final_Award = Basic_Award × 1.15
<50 employees: Final_Award = Basic_Award × 0.85
```

## 5. Future Medical Cost Projection

### A. Five-Year Components
1. Regular Medical Care
   - Annual doctor visits = Cost_per_visit × Visits_per_year × 5

2. Therapy Services
   - Physical therapy = Cost_per_session × Sessions_per_year × 5
   - Chiropractic = Cost_per_session × Sessions_per_year × 5

3. Medications
   - Monthly medications = Cost_per_month × 12 months × 5

4. Diagnostic Tests
   - Tests = Cost_per_test × Frequency_over_5_years

5. Medical Equipment/Supplies
   - Monthly supplies = Cost_per_month × 12 months × 5

### B. Adjustment Factors
- Geographic location
- Medical inflation (3-5% annually)
- Patient age/life expectancy
- Injury severity
- Treatment frequency changes

## 6. Rating String Format
```
Format: 
"impairment# - WPI - [1.4]FEC - OccupationGroupVariant - OccupationalAdj - FinalRating%"

Example: 
"15.01.02.02 - 8 - [1.4]11.2 - 320H - 13.4 - 15%"
```

## 7. Calculation Rules
- Round only at final step
- Round to nearest decimal unless specified
- Final PD percentage rounds to whole number

## 8. Example Case

### Patient Information
- DOI: 6/15/2023
- Age at injury: 45
- Occupation: Heavy Equipment Operator (Group 351)

### Impairments
1. Cervical Spine (15.01.02.02): 8% WPI
2. Right Shoulder (16.02.01.00): 5% WPI
3. Lumbar Spine (15.03.02.02): 10% WPI

### Calculation Steps
1. Apply FEC (1.4):
   - Cervical: 8% × 1.4 = 11.2%
   - Shoulder: 5% × 1.4 = 7%
   - Lumbar: 10% × 1.4 = 14%

2. Apply Occupational Variants (Group 351):
   - Cervical (variant G): 11.2% → 13.4%
   - Shoulder (variant G): 7% → 8.4%
   - Lumbar (variant G): 14% → 16.8%

3. Combine Values:
   ```
   First Combination (Lumbar + Cervical):
   0.168 + 0.134(1-0.168) = 0.279 (27.9%)

   Second Combination (with Shoulder):
   0.279 + 0.084(1-0.279) = 0.340 (34%)
   ```

4. Age Adjustment (age 45):
   - 34% adjusted for age 45 = 36%

### Final Ratings
```
Cervical: "15.01.02.02 - 8 - [1.4]11.2 - 351G - 13.4%"
Shoulder: "16.02.01.00 - 5 - [1.4]7.0 - 351G - 8.4%"
Lumbar: "15.03.02.02 - 10 - [1.4]14.0 - 351G - 16.8%"
Combined Final After Age: 36%
```

### Award Calculation
- 36% = 108 weeks (36 × 3)
- Weekly rate = $290
- Basic Award = $290 × 108 = $31,320

## 9. Composite Method Calculation

### Example Case
- DOI: 6/15/2023
- Age at injury: 45
- Occupation: Heavy Equipment Operator (Group 351)

### Impairments
1. Cervical Spine (15.01.02.02): 8% WPI
2. Right Shoulder (16.02.01.00): 5% WPI
3. Lumbar Spine (15.03.02.02): 10% WPI

### Calculation Steps
1. Apply FEC (1.4):
   - Cervical: 8% × 1.4 = 11.2%
   - Shoulder: 5% × 1.4 = 7%
   - Lumbar: 10% × 1.4 = 14%

2. Apply Occupational Variants (Group 351):
   - Cervical (variant G): 11.2% → 13.4%
   - Shoulder (variant G): 7% → 8.4%
   - Lumbar (variant G): 14% → 16.8%

3. Total After Occupational:
   - 13.4% + 8.4% + 16.8% = 38.6%

4. Age Adjustment (age 45):
   - 38.6% adjusted for age 45 = 41%

### Final Ratings
```
Cervical: "15.01.02.02 - 8 - [1.4]11.2 - 351G - 13.4%"
Shoulder: "16.02.01.00 - 5 - [1.4]7.0 - 351G - 8.4%"
Lumbar: "15.03.02.02 - 10 - [1.4]14.0 - 351G - 16.8%"
Composite Final After Age: 41%
```

### Award Calculation
- 41% = 123 weeks (41 × 3)
- Weekly rate = $290
- Basic Award = $290 × 123 = $35,670

## 10. Key Differences Between CVC and Composite Methods

- Impairments are added rather than combined in the composite method
- Results in higher final PD percentage (41% vs 36%)
- Increases total weeks of payment
- Higher final settlement amount

## 11. Choosing Between CVC and Composite Methods

- Use composite method when:
  - Same body part/area
  - Multiple range of motion measurements for the same joint
  - Multiple spinal impairments under Table 15-7
  - Different methods of rating the same impairment
  - Impairments in same region that don't overlap
  - Specific instructions to add values
- Use CVC method when:
  - Different body parts/systems
  - Impairments affecting different body parts
  - Impairments from different body systems
  - Unrelated conditions
  - Overlapping conditions
  - No specific addition instruction exists

## 12. General Rule of Thumb

- Default to CVC unless specifically instructed to add
- If unclear, use CVC as it's more conservative
- Document reasoning for method chosen
- Consider overlap of functional limitations