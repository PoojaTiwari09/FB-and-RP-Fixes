-- ═══════════════════════════════════════════════════════════════
--  SalesIQ Demo Seed Data
--  Run this AFTER the schema SQL in your Supabase SQL Editor.
--  It inserts 12 deals, 8 accounts, 10 contacts, 12 tasks,
--  5 calls, 8 activity items, and 3 sales reps.
-- ═══════════════════════════════════════════════════════════════

-- ── REPS ─────────────────────────────────────────────────────
insert into reps (name, avatar, deals, pipeline, closed, quota, win_rate, avg_cycle, calls) values
  ('Priya S.', 'P', 4, 513000, 128000, 200000, 48, 42, 18),
  ('Raj M.',   'R', 3, 174000, 54000,  150000, 38, 51, 14),
  ('Amir K.',  'A', 3, 267000, 89000,  175000, 45, 44, 16)
on conflict do nothing;

-- ── ACCOUNTS ─────────────────────────────────────────────────
insert into accounts (id, name, industry, size, employees, arr, health_score, website, location, since, contacts, deals) values
  ('A001', 'Acme Corp',    'Manufacturing',  'Enterprise', 5200,  128000, 82, 'acmecorp.com',    'San Francisco, CA', '2023-06', '["John Harlow","Emily Ross"]', '["D001"]'),
  ('A002', 'TechNova',     'SaaS',           'Mid-market', 340,   54000,  58, 'technova.io',     'Austin, TX',        '2024-01', '["Sara Kim"]',                '["D002"]'),
  ('A003', 'GlobalBank',   'Finance',        'Enterprise', 28000, 0,      41, 'globalbank.com',  'New York, NY',      '2024-02', '["Michael Chen","VP Legal"]', '["D003"]'),
  ('A004', 'RetailPro',    'Retail',         'SMB',        85,    36000,  95, 'retailpro.co',    'Chicago, IL',       '2023-11', '["Lisa Tran"]',               '["D004"]'),
  ('A005', 'HealthOS',     'Healthcare',     'Mid-market', 620,   0,      64, 'healthos.io',     'Boston, MA',        '2024-01', '["Dr. Patel","IT Director"]', '["D005"]'),
  ('A007', 'LogiChain',    'Logistics',      'Enterprise', 3100,  0,      55, 'logichain.com',   'Dallas, TX',        '2023-12', '["Tom Wagner"]',              '["D007"]'),
  ('A008', 'EduTech Inc',  'Education',      'Mid-market', 210,   0,      47, 'edutechinc.com',  'Seattle, WA',       '2024-01', '["Rachel Park"]',             '["D008"]'),
  ('A009', 'CloudSec Ltd', 'Cybersecurity',  'Enterprise', 1800,  0,      71, 'cloudsec.com',    'Washington, DC',    '2024-02', '["Amy Zhang","CISO"]',        '["D009"]')
on conflict do nothing;

-- ── CONTACTS ─────────────────────────────────────────────────
insert into contacts (id, name, title, company, account_id, email, phone, deal_id, last_contact, sentiment, notes) values
  ('C001', 'John Harlow',   'VP of Operations',       'Acme Corp',    'A001', 'j.harlow@acmecorp.com',   '+1 415 555 0182', 'D001', '2024-02-26', 'Positive',      'Key champion. Has exec buy-in.'),
  ('C002', 'Sara Kim',      'Head of Engineering',    'TechNova',     'A002', 'sara@technova.io',         '+1 512 555 0134', 'D002', '2024-02-24', 'Neutral',       'Evaluating 2 vendors. Security focus.'),
  ('C003', 'Michael Chen',  'Chief Compliance Officer','GlobalBank',  'A003', 'm.chen@globalbank.com',   '+1 212 555 0167', 'D003', '2024-02-22', 'Positive',      'Needs board approval for spend.'),
  ('C004', 'Lisa Tran',     'CTO',                    'RetailPro',    'A004', 'lisa@retailpro.co',        '+1 312 555 0198', 'D004', '2024-02-28', 'Very Positive', 'Signed! Great relationship.'),
  ('C005', 'Dr. Patel',     'Chief Medical Officer',  'HealthOS',     'A005', 'patel@healthos.io',        '+1 617 555 0145', 'D005', '2024-02-25', 'Very Positive', 'HIPAA compliance is top priority.'),
  ('C006', 'Tom Wagner',    'Director of Operations', 'LogiChain',    'A007', 't.wagner@logichain.com',   '+1 972 555 0121', 'D007', '2024-02-23', 'Tense',         'Pushing hard on discount. Risk of churn.'),
  ('C007', 'Rachel Park',   'L&D Manager',            'EduTech Inc',  'A008', 'r.park@edutechinc.com',   '+1 206 555 0177', 'D008', '2024-02-21', 'Neutral',       'Waiting on board budget approval.'),
  ('C008', 'Amy Zhang',     'CISO',                   'CloudSec Ltd', 'A009', 'a.zhang@cloudsec.com',    '+1 202 555 0156', 'D009', '2024-02-27', 'Positive',      'Budget confirmed Q2. Strong champion.')
on conflict do nothing;

-- ── DEALS ────────────────────────────────────────────────────
insert into deals (id, name, stage, value, probability, owner, days_in_stage, close_date, company, contact, account_id, notes, activities, tags, score, trend) values

  -- Negotiation (big ticket, stalled — creates urgency)
  ('D001', 'Acme Corp — Enterprise License', 'Negotiation', 128000, 80,
   'Priya S.', 12, '2024-07-15', 'Acme Corp', 'John Harlow', 'A001',
   'Final pricing call scheduled. Legal reviewing MSA. Champion confirmed $128K budget.',
   '["Demo completed","Proposal sent","Legal review in progress","Exec alignment call done"]',
   '["Enterprise","High-value","Manufacturing"]', 82, 'up'),

  -- Proposal (competitive eval)
  ('D002', 'TechNova SaaS Bundle', 'Proposal', 54000, 55,
   'Raj M.', 7, '2024-07-22', 'TechNova', 'Sara Kim', 'A002',
   'Competitor eval ongoing. Needs security questionnaire. Q2 go-live target.',
   '["Discovery call done","Proposal sent","Security docs requested"]',
   '["Mid-market","SaaS","Competitive"]', 58, 'stable'),

  -- Qualification (large potential)
  ('D003', 'GlobalBank Compliance Suite', 'Qualification', 210000, 35,
   'Priya S.', 3, '2024-09-30', 'GlobalBank', 'Michael Chen', 'A003',
   'Initial interest confirmed. Needs executive sponsor and board budget approval.',
   '["Cold outreach response","Intro call booked","Compliance assessment sent"]',
   '["Enterprise","Finance","High-value","Compliance"]', 41, 'up'),

  -- Closed Won
  ('D004', 'RetailPro Inventory AI', 'Closed Won', 36000, 100,
   'Amir K.', 0, '2024-05-28', 'RetailPro', 'Lisa Tran', 'A004',
   'Contract signed. Onboarding kickoff scheduled. Great reference customer.',
   '["Signed","PO received","Kickoff scheduled","Onboarding started"]',
   '["SMB","Retail","Quick-win"]', 100, 'stable'),

  -- Demo (healthcare — complex)
  ('D005', 'HealthOS Patient Analytics', 'Demo', 89000, 60,
   'Amir K.', 5, '2024-08-30', 'HealthOS', 'Dr. Patel', 'A005',
   'Technical demo loved their HIPAA module. IT team impressed. Budget $89K greenlit internally.',
   '["Discovery done","Technical demo scheduled","HIPAA review requested"]',
   '["Mid-market","Healthcare","HIPAA"]', 64, 'up'),

  -- Closed Lost
  ('D006', 'StartupHub Seed Pack', 'Closed Lost', 12000, 0,
   'Raj M.', 0, '2024-04-20', 'StartupHub', 'Nia Osei', 'A006',
   'Went with competitor. Cited pricing as primary objection. Nurture for 6 months.',
   '["Proposal rejected","Lost to competitor"]',
   '["SMB","Startup","Price-sensitive"]', 0, 'down'),

  -- Negotiation (long-stalled — at risk)
  ('D007', 'LogiChain Fleet Management', 'Negotiation', 175000, 75,
   'Priya S.', 18, '2024-07-10', 'LogiChain', 'Tom Wagner', 'A007',
   'Stalled on multi-year discount terms. Escalate to VP Sales. 40% discount requested.',
   '["Demo done","Legal approved","Pricing negotiation","Escalation to VP"]',
   '["Enterprise","Logistics","At-risk","High-value"]', 55, 'down'),

  -- Proposal (education, board approval pending)
  ('D008', 'EduTech LMS Platform', 'Proposal', 42000, 50,
   'Raj M.', 14, '2024-08-05', 'EduTech Inc', 'Rachel Park', 'A008',
   'Waiting for board budget approval. Strong functional fit confirmed.',
   '["Demo done","Proposal sent","Board review pending"]',
   '["Mid-market","Education"]', 47, 'stable'),

  -- Demo (cybersecurity, strong champion)
  ('D009', 'CloudSec Zero Trust Platform', 'Demo', 145000, 65,
   'Priya S.', 4, '2024-08-15', 'CloudSec Ltd', 'Amy Zhang', 'A009',
   'Strong interest from CISO. Budget confirmed Q2. FedRAMP certification required.',
   '["Intro call done","Technical demo scheduled","FedRAMP docs sent"]',
   '["Enterprise","Security","High-value","FedRAMP"]', 71, 'up'),

  -- Qualification (fintech)
  ('D010', 'FinTrust Risk Engine', 'Qualification', 78000, 40,
   'Amir K.', 6, '2024-09-01', 'FinTrust', 'David Okafor', 'A010',
   'Regulatory compliance angle resonating. Early stage discovery.',
   '["LinkedIn outreach","Discovery call booked"]',
   '["Mid-market","Finance","Compliance"]', 44, 'up'),

  -- Demo (e-commerce, new logo)
  ('D011', 'ShopStream Commerce Analytics', 'Demo', 67000, 58,
   'Raj M.', 2, '2024-08-20', 'ShopStream', 'Priya Nair', 'A011',
   'Strong demo feedback. Real-time analytics is the hook. Decision committee of 4.',
   '["Cold outreach","Discovery call","Demo booked"]',
   '["Mid-market","E-commerce","Analytics"]', 62, 'up'),

  -- Proposal (AI platform, strategic)
  ('D012', 'NeuralWorks AI Platform', 'Proposal', 320000, 45,
   'Priya S.', 9, '2024-10-01', 'NeuralWorks', 'James O''Brien', 'A012',
   'Largest deal in pipeline. CTO is technical champion. Needs procurement review.',
   '["Strategic intro","Technical deep-dive","Proposal submitted","Procurement contacted"]',
   '["Enterprise","AI/ML","Strategic","High-value"]', 49, 'up')

on conflict do nothing;

-- ── TASKS ────────────────────────────────────────────────────
insert into tasks (id, title, deal_id, assignee, due, priority, done, type) values
  ('T001', 'Send revised MSA to Acme Corp',             'D001', 'Priya S.', '2024-07-01', 'High',     false, 'Document'),
  ('T002', 'Security questionnaire — TechNova',          'D002', 'Raj M.',   '2024-07-02', 'High',     false, 'Document'),
  ('T003', 'Schedule exec alignment call — GlobalBank',  'D003', 'Priya S.', '2024-07-03', 'Medium',   false, 'Call'),
  ('T004', 'Onboarding kickoff prep — RetailPro',        'D004', 'Amir K.', '2024-06-05', 'High',     true,  'Meeting'),
  ('T005', 'Send HIPAA BAA — HealthOS',                  'D005', 'Amir K.', '2024-07-04', 'High',     false, 'Document'),
  ('T006', 'VP Sales call with Tom Wagner — LogiChain',  'D007', 'Priya S.', '2024-06-29', 'Critical', false, 'Call'),
  ('T007', 'Follow up on board approval — EduTech',     'D008', 'Raj M.',   '2024-07-06', 'Medium',   false, 'Email'),
  ('T008', 'Technical demo prep — CloudSec',             'D009', 'Priya S.', '2024-07-07', 'High',     false, 'Meeting'),
  ('T009', 'Prepare counter-offer — LogiChain',         'D007', 'Raj M.',   '2024-07-01', 'Critical', false, 'Document'),
  ('T010', 'Discovery call — FinTrust',                 'D010', 'Amir K.', '2024-07-08', 'Medium',   false, 'Call'),
  ('T011', 'Demo setup and dry-run — ShopStream',       'D011', 'Raj M.',   '2024-07-09', 'High',     false, 'Meeting'),
  ('T012', 'Send NeuralWorks procurement brief',        'D012', 'Priya S.', '2024-07-05', 'Critical', false, 'Document')
on conflict do nothing;

-- ── CALLS ────────────────────────────────────────────────────
insert into calls (id, deal, type, date, duration, rep, sentiment, outcome, summary, key_moments, objections, next_steps) values
  ('CL001','D001','Negotiation Call','2024-06-26','42 min','Priya S.','Positive',
   'Price agreed in principle',
   'John confirmed budget approval at $128K. Discussed 3-year vs 2-year commitment. Agreed on 15% multi-year discount.',
   '["Budget confirmed at $128K","Legal timeline: 2 weeks","Champion: John Harlow"]',
   '["Needs IT security review","Prefers annual payment"]',
   '["Send revised MSA","Schedule exec alignment call"]'),

  ('CL002','D002','Discovery Call','2024-06-24','28 min','Raj M.','Neutral',
   'Proposal requested',
   'Sara mentioned evaluating two vendors. Biggest pain: manual reporting (8 hrs/week). Liked our integration story but wants security docs.',
   '["Pain: 8hrs/week manual reports","Timeline: Q2 go-live","Decision: 3 stakeholders"]',
   '["Security concerns","Budget not confirmed yet"]',
   '["Send security questionnaire","Proposal by Friday"]'),

  ('CL003','D005','Technical Demo','2024-06-25','55 min','Amir K.','Very Positive',
   'Advanced to next stage',
   'Dr. Patel loved the HIPAA compliance module. IT team was impressed by the audit trail feature. Budget greenlit internally at $89K.',
   '["HIPAA module: strong fit","IT team approved","Budget $89K approved"]',
   '["Data residency requirements","Need pilot program"]',
   '["Send HIPAA BAA","Schedule pilot kickoff"]'),

  ('CL004','D007','Negotiation Call','2024-06-23','35 min','Priya S.','Tense',
   'Escalation needed',
   'Tom pushed hard on 40% multi-year discount. Not supportable. Suggested escalating to VP Sales. Competitor offer on table.',
   '["Asked for 40% discount","Competitor offer mentioned","3-year deal possible"]',
   '["Pricing too high","Competitor cheaper by 20%"]',
   '["VP Sales to call Tom","Prepare counter-offer"]'),

  ('CL005','D009','Intro Call','2024-06-27','30 min','Priya S.','Positive',
   'Demo scheduled',
   'Amy Zhang confirmed Q2 budget approved. CISO is economic buyer. FedRAMP compliance is critical. Strong product-market fit.',
   '["Budget Q2 confirmed","FedRAMP requirement","Demo booked for next week"]',
   '["FedRAMP certification needed","Long procurement cycle"]',
   '["Send FedRAMP docs","Technical demo prep"]')
on conflict do nothing;

-- ── ACTIVITIES ───────────────────────────────────────────────
insert into activities (id, type, text, rep, time, deal_id) values
  ('ACT001','call',    'Negotiation call with Acme Corp — price agreed in principle',         'Priya S.', '2h ago',  'D001'),
  ('ACT002','email',   'Security questionnaire sent to TechNova',                             'Raj M.',   '4h ago',  'D002'),
  ('ACT003','deal',    'NeuralWorks AI Platform advanced to Proposal — $320K',                'Priya S.', '5h ago',  'D012'),
  ('ACT004','alert',   'LogiChain stalled 18 days in Negotiation — escalation needed',       'System',   '7h ago',  'D007'),
  ('ACT005','won',     'RetailPro Inventory AI CLOSED WON — $36K',                           'Amir K.',  '1d ago',  'D004'),
  ('ACT006','meeting', 'Technical demo completed — HealthOS loved HIPAA compliance module',  'Amir K.',  '1d ago',  'D005'),
  ('ACT007','proposal','Proposal sent to EduTech Inc — $42K LMS deal',                       'Raj M.',   '2d ago',  'D008'),
  ('ACT008','call',    'Intro call with CloudSec — demo scheduled, budget confirmed Q2',     'Priya S.', '2d ago',  'D009')
on conflict do nothing;
