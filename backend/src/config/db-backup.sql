--
-- PostgreSQL database dump
--

\restrict F8h2g0Ju7wi85JT0UAJ0tr2ulGCi8y23uHtonIh9WH75jilnUNAIQ5Eg4TmxozA

-- Dumped from database version 16.11 (Homebrew)
-- Dumped by pg_dump version 16.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assessments; Type: TABLE; Schema: public; Owner: wuqi
--

CREATE TABLE public.assessments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    planning_score double precision,
    monitoring_score double precision,
    evaluation_score double precision,
    regulation_score double precision,
    overall_score double precision,
    strengths jsonb,
    areas_for_growth jsonb,
    recommendations jsonb,
    assessment_type character varying(50) DEFAULT 'standard'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assessments OWNER TO wuqi;

--
-- Name: evolution_logs; Type: TABLE; Schema: public; Owner: wuqi
--

CREATE TABLE public.evolution_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    current_pattern character varying(1),
    previous_pattern character varying(1),
    change_type character varying(20),
    confidence double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.evolution_logs OWNER TO wuqi;

--
-- Name: interactions; Type: TABLE; Schema: public; Owner: wuqi
--

CREATE TABLE public.interactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    session_id uuid NOT NULL,
    user_prompt text NOT NULL,
    ai_response text NOT NULL,
    ai_model character varying(100) DEFAULT 'gpt-4-turbo'::character varying,
    prompt_word_count integer,
    response_time double precision DEFAULT 0,
    was_verified boolean DEFAULT false,
    was_modified boolean DEFAULT false,
    was_rejected boolean DEFAULT false,
    confidence_score double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.interactions OWNER TO wuqi;

--
-- Name: pattern_logs; Type: TABLE; Schema: public; Owner: wuqi
--

CREATE TABLE public.pattern_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    session_id uuid NOT NULL,
    detected_pattern character varying(1),
    confidence double precision,
    features jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pattern_logs OWNER TO wuqi;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: wuqi
--

CREATE TABLE public.sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ended_at timestamp without time zone,
    duration_minutes double precision,
    task_description text,
    task_type character varying(50),
    task_importance character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sessions OWNER TO wuqi;

--
-- Name: skill_alerts; Type: TABLE; Schema: public; Owner: wuqi
--

CREATE TABLE public.skill_alerts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    alert_type character varying(50),
    severity character varying(20),
    message text,
    dismissed boolean DEFAULT false,
    triggered_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.skill_alerts OWNER TO wuqi;

--
-- Name: skill_baselines; Type: TABLE; Schema: public; Owner: wuqi
--

CREATE TABLE public.skill_baselines (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    skill_name character varying(100) NOT NULL,
    baseline_score double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.skill_baselines OWNER TO wuqi;

--
-- Name: skill_tests; Type: TABLE; Schema: public; Owner: wuqi
--

CREATE TABLE public.skill_tests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    baseline_id uuid NOT NULL,
    score double precision,
    independence_percentage double precision,
    quality_score double precision,
    speed_score double precision,
    tested_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.skill_tests OWNER TO wuqi;

--
-- Name: users; Type: TABLE; Schema: public; Owner: wuqi
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    user_type character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO wuqi;

--
-- Data for Name: assessments; Type: TABLE DATA; Schema: public; Owner: wuqi
--

COPY public.assessments (id, user_id, planning_score, monitoring_score, evaluation_score, regulation_score, overall_score, strengths, areas_for_growth, recommendations, assessment_type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: evolution_logs; Type: TABLE DATA; Schema: public; Owner: wuqi
--

COPY public.evolution_logs (id, session_id, user_id, current_pattern, previous_pattern, change_type, confidence, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: interactions; Type: TABLE DATA; Schema: public; Owner: wuqi
--

COPY public.interactions (id, session_id, user_prompt, ai_response, ai_model, prompt_word_count, response_time, was_verified, was_modified, was_rejected, confidence_score, created_at, updated_at) FROM stdin;
8e31fe98-ed82-4bd2-90fb-a9fd445bca54	40012705-71dd-4646-b6b4-148cbbfd19b4	good evening	Good evening! How can I assist you today?	gpt-4o-mini	2	2246	f	f	f	0.85	2025-11-18 01:09:15.899	2025-11-18 01:09:15.899689
5dfc9267-1bb1-40c0-9b30-c93b98f322fe	0742114c-6e2c-4cab-a9f0-fe38f61508f4	晚上好	晚上好！有什么我可以帮助你的吗？	gpt-4o-mini	1	1887	f	f	f	0.85	2025-11-18 01:11:42.11	2025-11-18 01:11:42.110958
9532a559-6c86-48da-8f29-8a00fa59b404	d7ab0fc2-d5b2-4764-b075-9916e19c2245	晚上好	晚上好！有什么我可以帮助您的吗？	gpt-4o-mini	1	3553	f	f	f	0.85	2025-11-18 01:12:21.611	2025-11-18 01:12:21.611314
82ab4f58-f907-43a6-bdec-c14fe63acc88	3a090101-221d-458c-9585-a4f0322069a5	晚上好	晚上好！有什么我可以帮助你的吗？	gpt-4o-mini	1	1002	f	f	f	0.85	2025-11-18 01:13:26.649	2025-11-18 01:13:26.649971
770a04ae-3aac-4ea8-b7ff-8f0516b3ff39	d7ab0fc2-d5b2-4764-b075-9916e19c2245	晚上好	晚上好！有什么我可以帮助你的吗？	gpt-4o-mini	1	765	f	f	f	0.85	2025-11-18 01:13:56.762	2025-11-18 01:13:56.762977
612044c1-d650-4e66-b13e-64ed80522978	e34b12f7-24e3-4b2d-8d46-393fb6292859	晚上好	晚上好！有什么我可以帮助你的吗？	gpt-4o-mini	1	1838	f	f	f	0.85	2025-11-18 01:18:27.788	2025-11-18 01:18:27.789315
4c54b73f-d265-42ef-ac0a-e87d6b343958	e34b12f7-24e3-4b2d-8d46-393fb6292859	晚上好	晚上好！有什么我可以帮助你的吗？	gpt-4o-mini	1	1063	f	f	f	0.85	2025-11-18 01:18:55.969	2025-11-18 01:18:55.969928
b66d367c-e4d6-4bba-bf6d-1c235884ae74	4e59d9cb-1695-4873-a441-3af2e1c10f47	晚上好	晚上好！有什么我可以帮助你的吗？	gpt-4o-mini	1	1337	f	f	f	0.85	2025-11-18 01:29:34.983	2025-11-18 01:29:34.983887
410f2a9f-2061-4cbb-adc4-bdd03846bebb	ed6c69ca-dcca-4eaf-b3e3-04a60fd14b75	晚上好	晚上好！有什么我可以帮助你的吗？	gpt-4o-mini	1	1150	f	f	f	0.85	2025-11-18 01:33:16.989	2025-11-18 01:33:16.989845
27417970-6519-49ad-9e69-02740207d56b	43aa102c-b934-46d9-9403-e734f42ca251	hi	Hello! How can I assist you today?	gpt-4o-mini	1	1629	f	f	f	0.85	2025-11-18 10:24:56.145	2025-11-18 10:24:56.145958
6b489e44-0977-48ca-b65f-123d5c6046eb	a85b752f-1bfb-47d9-b3d0-1d31d62fffe1	hi	Hello! How can I assist you today?	gpt-4o-mini	1	2180	f	f	f	0.85	2025-11-18 10:25:21.722	2025-11-18 10:25:21.722651
3fbb730b-bfee-416f-afc7-5794bf274a6a	a85b752f-1bfb-47d9-b3d0-1d31d62fffe1	hi	Hello! How can I assist you today?	gpt-4o-mini	1	2078	f	f	f	0.85	2025-11-18 10:28:00.579	2025-11-18 10:28:00.579444
40647a97-4690-4133-ae05-49c588747010	a0dd838e-638d-4b91-9529-8152502bad19	帮我写一篇100字的关于esg的论文	ESG（环境、社会和公司治理）是评估企业可持续性的重要标准。环境因素关注企业对自然资源的影响及其应对气候变化的策略；社会因素则涉及企业对员工、客户及社区的责任，包括工作条件和社会影响；公司治理则关注管理结构、透明度及股东权益的保护。越来越多的投资者将ESG标准纳入决策过程，认为高ESG评分的企业在长期内更具竞争力和抗风险能力。因此，推动企业提升ESG表现不仅有助于社会和环境的可持续发展，也能为投资者带来更好的回报。	gpt-4o-mini	1	4758	t	t	f	0.85	2025-11-18 11:11:45.991	2025-11-18 13:38:12.889
43eb26c2-4845-45b5-a414-e7010be974b7	a0dd838e-638d-4b91-9529-8152502bad19	劣势有哪些	ESG（环境、社会和公司治理）虽然被广泛认可为提升企业可持续性的重要标准，但也存在一些劣势：\n\n1. **数据透明度不足**：许多企业在ESG报告中缺乏透明度，导致投资者难以获取真实、可靠的数据。\n\n2. **标准不统一**：ESG评估缺乏统一的标准和框架，不同评级机构可能会给出不同的评估结果，增加了比较的复杂性。\n\n3. **短期成本增加**：实施ESG策略可能需要初期投资，如改进生产流程和提升员工福利，短期内可能影响利润。\n\n4. **缺乏监管**：目前对于ESG信息披露的监管相对宽松，可能导致一些企业进行“绿洗”，即表面上符合ESG标准，实际上并未真正落实。\n\n5. **投资者偏好变化**：投资者的ESG偏好可能随着市场变化而波动，导致企业在短期内难以预测其ESG努力的回报。\n\n6. **复杂性和资源需求**：企业在实施和管理ESG策略时，可能需要投入大量人力和财力，增加运营复杂性。\n\n理解这些劣势有助于企业在制定ESG战略时进行全面评估，以实现更好的平衡和效果。	gpt-4o-mini	1	6552	f	f	f	0.85	2025-11-18 13:48:55.44	2025-11-18 13:48:55.441027
24f4ca47-6a9c-436d-8e50-d986465bc503	a0dd838e-638d-4b91-9529-8152502bad19	整合进刚才提到的100字论文里，对其进行修改	ESG（环境、社会和公司治理）是评估企业可持续性的重要标准，关注企业对自然资源的影响、员工和社区的责任以及管理透明度。然而，ESG也存在一些劣势，如数据透明度不足、标准不统一、短期成本增加及缺乏监管等。这些问题可能导致企业在实施ESG策略时面临挑战，影响其长期利益。尽管如此，越来越多的投资者将ESG纳入决策过程，认为高ESG评分的企业在长期内更具竞争力和抗风险能力。因此，推动企业提升ESG表现仍然是实现可持续发展的重要方向。	gpt-4o-mini	1	3515	f	f	f	0.85	2025-11-18 13:49:23.201	2025-11-18 13:49:23.202114
b2a64d24-6490-435c-ae43-043a6d953f21	f63fa618-97bb-428d-8c8a-240b03748d8a	hi	Hello! How can I assist you today?	gpt-4o-mini	1	1190	t	t	f	0.85	2025-11-18 10:30:29.854	2025-11-18 10:30:42.06
932f6a58-e204-4674-b737-258a05682b94	a0dd838e-638d-4b91-9529-8152502bad19	关于你写的这段话 资料来源是哪里的	我提供的信息基于对ESG（环境、社会和公司治理）概念的综合理解，结合了广泛的知识背景，包括学术文献、行业报告和专业分析。具体的资料来源并未直接引用某一特定文献，而是汇总了在ESG领域普遍认可的观点和常见的讨论。\n\n如需深入了解ESG的具体内容和数据，建议查阅相关的研究报告、行业指南（如全球报告倡议（GRI）、可持续发展会计标准委员会（SASB）等）以及学术期刊文章，这些资料能够提供更详细和权威的信息。	gpt-4o-mini	2	3395	f	f	f	0.85	2025-11-18 13:50:04.661	2025-11-18 13:50:04.661941
029bf7c8-18a6-4186-8b25-817497ad1d3b	a18ae8c6-527f-49ec-9d24-aaa0b8981026	hello	Hello! How can I assist you today?	gpt-4o-mini	1	1663	t	t	f	0.85	2025-11-18 10:40:31.073	2025-11-18 10:41:00.991
78c45e68-f5b9-41fe-a61e-d574cc7d93e5	4416d782-144e-46d5-8cc6-334569f66d29	早上好	早上好！有什么我可以帮助你的吗？	gpt-4o-mini	1	1664	f	f	f	0.85	2025-11-18 10:50:40.343	2025-11-18 10:50:40.344258
4fc8b95b-f003-452e-ac22-7386095c669d	04f2cb34-e0c0-4514-9440-112c9a5ff7d1	你好	你好！有什么我可以帮助你的吗？	gpt-4o-mini	1	1201	t	t	f	0.85	2025-11-18 10:56:28.713	2025-11-18 10:56:32.2
\.


--
-- Data for Name: pattern_logs; Type: TABLE DATA; Schema: public; Owner: wuqi
--

COPY public.pattern_logs (id, session_id, detected_pattern, confidence, features, created_at, updated_at) FROM stdin;
6c81715e-77ab-471f-ac3f-53b9e7f9877a	a0dd838e-638d-4b91-9529-8152502bad19	A	0.5	{"errorAwareness": 2.5, "crossModelUsage": 0, "reflectionDepth": 1, "modificationRate": 1, "verificationRate": 1, "promptSpecificity": 0.12, "strategyDiversity": 1, "iterationFrequency": 1.5, "independentAttemptRate": 1.5, "taskDecompositionScore": 0.15000000000000002, "sessionDurationPatterns": 2.5, "trustCalibrationAccuracy": 0.025500000000000002}	2025-11-18 13:49:23.221	2025-11-18 13:49:23.221503
4fdedfb7-5780-4f79-b238-261efdb199e4	a0dd838e-638d-4b91-9529-8152502bad19	A	0.5	{"errorAwareness": 2.5, "crossModelUsage": 0, "reflectionDepth": 0.75, "modificationRate": 0.75, "verificationRate": 0.75, "promptSpecificity": 0.15000000000000002, "strategyDiversity": 1, "iterationFrequency": 1.1666666666666665, "independentAttemptRate": 1.5, "taskDecompositionScore": 0.1875, "sessionDurationPatterns": 2.5, "trustCalibrationAccuracy": 0.025500000000000002}	2025-11-18 13:50:04.68	2025-11-18 13:50:04.680443
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: wuqi
--

COPY public.sessions (id, user_id, started_at, ended_at, duration_minutes, task_description, task_type, task_importance, created_at, updated_at) FROM stdin;
40012705-71dd-4646-b6b4-148cbbfd19b4	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 01:09:00.064	\N	\N	General AI interaction	general	medium	2025-11-18 01:09:00.065595	2025-11-18 01:09:00.065595
0742114c-6e2c-4cab-a9f0-fe38f61508f4	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 01:11:35.066	\N	\N	General AI interaction	general	medium	2025-11-18 01:11:35.066945	2025-11-18 01:11:35.066945
d7ab0fc2-d5b2-4764-b075-9916e19c2245	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 01:12:13.085	\N	\N	General AI interaction	general	medium	2025-11-18 01:12:13.086902	2025-11-18 01:12:13.086902
3a090101-221d-458c-9585-a4f0322069a5	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 01:13:20.925	\N	\N	General AI interaction	general	medium	2025-11-18 01:13:20.926704	2025-11-18 01:13:20.926704
e34b12f7-24e3-4b2d-8d46-393fb6292859	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 01:18:21.471	\N	\N	General AI interaction	general	medium	2025-11-18 01:18:21.471977	2025-11-18 01:18:21.471977
4e59d9cb-1695-4873-a441-3af2e1c10f47	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 01:29:29.947	\N	\N	General AI interaction	general	medium	2025-11-18 01:29:29.947768	2025-11-18 01:29:29.947768
ed6c69ca-dcca-4eaf-b3e3-04a60fd14b75	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 01:33:11.585	\N	\N	General AI interaction	general	medium	2025-11-18 01:33:11.586435	2025-11-18 01:33:11.586435
43aa102c-b934-46d9-9403-e734f42ca251	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 10:24:51.773	2025-11-18 10:25:10.899	0	General AI interaction	general	medium	2025-11-18 10:24:51.773807	2025-11-18 10:25:10.899
a85b752f-1bfb-47d9-b3d0-1d31d62fffe1	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 10:25:16.419	\N	\N	General AI interaction	general	medium	2025-11-18 10:25:16.42036	2025-11-18 10:25:16.42036
f63fa618-97bb-428d-8c8a-240b03748d8a	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 10:30:25.5	\N	\N	General AI interaction	general	medium	2025-11-18 10:30:25.501146	2025-11-18 10:30:25.501146
5016ac59-6529-41e1-9b18-4b550dacbfc9	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 10:32:03.362	\N	\N	General AI interaction	general	medium	2025-11-18 10:32:03.363024	2025-11-18 10:32:03.363024
a18ae8c6-527f-49ec-9d24-aaa0b8981026	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 10:40:17.458	\N	\N	General AI interaction	general	medium	2025-11-18 10:40:17.459975	2025-11-18 10:40:17.459975
b839e408-e11d-4e97-99d9-f2012652981b	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 10:44:32.114	\N	\N	General AI interaction	general	medium	2025-11-18 10:44:32.115256	2025-11-18 10:44:32.115256
2aff5c0a-fe7a-4b92-8da7-14817e388d7e	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 10:49:22.317	\N	\N	General AI interaction	general	medium	2025-11-18 10:49:22.318281	2025-11-18 10:49:22.318281
4416d782-144e-46d5-8cc6-334569f66d29	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 10:50:32.797	\N	\N	General AI interaction	general	medium	2025-11-18 10:50:32.809633	2025-11-18 10:50:32.809633
04f2cb34-e0c0-4514-9440-112c9a5ff7d1	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 10:56:20.011	\N	\N	General AI interaction	general	medium	2025-11-18 10:56:20.012527	2025-11-18 10:56:20.012527
d2511211-6c61-4731-9787-29e64d7d26b5	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 11:10:03.453	\N	\N	General AI interaction	general	medium	2025-11-18 11:10:03.454278	2025-11-18 11:10:03.454278
f311f73b-d67b-48cd-b747-81e74e72d902	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 11:10:56.613	\N	\N	General AI interaction	general	medium	2025-11-18 11:10:56.613819	2025-11-18 11:10:56.613819
8fb19475-ef6f-4982-bf74-f4ef0f3e4238	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 11:34:26.566	\N	\N	General AI interaction	general	medium	2025-11-18 11:34:26.567335	2025-11-18 11:34:26.567335
43bd9e04-4b89-4ce1-bc67-d852848ad219	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 11:35:51.716	\N	\N	General AI interaction	general	medium	2025-11-18 11:35:51.716485	2025-11-18 11:35:51.716485
56c3947c-f137-4cbb-8a2d-754ef0f8f173	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 11:53:11.186	\N	\N	General AI interaction	general	medium	2025-11-18 11:53:11.202875	2025-11-18 11:53:11.202875
05415bd5-7cc3-41cc-8581-7ce6a792b15c	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 11:53:49.196	\N	\N	General AI interaction	general	medium	2025-11-18 11:53:49.196919	2025-11-18 11:53:49.196919
41e5a186-e341-4e08-a075-bd32ae26640b	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 12:07:40.581	2025-11-18 12:07:57.224	0	General AI interaction	general	medium	2025-11-18 12:07:40.582055	2025-11-18 12:07:57.224
56f43dcf-de03-4495-9976-10afd157a8a0	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 12:08:09.704	\N	\N	General AI interaction	general	medium	2025-11-18 12:08:09.704732	2025-11-18 12:08:09.704732
c0d828b0-83bd-411a-a1d0-72a71901b8a3	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 12:11:28.536	2025-11-18 12:11:44.681	0	General AI interaction	general	medium	2025-11-18 12:11:28.53737	2025-11-18 12:11:44.681
18980611-d540-4563-b019-e015eb983257	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 12:11:51.864	2025-11-18 12:11:53.695	0	General AI interaction	general	medium	2025-11-18 12:11:51.864628	2025-11-18 12:11:53.695
6efba11e-85fa-425d-ac6b-b41203d0aaff	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 12:15:34.744	\N	\N	General AI interaction	general	medium	2025-11-18 12:15:34.756137	2025-11-18 12:15:34.756137
68132064-02f6-46dc-9e09-5cbcf94165b1	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 12:15:58.475	\N	\N	General AI interaction	general	medium	2025-11-18 12:15:58.476442	2025-11-18 12:15:58.476442
20224ee0-1a66-4d64-912d-ea13b1391d79	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 12:36:41.037	2025-11-18 12:36:48.607	0	General AI interaction	general	medium	2025-11-18 12:36:41.038946	2025-11-18 12:36:48.607
34306ae6-8b30-4449-b480-bfd8ef4d4159	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 13:38:18.477	\N	\N	General AI interaction	general	medium	2025-11-18 13:38:18.47776	2025-11-18 13:38:18.47776
3a4a3c7e-1b1c-435c-9d15-84c0e79982c4	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 13:38:21.3	\N	\N	General AI interaction	general	medium	2025-11-18 13:38:21.300765	2025-11-18 13:38:21.300765
afaf74a7-232d-442c-8035-9beb21d13f3a	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 13:38:28.249	\N	\N	General AI interaction	general	medium	2025-11-18 13:38:28.249429	2025-11-18 13:38:28.249429
dbb630c7-0b0f-4c73-a72f-fdde7095567a	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 13:45:42.018	\N	\N	General AI interaction	general	medium	2025-11-18 13:45:42.019145	2025-11-18 13:45:42.019145
a6edf390-8309-402b-bd46-65f21baff49c	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 13:45:43.115	\N	\N	General AI interaction	general	medium	2025-11-18 13:45:43.115993	2025-11-18 13:45:43.115993
4a668c5f-3fe8-4e12-bb1c-8094065b1849	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 13:46:32.027	\N	\N	General AI interaction	general	medium	2025-11-18 13:46:32.029629	2025-11-18 13:46:32.029629
c5412b0b-35b5-4d98-aca2-b69bd681f1ee	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 13:47:43.427	\N	\N	General AI interaction	general	medium	2025-11-18 13:47:43.428325	2025-11-18 13:47:43.428325
08d99cd8-6062-4e2e-b8c2-0f87bb1c4f9d	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 14:09:16.918	\N	\N	General AI interaction	general	medium	2025-11-18 14:09:16.918841	2025-11-18 14:09:16.918841
a0dd838e-638d-4b91-9529-8152502bad19	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 11:11:23.192	2025-11-18 14:09:27.022	178	General AI interaction	general	medium	2025-11-18 11:11:23.192811	2025-11-18 14:09:27.022
3e3022f4-d1af-428d-b268-962af5cad303	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 14:12:27.749	\N	\N	General AI interaction	general	medium	2025-11-18 14:12:27.749838	2025-11-18 14:12:27.749838
5e3b44ce-739f-4ad2-b8ab-e6096a6e73ec	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 14:12:37.197	\N	\N	General AI interaction	general	medium	2025-11-18 14:12:37.197932	2025-11-18 14:12:37.197932
6f2b0637-807c-4ff5-81c8-f14196174017	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 14:12:40.819	\N	\N	General AI interaction	general	medium	2025-11-18 14:12:40.820084	2025-11-18 14:12:40.820084
d9d5c283-4cd9-4fab-9cdb-2d7072ee80ec	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 14:12:41.552	\N	\N	General AI interaction	general	medium	2025-11-18 14:12:41.553045	2025-11-18 14:12:41.553045
6fa69f02-7cc7-4ed9-8ffc-3d9d157aa54f	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 14:12:43.412	\N	\N	General AI interaction	general	medium	2025-11-18 14:12:43.412659	2025-11-18 14:12:43.412659
c60812f6-dde5-42fc-bac7-bca47a48b0d2	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 14:12:44.04	\N	\N	General AI interaction	general	medium	2025-11-18 14:12:44.041422	2025-11-18 14:12:44.041422
52ed9f2f-6e3f-4862-b693-2ed7860af380	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 14:12:44.613	\N	\N	General AI interaction	general	medium	2025-11-18 14:12:44.613472	2025-11-18 14:12:44.613472
5afef219-1544-4674-a083-846a33fcab5f	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 14:12:50.095	\N	\N	General AI interaction	general	medium	2025-11-18 14:12:50.096002	2025-11-18 14:12:50.096002
d634e88d-1a81-406c-bfa9-06676b007b13	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:16.76	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:16.760753	2025-11-18 15:21:16.760753
5b7ff682-16fd-4833-96e5-b2e962506e4f	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:18.173	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:18.173768	2025-11-18 15:21:18.173768
ad4d4172-74ad-4173-b964-954b89c605fa	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:23.662	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:23.66329	2025-11-18 15:21:23.66329
711096e1-5e8b-41d1-8cb3-0b84a6254e3d	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:24.636	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:24.636961	2025-11-18 15:21:24.636961
388294aa-aa1e-416b-970d-eb30792a089c	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:25.138	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:25.138577	2025-11-18 15:21:25.138577
7a7a5bb8-6a76-49c4-82df-4c0ced66392f	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:25.335	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:25.336413	2025-11-18 15:21:25.336413
c219c64c-f466-4ac1-8d5e-47e14214b107	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:25.55	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:25.551067	2025-11-18 15:21:25.551067
f842f270-0b60-40b7-8717-8020f296a486	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:28.578	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:28.579273	2025-11-18 15:21:28.579273
bf8035d2-15ed-4e38-8cf4-5b4a5ac89c43	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:29.06	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:29.061391	2025-11-18 15:21:29.061391
76a34843-b83b-4a63-95ec-0280bae98641	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:29.336	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:29.337308	2025-11-18 15:21:29.337308
25ee270f-030d-4428-9a30-e24288c5f4ba	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:29.582	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:29.582751	2025-11-18 15:21:29.582751
0c689058-c06f-485f-9d89-cbb9b93e7d02	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:29.816	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:29.817183	2025-11-18 15:21:29.817183
943c5d4a-575e-4d7b-b0fa-6f1f5b8b6eec	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:30.056	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:30.05695	2025-11-18 15:21:30.05695
2425c535-995b-4d80-91e1-85b04c9983b3	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:30.285	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:30.285856	2025-11-18 15:21:30.285856
9c8f22a5-9a4d-4d8b-b5d7-36cf801a1fd1	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:30.856	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:30.856462	2025-11-18 15:21:30.856462
a1f18a24-b9a8-4302-a707-4bd009b80e7d	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:31.325	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:31.325435	2025-11-18 15:21:31.325435
3864359f-d48d-4524-823e-a2a705748060	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:31.511	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:31.512175	2025-11-18 15:21:31.512175
cb24b932-f7d6-40ce-8b0a-b6e5f1510b11	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:21:31.71	\N	\N	General AI interaction	general	medium	2025-11-18 15:21:31.711005	2025-11-18 15:21:31.711005
2e0ad211-d66e-42f8-90bc-2a5ce7be4f94	2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	2025-11-18 15:27:17.284	\N	\N	General AI interaction	general	medium	2025-11-18 15:27:17.285923	2025-11-18 15:27:17.285923
\.


--
-- Data for Name: skill_alerts; Type: TABLE DATA; Schema: public; Owner: wuqi
--

COPY public.skill_alerts (id, user_id, alert_type, severity, message, dismissed, triggered_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: skill_baselines; Type: TABLE DATA; Schema: public; Owner: wuqi
--

COPY public.skill_baselines (id, user_id, skill_name, baseline_score, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: skill_tests; Type: TABLE DATA; Schema: public; Owner: wuqi
--

COPY public.skill_tests (id, baseline_id, score, independence_percentage, quality_score, speed_score, tested_at, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: wuqi
--

COPY public.users (id, email, username, password_hash, user_type, created_at, updated_at) FROM stdin;
2ea88b85-5ea4-4bf3-a2b7-e56c15f2cbe7	winck.wu@gmail.com	winckwu	$2a$10$Qs2p4g21g56Ls4zHuL0dQOfl71aV5/Wa/YPE1KpU5RKEH5ABYTJSe	efficient	2025-11-18 01:08:45.199	2025-11-18 01:08:45.199
\.


--
-- Name: assessments assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);


--
-- Name: evolution_logs evolution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.evolution_logs
    ADD CONSTRAINT evolution_logs_pkey PRIMARY KEY (id);


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);


--
-- Name: pattern_logs pattern_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.pattern_logs
    ADD CONSTRAINT pattern_logs_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: skill_alerts skill_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.skill_alerts
    ADD CONSTRAINT skill_alerts_pkey PRIMARY KEY (id);


--
-- Name: skill_baselines skill_baselines_pkey; Type: CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.skill_baselines
    ADD CONSTRAINT skill_baselines_pkey PRIMARY KEY (id);


--
-- Name: skill_baselines skill_baselines_user_id_skill_name_key; Type: CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.skill_baselines
    ADD CONSTRAINT skill_baselines_user_id_skill_name_key UNIQUE (user_id, skill_name);


--
-- Name: skill_tests skill_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.skill_tests
    ADD CONSTRAINT skill_tests_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_assessments_created_at; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_assessments_created_at ON public.assessments USING btree (created_at);


--
-- Name: idx_assessments_user_id; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_assessments_user_id ON public.assessments USING btree (user_id);


--
-- Name: idx_evolution_logs_change_type; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_evolution_logs_change_type ON public.evolution_logs USING btree (change_type);


--
-- Name: idx_evolution_logs_user_id; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_evolution_logs_user_id ON public.evolution_logs USING btree (user_id);


--
-- Name: idx_interactions_created_at; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_interactions_created_at ON public.interactions USING btree (created_at);


--
-- Name: idx_interactions_session_id; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_interactions_session_id ON public.interactions USING btree (session_id);


--
-- Name: idx_pattern_logs_pattern; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_pattern_logs_pattern ON public.pattern_logs USING btree (detected_pattern);


--
-- Name: idx_pattern_logs_session_id; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_pattern_logs_session_id ON public.pattern_logs USING btree (session_id);


--
-- Name: idx_sessions_started_at; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_sessions_started_at ON public.sessions USING btree (started_at);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: idx_skill_alerts_severity; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_skill_alerts_severity ON public.skill_alerts USING btree (severity);


--
-- Name: idx_skill_alerts_user_id; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_skill_alerts_user_id ON public.skill_alerts USING btree (user_id);


--
-- Name: idx_skill_baselines_user_id; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_skill_baselines_user_id ON public.skill_baselines USING btree (user_id);


--
-- Name: idx_skill_tests_baseline_id; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_skill_tests_baseline_id ON public.skill_tests USING btree (baseline_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: wuqi
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: assessments assessments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: evolution_logs evolution_logs_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.evolution_logs
    ADD CONSTRAINT evolution_logs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: evolution_logs evolution_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.evolution_logs
    ADD CONSTRAINT evolution_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: interactions interactions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: pattern_logs pattern_logs_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.pattern_logs
    ADD CONSTRAINT pattern_logs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: skill_alerts skill_alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.skill_alerts
    ADD CONSTRAINT skill_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: skill_baselines skill_baselines_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.skill_baselines
    ADD CONSTRAINT skill_baselines_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: skill_tests skill_tests_baseline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wuqi
--

ALTER TABLE ONLY public.skill_tests
    ADD CONSTRAINT skill_tests_baseline_id_fkey FOREIGN KEY (baseline_id) REFERENCES public.skill_baselines(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict F8h2g0Ju7wi85JT0UAJ0tr2ulGCi8y23uHtonIh9WH75jilnUNAIQ5Eg4TmxozA

