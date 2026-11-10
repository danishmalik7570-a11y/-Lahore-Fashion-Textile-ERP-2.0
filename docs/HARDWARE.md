# Lahore Fashion Textile ERP — Shop-Floor Hardware Specification & Bill of Materials (BOM)

> **Document Code:** LF-ENG-HW-2026-v2  
> **Target Environments:** Weaving Shed, Dye House, Rotary Printing, Stitching Lines, QC Inspection, Finished Goods Warehouse.

---

## 1. Executive Summary & Design Principles

Textile shop-floor hardware must survive high humidity (80%+ in dye houses), ambient cotton lint / airborne fibers (weaving shed), heat, voltage fluctuations, and heavy industrial use.

1. **Ruggedized Enclosures:** IP54 minimum for stitching/finishing; IP65 for dye house and printing.
2. **Scan-First Data Entry:** High-speed 2D hardware imager (Honeywell / Zebra) for instant QR read under dusty ambient lighting.
3. **Fail-Safe Offline Edge:** Industrial mini-PC per shed acting as local edge broker (syncs to central cloud when WAN returns).
4. **Touch & Ergonomics:** 10" industrial touchscreens mounted at ergonomic standing height (110–120 cm from floor).

---

## 2. Department-Specific Hardware Bill of Materials (BOM)

### 2.1 Stitching Line Kiosk (Per Line)
- **Tablet:** Samsung Galaxy Tab Active4 Pro 10.1" (Rugged IP68, MIL-STD-810H, Glove mode support) or Zebra ET40 10" Healthcare/Enterprise tablet.
- **Scanner:** Honeywell Genesis 7580g (Hands-free desktop 2D presentation scanner) mounted beside bundle tray OR integrated Zebra SE4107 scanner sled.
- **Mount:** RAM Mount heavy-duty VESA articulated arm with vibration dampener, clamped to line supervisor workstation.
- **Power:** 24V-to-USB-C industrial stepdown converter wired into main machine distribution box with isolated grounding.

### 2.2 Weaving Shed (Loom Kiosks & Automated Pick Counters)
- **Machine Interface Gateway:** Industrial ESP32 / W5500 Ethernet IoT gateway in DIN-rail enclosure (`LF-IOT-GW-V3`).
  - Optocoupled digital inputs (24V DC) connected directly to loom proximity switches (picks counter) and loom run relay.
  - Modbus RTU (RS-485) connection to Tsudakoma / Picanol loom microprocessors.
  - Protocols: MQTT over TLS, local buffer of up to 500,000 picks during network disconnects.
- **Operator Tablet:** 8" Rugged Tablet with heavy-duty silicone bumper, tethered to loom bay with high-tensile stainless cable.
- **Stoppage Interface:** 8-key sealed tactile capacitive keypad (Warp Break, Weft Break, Mechanical, Electrical, Empty Bobbin, Pattern Set-up, Cleaning, Operator Break) with emergency mechanic call strobe light.

### 2.3 Dye House & Wet Processing (Jet Machines & Stenter)
- **Machine Terminal:** Advantech IP65 Stainless Steel all-in-one panel PC (12.1" resistive touchscreen, operable with wet rubber gloves).
- **Sensors:**
  - J-Type thermocouple / PT100 temperature probe submerged in dye liquor recirculation manifold.
  - Industrial online pH sensor with automatic self-cleaning water flush.
  - RS-485 steam flow meter and water turbine pulse meter.
- **Enclosure:** NEMA 4X sealed enclosure with IP67 M12 sensor connectors.

### 2.4 Grey Fabric Inspection (Roll 4-Point Inspection Frame)
- **Tablet / Terminal:** 10.5" rugged Android tablet mounted on the inspection illuminated glass table crossbar.
- **Rotary Encoder:** Autonics E40S incremental rotary encoder (1000 pulses/revolution) coupled to fabric measuring roller for millimeter-accurate length tracking.
- **Defect Pointer:** Bluetooth optical handheld trigger allowing inspectors to point at fabric defects and tap defect severity (1, 2, 3, or 4 penalty points).

### 2.5 Finished Goods & Weighbridge / Scales
- **Weighbridge / Digital Scale Interface:** MOXA NPort 5150 RS-232 to Ethernet serial device server connected to Avery Weigh-Tronix / Mettler Toledo digital indicator.
- **Carton & Roll Label Printer:** Zebra ZT231 / ZT411 Industrial Thermal Transfer Printer (300 dpi, direct Ethernet, heavy-duty metal casing).

---

## 3. Machine IoT Gateway Wiring & Cabling Spec

```
                     +---------------------------------------+
                     |  Industrial ESP32 Modbus/MQTT Gateway |
                     |             (LF-IOT-GW-V3)            |
                     +---------------------------------------+
                        |                 |                 |
     +------------------+                 |                 +-----------------+
     |                                    |                                   |
[24V Digital Input 1]            [24V Digital Input 2]               [RS-485 Modbus Port]
  Loom Pick Proximity               Loom Running Relay                  Loom Microcontroller
  (Picks / Revolutions)             (Stoppage Detection)                (Speed / Tension)
```

- **Cabling:** Belden 9841 shielded twisted-pair (STP) for RS-485; Cat6A S/FTP halogen-free industrial Ethernet for floor LAN.
- **Grounding:** Dedicated clean earth ground (< 2 ohms) to prevent electrical noise from high-frequency inverter drives on stenter motors.

---

## 4. Local Edge Server Architecture (Offline-First Resilience)

In mill environments with intermittent fiber/microwave ISP links, every mill location runs a local edge node:

- **Edge Hardware:** Intel NUC / Advantech UNO-2484G Fanless Embedded Computer (16GB RAM, 512GB NVMe SSD, Dual Gigabit LAN).
- **Software Stack:**
  - Lightweight SQLite/PostgreSQL local replica.
  - Local EMQX MQTT broker (handles up to 10,000 messages/sec from floor IoT gateways).
  - FastAPI Edge Relay daemon (stores transactions in local SQLite cache; flushes upstream via HTTPS when WAN is healthy).
  - Bi-directional idempotent sync via `client_uuid`.
