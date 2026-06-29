-- Create plate_types and pcr_types lookup tables (missing from live DB)
-- Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS / INSERT ... ON CONFLICT DO NOTHING

CREATE TABLE IF NOT EXISTS "plate_types" (
    "value" varchar(100) NOT NULL,
    "label" varchar(255) NOT NULL,
    "desc" varchar(500),
    CONSTRAINT "plate_types_pkey" PRIMARY KEY ("value")
);

INSERT INTO "plate_types" ("value", "label", "desc") VALUES
    ('pellet-storage', 'Pellet storage', 'Pellet storage'),
    ('lin-primer-storage', 'LIN primer storage', 'Linearization primer storage'),
    ('amp-primer-storage', 'AMP primer storage', 'Amplification primer storage'),
    ('ha-primer-storage', 'HA primer storage', 'Homology arm primer storage'),
    ('ha-puc19-primer-storage', 'HA pUC19 primer storage', 'Homology arm pUC19 arm primer storage'),
    ('sg-rna-oligo-storage', 'sgRNA oligo storage', 'sgRNA oligo storage'),
    ('sg-rna-oligo', 'sgRNA oligo', 'sgRNA oligo'),
    ('sg-rna-plasmid-storage', 'sgRNA plasmid storage', 'sgRNA plasmid storage'),
    ('sg-rna-plasmid', 'sgRNA plasmid', 'sgRNA plasmid'),
    ('lin-pcr', 'LIN PCR', 'Linearization primer PCR'),
    ('amp-pcr', 'AMP PCR', 'Amplification primer PCR'),
    ('ha-pcr', 'HA PCR', 'Homology arm primer PCR'),
    ('preseq-1', 'PreSeq 1', 'PreSeq 1'),
    ('preseq-2', 'PreSeq 2', 'PreSeq 2'),
    ('preseq-3', 'PreSeq 3', 'PreSeq 3'),
    ('dna-preseq-1', 'DNA PreSeq 1', 'DNA PreSeq 1'),
    ('dna-preseq-2', 'DNA PreSeq 2', 'DNA PreSeq 2'),
    ('dna-preseq-3', 'DNA PreSeq 3', 'DNA PreSeq 3'),
    ('rna-rt-storage', 'RNA RT storage', 'RNA Reverse Transcription storage'),
    ('rna-preseq-1', 'RNA PreSeq 1', 'RNA PreSeq 1'),
    ('rna-preseq-2', 'RNA PreSeq 2', 'RNA PreSeq 2'),
    ('rna-preseq-3', 'RNA PreSeq 3', 'RNA PreSeq 3'),
    ('snv-lib-preseq-2', 'SNVlib PreSeq 2', 'SNVlib PreSeq 2'),
    ('snv-lib-preseq-3', 'SNVlib PreSeq 3', 'SNVlib PreSeq 3'),
    ('seq-index', 'Seq index', 'Sequencing index plate'),
    ('clonal-ha', 'Clonal HA plate', 'Clonal HA plate'),
    ('dna-preseq-1-primer-storage', 'DNA PreSeq 1 primer storage', 'DNA PreSeq 1 primer storage'),
    ('dna-preseq-2-primer-storage', 'DNA PreSeq 2 primer storage', 'DNA PreSeq 2 primer storage'),
    ('rna-rt-primer-storage', 'RNA RT primer storage', 'RNA RT primer storage'),
    ('rna-preseq-1-primer-storage', 'RNA PreSeq 1 primer storage', 'RNA PreSeq 1 primer storage'),
    ('rna-preseq-2-primer-storage', 'RNA PreSeq 2 primer storage', 'RNA PreSeq 2 primer storage'),
    ('external-sample-indexing', 'External sample indexing', 'External sample indexing'),
    ('ha-pcr-product-storage', 'HA PCR product storage', 'HA PCR product storage'),
    ('ha-puc19-pcr-product-storage', 'HA pUC19 PCR product storage', 'HA pUC19 PCR product storage'),
    ('ha-puc19-gibson-product-storage', 'HA pUC19 Gibson product storage', 'HA pUC19 Gibson product storage'),
    ('ha-puc19-plasmid-storage', 'HA pUC19 plasmid storage', 'HA pUC19 plasmid storage'),
    ('snv-lib-amp-product-storage', 'SNVlib AMP product storage', 'SNVlib AMP product storage'),
    ('snv-lib-lin-product-storage', 'SNVlib LIN product storage', 'SNVlib LIN product storage'),
    ('snv-lib-gibson-product-storage', 'SNVlib Gibson product storage', 'SNVlib Gibson product storage'),
    ('snv-lib-plasmid-storage', 'SNVlib plasmid storage', 'SNVlib plasmid storage'),
    ('snv-lib-golden-gate-product-storage', 'SNVlib Golden Gate product storage', 'SNVlib Golden Gate product storage')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS "pcr_types" (
    "value" varchar(100) NOT NULL,
    "label" varchar(255) NOT NULL,
    "desc" varchar(500),
    CONSTRAINT "pcr_types_pkey" PRIMARY KEY ("value")
);

INSERT INTO "pcr_types" ("value", "label", "desc") VALUES
    ('lin-pcr', 'LIN PCR', 'Linearization primer PCR'),
    ('amp-pcr', 'AMP PCR', 'Amplification primer PCR'),
    ('ha-pcr', 'HA PCR', 'Homology arm primer PCR'),
    ('dna-preseq-1', 'DNA PreSeq 1', 'DNA PreSeq 1'),
    ('dna-preseq-2', 'DNA PreSeq 2', 'DNA PreSeq 2'),
    ('dna-preseq-3', 'DNA PreSeq 3', 'DNA PreSeq 3'),
    ('rna-rt', 'RNA RT', 'RNA Reverse Transcription'),
    ('rna-preseq-1', 'RNA PreSeq 1', 'RNA PreSeq 1'),
    ('rna-preseq-2', 'RNA PreSeq 2', 'RNA PreSeq 2'),
    ('rna-preseq-3', 'RNA PreSeq 3', 'RNA PreSeq 3'),
    ('snv-lib-preseq-2', 'SNVlib PreSeq 2', 'SNVlib PreSeq 2'),
    ('snv-lib-preseq-3', 'SNVlib PreSeq 3', 'SNVlib PreSeq 3')
ON CONFLICT DO NOTHING;
