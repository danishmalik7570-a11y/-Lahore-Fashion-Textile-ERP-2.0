# Compliance Notes — Pakistan Labour & Statutory Rules

> **⚠️ IMPORTANT:** Every statutory value in this system is stored as a **configurable rule
> with an effective date** — never hard-coded. The values listed below are **reference only**.
> Always verify with current Pakistan federal/provincial law & your company legal advisor
> before configuring production values.

---

## 1. Minimum Wage

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `MW-001` | Punjab minimum wage — unskilled worker | Punjab Minimum Wages Ordinance 1961 / Notification |
| `MW-002` | Punjab minimum wage — semi-skilled worker | " |
| `MW-003` | Punjab minimum wage — skilled worker | " |
| `MW-004` | Punjab minimum wage — highly-skilled worker | " |
| `MW-005` | Sindh minimum wage — unskilled worker | Sindh Minimum Wages Ordinance 1961 / Notification |
| `MW-006` | Federal minimum wage | Federal notification |

> **Verify:** Minimum wage rates are revised periodically by provincial/federal government.
> Check the latest gazette notification for the current rate.

---

## 2. EOBI (Employees' Old-Age Benefits Institution)

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `EOBI-001` | Employer contribution rate (% of minimum wage) | EOBI Act 1976, S.9 |
| `EOBI-002` | Employee contribution rate (% of minimum wage) | EOBI Act 1976, S.9 |
| `EOBI-003` | Minimum insurable salary ceiling | EOBI notifications |
| `EOBI-004` | Establishment size threshold (employees) | EOBI Act 1976 |
| `EOBI-005` | Registration deadline (days from joining) | EOBI Rules |

> **Verify:** EOBI contribution rates and minimum wage basis may be revised.
> Confirm the current rate from EOBI official communications.

---

## 3. Social Security (PESSI / SESSI)

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `SS-001` | Punjab: Employer contribution rate (%) | Punjab Employees' Social Security Ordinance 1965, S.19 |
| `SS-002` | Punjab: Wage ceiling for coverage | " |
| `SS-003` | Sindh: Employer contribution rate (%) | Sindh Employees' Social Security Ordinance 1965 |
| `SS-004` | Registration deadline for new worker | Social Security Rules |

> **Verify:** Social security contribution rates and wage ceilings are subject to revision.
> Check with the relevant provincial social security institution.

---

## 4. Workers' Welfare Fund (WWF)

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `WWF-001` | Employer contribution rate (% of assessable income) | Workers' Welfare Fund Ordinance 1971 |
| `WWF-002` | Minimum income threshold for applicability | " |

> **Verify:** WWF rate and thresholds. Currently 2% of assessable income for establishments
> with income ≥ PKR 500,000 (verify current threshold).

---

## 5. Overtime

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `OT-001` | Overtime rate multiplier (e.g. 2× of ordinary rate) | Factories Act 1934, S.47 |
| `OT-002` | Maximum overtime hours per week | " |
| `OT-003` | Maximum overtime hours per quarter | " |
| `OT-004` | Minimum OT threshold (minutes) before counting | Company policy |
| `OT-005` | Night shift allowance rate | Company policy / CBA |

> **Verify:** Overtime multiplier is generally 2× ordinary wages under the Factories Act.
> Weekly and quarterly caps apply. Verify with current law.

---

## 6. Leave Entitlements

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `LV-001` | Annual/Earned leave — days per year | Factories Act 1934, S.49-B |
| `LV-002` | Annual leave — minimum service for eligibility | " |
| `LV-003` | Casual leave — days per year | Standing Orders / Provincial law |
| `LV-004` | Sick leave — days per year (with medical certificate) | " |
| `LV-005` | Maternity leave — days (first child) | Maternity Benefit Ordinance 1958 / Provincial Acts |
| `LV-006` | Maternity leave — days (subsequent children) | " |
| `LV-007` | Annual leave carry-forward cap | Company policy / Law |
| `LV-008` | Leave encashment at exit — applicable leave types | Company policy |
| `LV-009` | Hajj leave — days (once in service) | Company policy / CBA |
| `LV-010` | Marriage leave — days | Company policy / CBA |

> **Verify:** Leave entitlements vary by province (Punjab, Sindh, KP, Balochistan).
> Check applicable provincial Shops & Establishment Ordinance or Factories Act.

---

## 7. Gratuity

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `GR-001` | Gratuity eligibility — minimum service years | Industrial & Commercial Employment (SO) Ordinance 1968 |
| `GR-002` | Gratuity calculation formula (e.g. 30 days per year) | " |
| `GR-003` | Gratuity cap (maximum months/amount) | Company policy |

> **Verify:** Gratuity formula: typically last drawn wages × 30 days × completed years of service.
> Some CBAs may have different terms.

---

## 8. Income Tax (Withholding)

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `TAX-001` | Salary tax slabs — effective date | Income Tax Ordinance 2001, First Schedule |
| `TAX-002` | Tax-free threshold | " |
| `TAX-003` | Slab rates (%) | " |

> **Verify:** Tax slabs change with each Finance Act / Budget. Always use the latest
> gazette notification for the current fiscal year.

---

## 9. Working Hours & Shifts

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `WH-001` | Maximum daily working hours | Factories Act 1934, S.34 |
| `WH-002` | Maximum weekly working hours | Factories Act 1934, S.35 |
| `WH-003` | Weekly rest day entitlement | Factories Act 1934, S.36 |
| `WH-004` | Rest interval (minimum break in shift) | Factories Act 1934, S.37 |
| `WH-005` | Night shift definition (hours) | " |

> **Verify:** Generally 48 hours/week, 9 hours/day with 1 hour break. One weekly rest day
> (usually Friday or Sunday). Verify with applicable provincial law.

---

## 10. Contract Labour / Thekedar

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `CL-001` | Contractor licence requirement | Provincial Factory/Labour laws |
| `CL-002` | Minimum wage applicability to contract workers | Minimum Wages Ordinance |
| `CL-003` | EOBI registration for contract workers | EOBI Act 1976 |
| `CL-004` | Social security for contract workers | SS Ordinance |
| `CL-005` | Tax withholding on contractor payments (%) | Income Tax Ordinance 2001, S.153 |

> **Verify:** Contract workers are entitled to the same minimum wage and social security
> benefits as direct employees. The principal employer may be jointly liable.

---

## 11. Bonus

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `BN-001` | Festival/Eid bonus (days or % of salary) | Company policy / CBA |
| `BN-002` | Attendance bonus eligibility | Company policy |
| `BN-003` | Production/efficiency incentive | Company policy |

> **Verify:** Bonus is generally not statutorily mandated in Pakistan but may be part of
> company policy, CBA, or employment contract.

---

## 12. Probation

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `PR-001` | Maximum probation period (months) | Standing Orders / Employment contract |
| `PR-002` | Confirmation process | Company policy |

---

## 13. Notice Period & Termination

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `NP-001` | Notice period — permanent worker (days) | Industrial & Commercial Employment (SO) Ordinance 1968 |
| `NP-002` | Notice period — probationer | " |
| `NP-003` | Payment in lieu of notice | " |
| `NP-004` | Retrenchment / Lay-off provisions | " |

> **Verify:** Generally 30 days notice or pay in lieu for permanent workers.
> Check for CBA terms if applicable.

---

## 14. Safety & Health

| Rule ID | Description | Reference |
|---------|-------------|-----------|
| `SH-001` | Accident reporting timeline (hours) | Factories Act 1934, S.33-A |
| `SH-002` | Medical examination frequency | " |
| `SH-003` | Fire drill frequency | " |
| `SH-004` | PPE requirements | Provincial Factory Rules |

> **Verify:** Accident reporting must be done within prescribed hours.
> Annual medical checkups may be required for certain categories.

---

## Revision History

| Date | Changed By | Notes |
|------|-----------|-------|
| 2024-01-01 | System | Initial document — all rules set as configurable defaults |

---

> **DISCLAIMER:** This document is for internal reference only. It does not constitute legal
> advice. All statutory values must be verified with current Pakistan federal and provincial
> legislation and your company's legal advisor before use in production.
