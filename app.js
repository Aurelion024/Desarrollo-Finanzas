/* FinanceTracker 1.0 — 100% frontend, sin API ni servidor. */
(() => {
  'use strict';
  const STORAGE_KEY = 'financetracker-v1';
  const TYPES = ['gasto', 'ingreso'];
  const CATEGORIES = ['Alimentación', 'Vivienda', 'Transporte', 'Servicios', 'Salud', 'Entretenimiento', 'Compras', 'Educación', 'Viajes', 'Transferencias', 'Sueldo', 'Otros'];
  const COLORS = ['#59cfae','#8674d5','#f4b393','#77a8e8','#e9c266','#ec8c99','#87bec3','#b7a2ed','#d6b792','#a9b8c8','#8498e1','#ced5da'];
  const SYMBOLS = {'Alimentación':'◈','Vivienda':'⌂','Transporte':'↗','Servicios':'⚡','Salud':'✚','Entretenimiento':'♫','Compras':'▤','Educación':'✎','Viajes':'✈','Transferencias':'⇆','Sueldo':'↗','Otros':'•'};
  const DEFAULT_PROJECTION = { income:1250000, expenses:820000, start:300000, goal:4000000, growthIncome:0, growthExpenses:0 };
  const fmt = value => new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Math.round(value || 0));
  const nf = value => new Intl.NumberFormat('es-CL',{maximumFractionDigits:0}).format(Math.round(value || 0));
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `t${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const periodOf = iso => String(iso).slice(0,7);
  const monthLabel = (period, opt={}) => new Date(`${period}-02T12:00:00`).toLocaleDateString('es-CL',{month:opt.short?'short':'long',year:opt.year?'numeric':undefined});
  const dateLabel = iso => new Date(`${iso}T12:00:00`).toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'});
  const currentPeriod = () => { const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
  const currentISO = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const monthShift = (period,n) => {const d=new Date(`${period}-02T12:00:00`);d.setMonth(d.getMonth()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;};
  const ownCost = item => item.type==='gasto' ? Math.round(item.amount*(item.share ?? 100)/100) : 0;
  const owedAmount = item => item.type==='gasto' ? item.amount-ownCost(item) : 0;
  const normal = value => String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function categoryFor(description, type='gasto') {
    const txt=normal(description);
    const ownRule=(state.rules||[]).find(rule=>txt.includes(normal(rule.keyword)));
    if(ownRule) return ownRule.category;
    if(type==='ingreso') return /sueldo|remuneracion|nomina|salario|liquidacion/.test(txt)?'Sueldo':'Otros';
    const rules=[
      [/lider|jumbo|unimarc|tottus|santa isabel|acuenta|mayorista|supermercado|almacen|panaderia|restaurant|restaurante|rappi|pedidos ya|mercado|cafeteria|starbucks|comida/,'Alimentación'],
      [/arriendo|hipotec|dividendo|gasto comun|condominio/,'Vivienda'],
      [/uber|cabify|didi|metro|bip|micro|transantiago|combustible|copec|shell|petrobras|autopista|peaje|estacionamiento|transporte/,'Transporte'],
      [/enel|aguas andinas|essbio|gasco|metrogas|entel|movistar|wom|claro|vtr|internet|electricidad|agua potable|telefono/,'Servicios'],
      [/farmacia|salcobrand|cruz verde|ahumada|clinica|hospital|isapre|fonasa|medico|laboratorio|consulta/,'Salud'],
      [/netflix|spotify|disney|youtube|steam|cine|cinemark|cineplanet|prime video|hbo|playstation|gaming/,'Entretenimiento'],
      [/falabella|ripley|paris|mercado libre|mercadolibre|zara|h&m|shein|amazon|retail|compra online/,'Compras'],
      [/universidad|duoc|curso|udemy|platzi|estudio|colegio|matricula/,'Educación'],
      [/hotel|booking|airbnb|pasaje|vuelo|latam|sky airline|viaje/,'Viajes'],
      [/transferencia|transfer|traspaso|giro cajero/,'Transferencias']
    ];
    return rules.find(([rx])=>rx.test(txt))?.[1] || 'Otros';
  }
  function demoData() {
    const transactions=[]; const current=currentPeriod();
    const add=(m,d,desc,amount,type='gasto',category=null,share=100,settled=false)=>{
      const per=monthShift(current,m);const day=String(Math.min(d,28)).padStart(2,'0');
      transactions.push({id:uuid(),date:`${per}-${day}`,description:desc,amount,type,category:category||categoryFor(desc,type),source:'Datos de demostración',share,settled});
    };
    for(let m=-5;m<=0;m++){
      add(m,1,'Sueldo empresa demo',1250000+Math.max(0,m+5)*18000,'ingreso','Sueldo');
      add(m,2,'Arriendo mensual',320000,'gasto','Vivienda');
      add(m,3,'Líder supermercado',98000+(m+5)*4500);
      add(m,5,'Metro y transporte',28000+(m+5)*1500);
      add(m,9,'Entel plan móvil',18500);
      add(m,11,'Netflix suscripción',11990);
      add(m,13,'Cruz Verde farmacia',18500+(m+5)*800);
      add(m,16,'Copec combustible',40000);
      add(m,19,'Jumbo supermercado',56000+(m+5)*2800);
      add(m,22,'Cena compartida',46000+(m+5)*2500,'gasto','Alimentación',50,m<0);
      add(m,24,'Compra online',32000+(m+5)*1300,'gasto','Compras');
      if(m===-2||m===0)add(m,26,'Freelance diseño demo',65000,'ingreso','Otros');
    }
    return {transactions,rules:[],projection:{...DEFAULT_PROJECTION},demo:true};
  }
  function readSaved(){try {const data=JSON.parse(localStorage.getItem(STORAGE_KEY));if(data&&Array.isArray(data.transactions)&&Array.isArray(data.rules))return {...data,projection:{...DEFAULT_PROJECTION,...data.projection}};}catch(e){console.warn('Datos locales ilegibles',e);}return demoData();}
  let state={rules:[]};
  state=readSaved();
  let selectedMonth=currentPeriod();
  let editingId=null, manualCategory=false, toastTimer=null;
  let importRows=[],importHeaders=[],importPreview=[],fileName='';
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){toast('No se pudo guardar. Descarga un respaldo y libera espacio del navegador.',true);}}
  function toast(text,isError=false){const node=$('#toast');node.textContent=text;node.classList.toggle('error',isError);node.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('visible'),4000);}
  function demoDismissed(){try{return sessionStorage.getItem('ft-hide-demo')==='yes';}catch(e){return false;}}
  function dismissDemo(){try{sessionStorage.setItem('ft-hide-demo','yes');}catch(e){/* storage can be restricted */}}
  function showDemoAgain(){try{sessionStorage.removeItem('ft-hide-demo');}catch(e){/* storage can be restricted */}}
  function bindSelect(selector,choices,withAll=false){const node=$(selector);if(!node)return;node.innerHTML=(withAll?'<option value="all">Todas las categorías</option>':'')+choices.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('');}
  function chooseMonthOptions(){const months=[...new Set(state.transactions.map(x=>periodOf(x.date)).concat([currentPeriod(),selectedMonth]))].filter(x=>/^\d{4}-\d{2}$/.test(x)).sort().reverse();const current=$('#dashboardMonth');const old=selectedMonth||current.value;current.innerHTML=months.map(x=>`<option value="${x}">${escapeHTML(monthLabel(x,{year:true}))}</option>`).join('');current.value=months.includes(old)?old:months[0];selectedMonth=current.value;const f=$('#filterMonth'),prev=f.value||'all';f.innerHTML='<option value="all">Todos los meses</option>'+months.map(x=>`<option value="${x}">${escapeHTML(monthLabel(x,{year:true}))}</option>`).join('');f.value=months.includes(prev)||prev==='all'?prev:'all';}
  function monthItems(period){return state.transactions.filter(t=>periodOf(t.date)===period);}
  function monthMetrics(period){const tx=monthItems(period);const income=tx.filter(t=>t.type==='ingreso').reduce((s,t)=>s+t.amount,0);const expenses=tx.reduce((s,t)=>s+ownCost(t),0);return {income,expenses,savings:income-expenses,count:tx.length};}
  function refresh(){chooseMonthOptions();$('#demoBanner').classList.toggle('hidden',!state.demo||demoDismissed());drawDashboard();drawTransactions();drawProjection();drawRules();}
  function updateView(view){$$('.view').forEach(el=>el.classList.toggle('active',el.id===`view-${view}`));$$('.nav-link').forEach(el=>el.classList.toggle('active',el.dataset.view===view));$('#breadcrumb').textContent=({dashboard:'Resumen',transactions:'Movimientos',import:'Importar cartola',projection:'Proyección de ahorro',settings:'Configuración'})[view];$('#sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'instant'});if(view==='projection')drawProjection();}
  function drawDashboard(){
    const m=monthMetrics(selectedMonth),pending=state.transactions.reduce((s,t)=>s+(!t.settled?owedAmount(t):0),0);
    $('#statIncome').textContent=fmt(m.income);$('#statExpenses').textContent=fmt(m.expenses);$('#statSavings').textContent=fmt(m.savings);$('#statPending').textContent=fmt(pending);
    $('#statSavings').classList.toggle('negative',m.savings<0);
    const rate=m.income>0?m.savings/m.income*100:0;
    $('#statSavingsNote').textContent=m.income?`${rate.toFixed(1).replace('.',',')}% de tus ingresos`:'Registra ingresos para calcular';
    $('#statPendingNote').textContent='De todos los meses · sin liquidar';
    drawCashflow();drawDonut();drawInsights(m,pending);drawRecent();
  }
  function drawCashflow(){
    const periods=Array.from({length:6},(_,i)=>monthShift(selectedMonth,i-5));const data=periods.map(p=>({...monthMetrics(p),period:p}));const max=Math.max(1,...data.flatMap(d=>[d.income,d.expenses]));
    if(data.every(d=>!d.income&&!d.expenses)){$('#cashflowChart').innerHTML='<div class="empty-graph">Registra movimientos para ver tu flujo de dinero.</div>';return;}
    const ceiling=Math.ceil(max/100000)*100000;
    const ticks=Array.from({length:5},(_,i)=>`<span>${(ceiling*(4-i)/4/1000000).toFixed(1)}M</span>`).join('');
    const groups=data.map(d=>`<div class="bar-group"><div class="bar-col income" style="height:${Math.max(1,d.income/ceiling*100)}%" title="${escapeHTML(monthLabel(d.period))}: ingresos ${escapeHTML(fmt(d.income))}"></div><div class="bar-col expense" style="height:${Math.max(1,d.expenses/ceiling*100)}%" title="${escapeHTML(monthLabel(d.period))}: gastos ${escapeHTML(fmt(d.expenses))}"></div><span class="bar-label">${escapeHTML(monthLabel(d.period,{short:true}))}</span></div>`).join('');
    $('#cashflowChart').innerHTML=`<div class="bar-grid"><div class="bar-y">${ticks}</div>${groups}</div>`;
  }
  function drawDonut(){
    const by={};monthItems(selectedMonth).forEach(t=>{if(t.type==='gasto')by[t.category]=(by[t.category]||0)+ownCost(t);});
    const sorted=Object.entries(by).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);const total=sorted.reduce((s,v)=>s+v[1],0);
    if(!total){$('#donutChart').innerHTML='<div class="empty-graph">Sin gastos este mes</div>';$('#donutLegend').innerHTML='';return;}
    const display=sorted.slice(0,5);if(sorted.length>5)display.push(['Otros gastos',sorted.slice(5).reduce((s,t)=>s+t[1],0)]);
    let cum=0;const segments=display.map(([name,value],i)=>{const start=cum;cum+=value/total*100;return `${COLORS[i]} ${start}% ${cum}%`;}).join(',');
    $('#donutChart').innerHTML=`<div class="donut-ring" style="background:conic-gradient(${segments})" title="Gastos por categoría"></div><div class="donut-center"><small>Total gastos</small><strong>${fmt(total)}</strong></div>`;
    $('#donutLegend').innerHTML=display.map(([name,value],i)=>`<div class="donut-line" title="${escapeHTML(name)}: ${escapeHTML(fmt(value))}"><span class="dot" style="background:${COLORS[i]}"></span><span class="name">${escapeHTML(name)}</span><strong>${(value/total*100).toFixed(0)}%</strong></div>`).join('');
  }
  function drawInsights(m,pending){
    const ideas=[];
    if(!m.count)ideas.push(['✎','Empieza registrando tu dinero','Agrega tu primer movimiento o importa una cartola para ver sugerencias.','']);
    else{
      const rate=m.income?m.savings/m.income*100:0;
      if(m.income)ideas.push([rate>=20?'✦':'↗',rate>=20?'Buen ritmo de ahorro':'Tu tasa de ahorro',rate>=20?`Este mes te queda un ${rate.toFixed(1).replace('.',',')}% de tus ingresos. Sigue así.`:`El ${rate.toFixed(1).replace('.',',')}% de tus ingresos queda disponible para ahorro.`,rate<0?'warning':'']);
      const by={};monthItems(selectedMonth).filter(t=>t.type==='gasto').forEach(t=>by[t.category]=(by[t.category]||0)+ownCost(t));const top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0];
      if(top)ideas.push(['◉',`Tu mayor categoría: ${top[0]}`,`Destinaste ${fmt(top[1])} a esta categoría durante ${monthLabel(selectedMonth)}.`,'purple']);
      const prev=monthMetrics(monthShift(selectedMonth,-1));if(prev.expenses&&m.expenses){const change=(m.expenses-prev.expenses)/prev.expenses*100;ideas.push([change>0?'↗':'↘',change>0?'Tus gastos aumentaron':'Tus gastos bajaron',`${Math.abs(change).toFixed(1).replace('.',',')}% ${change>0?'más':'menos'} que el mes anterior, comparando solo tu parte de los gastos.`,change>0?'warning':'']);}
    }
    if(pending>0)ideas.push(['⇆','Hay gastos por recuperar',`Tienes ${fmt(pending)} pendiente de devolución por compras compartidas.`, 'warning']);
    $('#insightList').innerHTML=ideas.slice(0,4).map(([icon,title,msg,kind])=>`<div class="insight-item ${kind}"><span class="idea-icon">${icon}</span><div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(msg)}</p></div></div>`).join('');
  }
  function drawRecent(){const rec=[...monthItems(selectedMonth)].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);$('#recentTransactions').innerHTML=rec.length?rec.map(t=>`<div class="recent-row"><span class="category-symbol">${SYMBOLS[t.category]||'•'}</span><div class="recent-info"><strong>${escapeHTML(t.description)}</strong><small>${escapeHTML(t.category)} · ${escapeHTML(dateLabel(t.date))}${t.type==='gasto'&&t.share<100?' · compartido':''}</small></div><strong class="recent-amount ${t.type==='gasto'?'negative':'positive'}">${t.type==='gasto'?'-':'+'}${fmt(t.type==='gasto'?ownCost(t):t.amount)}</strong></div>`).join(''):'<div class="empty-state">Sin movimientos para este mes.</div>';}
  function drawTransactions(){
    const query=normal($('#searchTransactions').value);const type=$('#filterType').value;const month=$('#filterMonth').value;const cat=$('#filterCategory').value;
    const rows=[...state.transactions].filter(t=>(!query||normal(`${t.description} ${t.source}`).includes(query))&&(type==='all'||t.type===type)&&(month==='all'||periodOf(t.date)===month)&&(cat==='all'||t.category===cat)).sort((a,b)=>b.date.localeCompare(a.date));
    $('#transactionCount').textContent=`${rows.length} movimiento${rows.length!==1?'s':''}`;
    $('#transactionRows').innerHTML=rows.map(t=>{
      const isSplit=t.type==='gasto'&&t.share<100;
      const status=t.type==='ingreso'?'<span class="tag">Ingreso</span>':isSplit?`<span class="tag ${t.settled?'settled':'pending'}">${t.settled?'Devuelto':'Por cobrar'}</span>`:'<span class="tag">Personal</span>';
      return `<tr><td><div class="movement-name"><span class="category-symbol">${SYMBOLS[t.category]||'•'}</span><span><strong>${escapeHTML(t.description)}</strong><small>${escapeHTML(t.source||'Manual')}</small></span></div></td><td>${escapeHTML(dateLabel(t.date))}</td><td><span class="tag">${escapeHTML(t.category)}</span></td><td class="${t.type==='ingreso'?'positive':'negative'}">${t.type==='ingreso'?'+':'-'}${fmt(t.amount)}</td><td><strong>${t.type==='ingreso'?'—':fmt(ownCost(t))}</strong>${isSplit?` <span class="tag split">${t.share}%</span>`:''}</td><td>${status}</td><td class="action-cell"><button class="row-action" data-edit="${escapeHTML(t.id)}" aria-label="Editar">✎</button><button class="row-action remove" data-delete="${escapeHTML(t.id)}" aria-label="Eliminar">×</button></td></tr>`;
    }).join('');$('#transactionsEmpty').classList.toggle('hidden',rows.length>0);
  }
  function showDialog(id=null){
    editingId=id;manualCategory=false;const t=id?state.transactions.find(x=>x.id===id):null;
    $('#dialogTitle').textContent=t?'Editar movimiento':'Agregar movimiento';$('#transactionForm').reset();
    const type=t?.type||'gasto';$(`input[name="entryType"][value="${type}"]`).checked=true;
    $('#entryDesc').value=t?.description||'';$('#entryAmount').value=t?.amount||'';$('#entryDate').value=t?.date||currentISO();$('#entrySource').value=t?.source||'';
    $('#entryCategory').value=t?.category||'Otros';$('#entrySplit').checked=Boolean(t&&t.share<100);$('#entrySplitPercent').value=t?.share&&t.share<100?t.share:50;$('#entrySettled').checked=Boolean(t?.settled);updateSplitUI();$('#transactionDialog').showModal();
  }
  function updateSplitUI(){const type=$('input[name="entryType"]:checked').value,split=$('#entrySplit').checked;$('#splitArea').classList.toggle('hidden',type!=='gasto');$('#splitOptions').classList.toggle('hidden',!split);const amount=Number($('#entryAmount').value)||0,share=Number($('#entrySplitPercent').value);$('#splitPercentLabel').textContent=`${share}%`;$('#splitMyAmount').textContent=fmt(amount*share/100);$('#splitOwedAmount').textContent=fmt(amount*(100-share)/100);}
  function saveEntry(event){event.preventDefault();const desc=$('#entryDesc').value.trim();const amount=Math.round(Number($('#entryAmount').value));const date=$('#entryDate').value;const type=$('input[name="entryType"]:checked').value;
    if(!desc||!Number.isFinite(amount)||amount<=0||!validISO(date)){toast('Completa descripción, monto positivo y fecha válida.',true);return;}
    const t={id:editingId||uuid(),description:desc,amount,date,type,category:$('#entryCategory').value||categoryFor(desc,type),source:$('#entrySource').value.trim()||'Manual',share:type==='gasto'&&$('#entrySplit').checked?Number($('#entrySplitPercent').value):100,settled:type==='gasto'&&$('#entrySplit').checked&&$('#entrySettled').checked};
    const idx=state.transactions.findIndex(x=>x.id===editingId);if(idx>=0)state.transactions[idx]=t;else state.transactions.push(t);
    save();$('#transactionDialog').close();selectedMonth=periodOf(t.date);$('#dashboardMonth').value=selectedMonth;refresh();toast(idx>=0?'Movimiento actualizado.':'Movimiento agregado.');
  }
  function validISO(iso){if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return false;const d=new Date(`${iso}T12:00:00`);return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===iso;}
  function removeEntry(id){const t=state.transactions.find(x=>x.id===id);if(!t||!confirm(`¿Eliminar el movimiento "${t.description}" por ${fmt(t.amount)}?`))return;state.transactions=state.transactions.filter(x=>x.id!==id);save();refresh();toast('Movimiento eliminado.');}
  function toggleSettled(id){const t=state.transactions.find(x=>x.id===id);if(!t||t.type!=='gasto'||t.share>=100)return;t.settled=!t.settled;save();refresh();toast(t.settled?'Devolución marcada como recibida.':'Devolución marcada como pendiente.');}
  function drawProjection(){const inputs={income:'projIncome',expenses:'projExpenses',start:'projStart',goal:'projGoal',growthIncome:'projGrowthIncome',growthExpenses:'projGrowthExpenses'};
    Object.entries(inputs).forEach(([k,id])=>{if(document.activeElement!==$(`#${id}`))$(`#${id}`).value=state.projection[k];});
    const p=state.projection;let balance=Math.max(0,Number(p.start)||0),income=Math.max(0,Number(p.income)||0),expenses=Math.max(0,Number(p.expenses)||0);const growthI=Math.max(-20,Math.min(20,Number(p.growthIncome)||0))/100,growthE=Math.max(-20,Math.min(20,Number(p.growthExpenses)||0))/100;const result=[];
    for(let i=0;i<12;i++){if(i){income*=1+growthI;expenses*=1+growthE;}const saving=income-expenses;balance+=saving;result.push({month:monthShift(currentPeriod(),i+1),income,expenses,saving,balance});}
    const goal=Math.max(0,Number(p.goal)||0);const first=result[0];$('#projectedTotal').textContent=fmt(balance);$('#projectedMonthly').textContent=fmt(first.saving);$('#projectedRate').textContent=first.income?`${(first.saving/first.income*100).toFixed(1).replace('.',',')}% de ingresos estimados`:'Sin ingreso estimado';
    const reached=goal>0?result.find(x=>x.balance>=goal):null;$('#goalProgressBar').style.width=`${goal>0?Math.max(0,Math.min(100,balance/goal*100)):0}%`;
    $('#goalStatus').textContent=goal===0?'Ingresa una meta de ahorro para medir tu avance.':reached?`Tu meta de ${fmt(goal)} se alcanzaría en ${monthLabel(reached.month,{year:true})}.`:`Al cabo de 12 meses alcanzarías ${Math.max(0,Math.round(balance/goal*100))}% de tu meta de ${fmt(goal)}.`;
    $('#projectionRows').innerHTML=result.map(row=>`<tr><td><strong>${escapeHTML(monthLabel(row.month,{year:true}))}</strong></td><td>${fmt(row.income)}</td><td>${fmt(row.expenses)}</td><td class="${row.saving<0?'negative':'positive'}">${fmt(row.saving)}</td><td><strong>${fmt(row.balance)}</strong></td></tr>`).join('');
    const values=[Number(p.start)||0,...result.map(x=>x.balance),goal>0?goal:0];let min=Math.min(0,...values),max=Math.max(1,...values);if(max===min)max=min+1;const width=690,height=245,L=68,R=18,T=14,B=34,plotW=width-L-R,plotH=height-T-B,span=max-min;const x=i=>L+i/12*plotW,y=v=>T+(max-v)/span*plotH;
    const poly=[Number(p.start)||0,...result.map(d=>d.balance)].map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area=`${L},${y(min)} ${poly} ${x(12)},${y(min)}`;
    const rows=Array.from({length:5},(_,i)=>{const v=min+span*(4-i)/4;const yy=y(v);return `<line x1="${L}" y1="${yy}" x2="${width-R}" y2="${yy}" stroke="#edf1f4"/><text x="${L-12}" y="${yy+4}" text-anchor="end" font-size="10" fill="#a0aeb9">${(v/1e6).toFixed(1)}M</text>`;}).join('');
    const lbl=result.map((d,i)=>i%2===0?`<text x="${x(i+1)}" y="${height-7}" text-anchor="middle" font-size="10" fill="#9aaab5">${escapeHTML(monthLabel(d.month,{short:true}))}</text>`:'').join('');
    const goalLine=goal>0&&goal<=max?`<line x1="${L}" y1="${y(goal)}" x2="${width-R}" y2="${y(goal)}" stroke="#e5b46f" stroke-dasharray="5 5"/><text x="${width-R-4}" y="${y(goal)-5}" text-anchor="end" font-size="10" fill="#c99758">Meta</text>`:'';
    $('#projectionChart').innerHTML=`<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><linearGradient id="linefill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#61d7b5" stop-opacity=".25"/><stop offset="100%" stop-color="#61d7b5" stop-opacity=".01"/></linearGradient></defs>${rows}${goalLine}<polygon points="${area}" fill="url(#linefill)"/><polyline points="${poly}" stroke="#44c69f" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" fill="none"/>${result.map((d,i)=>`<circle cx="${x(i+1)}" cy="${y(d.balance)}" r="3.5" fill="#44c69f"><title>${escapeHTML(monthLabel(d.month,{year:true}))}: ${escapeHTML(fmt(d.balance))}</title></circle>`).join('')}${lbl}</svg>`;
  }
  function drawRules(){$('#rulesList').innerHTML=state.rules.length?state.rules.map((r,i)=>`<div class="rule-line"><span>Si contiene</span><strong>${escapeHTML(r.keyword)}</strong><span class="tag">${escapeHTML(r.category)}</span><button data-rule-delete="${i}" aria-label="Eliminar regla">×</button></div>`).join(''):'<p class="helper-text">Aún no hay reglas personalizadas. Se usan reglas sugeridas para comercios comunes.</p>';}
  function parseCSV(text){const firstLines=text.replace(/^\uFEFF/,'').split(/\r?\n/).slice(0,12).filter(x=>x.trim());const delimiters=[';',',','\t','|'];const delimiter=delimiters.map(d=>({d,score:firstLines.reduce((s,line)=>s+countUnquoted(line,d),0)})).sort((a,b)=>b.score-a.score)[0].d;
    const rows=[];let row=[],cell='',quoted=false;const src=text.replace(/^\uFEFF/,'');for(let i=0;i<src.length;i++){const c=src[i];if(c==='"'){if(quoted&&src[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(cell.trim());cell='';}else if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&src[i+1]==='\n')i++;row.push(cell.trim());if(row.some(s=>s!==''))rows.push(row);row=[];cell='';}else{cell+=c;}}row.push(cell.trim());if(row.some(x=>x!==''))rows.push(row);return rows;
  }
  function countUnquoted(text,separator){let quoted=false,n=0;for(let i=0;i<text.length;i++){if(text[i]==='"')quoted=!quoted;else if(text[i]===separator&&!quoted)n++;}return n;}
  function guessHeader(rows){const keys=/fecha|descrip|detalle|glosa|movimiento|cargo|abono|monto|importe|debe|haber|comercio|transacci|valor/;let best=0,bestScore=-1;rows.slice(0,Math.min(rows.length,20)).forEach((row,i)=>{const score=row.reduce((s,v)=>s+(keys.test(normal(v))?1:0),0);if(score>bestScore){bestScore=score;best=i;}});return bestScore>=1?best:0;}
  function guessMap(headers){const find=(terms,exclude=[])=>headers.findIndex(h=>terms.some(t=>normal(h).includes(t))&&!exclude.some(t=>normal(h).includes(t)));
    return {date:find(['fecha','date','dia']),desc:find(['descripcion','detalle','glosa','comercio','concepto','transaccion','movimiento','observacion']),debit:find(['cargo','egreso','debito','debe','retiro','giro']),credit:find(['abono','ingreso','credito','haber','deposito']),amount:find(['monto','importe','amount','valor','saldo movimiento','total movimiento'],['saldo disponible','saldo final','saldo contable'])};
  }
  function fillMap(){const mapping=guessMap(importHeaders);const fields={mapDate:'date',mapDesc:'desc',mapDebit:'debit',mapCredit:'credit',mapAmount:'amount'};Object.entries(fields).forEach(([id,name])=>{const select=$(`#${id}`);select.innerHTML='<option value="-1">— No usar —</option>'+importHeaders.map((h,i)=>`<option value="${i}">${escapeHTML(h||`Columna ${i+1}`)}</option>`).join('');select.selectedIndex=Number.isInteger(mapping[name])&&mapping[name]>=0?mapping[name]+1:0;});}
  function numberFromBank(value){if(typeof value==='number')return value;let s=String(value??'').trim();if(!s||s==='—'||s==='-')return 0;let sign=1;if(/^\(.*\)$/.test(s)||s.startsWith('-')||s.endsWith('-'))sign=-1;s=s.replace(/[^0-9,.]/g,'');if(!s)return 0;const lastComma=s.lastIndexOf(','),lastDot=s.lastIndexOf('.');if(lastComma!==-1&&lastDot!==-1){const decimal=lastComma>lastDot?',':'.';s=s.replace(decimal===','?/\./g:/,/g,'').replace(decimal,'.');}else if(lastComma!==-1||lastDot!==-1){const sep=lastComma!==-1?',':'.';const groups=s.split(sep);const last=groups.at(-1);if(groups.length>2||last.length===3){s=groups.join('');}else if(last.length<=2){s=groups.slice(0,-1).join('')+'.'+last;}else{s=groups.join('');}}
    return sign*Number(s);
  }
  function parseBankDate(v){if(v instanceof Date&&!Number.isNaN(v.getTime()))return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;
    if(typeof v==='number'&&v>20000&&v<90000){const d=new Date(Date.UTC(1899,11,30)+v*86400000);return d.toISOString().slice(0,10);}
    const s=String(v??'').trim();if(!s)return null;let m;
    if((m=s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)))return checkDate(+m[1],+m[2],+m[3]);
    if((m=s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/))){const year=+m[3]<100?2000+(+m[3]):+m[3];return checkDate(year,+m[2],+m[1]);}
    if((m=s.match(/^(\d{4})(\d{2})(\d{2})$/)))return checkDate(+m[1],+m[2],+m[3]);
    return null;
  }
  function checkDate(y,m,d){const s=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;return validISO(s)?s:null;}
  function fingerprint(t){return `${t.date}|${normal(t.description).replace(/\s+/g,' ')}|${t.type}|${Math.round(t.amount)}|${normal(t.source||'')}`;}
  function processPreview(){
    const indexes={date:+$('#mapDate').value,desc:+$('#mapDesc').value,debit:+$('#mapDebit').value,credit:+$('#mapCredit').value,amount:+$('#mapAmount').value};
    if(indexes.date<0||indexes.desc<0||((indexes.debit<0&&indexes.credit<0)&&indexes.amount<0)){toast('Selecciona columnas de fecha, descripción y cargos/abonos o monto único.',true);return;}
    const get=(row,key)=>indexes[key]<0?'':(row[indexes[key]]??'');const sign=$('#mapSign').value;const source=$('#importSource').value.trim()||'Cartola importada';const existing=new Set(state.transactions.map(fingerprint)),seen=new Set();
    importPreview=importRows.map((row,index)=>{
      const date=parseBankDate(get(row,'date'));const desc=String(get(row,'desc')).trim();const debit=numberFromBank(get(row,'debit'));const credit=numberFromBank(get(row,'credit'));const amountSingle=numberFromBank(get(row,'amount'));let type,amount;
      if((indexes.debit>=0||indexes.credit>=0)&&(debit!==0||credit!==0)){if(debit!==0){type='gasto';amount=Math.abs(debit);}else{type='ingreso';amount=Math.abs(credit);}}
      else if(indexes.amount>=0&&amountSingle!==0){type=(sign==='negative-expense'?(amountSingle<0?'gasto':'ingreso'):(amountSingle>0?'gasto':'ingreso'));amount=Math.abs(amountSingle);}
      else{type='gasto';amount=0;}
      amount=Math.round(amount);const obj={id:uuid(),date,description:desc,amount,type,category:categoryFor(desc,type),source,share:100,settled:false};
      const invalid=!date||!desc||!Number.isFinite(amount)||amount<=0;const key=fingerprint(obj);const duplicate=!invalid&&(existing.has(key)||seen.has(key));if(!invalid)seen.add(key);return {...obj,index,invalid,duplicate,selected:!invalid&&!duplicate};
    });
    const valid=importPreview.filter(x=>!x.invalid).length,duplicates=importPreview.filter(x=>x.duplicate).length;
    $('#importPreviewSummary').textContent=`${valid} válidos · ${duplicates} posibles duplicados · ${importPreview.length-valid} no reconocidos`;
    $('#importPreviewPanel').classList.remove('hidden');renderImportPreview();$('#importPreviewPanel').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function renderImportPreview(){
    $('#importPreviewRows').innerHTML=importPreview.map((t,i)=>`<tr><td><input type="checkbox" data-import-check="${i}" ${t.selected?'checked':''} ${t.invalid?'disabled':''} aria-label="Importar fila ${i+1}" /></td><td><div class="movement-name"><span><strong>${escapeHTML(t.description||'(sin descripción)')}</strong><small>${escapeHTML(t.date||'Fecha no reconocida')}</small></span></div></td><td><span class="tag">${t.type==='gasto'?'Gasto':'Ingreso'}</span></td><td class="${t.type==='gasto'?'negative':'positive'}">${t.type==='gasto'?'-':'+'}${fmt(t.amount)}</td><td><select data-import-category="${i}" aria-label="Categoría de fila ${i+1}">${CATEGORIES.map(c=>`<option value="${escapeHTML(c)}" ${t.category===c?'selected':''}>${escapeHTML(c)}</option>`).join('')}</select></td><td><span class="${t.invalid?'preview-error':t.duplicate?'preview-warning':'preview-ok'}">${t.invalid?'Revisar fila':t.duplicate?'Posible duplicado':'✓ Listo'}</span></td></tr>`).join('');
    updateSelectedCount();
  }
  function updateSelectedCount(){const selected=importPreview.filter(t=>t.selected&&!t.invalid);$('#importSelectedCount').textContent=`${selected.length} seleccionado${selected.length!==1?'s':''}`;$('#selectAllCheckbox').checked=selected.length>0&&importPreview.every(t=>t.invalid||t.duplicate||t.selected);}
  async function loadImport(file){if(!file)return;if(file.size>10*1024*1024){toast('El archivo no debe superar 10 MB.',true);return;}const extension=(file.name.split('.').pop()||'').toLowerCase();let rows;
    try{
      if(extension==='csv'||extension==='txt'){rows=parseCSV(await file.text());}
      else if(['xls','xlsx'].includes(extension)){
        if(typeof XLSX==='undefined'){throw new Error('No se pudo cargar el lector Excel. Revisa tu conexión a internet o exporta la cartola como CSV.');}
        const data=await file.arrayBuffer();const book=XLSX.read(data,{type:'array',cellDates:true});if(!book.SheetNames.length)throw new Error('El archivo Excel no contiene hojas.');rows=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{header:1,defval:'',raw:true});
      } else throw new Error('Formato no compatible. Usa CSV, XLSX o XLS.');
      if(!rows||rows.length<2)throw new Error('El archivo no contiene suficientes filas.');
      if(rows.length>5001)throw new Error('Para esta versión, importa como máximo 5.000 filas por archivo.');
      const headerIdx=guessHeader(rows);importHeaders=rows[headerIdx].map((x,i)=>String(x??'').trim()||`Columna ${i+1}`);importRows=rows.slice(headerIdx+1).filter(row=>row.some(v=>String(v??'').trim()));if(!importRows.length)throw new Error('No se encontraron movimientos bajo los encabezados.');fileName=file.name;$('#importFileInfo').textContent=`${fileName} · ${importRows.length} filas encontradas`;$('#importSource').value=file.name.replace(/\.[^.]+$/,'').slice(0,60);fillMap();$('#mappingPanel').classList.remove('hidden');$('#importPreviewPanel').classList.add('hidden');$('#mappingPanel').scrollIntoView({behavior:'smooth',block:'start'});toast('Archivo leído. Revisa la asignación de columnas.');
    }catch(e){console.error(e);toast(e.message||'No fue posible leer este archivo.',true);}
  }
  function confirmImport(){const selection=importPreview.filter(t=>t.selected&&!t.invalid);if(!selection.length){toast('Selecciona al menos un movimiento válido.',true);return;}const existing=new Set(state.transactions.map(fingerprint));let count=0,skipped=0;selection.forEach(t=>{const key=fingerprint(t);if(existing.has(key)){skipped++;return;}const {index,invalid,duplicate,selected,...item}=t;state.transactions.push(item);existing.add(key);count++;});if(!count){toast('Todos los seleccionados ya estaban importados.',true);return;}save();selectedMonth=state.transactions.slice().sort((a,b)=>b.date.localeCompare(a.date))[0].date.slice(0,7);$('#dashboardMonth').value=selectedMonth;refresh();$('#mappingPanel').classList.add('hidden');$('#importPreviewPanel').classList.add('hidden');$('#fileInput').value='';updateView('transactions');toast(`${count} movimiento${count!==1?'s':''} importado${count!==1?'s':''}.${skipped?` ${skipped} duplicados omitidos.`:''}`);}
  function exportCsv(){const cols=['Fecha','Descripcion','Tipo','Monto_total_CLP','Categoria','Mi_porcentaje','Mi_parte_CLP','Devolucion_recibida','Fuente'];const lines=[cols,...state.transactions.map(t=>[t.date,t.description,t.type,t.amount,t.category,t.share??100,t.type==='gasto'?ownCost(t):'',t.settled?'Si':'No',t.source||''])].map(row=>row.map(field=>`"${String(field??'').replaceAll('"','""')}"`).join(';')).join('\r\n');downloadFile('\uFEFF'+lines,'financetracker_movimientos.csv','text/csv;charset=utf-8');}
  function downloadFile(content,name,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  function validateBackup(value){if(!value||!Array.isArray(value.transactions)||!Array.isArray(value.rules))throw new Error('El respaldo no contiene la estructura correcta.');
    if(value.transactions.length>20000||value.rules.length>200)throw new Error('El respaldo supera el límite permitido.');
    const clean=value.transactions.map(t=>{const amount=Math.round(Number(t.amount));if(!validISO(t.date)||!String(t.description??'').trim()||!Number.isFinite(amount)||amount<=0||!TYPES.includes(t.type))throw new Error('El respaldo tiene movimientos inválidos.');return {id:String(t.id||uuid()),date:t.date,description:String(t.description).slice(0,140),type:t.type,amount,category:CATEGORIES.includes(t.category)?t.category:'Otros',source:String(t.source||'Respaldo').slice(0,60),share:t.type==='gasto'?Math.max(1,Math.min(100,Number(t.share)||100)):100,settled:Boolean(t.settled)};});
    const rules=value.rules.filter(r=>r&&r.keyword&&CATEGORIES.includes(r.category)).map(r=>({keyword:String(r.keyword).slice(0,60),category:r.category}));const p=value.projection||{};const projection={};Object.keys(DEFAULT_PROJECTION).forEach(k=>projection[k]=Number.isFinite(Number(p[k]))?Number(p[k]):DEFAULT_PROJECTION[k]);return {transactions:clean,rules,projection,demo:Boolean(value.demo)};
  }
  function wire(){
    $$('.nav-link').forEach(n=>n.addEventListener('click',()=>updateView(n.dataset.view)));$$('[data-goto]').forEach(n=>n.addEventListener('click',()=>updateView(n.dataset.goto)));$('#menuToggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
    $('#dashboardMonth').addEventListener('change',e=>{selectedMonth=e.target.value;drawDashboard();});$('#dismissDemo').addEventListener('click',()=>{dismissDemo();$('#demoBanner').classList.add('hidden');});
    $('#quickAdd').addEventListener('click',()=>showDialog());$('#addTransaction').addEventListener('click',()=>showDialog());$('#closeDialog').addEventListener('click',()=>$('#transactionDialog').close());$('#cancelTransaction').addEventListener('click',()=>$('#transactionDialog').close());$('#transactionForm').addEventListener('submit',saveEntry);
    $$('input[name="entryType"]').forEach(n=>n.addEventListener('change',()=>{if(!manualCategory)$('#entryCategory').value=categoryFor($('#entryDesc').value,n.value);updateSplitUI();}));$('#entryDesc').addEventListener('input',()=>{if(!manualCategory)$('#entryCategory').value=categoryFor($('#entryDesc').value,$('input[name="entryType"]:checked').value);});$('#entryCategory').addEventListener('change',()=>manualCategory=true);['entrySplit','entrySplitPercent','entryAmount'].forEach(id=> $(`#${id}`).addEventListener('input',updateSplitUI));
    $('#searchTransactions').addEventListener('input',drawTransactions);['filterMonth','filterType','filterCategory'].forEach(id=>$(`#${id}`).addEventListener('change',drawTransactions));$('#transactionRows').addEventListener('click',e=>{const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');if(edit)showDialog(edit.dataset.edit);if(del)removeEntry(del.dataset.delete);});$('#exportCsv').addEventListener('click',exportCsv);
    const zone=$('#dropzone'),picker=$('#fileInput');zone.addEventListener('click',e=>{if(e.target.id!=='browseFile')picker.click();});$('#browseFile').addEventListener('click',e=>{e.stopPropagation();picker.click();});zone.addEventListener('keydown',e=>{if(e.target===zone&&(e.key==='Enter'||e.key===' ')){e.preventDefault();picker.click();}});picker.addEventListener('change',e=>loadImport(e.target.files[0]));zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('dragging');});zone.addEventListener('dragleave',()=>zone.classList.remove('dragging'));zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('dragging');loadImport(e.dataTransfer.files[0]);});
    $('#cancelImport').addEventListener('click',()=>{$('#mappingPanel').classList.add('hidden');$('#importPreviewPanel').classList.add('hidden');picker.value='';});$('#previewImport').addEventListener('click',processPreview);$('#confirmImport').addEventListener('click',confirmImport);$('#importPreviewRows').addEventListener('change',e=>{if(e.target.matches('[data-import-check]'))importPreview[+e.target.dataset.importCheck].selected=e.target.checked;if(e.target.matches('[data-import-category]'))importPreview[+e.target.dataset.importCategory].category=e.target.value;updateSelectedCount();});$('#selectAllImports').addEventListener('click',()=>{importPreview.forEach(t=>t.selected=!t.invalid&&!t.duplicate);renderImportPreview();});$('#selectAllCheckbox').addEventListener('change',e=>{importPreview.forEach(t=>{if(!t.invalid)t.selected=e.target.checked;});renderImportPreview();});
    Object.entries({projIncome:'income',projExpenses:'expenses',projStart:'start',projGoal:'goal',projGrowthIncome:'growthIncome',projGrowthExpenses:'growthExpenses'}).forEach(([id,key])=>$(`#${id}`).addEventListener('input',e=>{const n=Number(e.target.value);state.projection[key]=Number.isFinite(n)?n:0;save();drawProjection();}));
    $('#useMonthForProjection').addEventListener('click',()=>{const m=monthMetrics(selectedMonth);if(!m.income&&!m.expenses){toast('El mes seleccionado no tiene movimientos.',true);return;}state.projection.income=m.income;state.projection.expenses=m.expenses;save();drawProjection();toast('Proyección actualizada con los datos del mes.');});
    $('#newRuleForm').addEventListener('submit',e=>{e.preventDefault();const keyword=$('#ruleKeyword').value.trim();const category=$('#ruleCategory').value;if(!keyword)return;if(state.rules.some(r=>normal(r.keyword)===normal(keyword))){toast('Ya existe una regla para esa palabra.',true);return;}state.rules.unshift({keyword,category});$('#ruleKeyword').value='';save();drawRules();toast('Regla añadida para próximos registros e importaciones.');});$('#rulesList').addEventListener('click',e=>{const btn=e.target.closest('[data-rule-delete]');if(!btn)return;state.rules.splice(Number(btn.dataset.ruleDelete),1);save();drawRules();});
    $('#exportBackup').addEventListener('click',()=>downloadFile(JSON.stringify({version:1,...state},null,2),'financetracker_respaldo.json','application/json'));
    $('#restoreBackup').addEventListener('click',()=>$('#restoreInput').click());$('#restoreInput').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10*1024*1024)throw new Error('Respaldo demasiado grande.');const obj=validateBackup(JSON.parse(await file.text()));if(!confirm(`¿Reemplazar tus ${state.transactions.length} movimientos por ${obj.transactions.length} movimientos del respaldo?`))return;state=obj;selectedMonth=currentPeriod();save();refresh();toast('Respaldo restaurado correctamente.');}catch(err){toast(err.message||'El respaldo no es válido.',true);}finally{e.target.value='';}});
    $('#reloadDemo').addEventListener('click',()=>{if(!confirm('¿Reemplazar todos los datos por el ejemplo? Descarga un respaldo antes si deseas conservarlos.'))return;state=demoData();showDemoAgain();selectedMonth=currentPeriod();save();refresh();updateView('dashboard');toast('Datos de demostración cargados.');});
    $('#clearAll').addEventListener('click',()=>{if(!confirm('¿Borrar TODOS tus movimientos y reglas? Esta acción no se puede deshacer.'))return;state={transactions:[],rules:[],projection:{...DEFAULT_PROJECTION,income:0,expenses:0,start:0,goal:0},demo:false};selectedMonth=currentPeriod();save();refresh();updateView('dashboard');toast('Datos eliminados del navegador.');});
  }
  function init(){bindSelect('#entryCategory',CATEGORIES);bindSelect('#ruleCategory',CATEGORIES);bindSelect('#filterCategory',CATEGORIES,true);$('#ruleCategory').value='Otros';chooseMonthOptions();wire();refresh();}
  init();
})();
