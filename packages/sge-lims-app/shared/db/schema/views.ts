import { eq, sql } from "drizzle-orm/sql"
import { uuid, varchar, text, integer, timestamp, doublePrecision, pgView, boolean, smallint, jsonb} from 'drizzle-orm/pg-core'
import { users } from "lims-layer/server/db/schema/user"
import { haPcrProducts, haPuc19GibsonProducts, haPuc19PcrProducts, snvLibAmpProducts, snvLibGibsonProducts, snvLibLinProducts } from "./oligos"
import { haPuc19Plasmids } from "./plasmid"
import { haCloningExperiments, snvLibCloningExperiments, sgRnaCloningExperiments } from "./plasmid-experiment"
import { plates } from "lims-layer/shared/db/schema/plate"
import { plateTypes } from "lims-layer/shared/db/schema/plateTypes"
import { wellContents, wellContentSources, wells } from "lims-layer/shared/db/schema/well"
import { pcrExperiments, pcrExperimentTargets } from "./pcr-experiment"
import { transfectExperiments, transfectTargets } from "./transfect-experiment"
import { targets } from "./target"
import { cycles } from "./cycle"
import { preseq1Primers, preseq1PrimerTargets, preseq2Primers, rnaPreseq1Primers, rnaPreseq1PrimerTargets, rnaPreseq2Primers, rnaPreseq2PrimerTargets } from "./primer"
import { projects } from "./project"
import { recordStatusEnum } from "./status"

export const viewHaPuc19GibsonProductsWithCalcs = pgView('view_ha_puc19_gibson_products_with_calcs', {
    id: uuid('id'),
    name: varchar('name', { length: 255 }),
    haPuc19PcrProductId: uuid('ha_puc19_pcr_product_id'),
    haPuc19PcrProductName: varchar('ha_puc19_pcr_product_name', { length: 255 }),
    puc19VectorAmount: doublePrecision('puc19_vector_amount'),
    puc19VectorConcentration: doublePrecision('puc19_vector_concentration'),
    quant: doublePrecision('quant'),
    preppedOn: timestamp('prepped_on'),
    preppedByName: varchar('prepped_by_name', { length: 255 }),
    haCloningExperimentId: uuid('ha_cloning_experiment_id'),
    haCloningExperimentName: varchar('ha_cloning_experiment_name', { length: 255 }),
    haPcrProductId: uuid('ha_pcr_product_id'),
    haPcrProductName: varchar('ha_pcr_product_name', { length: 255 }),
    haPcrProductLength: integer('ha_pcr_product_length'),
    insertDnaMass: doublePrecision('insert_dna_mass'),
    insertVolume: doublePrecision('insert_volume'),
    vectorVolume: doublePrecision('vector_volume'),
    totalVolume: doublePrecision('total_volume'),
    notes: text('notes'),
    totalReactionVolume: doublePrecision('total_reaction_volume'),
    twoXNebuilderReagentVolume: doublePrecision('two_x_nebuilder_reagent_volume'),
    h2oVolume: doublePrecision('h2o_volume'),
}).as(sql`SELECT
        *,
        CASE WHEN two_x_nebuilder_reagent_volume IS NOT NULL AND insert_volume IS NOT NULL AND vector_volume IS NOT NULL
            THEN two_x_nebuilder_reagent_volume - (insert_volume + vector_volume)
            ELSE NULL
        END AS h2o_volume
    FROM (SELECT
        ${haPuc19GibsonProducts.id} AS id,
        ${haPuc19GibsonProducts.name} AS name,
        ${haPuc19PcrProducts.id} AS ha_puc19_pcr_product_id,
        ${haPuc19PcrProducts.name} AS ha_puc19_pcr_product_name,
        ${haPuc19GibsonProducts.puc19VectorAmount} AS puc19_vector_amount,
        ${haPuc19GibsonProducts.puc19VectorConcentration} AS puc19_vector_concentration,
        ${haPuc19GibsonProducts.quant} AS quant,
        ${haPuc19GibsonProducts.preppedOn} AS prepped_on,
        ${haPuc19GibsonProducts.totalReactionVolume} AS total_reaction_volume,
        CASE WHEN ${haPuc19GibsonProducts.totalReactionVolume} IS NOT NULL THEN ${haPuc19GibsonProducts.totalReactionVolume}/2 ELSE NULL END AS two_x_nebuilder_reagent_volume,
        ${users.name} AS prepped_by_name,
        ${haCloningExperiments.id} AS ha_cloning_experiment_id,
        ${haCloningExperiments.name} AS ha_cloning_experiment_name,
        t_ha_pcr_products.id AS ha_pcr_product_id,
        t_ha_pcr_products.name AS ha_pcr_product_name,
        t_ha_pcr_products.ha_pcr_product_length AS ha_pcr_product_length,
        CASE
            WHEN ${haPuc19GibsonProducts.puc19VectorAmount} IS NOT NULL AND t_ha_pcr_products.ha_pcr_product_length IS NOT NULL
                THEN t_ha_pcr_products.ha_pcr_product_length / 2649.0 * ${haPuc19GibsonProducts.puc19VectorAmount} * 2.0
            ELSE NULL
        END AS insert_dna_mass,
        CASE
            WHEN ${haPuc19GibsonProducts.puc19VectorAmount} IS NOT NULL AND t_ha_pcr_products.ha_pcr_product_length IS NOT NULL AND ${haPuc19GibsonProducts.quant} IS NOT NULL
                THEN t_ha_pcr_products.ha_pcr_product_length / 2649.0 * ${haPuc19GibsonProducts.puc19VectorAmount} * 2.0 / ${haPuc19GibsonProducts.quant}
            ELSE NULL
        END AS insert_volume,
        CASE
            WHEN ${haPuc19GibsonProducts.puc19VectorAmount} IS NOT NULL AND ${haPuc19GibsonProducts.puc19VectorConcentration} IS NOT NULL
                THEN ${haPuc19GibsonProducts.puc19VectorAmount} / ${haPuc19GibsonProducts.puc19VectorConcentration}
            ELSE NULL
        END AS vector_volume,
        CASE
            WHEN ${haPuc19GibsonProducts.puc19VectorAmount} IS NOT NULL AND t_ha_pcr_products.ha_pcr_product_length IS NOT NULL AND ${haPuc19GibsonProducts.quant} IS NOT NULL AND ${haPuc19GibsonProducts.puc19VectorConcentration} IS NOT NULL
                THEN (t_ha_pcr_products.ha_pcr_product_length / 2649.0 * ${haPuc19GibsonProducts.puc19VectorAmount} * 2.0 / ${haPuc19GibsonProducts.quant}) + (${haPuc19GibsonProducts.puc19VectorAmount} / ${haPuc19GibsonProducts.puc19VectorConcentration})
            ELSE NULL
        END AS total_volume,
        ${haPuc19GibsonProducts.notes} AS notes
    FROM ${haPuc19GibsonProducts}
        JOIN ${haPuc19PcrProducts} ON ${haPuc19PcrProducts.id} = ${haPuc19GibsonProducts.haPuc19PcrProductId}
        JOIN (
            SELECT
                ${haPcrProducts.id} AS id,
                ${haPcrProducts.name} AS name,
                ${haPcrProducts.haCloningExperimentId} AS ha_cloning_experiment_id,
                CASE
                    WHEN ${haPcrProducts.startPosition} IS NOT NULL AND ${haPcrProducts.stopPosition} IS NOT NULL
                        THEN ${haPcrProducts.stopPosition} - ${haPcrProducts.startPosition} + 1
                    ELSE NULL
                END AS ha_pcr_product_length
            FROM  ${haPcrProducts}
        ) AS t_ha_pcr_products ON t_ha_pcr_products.id = ${haPuc19PcrProducts.haPcrProductId}
        JOIN ${haCloningExperiments} ON ${haCloningExperiments.id} = t_ha_pcr_products.ha_cloning_experiment_id
        LEFT JOIN ${users} ON ${users.id} = ${haPuc19GibsonProducts.preppedById}) t1`)

export const viewSnvLibGibsonProducts = pgView('view_snv_lib_gibson_products', {
    id: uuid('id'),
    name: varchar('name', { length: 255 }),
    snvLibCloningExperimentId: uuid('snv_lib_cloning_experiment_id'),
    snvLibCloningExperimentName: varchar('snv_lib_cloning_experiment_name', { length: 255 }),
    ampProductId: uuid('amp_product_id'),
    ampProductName: varchar('amp_product_name', { length: 255 }),
    ampProductSize: integer('amp_product_size'),
    ampProductConcentration: doublePrecision('amp_product_concentration'),
    linProductId: uuid('lin_product_id'),
    linProductName: varchar('lin_product_name', { length: 255 }),
    linProductConcentration: doublePrecision('lin_product_concentration'),
    linProductSize: integer('lin_product_size'),
    ampProductVectorAmount: doublePrecision('amp_product_vector_amount'),
    linProductVectorAmount: doublePrecision('lin_product_vector_amount'),
    gibsonOn: timestamp('gibson_on'),
    gibsonByName: varchar('gibson_by_name', { length: 255 }),
    cleanedOn: timestamp('cleaned_on'),
    cleanedByName: varchar('cleaned_by_name', { length: 255 }),
    transformedOn: timestamp('transformed_on'),
    transformedByName: varchar('transformed_by_name', { length: 255 }),
    preppedOn: timestamp('prepped_on'),
    preppedByName: varchar('prepped_by_name', { length: 255 }),
    quant: doublePrecision('quant'),
    plasmidsaurusChecked: boolean('plasmidsaurus_checked'),
    ngsChecked: boolean('ngs_checked'),
    passedQc: boolean('passed_qc'),
    benchlingLink: text('benchling_link'),
    status: recordStatusEnum('status'),
    notes: text('notes'),
    ampVolume: doublePrecision('amp_volume'),
    linVolume: doublePrecision('lin_volume'),
    totalVolume: doublePrecision('total_volume'),
    totalReactionVolume: doublePrecision('total_reaction_volume'),
    h2oVolume: doublePrecision('h2o_volume'),
    ncWaterVolume: doublePrecision('nc_water_volume'),
    twoXNebuilderReagentVolume: doublePrecision('two_x_nebuilder_reagent_volume')
}).as(sql`SELECT
    *,
    CASE WHEN total_reaction_volume IS NOT NULL THEN total_reaction_volume/2 ELSE NULL END AS two_x_nebuilder_reagent_volume,
	CASE WHEN total_reaction_volume IS NOT NULL AND lin_volume IS NOT NULL THEN total_reaction_volume/2 - lin_volume ELSE NULL END AS nc_water_volume,
    CASE WHEN total_reaction_volume IS NOT NULL AND amp_volume IS NOT NULL AND lin_volume IS NOT NULL THEN total_reaction_volume/2 - (amp_volume + lin_volume) ELSE NULL END AS h2o_volume,
	CASE
		WHEN amp_volume IS NOT NULL AND lin_volume IS NOT NULL
		THEN amp_volume + lin_volume
		ELSE NULL
	END AS total_volume
FROM (
	SELECT *,
	CASE
		WHEN amp_product_vector_amount IS NOT NULL AND amp_product_concentration != 0
		THEN amp_product_vector_amount / amp_product_concentration
		ELSE NULL
	END AS amp_volume,
	CASE
		WHEN lin_product_vector_amount IS NOT NULL AND lin_product_concentration != 0
		THEN lin_product_vector_amount / lin_product_concentration
		ELSE NULL
	END AS lin_volume
FROM (
	SELECT
	${snvLibGibsonProducts.id} AS id,
    ${snvLibGibsonProducts.name} AS name,
    ${snvLibGibsonProducts.snvLibCloningExperimentId} AS snv_lib_cloning_experiment_id,
    ${snvLibGibsonProducts.linProductVectorAmount} AS lin_product_vector_amount,
    ${snvLibGibsonProducts.gibsonOn} AS gibson_on,
    ${snvLibGibsonProducts.cleanedOn} AS cleaned_on,
    ${snvLibGibsonProducts.transformedOn} AS transformed_on,
    ${snvLibGibsonProducts.preppedOn} AS prepped_on,
    ${snvLibGibsonProducts.quant} AS quant,
    ${snvLibGibsonProducts.plasmidsaurusChecked} AS plasmidsaurus_checked,
    ${snvLibGibsonProducts.ngsChecked} AS ngs_checked,
    ${snvLibGibsonProducts.passedQc} AS passed_qc,
    ${snvLibGibsonProducts.benchlingLink} AS benchling_link,
    ${snvLibGibsonProducts.status} AS status,
    ${snvLibGibsonProducts.notes} AS notes,
    ${snvLibGibsonProducts.totalReactionVolume} AS total_reaction_volume,
    ${snvLibCloningExperiments.name} AS snv_lib_cloning_experiment_name,
	amp_products.id AS amp_product_id,
	amp_products.name AS amp_product_name,
	amp_products.amp_product_size AS amp_product_size,
	amp_products.quant AS amp_product_concentration,
	lin_products.id AS lin_product_id,
	lin_products.name AS lin_product_name,
	lin_products.quant AS lin_product_concentration,
	lin_products.ha_pcr_product_size AS ha_pcr_product_size,
    gibson_by_user.name AS gibson_by_name,
    cleaned_by_user.name AS cleaned_by_name,
    transformed_by_user.name AS transformed_by_name,
    prepped_by_user.name AS prepped_by_name,
	CASE
		WHEN lin_products.ha_pcr_product_size IS NOT NULL AND amp_products.amp_product_size IS NOT NULL
	 	THEN lin_products.ha_pcr_product_size - amp_products.amp_product_size + 2649
	 	ELSE NULL
	END AS lin_product_size,
	CASE
		WHEN lin_products.ha_pcr_product_size IS NOT NULL AND amp_products.amp_product_size IS NOT NULL
		AND amp_products.amp_product_size IS NOT NULL AND snv_lib_gibson_products.lin_product_vector_amount IS NOT NULL
		AND amp_products.amp_product_size - lin_products.ha_pcr_product_size != 2649
		THEN 7.0 * amp_products.amp_product_size / (lin_products.ha_pcr_product_size - amp_products.amp_product_size + 2649) * snv_lib_gibson_products.lin_product_vector_amount
		ELSE NULL
	END AS amp_product_vector_amount
FROM ${snvLibGibsonProducts}
JOIN ${snvLibCloningExperiments} ON ${snvLibCloningExperiments.id} = ${snvLibGibsonProducts.snvLibCloningExperimentId}
LEFT JOIN ${users} AS prepped_by_user ON prepped_by_user.id = ${snvLibGibsonProducts.preppedById}
LEFT JOIN ${users} AS transformed_by_user ON transformed_by_user.id = ${snvLibGibsonProducts.transformedById}
LEFT JOIN ${users} AS cleaned_by_user ON cleaned_by_user.id = ${snvLibGibsonProducts.cleanedById}
LEFT JOIN ${users} AS gibson_by_user ON gibson_by_user.id = ${snvLibGibsonProducts.gibsonById}
LEFT JOIN
	(SELECT ${snvLibLinProducts.id} AS id,
		${snvLibLinProducts.name} AS name,
		${snvLibLinProducts.snvLibCloningExperimentId} AS snv_lib_cloning_experiment_id,
		${snvLibLinProducts.quant} AS quant,
		CASE
			 WHEN ${haPcrProducts.startPosition} IS NOT NULL AND ${haPcrProducts.stopPosition} IS NOT NULL
			 THEN
			 	${haPcrProducts.stopPosition} - ${haPcrProducts.startPosition} + 1
			 ELSE NULL
		END AS ha_pcr_product_size
		FROM ${snvLibLinProducts}
			LEFT JOIN ${haPuc19Plasmids} ON ${haPuc19Plasmids.id} = ${snvLibLinProducts.haPuc19PlasmidId}
			LEFT JOIN ${haPuc19GibsonProducts} ON ${haPuc19Plasmids.haPuc19GibsonProductId} = ${haPuc19GibsonProducts.id}
			LEFT JOIN ${haPuc19PcrProducts} ON ${haPuc19GibsonProducts.haPuc19PcrProductId} = ${haPuc19PcrProducts.id}
			LEFT JOIN ${haPcrProducts} ON ${haPuc19PcrProducts.haPcrProductId} = ${haPcrProducts.id}
	) lin_products ON lin_products.snv_lib_cloning_experiment_id = ${snvLibGibsonProducts.snvLibCloningExperimentId}
LEFT JOIN (
	SELECT
        ${snvLibAmpProducts.id} AS id,
		${snvLibAmpProducts.name} AS name,
		${snvLibAmpProducts.snvLibCloningExperimentId} AS snv_lib_cloning_experiment_id,
		${snvLibAmpProducts.quant} AS quant,
		CASE
			 WHEN ${snvLibAmpProducts.startPosition} IS NOT NULL AND ${snvLibAmpProducts.stopPosition} IS NOT NULL
			 THEN ${snvLibAmpProducts.stopPosition} - ${snvLibAmpProducts.startPosition} + 1
			 ELSE NULL
		END AS amp_product_size
	FROM ${snvLibAmpProducts}
    ) amp_products ON amp_products.snv_lib_cloning_experiment_id = ${snvLibGibsonProducts.snvLibCloningExperimentId}
) t2 ) t3`)


export const viewPlatesWithWellCounts = pgView('view_plates_with_well_counts', {
  id: uuid('id'),
  name: varchar('name', { length: 255 }),
  sizeX: smallint('size_x'),
  sizeY: smallint('size_y'),
  plateType: varchar('plate_type'),
  discarded: boolean('discarded'),
  processed: boolean('processed'),
  cycleId: varchar('cycle_id'),
  cycleName: varchar('cycle_name'),
  targets: varchar('targets'),
  plateTypeLabel: varchar('plate_type_label'),
  wellsCount: smallint('wells_count'),
  wellsWithContentCount: smallint('wells_with_content_count'),
  wellsProcessedCount: smallint('wells_processed_count'),
  sgRnaCloningExperimentId: varchar('sg_rna_cloning_experiment_id'),
  pcrExperimentId: varchar('pcr_experiment_id'),
}).as(sql`select
    ${plates.id},
    ${plates.name},
    ${plates.sizeX},
    ${plates.sizeY},
    ${plates.plateType},
    ${plates.discarded},
    ${plates.processed},
    ${cycles.id} as cycle_id,
    ${cycles.name} as cycle_name,
    string_agg(distinct ${targets.name}, ',') as targets,
    ${plateTypes.label} as plate_type_label,
    count(distinct(${wells.id})) as wells_count,
    count(distinct(${wellContents.wellId})) as wells_with_content_count,
    count(distinct(${wellContentSources.sourceWellId})) as wells_processed_count,
    ${sgRnaCloningExperiments.id} as sg_rna_cloning_experiment_id,
    ${pcrExperiments.id} as pcr_experiment_id
    from ${plates}
    join ${wells} on ${eq(plates.id, wells.plateId)}
    left join ${plateTypes} on ${eq(plateTypes.value, plates.plateType)}
    left join ${wellContentSources} on ${eq(wells.id, wellContentSources.sourceWellId)}
    left join ${wellContents} on ${eq(wells.id, wellContents.wellId)}
    left join ${pcrExperiments} on ${eq(plates.id, pcrExperiments.plateId)}
    left join ${pcrExperimentTargets} on ${eq(pcrExperiments.id, pcrExperimentTargets.pcrExperimentId)}
    left join ${transfectTargets} on ${eq(pcrExperimentTargets.transfectTargetId, transfectTargets.id)}
    left join ${targets} on ${eq(targets.id, transfectTargets.targetId)}
    left join ${transfectExperiments} on ${eq(transfectTargets.experimentId, transfectExperiments.id)}
    left join ${cycles} on ${eq(transfectExperiments.cycleId, cycles.id)}
    left join ${sgRnaCloningExperiments} on ${eq(plates.id, sgRnaCloningExperiments.plateId)}
    group by ${plates.id}, ${plateTypes.label}, ${cycles.id}, ${sgRnaCloningExperiments.id}, ${pcrExperiments.id}`
)

export const viewSequencingRunAllSamples = pgView('view_sequencing_run_all_samples', {
  id: uuid('id'),
  sampleName: varchar('sample_name'),
  sequencingRunId: uuid('sequencing_run_id'),
  sampleType: varchar('sample_type', { enum: ['internal', 'external'] }),
  dnaId: uuid('dna_id'),
  rnaId: uuid('rna_id'),
  indexPrimer1Id: uuid('index_primer_1_id'),
  indexPrimer2Id: uuid('index_primer_2_id'),
  indexPrimer1Label: varchar('index_primer_1_label'),
  indexPrimer2Label: varchar('index_primer_2_label'),
  indexPlateWellLabel: varchar('index_plate_well_label'),
  sourceWellId: uuid('source_well_id'),
  sourceWellX: integer('source_well_x'),
  sourceWellY: integer('source_well_y'),
  sourcePlateName: varchar('source_plate_name'),
  customIndexSeq1: varchar('custom_index_seq_1'),
  customIndexSeq2: varchar('custom_index_seq_2'),
  millionReadsRequired: doublePrecision('million_reads_required'),
  overrideCycles: varchar('override_cycles'),
  notes: text('notes'),
  createdAt: timestamp('created_at'),
}).as(sql`
WITH index_plate_well (source_well_id, index_plate_well_label) AS (
    SELECT
        source_well_id,
        string_agg(plate_well_label, ', ') as index_plate_well_label
    FROM (
        SELECT DISTINCT ON (wells.id)
            sequencing_run_samples.source_well_id,
            plates.name || ': ' || CHR(wells.y + 64) || wells.x AS plate_well_label
        FROM sequencing_run_samples
            JOIN well_contents on well_contents.well_id = source_well_id
            JOIN well_content_sources ON well_content_id = well_contents.id
            JOIN wells ON well_content_sources.source_well_id = wells.id
            JOIN plates ON wells.plate_id = plates.id
        WHERE plate_type = 'seq-index'
    )
    GROUP BY source_well_id
)
SELECT
  sequencing_run_samples.id AS id,
  CASE
    WHEN dna_pellets.name IS NOT NULL THEN dna_pellets.name || '_DNA'
    WHEN rna_pellets.name IS NOT NULL THEN rna_pellets.name || '_RNA'
    ELSE null
  END AS sample_name,
  sequencing_run_id,
  'internal' AS sample_type,
  dna_id,
  rna_id,
  NULL AS external_sample_id,
  index_primer_1_id,
  index_primer_2_id,
  primer1.index_sequence || ' (' || primer1.primer_type || ')' AS index_primer_1_label,
  primer2.index_sequence || ' (' || primer2.primer_type || ')' AS index_primer_2_label,
  index_plate_well_label,
  sequencing_run_samples.source_well_id,
  wells.x AS source_well_x,
  wells.y AS source_well_y,
  plates.name AS source_plate_name,
  NULL AS custom_index_seq_1,
  NULL AS custom_index_seq_2,
  million_reads_required,
  CASE
    WHEN index_primer_1_id IS NOT NULL AND index_primer_2_id IS NOT NULL THEN 'Y151;I10;I10;Y151'
    WHEN index_primer_1_id IS NOT NULL AND index_primer_2_id IS NULL THEN 'Y151;I10;N10;Y151'
    WHEN index_primer_1_id IS NULL AND index_primer_2_id IS NOT NULL THEN 'Y151;N10;I10;Y151'
  ELSE
    NULL
  END AS override_cycles,
  sequencing_run_samples.notes AS notes,
  created_at
  FROM sequencing_run_samples
  LEFT JOIN dna ON sequencing_run_samples.dna_id = dna.id
  LEFT JOIN rna ON sequencing_run_samples.rna_id = rna.id
  LEFT JOIN pellets AS dna_pellets ON dna.pellet_id = dna_pellets.id
  LEFT JOIN pellets AS rna_pellets ON rna.pellet_id = rna_pellets.id
  LEFT JOIN index_primers AS primer1 ON sequencing_run_samples.index_primer_1_id = primer1.id
  LEFT JOIN index_primers AS primer2 ON sequencing_run_samples.index_primer_2_id = primer2.id
  LEFT JOIN wells ON sequencing_run_samples.source_well_id = wells.id
  LEFT JOIN plates ON wells.plate_id = plates.id
  LEFT JOIN index_plate_well ON sequencing_run_samples.source_well_id = index_plate_well.source_well_id
  UNION
  SELECT
  sequencing_run_external_samples.id AS id,
  external_samples.name AS sample_name,
  sequencing_run_id,
  'external' AS sample_type,
  NULL AS dna_id,
  NULL AS rna_id,
  external_sample_id,
  COALESCE(sequencing_run_external_samples.index_primer_1_id, external_samples.index_primer_1_id) AS index_primer_1_id,
  COALESCE(sequencing_run_external_samples.index_primer_2_id, external_samples.index_primer_2_id) AS index_primer_2_id,
  COALESCE(primer1.index_sequence, ext_primer1.index_sequence) || ' (' || COALESCE(primer1.primer_type, ext_primer1.primer_type) || ')' AS index_primer_1_label,
  COALESCE(primer2.index_sequence, ext_primer2.index_sequence) || ' (' || COALESCE(primer2.primer_type, ext_primer2.primer_type) || ')' AS index_primer_2_label,
  NULL AS index_plate_well_label,
  source_well_id,
  wells.x AS source_well_x,
  wells.y AS source_well_y,
  plates.name AS source_plate_name,
  COALESCE(sequencing_run_external_samples.custom_index_seq_1, external_samples.custom_index_seq_1) as custom_index_seq_1,
  COALESCE(sequencing_run_external_samples.custom_index_seq_2, external_samples.custom_index_seq_2) as custom_index_seq_2,
  million_reads_required,
  CASE
    WHEN (COALESCE(sequencing_run_external_samples.index_primer_1_id, external_samples.index_primer_1_id) IS NOT NULL AND COALESCE(sequencing_run_external_samples.index_primer_2_id, external_samples.index_primer_2_id) IS NOT NULL) OR (COALESCE(TRIM(COALESCE(sequencing_run_external_samples.custom_index_seq_1, external_samples.custom_index_seq_1)), '') <> '' AND COALESCE(TRIM(COALESCE(sequencing_run_external_samples.custom_index_seq_2, external_samples.custom_index_seq_2)), '') <> '') THEN 'Y151;I10;I10;Y151'
    WHEN (COALESCE(sequencing_run_external_samples.index_primer_1_id, external_samples.index_primer_1_id) IS NOT NULL AND COALESCE(sequencing_run_external_samples.index_primer_2_id, external_samples.index_primer_2_id) IS NULL) OR (COALESCE(TRIM(COALESCE(sequencing_run_external_samples.custom_index_seq_1, external_samples.custom_index_seq_1)), '') <> '' AND COALESCE(TRIM(COALESCE(sequencing_run_external_samples.custom_index_seq_2, external_samples.custom_index_seq_2)), '') = '') THEN 'Y151;I10;N10;Y151'
    WHEN (COALESCE(sequencing_run_external_samples.index_primer_1_id, external_samples.index_primer_1_id) IS NULL AND COALESCE(sequencing_run_external_samples.index_primer_2_id, external_samples.index_primer_2_id) IS NOT NULL) OR (COALESCE(TRIM(COALESCE(sequencing_run_external_samples.custom_index_seq_1, external_samples.custom_index_seq_1)), '') = '' AND COALESCE(TRIM(COALESCE(sequencing_run_external_samples.custom_index_seq_2, external_samples.custom_index_seq_2)), '') <> '') THEN 'Y151;N10;I10;Y151'
  ELSE
    NULL
  END AS override_cycles,
  notes,
  sequencing_run_external_samples.created_at AS created_at
  FROM sequencing_run_external_samples
  JOIN external_samples ON sequencing_run_external_samples.external_sample_id = external_samples.id
  LEFT JOIN index_primers AS primer1 ON sequencing_run_external_samples.index_primer_1_id = primer1.id
  LEFT JOIN index_primers AS primer2 ON sequencing_run_external_samples.index_primer_2_id = primer2.id
  LEFT JOIN index_primers AS ext_primer1 ON external_samples.index_primer_1_id = ext_primer1.id
  LEFT JOIN index_primers AS ext_primer2 ON external_samples.index_primer_2_id = ext_primer2.id
  LEFT JOIN wells ON sequencing_run_external_samples.source_well_id = wells.id
  LEFT JOIN plates ON wells.plate_id = plates.id`)

export const viewMixedPreseqPrimers = pgView('view_mixed_preseq_primers', {
    id: uuid('id'),
    name: varchar('name', { length: 255 }),
    sequenceType: varchar('sequence_type', { length: 50 }),
    primerType: varchar('primer_type', { length: 50 }),
    archived: boolean('archived'),
    targets: jsonb('targets').array(),
    projects: jsonb('projects').array(),
}).as(sql`
  SELECT p.id, p.name, p.sequence_type, 'dna-preseq-1'::text AS primer_type, p.archived,
    jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) AS targets,
    jsonb_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.name)) AS projects
  FROM ${preseq1Primers} p
  LEFT JOIN ${preseq1PrimerTargets} pt ON pt.preseq_1_primer_id = p.id
  LEFT JOIN ${targets} t ON t.id = pt.target_id
  LEFT JOIN ${projects} pr ON pr.id = t.project_id
  GROUP BY p.id
  UNION ALL
  SELECT p.id, p.name, p.sequence_type, 'dna-preseq-2'::text AS primer_type, p.archived,
    jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) AS targets,
    jsonb_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.name)) AS projects
  FROM ${preseq2Primers} p
  LEFT JOIN ${targets} t ON t.id = p.target_id
  LEFT JOIN ${projects} pr ON pr.id = t.project_id
  GROUP BY p.id
  UNION ALL
  SELECT p.id, p.name, p.sequence_type, 'rna-preseq-1'::text AS primer_type, p.archived,
    jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) AS targets,
    jsonb_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.name)) AS projects
  FROM ${rnaPreseq1Primers} p
  LEFT JOIN ${rnaPreseq1PrimerTargets} pt ON pt.rna_preseq_1_primer_id = p.id
  LEFT JOIN ${targets} t ON t.id = pt.target_id
  LEFT JOIN ${projects} pr ON pr.id = t.project_id
  GROUP BY p.id
  UNION ALL
  SELECT p.id, p.name, p.sequence_type, 'rna-preseq-2'::text AS primer_type, p.archived,
    jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) AS targets,
    jsonb_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.name)) AS projects
  FROM ${rnaPreseq2Primers} p
  LEFT JOIN ${rnaPreseq2PrimerTargets} pt ON pt.rna_preseq_2_primer_id = p.id
  LEFT JOIN ${targets} t ON t.id = pt.target_id
  LEFT JOIN ${projects} pr ON pr.id = t.project_id
  GROUP BY p.id
`)
