
var CATS = [
  {id:'accounting',label:'Accounting Fees',code:'4043',pu:0},
  {id:'admin',label:'Administration Costs',code:'4016',pu:0},
  {id:'advertising',label:'Advertising & Marketing',code:'4016',pu:0},
  {id:'baddebts',label:'Bad Debts',code:'4045',pu:0},
  {id:'bank',label:'Bank Charges',code:'4016',pu:20},
  {id:'business',label:'Business Expenses',code:'4016',pu:0},
  {id:'cellphone',label:'Cellphone / Airtime / Data',code:'4016',pu:20},
  {id:'commission',label:'Commission Paid',code:'4016',pu:0},
  {id:'consulting',label:'Consulting Fees',code:'4016',pu:0},
  {id:'gifts',label:'Customer Gifts',code:'4016',pu:0},
  {id:'depreciation',label:'Depreciation',code:'4028',pu:0},
  {id:'entertainment',label:'Entertainment',code:'4016',pu:20},
  {id:'homeinsurance',label:'Home Insurance',code:'4028',pu:50},
  {id:'internet',label:'Internet / ISP Fees',code:'4016',pu:20},
  {id:'levies',label:'Levies',code:'4028',pu:50},
  {id:'repairs',label:'Repairs & Maintenance',code:'4028',pu:50},
  {id:'rental',label:'Rental / Bond Interest',code:'4028',pu:50},
  {id:'salaries',label:'Salaries & Wages',code:'4016',pu:0},
  {id:'security',label:'Security Fees',code:'4028',pu:50},
  {id:'stationery',label:'Stationery & Furniture',code:'4016',pu:0},
  {id:'subscriptions',label:'Subscriptions / Royalties / Licences',code:'4016',pu:0},
  {id:'utilities',label:'Utilities (Electricity / Water / Rates)',code:'4028',pu:50},
  {id:'vehicle',label:'Vehicle Expenses (Fuel/Maint/Finance)',code:'4015',pu:0},
  {id:'travel',label:'Travel Allowance (4015)',code:'4015',pu:0},
  {id:'uncategorised',label:'Uncategorised — Review Required',code:'—',pu:0}
];

var files = [];
var txns = [];
var pu = {};
var cf = 'all';

function initApp() {
  var d = document.getElementById('f9');
  if (d) d.value = new Date().toISOString().split('T')[0];
  buildPU();
  // Event delegation for dynamically built elements
  document.addEventListener('click', function(e) {
    var t = e.target;
    // Category summary cards
    if (t.closest && t.closest('[id^="cat_"]')) {
      var el = t.closest('[id^="cat_"]');
      var id = el.id.replace('cat_','');
      setF(id, null);
      return;
    }
    // Filter tabs
    if (t.id && t.id.indexOf('ftab_') === 0) {
      var f = t.id.replace('ftab_','');
      setF(f, t);
    }
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function buildPU() {
  var g = document.getElementById('pug');
  var h = '';
  for (var i = 0; i < CATS.length; i++) {
    var c = CATS[i];
    if (c.pu > 0) {
      h += '<div class="pu-item">';
      h += '<label>' + c.label + '</label>';
      h += '<input type="number" class="pui" data-id="' + c.id + '" value="' + c.pu + '" min="0" max="100" step="5">';
      h += '<span style="font-size:.76rem;color:#6b7280;margin-left:3px;">%</span>';
      h += '</div>';
    }
  }
  g.innerHTML = h;
}

function getPU() {
  var r = {};
  for (var i = 0; i < CATS.length; i++) r[CATS[i].id] = CATS[i].pu;
  var els = document.querySelectorAll('.pui');
  for (var j = 0; j < els.length; j++) r[els[j].getAttribute('data-id')] = parseFloat(els[j].value) || 0;
  return r;
}

function gp(n) {
  for (var i = 1; i <= 4; i++) {
    document.getElementById('p'+i).className = i === n ? '' : 'hidden';
    var t = document.getElementById('s'+i+'t');
    t.className = 'step' + (i === n ? ' active' : (i < n ? ' done' : ''));
  }
  window.scrollTo(0,0);
}

function toStep2() {
  if (!document.getElementById('f1').value.trim() ||
      !document.getElementById('f2').value.trim() ||
      !document.getElementById('f3').value.trim()) {
    alert('Please fill in First Name, Surname and Tax Reference Number.');
    return;
  }
  pu = getPU();
  gp(2);
}

function addFiles(flist) {
  for (var i = 0; i < flist.length; i++) {
    var f = flist[i];
    if (f.type === 'application/pdf') {
      var found = false;
      for (var j = 0; j < files.length; j++) { if (files[j].name === f.name) { found = true; break; } }
      if (!found) files.push(f);
    }
  }
  renderFiles();
}

function renderFiles() {
  var h = '';
  for (var i = 0; i < files.length; i++) {
    h += '<div class="file-item">';
    h += '<span style="color:#B8952A;font-size:1rem;">📄</span>';
    h += '<span class="fi-name">' + files[i].name + '</span>';
    h += '<span class="fi-size">' + (files[i].size/1024/1024).toFixed(2) + ' MB</span>';
    h += '<button class="fi-rm" onclick="rmFile(' + i + ')">✕</button>';
    h += '</div>';
  }
  document.getElementById('fl').innerHTML = h;
}

function rmFile(i) { files.splice(i,1); renderFiles(); }

function toB64(file) {
  return new Promise(function(res,rej) {
    var r = new FileReader();
    r.onload = function() { res(r.result.split(',')[1]); };
    r.onerror = function() { rej(new Error('Failed to read ' + file.name)); };
    r.readAsDataURL(file);
  });
}

function showOv(t,s) {
  document.getElementById('otxt').textContent = t;
  document.getElementById('osub').textContent = s;
  document.getElementById('ov').className = 'overlay show';
}
function updOv(t,s) {
  document.getElementById('otxt').textContent = t;
  document.getElementById('osub').textContent = s;
}
function hideOv() { document.getElementById('ov').className = 'overlay'; }

function analyse() {
  if (files.length === 0) { alert('Please upload at least one bank statement PDF.'); return; }
  showOv('Reading bank statements...','Converting your PDF(s) for AI analysis.');
  Promise.all(files.map(toB64)).then(function(pdfs) {
    var ctx = document.getElementById('ctx').value.trim();
    var cn = document.getElementById('f1').value + ' ' + document.getElementById('f2').value;
    var yr = document.getElementById('f6').value;
    var sc = document.getElementById('f7').value;
    var ys = parseInt(yr) - 1;
    updOv('AI is categorising transactions...','Claude is reading every line item and mapping to the correct SARS expense category.');
    var catList = '';
    for (var i = 0; i < CATS.length; i++) {
      if (CATS[i].id !== 'uncategorised') catList += CATS[i].id + ': ' + CATS[i].label + ' (SARS ' + CATS[i].code + ')\n';
    }
    var content = [];
    for (var j = 0; j < pdfs.length; j++) {
      content.push({type:'document',source:{type:'base64',media_type:'application/pdf',data:pdfs[j]}});
    }
    content.push({type:'text',text:'You are a South African tax expert at We Do Tax Services (Pty) Ltd.\n\nClient: ' + cn + '\nTax Year: ' + yr + ' (1 March ' + ys + ' to 28 February ' + yr + ')\nIncome Source Code: ' + sc + '\n' + (ctx ? 'Consultant notes: ' + ctx : '') + '\n\nAnalyse ALL bank statement(s). Extract EVERY transaction that could be a claimable business expense under Section 11(a) of the Income Tax Act 58 of 1962.\n\nCategories:\n' + catList + '\nRULES:\n- Include ALL potential business expense debits\n- EXCLUDE: salary credits, inter-account transfers, personal purchases\n- Bank fees → bank\n- Fuel stations (Engen,Shell,BP,Sasol,Caltex) → vehicle\n- Vehicle finance (WesBank,MFC) → vehicle\n- Airtime/data (Vodacom,MTN,Cell C,Telkom,Rain) → cellphone\n- Internet (Telkom,Afrihost,Vox,MWEB) → internet\n- Subscriptions (Netflix,Spotify,Microsoft,Adobe) → subscriptions\n- Restaurants/coffee → entertainment\n- Cash Send/EFT to person name → commission, needsReview=true\n- Ambiguous → uncategorised, needsReview=true\n\nRespond ONLY with raw JSON array. No markdown. No explanation.\n\nEach object: date (DD MMM YYYY), description (clean name), rawDescription (exact from statement), bank (bank name), amount (positive number), category (id from list), confidence (high/medium/low), needsReview (boolean), suggestion (string if needsReview else empty string)'});
    // Send one PDF at a time to avoid timeout, merge results
    var allTxns = [];
    var pdfContents = content.filter(function(c){ return c.type === 'document'; });
    var textPrompt = content.filter(function(c){ return c.type === 'text'; })[0];
    
    function processNext(idx) {
      if (idx >= pdfContents.length) {
        // All done - assign to txns and render
        txns = [];
        for (var i = 0; i < allTxns.length; i++) txns.push(Object.assign({id:i}, allTxns[i]));
        hideOv();
        renderReview();
        gp(3);
        return;
      }
      updOv('Processing statement ' + (idx+1) + ' of ' + pdfContents.length + '...', 'Claude AI is reading and categorising transactions.');
      var singleContent = [pdfContents[idx], textPrompt];
      fetch('/api/analyse', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({messages:[{role:'user',content:singleContent}]})
      }).then(function(r) { return r.json(); }).then(function(data) {
        if (data.error) throw new Error(data.error.message);
        var raw = '';
        for (var k = 0; k < data.content.length; k++) raw += (data.content[k].text || '');
        var fence = String.fromCharCode(96,96,96);
        raw = raw.replace(new RegExp(fence+'json|'+fence,'gi'),'').trim();
        try {
          var parsed = JSON.parse(raw);
          for (var m = 0; m < parsed.length; m++) allTxns.push(parsed[m]);
        } catch(e) { console.error('Parse error for PDF ' + idx, e, 'Raw:', raw.substring(0,200)); }
        // Wait 4 seconds between statements to respect rate limits
        setTimeout(function() { processNext(idx + 1); }, 4000);
      }).catch(function(e) { hideOv(); alert('Error on statement ' + (idx+1) + ': ' + e.message); });
    }
    
    // handleResult no longer used - kept for safety
    function handleResult(data) {
      if (data.error) throw new Error(data.error.message);
      var raw = '';
      for (var k = 0; k < data.content.length; k++) raw += (data.content[k].text || '');
      var fence=String.fromCharCode(96,96,96);raw=raw.replace(new RegExp(fence+'json|'+fence,'gi'),'').trim();
      var parsed = JSON.parse(raw);
      txns = [];
      for (var m = 0; m < parsed.length; m++) txns.push(Object.assign({id:m}, parsed[m]));
      hideOv();
      renderReview();
      gp(3);
      gp(3);
    }

    processNext(0);
  }).catch(function(e) { hideOv(); alert('Error reading files: ' + e.message); });
}

function renderReview() {
  var cn = document.getElementById('f1').value + ' ' + document.getElementById('f2').value;
  var yr = document.getElementById('f6').value;
  var sc = document.getElementById('f7').value;
  document.getElementById('bn').textContent = cn;
  document.getElementById('bs').textContent = 'Tax Year ' + yr + ' · ' + sc;
  var rv = 0;
  for (var i = 0; i < txns.length; i++) { if (txns[i].needsReview) rv++; }
  document.getElementById('rc').textContent = rv;
  document.getElementById('ra').className = rv > 0 ? 'alert alert-warn' : 'alert alert-warn hidden';
  document.getElementById('oka').className = rv === 0 ? 'alert alert-ok' : 'alert alert-ok hidden';
  updTotal();
  buildSG();
  buildFT();
  renderRows('all');
}

function updTotal() {
  var t = 0;
  for (var i = 0; i < txns.length; i++) t += txns[i].amount || 0;
  document.getElementById('gt').textContent = 'R ' + fmt(t);
  document.getElementById('tc').textContent = txns.length + ' transactions';
}

function buildSG() {
  var bc = {};
  for (var i = 0; i < txns.length; i++) {
    var c = txns[i].category;
    if (!bc[c]) bc[c] = {t:0,n:0};
    bc[c].t += txns[i].amount || 0;
    bc[c].n++;
  }
  var tot = 0;
  for (var k in bc) tot += bc[k].t;
  var keys = Object.keys(bc).sort(function(a,b){ return bc[b].t - bc[a].t; });
  var h = '';
  for (var j = 0; j < keys.length; j++) {
    var id = keys[j];
    var cat = getCat(id);
    var pct = tot > 0 ? (bc[id].t / tot * 100).toFixed(1) : 0;
    h += '<div class="sc" id="cat_' + id + '">';
    h += '<div class="cn">' + (cat ? cat.label : id) + '</div>';
    h += '<div class="ca">R ' + fmt(bc[id].t) + '</div>';
    h += '<div class="cc">' + bc[id].n + ' transaction' + (bc[id].n !== 1 ? 's' : '') + '</div>';
    h += '<div class="bar"><div class="barf" style="width:' + pct + '%"></div></div>';
    h += '</div>';
  }
  document.getElementById('sg').innerHTML = h;
}

function buildFT() {
  var cats = {};
  var rv = 0;
  for (var i = 0; i < txns.length; i++) {
    cats[txns[i].category] = (cats[txns[i].category] || 0) + 1;
    if (txns[i].needsReview) rv++;
  }
  var h = '<button class="ftab on" id="ftab_all">All (' + txns.length + ')</button>';
  if (rv > 0) h += '<button class="ftab rev" id="ftab_review">⚠ Review (' + rv + ')</button>';
  var ks = Object.keys(cats).sort();
  for (var j = 0; j < ks.length; j++) {
    var cat = getCat(ks[j]);
    h += '<button class="ftab" id="ftab_' + ks[j] + '">' + (cat ? cat.label : ks[j]) + ' (' + cats[ks[j]] + ')</button>';
  }
  document.getElementById('ft').innerHTML = h;
}

function renderRows(f) {
  cf = f;
  var rows = txns;
  if (f === 'review') rows = txns.filter(function(t){ return t.needsReview; });
  else if (f !== 'all') rows = txns.filter(function(t){ return t.category === f; });
  var opts = '';
  for (var i = 0; i < CATS.length; i++) opts += '<option value="' + CATS[i].id + '">' + CATS[i].label + '</option>';
  var h = '';
  for (var j = 0; j < rows.length; j++) {
    var t = rows[j];
    var fl = t.needsReview ? ' flagged' : '';
    h += '<tr class="' + fl + '" id="row' + t.id + '">';
    h += '<td style="color:#6b7280;font-size:.75rem;white-space:nowrap;">' + (t.date||'—') + '</td>';
    h += '<td class="tdesc"><span>' + (t.description||'—') + '</span><small>' + (t.rawDescription||'') + '</small>' + (t.needsReview && t.suggestion ? '<span class="fn">' + t.suggestion + '</span>' : '') + '</td>';
    h += '<td style="color:#6b7280;font-size:.74rem;">' + (t.bank||'—') + '</td>';
    h += '<td><select class="csel' + (t.needsReview?' fl':'') + '" onchange="updCat(' + t.id + ',this)">' + opts.replace('value="' + t.category + '"','value="' + t.category + '" selected') + '</select></td>';
    h += '<td><span class="badge ' + (t.needsReview?'badge-r':'badge-ok') + '">' + (t.needsReview?'⚠ Review':'✓ OK') + '</span></td>';
    h += '<td class="tamt">R ' + fmt(t.amount) + '</td>';
    h += '</tr>';
  }
  document.getElementById('tb').innerHTML = h;
}

function updCat(id, sel) {
  for (var i = 0; i < txns.length; i++) {
    if (txns[i].id === id) {
      txns[i].category = sel.value;
      txns[i].needsReview = false;
      break;
    }
  }
  sel.className = 'csel';
  var row = document.getElementById('row' + id);
  if (row) {
    row.className = '';
    var b = row.querySelector('.badge');
    if (b) { b.className = 'badge badge-ok'; b.textContent = '✓ OK'; }
  }
  updTotal(); buildSG(); buildFT();
}

function setF(f, btn) {
  var tabs = document.querySelectorAll('.ftab');
  for (var i = 0; i < tabs.length; i++) tabs[i].className = 'ftab' + (tabs[i].className.indexOf('rev') > -1 ? ' rev' : '');
  if (btn) btn.className += ' on';
  renderRows(f);
}

function toExport() {
  pu = getPU();
  var cn = document.getElementById('f1').value + ' ' + document.getElementById('f2').value;
  var yr = document.getElementById('f6').value;
  var sc = document.getElementById('f7').value;
  document.getElementById('ecn').textContent = cn;
  document.getElementById('eti').textContent = 'Tax Year ' + yr + ' · ' + sc;
  var bc = {};
  for (var i = 0; i < txns.length; i++) {
    var c = txns[i].category;
    bc[c] = (bc[c] || 0) + (txns[i].amount || 0);
  }
  var keys = Object.keys(bc).sort(function(a,b){ return bc[b]-bc[a]; });
  var gt=0, pt=0, nt=0;
  var h = '';
  for (var j = 0; j < keys.length; j++) {
    var id = keys[j];
    var gross = bc[id];
    var cat = getCat(id);
    var pp = pu[id] || 0;
    var pa = gross * pp / 100;
    var net = gross - pa;
    gt += gross; pt += pa; nt += net;
    h += '<tr>';
    h += '<td style="padding:8px 12px;">' + (cat ? cat.label : id) + '</td>';
    h += '<td style="padding:8px 12px;color:#6b7280;">' + (cat ? cat.code : '—') + '</td>';
    h += '<td style="text-align:right;padding:8px 12px;">R ' + fmt(gross) + '</td>';
    h += '<td style="text-align:right;padding:8px 12px;color:#6b7280;">' + (pp > 0 ? pp + '%' : '—') + '</td>';
    h += '<td style="text-align:right;padding:8px 12px;color:#f97316;">' + (pp > 0 ? '(R ' + fmt(pa) + ')' : '—') + '</td>';
    h += '<td style="text-align:right;padding:8px 12px;font-weight:700;color:#2D3561;">R ' + fmt(net) + '</td>';
    h += '</tr>';
  }
  document.getElementById('esb').innerHTML = h;
  document.getElementById('efg').textContent = 'R ' + fmt(gt);
  document.getElementById('efp').textContent = '(R ' + fmt(pt) + ')';
  document.getElementById('efn').textContent = 'R ' + fmt(nt);
  document.getElementById('ent').textContent = 'R ' + fmt(nt);
  gp(4);
}

function dlExcel() {
  var wb = XLSX.utils.book_new();
  var cn = document.getElementById('f1').value + ' ' + document.getElementById('f2').value;
  var txr = document.getElementById('f3').value;
  var yr = document.getElementById('f6').value;
  var sc = document.getElementById('f7').value;
  var emp = document.getElementById('f5').value;
  var prep = document.getElementById('f8').value || 'We Do Tax Services';
  var dt = document.getElementById('f9').value;
  var ys = parseInt(yr) - 1;
  var bc = {};
  for (var i = 0; i < txns.length; i++) {
    var c = txns[i].category;
    if (!bc[c]) bc[c] = [];
    bc[c].push(txns[i]);
  }
  var sr = [
    ['WE DO TAX SERVICES (PTY) LTD','','','','',''],
    ['Professional Tax Practitioners','','','','',''],
    ['mel@wdtax.co.za · jesse@wdtax.co.za · 082 800 3040','','','','',''],
    [''],
    ['CLIENT EXPENSE SCHEDULE — SECTION 11(a) INCOME TAX ACT 58 OF 1962','','','','',''],
    [''],
    ['CLIENT NAME:',cn,'','TAX YEAR:',yr + ' (1 Mar ' + ys + ' – 28 Feb ' + yr + ')',''],
    ['TAX REFERENCE:',txr,'','SOURCE CODE:',sc,''],
    ['EMPLOYER:',emp,'','DATE PREPARED:',dt,''],
    ['PREPARED BY:',prep,'','','',''],
    [''],
    ['DESCRIPTION OF EXPENSE','SARS CODE','GROSS AMOUNT (R)','PERSONAL USE %','DEDUCTION (R)','NET AMOUNT (R)']
  ];
  var gt=0,pt=0,nt=0;
  for (var j = 0; j < CATS.length; j++) {
    var cat = CATS[j];
    if (cat.id === 'uncategorised') continue;
    var items = bc[cat.id] || [];
    if (!items.length) continue;
    var gross = 0;
    for (var k = 0; k < items.length; k++) gross += items[k].amount;
    var pp = pu[cat.id] || 0;
    var pa = gross * pp / 100;
    var net = gross - pa;
    gt+=gross; pt+=pa; nt+=net;
    sr.push([cat.label, cat.code, gross, pp > 0 ? pp/100 : 0, pp > 0 ? -pa : 0, net]);
  }
  sr.push(['']);
  sr.push(['TOTAL EXPENSES CLAIMED','',gt,'',-pt,nt]);
  sr.push(['']);
  sr.push(['DISCLAIMER']);
  sr.push(['The information in this schedule is based solely on documentation provided by the client. We Do Tax Services (Pty) Ltd has exercised reasonable care but cannot be held liable for errors arising from incorrect or incomplete information.']);
  var ws = XLSX.utils.aoa_to_sheet(sr);
  ws['!cols'] = [{wch:40},{wch:12},{wch:16},{wch:14},{wch:18},{wch:18}];
  XLSX.utils.book_append_sheet(wb, ws, 'Expense Summary');
  for (var m = 0; m < CATS.length; m++) {
    var cat2 = CATS[m];
    if (cat2.id === 'uncategorised') continue;
    var its = bc[cat2.id] || [];
    if (!its.length) continue;
    var g2=0;
    for (var n = 0; n < its.length; n++) g2 += its[n].amount;
    var p2 = pu[cat2.id] || 0;
    var pa2 = g2 * p2 / 100;
    var rows2 = [
      ['WE DO TAX SERVICES (PTY) LTD'],
      [cat2.label.toUpperCase() + ' — TAX YEAR ' + yr],
      [''],
      ['CLIENT:',cn,'','TAX REFERENCE:',txr],
      ['TAX YEAR:',yr + ' (1 Mar ' + ys + ' – 28 Feb ' + yr + ')','','SARS CODE:',cat2.code],
      [''],
      ['DATE','DESCRIPTION','BANK','AMOUNT (R)']
    ];
    for (var q = 0; q < its.length; q++) rows2.push([its[q].date, its[q].description, its[q].bank, its[q].amount]);
    rows2.push(['']);
    rows2.push(['TOTAL','','',g2]);
    rows2.push(['Less Personal Use (' + p2 + '%)','','',(p2 > 0 ? -pa2 : 0)]);
    rows2.push(['SUM TOTAL (Net Claimable)','','',g2-pa2]);
    var ws2 = XLSX.utils.aoa_to_sheet(rows2);
    ws2['!cols'] = [{wch:14},{wch:40},{wch:14},{wch:14}];
    XLSX.utils.book_append_sheet(wb, ws2, cat2.label.substring(0,31).replace(/[\\/*?:\[\]]/g,''));
  }
  var unc = bc['uncategorised'] || [];
  if (unc.length) {
    var ur = [['UNCATEGORISED — REVIEW REQUIRED'],[''],['DATE','DESCRIPTION','ORIGINAL TEXT','BANK','AI SUGGESTION','AMOUNT (R)']];
    for (var u = 0; u < unc.length; u++) ur.push([unc[u].date, unc[u].description, unc[u].rawDescription, unc[u].bank, unc[u].suggestion||'', unc[u].amount]);
    var wsu = XLSX.utils.aoa_to_sheet(ur);
    wsu['!cols'] = [{wch:14},{wch:30},{wch:36},{wch:14},{wch:38},{wch:14}];
    XLSX.utils.book_append_sheet(wb, wsu, 'Uncategorised - Review');
  }
  XLSX.writeFile(wb, 'WDT_Expense_Schedule_' + yr + '_' + cn.replace(/\s+/g,'_') + '.xlsx');
}

function getCat(id) {
  for (var i = 0; i < CATS.length; i++) { if (CATS[i].id === id) return CATS[i]; }
  return null;
}

function fmt(n) {
  return (n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
}
