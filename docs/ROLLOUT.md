# Lahore Fashion Textile ERP — Floor Data Entry Rollout Plan & Usability Protocol

> **Document Code:** LF-OPS-ROLLOUT-2026-v1  
> **Target:** Mill General Managers, Line Supervisors, Production Planners, Industrial Engineering (IE) Team.

---

## 1. Five-Phase Factory Rollout Methodology

```
+-------------------+      +--------------------+      +--------------------+      +--------------------+      +-------------------+
|  Phase 1: Pilot   | ---> | Phase 2: Champions | ---> | Phase 3: Parallel  | ---> | Phase 4: Full Dept | ---> |  Phase 5: Go-Live |
| (Stitching Line 1)|      |  (Supervisors & Op)|      |  (Paper + Digital) |      | (Weave, Dye, Pack) |      |   Audit & Bonus   |
|     2 Weeks       |      |       1 Week       |      |      2 Weeks       |      |       4 Weeks      |      |     Continuous    |
+-------------------+      +--------------------+      +--------------------+      +--------------------+      +-------------------+
```

### Phase 1: Pilot Line (Stitching Line #1 — LF-2024-031 / Kurti Production)
- Mount single rugged tablet on Line #1 with hands-free 2D scanner.
- Configure Line #1 operators with laminated QR lanyard badges.
- Pre-generate QR bundle tickets on cutting lay outfeed.
- Test 10-second data entry target and haptic/audio feedback.

### Phase 2: Training 'Floor Champions'
- Train 2 lead operators and 1 line supervisor as "Champions".
- Conduct 15-minute hands-on sessions in Urdu using laminated visual wall posters.
- Zero-reading rule: Teach workers to navigate purely by **icon + colour + audio chime**.

### Phase 3: 2-Week Parallel Run (Paper Sheet vs Kiosk Digital)
- Traditional paper production sheet maintained alongside kiosk entries.
- Daily 5:00 PM reconciliation meeting between Production Supervisor and IE:
  - Total piece count variance between paper and system must be < 1.0%.
  - Any discrepancies analyzed for missed scans or proxy inputs.

### Phase 4: Department-by-Department Expansion
- Rollout order: Stitching Lines 2–10 → Grey Inspection → Weaving Shed (Loom counters) → Dyeing House → Cutting → Finished Packing.
- Enable automatic loom counter telemetry to eliminate manual meter entry.

### Phase 5: Go-Live & Piece-Rate Payroll Binding
- System becomes the authoritative payroll ledger for piece-rate wages.
- Workers can view their accumulated weekly and daily earnings on the kiosk terminal.

---

## 2. Go-Live Strict Exit Criteria

To sign off on full factory cutover from paper to digital:

| KPI Metric | Pilot Target | Hard Go-Live Gate |
|---|---|---|
| **Entry via Scan / Auto IoT** | ≥ 90% | **≥ 95%** (Typing prohibited except notes) |
| **Late / Paper Entries** | < 8% | **< 3%** |
| **Shift Reconciliation Variance** | < 2% | **< 1%** between gate count & packed goods |
| **Scan-to-Done Transaction Speed** | < 12 seconds | **< 8 seconds** average per bundle |
| **Kiosk Uptime** | ≥ 98% | **≥ 99.8%** with edge server buffering |

---

## 3. Floor Usability Test Protocol (Urdu & Low-Literacy Testing Script)

### Objective
Ensure that an operator with minimal smartphone literacy can successfully scan into a shift, process a bundle, and review earnings within 10 seconds without supervisor assistance.

### Test Script (Run with 10 Random Operators per Shift)

#### Step 1: Shift Check-In (حاضری اور کام کا آغاز)
- **Prompt (Urdu):** "اپنا کارڈ اسکینر کے سامنے لائیں اور اسکرین پر اپنا نام دیکھیں"
  *(Bring your ID card in front of the scanner and verify your name on screen)*
- **Pass Criteria:** Operator scans badge in < 3 seconds; green confirmation chime sounds; worker sees their Urdu greeting and photo.

#### Step 2: Bundle Processing (بنڈل کا اندراج)
- **Prompt (Urdu):** "نئے بنڈل کا کیو آر کوڈ اسکین کریں اور 'ہو گیا' کا بٹن دبائیں"
  *(Scan the new bundle QR code and tap the green 'Done' button)*
- **Pass Criteria:** System auto-fills bundle quantity (e.g., 20). Operator taps single green button. Total time < 5 seconds. Urdu voice chime announces "ہو گیا".

#### Step 3: Reject / Alteration Logging (نقص یا خرابی کا اندراج)
- **Prompt (Urdu):** "اگر دو پیس خراب ہیں تو منفی دبائیں اور خرابی کا نشان منتخب کریں"
  *(If two pieces are rejected, press minus twice and select defect reason)*
- **Pass Criteria:** Operator taps `−` button twice, taps needle cut icon, and completes entry in < 8 seconds.

#### Step 4: Earnings Verification (میری کمائی چیک کرنا)
- **Prompt (Urdu):** "آج کی کمائی والا بٹن دبائیں"
  *(Tap the My Earnings button)*
- **Pass Criteria:** Operator sees total PKR earned today and distance to daily bonus target ring.

---

## 4. Visual Station Posters & Cheat-Sheets

Station posters are printed on water-resistant PVC sheets and mounted at eye level:
1. **Green Check (سبز نشان):** کامیاب اندراج (Entry Successful).
2. **Red Cross (سرخ نشان):** بنڈل غلط لائن کا ہے (Wrong line / contact supervisor).
3. **Yellow Wrench (پیلا پانا):** مکینک کو بلائیں (Call mechanic / machine breakdown).
4. **Blue Thread (نیلا دھاگہ):** دھاگہ یا کپڑا ختم (Material shortage).
