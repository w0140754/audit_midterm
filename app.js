/* AuditLab — a no-framework, privacy-friendly GitHub Pages study site. */
(() => {
  'use strict';
  const DATA = window.AUDIT_DATA;
  if (!DATA || !Array.isArray(DATA.glossary) || !Array.isArray(DATA.questions)) {
    document.getElementById('main').textContent = 'Study data is missing. Make sure data.js is in the same folder.';
    return;
  }
  const KEY = 'auditlab-adtg220-v1';
  const $ = (s) => document.querySelector(s);
  const clean = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function readSaved() {
    try { const parsed=JSON.parse(localStorage.getItem(KEY)); return parsed && typeof parsed==='object' ? parsed : {}; }
    catch { return {}; }
  }
  const saved=readSaved();
  const progress = {
    ratings: saved.ratings && typeof saved.ratings==='object' ? saved.ratings : {},
    bookmarks: Array.isArray(saved.bookmarks) ? saved.bookmarks : [],
    history: Array.isArray(saved.history) ? saved.history : []
  };
  const state = {
    view: 'home', topic:'ALL', includeLater:false, cardFilter:'all', cardOrder:[], cardIndex:0, cardFlipped:false,
    glossSearch:'', openGlossary:new Set(), casesOpen:new Set(),
    quizCount:10, quizMode:'practice', quiz:null, quizResults:null,
    pageReady:false
  };
  const TOPICS=[{id:'ALL',name:'All topics'},...DATA.lessons.map(x=>({id:x.id,name:x.id}))];
  const sectionNames={home:'Overview',cards:'Flashcards',quiz:'Practice quiz',cases:'Risk scenarios',guide:'Study notes',glossary:'Glossary library'};
  const toastEl=$('#toast');
  function persist() { try {localStorage.setItem(KEY, JSON.stringify(progress));} catch {} }
  function go(view) { location.hash = '#'+view; }
  function toast(message) { toastEl.innerHTML = `<div class="toast">${clean(message)}</div>`; window.clearTimeout(toast.timer); toast.timer=window.setTimeout(()=>toastEl.innerHTML='',2800); }
  function shuffle(items) {const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function relevant(g) {return state.includeLater || !g.later;}
  function matchingTopic(item) {return state.topic==='ALL' || item.lo.includes(state.topic);}
  const dueCards=()=>DATA.flashcards.filter(g=>!g.later);
  function matchingCards(){ return DATA.flashcards.filter(g=>relevant(g)&&matchingTopic(g)&&(
    state.cardFilter==='all' ||
    (state.cardFilter==='bookmarks' && progress.bookmarks.includes(g.id)) ||
    (state.cardFilter==='retry' && progress.ratings[g.id]==='retry') ||
    (state.cardFilter==='new' && !progress.ratings[g.id])
  )); }
  function rebuildCards(random=false){let c=matchingCards().map(x=>x.id);state.cardOrder=random?shuffle(c):c;state.cardIndex=0;state.cardFlipped=false;}
  function currentCard(){return DATA.flashcards.find(g=>g.id===state.cardOrder[state.cardIndex]);}
  function percent(n,d){return d ? Math.round(n/d*100):0;}
  const ratedCount=()=>Object.keys(progress.ratings).filter(k=>dueCards().some(g=>g.id===k)).length;
  const knownCount=()=>dueCards().filter(g=>progress.ratings[g.id]==='known').length;
  const quizAnswered=()=>progress.history.reduce((t,h)=>t+h.total,0);
  const quizCorrect=()=>progress.history.reduce((t,h)=>t+h.correct,0);
  function badge(text,klass=''){return `<span class="pill ${klass}">${clean(text)}</span>`;}
  function topicTabs(){return `<div class="tabs">${TOPICS.map(t=>`<button type="button" class="tab ${t.id===state.topic?'selected':''}" data-action="topic" data-id="${t.id}" aria-pressed="${t.id===state.topic}">${clean(t.name)}</button>`).join('')}</div>`;}
  function pageHeader(eyebrow,title,subtitle){return `<div class="titlebar"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${subtitle}</p></div>`;}
  function source(name){return `<div class="source-tag">Source: ${clean(name)}</div>`;}
  function activateSidebar(){
    document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('is-active',a.dataset.view===state.view));
    $('#crumbPage').textContent=sectionNames[state.view];
    const b=$('#sidebar'); b.classList.remove('open');$('#menuButton').setAttribute('aria-expanded','false');
  }
  function render(shouldScroll=false){
    if(state.view==='cards' && !state.cardOrder.length && state.cardFilter==='all')rebuildCards();
    const views={home:renderHome,cards:renderCards,quiz:renderQuiz,cases:renderCases,guide:renderGuide,glossary:renderGlossary};
    $('#main').innerHTML=(views[state.view]||renderHome)();
    activateSidebar(); if (shouldScroll) window.scrollTo({top:0,behavior:'instant'});
  }
  function setViewFromHash(){const raw=(location.hash||'#home').replace(/^#/,''); const next=sectionNames[raw] ? raw : 'home';const changed=next!==state.view;state.view=next; if(next==='cards'&&state.cardOrder.length===0)rebuildCards(); render(changed);}

  function renderHome(){
    const active=dueCards(), mastered=knownCount(), reviewed=ratedCount(), attempts=progress.history.length;
    return `<section class="hero"><div class="hero-copy"><span class="eyebrow">YOUR MIDTERM PLAYBOOK · LO1–LO5</span><h1>Turn audit theory into <em>exam confidence.</em></h1><p>Study the highlighted definitions, practise real audit concepts, and work through the risk scenarios your instructor provided.</p><div class="row wrap"><button class="btn primary" data-action="nav" data-id="cards">Study flashcards <span aria-hidden="true">↗</span></button><button class="btn secondary" data-action="nav" data-id="quiz">Take a practice quiz <span aria-hidden="true">→</span></button></div></div><div class="hero-art" aria-hidden="true"><div class="orbit o1"></div><div class="orbit o2"></div><div class="orbit o3"></div><div class="orbit-core">A</div><span class="float-point"></span><span class="float-point f2"></span><span class="float-point f3"></span></div></section>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-top">Cards reviewed <span class="stat-icon">▤</span></div><div class="stat-number">${reviewed}<span class="slash"> / ${active.length}</span></div><div class="stat-bottom">${mastered} marked as known</div></div>
      <div class="stat-card"><div class="stat-top">Quiz accuracy <span class="stat-icon">◎</span></div><div class="stat-number">${quizAnswered()?percent(quizCorrect(),quizAnswered())+'%':'—'}</div><div class="stat-bottom">${quizAnswered()} questions answered</div></div>
      <div class="stat-card"><div class="stat-top">Practice sessions <span class="stat-icon">◈</span></div><div class="stat-number">${attempts}</div><div class="stat-bottom">Completed quizzes on this device</div></div>
    </div>
    <div class="section-header"><div><h2>Choose your study mode</h2><p>Switch between remembering, applying, and reviewing.</p></div></div>
    <div class="feature-grid">
      <button class="feature" data-action="nav" data-id="cards"><span class="feature-ico">▣</span><h3>Flashcard studio</h3><p>All ${DATA.meta.highlightCount} highlighted definitions plus ${DATA.meta.cardCount-DATA.meta.highlightCount} concept cards, all with mastery tracking.</p><span class="arrow">OPEN FLASHCARDS →</span></button>
      <button class="feature" data-action="nav" data-id="quiz"><span class="feature-ico">◈</span><h3>Practice questions</h3><p>${DATA.questions.length} original multiple-choice questions with explanations and optional exam mode.</p><span class="arrow">START PRACTICE →</span></button>
      <button class="feature" data-action="nav" data-id="cases"><span class="feature-ico">◇</span><h3>Risk scenarios</h3><p>Explain inherent, control and detection risk using all three instructor scenarios.</p><span class="arrow">SOLVE SCENARIOS →</span></button>
    </div>
    <div class="coverage-grid"><section class="panel"><div class="panel-head"><h3>Learning outcome roadmap</h3>${badge('MIDTERM · LO1–LO5','blue')}</div>${DATA.lessons.map(l=>{
      const c=active.filter(g=>g.lo.includes(l.id)); const done=c.filter(g=>progress.ratings[g.id]==='known').length;return `<div class="coverage-row"><div><div class="coverage-title">${l.id} <span class="muted">·</span> ${clean(l.short)}</div><div class="coverage-label">${c.length} study cards · ${DATA.questions.filter(q=>q.lo===l.id).length} questions</div></div><div class="coverage-end"><div class="meter"><span style="width:${percent(done,c.length)}%"></span></div><span class="percentage">${percent(done,c.length)}%</span></div></div>`}).join('')}</section>
    <section class="panel hint-panel"><div class="hint-ico">✳</div><h3>What should I focus on?</h3><p>Start with risk (IR, CR, DR), materiality, financial-statement assertions, and audit procedures. Then work through the full LO1–LO5 notes.</p><small>The updated syllabus places LO6–LO11 on the final. The highlighted glossary also contains later-outcome terms; those stay available under “include later topics.”</small><button class="btn ghost sm" style="margin-top:18px" data-action="nav" data-id="guide">Open syllabus-aligned notes →</button></section></div>
    <div class="note-call"><strong>Coverage note.</strong> Your five slide decks cover textbook Chapters 1–5, but your midterm’s LO5 points to Chapters 7–8. The provided LO5 coverage here is explicitly marked as partial. This site is not a prediction of the exam’s format or question selection.</div>`;
  }

  function renderCards(){
    const n=state.cardOrder.length;const c=currentCard();const bookmarked=c && progress.bookmarks.includes(c.id);
    let body=n ? `<div class="flash-wrap"><div class="card-rail"><span class="card-label">${badge(c.highlighted?'INSTRUCTOR HIGHLIGHT':'CONCEPT CARD','')} ${c.later?badge('LATER OUTCOME','orange'):badge('MIDTERM TERM','blue')}</span><span class="card-ordinal">CARD ${state.cardIndex+1} / ${n}</span></div><button class="flash-card ${state.cardFlipped?'is-flipped':''}" id="flashcard" aria-label="Flip current flashcard" aria-pressed="${state.cardFlipped}" data-action="flip"><div class="flash-card-inner"><div class="flash-face flash-front"><div class="face-top"><span>${clean(c.lo)}</span><span>✳ &nbsp; ${c.highlighted?'GLOSSARY':'COURSE NOTES'}</span></div><h2>${clean(c.term)}</h2><div class="face-bottom"><span>Tap anywhere to reveal original definition</span><span>FLIP ↻</span></div></div><div class="flash-face flash-back"><div class="face-top"><span>${c.highlighted?'HIGHLIGHTED GLOSSARY':'COURSE CONCEPT'}</span><span>${clean(c.lo)}</span></div><h2>${clean(c.term)}</h2><div class="flash-definition">${clean(c.definition)}</div><div class="face-bottom"><span>${clean(c.source)}</span><span>FLIP ↻</span></div></div></div></button>
    <div class="card-progress"><span style="width:${percent(state.cardIndex+1,n)}%"></span></div><div class="card-controls"><div class="card-control-group"><button class="btn secondary sm" data-action="cardPrev" ${state.cardIndex===0?'disabled':''}>← Previous</button><button class="btn secondary sm" data-action="cardNext" ${state.cardIndex>=n-1?'disabled':''}>Next →</button></div><div class="card-control-group"><button class="btn ghost sm" data-action="bookmark">${bookmarked?'★ Saved':'☆ Save term'}</button><button class="btn ghost sm" data-action="shuffleCards">↝ Shuffle</button></div></div>
    <div class="rating-controls"><button class="btn ${progress.ratings[c.id]==='retry'?'danger':'secondary'} rate-btn" data-action="rate" data-rating="retry">↺ Study again</button><button class="btn ${progress.ratings[c.id]==='known'?'primary':'secondary'} rate-btn" data-action="rate" data-rating="known">✓ I know this</button></div><p class="small-note" style="text-align:center;margin-top:17px">Keyboard: <span class="key">Space</span> flip · <span class="key">←</span> <span class="key">→</span> browse. Ratings are saved in your browser.</p></div>` : `<div class="empty"><h3>No cards in this selection</h3><p>Try another topic, change the filter, or include later-outcome highlights.</p><button class="btn secondary" data-action="resetCards">Show all midterm cards</button></div>`;
    return `${pageHeader('RETRIEVAL PRACTICE','Flashcard studio','Review all 63 exact highlighted glossary entries alongside concise concept cards from the instructor notes and slide decks.')}
    <div class="filters-panel"><div class="filters-caption">FILTER BY LEARNING OUTCOME</div>${topicTabs()}<div class="filters-foot"><label class="toggle"><input type="checkbox" data-action="includeLater" ${state.includeLater?'checked':''}> Include final-exam glossary terms</label><div class="row wrap"><label class="toggle">Show <select class="select" data-action="cardFilter" aria-label="Flashcard status filter"><option value="all" ${state.cardFilter==='all'?'selected':''}>All cards</option><option value="new" ${state.cardFilter==='new'?'selected':''}>Not reviewed</option><option value="retry" ${state.cardFilter==='retry'?'selected':''}>Study again</option><option value="bookmarks" ${state.cardFilter==='bookmarks'?'selected':''}>Saved terms</option></select></label></div></div></div>${body}`;
  }

  function availableQuestions(){return DATA.questions.filter(q=>state.topic==='ALL'||q.lo===state.topic);}
  function renderQuizSetup(){
    const n=availableQuestions().length;
    return `<div class="quiz-setup"><section class="panel setup-pane"><h3>Build a practice session</h3><p class="setup-description">Choose the outcome and how you want feedback. Questions are new and based on the course materials.</p><div class="field"><label class="field-label">Learning outcome</label>${topicTabs()}</div><div class="field"><label class="field-label">Number of questions</label><div class="option-row">${[10,20,0].map(k=>`<button class="choice-pill ${state.quizCount===k?'is-chosen':''}" data-action="quizCount" data-id="${k}" ${k>n?'disabled':''}>${k===0?`All ${n}`:k+' questions'}</button>`).join('')}</div></div><div class="field"><label class="field-label">Study mode</label><div class="option-row"><button class="choice-pill ${state.quizMode==='practice'?'is-chosen':''}" data-action="quizMode" data-id="practice">Practice · instant explanations</button><button class="choice-pill ${state.quizMode==='exam'?'is-chosen':''}" data-action="quizMode" data-id="exam">Exam · results at end</button></div></div><button class="btn primary" data-action="startQuiz" ${n===0?'disabled':''}>Start ${state.quizCount===0?n:Math.min(state.quizCount,n)}-question quiz →</button><p class="small-note" style="margin:17px 0 0">Question order and answer positions are randomized each session. Your completed scores stay on this device.</p></section><aside class="setup-info"><div class="quiz-art">◈</div><h3>Think like an auditor.</h3><p>Use the practice questions to connect definitions to decisions: Which risk is present? Which assertion? Which procedure?</p><div class="point"><strong>✓</strong> ${DATA.questions.length} practice questions in the bank</div><div class="point"><strong>✓</strong> Explanations and source labels</div><div class="point"><strong>✓</strong> Review incorrect answers after each quiz</div></aside></div>`;
  }
  function renderQuizPlaying(){const z=state.quiz;const q=z.list[z.index];const chosen=z.answers[z.index];const solved=typeof chosen==='number';const feedback=z.mode==='practice'&&solved;const options=q.playChoices || q.choices;
    return `<div class="quiz-progress-rail"><span>QUESTION ${z.index+1} OF ${z.list.length}</span><span>${z.mode==='exam'?'EXAM MODE · RESULTS AT END':'PRACTICE MODE · INSTANT FEEDBACK'}</span></div><div class="quiz-progress-bar"><span style="width:${percent(z.index+1,z.list.length)}%"></span></div><div class="quiz-box"><div class="quiz-heading">${badge(q.lo,'blue')}${badge(q.kind,'gray')}</div><h2>${clean(q.prompt)}</h2><div class="answer-list">${options.map((opt,i)=>{const good=feedback&&i===q.playCorrect;const bad=feedback&&i===chosen&&i!==q.playCorrect;return `<button class="answer-choice ${solved&&i===chosen?'is-picked':''} ${good?'is-correct':''} ${bad?'is-wrong':''}" data-action="quizAnswer" data-id="${i}" ${solved?'disabled':''}><span class="answer-letter">${'ABCD'[i]}</span><span>${clean(opt)}</span></button>`}).join('')}</div>
    ${feedback?`<div class="quiz-feedback ${chosen===q.playCorrect?'correct':'wrong'}"><strong>${chosen===q.playCorrect?'✓ Correct':'↺ Not quite'}</strong><p>${clean(q.explanation)}</p>${source(q.source)}</div>`:solved?`<div class="quiz-feedback"><strong>Answer saved</strong><p>Exam mode keeps the explanation hidden until you finish.</p></div>`:''}
    <div class="quiz-footer"><span class="small-note">${solved?'Answer recorded':'Choose one answer to continue'}</span><div class="row"><button class="btn ghost sm" data-action="quitQuiz">Exit quiz</button><button class="btn primary" data-action="quizNext" ${!solved?'disabled':''}>${z.index===z.list.length-1?'See results →':'Next question →'}</button></div></div></div>`;
  }
  function renderQuizResults(){const r=state.quizResults;const total=r.list.length;const correct=r.list.filter((q,i)=>r.answers[i]===q.playCorrect).length;const mistakes=r.list.filter((q,i)=>r.answers[i]!==q.playCorrect);
    return `<div class="results-head"><div class="score-ring" style="--pct:${percent(correct,total)}%"><span>${percent(correct,total)}%</span></div><div><span class="eyebrow">SESSION COMPLETE</span><h2>${correct===total?'A clean audit trail!':correct/total>=.7?'Solid progress.':'Keep sharpening your audit judgment.'}</h2><p>You answered <strong>${correct} of ${total}</strong> questions correctly. Review the explanations below to strengthen the concepts you missed.</p><div class="row wrap"><button class="btn primary" data-action="quizRestart">Start new quiz ↗</button>${mistakes.length?`<button class="btn secondary" data-action="quizMistakes">Retry ${mistakes.length} missed →</button>`:''}</div></div></div><div class="section-header subsection"><div><h2>Answer review</h2><p>Explanations and exact source references for every question in this session.</p></div></div><div class="review-list">${r.list.map((q,i)=>{const ok=r.answers[i]===q.playCorrect;return `<article class="review-item"><div class="review-q"><span class="${ok?'good':'bad'}">${ok?'✓':'×'}</span> ${i+1}. ${clean(q.prompt)}</div><div class="review-answer">Your answer: <strong class="${ok?'good':'bad'}">${clean(q.playChoices[r.answers[i]])}</strong></div>${!ok?`<div class="review-answer">Correct answer: <strong class="good">${clean(q.playChoices[q.playCorrect])}</strong></div>`:''}<p>${clean(q.explanation)}</p>${source(q.source)}</article>`}).join('')}</div>`;
  }
  function renderQuiz(){return `${pageHeader('APPLICATION PRACTICE','Practice quizzes','Question sets based on the instructor’s notes, slides, scenarios, and highlighted definitions—not actual or predicted exam questions.')}${state.quiz?renderQuizPlaying():state.quizResults?renderQuizResults():renderQuizSetup()}`;}

  function renderCases(){return `${pageHeader('INSTRUCTOR SCENARIOS','Risk assessment workshop','Try identifying all three risks before you reveal the instructor-derived explanation. These scenarios are adapted from the worksheet you uploaded.')}
    <div class="glossary-feature"><span class="symbol">✦</span><p><strong>Three-part answer:</strong> Inherent risk = susceptibility before controls. Control risk = control fails. Detection risk = auditor’s work misses a material misstatement. Explain the <em>specific fact</em> supporting each.</p></div>
    <div class="case-grid">${DATA.cases.map((c,i)=>`<article class="case-card"><div class="case-top"><span>${badge('CASE 0'+(i+1),'purple')} ${badge('LO3 / LO5','blue')}</span><span class="small-note">${clean(c.topic)}</span></div><h3>${clean(c.title)}</h3><p class="case-intro">${clean(c.scenario)}</p><div class="case-prompts"><strong>YOUR TASK — identify and justify:</strong><ol>${c.prompts.map(p=>`<li>${clean(p)}</li>`).join('')}</ol></div><div id="answers-${c.id}" class="case-answers ${state.casesOpen.has(c.id)?'':'case-hidden'}"><strong class="accent">SAMPLE REASONING</strong>${c.answers.map((a,j)=>`<p><b>${['Inherent risk','Control risk','Detection risk'][j]}:</b> ${clean(a)}</p>`).join('')}${source(c.source)}</div><button class="btn ${state.casesOpen.has(c.id)?'ghost':'secondary'} sm" data-action="caseToggle" data-id="${c.id}" style="margin-top:17px">${state.casesOpen.has(c.id)?'Hide explanations ↑':'Reveal explanations ↓'}</button></article>`).join('')}</div>
    <div class="note-call"><strong>Source wording note.</strong> The worksheet sometimes describes an actual clerical error under “inherent risk.” The highlighted glossary defines inherent risk more specifically as the susceptibility to misstatement <em>before</em> considering controls. These example answers use that definition while keeping each worksheet’s facts.</div>`;}

  function renderGuide(){return `${pageHeader('SYLLABUS-ALIGNED REVIEW','Study notes by LO','A concise learning-outcome map assembled from the supplied slide decks and instructor notes. These are interpretations and summaries, not additional official course notes.')}
    <div class="glossary-feature"><span class="symbol">✦</span><p><strong>Numbering warning:</strong> “Chapter 5” in the textbook deck is <em>Evidence and Documentation</em>. Your course “LO5” is <em>Evaluate Internal Controls</em>. We keep those separate.</p></div>
    <div class="guide-grid">${DATA.lessons.map(l=>`<article class="lo-card" id="${l.id}"><div class="lo-head"><div>${badge(l.id,'blue')}<h3>${clean(l.title)}</h3><p>${clean(l.chapters)}</p></div><button class="btn ghost sm" data-action="studyLO" data-id="${l.id}">Practice this LO →</button></div><div class="lo-body"><p class="lesson-intro">${clean(l.intro)}</p>${l.sections.map(s=>`<section><h4>${clean(s.title)}</h4><ul>${s.points.map(p=>`<li>${clean(p)}</li>`).join('')}</ul></section>`).join('')}<div class="gap-warning"><strong>Scope / source caution:</strong> ${clean(l.gap)}</div><div class="source-line">Content traced to: ${clean(l.source)}</div></div></article>`).join('')}</div>`;}

  function glossaryItems(){let a=DATA.glossary.filter(g=>relevant(g)&&matchingTopic(g));const search=state.glossSearch.trim().toLowerCase();if(search)a=a.filter(g=>(g.term+' '+g.definition).toLowerCase().includes(search));return a;}
  function glossaryRows(){let items=glossaryItems(); if(!items.length) return `<div class="empty"><h3>No matching definitions</h3><p>Try a different word, topic, or include later outcomes.</p></div>`;
    return `<div class="glossary-list">${items.map(g=>`<article class="glossary-item"><button class="glossary-trigger" data-action="glossToggle" data-id="${g.id}" aria-expanded="${state.openGlossary.has(g.id)}"><span><strong>${clean(g.term)}</strong></span><span class="right">${badge(g.lo,g.later?'orange':'blue')} <span class="drop">${state.openGlossary.has(g.id)?'−':'+'}</span></span></button>${state.openGlossary.has(g.id)?`<div class="glossary-detail">${clean(g.definition)}${source(g.source)}<div class="row wrap" style="margin-top:12px"><button class="btn ghost sm" data-action="copyGloss" data-id="${g.id}">Copy definition</button><button class="btn ghost sm" data-action="saveGloss" data-id="${g.id}">${progress.bookmarks.includes(g.id)?'★ Saved':'☆ Save to flashcards'}</button></div></div>`:''}</article>`).join('')}</div>`;
  }
  function renderGlossary(){return `${pageHeader('HIGHLIGHTED SOURCE WORDING','Glossary library','Every yellow-highlighted entry from the instructor-supplied glossary, including later-outcome definitions. Browse, search, expand, or save terms for flashcards.')}
    <div class="glossary-feature"><span class="symbol">✦</span><p><strong>Extraction checked:</strong> 63 distinct highlighted entries across 86 non-empty highlighted paragraphs. Where a definition spans highlighted paragraphs, the complete highlighted portion stays together. Some entries simply refer to another glossary term.</p></div>
    <div class="filters-panel"><div class="filters-caption">LEARNING OUTCOME</div>${topicTabs()}<div class="filters-foot"><label class="toggle"><input type="checkbox" data-action="includeLater" ${state.includeLater?'checked':''}> Include later-outcome entries (all 63)</label><span id="glossCount">${glossaryItems().length} entries</span></div></div>
    <div class="toolbar"><input class="search" type="search" id="glossSearch" placeholder="Search term or definition…" value="${clean(state.glossSearch)}" aria-label="Search glossary terms"><button class="btn ghost sm" data-action="glossExpandAll">Expand / collapse all</button></div>
    <div id="glossRows">${glossaryRows()}</div>
    <div class="note-call"><strong>Sharing note:</strong> This glossary preserves excerpts from the course materials you supplied. If you publish the repository publicly, check that you are permitted to redistribute those excerpts to classmates.</div>`;}

  function finishQuiz(){
    const z=state.quiz;if(!z||z.index!==z.list.length-1||typeof z.answers[z.index]!=='number')return;
    const result={list:z.list,answers:{...z.answers},mode:z.mode};
    const correct=z.list.filter((q,i)=>z.answers[i]===q.playCorrect).length;
    progress.history.push({total:z.list.length,correct,date:new Date().toISOString()});
    if(progress.history.length>100)progress.history=progress.history.slice(-100);
    persist();state.quiz=null;state.quizResults=result;render();window.scrollTo({top:0,behavior:'smooth'});
  }
  function startQuiz(forcedList=null){const available=forcedList || availableQuestions();const take=state.quizCount===0?available.length:Math.min(state.quizCount,available.length);const selected=forcedList?available:shuffle(available).slice(0,take);
    const list=selected.map(q=>{const order=shuffle([0,1,2,3]);return {...q,playChoices:order.map(i=>q.choices[i]),playCorrect:order.indexOf(q.correct)};});
    if(!list.length){toast('No questions in this topic.');return;}state.quiz={list,index:0,answers:{},mode:forcedList?'practice':state.quizMode};state.quizResults=null;render();window.scrollTo({top:0,behavior:'smooth'});
  }
  function handleAction(action,el){const id=el.dataset.id;
    switch(action){
      case 'nav':go(id);break;
      case 'topic':state.topic=id;rebuildCards();if(state.view==='quiz'&&state.quizCount>availableQuestions().length&&state.quizCount!==0)state.quizCount=0;render();break;
      case 'includeLater':state.includeLater=el.checked;rebuildCards();render();break;
      case 'cardFilter':state.cardFilter=el.value;rebuildCards();render();break;
      case 'resetCards':state.topic='ALL';state.includeLater=false;state.cardFilter='all';rebuildCards();render();break;
      case 'flip':state.cardFlipped=!state.cardFlipped;el.classList.toggle('is-flipped',state.cardFlipped);el.setAttribute('aria-pressed',String(state.cardFlipped));break;
      case 'cardNext':if(state.cardIndex<state.cardOrder.length-1){state.cardIndex++;state.cardFlipped=false;render();}break;
      case 'cardPrev':if(state.cardIndex>0){state.cardIndex--;state.cardFlipped=false;render();}break;
      case 'shuffleCards':rebuildCards(true);render();toast('Deck shuffled');break;
      case 'bookmark':{let c=currentCard();if(!c)return;const i=progress.bookmarks.indexOf(c.id);if(i<0)progress.bookmarks.push(c.id);else progress.bookmarks.splice(i,1);persist();render();break;}
      case 'rate':{let c=currentCard();if(!c)return;progress.ratings[c.id]=el.dataset.rating;persist();if(state.cardIndex<state.cardOrder.length-1){state.cardIndex++;state.cardFlipped=false;}render();break;}
      case 'quizCount':state.quizCount=Number(id);render();break;
      case 'quizMode':state.quizMode=id;render();break;
      case 'startQuiz':startQuiz();break;
      case 'quizAnswer':{const z=state.quiz;if(!z||typeof z.answers[z.index]==='number')return;z.answers[z.index]=Number(id);render();break;}
      case 'quizNext':{const z=state.quiz;if(!z||typeof z.answers[z.index]!=='number')return;if(z.index===z.list.length-1)finishQuiz();else{z.index++;render();}break;}
      case 'quitQuiz':$('#modalRoot').innerHTML=`<div class="modal-mask"><div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><h3 id="modalTitle">Leave this quiz?</h3><p>This unfinished session won’t affect your saved quiz scores.</p><div class="modal-acts"><button class="btn ghost" data-action="dismissModal">Keep studying</button><button class="btn danger" data-action="confirmQuit">Leave quiz</button></div></div></div>`;break;
      case 'confirmQuit':state.quiz=null;state.quizResults=null;$('#modalRoot').innerHTML='';render();break;
      case 'dismissModal':$('#modalRoot').innerHTML='';break;
      case 'quizRestart':state.quiz=null;state.quizResults=null;render();break;
      case 'quizMistakes':{let r=state.quizResults;const missed=r.list.filter((q,i)=>r.answers[i]!==q.playCorrect).map(q=>{const obj={...q};delete obj.playChoices;delete obj.playCorrect;return obj;});startQuiz(missed);break;}
      case 'caseToggle':if(state.casesOpen.has(id))state.casesOpen.delete(id);else state.casesOpen.add(id);render();break;
      case 'studyLO':state.topic=id;state.quizCount=10;state.quizResults=null;state.quiz=null;go('quiz');break;
      case 'glossToggle':if(state.openGlossary.has(id))state.openGlossary.delete(id);else state.openGlossary.add(id);render();break;
      case 'glossExpandAll':{const all=glossaryItems();const shouldExpand=all.some(g=>!state.openGlossary.has(g.id));if(shouldExpand)all.forEach(g=>state.openGlossary.add(g.id));else all.forEach(g=>state.openGlossary.delete(g.id));render();break;}
      case 'saveGloss':{const idx=progress.bookmarks.indexOf(id);if(idx<0)progress.bookmarks.push(id);else progress.bookmarks.splice(idx,1);persist();render();toast(idx<0?'Term saved':'Term unsaved');break;}
      case 'copyGloss':{const item=DATA.glossary.find(x=>x.id===id);if(!item)return;const full=item.term+' — '+item.definition;if(navigator.clipboard && navigator.clipboard.writeText){navigator.clipboard.writeText(full).then(()=>toast('Definition copied')).catch(()=>toast('Copy is unavailable here'));}else{toast('Copy works on HTTPS / localhost browsers');}break;}
    }
  }
  document.addEventListener('click',(ev)=>{const target=ev.target.closest('[data-action]');if(!target)return;const action=target.dataset.action;handleAction(action,target);});
  document.addEventListener('input',(ev)=>{if(ev.target.id==='glossSearch'){
    state.glossSearch=ev.target.value;
    const node=$('#glossRows');if(node)node.innerHTML=glossaryRows();
    const count=$('#glossCount');if(count)count.textContent=glossaryItems().length+' entries';
  }});
  document.addEventListener('keydown',(ev)=>{
    if(state.view!=='cards'||!currentCard())return;
    const tag=(ev.target.tagName||'').toLowerCase();if(['input','select','textarea','button'].includes(tag)||ev.ctrlKey||ev.metaKey||ev.altKey)return;
    if(ev.code==='Space'){ev.preventDefault();const card=$('#flashcard');if(card)handleAction('flip',card);}
    if(ev.key==='ArrowRight'){ev.preventDefault();handleAction('cardNext',{});}
    if(ev.key==='ArrowLeft'){ev.preventDefault();handleAction('cardPrev',{});}
  });
  $('#menuButton').addEventListener('click',()=>{const aside=$('#sidebar');const open=!aside.classList.contains('open');aside.classList.toggle('open',open);$('#menuButton').setAttribute('aria-expanded',String(open));});
  window.addEventListener('hashchange',setViewFromHash);
  setViewFromHash();
})();
