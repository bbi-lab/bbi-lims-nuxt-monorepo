-- Expose status on view_snv_lib_gibson_products. The SNVlib Gibson page reads the view
-- rather than the base table, so without this the status column is invisible there.
-- Ports bbi-lims-sge migration 0193.
--
-- The view body is the monorepo baseline's definition (0000_sge_baseline) with the status
-- column added -- NOT the standalone repo's, which still names the pre-migration
-- gibson_by / cleaned_by / transformed_by / prepped_by columns and the public users table.
-- Nothing depends on this view, so a plain drop-and-recreate is safe.

DROP VIEW "view_snv_lib_gibson_products";--> statement-breakpoint
CREATE VIEW "view_snv_lib_gibson_products" AS (SELECT
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
	"snv_lib_gibson_products"."id" AS id,
    "snv_lib_gibson_products"."name" AS name,
    "snv_lib_gibson_products"."snv_lib_cloning_experiment_id" AS snv_lib_cloning_experiment_id,
    "snv_lib_gibson_products"."lin_product_vector_amount" AS lin_product_vector_amount,
    "snv_lib_gibson_products"."gibson_on" AS gibson_on,
    "snv_lib_gibson_products"."cleaned_on" AS cleaned_on,
    "snv_lib_gibson_products"."transformed_on" AS transformed_on,
    "snv_lib_gibson_products"."prepped_on" AS prepped_on,
    "snv_lib_gibson_products"."quant" AS quant,
    "snv_lib_gibson_products"."plasmidsaurus_checked" AS plasmidsaurus_checked,
    "snv_lib_gibson_products"."ngs_checked" AS ngs_checked,
    "snv_lib_gibson_products"."passed_qc" AS passed_qc,
    "snv_lib_gibson_products"."benchling_link" AS benchling_link,
    "snv_lib_gibson_products"."status" AS status,
    "snv_lib_gibson_products"."notes" AS notes,
    "snv_lib_gibson_products"."total_reaction_volume" AS total_reaction_volume,
    "snv_lib_cloning_experiments"."name" AS snv_lib_cloning_experiment_name,
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
FROM "snv_lib_gibson_products"
JOIN "snv_lib_cloning_experiments" ON "snv_lib_cloning_experiments"."id" = "snv_lib_gibson_products"."snv_lib_cloning_experiment_id"
LEFT JOIN "users"."users" AS prepped_by_user ON prepped_by_user.id = "snv_lib_gibson_products"."prepped_by_id"
LEFT JOIN "users"."users" AS transformed_by_user ON transformed_by_user.id = "snv_lib_gibson_products"."transformed_by_id"
LEFT JOIN "users"."users" AS cleaned_by_user ON cleaned_by_user.id = "snv_lib_gibson_products"."cleaned_by_id"
LEFT JOIN "users"."users" AS gibson_by_user ON gibson_by_user.id = "snv_lib_gibson_products"."gibson_by_id"
LEFT JOIN
	(SELECT "snv_lib_lin_products"."id" AS id,
		"snv_lib_lin_products"."name" AS name,
		"snv_lib_lin_products"."snv_lib_cloning_experiment_id" AS snv_lib_cloning_experiment_id,
		"snv_lib_lin_products"."quant" AS quant,
		CASE
			 WHEN "ha_pcr_products"."start_position" IS NOT NULL AND "ha_pcr_products"."stop_position" IS NOT NULL
			 THEN
			 	"ha_pcr_products"."stop_position" - "ha_pcr_products"."start_position" + 1
			 ELSE NULL
		END AS ha_pcr_product_size
		FROM "snv_lib_lin_products"
			LEFT JOIN "ha_puc19_plasmids" ON "ha_puc19_plasmids"."id" = "snv_lib_lin_products"."ha_puc19_plasmid_id"
			LEFT JOIN "ha_puc19_gibson_products" ON "ha_puc19_plasmids"."ha_puc19_gibson_product_id" = "ha_puc19_gibson_products"."id"
			LEFT JOIN "ha_puc19_pcr_products" ON "ha_puc19_gibson_products"."ha_puc19_pcr_product_id" = "ha_puc19_pcr_products"."id"
			LEFT JOIN "ha_pcr_products" ON "ha_puc19_pcr_products"."ha_pcr_product_id" = "ha_pcr_products"."id"
	) lin_products ON lin_products.snv_lib_cloning_experiment_id = "snv_lib_gibson_products"."snv_lib_cloning_experiment_id"
LEFT JOIN (
	SELECT
        "snv_lib_amp_products"."id" AS id,
		"snv_lib_amp_products"."name" AS name,
		"snv_lib_amp_products"."snv_lib_cloning_experiment_id" AS snv_lib_cloning_experiment_id,
		"snv_lib_amp_products"."quant" AS quant,
		CASE
			 WHEN "snv_lib_amp_products"."start_position" IS NOT NULL AND "snv_lib_amp_products"."stop_position" IS NOT NULL
			 THEN "snv_lib_amp_products"."stop_position" - "snv_lib_amp_products"."start_position" + 1
			 ELSE NULL
		END AS amp_product_size
	FROM "snv_lib_amp_products"
    ) amp_products ON amp_products.snv_lib_cloning_experiment_id = "snv_lib_gibson_products"."snv_lib_cloning_experiment_id"
) t2 ) t3);
