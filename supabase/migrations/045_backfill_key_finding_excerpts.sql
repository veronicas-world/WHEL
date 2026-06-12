-- 045_backfill_key_finding_excerpts.sql
-- Backfill sources.key_finding_excerpt for every free-text source
-- (source_type in {'pubmed', 'clinical_trial', 'reddit'}) where
-- the LLM extraction pipeline produced a usable summary. Generated
-- by scripts/extract-key-findings.py; companion run log lives at
-- scripts/audit-output/key-finding-extractions.json.
--
-- The column existed per migration 041 but was 0% populated until
-- the Phase 2a smoke test on 2026-06-08 surfaced the gap. See
-- methodology v3.13 for the architectural story.
--
-- Each UPDATE is defensive: the WHERE clause includes
-- 'AND key_finding_excerpt IS NULL', so the migration is a no-op
-- on any row that has been touched since extraction ran. Safe to
-- re-run.
--
-- Total extractions in this migration: 148

BEGIN;

-- pubmed/33814355 (Testosterone (transdermal) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This clinical practice guideline from the International Society for the Study of Women''s Sexual Health recommended systemic transdermal testosterone for postmenopausal women with hypoactive sexual desire disorder (HSDD) not primarily related to modifiable factors or comorbidities, noting that limited data also support use in late reproductive age premenopausal women. The guideline reported that current research supports a moderate therapeutic benefit, with safety data showing no serious adverse events at physiologic doses, though long-term safety has not been established. The panel recommended using government-approved transdermal male formulations at doses appropriate for women, with monitoring to maintain total testosterone concentrations in the physiologic premenopausal range.'
 WHERE id = '9828bb10-6ecc-422c-9f79-d3e3472daea6'
   AND key_finding_excerpt IS NULL;

-- pubmed/32852449 (Vaginal Estrogen / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'The 2020 NAMS position statement reported that genitourinary syndrome of menopause (GSM) affects approximately 27% to 84% of postmenopausal women and can significantly impair health, sexual function, and quality of life. The panel concluded that low-dose vaginal estrogens are effective treatments for moderate to severe GSM, and that when low-dose vaginal estrogen is administered, a progestogen is not indicated. However, the statement noted that long-term studies on the endometrial safety of vaginal estrogen are lacking, with clinical trial data not extending beyond 1 year, and that insufficient data exist to confirm its safety in women with breast cancer.'
 WHERE id = 'cd3fec23-b272-47a1-9d25-905736f0729c'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT00536198 (Sertraline / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This randomized, placebo-controlled trial (NCT00536198) evaluated the effectiveness of sertraline versus placebo in reducing PMDD symptoms over six menstrual cycles using luteal-phase dosing, followed by an open-label phase of continuous daily sertraline for three additional cycles. The trial description noted that sertraline is an FDA-approved SSRI for the treatment of PMDD, but no results or outcome data were reported in the available record.'
 WHERE id = 'b3ceee39-b6ce-4e96-9283-e6060bd48616'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT00523705 (Escitalopram / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This pilot study aimed to determine the efficacy and safety of escitalopram administered premenstrually (cycle day 14 through day 2) for severe PMS in young women ages 15–19 years. The trial description noted that SSRIs are considered first-line treatment for severe PMS but that no clinical trials had included this adolescent age group. No efficacy or safety results were reported in the available source text.'
 WHERE id = 'bb32f7b5-1e2c-4045-99b1-7fcd37581ab9'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT02508103 (Oxytocin / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This pilot study (NCT02508103) was designed to investigate whether intranasal oxytocin modifies activation of brain regions involved in emotion regulation (via fMRI) and whether daily intranasal oxytocin administration during the premenstrual phase improves symptoms in women with PMDD, with or without a history of early life abuse. The trial registration describes study objectives only and does not report any outcome data or results regarding the effects of oxytocin on PMDD symptoms.'
 WHERE id = '4239c61c-2cea-4706-a87b-09d6b11913b2'
   AND key_finding_excerpt IS NULL;

-- pubmed/36924778 (NKB Receptor Antagonists (NK3R Antagonists) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'In the SKYLIGHT 1 phase 3 randomized, double-blind, placebo-controlled trial (N=527), the NK3R antagonist fezolinetant at 30 mg and 45 mg once daily significantly reduced the frequency of moderate-to-severe vasomotor symptoms in menopausal women compared with placebo at week 4 (least squares mean difference −1.87, p<0.001 and −2.07, p<0.001) and week 12 (−2.39, p<0.001 and −2.55, p<0.001), with significant reductions in severity also observed at both timepoints. Improvements were evident after 1 week and maintained over 52 weeks, while treatment-emergent adverse event rates were comparable to or lower than placebo (37% and 43% vs 45% at 12 weeks), with low incidence of liver enzyme elevations. The authors concluded that these data support the clinical use of fezolinetant as a non-hormonal treatment for menopause-associated vasomotor symptoms.'
 WHERE id = '49e153a3-28d1-489b-9b27-accb619fe77b'
   AND key_finding_excerpt IS NULL;

-- pubmed/36734148 (NKB Receptor Antagonists (NK3R Antagonists) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'In the SKYLIGHT 2 phase 3 double-blind, placebo-controlled trial, fezolinetant (an NK3R antagonist) at 30 mg and 45 mg once daily statistically significantly reduced the frequency and severity of moderate to severe vasomotor symptoms (VMS) in menopausal women aged 40–65 at both week 4 and week 12 compared to placebo (frequency reduction vs placebo at week 12: -1.86, P < .001 for 30 mg; -2.53, P < .001 for 45 mg). Improvements were observed as early as week 1 and were maintained through 52 weeks of treatment. Serious treatment-emergent adverse events were infrequent (2% for 30 mg, 1% for 45 mg, 0% for placebo), and the authors concluded that both doses were efficacious and well tolerated.'
 WHERE id = 'cdc4ff9d-aa51-4018-aca3-fbbac3d45288'
   AND key_finding_excerpt IS NULL;

-- pubmed/32379217 (Estetrol (E4) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'In a multicenter, randomized, double-blind, placebo-controlled phase 2 trial of 257 postmenopausal women with frequent moderate to severe hot flushes, estetrol (E4) at 15 mg daily significantly reduced weekly hot flush frequency compared to placebo at both week 4 (−66% vs −49%, P = 0.032) and week 12 (−82% vs −65%, P = 0.022). The 15 mg dose also significantly reduced hot flush severity at both time points, while lower doses (2.5, 5, and 10 mg) failed to achieve statistical significance. No endometrial hyperplasia was observed, though endometrial thickness increased during treatment in nonhysterectomized women and normalized following progestin administration, leading the authors to conclude that 15 mg E4 is the minimum effective daily oral dose for vasomotor symptom treatment.'
 WHERE id = 'dc1c2000-b83b-417d-aced-9c93ce71e359'
   AND key_finding_excerpt IS NULL;

-- pubmed/41918604 (Dapagliflozin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'In a 12-week randomized trial of overweight and obese women with PCOS (Rotterdam criteria), the addition of dapagliflozin (10 mg daily) to metformin (2000 mg/day) did not result in statistically significant improvements in insulin resistance or biochemical hyperandrogenism compared to metformin alone. Although both groups showed statistically significant within-group changes, between-group differences were not significant. The dapagliflozin plus metformin group reported more mild adverse effects, including urinary tract infections and vaginal irritation, than the metformin-alone group. The authors concluded that larger and longer-term trials are needed to clarify dapagliflozin''s role in PCOS management.'
 WHERE id = '207cb707-084b-4e16-bb98-79f7976f1453'
   AND key_finding_excerpt IS NULL;

-- pubmed/38374053 (Pioglitazone / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'In a 12-week randomized trial of 60 normal-weight women with PCOS (36 completers), pioglitazone plus metformin (PIOMET) therapy improved LH, LH/FSH ratio, and free androgen index as early as 4 weeks, and by 12 weeks significantly improved SHBG, FAI, androstenedione, total testosterone, and AMH levels compared to baseline (P < 0.05). PIOMET was more effective than metformin monotherapy in improving SHBG, AMH, and postprandial glucose levels at 120 and 180 minutes on the oral glucose insulin-releasing test (P < 0.05), without affecting weight. The authors concluded that PIOMET may offer additional gonadal and metabolic benefits over metformin alone in normal-weight PCOS women, though confirmation in larger studies is needed.'
 WHERE id = '69ab4208-664a-44d4-85c9-3d2f99fb87ec'
   AND key_finding_excerpt IS NULL;

-- pubmed/40166680 (Continuous Oral Contraceptive / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This systematic review and network meta-analysis of six RCTs (563 women with adenomyosis) found that at 6 months, women who received combined oral contraceptives experienced significantly more adenomyosis-associated pelvic pain than those who received dienogest, with a mean difference in VAS pain scores of -2.85 (95% CI -5.30 to -0.39; moderate evidence). The authors concluded that dienogest appears to be the most effective hormonal treatment for adenomyosis-associated pelvic pain, suggesting combined oral contraceptives are a less efficacious option by comparison.'
 WHERE id = '4d5e9701-88be-4403-9a4e-411f7a66a765'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (Levonorgestrel Intrauterine System (LNG-IUS) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This review reported that the intrauterine device releasing levonorgestrel was extremely effective in resolving abnormal uterine bleeding and reducing uterine volume in women with adenomyosis as part of a long-term management plan. The authors noted that no drug is currently labelled for adenomyosis, and the LNG-IUS is used off-label alongside other hormonal treatments to control symptoms. The rationale for its use is grounded in the pathogenetic mechanisms of adenomyosis, including sex steroid hormone aberrations, impaired apoptosis, and increased inflammation.'
 WHERE id = '93666188-97d4-4f03-9977-b87a82d44a58'
   AND key_finding_excerpt IS NULL;

-- pubmed/34919250 (Myo-Inositol / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This study enrolled lean adolescents with PCOS, divided into two age groups (13–16 and 17–19 years), and treated them for 3 months with oral contraceptive pills (OCP), myo-inositol alone, or OCP plus myo-inositol. In the 13–16-year-old group, myo-inositol alone produced a significant decrease in weight and BMI along with improved metabolic and hormonal parameters. In the 17–19-year-old group, myo-inositol combined with OCP prevented increases in weight and BMI, improved metabolic profiles, and strongly ameliorated hormonal parameters. The authors concluded that myo-inositol, alone or combined with OCP, represents a valid therapeutic option for improving both metabolic and hormonal outcomes in PCOS adolescents.'
 WHERE id = '50be03e5-13ff-4994-8bbd-120fa8aba40f'
   AND key_finding_excerpt IS NULL;

-- pubmed/34919250 (Drospirenone/Ethinylestradiol (combined Oral Contraceptive) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This study enrolled lean adolescents with PCOS and compared 3-month treatments of drospirenone/ethinylestradiol (OCP) alone, myo-inositol alone, or OCP plus myo-inositol across two age groups (13–16 and 17–19 years). In the younger group, myo-inositol alone outperformed OCP in improving metabolic and hormonal parameters, while in the 17–19 age group, the combination of OCP with myo-inositol was highlighted as most effective, preventing increases in weight and BMI while strongly ameliorating hormonal parameters. The authors concluded that myo-inositol, either alone or combined with drospirenone/ethinylestradiol, represented a valid treatment option for PCOS adolescents with non-severe metabolic conditions.'
 WHERE id = 'f83c681e-069e-43ad-b013-1bca17eee39a'
   AND key_finding_excerpt IS NULL;

-- pubmed/18493713 (Levetiracetam / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'In this preliminary open-label prospective study of seven women with DSM-IV-TR-diagnosed PMDD, six out of seven patients experienced a considerable decrease in Daily Record of Severity of Problems (DRSP) scores with levetiracetam (dosed from 250 mg nightly up to 1,500 mg twice daily), with improvements beginning in the first treatment cycle. One patient dropped out after one cycle due to lack of efficacy. The medication was reported to be fairly well tolerated over the 4-month treatment phase, and unexpected benefits including reduced food cravings and premenstrual headaches were also noted.'
 WHERE id = '34b8ad59-bdac-41e9-91d5-ca9461cabb5b'
   AND key_finding_excerpt IS NULL;

-- pubmed/24237190 (Chromium (supplementation) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'In a preliminary study combining a single-blind trial of 5 women and a double-blind crossover trial of 6 women, short-term chromium supplementation administered from mid-cycle to onset of menses was associated with reduced mood symptoms and improved overall health satisfaction in most participants with PMDD. In some cases, chromium alone produced marked clinical improvement, while in others, chromium plus sertraline yielded greater improvement than either treatment alone. The authors concluded that chromium may be a useful monotherapy or adjunctive therapy for menstrual cycle-related symptoms, but emphasized that larger controlled studies are needed.'
 WHERE id = 'dde98426-cd0e-4e06-8332-289a45720cdb'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT03480022 (Liraglutide / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This clinical trial (NCT03480022) is a double-blind, placebo-controlled 30-week trial designed to investigate the effects of liraglutide 3 mg versus placebo on body composition, hormonal, and cardiometabolic features in non-diabetic obese women with PCOS, with all participants also receiving diet and lifestyle counseling. The trial description noted that high-dose liraglutide alone results in significant weight reduction in obese women without PCOS, but that data on weight loss with high-dose liraglutide in non-diabetic females with PCOS remained limited. No outcome results were reported in the provided source text.'
 WHERE id = '89b0335f-4f1b-4a69-a89a-1d97aaea86c2'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT01483118 (Cinnamon Extract / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This registered clinical trial (NCT01483118) was a 6-month, placebo-controlled study designed to determine whether cinnamon extract (taken three times daily) could restore menstrual cyclicity in women with PCOS and oligomenorrhea, with a secondary aim of confirming cinnamon''s effect on insulin resistance in a larger cohort. The investigators referenced their own prior 8-week study showing that daily cinnamon use decreased insulin resistance in women with PCOS. No outcome results were reported in the provided trial record, so efficacy findings from this follow-up study are not available.'
 WHERE id = 'ab9002e9-9072-4e50-87af-c5914d467b35'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT00611923 (Flutamide / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This was a randomized, placebo-controlled trial (NCT00611923) designed to evaluate the effectiveness of flutamide, an androgen receptor antagonist, in reducing symptoms of premenstrual dysphoric disorder (PMDD) over a 2-month treatment phase. The trial description noted that flutamide blocks the action of testosterone and other mood-influencing hormones and may be helpful in alleviating PMDD symptoms. However, the available record describes only the study design and protocol; no outcome data or results were reported in the provided source text.'
 WHERE id = '907cb9b6-57b7-4cd5-919d-e8855604c2db'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT00927095 (Continuous Oral Contraceptive / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This trial (NCT00927095) was designed to compare a low-dose oral contraceptive given continuously (daily for three months) against the same OC given in a traditional interrupted 21/7 regimen and against continuous placebo for the treatment of PMDD. The primary hypothesis was that continuous OC administration would minimize destabilizing hormonal fluctuations and thereby prevent PMDD symptom emergence more effectively than either comparator. No results were reported in the source text; the listing describes only the study rationale and design, noting that prior controlled trials of traditional 21/7 OC regimens failed to show superiority over placebo for PMDD, while two trials using a shortened 24/4 pill-free interval showed modest benefit with a substantial placebo response rate.'
 WHERE id = 'b0241889-d1d0-4cc7-8484-41145d1251a4'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT03749109 (Quinagolide / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This was a randomized, double-blind, placebo-controlled, proof-of-mechanism phase 2 trial (NCT03749109) investigating the effect of a quinagolide extended-release vaginal ring on reduction of endometriosis lesions assessed by high-resolution MRI. The study enrolled women with endometrioma, deep infiltrating endometriosis, and/or adenomyosis. No results or key efficacy findings were reported in the available source text.'
 WHERE id = 'ccbbfb47-32c0-42c5-84df-da269b4fc70b'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT03749109 (Quinagolide / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This phase 2 randomized, double-blind, placebo-controlled trial (NCT03749109) was designed to investigate the effect of a quinagolide extended-release vaginal ring on reduction of lesions, assessed by high-resolution MRI, in women with endometrioma, deep infiltrating endometriosis, and/or adenomyosis. The trial listing described the study design as a proof-of-mechanism study but did not report results or findings regarding the efficacy of quinagolide for adenomyosis.'
 WHERE id = 'ca61c6d6-0118-47cd-88eb-7ddeff7b790b'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT03598777 (Abobotulinumtoxina / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This Phase 2 clinical trial (NCT03598777) is designed to define optimal doses of abobotulinumtoxinA (Dysport) and evaluate its efficacy and safety compared with placebo for the treatment of vulvodynia. The study uses a two-stage design consisting of a dose escalation stage followed by a dose expansion stage, each with an initial double-blind period and a subsequent open-label treatment period. No efficacy or safety results were reported in the available trial record.'
 WHERE id = 'd6631424-3118-4653-aed7-bf1aa8f6fb62'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT01301001 (Gabapentin / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This was an 18-week, randomized, double-blind, placebo-controlled, crossover trial (NCT01301001) designed to enroll 120 women aged 18 and older with provoked vulvodynia (PVD) to test whether gabapentin (up to 3600 mg/day) reduces pain from tampon insertion compared to placebo, with secondary outcomes including intercourse pain and 24-hour pain. The trial registration described the study design and rationale but did not report results or findings. Gabapentin was selected based on its known efficacy in other neuropathic pain conditions and its analgesic, anxiolytic, and antispasmodic properties.'
 WHERE id = '71249321-a6e4-4155-b148-6f151171575c'
   AND key_finding_excerpt IS NULL;

-- pubmed/35037089 (GnRH Agonists (e.g., Leuprolide, Triptorelin) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This systematic review of studies published between 2010 and 2020 found that GnRH analogues were effective in reducing pain, uterine volume, and menstrual bleeding in patients with adenomyosis. However, the authors noted that these data were largely obtained outside of randomized controlled trial settings and were limited by issues including patient selection bias, short treatment durations, small sample sizes, and a lack of long-term safety and effectiveness data. Despite these limitations, the review concluded that GnRH analogues were among the interventions with the best available evidence for effectiveness in adenomyosis management.'
 WHERE id = '7422ab1b-f200-40f0-9fc4-2a3fcd0d4190'
   AND key_finding_excerpt IS NULL;

-- pubmed/27577677 (Vaginal Estrogen / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This Cochrane systematic review of 30 RCTs (6,235 postmenopausal women) found low-quality evidence that intravaginal estrogenic preparations (creams, tablets, pessaries, and estradiol-releasing rings) improved symptoms of vaginal atrophy compared to placebo, with individual comparisons showing significant benefits for oestrogen ring versus placebo (OR 12.67, 95% CI 3.23 to 49.66) and oestrogen cream versus placebo (OR 4.10, 95% CI 1.88 to 8.93). The review found no evidence of a difference in efficacy between the various intravaginal oestrogenic formulations when compared with each other. Oestrogen cream was associated with a greater increase in endometrial thickness compared to the oestrogen ring (OR 0.36, 95% CI 0.14 to 0.94), possibly due to higher cream doses, but there was no overall evidence of a difference in adverse events between the preparations or versus placebo.'
 WHERE id = '74e278b8-6de1-4976-ab03-0ace23125281'
   AND key_finding_excerpt IS NULL;

-- pubmed/35037089 (Levonorgestrel Intrauterine System (LNG-IUS) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This systematic review of studies published between 2010 and 2020, searching MEDLINE, Embase, Cochrane Library, CENTRAL, and ClinicalTrials.gov, found that LNG-IUS was effective in reducing pain, uterine volume, and menstrual bleeding in patients with adenomyosis. However, the authors noted that these data were largely obtained in non-trial settings and were limited by issues including patient selection bias, short duration of therapy, small sample sizes, and limited long-term safety and effectiveness data. Despite these limitations, the review concluded that LNG-IUS had among the better evidence for effectiveness in adenomyosis compared to other medical interventions.'
 WHERE id = '833cfa3d-3d31-410d-be55-76cf2b5de54d'
   AND key_finding_excerpt IS NULL;

-- pubmed/29384406 (Micronized Progesterone (oral) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'Based on a systematic literature review, an international expert panel concluded that estrogens combined with oral micronized progesterone do not increase breast cancer risk for up to 5 years of treatment duration in postmenopausal women. The panel noted limited evidence that use beyond 5 years may be associated with an increased breast cancer risk. The authors recommended that counseling on combined menopausal hormone therapy should address breast cancer risk regardless of the progestogen chosen, while also considering other modifiable and non-modifiable breast cancer risk factors.'
 WHERE id = 'e7715e2c-d207-4453-83af-ee61d88321eb'
   AND key_finding_excerpt IS NULL;

-- pubmed/35037089 (Dienogest / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This systematic review of studies published between January 2010 and November 2020 found that dienogest, along with LNG-IUS and GnRH analogues, was effective in reducing pain, uterine volume, and menstrual bleeding in patients with adenomyosis. However, the authors noted that these data were largely obtained outside of randomized controlled trial settings and were limited by issues including patient selection bias, short treatment durations, small sample sizes, and insufficient long-term safety and effectiveness data. The review concluded that while dienogest has better evidence for effectiveness in adenomyosis compared to other pharmacological options, well-designed RCTs are still needed.'
 WHERE id = 'f1edc276-44bf-4e51-a718-2b2e59332ed8'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (Dienogest / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review found that, in areas where it is marketed, the progestin dienogest appears superior to combined oral contraceptives for the treatment of adenomyosis symptoms. However, the authors noted that the levonorgestrel-releasing intrauterine system, rather than dienogest, appears to be the most effective first-line medical therapy based on efficacy, steady-state hormonal levels, and contraceptive benefit. The review highlighted that no approved medical therapy for adenomyosis currently exists and that evidence guiding treatment remains limited.'
 WHERE id = '6ada099f-a19c-40a3-80ba-34e930b1f101'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (Dienogest / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This review reported that no drug is currently labelled for adenomyosis and that several hormonal treatments are used off-label to manage symptoms. The authors noted that dienogest, along with other progestins such as danazol and norethindrone acetate, has antiproliferative and anti-inflammatory effects that support its use in the medical management of adenomyosis, mainly for controlling pain symptoms.'
 WHERE id = 'bb93ebf0-3dc7-4080-95ed-82b963b2fe3c'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (GnRH Agonists (e.g., Leuprolide, Triptorelin) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'The review found that long-acting gonadotropin-releasing hormone (GnRH) agonists are effective for the treatment of adenomyosis and should be considered second-line therapy, after the levonorgestrel-releasing intrauterine system. However, the authors noted that their use is limited by hypogonadal side effects. The review also highlighted that there is no approved medical therapy for adenomyosis and that evidence guiding treatment remains limited overall.'
 WHERE id = '97330c69-9e26-4edd-ae8a-7eacff1ebe86'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (GnRH Agonists (e.g., Leuprolide, Triptorelin) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'The review reported that gonadotropin-releasing hormone analogues are currently used off-label to control pain symptoms and abnormal uterine bleeding in adenomyosis, as no drug is specifically labelled for this condition. The authors noted that GnRH analogues are particularly indicated before fertility treatments to improve the chances of pregnancy in infertile women with adenomyosis. The rationale for their use is based on pathogenetic mechanisms involving sex steroid hormone aberrations, impaired apoptosis, and increased inflammation.'
 WHERE id = 'c88cd581-f317-43ab-969e-f48a7aac369e'
   AND key_finding_excerpt IS NULL;

-- reddit/PMDD (Progesterone (bioidentical/supplemental) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'A user in the thread reported that progesterone pills completely changed everything with respect to their PMDD symptoms, indicating a strongly positive subjective experience. No specific dosage, duration, or additional clinical details were provided beyond this personal account.'
 WHERE id = '32907201-8d9c-415d-b79a-d56bed0ba412'
   AND key_finding_excerpt IS NULL;

-- reddit/PMDD (Progesterone (bioidentical/supplemental) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'A user in the thread described progesterone as producing "absolutely life changing results" for their PMDD. No specific dosage, formulation details, or measurable outcomes were provided beyond this strongly positive personal endorsement.'
 WHERE id = '76046dc6-bc13-49f3-8f4b-eb52e3291ab5'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124671 (Chinese Herbal Medicine (CHM) Formulations / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This comprehensive review identified Chinese herbal medicine (CHM) as one of three major categories of natural plant-derived therapies under investigation for endometriosis. The authors reported that numerous studies suggest CHM treatment is a good choice for endometriosis management, noting that even under clinical conditions, CHM has already been shown to decrease the size of endometriotic lesions, alleviate chronic pelvic pain, and reduce postoperative recurrence rates. The review highlighted that such natural agents exhibit pleiotropic action profiles simultaneously inhibiting proliferation, inflammation, reactive oxygen species formation, and angiogenesis, which are fundamental processes in endometriosis pathogenesis.'
 WHERE id = 'c9828df3-a5f5-4df0-ba28-4ad73a043425'
   AND key_finding_excerpt IS NULL;

-- reddit/PMDD (Calcium / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'The user in the thread reported a major improvement in PMDD symptoms using a holistic approach that included calcium. No specific numerical details, dosages, or study design were provided beyond this brief positive endorsement.'
 WHERE id = '87401552-98dc-468b-be26-ca9a1b29b41c'
   AND key_finding_excerpt IS NULL;

-- pubmed/36000243 (GnRH Antagonists (e.g., Elagolix, Relugolix) / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review reported that most recent research in endometriosis pharmacotherapy has focused on evaluating the efficacy and safety of GnRH antagonists, with add-back therapy recommended for prolonged treatment courses. The authors concluded that GnRH antagonists should be considered as second-line treatment options in selected cases, specifically for women who do not respond to first-line treatments. The review noted that while medical therapy remains the cornerstone of endometriosis management, further studies are still needed to identify the ideal treatment approach.'
 WHERE id = 'bbcb5885-fac0-43a0-a597-576ff52a2bd3'
   AND key_finding_excerpt IS NULL;

-- reddit/endometriosis (Testosterone / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user in the endometriosis community reported that testosterone "cured" their endometriosis, suggesting a perceived complete resolution of symptoms. No further details regarding dosage, duration of use, specific symptoms improved, or formal diagnosis confirmation were provided in the source text.'
 WHERE id = '0b196583-a779-4e13-b346-409628aaa5d5'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Testosterone (topical/compounded) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user reported that after one year of hormone replacement therapy that included testosterone, their severe osteoporosis had reversed. The post described this as a significant positive outcome, though no specific numerical bone density measurements, dosage details, or formulation type for testosterone were provided. This represents a single self-reported case within the context of a combined HRT regimen, making it difficult to attribute the improvement specifically to testosterone alone.'
 WHERE id = '7d24fe42-32a8-492a-8179-32d664332c1f'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user with PCOS reported being told by their healthcare provider that they could not be prescribed metformin because they did not want to have children. This post suggests the user encountered a provider who viewed metformin''s role in PCOS as limited to fertility treatment rather than broader metabolic management, though no clinical outcomes or efficacy data were discussed.'
 WHERE id = '86ff457b-a861-4372-9dd2-75a0a25888c4'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Vaginal Estradiol Cream / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'The Reddit post expressed frustration that vaginal estrogen is not being used as a first-line approach for UTI prevention, implying its efficacy in this context. However, the post did not discuss the use of vaginal estradiol cream specifically for the treatment or management of perimenopause or menopause symptoms.

NO_RELEVANT_FINDING'
 WHERE id = '3d4eccbf-cf95-46e6-9653-ac606171ec72'
   AND key_finding_excerpt IS NULL;

-- pubmed/39724866 (GnRH Antagonists (e.g., Elagolix, Relugolix) / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review proposed a tiered pharmacological prevention and treatment framework for endometriosis, in which gonadotropin-releasing hormone (GnRH) agonists and antagonists were positioned as part of tertiary prevention for established disease. The authors recommended that switching to GnRH agonists and antagonists should not be delayed when first-line agents (estrogen-progestogen combinations and progestogen monotherapies) fail. The review concluded that approximately two-thirds of symptomatic endometriosis patients can be managed satisfactorily for many years using existing safe and effective medications, including these agents when needed.'
 WHERE id = '6f25c85f-2c34-4ae5-ba11-c0606a50a912'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (GLP-1 Receptor Agonists (Ozempic/semaglutide, Mounjaro/tirzepatide, Wegovy, Victoza/liraglutide) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'The source is a Reddit post title expressing a desire or call for FDA approval of Ozempic, Mounjaro, and Zepbound specifically for PCOS. The text contains no clinical findings, study data, or user-reported outcomes regarding the use of GLP-1 receptor agonists for PCOS.

NO_RELEVANT_FINDING'
 WHERE id = '2e8ae31f-7630-43fc-8e97-2aabbbab2a0a'
   AND key_finding_excerpt IS NULL;

-- pubmed/39724866 (Very-Low-Dose Combined Oral Contraceptives (estradiol-Based) / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review proposed that very-low-dose combined oral contraceptives can be used for years as a primary prevention measure in endometriosis patients, counteracting the increased risk of ovarian cancer observed in this population. The authors recommended that tertiary prevention of established endometriosis should initially be based on the safest available estrogen-progestogen combinations, advising that ethinyl estradiol should be avoided due to thromboembolic risk, with estradiol administered transdermally as a preferred alternative. The review concluded that approximately two-thirds of symptomatic endometriosis patients can be managed satisfactorily for many years using existing safe and well-tolerated medications, including these agents.'
 WHERE id = '894b0e26-a215-4e7d-bb2d-1766c0c0a3d8'
   AND key_finding_excerpt IS NULL;

-- pubmed/25637479 (Levonorgestrel Intrauterine System (Mirena) / Depot Medroxyprogesterone Acetate (Depo-Provera) / Etonogestrel Implant (Implanon) / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'The review provided an overview of both FDA-approved and off-label treatments for endometriosis, noting that off-label medication use for this condition is widespread in the United States and worldwide. However, the provided source text does not include specific findings, numerical data, or detailed efficacy results regarding the levonorgestrel intrauterine system, depot medroxyprogesterone acetate, or the etonogestrel implant in the treatment of endometriosis.'
 WHERE id = '93ac1e0f-e48f-4494-9225-6fd383774719'
   AND key_finding_excerpt IS NULL;

-- pubmed/28828592 (Levonorgestrel Intrauterine System (Mirena) / Depot Medroxyprogesterone Acetate (Depo-Provera) / Etonogestrel Implant (Implanon) / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This review article noted that existing drug delivery systems originally designed for contraception have been repurposed for symptomatic relief of endometriosis. Specifically, the authors reported that long-acting implantable contraceptives such as Implanon® and injectables such as Depo-Provera® have found use in treating endometriosis, and that intrauterine systems delivering progestins are among the existing platforms applied to the condition. No specific numerical outcomes or clinical trial data were provided for these agents in the review.'
 WHERE id = '29f8e01e-cbe8-49d7-9fa4-b6e4c95c1adf'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (CBD Oil (medical Grade) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A user in the Menopause subreddit reported that CBD Oil helped their menopause symptoms. No specific details regarding dosage, duration of use, particular symptoms improved, or magnitude of effect were provided.'
 WHERE id = '6a917e8e-3a50-4775-9387-c06a0adf3e96'
   AND key_finding_excerpt IS NULL;

-- pubmed/36000243 (Selective Progesterone Receptor Modulators (SPRMs) / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review discussed the potential role of selective progesterone receptor modulators (SPRMs) as part of the latest advances in pharmacological management of endometriosis, alongside GnRH antagonists and SERMs. However, the authors concluded that most studies have focused on GnRH antagonists rather than SPRMs, and stated that further studies are needed to identify the ideal treatment for women with endometriosis, without reporting specific efficacy data for SPRMs.'
 WHERE id = '6723820a-2527-41a9-9f8a-793ca0232898'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Vaginal Estradiol Cream / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'The user in the menopause subreddit expressed strong regret at having waited so long to start using vaginal cream, implying a notably positive personal experience after beginning treatment. No specific symptoms, dosing details, or measurable outcomes were described beyond this general endorsement.'
 WHERE id = '28f0a415-da0c-4020-9615-c156f06f811f'
   AND key_finding_excerpt IS NULL;

-- pubmed/38854774 (Selective Progesterone Receptor Modulators (SPRMs) / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This review article systematically summarized findings from previously published experimental studies and clinical trials on progesterone resistance in endometriosis. The authors reported that selective progesterone receptor modulators (SPRMs), along with selective estrogen receptor modulators, have emerged as novel therapeutic approaches for endometriosis, offering potential improvements in overcoming progesterone resistance. However, the review noted that concerns and limitations persist despite these newly developed drugs, and further studies on new therapeutic targets based on the molecular mechanisms of progesterone resistance are warranted.'
 WHERE id = '3498eb2c-2bf9-4137-8cda-2965d4d4a37b'
   AND key_finding_excerpt IS NULL;

-- pubmed/18220493 (Sertraline / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This review noted that selective serotonin reuptake inhibitors (SSRIs), a class that includes sertraline, have demonstrated efficacy for PMDD and that three SSRIs have received US FDA approval for its treatment. The authors highlighted that, due to the unique pathophysiology of PMDD, SSRIs can be effectively administered intermittently during the luteal phase (the 2 weeks prior to menses) rather than continuously. However, sertraline was not individually discussed by name in this source, which focused on the SSRI class and other pharmacologic options broadly.'
 WHERE id = '279d1d8a-cf88-4b3c-9734-b8ec96f49136'
   AND key_finding_excerpt IS NULL;

-- pubmed/16734319 (Spironolactone / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'The review identified spironolactone as one of the pharmacologic agents often used off label to treat premenstrual symptoms, including PMDD. However, no specific efficacy data, effect sizes, or clinical trial results for spironolactone were reported in this source; it was mentioned only in the context of listing available off-label treatment options alongside oral contraceptives.'
 WHERE id = '0b878bdc-f5ab-4044-bece-448acf39388a'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (Levonorgestrel Intrauterine System (LNG-IUS) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'The authors reported that the levonorgestrel-releasing intrauterine system appears to be the most effective first-line therapy for adenomyosis, based on its efficacy compared with oral agents, maintenance of steady-state hormonal levels, and contraceptive benefit. This review noted that no approved medical therapy for adenomyosis exists and that most available evidence focuses on treatment of heavy menstrual bleeding, painful menses, and pelvic pain, with data on fertility outcomes, sexual function, and quality of life remaining lacking.'
 WHERE id = '464690af-554e-4a5f-adb5-7ef06daa7d96'
   AND key_finding_excerpt IS NULL;

-- pubmed/35797481 (Estrogen (systemic HRT) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'The 2022 NAMS Position Statement, a consensus guideline developed by an expert Advisory Panel, affirmed that hormone therapy remains the most effective treatment for vasomotor symptoms (VMS) and the genitourinary syndrome of menopause, and has been shown to prevent bone loss and fracture. For women aged younger than 60 years or within 10 years of menopause onset with no contraindications, the benefit-risk ratio was deemed favorable for treating bothersome VMS and preventing bone loss. For women initiating hormone therapy more than 10 years from menopause onset or aged older than 60, the benefit-risk ratio appeared less favorable due to greater absolute risks of coronary heart disease, stroke, venous thromboembolism, and dementia. The statement emphasized that risks differ by type, dose, duration, route of administration, timing of initiation, and use of a progestogen, and that treatment should be individualized with periodic reevaluation.'
 WHERE id = '7b55485c-cbb2-4e9a-a1d2-e053cae04b93'
   AND key_finding_excerpt IS NULL;

-- pubmed/15162347 (AbobotulinumtoxinA (aboBoNT-A) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This case report described a patient with refractory vulvodynia and severe dyspareunia who was successfully managed using a novel therapeutic approach combining botulinum toxin A and surgery. The patient had previously failed standard treatments including antidepressants, anticonvulsants, biofeedback, pelvic floor physical therapy, and surgery alone. The authors reported a successful outcome, though the source did not specify whether the botulinum toxin A used was specifically abobotulinumtoxinA or another formulation, nor did it provide detailed quantitative outcome measures.'
 WHERE id = '1919119f-b681-4400-a202-400dac7dd965'
   AND key_finding_excerpt IS NULL;

-- pubmed/34970669 (Myo-Inositol / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review synthesized evidence from randomized controlled trials, systematic reviews, and meta-analyses regarding nutrient supplementation in PCOS, and identified inositols as one of several specific vitamins and nutrients that may be beneficial for women with the condition. However, the authors noted that areas of uncertainty and key limitations in the literature remain, and must be addressed before inositols and other complementary therapies can be integrated into routine clinical practice.'
 WHERE id = '28a35b3a-05b8-4c34-9e01-b92f1875e3b1'
   AND key_finding_excerpt IS NULL;

-- pubmed/33260918 (Myo-Inositol / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review identified 197 articles, including 35 randomized controlled trials, examining the effects of myo-inositol (MI) and D-chiro-inositol (DCI) in PCOS. The authors reported that MI treatment improved ovarian function and fertility, decreased hyperandrogenism severity (including acne and hirsutism), positively affected metabolic parameters, and modulated hormonal factors involved in ovulation. The review concluded that MI, DCI, and their combination in a physiological 40:1 ratio could be beneficial for improving metabolic, hormonal, and reproductive aspects of PCOS.'
 WHERE id = '15d70608-d8a0-4fe7-bc29-bdde200aa27a'
   AND key_finding_excerpt IS NULL;

-- pubmed/36614868 (Myo-Inositol / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This systematic review of non-hormonal pharmacological treatments for menstrual irregularities in adolescents with PCOS identified myo-inositol among the supplements evaluated. The authors reported that supplements, including myo-inositol, were effective in regulation of menstrual cycles in adolescents diagnosed with PCOS, though the review noted that only a few studies had partly pointed out beneficial effects on improving menstrual frequency. The review highlighted the limited evidence base, identifying only four placebo-controlled studies overall, and called for further studies to evaluate therapies in this population.'
 WHERE id = '1330114f-bf8d-44a0-95aa-d7be6726b985'
   AND key_finding_excerpt IS NULL;

-- pubmed/36614868 (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This systematic review of literature from 1998 to 2022 found that metformin at dosages of 1500–2550 mg/day was effective in regulating menstrual cycles in adolescents diagnosed with PCOS. The authors reported that metformin was the most effective and cost-efficient non-hormonal pharmacological option in overweight adolescent girls, also showing beneficial effects on insulin sensitivity, particularly when oral contraceptive pills are contraindicated or poorly tolerated. However, the review noted that only four placebo-controlled studies were identified with diverging inclusion and exclusion criteria, and further studies were needed to evaluate therapies in lean and normal-weight girls with PCOS.'
 WHERE id = '7e6c737c-22c8-458c-a82e-27e0a8d561f8'
   AND key_finding_excerpt IS NULL;

-- pubmed/35181044 (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review identified metformin as one of the established medications currently used for symptomatic treatment of PCOS, alongside oral contraceptives and antiandrogens. However, the authors noted that current interventions, including metformin, are not able to fully deal with the outcomes of PCOS, and the review focused primarily on summarizing newer and emerging therapeutic modalities such as inositols, GLP-1 agonists, DPP-4 inhibitors, and SGLT2 inhibitors as potential alternatives or adjuncts.'
 WHERE id = 'a9018fea-37f4-47c1-b542-e11baa480830'
   AND key_finding_excerpt IS NULL;

-- pubmed/35054768 (GLP-1 Receptor Agonists (e.g., Liraglutide, Exenatide) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review article identified glucagon-like peptide-1 (GLP-1) receptor agonists among several drug classes with supporting data for repurposing in PCOS management. The authors noted that few completed clinical trials with low populations and mostly without published results exist for PCOS repurposed medications, including GLP-1 receptor agonists, and called for further well-designed clinical trials on this subject. No specific numerical findings or effect sizes for GLP-1 receptor agonists in PCOS were reported in this source.'
 WHERE id = '3cb0c7be-4db5-4e30-859c-a1d9840921f4'
   AND key_finding_excerpt IS NULL;

-- pubmed/35181044 (GLP-1 Receptor Agonists (e.g., Liraglutide, Exenatide) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review identified GLP-1 receptor agonists as one of several novel insulin-sensitizing therapeutic modalities for the treatment and management of PCOS, alongside inositols, DPP-4 inhibitors, and SGLT2 inhibitors. However, the source did not provide specific numerical findings, effect sizes, or detailed study-level evidence regarding the efficacy of GLP-1 agonists in PCOS, instead summarizing them as part of emerging pharmacotherapeutic interventions for the syndrome.'
 WHERE id = '8085ad96-6915-4fd5-a573-bc8e649b9af0'
   AND key_finding_excerpt IS NULL;

-- pubmed/36614868 (GLP-1 Receptor Agonists (e.g., Liraglutide, Exenatide) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This systematic review of non-hormonal pharmacological treatments for menstrual irregularities in adolescents with PCOS identified GLP-1 receptor agonists among the therapies effective in regulating menstrual cycles. The review encompassed literature from January 1998 to September 2022, evaluating 164 studies, and found that GLP-1 analogues, along with metformin and supplements, showed beneficial effects on improving menstrual frequency. However, the authors noted that only a few studies partly demonstrated these benefits, and metformin was considered the most effective and cost-efficient option, particularly in overweight adolescent girls.'
 WHERE id = '94ed6418-044b-4b8d-92c0-14707f4ee3d2'
   AND key_finding_excerpt IS NULL;

-- pubmed/35054768 (SGLT2 Inhibitors (e.g., Empagliflozin, Dapagliflozin) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review article identified sodium-glucose cotransporter-2 (SGLT2) inhibitors as one of several drug classes with supporting data for repurposing in PCOS, alongside thiazolidinediones, DPP-4 inhibitors, GLP-1 receptor agonists, and others. However, the authors noted that completed clinical trials on PCOS repurposed medications, including SGLT2 inhibitors, are few in number, involve low patient populations, and mostly lack published results. The review called for further well-designed clinical trials to evaluate these repurposed medications in PCOS.'
 WHERE id = 'c18ab34c-db03-4689-9fc0-089d9b2004ad'
   AND key_finding_excerpt IS NULL;

-- pubmed/35181044 (SGLT2 Inhibitors (e.g., Empagliflozin, Dapagliflozin) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review identified SGLT2 inhibitors as one of several novel insulin-sensitizing therapeutic modalities for the treatment and management of PCOS, alongside inositols, GLP-1 agonists, and DPP-4 inhibitors. However, the source text did not provide specific numerical findings, clinical trial data, or detailed efficacy outcomes for SGLT2 inhibitors in PCOS, limiting the extraction to their categorization as an emerging pharmacotherapeutic intervention summarized within the review.'
 WHERE id = 'dc1a9cf4-7b0b-423a-9016-af64411acc22'
   AND key_finding_excerpt IS NULL;

-- pubmed/35054768 (Statins (HMG-CoA Reductase Inhibitors) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review evaluated PCOS pathogenesis and management, identifying HMG-CoA reductase inhibitors (statins) among several drug classes with supporting data for repurposing in PCOS. The authors noted that few completed clinical trials exist for PCOS repurposed medications, with low study populations and mostly without reported results, and called for further well-designed clinical trials on the subject. No specific numerical findings or effect sizes for statins in PCOS were reported in this review.'
 WHERE id = '6b852f6a-3e17-4617-815e-36e5a68dd57d'
   AND key_finding_excerpt IS NULL;

-- pubmed/35181044 (Statins (HMG-CoA Reductase Inhibitors) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review identified statins as one of several emerging therapies for the treatment and management of PCOS, summarizing available evidence supporting their use alongside other novel interventions such as inositols, GLP-1 agonists, and vitamin D. However, the source did not provide specific numerical findings, effect sizes, or details regarding the mechanism or clinical outcomes of statin use in PCOS beyond categorizing them as a promising therapeutic modality.'
 WHERE id = '88b792d8-31af-489e-a26b-b7d326c3a0ab'
   AND key_finding_excerpt IS NULL;

-- pubmed/34970669 (Vitamin D / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review synthesized evidence from randomized controlled trials, systematic reviews, and meta-analyses regarding nutrient supplementation in PCOS. The authors reported that Vitamin D was among specific vitamins identified as potentially beneficial for women with PCOS, who tend to be nutrient deficient in many common vitamins and minerals. However, the review noted that areas of uncertainty and key limitations in the literature remain and must be overcome before therapies such as Vitamin D supplementation can be integrated into routine clinical practice.'
 WHERE id = '6fceb89a-87c2-4bf7-bb59-335e7c9c3bd5'
   AND key_finding_excerpt IS NULL;

-- pubmed/35181044 (Vitamin D / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review identified vitamin D as one of several emerging therapies for the treatment and management of PCOS, summarizing evidence suggesting its potential use alongside statins and Letrozole as novel therapeutic modalities. However, the review did not report specific numerical findings, effect sizes, or study-level details regarding vitamin D''s efficacy in PCOS, instead positioning it within a broader overview of current and emerging pharmacotherapeutic interventions for the syndrome.'
 WHERE id = '216e3742-324f-41e3-bdca-25b54db43d31'
   AND key_finding_excerpt IS NULL;

-- pubmed/28096785 (Vitamin D / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review article aimed to summarize available literature on the effects of several nutrients, including vitamin D, on the hormonal and metabolic disturbances associated with PCOS. However, the provided source text does not report any specific findings, effect sizes, or study-level results regarding the relationship between vitamin D supplementation and PCOS outcomes, offering only a general statement that evidence supports certain nutrients may affect PCOS-related disturbances.'
 WHERE id = '006649e9-4a82-4bd4-9853-ebcb2e7bc5b3'
   AND key_finding_excerpt IS NULL;

-- pubmed/36614868 (Drospirenone/Ethinylestradiol (combined Oral Contraceptive) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This systematic review noted that oral contraceptive pills (COCs) are commonly prescribed for adolescents with PCOS-related menstrual irregularities, but the review itself focused on non-hormonal pharmacological alternatives for cases where COCs are contraindicated or poorly tolerated. The study did not directly evaluate the efficacy of drospirenone/ethinylestradiol or any specific COC formulation in PCOS, instead positioning COCs as the standard baseline treatment against which non-hormonal options such as metformin and GLP-1 analogues were considered.'
 WHERE id = 'a6c0105d-bd2c-4623-9e92-00fb62ee3866'
   AND key_finding_excerpt IS NULL;

-- pubmed/18389090 (Drospirenone/Ethinyl Estradiol (24/4 Regimen) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'Drospirenone 3 mg/ethinyl estradiol 20 mcg in a 24/4 regimen was described as the only hormonally based contraceptive with large randomized controlled trials demonstrating efficacy for PMDD. The authors noted it received FDA approval not only for pregnancy prevention but also specifically for the treatment of PMDD. They further reported that traditional oral contraceptive formulations do not generally improve the affective, behavioral, and somatic symptoms associated with PMS and PMDD, distinguishing this formulation from other available options.'
 WHERE id = 'dcef96c4-9fe2-49df-bb04-c7650bfa1425'
   AND key_finding_excerpt IS NULL;

-- pubmed/18220493 (Drospirenone/Ethinyl Estradiol (24/4 Regimen) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'The review identified a low-dose oral contraceptive pill containing the progestin drospirenone, in a new dosing regimen, as one of only two pharmacologic approaches with an approved US FDA indication for the treatment of PMDD. This option was noted to be appropriate for women who also desire hormonal contraception. The authors described PMDD as a chronic disorder affecting approximately 6% of reproductive-aged women who meet strict criteria, with an additional ~20% who nearly meet these criteria.'
 WHERE id = 'cf29525c-2e0f-4e50-adef-f336f1fbb9f5'
   AND key_finding_excerpt IS NULL;

-- pubmed/16734319 (Drospirenone/Ethinyl Estradiol (24/4 Regimen) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'The review noted that oral contraceptives historically lacked consistent controlled trial data supporting efficacy for premenstrual symptoms, until recent studies demonstrated that an OC containing the novel progestin drospirenone was effective in reducing premenstrual symptoms in many women. The authors reported that a drospirenone-containing OC formulation administered for 24 days in a 28-day cycle has been shown to be effective in treating PMDD. No specific effect sizes, sample sizes, or p-values were provided in this review.'
 WHERE id = 'bfc859b5-3755-4f9a-9897-f1dfb279ddd5'
   AND key_finding_excerpt IS NULL;

-- reddit/vulvodynia (Amitriptyline / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'A user in the r/vulvodynia subreddit posted about their experience with amitriptyline, titling their post "Amitriptyline Success," indicating a positive outcome in managing their vulvodynia symptoms. No further details regarding dosage, duration of treatment, or specific symptom improvements were provided in the available source text.'
 WHERE id = 'ebf06df2-ff67-43b5-a021-61477bf6629e'
   AND key_finding_excerpt IS NULL;

-- pubmed/39724866 (GnRH Agonists (e.g., Leuprolide, Triptorelin) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review proposed that secondary pharmacological prevention based on a working diagnosis of early onset adenomyosis-endometriosis in adolescents with severe dysmenorrhea and heavy menstrual bleeding can potentially impede development of advanced disease forms and reduce complications from delayed diagnosis. The authors recommended that switching to gonadotropin-releasing hormone agonists and antagonists should not be delayed when first-line agents (estrogen-progestogen combinations and progestogen monotherapies) fail in the tertiary prevention of established disease. The review concluded that approximately two-thirds of symptomatic patients can be managed satisfactorily for many years using existing medications with appropriate modalities.'
 WHERE id = '84d3523e-a355-4c08-800b-6b63d162577c'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (GnRH Antagonists (oral, E.g., Elagolix, Relugolix, Linzagolix) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'The authors noted that there is no approved medical therapy for adenomyosis and that evidence guiding treatment remains limited. Regarding oral gonadotropin-releasing hormone antagonists specifically, the review stated that additional data are required, indicating insufficient evidence at the time to define their role in adenomyosis management.'
 WHERE id = 'b91f0687-ae81-4c65-9c67-d00b41109412'
   AND key_finding_excerpt IS NULL;

-- pubmed/40069979 (GnRH Antagonists (oral, E.g., Elagolix, Relugolix, Linzagolix) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'The authors proposed that oral GnRH antagonists with add-back therapy represent a promising strategy for stabilizing the uterus and controlling symptoms of hormonally driven conditions, including adenomyosis, with long-term regimens showing follow-up data out to 104 weeks. They introduced the concept of "uterine freezing" to delay uterine ageing and preserve reproductive potential, advocating for a holistic approach that values uterine preservation alongside ovarian strategies. The article was a narrative/opinion piece rather than an original clinical study, and did not report specific numerical outcomes for adenomyosis treatment.'
 WHERE id = '201e4740-f8c7-4532-88de-9e4be96edbe9'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (Aromatase Inhibitors (e.g., Letrozole, Anastrozole) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This review of medical therapies for adenomyosis noted that aromatase inhibitors demonstrate improvement in heavy menstrual bleeding and pelvic pain associated with the condition. However, the authors concluded that further research is needed to determine the role of aromatase inhibitors in the management of adenomyosis, and no specific positioning in the treatment algorithm was established. The review also highlighted that there is no approved medical therapy for adenomyosis and limited evidence to guide treatment overall.'
 WHERE id = 'cba1f95f-d85b-4ce2-9e62-2665701b7568'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (Aromatase Inhibitors (e.g., Letrozole, Anastrozole) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'The review identified aromatase inhibitors as among the new drugs under development for the treatment of adenomyosis, based on emerging findings regarding pathogenetic mechanisms of the condition. No specific clinical trial data, effect sizes, or outcomes for aromatase inhibitors in adenomyosis were reported; the authors noted that no drug is currently labelled for adenomyosis and that aromatase inhibitors remain in the investigational stage alongside other novel agents such as selective progesterone receptor modulators, valproic acid, and anti-platelet therapy.'
 WHERE id = '1f7d4ef4-8b2c-42af-842a-e21d4e0f5e51'
   AND key_finding_excerpt IS NULL;

-- pubmed/39672080 (Aromatase Inhibitors (e.g., Letrozole, Anastrozole) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'The opinion paper from the First Lugano Adenomyosis Workshop noted that pre-treatment with a gonadotrophin-releasing hormone (GnRH) agonist with or without an aromatase inhibitor in frozen embryo transfer cycles "seems promising" for patients with adenomyosis undergoing assisted reproductive technology. However, the authors acknowledged that many issues related to this therapeutic approach remain unanswered, and the paper did not provide specific numerical outcomes or trial-level evidence for aromatase inhibitor use in adenomyosis.'
 WHERE id = '4c315074-3761-440a-bdbd-0769055d7122'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (Selective Progesterone Receptor Modulators (SPRMs, E.g., Ulipristal Acetate, Mifepristone) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'The review noted that there is no approved medical therapy for adenomyosis and that evidence guiding treatment remains limited. Regarding progesterone receptor modulators specifically, the authors stated that these agents "may have a role for this disease if released again to market with appropriate safety parameters," suggesting potential utility but contingent on addressing prior safety concerns that led to market withdrawal. No specific efficacy data, effect sizes, or clinical trial results for SPRMs in adenomyosis were presented in this review.'
 WHERE id = 'cfa9f8f5-3046-4d5a-bc29-5ed88af6248f'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (Selective Progesterone Receptor Modulators (SPRMs, E.g., Ulipristal Acetate, Mifepristone) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'The review noted that no drug is currently labelled for adenomyosis and that several hormonal treatments are used off-label to manage symptoms. Based on new findings regarding pathogenetic mechanisms of adenomyosis, the authors identified selective progesterone receptor modulators as among the new drugs under development for the treatment of adenomyosis, alongside aromatase inhibitors, valproic acid, and anti-platelet therapy. No specific clinical efficacy data or trial results for SPRMs in adenomyosis were reported in this review.'
 WHERE id = '98edfdf7-f26f-4063-a555-d73afde5d18b'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (Danazol / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'This narrative review reported that no drug is currently labelled for adenomyosis and that several hormonal treatments are used off-label to manage symptoms. The authors noted that danazol, along with other progestins such as dienogest and norethindrone acetate, has antiproliferative and anti-inflammatory effects that support its use in the medical management of adenomyosis, mainly to control pain symptoms. No specific clinical trial data, effect sizes, or sample sizes for danazol were provided in this review.'
 WHERE id = 'ae0293df-22a6-4706-95d7-88dfbc35b866'
   AND key_finding_excerpt IS NULL;

-- pubmed/29566852 (Combined Oral Contraceptives (estrogen-Progestogen) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'The review reported that oral contraceptives are among the hormonal treatments currently used off-label to control pain symptoms and abnormal uterine bleeding in adenomyosis, noting that no drug is currently labelled for this condition. The rationale for their use is based on pathogenetic mechanisms including sex steroid hormone aberrations, impaired apoptosis, and increased inflammation, though the review did not provide specific efficacy data or clinical trial results for oral contraceptives in adenomyosis.'
 WHERE id = 'ca3bc2f4-fc5b-4f4d-a460-b181efeeb033'
   AND key_finding_excerpt IS NULL;

-- pubmed/33124017 (Combined Oral Contraceptives (estrogen-Progestogen) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'The review reported that there is no approved medical therapy for adenomyosis and limited evidence to guide treatment decisions. The authors noted that the progestin dienogest appears superior to combined oral contraceptives for managing adenomyosis in areas where it is marketed, positioning combined oral contraceptives as a less effective oral hormonal option. The levonorgestrel-releasing intrauterine system was identified as the most effective first-line therapy based on efficacy compared with oral agents.'
 WHERE id = '8d60ac79-622e-4323-9d5d-d7703e2d986d'
   AND key_finding_excerpt IS NULL;

-- pubmed/26358173 (Testosterone (transdermal) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This review reported that the primary indication for testosterone prescription in women is loss of sexual desire, and that transdermal testosterone therapy has not been associated with adverse cardiovascular effects in studies of women. Clinical trials suggest that exogenous testosterone enhances cognitive performance and improves musculoskeletal health in postmenopausal women. The authors noted that despite widespread off-label and compounded use, no testosterone formulation has been approved for women, and further studies are needed to clarify its effects on cardiovascular, cognitive, musculoskeletal health, and cancer risk.'
 WHERE id = '19619f25-69f8-4d05-aaa2-56985db64e3a'
   AND key_finding_excerpt IS NULL;

-- pubmed/34674962 (Testosterone (transdermal) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This review reported that androgen therapy, including testosterone, has shown improvement in postmenopausal hypoactive sexual desire disorder (HSDD) and genitourinary syndrome of menopause (GSM), yet remains understudied and underutilized in women. The authors noted that regulatory gaps have resulted in a lack of commercially available testosterone preparations formulated specifically for women in most countries, leading to off-label use of male formulations and compounded therapies. They emphasized that testosterone likely influences the brain, breast, cardiovascular, and musculoskeletal systems, but these effects are not well studied, making it difficult to fully counsel patients on the risks and benefits.'
 WHERE id = '5769feb7-059a-44e3-bc81-20d6b90c98dc'
   AND key_finding_excerpt IS NULL;

-- pubmed/39283289 (Estetrol (E4) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'Estetrol (E4) is a natural estrogen undergoing late-stage clinical development for hormone replacement therapy (HRT) in menopause. This review reported that E4 selectively activates nuclear estrogen receptor alpha (ERα) without activating membrane ERα, resulting in tissue-specific effects and a unique therapeutic profile. Multiple studies cited in the review demonstrated that E4 has a lower impact on hemostatic and metabolic parameters compared to other estrogens, potentially reducing the risk of thromboembolic events and dyslipidemia commonly associated with hormonal therapies.'
 WHERE id = '9ff2d43c-3845-4af5-a064-8d629c770072'
   AND key_finding_excerpt IS NULL;

-- pubmed/37076317 (NKB Receptor Antagonists (NK3R Antagonists) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This review described the neurokinin B (NKB) signaling pathway and its connection to the median preoptic nucleus (MnPO) as having a central role in mediating postmenopausal vasomotor symptoms (VMS). The authors reviewed neuroendocrine changes occurring with menopause and summarized data from the latest clinical trials using novel therapeutic agents that antagonize NKB signaling, positioning NK3R antagonists as a potential treatment option particularly for women in whom menopausal hormone therapy is unsuitable, such as those at increased risk of breast cancer or gynaecological malignancy.'
 WHERE id = 'c557729d-303a-456f-bf61-180f4f6b7b93'
   AND key_finding_excerpt IS NULL;

-- pubmed/30624087 (Vaginal Estrogen / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'The review discussed how menopause-related declines in estrogen levels lead to changes in the urogenital epithelium and subsequently the urogenital microbiome, predisposing postmenopausal women to recurrent urinary tract infections (rUTI). However, the source did not specifically discuss vaginal estrogen as a treatment or prevention strategy, focusing instead on antibiotic management and emerging urobiome-based approaches.'
 WHERE id = 'c075df80-066d-4cbc-92a8-02562ebea288'
   AND key_finding_excerpt IS NULL;

-- pubmed/22281161 (Estrogen (systemic HRT) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'This review reported that hormone replacement therapy with estrogen counteracts the weight gain and accumulation of abdominal fat associated with the menopausal transition. The authors noted that estrogen inhibits food intake and plays essential roles in regulating appetite, eating behaviour, and energy metabolism in women. They concluded that sex hormones such as estrogen and agents with similar activities may provide novel strategies for treating android obesity, identified as one of the most serious health problems for women.'
 WHERE id = '6ccb1617-9431-4a22-bf41-ed99e021d8bb'
   AND key_finding_excerpt IS NULL;

-- pubmed/37365881 (Drospirenone / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This Cochrane systematic review of five RCTs (858 women, most diagnosed with PMDD) found that combined oral contraceptives containing drospirenone and ethinylestradiol may produce small-to-moderate improvements in overall premenstrual symptoms versus placebo (SMD −0.41, 95% CI −0.59 to −0.24; 2 RCTs, N = 514; low-quality evidence) and in functional impairment across productivity, social activities, and relationships. However, drospirenone-containing COCs also increased withdrawal due to adverse effects (OR 3.41, 95% CI 2.01 to 5.78; 4 RCTs, N = 776) and total adverse effects (OR 2.31, 95% CI 1.71 to 3.11; 3 RCTs, N = 739), including more breast pain, nausea, and intermenstrual bleeding. The authors concluded that placebo also had a significant effect, and it remains unknown whether drospirenone-containing COCs are superior to COCs with other progestogens.'
 WHERE id = '38627757-6608-4b42-b81d-3a7dd9926c8d'
   AND key_finding_excerpt IS NULL;

-- pubmed/40140889 (Azithromycin / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This study investigated azithromycin (AZM) as a senolytic drug for endometriosis, finding that AZM significantly reduced the viable fraction of ovarian endometriosis cyst-derived stromal cells in vitro (P < 0.001) and suppressed IL-6 expression in cell culture supernatants (P < 0.05). In a murine endometriosis model, AZM administration significantly reduced endometriotic lesion volume compared to vehicle (P < 0.05), along with decreased proliferative activity (Ki67, P < 0.01), IL-6 expression (P < 0.001), and fibrosis (P < 0.001) within lesions. The authors concluded that AZM may be useful for preventing endometriosis progression by targeting senescent cells and suppressing senescence-associated secretory phenotype factors, particularly IL-6.'
 WHERE id = '34107636-65b8-4869-9dd7-db1ed7391f22'
   AND key_finding_excerpt IS NULL;

-- pubmed/30085525 (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This review identified the treatment and prevention of polycystic ovary syndrome (PCOS) as an established off-label indication for metformin, an antidiabetic agent approved by the FDA in 1994 for type 2 diabetes. The source listed PCOS management alongside other recognized off-label uses, including gestational diabetes and antipsychotic-induced weight gain, but did not provide specific numerical findings or clinical trial data regarding metformin''s efficacy in PCOS.'
 WHERE id = '4c151ecd-653b-434d-a1a5-ef9cb867fc6c'
   AND key_finding_excerpt IS NULL;

-- pubmed/36755918 (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'In a mouse model study, PCOS was induced in C57BL/6J female mice using letrozole and a high-fat diet, and metformin treatment (200 mg/kg/day for 28 days, n=6 per group) significantly reduced body weight, restored the estrous cycle, and improved glucose tolerance and insulin resistance compared to the untreated PCOS model group. Morphological analysis showed that metformin reduced polycystic ovarian lesions and restored ovarian function, with elevated expression of SIRT3 and GPX4 and increased phosphorylation of AMPK and mTOR. The authors concluded that metformin improves PCOS-related ovarian dysfunction by regulating ferroptosis via the SIRT3/AMPK/mTOR pathway.'
 WHERE id = '07e9694d-79fd-4af9-9784-5aa99ecb63c2'
   AND key_finding_excerpt IS NULL;

-- reddit/PMDD (Wellbutrin (bupropion) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'A user in the subreddit described Wellbutrin (bupropion) as their "holy grail" for managing PMDD, indicating a strongly positive personal experience. No specific dosage, duration, or measurable outcomes were provided in the post.'
 WHERE id = '0beda939-afda-4feb-8f9c-4303be00ccea'
   AND key_finding_excerpt IS NULL;

-- pubmed/18472980 (Drospirenone/Ethinyl Estradiol (24/4 Regimen) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This review examined the evidence from placebo-controlled, randomized studies evaluating the clinical efficacy and tolerability of the drospirenone/ethinyl estradiol combination for treating PMDD. The authors reported that results from trials were encouraging, noting both clinical efficacy and relatively good tolerability, but concluded that further studies are needed. They suggested that this formulation may contribute to widening the therapeutic spectrum available for PMDD treatment.'
 WHERE id = 'f45eba04-bcc3-4c44-a25d-1241a188dc3b'
   AND key_finding_excerpt IS NULL;

-- pubmed/21072278 (Drospirenone/Ethinyl Estradiol (24/4 Regimen) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This review reported that a 24/4 formulation containing 20 μg of ethinyl estradiol and the spironolactone-derived progestin drospirenone was found effective for PMDD in randomized, double-blind, placebo-controlled trials using established symptom scales, alleviating both somatic and affective/behavioral symptoms. The authors noted that drospirenone''s antimineralocorticoid and antiandrogenic properties contributed to improvements in fluid retention, acne, and hirsutism. However, due to a significant placebo effect observed in the blinded trials, the authors concluded that additional large randomized placebo-controlled trials were needed to confirm the efficacy of drospirenone-containing oral contraceptives for PMDD treatment.'
 WHERE id = '297c8950-fd75-4fe5-84a1-d065c92bd706'
   AND key_finding_excerpt IS NULL;

-- pubmed/38091917 (Sertraline / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'In a study of 32 women with PMDD and 38 controls, luteal-phase sertraline treatment (50 mg from approximate ovulation to menses onset) significantly increased serum pregnanolone levels and the pregnanolone:progesterone ratio, while decreasing 3α,5α-androsterone, compared to the untreated luteal phase. No significant differences in baseline GABAergic neuroactive steroid levels were found between PMDD participants and controls (p > 0.05). The authors reported this was the first study to assess SSRI effects on peripheral GABAergic neuroactive steroids in PMDD, though they noted the lack of a placebo-controlled design as a limitation.'
 WHERE id = '39e181ff-aaf4-4695-b04a-6afd511447e7'
   AND key_finding_excerpt IS NULL;

-- pubmed/12753573 (Venlafaxine / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'This open-label trial enrolled 30 Asian (Taiwanese) women with PMDD and treated them with flexible-dose venlafaxine (mean dose 60.1 ± 29.1 mg/day) over two menstrual cycles, with 20 patients completing the trial. All completers showed significant improvement in mood and behavior components on the PRISM calendar, with effects evident by the first active menstrual cycle. The authors concluded that venlafaxine was effective in reducing PMDD symptoms in this population, consistent with a prior Western study.'
 WHERE id = 'ece772d4-e5c8-44cb-ba6e-6f20b474d2cc'
   AND key_finding_excerpt IS NULL;

-- pubmed/18472980 (Spironolactone / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'The review listed spironolactone among the pharmacologic options studied for treating severe PMS and PMDD, alongside selective serotonin reuptake inhibitors, anxiolytic agents, and gonadotropin-releasing hormone agonists. However, the review did not provide any specific data, effect sizes, or detailed findings regarding spironolactone''s efficacy in PMDD, as its primary focus was on evaluating the ethinylestradiol/drospirenone combined oral contraceptive for this condition.'
 WHERE id = '8a4e0d19-aca6-455a-b346-816aeaf03569'
   AND key_finding_excerpt IS NULL;

-- pubmed/41456646 (GnRH Agonists (e.g., Leuprolide, Triptorelin) / Adenomyosis)
UPDATE sources
   SET key_finding_excerpt = 'Using single-cell RNA sequencing and spatial transcriptomics on 15 participants (11 adenomyosis patients—3 untreated and 8 GnRHa-treated—and 4 controls), the study found that GnRHa therapy partially mitigated the immune-inflammatory and pro-angiogenic microenvironment characteristic of untreated adenomyosis, including elevated CD4+ T cells and LYVE1+ macrophages. However, the enrichment of ciliated epithelial cells in ectopic endometrial glands persisted after GnRHa treatment, suggesting these cells may play a role in ongoing disease pathogenesis. The authors concluded that GnRHa exerts its therapeutic effects through normalization of immune cell composition and restoration of epithelial-stromal interactions within the adenomyotic uterus.'
 WHERE id = 'de63a9ea-521a-4e81-8740-f0eb037bf6c1'
   AND key_finding_excerpt IS NULL;

-- pubmed/40684257 (AbobotulinumtoxinA (aboBoNT-A) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This prospective, non-masked, non-randomized study enrolled 35 vulvodynia patients who underwent botulinum toxin type A (BoNT/A) injections and 35 healthy controls, using surface electromyography (sEMG) to characterize pelvic floor muscle activity and predict treatment response. Vulvodynia patients exhibited significantly lower contraction intensity and altered intramuscular and intermuscular electrical coupling in their pelvic floor muscles compared to healthy women. Intramuscular coupling at rest was significantly associated with response to BoNT/A treatment (P < .01) and, when combined with clinical information, predicted treatment response with high accuracy (AUC = 0.95), suggesting that sEMG-derived features could help optimize patient selection for BoNT/A therapy and reduce the burden of ineffective treatment.'
 WHERE id = 'e9047903-da9c-4ab0-8fc7-53fe166b2945'
   AND key_finding_excerpt IS NULL;

-- pubmed/17847765 (5-Aminolevulinic Acid (ALA) Photodynamic Therapy / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'In a small prospective study of 11 patients with vulvodynia, photodynamic therapy using a bioadhesive ALA patch (4-hour application) followed by red light (630 nm, 100 J cm⁻²) produced a significant reduction in overall symptoms (p = 0.0077), with 8 of 11 patients experiencing symptomatic improvement. However, no significant alleviation of pain during intercourse was observed (p = 0.1088). No adverse reactions or worsening of symptoms were reported, and the authors concluded that ALA-PDT may be a viable option for vulvodynia management but requires confirmation in larger studies.'
 WHERE id = '8eb41ae3-b288-42f0-bb5e-9f2c381ef6e3'
   AND key_finding_excerpt IS NULL;

-- pubmed/34800616 (Lidocaine (mucoadhesive Thin Film Delivery) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This study developed cellulose-based mucoadhesive thin films for local delivery of lidocaine to the vulvar vestibule as a treatment for vestibulodynia, addressing limitations of existing topical anesthetics such as poor drug retention, imprecise dosing, and leakage. In vitro testing showed lidocaine release kinetics could be tuned by polymer type, drug loading, and film thickness, with HEC-based films achieving rapid release (~5 min) and HPC-based films achieving prolonged release (~120 min). In vivo testing in BALB/c mice demonstrated the films were safe and that pharmacokinetic analysis confirmed lidocaine was delivered primarily to vaginal tissue locally. Two optimized formulations were identified for the two clinical use cases (rapid relief before intercourse and sustained daytime relief), though no human efficacy data were reported.'
 WHERE id = '1a916b24-42df-4c73-b074-52a6d3b7ddbc'
   AND key_finding_excerpt IS NULL;

-- pubmed/32491666 (Escitalopram / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'The source noted that escitalopram is used off-label for the management of vasomotor symptoms associated with menopause. No specific numerical findings, study design details, or effect sizes regarding this use were provided in the text, which served as a clinical overview of escitalopram''s applications, adverse effects, and drug interactions for interprofessional healthcare providers.'
 WHERE id = '4b9972b1-586c-4916-ac22-d3a369e3fc5a'
   AND key_finding_excerpt IS NULL;

-- clinical_trial/NCT01304589 (Milnacipran / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This was an 18-week, open-label, flexible-dose "proof of concept" trial evaluating milnacipran (up to 200 mg/d) for reducing pain in women with provoked vestibulodynia (PVD), described as a centrally mediated pain syndrome similar to fibromyalgia. The trial registry entry described the study design—including a 2-week washout, 6-week dose escalation, and 12-week stable-dose phase—but did not report outcome data or efficacy results.'
 WHERE id = 'f4a3950c-8fd3-490f-b98e-eee47829ec89'
   AND key_finding_excerpt IS NULL;

-- pubmed/32240297 (Tanezumab / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This in vitro study of endometriotic tissue from 45 patients did not directly investigate tanezumab but examined the role of NGF in endometriosis-related neurogenesis and deep dyspareunia. The authors found that IL-1β stimulated NGF expression in endometriosis stromal cells, and that an NGF neutralising antibody attenuated IL-1β-induced neurite growth in a PC-12 cell model of neurogenesis. The authors concluded that drug targeting of NGF may have potential in managing endometriosis-associated pain, which is relevant to tanezumab as an anti-NGF monoclonal antibody, though tanezumab itself was not tested in this study.'
 WHERE id = '4dda7c17-d15e-467e-b830-3ef60a98ea47'
   AND key_finding_excerpt IS NULL;

-- reddit/endometriosis (Testosterone / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'The Reddit post described a personal experience in which the user reported that it took 26 years to receive an endometriosis diagnosis and implied that transitioning (which typically involves testosterone therapy) resolved or addressed their endometriosis symptoms. No specific clinical details, dosages, or outcome measures were provided. The post offered only an anecdotal, single-person account without any quantifiable findings regarding testosterone''s effect on endometriosis.'
 WHERE id = '8b42bab4-9ad0-4a06-a624-d3d7f9ffba12'
   AND key_finding_excerpt IS NULL;

-- reddit/PMDD (Wellbutrin (bupropion) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user reported that Wellbutrin helped their PMDD symptoms. No further details regarding dosage, duration of use, specific symptoms improved, or magnitude of effect were provided in the post.'
 WHERE id = '166c26f5-e5f5-43ca-956d-54123176bf15'
   AND key_finding_excerpt IS NULL;

-- reddit/PMDD (Wellbutrin (bupropion) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'The Reddit post''s author asked whether others had tried bupropion (among other drugs) for PMDD symptoms, reporting a subjective impression that their luteal phase felt "more bearable." No specific data, dosage, duration, or confirmed outcomes were provided beyond this single user''s tentative, self-reported observation.'
 WHERE id = '176bb152-bdff-4553-a3ab-c1e1027f3489'
   AND key_finding_excerpt IS NULL;

-- reddit/PMDD (Magnesium (various Forms Including Glycinate) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user reported that magnesium, combined with a small amount of DHEA, appeared to help with their PMDD symptoms. The user described the combination as seemingly effective based on personal experience, though no specific dosages, forms of magnesium, or measurable outcomes were provided in the available text.'
 WHERE id = '3a29ab48-5cd2-4906-8cbe-5f8980b17c5a'
   AND key_finding_excerpt IS NULL;

-- reddit/PMDD (Myfembree (relugolix/estradiol/norethindrone) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'The Reddit post indicated that the user had been taking Myfembree for severe PMDD and lost access to the medication after losing their job and insurance. No specific clinical outcomes, dosing details, or efficacy data were reported beyond the implication that the user had been relying on Myfembree to manage their severe PMDD symptoms.'
 WHERE id = '1e2c2973-253c-43f9-80af-144db8d633d0'
   AND key_finding_excerpt IS NULL;

-- reddit/PMDD (Progesterone (bioidentical/supplemental) / PMDD)
UPDATE sources
   SET key_finding_excerpt = 'A user in the thread reported that their PMDD symptoms became "almost non-existent" after using supplemental progesterone. No specific dosage, formulation, or duration of use was provided in the post.'
 WHERE id = '4a64f213-8fc4-4cb1-8b0b-bea5399b1138'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (Inositol (Myo-Inositol / D-Chiro-Inositol) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'The Reddit post expressed a strong positive sentiment about inositol in the context of PCOS, stating "This Inositol is no joke." However, the source provided no specific details regarding symptoms improved, dosage used, duration of use, or any measurable outcomes related to PCOS management.'
 WHERE id = 'ecd43213-c96f-42cc-9f92-dcfe9439a381'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (Inositol (Myo-Inositol / D-Chiro-Inositol) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'A user in the PCOS subreddit reported that myo-inositol made them "more beautiful," suggesting perceived improvements in appearance-related symptoms. No specific dosage, duration, or measurable outcomes were provided in the post.'
 WHERE id = '5b84f198-fe05-47f5-88eb-810c4dd9de15'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (Inositol (Myo-Inositol / D-Chiro-Inositol) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'The source text consists only of a post title indicating that the author found PCOS "finally manageable" after years of trial and error, but it does not specifically mention inositol (myo-inositol or D-chiro-inositol) or provide any details about its use or effects.

NO_RELEVANT_FINDING'
 WHERE id = '29cd280c-a786-4630-be2d-140994ff2666'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'A user in the PCOS subreddit reported that metformin "changed my life," indicating a strongly positive personal experience with the drug for managing their condition. No specific symptoms, numerical outcomes, or timeframes were provided in the post.'
 WHERE id = '7820edf0-78b5-4424-a9d7-54705e9ef0b6'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'The user described that taking metformin for PCOS made them realize the extent to which the condition had been affecting them, implying a notable subjective improvement in symptoms after starting the medication. No specific numerical outcomes, dosages, or duration of use were reported in the post.'
 WHERE id = '1412f907-8d48-4058-8751-57e3a3005408'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (Metformin / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'The user in the Reddit thread reported that metformin "worked a little too well" for their PCOS, suggesting a strong positive effect on their condition. No specific details regarding dosage, duration, or measurable outcomes were provided beyond this brief subjective characterization.'
 WHERE id = '163e4008-1724-468d-bd7c-32f467a11394'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (GLP-1 Receptor Agonists (Ozempic/semaglutide, Mounjaro/tirzepatide, Wegovy, Victoza/liraglutide) / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'The source referenced a USA TODAY article highlighting that some women with PCOS finally found an effective treatment, but faced insurance coverage barriers. While the post title implies GLP-1 receptor agonists were the treatment that "worked" for PCOS, the canonical source text provided contains no specific clinical details, numerical findings, or named drugs beyond the headline framing. Users in the thread engaged with the topic of insurance denial for these medications in the context of PCOS management.'
 WHERE id = 'fe30b13c-a863-4e91-acb3-bec851f7b32f'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (Spearmint Tea / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'A Reddit user in the PCOS community reported lowering their testosterone level from 182 to 37 over the course of one year. While the post title describes this dramatic reduction, the provided source text does not explicitly attribute this change to spearmint tea or detail the specific interventions used.'
 WHERE id = '24d7361d-3750-4c18-b69c-99edc667c888'
   AND key_finding_excerpt IS NULL;

-- reddit/Perimenopause (Creatine / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'The user reported that creatine had no effect on their brain fog—a common perimenopause/menopause symptom—until they drastically increased the dosage. The post solicited similar experiences from others, suggesting the standard dosage may be insufficient for addressing menopausal brain fog. No specific dosage amounts, timelines, or further details were provided in the source text.'
 WHERE id = 'e64ed18e-f5c9-4281-aee2-49393c409c99'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Magnesium Glycinate / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A user in the Menopause subreddit reported that magnesium glycinate helped their menopause symptoms. No specific details regarding dosage, duration of use, or which particular symptoms improved were provided.'
 WHERE id = '3946e60d-bd9d-4575-b7c7-d2df49435b10'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Vaginal Estradiol Cream / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A user in the Menopause subreddit reported that vaginal estrogen resolved their bladder issues, which are commonly associated with menopause. No specific product name, dosage, duration of use, or additional clinical details were provided in the post.'
 WHERE id = '6706f213-7507-4680-8d5e-26a735b859b5'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Collagen Supplements / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'The user in the menopause subreddit reported a positive outcome from collagen supplementation for joint pain experienced during menopause, describing the story as having a "happy ending." However, the source text provided contains only the post title and no further details regarding dosage, duration, specific product, or measurable outcomes.'
 WHERE id = '29c66c42-a594-42e5-a691-d25a443874b5'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Collagen Supplements / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A user in the Menopause subreddit reported that collagen supplements helped their menopause symptoms. No specific details regarding dosage, duration, or which particular symptoms improved were provided.'
 WHERE id = 'f043aa3b-9948-4841-861f-483f5d7c0217'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Testosterone (topical/compounded) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'The Reddit post described a user''s experience in which their doctor compared their testosterone prescription to using cocaine, suggesting physician resistance or lack of support for testosterone therapy in the context of menopause. No clinical findings, dosing details, or outcome data regarding topical or compounded testosterone for perimenopause or menopause were provided in the source.'
 WHERE id = '3871e062-40ef-461f-b975-084a7a91c41f'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Testosterone (topical/compounded) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A user reported that their pharmacy questioned their testosterone prescription, characterizing it as "hormones for men," and subsequently contacted their prescribing doctor to verify the order. This post illustrates a practical barrier some women face when obtaining compounded or prescribed testosterone for menopause-related use, involving pharmacy pushback or lack of awareness regarding off-label testosterone prescribing for women.'
 WHERE id = 'bf14953d-f1ce-4051-b17b-8c8ca59a8e1c'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Veozah (fezolinetant) / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A user in the Menopause subreddit described Veozah (fezolinetant) as "a miracle" for their menopausal symptoms. No specific details regarding dosage, duration of use, or particular symptoms addressed were provided in the post.'
 WHERE id = '2272c314-786b-4b1b-9a0f-5ab0ed38d33d'
   AND key_finding_excerpt IS NULL;

-- reddit/Perimenopause (Iron/Ferritin Supplementation / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'The user reported in a follow-up post that their perimenopausal symptoms were attributable to low ferritin levels, implying that addressing low ferritin resolved or improved their condition. No specific numerical findings, treatment details, or study design were provided beyond this brief personal anecdote.'
 WHERE id = '692dca66-21ea-4f43-99ba-97f141e1c1d0'
   AND key_finding_excerpt IS NULL;

-- reddit/Menopause (Alcohol Cessation / Perimenopause & Menopause)
UPDATE sources
   SET key_finding_excerpt = 'A user in the Menopause subreddit reported that alcohol cessation helped their menopause symptoms. No specific symptoms, timeframe, or quantitative details were provided beyond the general claim of improvement.'
 WHERE id = '9d9c61bf-ed1f-4547-8824-0daba1ef3100'
   AND key_finding_excerpt IS NULL;

-- reddit/vulvodynia (Diazepam (Valium) Suppositories / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'The Reddit post described a personal experience with vaginal diazepam (Valium) suppositories for vulvodynia, framed as a warning to others. No specific clinical details, outcomes, or numerical findings were provided in the available source text beyond the cautionary framing of the user''s experience.'
 WHERE id = '83989329-ec88-464b-ab65-864b511f2fa1'
   AND key_finding_excerpt IS NULL;

-- reddit/vulvodynia (Antihistamines (Zyrtec/cetirizine, Benadryl/diphenhydramine) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'A user in the Reddit vulvodynia community reported that after 22 years of pain, their symptoms were approximately 95% resolved. The post title suggests a dramatic improvement, though the provided text does not explicitly detail which specific antihistamine regimen was used or the duration of treatment.'
 WHERE id = '82c80e8c-4b54-493e-852d-e724c82c1c85'
   AND key_finding_excerpt IS NULL;

-- reddit/vulvodynia (Low Dose Naltrexone (LDN) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'A user in the vulvodynia subreddit reported early success with Low Dose Naltrexone (LDN) for managing their vulvodynia symptoms. However, the source text provided contains only the post title and no additional details regarding dosage, duration of use, specific symptom improvements, or other contextual information.'
 WHERE id = '97b9e44b-3aa9-4953-a942-fda58ac6e14d'
   AND key_finding_excerpt IS NULL;

-- reddit/PelvicFloor (Duloxetine (Cymbalta) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'A user in the PelvicFloor subreddit reported that Cymbalta (duloxetine) made their symptoms worse. No further details regarding dosage, duration of use, or specific symptom changes were provided.'
 WHERE id = '60fbb30a-5d4d-42ea-8125-87400e0875c4'
   AND key_finding_excerpt IS NULL;

-- reddit/vulvodynia (Topical Estrogen/testosterone Cream / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'The user in the Reddit thread reported achieving near-zero vulvodynia symptoms, listing treatments that worked and didn''t work for them. However, the provided source text does not include specific details about the role of topical estrogen/testosterone cream in their treatment outcomes, nor does it provide any numerical findings or further context about this drug-condition pair.

NO_RELEVANT_FINDING'
 WHERE id = '1dc65c60-ade5-4376-98e1-31585be97664'
   AND key_finding_excerpt IS NULL;

-- pubmed/34431079 (Pentoxifylline / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'This Cochrane systematic review update included five parallel-design RCTs involving 415 women and found insufficient evidence to support the use of pentoxifylline in the management of endometriosis. When compared to placebo, pentoxifylline did not clearly affect clinical pregnancy rate (RR 1.38, 95% CI 0.91 to 2.10; 3 RCTs, n = 285; very low-quality evidence), recurrence rate (RR 0.84, 95% CI 0.30 to 2.36; 1 RCT, n = 121), or miscarriage rate (Peto OR 1.99, 95% CI 0.20 to 19.37; 2 RCTs, n = 164). No trials reported on the primary outcome of live birth rate, and the overall quality of evidence was judged as very low, leading the authors to conclude there is currently insufficient evidence to support pentoxifylline for endometriosis-related subfertility or pain relief.'
 WHERE id = '0bb93c46-42d8-4951-b7bd-d49c55fa6e9e'
   AND key_finding_excerpt IS NULL;

-- pubmed/31718828 (Rosiglitazone / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This prospective randomized controlled trial enrolled obese, insulin-resistant Chinese women with PCOS and compared metformin (1,500 mg/day, n=68), rosiglitazone (4 mg/day, n=67), and their combination (metformin 1,000 mg/day plus rosiglitazone 4 mg/day, n=69) over 6 months. All three groups showed statistically significant improvements in menstrual pattern, acne scores, weight, BMI, waist circumference, waist-to-hip ratio, serum testosterone, and metabolic indexes of insulin, carbohydrates, and lipids compared with baseline. Rosiglitazone users (alone or combined with metformin) demonstrated a more notable decline in total cholesterol and triglyceride levels than metformin alone, leading the authors to recommend rosiglitazone alone or combined with low-dose metformin for obese, insulin-resistant PCOS women with abnormal lipid profiles.'
 WHERE id = '0fe335f2-38cb-4b77-b186-40b017757f89'
   AND key_finding_excerpt IS NULL;

-- pubmed/19619148 (Botulinum Toxin A (Botox, 20 IU) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'In a randomized, double-blinded, placebo-controlled trial of 64 women with vestibulodynia, injection of 20 IU Botulinum Toxin A into the musculus bulbospongiosus did not significantly reduce pain compared to saline placebo at 6 months follow-up (median VAS score P = 0.984). Both the Botox and placebo groups experienced significant pain reduction from baseline (P < 0.001), but no between-group differences were observed in sexual function (FSFI, P = 0.635) or quality of life (SF-36). The placebo group actually showed a significantly greater reduction in sexual distress compared to the Botox group (P = 0.044), and the authors concluded that 20 IU Botox does not provide benefit over placebo for vestibulodynia.'
 WHERE id = '50f350d1-c545-491b-abdd-928c3acd2d64'
   AND key_finding_excerpt IS NULL;

-- pubmed/19619148 (AbobotulinumtoxinA (aboBoNT-A) / Vulvodynia)
UPDATE sources
   SET key_finding_excerpt = 'This randomized, double-blinded, placebo-controlled trial enrolled 64 women with vestibulodynia to receive either 20 I.E. botulinum toxin A or saline placebo, with 60 (94%) completing 6-month follow-up. Both groups experienced significant pain reduction on VAS (P < 0.001), but there was no significant difference between botulinum toxin A and placebo in pain scores at 6 months (P = 0.984), FSFI sexual function scores (P = 0.635), or SF-36 quality of life. The placebo group actually showed a significantly greater reduction in sexual distress compared to the botulinum toxin A group (P = 0.044). The authors concluded that injection of 20 I.E. botulinum toxin A in the vestibule does not reduce pain, improve sexual functioning, or impact quality of life compared to placebo.'
 WHERE id = '60906299-ace3-4e84-8115-3c2dad0eac80'
   AND key_finding_excerpt IS NULL;

-- pubmed/27459523 (Pavinetant / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This double-blind, placebo-controlled, phase 2 trial randomized 67 women with PCOS to receive AZD4901 (pavinetant), an NK3 receptor antagonist, at doses of 20, 40, or 80 mg/day or placebo for 28 days. At the 80 mg/day dose on day 7, the trial found a 52.0% reduction (95% CI, 29.6–67.3%) in LH area under the curve, a 28.7% reduction (95% CI, 13.9–40.9%) in total testosterone concentration, and a decrease of 3.55 LH pulses per 8 hours (95% CI, 2.0–5.1) relative to placebo (all nominal P < .05). The authors concluded that NK3 receptor antagonism with AZD4901 specifically reduced LH pulse frequency and subsequently serum LH and testosterone concentrations, presenting a potential novel therapeutic approach to the central neuroendocrine pathophysiology of PCOS.'
 WHERE id = 'd6aa7818-a1d3-41d1-ba15-ab1cb5f7a12b'
   AND key_finding_excerpt IS NULL;

-- pubmed/21782166 (Raloxifene / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'In a double-blind, randomized, superiority clinical trial of 82 women with PCOS and ovulatory dysfunction, raloxifene (100 mg/day for 5 days) was compared to clomiphene citrate for ovulation induction. The trial found no statistically significant difference in ovulation rates between raloxifene (17 of 42) and clomiphene citrate (21 of 40) by ultrasound-based intention-to-treat analysis, nor by progesterone-confirmed ovulation (raloxifene: 11 of 42 vs. CC: 16 of 40). No serious adverse events were observed in either group, suggesting raloxifene had a comparable safety and efficacy profile to clomiphene citrate in this population.'
 WHERE id = 'df0d3c82-78ba-4d30-bf77-ab961c1c3f44'
   AND key_finding_excerpt IS NULL;

-- pubmed/36614868 (Spironolactone / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'This systematic review of non-hormonal pharmacological treatments for menstrual irregularities in adolescents with PCOS identified spironolactone as one of the anti-androgen agents examined across the included literature (January 1998 to September 2022, n=164 studies evaluated). However, the authors did not highlight spironolactone as being among the treatments found effective in regulating menstrual cycles, with metformin, GLP-1 analogues, and supplements being the only non-hormonal options reported as effective for improving menstrual frequency in this population.'
 WHERE id = '24c6fafd-cac5-4592-a277-ddc7de28566e'
   AND key_finding_excerpt IS NULL;

-- reddit/endometriosis (Meloxicam / Endometriosis)
UPDATE sources
   SET key_finding_excerpt = 'A user in the endometriosis subreddit described Meloxicam as a "miracle drug," expressing strong personal enthusiasm for its effectiveness, though no specific details regarding dosage, duration of use, or measurable outcomes were provided. The post suggested the user felt Meloxicam was underrecognized for managing endometriosis-related symptoms.'
 WHERE id = '14b43925-156b-4860-a326-322a487e2d63'
   AND key_finding_excerpt IS NULL;

-- reddit/PCOS (Spironolactone / PCOS)
UPDATE sources
   SET key_finding_excerpt = 'The user reported needing to take Spironolactone alongside Metformin for PCOS management despite maintaining a rigorous exercise routine of over 10 hours per week and a strict healthy diet. This suggests that lifestyle modifications alone were insufficient for managing their PCOS symptoms, necessitating ongoing pharmacological treatment including Spironolactone.'
 WHERE id = '653b491c-bf8c-4f58-a642-4a315921ad37'
   AND key_finding_excerpt IS NULL;

COMMIT;

-- Verification query (run after COMMIT). Expected: high percentage of
-- free-text sources now have a key_finding_excerpt.
--
--   SELECT source_type, COUNT(*) AS total,
--          COUNT(key_finding_excerpt) AS with_excerpt
--     FROM sources
--    WHERE source_type IN ('pubmed', 'clinical_trial', 'reddit')
--    GROUP BY source_type;
