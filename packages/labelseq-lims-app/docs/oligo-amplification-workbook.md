# Oligo Amplification Workbook Template

**Source:** [Oligo Amplification Workbook Template](https://docs.google.com/spreadsheets/d/10NcpONdWquge0JlHtaBTK93g0gCWMs1FUdnT25WLn44) (Google Sheets)

> This file is a markdown conversion of the Google Sheet above, made on 2026-10-20 from an XLSX export. The sheet is the source of truth. If the sheet changes, this file may need updating to match.

Each section below corresponds to one tab of the workbook, in tab order. Tab names carry a `2026MMDD_` prefix in the sheet (a placeholder for the experiment date); it is dropped from the headings here.

Conventions used in this conversion:

- **Record tables** are the tables a scientist fills in during the experiment. Their columns are listed with any formula the sheet uses to compute them.
- **Inputs** are single cells the user fills in to drive calculations (highlighted yellow or green in the sheet).
- Formulas are rewritten with column names in place of cell references. `N` is the number of samples/tiles/assays given in the step's input cell. `1.05` is the pipetting overage.
- Step text is kept as written in the sheet, including typos. Discrepancies spotted during conversion are listed in [Conversion notes](#conversion-notes) at the end.

## Workflow overview

| # | Tab | Purpose (abbreviated) |
|---|-----|-----------------------|
| 1 | [Oligo PCR](#1-oligo-pcr) | Amplify tiles from the oligo pool |
| 2 | [Oligo Bead Cleanup](#2-oligo-bead-cleanup) | 1.5x SeraMag bead cleanup of amplified tiles |
| 3 | [Oligo NGS](#3-oligo-ngs) | Index PCR + cleanup to sequence-verify each tile pool |
| 4 | [BsaI Golden Gate](#4-bsai-golden-gate) | Clone tiles into the helper vector (KanR) |
| 5 | [BsaI Golden Gate Clean](#5-bsai-golden-gate-clean) | Zymo clean & concentrate of BsaI GG reactions |
| 6 | [BsaI GG Transformation](#6-bsai-gg-transformation) | Chemical transformation into NEB Stable cells |
| 7 | [BsaI Miniprep](#7-bsai-miniprep) | Colony count/coverage, glycerol stocks, miniprep |
| 8 | [PaqCI Golden Gate](#8-paqci-golden-gate) | Assemble the final library into an assay vector (PaqCI) |
| 9 | [SapI Golden Gate](#9-sapi-golden-gate) | Assemble the final library into an assay vector (SapI) |
| 10 | [PacQI/SapI Golden Gate Clean](#10-pacqisapi-golden-gate-clean) | Zymo clean & concentrate of PaqCI/SapI reactions |
| 11 | [Transform Bottleneck](#11-transform-bottleneck) | Electroporate libraries and bottleneck barcodes |
| 12 | [Maxiprep](#12-maxiprep) | Coverage check, glycerol stocks, maxiprep of bottlenecked libraries |

Steps 8 and 9 are alternatives (PaqCI or SapI assembly), both followed by step 10.

---

## 1. Oligo PCR

Tab: `2026MMDD_Oligo PCR`

**Purpose:** Amplifying tiles containing desired amino acid variations to be cloned into abundance and activity screen vectors

**Reagents:**

- Oligo Pool Aliquot (1ng/uL)
- Nuclease Free Water
- SYBR Green (100X)
- Q5 Hot Start High Fidelity 2X Master Mix
- RR Orthogonal Fv1 Forward Primer Plate (10uM)
- RR Orthogonal Rv1 Reverse Primer Plate (10uM)

**Materials:**

- 1.7mL Eppendorf tubes
- 8-strip qPCR tubes OR 96 well plate
- qPCR Thermocycler machine
- Ice
- SeraMag Beads
- Magnet Plate

**Notes:**

- One reaction is 50μL total
- Thaw all reagents on ice
- Pipetting overage is 1.05

### Record table: Ampkey Reaction Table

| Column | Notes |
|--------|-------|
| Genes | |
| Tile | |
| Forward Primer Well (RR orthogonal) | From the ampkey (Step 2) |
| Reverse Primer Well (RR orthogonal) | From the ampkey (Step 2) |
| 96-well Destination Plate | Destination well for the tile/primer pair (Step 2) |
| Cycle Pulled At? | Step 4 |
| Date Amplified | |

### Steps

**Step 1.** Set up the following master mix (MM) for the number of samples to be prepared

Input: **Number of samples** (`N`)

| Amt (ul) for one rxn | Reagent | Amt (uL) for MM |
|---:|---|---|
| 18.7 | Water | = 18.7 × N × 1.05 |
| 1.0 | Oligo Pool (1ng/uL) | = 1.0 × N × 1.05 |
| 0.3 | SYBR Green (100x) | = 0.3 × N × 1.05 |
| 25.0 | Q5 Hot Start High Fidelity 2X Master Mix | = 25.0 × N × 1.05 |

**Step 2.** Use the ampkey to determine the well locations of the primer pairs for each tile. Record them in the Ampkey Reaction Table to the right. In addition, record the destination well for each tile and primer pair.

**Step 3.** Set up the following reaction in each well of a 96-well plate, or if doing a smaller scale, in an 8-strip qPCR strip tube

| Reagent | Volume (μL) |
|---|---:|
| Master Mix | 45.0 |
| Fwd Primer (10uM) | 2.5 |
| Rev Primer (10uM) | 2.5 |

**Step 4.** Cap the tubes or cover with a plastic seal if doing a 96-well plate, and set up the qPCR thermocycler with the following parameters:

| Temperature | Duration | |
|---|---|---|
| 98°C | 3 min | |
| 98°C | 30s | Repeat 39x |
| 63°C | 10s | (repeat) |
| 72°C | 20s | (repeat) |

Pull the reactions once they reach an average of 3000RFU; record the cycle in which they were pulled in the Ampkey Reaction Table.

Note: In most cases, after 21 rounds of PCR the reaction will exit the exponential phase of growth and be in the linear phase (i.e. starting to decrease in efficiency for a round or 2 of PCR) and will hit the 3000RFU mark

---

## 2. Oligo Bead Cleanup

Tab: `2026MMDD_Oligo Bead Cleanup`

**Purpose:** Purifying the amplified tiles using a 1.5x SeraMag bead cleanup for later NGS sequence confirmation and BsaI golden gate cloning

**Reagents:**

- Tile PCR Reactions
- SeraMag Beads

**Materials:**

- Magnet Plate
- 8-strip PCR tubes OR 96 well plate

### Record table: Ampkey Purified Tile Table

| Column | Notes |
|--------|-------|
| Genes | |
| Tile | |
| Tube Name | |
| Concentration (ng/uL) | From Qubit (Step 10) |
| Total DNA (28uL) | = Concentration × 28 |
| Date Purified | |

The sheet pre-fills the Total DNA formula for 96 rows.

### Steps

**Step 1.** Using a multichannel, add 75uL of beads into the 50uL Tile PCR reactions and pipette mix well

ALERT: Make sure to thoroughly mix the beads before dispensing

**Step 2.** Let the beads incubate at room temperature with the samples for 5 minutes before placing on the magnets.

**Step 3.** Let sit on the magnet for 5 minutes before removing the supernatant.

OPTIONAL: Save the supernatant if new to bead cleaning

**Step 4.** Wash with 200uL of 100% ethanol, making sure to resuspend the pellet, and let sit for 1 minute. Return to magnet.

**Step 5.** Discard the wash, then repeat Step 4.

**Step 6.** Let sit without ethanol for 5 minutes uncovered to let residual ethanol evaporate. If using strip tubes, you can quickly spin them down, place them on the magnet, and use 10uL tips to carefully remove excess ethanol.

**Step 7.** Remove from magnet and resuspend beads in 32 μL of nuclease-free water. Mix thoroughly with a multichannel.

**Step 8.** Let the beads incubate at room temperature with the water for 5 minutes before placing on the magnets

**Step 9.** Let sit on the magnet for 5 minutes and then collect the supernatant. This is your final DNA product, so move it to a labeled strip tube.

**Step 10.** [Quantify the tiles using the Qubit Plate Reader](https://docs.google.com/document/u/0/d/1jalcrLDHEdJVIQYWAe5VayNn8yO3gI-UeXqb15qVor8/edit). Or if only amplifying a few tiles, use the standard Qubit HS dsDNA protocol. Record values in Ampkey Purified Tile Table to the right.

---

## 3. Oligo NGS

Tab: `2026MMDD_Oligo NGS`

**Purpose:** to sequence each amplified tile pool and sequence verify/determine general variant coverage

**Reagents:**

- Purified Oligo Tiles
- Nuclease-free water
- Q5 Hot Start High Fidelity 2X Master Mix
- NexV2ad2 i7 primers plate (10uM)
- i5 index primers plate (10uM)

**Materials:**

- 1.7mL Eppendorf tubes
- 8-strip PCR tubes
- PCR thermal cycler
- Ice
- Cytiva SeraMag Beads
- Magnet plate

**Notes:**

- One reaction is 50 μL total.
- Thaw all reagents on ice.

### Record table: Oligo NGS PCR Reaction Table

| Column | Notes |
|--------|-------|
| Genes | |
| Tile | |
| i7 Primer Well | Step 2 |
| i5 Primer Well | Step 2 |
| 96-well Destination Plate | |
| Cycle Pulled At? | Step 4 |
| Date Amplified | |
| Quant (ng/ul) | Step 14 |
| Date Purified | |

### Steps

**Step 1.** Set up the following master mix (MM) for the number of samples to be prepared:

Input: **Number of samples** (`N`)

| Amt (ul) for one rxn | Reagent | Amt (uL) for MM |
|---:|---|---|
| 18.7 | Water | = 18.7 × N × 1.05 |
| 0.3 | SYBR Green (100x) | = 0.3 × N × 1.05 |
| 25.0 | Q5 Hot Start High Fidelity 2X Master Mix | = 25.0 × N × 1.05 |

**Step 2.** Identify which P5 and P7 indexing primers you are going to be using for each library, and record their locations in the Oligo NGS PCR Reaction Table.

- a. The identity of the primers in each well of the working stock plate [can be found here](https://docs.google.com/spreadsheets/d/14EG_tpbGDmHR-IVqL8UzU29CKG7_qtu1z-jdrgkyqF8/edit?gid=0#gid=0)
- b. Check with the other people who are prepping samples for the NGS kit that your chosen primer pairs do not overlap with theirs.

**Step 3.** Set up the following reaction in each well of a 96-well plate, or if doing a smaller scale, in an 8-strip qPCR strip tube

| Reagent | Volume (μL) |
|---|---:|
| Master Mix | 44.0 |
| Fwd Primer (10uM) | 2.5 |
| Rev Primer (10uM) | 2.5 |
| Purified Oligo Tile | 1.0 |

**Step 4.** Cap the tubes or cover with a plastic seal if doing a 96-well plate, and set up the qPCR thermocycler with the following parameters:

| Temperature | Duration | |
|---|---|---|
| 98°C | 3 min | |
| 98°C | 30 sec | Repeat 40x |
| 63°C | 10 sec | (repeat) |
| 72°C | 20 sec | (repeat) |

Pull the reactions once they reach an average of 3000RFU; record the cycle in which they were pulled in the Oligo NGS PCR Reaction Table.

Note: In most cases, after 10 rounds of PCR the reaction will exit the exponential phase of growth and be in the linear phase (i.e. starting to decrease in efficiency for a round or 2 of PCR) and will hit the 3000RFU mark

**Step 5.** Using a multichannel, add 75uL of beads into the 50uL Tile PCR reactions and pipette mix well

ALERT: Make sure to thoroughly mix the beads before dispensing

**Step 6.** Let the beads incubate at room temperature with the samples for 5 minutes before placing on the magnets.

**Step 7.** Let sit on the magnet for 5 minutes before removing the supernatant.

OPTIONAL: Save the supernatant if new to bead cleaning

**Step 8.** Wash with 200uL of 100% ethanol, making sure to resuspend the pellet, and let sit for 1 minute. Return to magnet.

**Step 9.** Discard the wash, then repeat Step 4.

**Step 10.** Let sit without ethanol for 5 minutes uncovered to let residual ethanol evaporate. If using strip tubes, you can quickly spin them down, place them on the magnet, and use 10uL tips to carefully remove excess ethanol.

**Step 11.** Remove from magnet and Rresuspend beads in 32 μL of nuclease-free water. Mix thoroughly with a multichannel.

**Step 12.** Let the beads incubate at room temperature with the water for 5 minutes before placing on the magnets

**Step 13.** Let sit on the magnet for 5 minutes and then collect the supernatant. This is your final DNA product, so move it to a labeled strip tube.

**Step 14.** [Quantify the tiles using the Qubit Plate Reader](https://docs.google.com/document/u/0/d/1jalcrLDHEdJVIQYWAe5VayNn8yO3gI-UeXqb15qVor8/edit). Or if only amplifying a few tiles, use the standard Qubit HS dsDNA protocol. Record values in Ampkey Purified Tile Table to the right.

---

## 4. BsaI Golden Gate

Tab: `2026MMDD_BsaI Golden Gate`

**Purpose:** Clone the tiles into the helper vector (Kanamycin resistance) using BsaI

**Reagents:**

- T4 ligase buffer
- T4 DNA ligase (2000 U/μL)
- BsaIHF-v2 (20 U/μL)
- pHSG299-BsaI helper vector (100 ng)
- Nuclease-free H2O
- Exonuclease V (RecBCD) (10,000 U/mL)
- Left- and right-flanking g-blocks for oligos in given gene
- Oligo tiles for given gene

**Materials:**

- 1.7mL Eppendorf tubes
- 8-strip qPCR tubes OR 96 well plate
- Thermal Cycler
- Ice

**Notes:**

- One reaction is 25 μL
- Set up oligo tile golden gate reactions in duplicate and pool together at the end
- Set up a negative control reaction with just the helper vector, no oligo tile
- Keep the enzymes in the -20°C freezer until time to pipette.

### Record table: Cloning Calculation Table

Input: **Insert:vector mass ratio** = `2.0` (single cell above the table)

| Column | Group | Notes |
|--------|-------|-------|
| Gene | | |
| Tile | | |
| Left Clonal Block Length (bp) | Input value for Calculation | |
| Tile Length (BP) | Input value for Calculation | |
| Right Clonal Block Length (bp) | Input value for Calculation | |
| Left Clonal Block Conc. (ng/μL) | Input value for Calculation | |
| Tile Conc. (ng/μL) | Input value for Calculation | |
| Right Block Conc. (ng/μL) | Input value for Calculation | |
| Helper Vector Length (bp) | Input value for Calculation | |
| Additional H2O (if needed; μL) | Variable vol. for each tile | = 13 − (Left Clonal Block Vol + Tile Vol + Right Block Vol) |
| Left Clonal Block Vol (μL) | Variable vol. for each tile | = ratio × 100 × (Left Clonal Block Length / Helper Vector Length) / Left Clonal Block Conc. |
| Tile Vol. (μL) | Variable vol. for each tile | = ratio × 100 × (Tile Length / Helper Vector Length) / Tile Conc. |
| Right Block Vol. (μL) | Variable vol. for each tile | = ratio × 100 × (Right Clonal Block Length / Helper Vector Length) / Right Block Conc. |
| Subtotal | | = Additional H2O + Left Vol + Tile Vol + Right Vol (always 13) |
| Date of BsaI GG | | Step 8 |
| Date of BsaI Add Dig | | Step 10 |

The `100` in the volume formulas is the helper vector mass in ng. The sheet pre-fills formulas for 12 rows.

### Steps

**Step 1.** Prepare and label 8-strip PCR tubes for 2 reactions per tile, and one negative (vector only) control.

**Step 2.** Determine the clonal block, tile fragment, and custom helper vector lengths from [source]. Input values, plus the gene name and tile name into the Cloning Calculation Table below.

**Step 3.** Resupsend the clonal blocks so they are 100ng/uL. Record that concentration (or whatever the concentration is if they were not resuspended to 100ng/uL) and the tile concentration in the Cloning Calculation Table.

**Step 4.** Use the Cloning Calulation Table to calculate input DNA mass and total concentration so the blocks/oligo tiles to vector is a 1 to 2 ratio

Required mass of insert (g) = (insert / vector ratio) × mass of vector (g) × (insert length (bp) / vector length (bp))

**Step 5.** Pipette out the inserts (tile, g-blocks, water) into each individual reaction.

- Start with the water, which will make it easier to pipette the smaller g-block and tile volumes.
- For the negative control, mix 1 μL helper vector + 12 μL H2O.

**Step 6.** Prepare the master mix in a 1.7 mL tube on ice:

Input number of tiles to process in the yellow box below, then the helper vector concentration in the green box below that, then follow the Master Mix table generated.

Inputs: **number of tiles** (`N`, yellow), **concentration of helper vector (ng/uL)** (green)

Master Mix Table (reactions = 2N + 1, for duplicates plus one negative control):

| Amt (ul) for 1rxn | Reagent | Amt (uL) for MM |
|---|---|---|
| = 8 − Helper Vector amt | Water | = amt × (2N + 1) × 1.05 |
| = 100 / helper vector conc. | Helper Vector (100ng) | = amt × (2N + 1) × 1.05 |
| 2.5 | T4 Buffer (10X) | = 2.5 × (2N + 1) × 1.05 |
| 0.5 | T4 DNA Ligase | = 0.5 × (2N + 1) × 1.05 |
| 1.0 | BsaI-HFv2 | = 1.0 × (2N + 1) × 1.05 |

Notes:

- Pipette the water, helper vector, and T4 buffer first.
- Pipette the BsaI and T4 ligase last, keeping them on ice.
- Do not vortex the enzymes. A brief spin in the centrifuge is acceptable if needed.

**Step 7.** Add 12 μL of master mix to each reaction, bringing the total volume per tube to 25 μL. (A repeater pipette can assist with this.) Gently flick the tubes to mix. Spin down briefly if liquid separates within the tubes.

**Step 8.** Place tubes in a thermocycler and start a program with the following settings (there should be a premade program labelled as "BsaI GG" or similar in the saved programs):

| Temperature | Duration |
|---|---|
| 37°C | 18 hr |
| 80°C | 10 min |
| 4°C | Hold |

Record the date these reactions were set up in the Cloning Calculation Table.

**Step 9.** The following day, after the program is finished, remove the tubes from the thermocycler and place them on ice. Prepare the following master mix and add 5 μL of master mix to each reaction tube:

| Amt (ul) for 1rxn | Reagent | Amt (uL) for MM |
|---:|---|---|
| 4.0 | Water | = 4.0 × (2N + 1) × 1.05 |
| 0.5 | rCutsmart Buffer | = 0.5 × (2N + 1) × 1.05 |
| 0.25 | ExoV (RecBCD) | = 0.25 × (2N + 1) × 1.05 |
| 0.25 | BsaI-HFv2 | = 0.25 × (2N + 1) × 1.05 |

**Step 10.** Return the tubes to the thermocycler and run a program with the following settings (premade program should be labelled as "BsaI_Add_Dig" or similar):

| Temperature | Duration |
|---|---|
| 37°C | 2 hr |
| 80°C | 20 min |
| 4°C | Hold |

Record the date this second step was performed in the Cloning Calculation Table.

**Step 11.** Pool the duplicate reactions together in a 1.7 mL tube and perform a Zymo Clean & Concentrator according to the manufacturer's protocols.

---

## 5. BsaI Golden Gate Clean

Tab: `2026MMDD_BsaI Golden Gate Clean`

**Purpose:** To purify the BsaI golden gate reactions for optimal transfection efficiency.

**Reagents:**

- BsaI Golden Gate Reactions
- Zymo Clean and Concentrate Kit
- Qubit HS kit

**Materials:**

- 1.7mL Eppendorf tubes
- Qubit
- Qubit tubes

### Record table (unnamed)

| Column |
|--------|
| Gene |
| Tile |
| Concentration |
| Date Purified |

### Steps

**Step 1.** Pool together the replicate golden gate samples for each tile in a labeled 1.7mL tube (should be 55uL or so total, due to evaporation). Transfer the single negative control sample to a 1.7mL tube as well.

**Step 2.** Bring each sample up to 100uL with water.

**Step 3.** Add 200uL binding buffer to each sample, then pipette mix a few times to ensure the buffer is thoroughly mixed through the sample.

**Step 4.** Place enough Zymo filter tubes as there are samples into collection tubes, then label them with each sample name. Add the sample + binding buffer mix to their respective filter tubes.

**Step 5.** Spin 16000xg for 1 minute. Discard the flow through.

**Step 6.** Add 200uL of wash buffer to each filter. Spin 16000xg for 1 min, then discard the flow through.

**Step 7.** Repeat Step 6.

**Step 8.** Spin the filter tubes one more time at 1600xg for 1 min to dry them out. While waiting, label fresh 1.7mL tubes with each sample name for final collection.

**Step 9.** Transfer the filter tubes to the fresh 1.7mL final collection tubes, then add 12uL of elution buffer. Be sure to add the buffer directly to the filter and not the sides of the filter tube, so it is able to interact with the DNA.

Note: warming the elution buffer at 50-55C beforehand can increase recovery.

**Step 10.** Let the elution buffer sit for 1 minute on the filters, then spin samples at 16000xg for 1 min.

**Step 11.** Discard filters and quantify eluted samples using the Qubit dsDNA HS kit.

- a. If too concentrated, dilute samples 1/5 before reading on the Qubit again.

**Step 12.** Record final values in the table below.

---

## 6. BsaI GG Transformation

Tab: `2026MMDD_BsaI GG Transformation`

**Purpose:** To transform the tiles assembled into the helper vector for future miniprepping.

**Reagents:**

- NEB Stable E. coli
- NEB 10-beta/Stable Outgrowth Medium
- LB Broth
- Molecular-grade H2O
- BsaI golden gate reaction products
- pUC19
- LB + Kanamycin plates (1 per tile + 1 each for H2O and negative controls)
- LB + Ampicillin plate
- Kanamycin

**Materials:**

- Ice bucket
- 8-strip PCR tubes
- Glass test tubes
- Glass beads for spreading on plates
- 1.7-mL eppendorf tubes

**Notes:**

- All reactions will contain 25 μL of NEB Stable cells and 2 or 3 μL of tile DNA.
- Keep all tubes containing NEB Stable cells on ice.
- [NEB's protocol can be found here.](https://www.neb.com/en-us/protocols/high-efficiency-transformation-protocol-c3040h)

### Record table (unnamed)

| Column |
|--------|
| Gene |
| Tile |
| Date Transformed |

### Steps

**Step 1.** Prepare and label 8-strip PCR tubes for each tile to be transformed, the negative control, a puc19 control, and a water control.

**Step 2.** Place Stable Outgrowth Medium in a 37°C water bath or incubator to ensure it is properly warmed before use.

**Step 3.** Retrieve enough NEB Stable cells for the given number of reactions (25uL each). Place them directly into ice and allow to thaw, approximately 5 minutes, until they reach a thick but liquid consistency.

Note:

- Each tube is 200uL
- Use only fresh, unopened tubes; previously thawed and opened cells are more likely to fail.

**Step 4.** Working on ice, pipette 25 μL of NEB Stable cells into each reaction tube.

**Step 5.** Pipette 2.5μL of tile plasmid DNA into reaction tubes. Mix gently by pipetting or flicking. Use 2.5μL of the negative and H2O controls and 1 μL of the pUC19.

**Step 6.** Place reaction tubes directly on ice (remove from tube rack) and allow to rest for 25-30 minutes.

**Step 7.** Set a thermocycler to incubate at 42°C shortly before the rest time is up.

Note: This step can also utilize a 42°C water bath

**Step 8.** Quickly move the reaction tubes to the thermocycler and close the lid. Heat-shock in the thermocycler for exactly 30 seconds, then remove and place immediately back on ice.

**Step 9.** Allow samples to rest on ice for 5 minutes.

**Step 10.** Before the rest time is up, prepare glass culture tubes with 1 mL of NEB 10-beta/Stable Outgrowth Medium, one tube per reaction. Label the tubes with the tile or control names.

**Step 11.** Transfer the rested cells to the glass tubes. Place tubes in a shaking incubator set to 37°C and allow them to recover for one hour.

**Step 12.** During the recovery time, thaw a tube of kanamycin and prepare and label materials for the overnight culture:

- a. 125 mL Erlenmeyer flasks with 29 mL of LB, one for each tile
- b. Kanamycin plates, one for each tile, negative control, and H2O control
  - Label with gene name, tile or control, plate dilution (1:1000 for tiles, 1:100 for controls), date plated, and initials.
  - Example: "ARAF C-term, T1, 1:1000, 5/22/2025, JO"
- c. Ampicillin plate for the pUC19 control, labelled for 1:100 dilution

**Step 13.** After the recovery, retrieve tubes from the incubator. Set aside the control tubes for dilutions in a later step. Pipette the full contents of each tile tube into their respective flasks. Cover and swirl briskly to mix.

**Step 14.** Plate 30 μL from each flask and spread with glass beads. Take care not to let beads just swirl around the plate edge. When all culture media has been absorbed, discard the glass beads in a used beads container.

**Step 15.** After plating, add 30 μL (a 1:1000 ratio) of kanamycin to each flask and swirl to mix.

**Step 16.** Prepare 1:100 dilutions of each control for plating by combining 90 μL of LB and 10 μL of the recovered sample in a new Eppendorf tube, then plate the full 100 μL volume and spread with glass beads.

**Step 17.** Place plates in a stationary 37°C incubator. Place flasks in a shaking 37°C incubator overnight, for a total of 16-18 hours. Record the names of the transformed tiles and the date of completion in the table below.

---

## 7. BsaI Miniprep

Tab: `2026MMDD_BsaI Miniprep`

**Purpose:** To miniprep the 30mL cultures set up of the tiles assembled into the helper vector and transformed into chemicompetent cells

**Reagents:**

- ThermoScientific GeneJET Plasmid Miniprep Kit
- Qubit dsDNA BR kit
- 50% Glycerol

**Materials:**

- 1.7-mL eppendorf tubes
- 2-mL cryo-tubes
- 50-mL centrifuge tubes

### Record table: colony counts and coverage (Step 1)

| Column | Notes |
|--------|-------|
| Gene | |
| Tile | |
| Tile length (bp) | |
| # of colonies | |
| Est. Transformants | = # of colonies × 1000 |
| Coverage | = Est. Transformants / ((Tile length − 50) / 3 × 24) |
| Date | |

Pre-filled for 11 rows.

### Record table: controls (Step 1)

| Controls | # of colonies | Date |
|---|---|---|
| puc19 | | |
| Negative | | |
| Water | | |

### Record table: glycerol stocks (Step 2)

| Column |
|--------|
| Gene |
| Tile |
| Stock ID |
| Freezer Location |
| Date |

### Record table: miniprep quant (Step 13)

| Column |
|--------|
| Gene |
| Tile |
| Nanodrop |
| 260/280 |
| 260/230 |
| Qubit |
| Date |

### Steps

**Step 1.** The following morning, remove plates and flasks from the incubator. Count the colonies on the plates and estimate the number of transformants and the coverage based on the number of variants per tile. If the coverage is sufficient, proceed to miniprep samples.

- a. Transformants calculated by number of colonies x dilution factor.
- b. Coverage is calculated by transformants divided by [tile length (minus 50bp adaptor sequence) x 3 (for nucleic acids per codon) x 24 (number of variations per amino acid)].

**Step 2.** Make a glycerol stock of each tile culture that passes.

- a. Add 500 μL 50% glycerol and 500 μL culture to a labeled 2-mL cryo-tube.
- b. Freeze at -80°C to use in case material runs out.

**Step 3.** Label 2 15-mL conical tubes for each tile and add 5 mL culture to each tube. Centrifuge at 6,800 x g in a microcentrifuge for 2 minutes at room temperature.

**Step 4.** Remove all supernatant (best done with a pipette or vacuum) and continue with the Monarch Spin Plasmid Miniprep Kit, as specified by the manufacturer's protocol.

**Step 5.** Resuspend the pellets in 200uL of Monarch Buffer B1 (pink) either by pipette or vortex. Transfer to 1.5mL labeled microcentrifuge tubes.

**Step 6.** Add 200uL of Monarch Buffer B2 (blue), gently invert 5-6 times (do not vortex), then incubate for 1 min at room temperature.

Note: Avoid incubating longer than one minute to prevent irreversible plasmid denaturation.

**Step 7.** Add 400uL of Monarch Buffer B3 (yellow), then gently invert to mix until the contents are neutralized (no more purple). Do not vortex.

**Step 8.** Centrifuge the lysate for 5 minutes at 16000xg

**Step 9.** Carefully transfer the supernatant to the Monarch Spin Column S2D and centrifuge for 1 minute. Discard the flow-through.

**Step 10.** Re-insert the Monarch Spin Column S2D in the Monarch Spin Collection Tube and add 200 μl of Monarch Buffer BZ (wash 1). Centrifuge at 16000xg for 1 minute. Discard flow through.

Note: Incubate for 5 minutes after adding Monarch Buffer BZ and before centrifugation if the plasmid will be used for transfection.

**Step 11.** Wash by adding 400 μl of Monarch Buffer WZ (wash 2) and centrifuge at 16000xg for 1 minute.

**Step 12.** Transfer the column to a clean 1.5 ml microfuge tube. Add 30uL of elution buffer, then incubate for 1 minute.

**Step 13.** Centrifuge at 16000xg for 1 minute, then combine the elutions for the two preps per tile (same tile). Check concentration on both the Nanodrop (check the 260/280 and 260/230 ratios for purity) and the Qubit dsDNA BR Assay.

**Step 14.** Transfer the remaining 20 mL of overnight culture to a labeled 50-mL centrifuge tube and centrifuge at 4,000 x g for 20 minutes at 4°C. Remove supernatant and freeze at -20°C.

- a. This is a backup to use in case minipreps fail or more material is needed later.

---

## 8. PaqCI Golden Gate

Tab: `2026MMDD_PaqCI Golden Gate`

**Purpose:** To assemble the final library in its respective assay vector via PaqCI Golden Gate assembly.

**Reagents:**

- T4 ligase buffer
- T4 DNA ligase (2000 U/μL)
- PaqCI (20 U/μL)
- PaqCI activator, diluted 1:2 with T4 ligase buffer
- C-tag or N-tag Activity or Abundance Vector (75ng/uL)
- Nuclease-free H2O
- Gene tile pool (pooled equimolar)
- WT superblocks (if necessary)

**Materials:**

- Ice bucket
- 8-strip PCR tubes
- 1.7 mL Eppendorf tubes
- Thermal Cycler

**Notes:**

- One reaction is 20 μL.
- Keep the enzymes in the -20°C freezer until time to pipette.

**Reference values:**

| Backbone | Length |
|---|---|
| Activity backbone | 5585bp |
| Abundance backbone | 6379bp |

### Record table: tile pooling (Step 2)

| Column | Notes |
|--------|-------|
| Gene | |
| Tile | |
| Qubit | ng/μL |
| Pool Volume | = 1000 / Qubit (μL for 1000 ng) |

Pre-filled for 11 rows. Below the table: **Pooled tile quant** (single value).

### Record table: variant estimate (Step 3)

| Column | Notes |
|--------|-------|
| Gene | |
| Tile | |
| Tile Length (bp) | |
| Variants | = (Tile Length − 58) / 3 × 23 |
| Num of Variants (estimated) | = sum of Variants over all rows. "(Adjust sum for number of tiles actually pooled)" |

Pre-filled for 12 rows.

### Record table: PaqCI Cloning Calculation Table

| Column | Notes |
|--------|-------|
| Gene | |
| Assay | |
| Tag Type | |
| Number of Variants *est | |
| Size Pre-Digested Backbone (bp) | |
| Conc. Pre-Digested Backbone (ng/uL) | Default 75.0 |
| Volume Pre-Digested Backbone (uL for 75ng) | = 75 / Conc. Pre-Digested Backbone |
| tile + helper length (bp) | |
| Tile Pool Conc (ng/uL) | |
| Pool needed (ng) | = 75 × (tile + helper length / Size Pre-Digested Backbone) × 2 |
| Volume Tile Pool In Helper (uL) | = Pool needed / Tile Pool Conc |
| Date Golden Gate pt 1 | Step 5 |
| Date Golden Gate pt 2 | Step 7 |

Two rows (one per assay).

### Steps

**Step 1.** Prepare and label 8-strip PCR tubes for:

- Two reactions per library
- Negative control (no inserts added)

**Step 2.** Pool all miniprepped tiles equally (1000ng each), then requant them.

**Step 3.** Calculate the mass and volume of insert(s) to use for each reaction.

Required mass of insert (g) = (insert / vector ratio) × mass of vector (g) × (insert length (bp) / vector length (bp))

Volumes are calculated based on the concentrations of the blocks and tile pool needed to reach a 2:1 ratio of insert:backbone, as well as the water needed to reach a 20-μL reaction, per the equation:

**Step 4.** Prepare reactions (IN REPLICATE) as follows:

- a. Pipette the T4 buffer and PaqCI activator first.
- b. Pipette the PaqCI and T4 ligase last, keeping them on ice.
- c. Do not vortex the enzymes. A brief spin in the centrifuge is acceptable if needed.

Did you dilute PaqCI activator 1:2 in T4 ligase buffer? YES / NO

| Reagent | Assay 1 | Assay 2 |
|---|---|---|
| H2O | = 20 − sum of other reagents | = 20 − sum of other reagents |
| T4 buffer | 2.0 | 2.0 |
| PaqCI activator (Diluted 1:2 in T4 Ligase Buffer) | 0.5 | 0.5 |
| Backbone Plasmid (75ng/uL) | = Volume Pre-Digested Backbone (row 1) | = Volume Pre-Digested Backbone (row 2) |
| Insert (2:1 ratio to backbone) | = Volume Tile Pool In Helper (row 1) | = Volume Tile Pool In Helper (row 2) |
| T4 DNA ligase | 0.5 | 0.5 |
| PaqCI | 0.5 | 0.5 |
| **Total Volume** | = sum (20) | = sum (20) |

**Step 5.** Place tubes in a thermocycler and start program with the following settings (there should be a premade program labelled as "PaqCI GG" or similar in the saved programs):

| Temperature | Duration | |
|---|---|---|
| 37°C | 1 min | Repeat 60x |
| 16°C | 1 min | (repeat) |
| 65°C | 20 min | |
| 4°C | Hold | |

Record the date of setup in the PaqCI Cloning Calculation Table.

**Step 6.** After the program is finished, remove the tubes from the thermocycler and place them on ice. Prepare the following master mix for n + 1 reactions and add 5 μL of master mix to each reaction tube:

Input: **# Assays Assembling** (`N`)

| Volume per reaction (μL) | Reagent | Master Mix |
|---:|---|---|
| 3.5 | H2O | = 3.5 × N × 1.05 × 2 |
| 0.5 | 1:2 PaqCI Activator | = 0.5 × N × 1.05 × 2 |
| 0.5 | rCutSmart Buffer | = 0.5 × N × 1.05 × 2 |
| 0.5 | PaqCI | = 0.5 × N × 1.05 × 2 |
| 5.0 | Total | = 5.0 × N × 1.05 × 2 |

**Step 7.** Return the tubes to the thermocycler and run a program with the following settings (premade program should be labeled as "BsaI_Add_Dig" or similar):

| Temperature | Duration |
|---|---|
| 37°C | 2 hr |
| 80°C | 20 min |
| 4°C | Hold |

Record the date of setup in the PaqCI Cloning Calculation Table.

**Step 8.** Pool the duplicate reactions together in a 1.7 mL tube and perform a Zymo Clean & Concentrator according to the manufacturer's protocols.

---

## 9. SapI Golden Gate

Tab: `2026MMDD_SapI Golden Gate`

**Purpose:** To assemble the final library in its respective assay vector via PaqCI Golden Gate assembly.

**Reagents:**

- rCutsmart
- T4 DNA ligase (2000 U/μL)
- SapI (10 U/μL)
- ATP 10mM
- C-tag or N-tag Activity or Abundance Vector (75ng/uL)
- Nuclease-free H2O
- Gene tile pool (pooled equimolar)
- WT superblocks (if necessary)

**Materials:**

- Ice bucket
- 8-strip PCR tubes
- 1.7 mL Eppendorf tubes
- Thermal Cycler

**Notes:**

- One reaction is 20 μL.
- Keep the enzymes in the -20°C freezer until time to pipette.

**Reference values:**

| Backbone | Length |
|---|---|
| Activity backbone | 5552bp |
| Abundance backbone | 6377bp |

### Record table: tile pooling (Step 2)

Same as [PaqCI Step 2](#record-table-tile-pooling-step-2): Gene, Tile, Qubit, Pool Volume (= 1000 / Qubit). Below the table: **Pooled quant** (single value).

### Record table: variant estimate (Step 3)

Same as [PaqCI Step 3](#record-table-variant-estimate-step-3): Gene, Tile, Tile Length (bp), Variants (= (Tile Length − 58) / 3 × 23), Num of Variants (estimated) (= sum).

### Record table: SapI Cloning Calculation Table

| Column | Notes |
|--------|-------|
| Gene | |
| Assay | |
| Tag Type | |
| Number of Variants *est | |
| Size Pre-Digested Backbone (bp) | |
| Conc. Pre-Digested Backbone (ng/uL) | Default 75.0 |
| Volume Pre-Digested Backbone (uL for 250ng) | = 250 / Conc. Pre-Digested Backbone |
| tile + helper length (bp) | |
| Tile Pool Conc (ng/uL) | |
| Pool needed (ng) | = 250 × (tile + helper length / Size Pre-Digested Backbone) × 2 |
| Volume Tile Pool In Helper (uL) | = Pool needed / Tile Pool Conc |
| Date Golden Gate pt 1 | Step 5 |
| Date Golden Gate pt 2 | Step 7 |

Two rows (one per assay).

### Steps

**Step 1.** Prepare and label 8-strip PCR tubes for:

- Two reactions per library
- Negative control (no inserts added)

**Step 2.** Pool all miniprepped tiles equally (1000ng each), then requant them.

**Step 3.** Calculate the mass and volume of insert(s) to use for each reaction.

Required mass of insert (g) = (insert / vector ratio) × mass of vector (g) × (insert length (bp) / vector length (bp))

Volumes are calculated based on the concentrations of the blocks and tile pool needed to reach a 2:1 ratio of insert:backbone, as well as the water needed to reach a 20-μL reaction, per the equation:

**Step 4.** Prepare reactions (IN REPLICATE) as follows:

- a. Pipette the rCutsmart buffer and ATP first.
- b. Pipette the SapI and T4 ligase last, keeping them on ice.
- c. Do not vortex the enzymes. A brief spin in the centrifuge is acceptable if needed.
- d. The vectors are pre-portioned in strip tubes already, no need to add again.

| Reagent | Assay 1 | Assay 2 |
|---|---|---|
| H2O | = 50 − sum of other reagents | = 50 − sum of other reagents |
| rCutsmart | 5.0 | 5.0 |
| ATP | 5.0 | 5.0 |
| Backbone Plasmid (75ng/uL) | = Volume Pre-Digested Backbone (row 1) | = Volume Pre-Digested Backbone (row 2) |
| Insert (2:1 ratio to backbone) | = Volume Tile Pool In Helper (row 1) | = Volume Tile Pool In Helper (row 2) |
| T4 DNA ligase (2000000U) | 0.5 | 0.5 |
| SapI | 2.5 | 2.5 |
| **Total Volume** | = sum (50) | = sum (50) |

**Step 5.** Place tubes in a thermocycler and start program with the following settings (there should be a premade program labelled as "PaqCI GG" or similar in the saved programs that can be altered):

| Temperature | Duration | |
|---|---|---|
| 37°C | 5 min | Repeat 15x |
| 16°C | 5 min | (repeat) |
| 55°C | 15 min | |
| 4°C | Hold | |

Record the date of setup in the SapI Cloning Calculation Table.

**Step 5.5.** After 1 hour of cycling, pause the cycle and spike in 1uL more SapI into each reaction, then continue.

**Step 6.** After the program is finished, remove the tubes from the thermocycler and place them on ice. Prepare the following master mix for n + 1 reactions and add 5 μL of master mix to each reaction tube:

Input: **# Assays Assembling** (`N`)

| Volume per reaction (μL) | Reagent | Master Mix |
|---:|---|---|
| 4.0 | H2O | = 4.0 × N × 1.05 × 2 |
| 0.25 | ExoV | = 0.25 × N × 1.05 × 2 |
| 0.5 | rCutSmart Buffer | = 0.5 × N × 1.05 × 2 |
| 0.25 | SapI | = 0.25 × N × 1.05 × 2 |
| 5.0 | Total | = 5.0 × N × 1.05 × 2 |

**Step 7.** Return the tubes to the thermocycler and run a program with the following settings (premade program should be labeled as "BsaI_Add_Dig" or similar):

| Temperature | Duration |
|---|---|
| 37°C | 2 hr |
| 80°C | 10 min |
| 4°C | Hold |

Record the date of setup in the SapI Cloning Calculation Table.

**Step 7.5.** After 1 hour of cycling, pause the cycle and spike in 1uL more SapI into each reaction, then continue.

**Step 8.** Pool the duplicate reactions together in a 1.7 mL tube and perform a Zymo Clean & Concentrator according to the manufacturer's protocols.

---

## 10. PacQI/SapI Golden Gate Clean

Tab: `2026MMDD_PacQISapI Golden Gate ` (the tab name has a trailing space)

**Purpose:** To purify the PacQI or SapI golden gate reactions for optimal transfection efficiency.

**Reagents:**

- PacQI/SapI Golden Gate Reactions
- Zymo Clean and Concentrate Kit
- Qubit dsDNA HS kit

**Materials:**

- 1.7mL Eppendorf tubes
- Qubit
- Qubit tubes

### Record table (unnamed)

| Column |
|--------|
| Gene |
| Tile |
| Quant (ng/ul) |
| Date Purified |

### Steps

**Step 1.** Pool together the replicate golden gate samples for each tile in a labeled 1.7mL tube (should be 45uL or so total for PacQI or 105uL for SapI, due to evaporation). Transfer the single negative control sample to a 1.7mL tube as well.

**Step 2.** If PacQI, bring each sample up to 100uL with water.

**Step 3.** If PacQI, add 200uL binding buffer to each sample, then pipette mix a few times to ensure the buffer is thoroughly mixed through the sample. If SapI, add 210uL binding buffer to each sample, or whatever volume is 2x the combined reaction volume.

**Step 4.** Place enough Zymo filter tubes as there are samples into collection tubes, then label them with each sample name. Add the sample + binding buffer mix to their respective filter tubes.

**Step 5.** Spin 16000xg for 1 minute. Discard the flow through.

**Step 6.** Add 200uL of wash buffer to each filter. Spin 16000xg for 1 min, then discard the flow through.

**Step 7.** Repeat Step 6.

**Step 8.** Spin the filter tubes one more time at 1600xg for 1 min to dry them out. While waiting, label fresh 1.7mL tubes with each sample name for final collection.

**Step 9.** Transfer the filter tubes to the fresh 1.7mL final collection tubes, then add 12uL of elution buffer. Be sure to add the buffer directly to the filter and not the sides of the filter tube, so it is able to interact with the DNA.

Note: warming the elution buffer at 50-55C beforehand can increase recovery.

**Step 10.** Let the elution buffer sit for 1 minute on the filters, then spin samples at 16000xg for 1 min.

**Step 11.** Discard filters and quantify eluted samples using the Qubit dsDNA HS kit.

- If too concentrated, dilute samples 1/5 before reading on the Qubit again.

**Step 12.** Record final values in the table below.

---

## 11. Transform Bottleneck

Tab: `2026MMDD_TransformBottleneck`

**Purpose:** Transform the cleaned PaqCI/SapI reactions, then bottleneck to ensure no under or over representation of barcodes per variant

**Reagents:**

- NEB 10-beta E. coli
- NEB 10-beta/Stable Outgrowth Medium (SOM)
- LB Broth
- Molecular-grade H2O
- Carbenicillin, 100 mg/mL
- pUC19 positive control
- PaqCI Golden Gate reactions libraries for gene of interest
- LB + Ampicillin plates

**Materials:**

- Ice bucket
- Electroporation cuvettes, 1 mm
- Electroporation machine (Bio-Rad MicroPulser)
- Glass test tubes
- 500-mL Erlenmeyer flasks

**Notes:**

- See end of document for troubleshooting
- [NEB's Protocol](https://www.neb.com/en-us/protocols/high-efficiency-transformation-protocol-c3019)

### Record table: bottleneck fractions (Step 11)

| Bottleneck Fraction | Volume of Recovery (μL) | Library 1 | Library 2 |
|---|---|---|---|
| 1 | 1000 (all) | | |
| 1/2 | 500 | | |
| 1/4 | 250 | | |
| 1/8 | 125 | | |
| 1/16 | 62.5 | | |
| 1/32 | 31.25 | | |
| | Gene | | |
| | Assay | | |

The Library columns are filled in with initials and date for each fraction performed. The last two rows label which gene and assay each Library column holds.

### Steps

**Step 1.** Label the lids of electroporation cuvettes. Place directly on ice for 10 minutes. Place a bottle of SOM in the standing 37°C incubator to warm until the recovery step.

**Step 2.** Place two tubes of NEB 10-beta cells on ice and allow to thaw, approximately 5 minutes, until they reach a thick but liquid consistency.

- a. One tube of cells = 100 μL.
- b. Use only fresh, unopened tubes; previously thawed and opened cells are more likely to fail.

**Step 3.** Set pipet to 26 μL. Pipet NEB cells into the electroporation cuvettes, dispensing only until the first stop.

- a. Second-stop pipetting may introduce air bubbles to the cuvette, which can cause arcing (leading to electrocution of the cells) during electroporation.
- b. Aspirating 26 μL of cells and pipetting to the first stop dispenses approximately 25 μL, the goal amount.

**Step 4.** Set pipet to 2.1, for a goal of pipetting 2 μL. Pipet DNA into each cuvette, dispensing only until the first stop.

- a. Use only 1 μL of Puc. Use the same amount of H2O as used for DNA.
- b. 2 μL is the standard starting amount. However, if the DNA concentrations are low (<3 ng/μL), or previous bottlenecks have been unsuccessful, 3 μL may be used.

**Step 5.** Gently but firmly tap each cuvette on the countertop several times to mix and settle contents.

**Step 6.** Return cuvettes to ice while preparing the MicroPulser. Retrieve the warmed SOM and labeled glass culture tubes.

**Step 7.** Set up the electroporator by turning it on, pressing the "manual" setting, then adjusting the voltage to 2.00 kV.

**Step 8.** Electroporate the cuvettes by slotting them into the removable rack with the ridge on the cuvette facing out, sliding the rack into the holder, and pressing the "Pulse" button.

- a. Before each electroporation, gently tap the cuvette on the counter to ensure the contents are settled without air bubbles.
- b. Thoroughly wipe down the cuvette with a Kimwipe before putting it in the rack.
- c. Ensure that the cuvette is flat in the rack, and that the rack slides evenly into the holder and is flush with the bottom, with the cuvette pushed fully into the holder between the metal prongs.
  - Consider removing the cap of the cuvette if it is affecting the positioning.
  - It also helps to angle the rack slightly downward then in, to ensure the cuvette is connected to the bottom prongs of the electroporator.
- d. If a sample arcs (marked by a loud pop and an "Arc" reading on the machine), discard it. It will need to be repeated later. (See Troubleshooting section for notes on arcing.)

**Step 9.** Immediately after electroporation, add 975 μL warm SOM to the cuvette, mix by pipetting a few times, then remove cells + SOM and transfer to the recovery (glass) tube. Use a gel-loading tip to get the last bit of cells + SOM out of the cuvette.

**Step 10.** Recover the cells in a shaking incubator at 37°C for 1 hour. During this time, prepare the Erlenmeyer flasks (3 per library) and ampicillin plates (3 per library, 1 per control).

- a. Label with gene name, tile or control, plate ratio (1:1000 for libraries and Puc, 1:100 for negative and H2O controls), date plated, and initials.
  - Example: "ARAF C-term, T1, 1:1000, 5/22/2025, JO
- b. Fill flasks with 150 mL of LB broth. Do not add carbenicillin yet.
- c. Prepare enough plates and flasks as needed for the range of bottleneck fractions being performed.
  - Only the libraries (activity and abundance) need bottlenecking; the controls will only have single plates.
  - The standard starting bottlenecking set is 1/2, 1/4, and 1/8. This may be extended to 1/16 or 1/32 in subsequent attempts if needed.
- d. In rare cases, a 1x (using the full 1 mL of recovered cells) may be done if previous bottlenecking attempts have resulted in extremely low coverage.

**Step 11.** Retrieve the recovered cells from the incubator. If there is less than 1mL due to evaporation or sample loss, consider bringing the volume up to 1mL with more SOM. Add the following volumes of each library to their respective flasks based on the bottlenecks being performed and swirl briskly to mix: Initial and date which fractions were done for which library.

**Step 12.** Save the recovered library samples at 4°C in case additional, smaller bottleneck fractions are needed.

**Step 13.** Prepare dilutions of the controls in 1.7 mL tubes for plating. (The ratios given are relative to the original volume being diluted, ie. 1 mL; the dilutions are made to create large enough volumes of liquid to plate.)

- a. H2O and negative controls at 1:100: 90 μL LB + 10 μL cells
- b. pUC19 at 1:1000: 990 μL LB + 10 μL

**Step 14.** Plate 150 μL from each flask and 100 μL of each diluted control onto its respective ampicillin plate. Spread with glass beads.

**Step 15.** Add 150 μL of carbenicillin to each flask and swirl briskly to mix.

**Step 16.** Empty the glass beads from the plates into a beaker of 10% bleach solution. Place the plates in a stationary 37°C incubator and the flasks in a shaking 30°C incubator overnight for 20-22 hours.

### Troubleshooting

**Arcing during electroporation:**

- Ensure that there are no air bubbles in the cell solution. Pipet slowly and only to the first stop. Pipet the DNA directly on top of the cells. Gently but firmly tap the cuvette on the bench several times after pipetting and before electroporating to help remove any bubbles.
- Keep cuvettes cold. They should be stored in the 4°C fridge and kept on ice as much as possible when handling.
- Wipe cuvettes thoroughly with a Kimwipe before electroporating to ensure no moisture on the outside. Wipe the inside of the cuvette rack if liquid transfers to it from the cuvette.
- If only the libraries arc, but the negative controls and pUC do not: Golden Gate DNA that was not cleaned properly may have salts that affect the conductivity of the cell solution. If an error occurred during the clean and concentrate step, consider repeating it or preparing a new Golden Gate reaction.

---

## 12. Maxiprep

Tab: `2026MMDD_Maxiprep`

**Purpose:** To maxiprep the bottlenecked libraries for use in cells

**Reagents:**

- Zymo Maxiprep Kit
- Resuspension Solution (P1) for current kit (in fridge)
- 85% EtOH

**Materials:**

- 1.7 mL tubes
- serological pipettor with 50 mL, 25 mL, and 10 mL pipettes
- 50 mL centrifuge tubes
- 50 mL tubes, skirted
- 2.0 mL cryotubes with colored cap inserts

### Record table: colony counts and barcode coverage (Step 1)

| Column | Notes |
|--------|-------|
| Gene | |
| Assay Type | |
| Fraction | Bottleneck fraction |
| # Variants | |
| # colonies | |
| Est. Transformants | = # colonies × 1000 |
| Coverage | = Est. Transformants / # Variants |
| Date | |

Pre-filled for 11 rows.

### Record table: controls (Step 1)

| Controls | # of colonies | Date |
|---|---|---|
| puc19 | | |
| Negative | | |
| Water | | |

### Record table: lysate recovery (Step 11)

| Column | Notes |
|--------|-------|
| Gene | |
| Assay | |
| Volume Recovered (mL) | |
| DNA Binding Buffer to Use (mL) | = (Volume Recovered / 35) × 14 |

### Record table: final quant (Step 20)

| Column |
|--------|
| Gene |
| Assay |
| Fraction |
| First Eluate |
| Second Eluate |
| Combined Eluate |
| Date |

### Steps

**Step 1.** The following day, around the 20-hour mark, retrieve the plates from the incubator. Count the plates to get colony estimates and calculate the number of transformants and the coverage of barcodes. The goal is to achieve 25x-50x barcodes per variant.

- a. Any cultures that do not fall within that range should not be used; the barcodes will be over- or underrepresented.
- b. If multiple bottlenecks fall within the range, keep all of them to maxi-prep. The final library will be determined later with NGS.
- c. Barcode coverage = (# colonies × dilution factor / fraction of plate) / #variants

**Step 2.** At 20 hours, check the flask's growth using the Nanodrop spectrophotometer.

- a. Open the Nanodrop program on the computer and select the "Cell Cultures" option.
- b. Ensure that the "Cuvette" option is selected on the upper right left-hand side and the distance is 10mm, with no stir or temperature options on.
- c. The spectrophotometry cuvettes (different from electroporation cuvettes) are stored in a foam box near the station. Load one cuvette with 1 mL of fresh LB and another cuvette with 1 mL of culture (mixed well by shaking before you take the sample).
  - NOTE: The Nanodrop Ultra cannot accurately read a sample greater than 1.5Abs, so you may need to dilute your sample with LB, then multiply the OD by the dilution factor (ex: 500uL sample + 500uL LB, multiply OD by 2).
- d. Load the LB cuvette (the blank) into the Nanodrop with the arrow on the cuvette facing the same direction as the arrow on the Nanodrop. Lower the handle and select "Blank."
- e. After the blank is done, load the culture cuvette and select "Measure."
- f. The value will be listed at the bottom, in the "A600 (Abs)" column. If the value is 3 or greater, the cultures are ready; if not, return the flask to the incubator to continue growing.
  - NOTE: If the incubation period is approaching or has surpassed 22 hours and the OD has not yet reached 3.0, a value of 2.7 or higher is acceptable.

**Step 3.** Before beginning the maxiprep, collect two glycerol stocks of each culture by mixing 500 μL of culture and 500 μL of 50% glycerol solution in each cryotube. Label the colored insert with the gene, library, and bottleneck (i.e. "MEK2 Act. 1/2x") and insert into the cap. Label the side of the tubes with the same information, as well as date and initials.

- a. Place the stocks into a -20°C for at least two hours before moving into the -80C box to slowly bring the cells down to temp.

**Step 4.** For each 150 mL culture, label three 50-mL centrifuge tubes. Divide each culture into ~50-mL aliquots. Do not use the skirted tubes for this.

- a. If doing a larger culture, divide into as many 50-mL aliquots as needed. Break the prep reactions into groups of no more than three aliquots, or 150 mL of culture total.
  - Ex: a 250 mL culture will be broken into five 50-mL aliquots. The first three aliquots will constitute one reaction when recombined; the last two will be the second reaction.

**Step 5.** Centrifuge the tubes at 4,000 x g for 20 minutes at 4°C.

**Step 6.** Pour or vacuum off the supernatant.

- a. Either method is acceptable, but vacuuming off more than 2 cultures is more likely to overwhelm a vacuum flask.
- b. Pouring should be followed by vacuuming off the remaining small volume of supernatant. Add bleach to the waste beaker for ~10% solution and allow to sit for 15-20 minutes before disposing.

**Step 7.** Resuspend the pellets in a total of 14 mL of the P1 (red) solution. Resuspension and recombination of the pellets can be done one of two ways:

- a. Divide the 14 mL across the tubes (i.e. 4.7 mL per tube for 3, or 7 mL per tube for 2). Vortex or pipet until pellets are fully resuspended, then combine into one tube.
- b. Add the full 14 mL to one tube and vortex to resuspend. Once the pellet is suspended, transfer the full volume to the second tube and vortex to resuspend again. Repeat with the final tube.

**Step 8.** Add 14 mL of the P2 lysis solution (blue) to each reaction. Invert at least 6 times to mix and allow to sit for no more than 2-3 minutes. The solution will appear purple and somewhat thick and cloudy.

- a. Do NOT Vortex.

**Step 9.** Add 14 mL of the P3 neutralization solution (yellow) to each reaction. Invert at least 6 times to mix. The solution will rapidly turn yellow and begin to separate into DNA-containing liquid and solid cell debris.

- a. Do NOT Vortex.
- b. As the cell debris separates, it may trap bubbles of the solution, visible as purple streaks or spots in the tube. Invert the tube a few more times and allow it to settle. Repeat as needed until no purple is visible.

**Step 10.** Using a clear plastic rack for support, insert a syringe filter into a skirted 50-mL tube, one per reaction. Carefully pour the entire culture solution into the top of the syringe filter and allow it to settle for 5-10 minutes to let the debris float to the top of the syringe.

- a. Gently tapping or rotating the syringe can help prevent debris from sticking to the bottom of the filter, which may impede the filtering step.

**Step 11.** Insert a plunger into the top of each syringe. Remove the cap from the bottom of the syringe carefully (ensuring that the tip remains in the 50-mL tube to catch any drips), then depress the plunger to push the liquid through. The end volume should be ~35 mL.

- a. If the volume doesn't quite reach 35 mL on the first try, let the syringe sit for a minute or two before trying again.
- b. If there is still less than 35 mL at the end, input the recovered volume in the table below and adjust the DNA binding solution for the next step.
- c. If the filter 'pops' or bursts, the lysate must go through another syringe filter. The syringe will move much faster once the filter bursts. See Troubleshooting section for more information.

**Step 12.** Add 14 mL of DNA binding solution (or the calculated amount) to each tube and invert at least 6 times to mix. Let sit for about one minute.

- a. Do NOT Vortex.

**Step 13.** Label one filter column for each reaction and place on a vacuum manifold. Ensure the reservoir is tightly fitted to the top of the column assembly. With the vacuum off, pour the entire contents of each tube into the columns, then turn on the vacuum and open the manifold valves and let the liquid pass through the filter completely. Close the valves and remove the upper reservoir from each column.

**Step 14.** With the valves closed, add 10 mL of Wash #1 buffer to each column. Open the valves until the liquid has drained through completely.

**Step 15.** With the valves closed, add 10 mL of Wash #2 buffer to each column. Open the valves until the liquid has drained through completely.

- NOTE: Before doing this step, ensure that ethanol has been added to Wash #2 buffer.

**Step 16.** Repeat the second wash step, then keep the valves open for an additional two minutes to remove all buffer.

**Step 17.** Remove the smaller reservoir from the filters and place the filters into individual collection tubes. Centrifuge at 16,000-20,000 x g for 1 minute to remove residual wash buffer.

**Step 18.** Place the filters into fresh 1.7 or 2 mL tubes. Pipette 3400 μL of elution buffer directly into the filters. Let stand for 5-10 minutes to elute the DNA, then centrifuge at 16,000-20,000 x g for 1 minute. Keep the filter, and add it to a fresh 1.7 or 2mL tube, then add an additional 300uL of elution buffer. Wait 5-10 minutes, then centrifuge at 16,000-20,000 x g for 1 minute.

- a. Keep the filters until after the QuBit step in case a sample is low or empty; DNA may remain caught in the filter.

**Step 19.** Place an EndoZero filter column into a labeled 1.7 mL tube for each sample. Pipette the eluate from step 16 (one, then the other, keeping the two separate) into the column and let stand for 2 minutes, then centrifuge at 16,000-20,000 x g for 1 minute.

- a. It is easier to pipette into the EndoZero column with a 200 μL pipettor; the 1 mL pipettor tips don't allow for air to escape and can result in an overflowed column.

**Step 20.** QuBit the final eluates and record the values below.

### Troubleshooting

**Filter pops during the syringe filtration step:**

- This may happen when too much pressure is applied near the end, and is characterized by a sudden reduction in pressure against the plunger (pressing down feels "easier") and the presence of air bubbles/spray.
- Immediately stop plunging if this occurs; cell debris may pass through the popped filter into the filtered substrate.
- Pass the filtered substrate through another syringe filter, then proceed to vacuum steps as normal.

**Low final concentration:**

- DNA may not have eluted out of the first filtration column. Place the used columns in new 1.7 mL tubes and repeat the elution step, then repeat the endotoxin removal step. Test this new eluate on the QuBit.

**Concentration too high to read on QuBit dsDNA BR:**

- Make a 1:10 dilution (2 μL of sample + 18 μL molecular-grade water) and QuBit the dilution. Multiply this value by 10 for the final concentration.

---

## Conversion notes

Things in the sheet that look inconsistent or lost something in export. These are recorded here for whoever builds the LIMS features; the sheet itself was left as is.

- **Bottleneck fractions are stored as dates.** In the Transform Bottleneck table (`2026MMDD_TransformBottleneck` B64:B67), the fractions 1/2, 1/4, 1/8 and 1/16 are the dates 2026-01-02, -04, -08 and -16, probably auto-converted by Sheets when typed. An `m/d` number format makes them display as fractions in the sheet, so the problem only shows when something reads the values (a formula, an export or an import script). This file shows the intended fractions (confirmed by the matching recovery volumes). B63 holds the number 1 and B68 the text "1/32".
- **Oligo NGS Step 9** says "repeat Step 4"; the wash step on that tab is Step 8. The text was copied from the Bead Cleanup tab.
- **Oligo NGS Step 14** says to record values in the "Ampkey Purified Tile Table", which is on the Bead Cleanup tab. The NGS tab's own table has a `Quant (ng/ul)` column.
- **Oligo NGS master mix** lists SYBR Green but the tab's reagent list does not.
- **SapI Golden Gate** purpose says "via PaqCI Golden Gate assembly", and its notes say "One reaction is 20 μL", while the reaction table totals 50 μL.
- **BsaI Miniprep** lists the ThermoScientific GeneJET kit as the reagent, while the steps use the Monarch Spin Plasmid Miniprep Kit. Step 3 labels 15-mL conical tubes, and the materials list has 50-mL tubes.
- **Variant/coverage formulas differ between tabs.** BsaI Miniprep uses `(tile length − 50) / 3 × 24` variants per tile (50 bp adaptor, 24 variants per codon); PaqCI and SapI use `(tile length − 58) / 3 × 23`. The BsaI Miniprep step text says "x 3" where the formula divides by 3.
- **Dilution factor is hard-coded as 1000** in the Est. Transformants formulas (BsaI Miniprep and Maxiprep), regardless of the plate ratio recorded.
- **BsaI Golden Gate Step 2** says to get lengths "from [source]"; the source is not named.
- **PaqCI and SapI Step 3** end with "per the equation:" and no equation follows apart from the mass formula above it.
- **Maxiprep Step 19** refers to "the eluate from step 16"; the elution is Step 18.
- **PaqCI Step 6 master mix** says "n + 1 reactions" but the formula is `N × 1.05 × 2` (duplicates, no extra reaction).
- Cell highlighting (yellow/green input boxes) and the YES/NO choice in PaqCI Step 4 are described in text; the XLSX contained no images or charts.
