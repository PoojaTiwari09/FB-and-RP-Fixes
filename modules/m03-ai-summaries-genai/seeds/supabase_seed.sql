-- ============================================================
-- M3 AI Deep Researcher — Seed Data
-- Run AFTER supabase_schema.sql
-- ============================================================

-- 1. ORG
INSERT INTO orgs (id, name, plan, features) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Acme Corp', 'enterprise', 
   '{"briefs": true, "ask_anything": true, "research": true}');

-- 2. TEAMS
INSERT INTO teams (id, org_id, name, feature_flags) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'West Sales Team',
   '{"briefs": true, "ask_anything": true, "research": true}'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'East Sales Team',
   '{"briefs": true, "ask_anything": true, "research": true}');

-- 3. USERS (8 reps + 2 managers + 1 admin + 1 CRO)
INSERT INTO users (id, org_id, team_id, email, name, role) VALUES
  -- West Team
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'sarah.manager@acme.com', 'Sarah Johnson', 'SALES_MANAGER'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'mike.rep1@acme.com', 'Mike Chen', 'SALES_REP'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'lisa.rep2@acme.com', 'Lisa Park', 'SALES_REP'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'james.rep3@acme.com', 'James Wilson', 'SALES_REP'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'anna.rep4@acme.com', 'Anna Davis', 'SALES_REP'),
  -- East Team
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'tom.manager@acme.com', 'Tom Rodriguez', 'SALES_MANAGER'),
  ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'rachel.rep5@acme.com', 'Rachel Kim', 'SALES_REP'),
  ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'david.rep6@acme.com', 'David Lee', 'SALES_REP'),
  ('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'emily.rep7@acme.com', 'Emily Brown', 'SALES_REP'),
  ('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'chris.rep8@acme.com', 'Chris Martinez', 'SALES_REP'),
  -- Admin & CRO
  ('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', NULL, 'admin@acme.com', 'Admin User', 'ADMIN'),
  ('c0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', NULL, 'cro@acme.com', 'Jennifer CRO', 'CRO');

-- 4. ACCOUNTS
INSERT INTO accounts (id, org_id, name, industry, segment, region, owner_user_id) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'TechFlow Inc', 'Technology', 'Mid-Market', 'West', 'c0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'DataPrime Solutions', 'Data Analytics', 'Mid-Market', 'West', 'c0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'CloudServe Pro', 'Cloud Services', 'Enterprise', 'West', 'c0000000-0000-0000-0000-000000000004'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'RetailMax Global', 'Retail', 'Mid-Market', 'East', 'c0000000-0000-0000-0000-000000000007'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'FinanceHub Corp', 'Finance', 'Enterprise', 'East', 'c0000000-0000-0000-0000-000000000008');

-- 5. CONTACTS
INSERT INTO contacts (id, org_id, account_id, name, email, role_title) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Alex Thompson', 'alex@techflow.com', 'VP Engineering'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Maria Garcia', 'maria@techflow.com', 'CTO'),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Robert Kim', 'robert@dataprime.com', 'Director of Ops'),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'Sandra Lee', 'sandra@cloudserve.com', 'CEO'),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'John Peters', 'john@retailmax.com', 'Head of Procurement');

-- 6. DEALS
INSERT INTO deals (id, org_id, account_id, owner_user_id, name, stage, status, amount, close_date) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'TechFlow Platform License', 'Discovery', 'OPEN', 85000.00, '2026-08-15'),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'TechFlow API Integration', 'Negotiation', 'OPEN', 42000.00, '2026-07-01'),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'DataPrime Analytics Suite', 'Discovery', 'OPEN', 65000.00, '2026-09-01'),
  ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'CloudServe Enterprise Deal', 'Discovery', 'OPEN', 250000.00, '2026-10-15'),
  ('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007', 'RetailMax Deployment', 'Proposal', 'OPEN', 120000.00, '2026-07-30'),
  ('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'DataPrime Expansion', 'Discovery', 'WON', 35000.00, '2026-03-15'),
  ('f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005', 'TechFlow Support Contract', 'Discovery', 'LOST', 28000.00, '2026-02-28');

-- 7. CALLS (sample call transcripts — realistic sales calls)
INSERT INTO calls (id, org_id, deal_id, account_id, owner_user_id, title, started_at, duration_seconds, transcript, sentiment_score) VALUES
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   'TechFlow Discovery Call #1', NOW() - INTERVAL '45 days', 1800,
   'Mike: Hi Alex, thanks for taking the time today. I wanted to understand your current challenges with your platform infrastructure. Alex: Sure, our main concern is integration complexity. We have about 15 different tools that need to talk to each other and it is becoming a nightmare. Mike: I hear that a lot from mid-market companies. Can you tell me more about the specific integration pain points? Alex: Well, the biggest issue is that our current vendor requires custom middleware for every integration. It takes 3-4 weeks per integration. Mike: That is significant. How does that impact your team productivity? Alex: We estimate we are losing about 20 hours per week just on integration maintenance. Our engineering team is frustrated because they cannot focus on product development. Mike: What about pricing? Is budget a concern? Alex: Honestly, yes. Our current solution costs us about $8,000 per month and we feel we are not getting enough value. The incumbent vendor has been raising prices 15% annually. Mike: I understand. Let me show you how our platform handles integrations natively. We have pre-built connectors for over 200 tools. Alex: That sounds promising but we have been burned before by vendors who promise seamless integration and then deliver something that requires just as much custom work. Mike: That is a valid concern. Would it help if I set up a technical proof of concept with your team? Alex: Yes, that would be ideal. Can we also discuss your pricing tiers? Mike: Absolutely. I will send over a proposal with our mid-market pricing. Our standard plan starts at $4,500 per month with unlimited integrations. Alex: That is more competitive. Let me discuss with Maria, our CTO, and get back to you.', 0.72),

  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   'TechFlow Discovery Call #2 with CTO', NOW() - INTERVAL '38 days', 2400,
   'Mike: Hi Maria, thanks for joining. Alex mentioned you had some technical questions about our integration capabilities. Maria: Yes, my main concern is about our existing vendor relationships. We have a 2-year contract with our current provider that does not expire until Q4. Integration complexity is one thing, but vendor lock-in is another issue entirely. Mike: I understand the concern about incumbent vendor relationships. Can you tell me more about what is working and what is not with your current setup? Maria: The core platform works fine, but the integration layer is painful. Every time we need a new connection, it takes weeks of custom development. The pricing is also a concern — they keep raising rates and the ROI is diminishing. Mike: What if we offered a migration plan that runs parallel to your existing contract? Maria: That could work, but I need to see proof that your integrations actually work with our stack. We use a mix of AWS services, Salesforce, and some custom internal tools. Mike: Perfect, those are all in our standard connector library. I would love to set up a sandbox environment for your team. Maria: OK, but I need to flag one thing — our security team will need to review any new vendor. That process typically takes 4-6 weeks. Mike: Understood. We are SOC 2 Type II certified and can provide all documentation upfront to accelerate that process.', 0.68),

  ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003',
   'DataPrime Discovery Call', NOW() - INTERVAL '30 days', 1500,
   'Lisa: Hi Robert, I appreciate you scheduling this call. How is everything going at DataPrime? Robert: Thanks Lisa. We are in a growth phase but struggling with our analytics infrastructure. Lisa: What specific challenges are you facing? Robert: Integration complexity is our number one issue. We have data scattered across 8 different systems and getting a unified view is nearly impossible. Lisa: That is a common challenge in the mid-market space. How are you handling reporting today? Robert: We have a team of 3 analysts who spend most of their time manually pulling data from different sources. It is incredibly inefficient. The pricing of our current tools is also a concern — we are paying for multiple licenses that overlap in functionality. Lisa: What would an ideal solution look like for you? Robert: Something that can connect to all our data sources natively and provide real-time dashboards. But honestly, the incumbent vendor relationships make switching difficult. Our team is comfortable with the current tools even though they are not optimal. Lisa: I understand the change management aspect. Would it help if we could demonstrate a 10x improvement in reporting speed? Robert: That would definitely get attention from our leadership team.', 0.65),

  ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004',
   'CloudServe Enterprise Discovery', NOW() - INTERVAL '25 days', 2100,
   'James: Good morning Sandra. Thank you for making time in your schedule. Sandra: Of course, James. Our board has been pushing us to modernize our cloud infrastructure and I wanted to explore options. James: That is great to hear. Can you tell me about your current setup? Sandra: We are running a hybrid environment with on-prem servers and some AWS workloads. The integration complexity between the two environments is killing our engineering team. James: How many engineers are dedicated to infrastructure management? Sandra: Too many — about 12 out of our 40-person engineering team spend significant time on infrastructure. The pricing concern is real too — our AWS bill has grown 40% year over year. James: That is a significant cost. What about your existing vendor relationships? Sandra: We have contracts with three different cloud providers and none of them talk to each other well. The incumbent vendor relationships are hard to manage — each one has different SLAs, different support models. James: I see the pain. Our platform offers a unified management layer across all major cloud providers. Sandra: That sounds ideal in theory. But our CFO is going to ask about ROI timeline. What kind of savings can we expect? James: Typically our enterprise customers see 30-40% infrastructure cost reduction within the first year. Sandra: I will need a detailed business case to present to the board. Can you prepare that?', 0.70),

  ('10000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'TechFlow Follow-up - Anna', NOW() - INTERVAL '20 days', 1200,
   'Anna: Hi Alex, this is Anna from our team following up on the technical evaluation. How did the proof of concept go? Alex: Hi Anna. The POC went well technically but we hit a snag. Our procurement team raised concerns about the pricing structure. Anna: Can you tell me more about those pricing concerns? Alex: They feel the per-seat pricing model does not scale well for our team size. We have 150 users but only about 60 are daily active users. Paying for all 150 seats feels wasteful. Anna: That is valid feedback. We do offer a concurrent user model for mid-market companies that might work better. Alex: That would be more appealing. Also, there is still the integration complexity question — our DevOps team tested the API connectors and found that 3 out of our 15 critical integrations are not supported natively. Anna: Which integrations are those? Alex: Our custom ERP, our legacy CRM system, and a homegrown monitoring tool. Anna: I see. For custom systems, we offer a universal API adapter that can connect to any REST or SOAP endpoint. Let me get our solutions engineer to walk your team through that. Alex: OK, but timing is a concern. We need a decision by end of Q3 because our current contract renewal is coming up. The incumbent vendor has already sent us a renewal proposal.', 0.60),

  ('10000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003',
   'DataPrime Stakeholder Alignment', NOW() - INTERVAL '15 days', 1800,
   'Lisa: Robert, thanks for bringing your VP of Data into this call. Robert: Sure, let me introduce Dr. Patel. She oversees our entire data strategy. Dr. Patel: Hello Lisa. Robert has told me about your analytics platform. My main concern is about integration complexity with our existing Snowflake warehouse. Lisa: Absolutely. We have a native Snowflake connector that syncs in real-time. Dr. Patel: What about data governance? We need to ensure GDPR compliance across all analytics pipelines. Lisa: We are fully GDPR compliant with data residency options in EU and US. Dr. Patel: Pricing is also a factor. We have budget constraints this fiscal year. Our current analytics spend is $12,000 per month across three tools. If we consolidate, we need to see a clear cost saving. Lisa: Our platform can replace all three tools at $8,500 per month, which gives you a 30% cost reduction. Dr. Patel: That is interesting but the incumbent vendor relationships need careful management. Our Snowflake contract runs through next year. Robert: One more thing — we have seen competitors offer similar claims about integration complexity being resolved, but the reality is always messier. Lisa: I understand the skepticism. Would a 30-day pilot with your actual data help build confidence? Dr. Patel: Yes, but only if it does not disrupt our production environment. Lisa: Absolutely, we would set up a sandboxed environment.', 0.64),

  ('10000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007',
   'RetailMax Initial Discovery', NOW() - INTERVAL '40 days', 1650,
   'Rachel: Hi John, thanks for connecting. I understand RetailMax is looking at modernizing your inventory management. John: Yes Rachel, we are. Our current system is 8 years old and integration complexity with our e-commerce platform is a constant problem. Rachel: How does that impact your business? John: We lose about $200K per quarter in stockout situations because our inventory data is not syncing properly between our warehouse system and our online store. Rachel: That is a significant revenue impact. What solutions have you looked at? John: We had demos from three other vendors. The pricing concerns are real — most solutions in this space cost $15K-25K per month. Rachel: Our platform is positioned at $12K per month for mid-market retail companies, and it includes native e-commerce integrations. John: The incumbent vendor relationships are tricky though. Our warehouse team is very attached to their current system. Rachel: Change management is definitely part of the equation. We offer a dedicated onboarding team that works alongside your warehouse staff. John: That helps. The other big concern is integration complexity with our POS systems. We have 45 retail locations each with different POS hardware. Rachel: We have a universal POS adapter that supports over 30 hardware manufacturers. Let me send you the compatibility list.', 0.67),

  ('10000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000009',
   'RetailMax Technical Deep-Dive', NOW() - INTERVAL '32 days', 2700,
   'Emily: John, I have our solutions architect on the call today to address the POS integration questions. John: Great, that was our biggest concern. Solutions Architect: Hi John, I reviewed your POS hardware list. We support 42 out of your 45 locations natively. For the remaining 3, we can build custom adapters within 2 weeks. John: That sounds reasonable. What about real-time inventory syncing? Emily: Our platform provides sub-second inventory updates across all channels. John: The pricing concerns keep coming up internally. Our CFO wants a clear ROI projection. Emily: Based on your $200K quarterly stockout losses, even a 50% reduction would give you $400K annual savings against a $144K annual platform cost. John: That math works. But integration complexity with our ERP is still a question mark. Our ERP vendor says they do not support third-party integrations well. Solutions Architect: We actually have a partnership with that ERP vendor. We can share reference customers who have done exactly this integration. John: That would help a lot. The incumbent vendor relationships are always the hardest part of any technology change.', 0.75);

-- 8. EMAILS
INSERT INTO emails (id, org_id, deal_id, account_id, sender_user_id, subject, body, sent_at) VALUES
  ('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   'Follow-up: TechFlow Discovery Call', 'Hi Alex, Thank you for the productive call today. As discussed, I am attaching our integration capabilities document and mid-market pricing sheet. Key takeaways: 1) Your integration complexity challenges can be addressed by our 200+ native connectors 2) We can offer concurrent user pricing to address your cost concerns 3) POC timeline would be 2 weeks. Let me know when works for the technical demo with Maria. Best, Mike', NOW() - INTERVAL '44 days'),
  ('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003',
   'DataPrime Analytics Proposal', 'Hi Robert, Following our call, I wanted to share a comparison of your current 3-tool setup vs our consolidated platform. The pricing breakdown shows a 30% cost reduction while gaining real-time dashboards and unified data views. I have also included case studies from similar mid-market data analytics companies. The integration complexity concerns you raised are addressed in section 3 of the proposal. Best, Lisa', NOW() - INTERVAL '28 days'),
  ('20000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'Re: TechFlow POC Results & Pricing Discussion', 'Hi Alex, Thank you for sharing the POC feedback. I understand the pricing concerns around per-seat vs concurrent user models. I have prepared a revised proposal with concurrent user pricing that should address the 150-seat issue. Regarding the 3 missing native integrations, our solutions team has confirmed we can support all three via our Universal API Adapter. I have attached a technical spec. The incumbent vendor renewal deadline is noted — we can expedite our process to ensure you have a decision-ready proposal by end of month. Best, Anna', NOW() - INTERVAL '18 days');

-- 9. PERMISSION POLICIES
INSERT INTO permission_policies (id, org_id, team_id, feature, is_enabled, config) VALUES
  ('50000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', NULL, 'RESEARCH', TRUE, '{"max_jobs_per_day": 20}'),
  ('50000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', NULL, 'ASK_ANYTHING', TRUE, '{"max_queries_per_hour": 100}'),
  ('50000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', NULL, 'BRIEFS', TRUE, '{}'),
  ('50000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'RESEARCH', TRUE, '{"max_jobs_per_day": 20}'),
  ('50000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'RESEARCH', TRUE, '{"max_jobs_per_day": 20}');

-- ============================================================
-- 10. ASK ANYTHING — DEMO DATA
-- Note: Ask Anything uses client-side mock data (crm.js) for
-- offline/demo mode. When Supabase is configured, it uses the
-- same deals/contacts/accounts/calls tables from sections above.
-- The ai_chat_history table starts empty and is populated as
-- users interact with the AI chat feature.


-- ============================================================
-- 11. AI SMART SUMMARIES SEED DATA
-- ============================================================

-- A. Default Templates
INSERT INTO brief_templates (id, org_id, template_name, entity_type, description, is_active, version_number) VALUES
  ('90000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Standard Call Brief', 'call', 'Standard layout for call summaries with transcript citations.', TRUE, 1),
  ('90000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Standard Deal Brief', 'deal', 'Comprehensive pipeline tracking and risk indicators.', TRUE, 1),
  ('90000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Standard Account Brief', 'account', 'High-level business intelligence overview for account planning.', TRUE, 1),
  ('90000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Standard Contact Brief', 'contact', 'Stakeholder engagement, sentiment analysis, and relationship tracking.', TRUE, 1)
ON CONFLICT (id) DO NOTHING;

-- B. Default Call Template Sections
INSERT INTO brief_template_sections (template_id, section_name, ai_question, instructions, section_order, enabled, required, data_sources) VALUES
  ('90000000-0000-0000-0000-000000000001', 'Executive Summary', 'Provide a brief high-level overview of this meeting, who attended, and the overall outcome.', 'Keep the summary clear, professional, and limited to 2-3 sentences.', 1, TRUE, TRUE, '{"calls": true, "transcripts": true}'),
  ('90000000-0000-0000-0000-000000000001', 'Key Pain Points & Objections', 'What core business challenges or pricing objections were expressed by the prospect?', 'List verbatim quotes as rich citations where appropriate.', 2, TRUE, FALSE, '{"calls": true, "transcripts": true, "emails": true}'),
  ('90000000-0000-0000-0000-000000000001', 'Pricing & Commercial Terms', 'What pricing expectations, concurrent user models, or support contract requirements were discussed?', 'Highlight any specific financial numbers and contract terms.', 3, TRUE, FALSE, '{"calls": true, "transcripts": true}'),
  ('90000000-0000-0000-0000-000000000001', 'Action Items & Next Steps', 'What clear commitments, owners, and next action items were established at the end of the call?', 'Identify dates and individual responsibilities clearly.', 4, TRUE, TRUE, '{"calls": true, "transcripts": true, "emails": true}');

-- C. Default Deal Template Sections
INSERT INTO brief_template_sections (template_id, section_name, ai_question, instructions, section_order, enabled, required, data_sources) VALUES
  ('90000000-0000-0000-0000-000000000002', 'Deal Profile & Status', 'Summarize this deal size, current pipeline stage, status, and upcoming close date.', 'Enforce context accuracy.', 1, TRUE, TRUE, '{"calls": true, "emails": true}'),
  ('90000000-0000-0000-0000-000000000002', 'Competitors & Blockers', 'Are there any key competitors mentioned, technical roadblocks, or procurement timeline concerns?', 'Highlight risk levels.', 2, TRUE, TRUE, '{"calls": true, "emails": true}'),
  ('90000000-0000-0000-0000-000000000002', 'Closing Roadmap', 'What are the technical evaluation validation steps, sandbox reviews, or security processes required to close?', 'Enlist actions.', 3, TRUE, FALSE, '{"calls": true, "emails": true}');

-- D. Default Account Template Sections
INSERT INTO brief_template_sections (template_id, section_name, ai_question, instructions, section_order, enabled, required, data_sources) VALUES
  ('90000000-0000-0000-0000-000000000003', 'Account Overview', 'What is this account core industry, segment, size, and business scale?', 'Provide general profile.', 1, TRUE, TRUE, '{"calls": true}'),
  ('90000000-0000-0000-0000-000000000003', 'Relationship Health & Risk Indicators', 'What is the relationship health? Are there diminishing ROI concerns or price increases causing risk?', 'Analyze call sentiment and emails.', 2, TRUE, TRUE, '{"calls": true, "emails": true}'),
  ('90000000-0000-0000-0000-000000000003', 'Strategic Action Plan', 'What are the cross-sell expansion or contract parallel migration plans discussed?', 'Outline recommendations.', 3, TRUE, FALSE, '{"calls": true, "emails": true}');

-- E. Default Contact Template Sections
INSERT INTO brief_template_sections (template_id, section_name, ai_question, instructions, section_order, enabled, required, data_sources) VALUES
  ('90000000-0000-0000-0000-000000000004', 'Professional Profile', 'What is this contact role, sphere of influence, and key business focus area?', 'Detail decision-making capability.', 1, TRUE, TRUE, '{"calls": true}'),
  ('90000000-0000-0000-0000-000000000004', 'Engagement & Verbatim Insights', 'What specific feedback, product opinions, or pricing feedback has this contact provided in threads?', 'Capture direct sentiment cues.', 2, TRUE, TRUE, '{"calls": true, "emails": true}');

-- F. Populate Mock Transcripts (For RAG evidence citations on sample calls)
INSERT INTO transcripts (call_id, transcript_text, speaker, timestamp_ms, sentiment) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Hi Alex, thanks for taking the time today. I wanted to understand your current challenges with your platform infrastructure.', 'Mike Chen', 12000, 'neutral'),
  ('10000000-0000-0000-0000-000000000001', 'Sure, our main concern is integration complexity. We have about 15 different tools that need to talk to each other and it is becoming a nightmare.', 'Alex Thompson', 35000, 'negative'),
  ('10000000-0000-0000-0000-000000000001', 'Well, the biggest issue is that our current vendor requires custom middleware for every integration. It takes 3-4 weeks per integration.', 'Alex Thompson', 95000, 'negative'),
  ('10000000-0000-0000-0000-000000000001', 'Honestly, yes. Our current solution costs us about $8,000 per month and we feel we are not getting enough value. The incumbent vendor has been raising prices 15% annually.', 'Alex Thompson', 240000, 'negative'),
  ('10000000-0000-0000-0000-000000000001', 'I will send over a proposal with our mid-market pricing. Our standard plan starts at $4,500 per month with unlimited integrations.', 'Mike Chen', 450000, 'positive'),
  ('10000000-0000-0000-0000-000000000001', 'That is more competitive. Let me discuss with Maria, our CTO, and get back to you.', 'Alex Thompson', 520000, 'positive');

-- G. Populate Mock Notes & Activities (For rich CRM context)
INSERT INTO notes (org_id, account_id, deal_id, contact_id, note_text, created_by) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Alex expressed high dissatisfaction with incumbent vendor due to recent 15% rate increases.', 'Mike Chen'),
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'CTO Maria is highly concerned about AWS custom infrastructure lock-in. Security audit is a blocker.', 'Mike Chen');

INSERT INTO activities (org_id, account_id, deal_id, contact_id, activity_type, description, due_date, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Security Review', 'Submit SOC 2 documentation to Maria for technical audit.', NOW() + INTERVAL '5 days', 'pending');

