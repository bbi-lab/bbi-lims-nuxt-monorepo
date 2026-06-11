CREATE OR REPLACE FUNCTION translate_dna(dna TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE STRICT
AS $$
SELECT string_agg(
    CASE upper(substring(dna FROM i FOR 3))
        WHEN 'TTT' THEN 'F'  WHEN 'TTC' THEN 'F'
        WHEN 'TTA' THEN 'L'  WHEN 'TTG' THEN 'L'
        WHEN 'CTT' THEN 'L'  WHEN 'CTC' THEN 'L'  WHEN 'CTA' THEN 'L'  WHEN 'CTG' THEN 'L'
        WHEN 'ATT' THEN 'I'  WHEN 'ATC' THEN 'I'  WHEN 'ATA' THEN 'I'
        WHEN 'ATG' THEN 'M'
        WHEN 'GTT' THEN 'V'  WHEN 'GTC' THEN 'V'  WHEN 'GTA' THEN 'V'  WHEN 'GTG' THEN 'V'
        WHEN 'TCT' THEN 'S'  WHEN 'TCC' THEN 'S'  WHEN 'TCA' THEN 'S'  WHEN 'TCG' THEN 'S'
        WHEN 'CCT' THEN 'P'  WHEN 'CCC' THEN 'P'  WHEN 'CCA' THEN 'P'  WHEN 'CCG' THEN 'P'
        WHEN 'ACT' THEN 'T'  WHEN 'ACC' THEN 'T'  WHEN 'ACA' THEN 'T'  WHEN 'ACG' THEN 'T'
        WHEN 'GCT' THEN 'A'  WHEN 'GCC' THEN 'A'  WHEN 'GCA' THEN 'A'  WHEN 'GCG' THEN 'A'
        WHEN 'TAT' THEN 'Y'  WHEN 'TAC' THEN 'Y'
        WHEN 'TAA' THEN '*'  WHEN 'TAG' THEN '*'  WHEN 'TGA' THEN '*'
        WHEN 'CAT' THEN 'H'  WHEN 'CAC' THEN 'H'
        WHEN 'CAA' THEN 'Q'  WHEN 'CAG' THEN 'Q'
        WHEN 'AAT' THEN 'N'  WHEN 'AAC' THEN 'N'
        WHEN 'AAA' THEN 'K'  WHEN 'AAG' THEN 'K'
        WHEN 'GAT' THEN 'D'  WHEN 'GAC' THEN 'D'
        WHEN 'GAA' THEN 'E'  WHEN 'GAG' THEN 'E'
        WHEN 'TGT' THEN 'C'  WHEN 'TGC' THEN 'C'
        WHEN 'TGG' THEN 'W'
        WHEN 'CGT' THEN 'R'  WHEN 'CGC' THEN 'R'  WHEN 'CGA' THEN 'R'  WHEN 'CGG' THEN 'R'
        WHEN 'AGT' THEN 'S'  WHEN 'AGC' THEN 'S'
        WHEN 'AGA' THEN 'R'  WHEN 'AGG' THEN 'R'
        WHEN 'GGT' THEN 'G'  WHEN 'GGC' THEN 'G'  WHEN 'GGA' THEN 'G'  WHEN 'GGG' THEN 'G'
        ELSE '?'
    END,
    '' ORDER BY i
)
FROM generate_series(1, length(dna) - 2, 3) AS i
$$;
--> statement-breakpoint
ALTER TABLE "superblocks" ADD COLUMN "aa_seq" text GENERATED ALWAYS AS (translate_dna(seq)) STORED;