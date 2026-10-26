# Safety Principles, Data Provenance, and Privacy Standards

## 1. Safety Principles & Limitations

EcoSort is designed around the core tenet that **computer vision inference must never be treated as physical verification of safety**:

1. **Non-Invasive Inspection**: EcoSort never instructs users to open, puncture, dismantle, discharge, burn, or taste unknown waste items.
2. **Conservative Battery Safety**: All lithium-ion, alkaline, and button cells require non-conductive terminal taping before transit to prevent short circuits and thermal runaway fires.
3. **Chemical & Hazardous Isolation**: Solvents, corrosive liquids, pesticides, and motor oils are strictly quarantined into `specialized_hazardous`. They can never be routed to municipal recyclables or mixed with organics regardless of model confidence.
4. **Moisture Vulnerability**: Paper and cardboard are classified as recyclable only when dry. Co-mingling with wet organic food residues triggers statutory contamination warnings.

---

## 2. Regulatory Data Provenance

All statutory rules in `app.rules.versioned_rules` cite established statutory standards:

- **E-Waste Management Rules 2022 (CPCB / MoEFCC)**: Schedules I & II defining extended producer responsibility (EPR) and authorized recyclers.
- **Solid Waste Management Rules 2016 (MoEFCC)**: Rule 4 & 15 governing source segregation of wet organic, dry recyclable, and domestic hazardous waste streams.
- **Battery Waste Management Rules 2022**: Mandatory take-back and recycling obligations for electric vehicle and portable batteries.
- **US EPA Universal Waste Regulations (40 CFR Part 273)**: Hazardous waste stream handling standards for mercury-containing equipment and hazardous batteries.

---

## 3. Geospatial Data & Facility Verification Taxonomy

Every collection centre in `app.geospatial.centres_db` is audited under a transparent verification classification:

| Verification Status | Definition | Evidence Requirement |
| :--- | :--- | :--- |
| `OFFICIALLY_VERIFIED` | Authorized municipal facility or state-licensed recycler | CPCB / MPCB State Board license registry or municipal solid waste department |
| `THIRD_PARTY_DIRECTORY` | Listed in recognized regional recycling directories or NGO cooperatives | Audited non-profit cooperative or authorized corporate take-back portal |
| `GENERAL_SCRAP_UNVERIFIED` | Commercial scrap collection business | Directory listing without independent statutory audit |
| `DEMO_DOCUMENTED_SAMPLE` | Explicit sample records for offline demonstration | Labeled explicitly as demonstration data; never presented as active live centres |

### Distance Transparency Principle
- Coordinates are computed via the spherical **Haversine formula**.
- All UI displays explicitly label distance values as **"Straight-line geodesic estimate, not road distance"**, avoiding misleading driving time claims when road-network graph data is unavailable.

---

## 4. Privacy & Data Ethics

- **Zero Third-Party Image Leaks**: Uploaded photographs and camera captures are evaluated locally by the in-memory PyTorch backend. Images are never transmitted to commercial external vision APIs or cloud scrapers.
- **Session-Only Geolocation**: User latitude/longitude coordinates are retained strictly in client-side session memory and are never persisted to databases or tied to user tracking cookies.
- **Transparent Audit Logging**: User corrections stored in `POST /api/batch/audit-log` record solely the item ID, prediction, and user-provided category tag for research audit trail reproduction without capturing personal identifiable information (PII).
