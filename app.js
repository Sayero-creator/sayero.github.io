const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const SUITS=['♠','♥','♦','♣'], RANKS=['6','7','8','9','10','J','Q','K','A'], VAL={'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
let currentGame='durak',bots=3,level='normal',state=null,selected=null,sound=true,tutorialStep=0;
const screens={lobby:$('#lobby'),setup:$('#setup'),table:$('#tableScreen')};
function showScreen(name){Object.values(screens).forEach(x=>x.classList.remove('active'));screens[name].classList.add('active');window.scrollTo(0,0)}
function toast(msg){let t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2100)}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function deck36(){return shuffle(SUITS.flatMap(s=>RANKS.map(r=>({s,r,id:r+s}))))}
function deck52(){return shuffle(SUITS.flatMap(s=>['A','2','3','4','5','6','7','8','9','10','J','Q','K'].map(r=>({s,r,id:r+s}))))}
function cardHTML(c,opts={}){if(!c)return '';let red=c.s==='♥'||c.s==='♦';return `<div class="card ${red?'red':''} ${opts.selected?'selected':''} ${opts.back?'back':''} ${opts.tiny?'tiny-card':''}" ${opts.action||''}>${opts.back?'':`<span class="corner">${c.r}<br>${c.s}</span><span class="suit">${c.s}</span>`}</div>`}
function setHeader(title,eyebrow){$('#tableTitle').textContent=title;$('#modeEyebrow').textContent=eyebrow}
function startGame(){selected=null;showScreen('table');$('#gameControls').innerHTML='';if(currentGame==='durak')initDurak();if(currentGame==='klondike')initKlondike();if(currentGame==='freecell')initFreecell();tutorialStep=0;showTutorial(true)}
function setupGame(g){currentGame=g;const names={durak:['Дурак','Подкидной дурак против нескольких соперников.'],klondike:['Косынка','Соберите четыре последовательности от туза до короля.'],freecell:['Свободная ячейка','Распределяйте карты, используя четыре временные ячейки.']};$('#setupTitle').textContent=names[g][0];$('#setupDesc').textContent=names[g][1];$('#botChoices').style.display=g==='durak'?'flex':'none';$('#setupHint').style.display=g==='durak'?'block':'none';showScreen('setup')}
function showTutorial(first=false){let steps={
durak:[['Цель игры','Избавьтесь от всех карт раньше соперников. Последний игрок с картами становится проигравшим.','В колоде 36 карт. У каждого игрока по 6 карт, одна карта открывает козырную масть.'],['Атака и защита','Атакующий кладёт карту. Защитник должен побить её картой той же масти старше или любым козырем.','На стол можно подкидывать карты только тех достоинств, которые уже есть на столе.'],['Завершение раунда','Если все карты побиты — нажмите «Бито». Если не можете или не хотите отбиваться — «Взять».','После раунда игроки добирают карты до шести. Подсказка поможет выбрать ход.']],
klondike:[['Цель Косынки','Соберите четыре базовые стопки по мастям: от туза до короля.','В столбцах карты выкладываются по убыванию, чередуя красную и чёрную масти.'],['Перемещение карт','Нажмите на карту, затем на подходящую стопку. Открытые карты можно перемещать цепочкой.','Пустой столбец можно заполнить только королём. Нажмите на колоду, чтобы открыть карту.'],['Полезные действия','Переносите тузы и двойки в базовые стопки, открывайте закрытые карты.','Кнопка «Подсказка» покажет доступный ход. Можно отменить последнее действие.']],
freecell:[['Цель игры','Соберите четыре базовые стопки по мастям от туза до короля.','Все 52 карты с самого начала открыты.'],['Свободные ячейки','Четыре верхние ячейки временно хранят по одной карте.','В столбцах стройте убывающие последовательности с чередованием цветов.'],['Планируйте ходы','Освобождайте столбцы и ячейки — так вы сможете перемещать более длинные цепочки.','В базовую стопку можно отправлять только следующую карту нужной масти.']]
}[currentGame];let i=first?0:tutorialStep;if(i>=steps.length){closeModal();return}$('#modalEyebrow').textContent=`ОБУЧЕНИЕ · ${i+1}/${steps.length}`;$('#modalTitle').textContent=steps[i][0];$('#modalBody').innerHTML=`<p>${steps[i][1]}</p><p>${steps[i][2]}</p>`;$('#modalPrev').style.display=i===0?'none':'block';$('#modalNext').textContent=i===steps.length-1?'Начать игру':'Далее →';$('#modal').classList.add('open');tutorialStep=i}
function closeModal(){$('#modal').classList.remove('open')}
function initDurak(){
 let d=deck36(),n=bots+1,players=Array.from({length:n},(_,i)=>({name:i===0?'Вы':['Мария','Алексей','Игорь'][i-1]||`Игрок ${i}`,hand:[],human:i===0}));
 for(let k=0;k<6;k++)for(let p of players)p.hand.push(d.pop());
 let trump=d[d.length-1]?.s||'♠';players.forEach(p=>p.hand.sort((a,b)=>(a.s===trump?1:0)-(b.s===trump?1:0)||VAL[a.r]-VAL[b.r]));
 let human=players[0].hand;let lowest=human.filter(c=>c.s===trump).sort((a,b)=>VAL[a.r]-VAL[b.r])[0];
 let defender=lowest?0:players.findIndex(p=>p.hand.some(c=>c.s===trump));if(defender<0)defender=1;
 state={players,deck:d,trump,discard:[],table:[],attacker:(defender+n-1)%n,defender,phase:'attack',turn:0,done:false,round:1,initialBots:bots};
 setHeader('Дурак','ПОДКИДНОЙ');$('#deckInfo').textContent=`Козырь ${trump} · Колода ${d.length}`;renderDurak();if(defender!==0)setTimeout(botLoop,700);
}
function isBeat(a,b,trump){return (a.s===b.s&&VAL[a.r]>VAL[b.r])||(b.s===trump&&a.s!==trump)}
function nextAlive(i){let n=state.players.length;for(let k=1;k<=n;k++){let j=(i+k)%n;if(state.players[j].hand.length||state.deck.length)return j}return (i+1)%n}
function renderDurak(){
 let s=state;if(!s)return;let n=s.players.length;
 $('#gameStatus').textContent=s.done?'Партия завершена':s.phase==='attack'?(s.attacker===0?'Ваш ход — атакуйте':'Соперник атакует'):(s.defender===0?'Ваша защита':'Соперник защищается');
 let opponents=s.players.slice(1).map((p,i)=>`<div class="opponent ${s.defender===i+1?'active-seat':''}"><span class="avatar">${p.name[0]}</span><span>${p.name}<br><span class="count">${p.hand.length} карт</span></span></div>`).join('');
 let table=s.table.map((pair,i)=>`<div class="pair">${cardHTML(pair.a)}${pair.b?cardHTML(pair.b):''}</div>`).join('');
 let trumpCard=s.deck.length?`<div class="deck-pile">${cardHTML({s:s.trump,r:'?'},{back:true})}<span>Козырь<br>${s.trump}</span></div>`:`<div class="muted small">Колодa пуста</div>`;
 let hand=s.players[0].hand.map((c,i)=>cardHTML(c,{selected:selected===i,action:`data-hand="${i}"`})).join('');
 $('#gameBoard').innerHTML=`<div class="opponents">${opponents}</div><div class="deck-pile">${trumpCard}<span>Осталось ${s.deck.length}</span></div><div class="battle-area">${table||'<span class="muted small">Стол свободен · ход начинается</span>'}</div><div class="seat">ВАШИ КАРТЫ · ${s.players[0].hand.length}</div><div class="hand">${hand}</div>`;
 $$('[data-hand]').forEach(el=>el.onclick=()=>{let i=+el.dataset.hand;selected=selected===i?null:i;renderDurak()});
 let controls='';if(!s.done&&s.phase==='attack'&&s.attacker===0){controls=`<button class="action-btn primary" id="playCard" ${selected===null?'disabled':''}>Атаковать</button><button class="action-btn" id="pass">Закончить подкидывание</button>`}
 if(!s.done&&s.phase==='defend'&&s.defender===0){controls=`<button class="action-btn primary" id="beatCard" ${selected===null?'disabled':''}>Побить карту</button><button class="action-btn" id="take">Взять карты</button>`}
 if(s.done)controls=`<button class="action-btn primary" id="newRound">Новая партия</button>`;
 $('#gameControls').innerHTML=controls;
 if($('#playCard'))$('#playCard').onclick=humanAttack;
 if($('#pass'))$('#pass').onclick=finishAttack;
 if($('#beatCard'))$('#beatCard').onclick=humanBeat;
 if($('#take'))$('#take').onclick=takeCards;
 if($('#newRound'))$('#newRound').onclick=()=>{initDurak();};
}
function humanAttack(){let s=state,p=s.players[0],c=p.hand[selected];if(!c)return;if(s.table.length&& !s.table.some(x=>x.a.r===c.r||x.b?.r===c.r)){toast('Можно подкинуть только достоинство со стола');return}if(s.table.length>=s.players[s.defender].hand.length){toast('Защитнику больше нельзя подкидывать');return}p.hand.splice(selected,1);s.table.push({a:c,b:null});selected=null;s.phase='defend';renderDurak();setTimeout(botLoop,500)}
function finishAttack(){let s=state;if(s.phase!=='attack'||s.attacker!==0)return;s.phase='defend';renderDurak();setTimeout(botLoop,400)}
function humanBeat(){let s=state,p=s.players[0],c=p.hand[selected],target=s.table.findIndex(x=>!x.b);if(!c||target<0)return;if(!isBeat(c,s.table[target].a,s.trump)){toast('Эта карта не бьёт выбранную');return}p.hand.splice(selected,1);s.table[target].b=c;selected=null;renderDurak();if(s.table.every(x=>x.b))setTimeout(()=>{if(s.defender===0)humanBeatDone();else botLoop()},500)}
function humanBeatDone(){if(state.table.every(x=>x.b))endRound(false)}
function takeCards(){endRound(true)}
function botLoop(){let s=state;if(!s||s.done)return;let guard=0;while(guard++<20){
 if(s.phase==='attack'){
  if(s.attacker===0){renderDurak();return}
  let p=s.players[s.attacker],def=s.players[s.defender];let options=p.hand.filter(c=>!s.table.length||s.table.some(x=>x.a.r===c.r||x.b?.r===c.r));
  if(s.table.length>=def.hand.length||!options.length){s.phase='defend';continue}
  let c=chooseBotCard(options,true);p.hand.splice(p.hand.indexOf(c),1);s.table.push({a:c,b:null});s.phase='defend';renderDurak();continue;
 }
 if(s.phase==='defend'){
  if(s.defender===0){renderDurak();return}
  let p=s.players[s.defender],unbeaten=s.table.filter(x=>!x.b);
  if(!unbeaten.length){endRound(false);return}
  let pair=unbeaten[0],options=p.hand.filter(c=>isBeat(c,pair.a,s.trump));
  let shouldTake=!options.length||(level==='easy'&&options[0]&&Math.random()<.25)||(level==='normal'&&options[0]&&Math.random()<.08);
  if(shouldTake){endRound(true);return}
  let c=chooseBotCard(options,false);p.hand.splice(p.hand.indexOf(c),1);pair.b=c;renderDurak();continue;
 }
 }
}
function chooseBotCard(options,attack){let sorted=[...options].sort((a,b)=>VAL[a.r]-VAL[b.r]);if(level==='easy')return sorted[Math.floor(Math.random()*sorted.length)];if(attack)return sorted.find(c=>c.s!=='♠')||sorted[0];return sorted[0]}
function endRound(taken){
 let s=state;if(!s||s.done)return;let n=s.players.length;
 if(taken){let d=s.players[s.defender];s.table.forEach(x=>{d.hand.push(x.a);if(x.b)d.hand.push(x.b)});toast(`${d.name} берёт карты`)}
 else{s.table.forEach(x=>{s.discard.push(x.a);if(x.b)s.discard.push(x.b)})}
 s.table=[];let order=[];for(let k=0;k<n;k++)order.push((s.attacker+k)%n);
 order.forEach(i=>{let p=s.players[i];while(p.hand.length<6&&s.deck.length)p.hand.push(s.deck.pop())});
 let active=s.players.map((p,i)=>p.hand.length?i:-1).filter(i=>i>=0);
 if(s.deck.length===0&&active.length<=1){s.done=true;let loser=active.length?s.players[active[0]]:null;$('#gameStatus').textContent=loser?`${loser.name} остался с картами`:'Все игроки вышли!';toast(loser?`${loser.name} — дурак!`:'Все игроки вышли!');renderDurak();return}
 // Следующий раунд начинает игрок после прежнего защитника; пустые руки пропускаются.
 let oldDefender=s.defender;
 const nextActive=(from)=>{for(let k=1;k<=n;k++){let j=(from+k)%n;if(s.players[j].hand.length)return j}return from};
 s.attacker=s.players[oldDefender].hand.length?oldDefender:nextActive(oldDefender);
 s.defender=nextActive(s.attacker);
 if(s.defender===s.attacker){s.done=true;renderDurak();return}
 s.phase='attack';s.round++;s.players.forEach(p=>p.hand.sort((a,b)=>(a.s===s.trump?1:0)-(b.s===s.trump?1:0)||VAL[a.r]-VAL[b.r]));selected=null;$('#deckInfo').textContent=`Козырь ${s.trump} · Колода ${s.deck.length}`;renderDurak();if(s.attacker!==0||s.defender!==0)setTimeout(botLoop,500)
}

function initKlondike(){let d=deck52(),cols=Array.from({length:7},()=>[]);for(let i=0;i<7;i++)for(let j=0;j<=i;j++){let c=d.pop();c.up=j===i;cols[i].push(c)}state={stock:d,waste:[],cols,found:[[],[],[],[]],history:[]};setHeader('Косынка','ПАСЬЯНС');$('#deckInfo').textContent=`Осталось в колоде ${d.length}`;renderKlondike()}
function snapshot(){return JSON.stringify(state)}
function saveUndo(){state.history.push(snapshot());if(state.history.length>50)state.history.shift()}
function undo(){if(state?.history?.length){let h=state.history.pop();let hist=state.history;state=JSON.parse(h);state.history=hist;selected=null;renderCurrent();toast('Ход отменён')}else toast('Пока нечего отменять')}
function renderKlondike(){
 let s=state;let top=`<div class="top-piles"><div class="pile" id="stock">${s.stock.length?cardHTML({}, {back:true}):'<div class="pile-label">↻</div>'}</div><div class="pile" id="waste">${s.waste.length?cardHTML(s.waste.at(-1),{action:'data-waste'}) :'<div class="pile-label">Сброс</div>'}</div><div></div>${s.found.map((p,i)=>`<div class="pile" data-found="${i}">${p.length?cardHTML(p.at(-1)):'<div class="pile-label">A ${SUITS[i]}</div>'}</div>`).join('')}</div>`;
 let cols=`<div class="tableau">${s.cols.map((col,i)=>`<div class="tableau-col" data-col="${i}" style="min-height:${Math.max(170,70+col.length*18)}px">${col.map((c,j)=>cardHTML(c,c.up?{selected:selected?.type==='col'&&selected.col===i&&selected.idx===j,action:`data-colcard="${i},${j}"`}:{back:true})).join('')}</div>`).join('')}</div>`;
 $('#gameBoard').innerHTML=`<div class="solitaire-layout">${top}${cols}</div>`;
 $('#stock').onclick=()=>{saveUndo();if(s.stock.length){let c=s.stock.pop();c.up=true;s.waste.push(c)}else if(s.waste.length){s.stock=s.waste.reverse().map(c=>({...c,up:false}));s.waste=[]}renderKlondike()};
 $$('[data-colcard]').forEach(el=>el.onclick=()=>{let [col,idx]=el.dataset.colcard.split(',').map(Number);selectKlondike(col,idx)});
 $('#waste').onclick=()=>{if(s.waste.length)selectWaste()};
 $$('[data-found]').forEach(el=>el.onclick=()=>moveToFoundation(+el.dataset.found));
 $$('[data-col]').forEach(el=>el.onclick=e=>{if(e.target.closest('[data-colcard]'))return;moveToColumn(+el.dataset.col)});
 $('#gameControls').innerHTML=`<button class="action-btn" id="undoBtn">↶ Отменить ход</button><button class="action-btn" id="drawMode">Колода: 1 карта</button>`;
 $('#undoBtn').onclick=undo;$('#drawMode').onclick=()=>toast('Режим открытия по одной карте');
 $('#deckInfo').textContent=`Колодa ${s.stock.length} · Сброс ${s.waste.length}`;
 if(isKlondikeWon())toast('Победа! Все карты собраны.');
}
function selectWaste(){selected={type:'waste'};renderKlondike()}
function selectKlondike(col,idx){let c=state.cols[col][idx];if(!c.up)return;if(selected){if(selected.type==='col'&&selected.col===col&&selected.idx===idx){selected=null;renderKlondike();return}moveToColumn(col);return}selected={type:'col',col,idx};renderKlondike()}
function getSelectedCards(){if(!selected)return[];if(selected.type==='waste')return state.waste.length?[state.waste.at(-1)]:[];return state.cols[selected.col].slice(selected.idx)}
function removeSelected(){if(selected.type==='waste')return state.waste.pop();let col=state.cols[selected.col],arr=col.splice(selected.idx);if(col.length)col.at(-1).up=true;return arr}
function canPlaceOn(card,dest){if(!dest)return card.r==='K';let red=card.s==='♥'||card.s==='♦',dr=dest.s==='♥'||dest.s==='♦';return VAL[dest.r]===VAL[card.r]+1&&red!==dr}
function moveToColumn(col){if(!selected)return;let arr=getSelectedCards(),card=arr[0],dest=state.cols[col].at(-1);if(selected.type==='col'&&selected.col===col){selected=null;renderKlondike();return}if(!canPlaceOn(card,dest)){toast('Нужна карта на ранг старше и другого цвета');return}saveUndo();let moved=removeSelected();state.cols[col].push(...moved);selected=null;renderKlondike()}
function moveToFoundation(i){let c=selected?getSelectedCards()[0]:state.waste.at(-1);if(!c)return;if(selected?.type==='col'&&getSelectedCards().length>1){toast('В базовую стопку переносится одна карта');return}let pile=state.found[i],top=pile.at(-1);if(c.s!==SUITS[i]||(!top&&c.r!=='A')||(top&&VAL[c.r]!==VAL[top.r]+1)){toast('Неподходящая карта для этой стопки');return}saveUndo();if(selected)removeSelected();else state.waste.pop();pile.push(c);selected=null;renderKlondike()}
function isKlondikeWon(){return state.found.every(p=>p.length===13)}

function initFreecell(){let d=deck52(),cols=Array.from({length:8},()=>[]);d.forEach((c,i)=>cols[i%8].push(c));state={cols,cells:Array(4).fill(null),found:[[],[],[],[]],history:[]};setHeader('Свободная ячейка','ПАСЬЯНС');$('#deckInfo').textContent='52 карты · 4 свободные ячейки';renderFreecell()}
function renderFreecell(){let s=state;let top=`<div class="freecell-top">${s.cells.map((c,i)=>`<div class="free-slot" data-cell="${i}">${c?cardHTML(c,{action:`data-cellcard="${i}"`}):'<div class="pile-label">Ячейка</div>'}</div>`).join('')}${s.found.map((p,i)=>`<div class="free-slot" data-fc-found="${i}">${p.length?cardHTML(p.at(-1)):`<div class="pile-label">A ${SUITS[i]}</div>`}</div>`).join('')}</div>`;
 let cols=`<div class="freecell-cols">${s.cols.map((col,i)=>`<div class="freecell-col" data-fc-col="${i}" style="min-height:${Math.max(190,65+col.length*20)}px">${col.map((c,j)=>cardHTML(c,{selected:selected?.type==='fc-col'&&selected.col===i&&selected.idx===j,action:`data-fccard="${i},${j}"`})).join('')}</div>`).join('')}</div>`;
 $('#gameBoard').innerHTML=`${top}${cols}`;
 $$('[data-fccard]').forEach(el=>el.onclick=()=>{let [col,idx]=el.dataset.fccard.split(',').map(Number);if(selected){moveFreeColumn(col);return}selected={type:'fc-col',col,idx};renderFreecell()});
 $$('[data-cell]').forEach(el=>el.onclick=()=>{let i=+el.dataset.cell;if(selected){moveToCell(i);return}if(state.cells[i]){selected={type:'cell',idx:i};renderFreecell()}});
 $$('[data-cellcard]').forEach(el=>el.onclick=()=>{selected={type:'cell',idx:+el.dataset.cellcard};renderFreecell()});
 $$('[data-fc-found]').forEach(el=>el.onclick=()=>freeToFoundation(+el.dataset.fcFound));
 $$('[data-fc-col]').forEach(el=>el.onclick=()=>{if(selected)moveFreeColumn(+el.dataset.fcCol)});
 $('#gameControls').innerHTML=`<button class="action-btn" id="undoBtn">↶ Отменить ход</button><button class="action-btn" id="autoBtn">Автосбор</button>`;
 $('#undoBtn').onclick=undo;$('#autoBtn').onclick=autoFoundation;$('#deckInfo').textContent=`Свободно ячеек ${s.cells.filter(x=>!x).length} · Собрано ${s.found.reduce((a,p)=>a+p.length,0)}/52`;
 if(s.found.every(p=>p.length===13))toast('Победа! Вы собрали все карты.');
}
function fcGet(){if(!selected)return null;if(selected.type==='cell')return state.cells[selected.idx];return state.cols[selected.col][selected.idx]}
function fcRemove(){if(selected.type==='cell'){let c=state.cells[selected.idx];state.cells[selected.idx]=null;return[c]}return state.cols[selected.col].splice(selected.idx)}
function fcCan(card,dest){if(!dest)return true;let red=card.s==='♥'||card.s==='♦',dr=dest.s==='♥'||dest.s==='♦';return VAL[dest.r]===VAL[card.r]+1&&red!==dr}
function moveFreeColumn(col){let arr=fcGet()? (selected.type==='cell'?[fcGet()]:state.cols[selected.col].slice(selected.idx)):[],card=arr[0],dest=state.cols[col].at(-1);if(!arr.length)return;if(selected.type==='fc-col'&&selected.col===col){selected=null;renderFreecell();return}let emptyCells=state.cells.filter(x=>!x).length,emptyCols=state.cols.filter(x=>!x.length).length;let capacity=(emptyCells+1)*Math.pow(2,emptyCols-(state.cols[col].length===0?1:0));if(arr.length>capacity){toast(`Сейчас можно переместить цепочку до ${capacity} карт`);return}if(!fcCan(card,dest)){toast('Нужно чередовать цвета и убывать на один ранг');return}saveUndo();state.cols[col].push(...fcRemove());selected=null;renderFreecell()}
function moveToCell(i){if(state.cells[i]){toast('Ячейка уже занята');return}let c=fcGet();if(!c)return;saveUndo();fcRemove();state.cells[i]=c;selected=null;renderFreecell()}
function freeToFoundation(i){let c=fcGet();if(!c)return;let p=state.found[i],top=p.at(-1);if(c.s!==SUITS[i]||(!top&&c.r!=='A')||(top&&VAL[c.r]!==VAL[top.r]+1)){toast('Сейчас эту карту нельзя собрать');return}saveUndo();fcRemove();p.push(c);selected=null;renderFreecell()}
function autoFoundation(){let moved=true,count=0;while(moved){moved=false;for(let i=0;i<8;i++){let c=state.cols[i].at(-1);if(c&&canAuto(c)){let f=SUITS.indexOf(c.s);state.cols[i].pop();state.found[f].push(c);count++;moved=true}}for(let i=0;i<4;i++){let c=state.cells[i];if(c&&canAuto(c)){state.cells[i]=null;state.found[SUITS.indexOf(c.s)].push(c);count++;moved=true}}}renderFreecell();toast(count?`Собрано карт: ${count}`:'Нет безопасных карт для автосбора')}
function canAuto(c){let p=state.found[SUITS.indexOf(c.s)],top=p.at(-1);if(!top)return c.r==='A';if(VAL[c.r]!==VAL[top.r]+1)return false;let opposite=state.found.filter((x,i)=>i!==SUITS.indexOf(c.s)&&x.length).map(x=>VAL[x.at(-1).r]);return opposite.length===0||VAL[c.r]<=Math.min(...opposite)+1}
function renderCurrent(){if(currentGame==='klondike')renderKlondike();else if(currentGame==='freecell')renderFreecell();else renderDurak()}
function hint(){if(currentGame==='durak'){let s=state;if(s.phase==='attack'&&s.attacker===0){let i=s.players[0].hand.findIndex(c=>!s.table.length||s.table.some(x=>x.a.r===c.r||x.b?.r===c.r));if(i>=0){selected=i;renderDurak();toast('Попробуйте атаковать этой картой')}else toast('Подходящей карты для подкидывания нет')}else if(s.phase==='defend'&&s.defender===0){let i=s.players[0].hand.findIndex(c=>{let p=s.table.find(x=>!x.b);return p&&isBeat(c,p.a,s.trump)});if(i>=0){selected=i;renderDurak();toast('Эта карта может отбиться')}else toast('Возможно, стоит взять карты')}else toast('Сейчас ход соперника');return}
 if(currentGame==='klondike'){for(let i=0;i<4;i++){let c=state.waste.at(-1);if(c&&canFoundationK(c,i)){toast('Верхнюю карту сброса можно отправить в базу');return}}toast('Ищите карту другого цвета на ранг старше или откройте колоду');return}
 toast('Проверьте тузы и следующие карты для базовых стопок. Освобождайте ячейки.')}
function canFoundationK(c,i){let p=state.found[i],top=p.at(-1);return c.s===SUITS[i]&&(!top?c.r==='A':VAL[c.r]===VAL[top.r]+1)}
function help(){let content={durak:'<ul><li>Атакуйте картой любого достоинства.</li><li>Защищайтесь картой той же масти старше либо козырем.</li><li>Подкидывать можно только достоинства, уже лежащие на столе.</li><li>«Бито» завершает успешную защиту, «Взять» забирает карты.</li></ul>',klondike:'<ul><li>Стройте столбцы по убыванию с чередованием цветов.</li><li>Пустой столбец доступен только королю.</li><li>Базовые стопки собираются по мастям от туза к королю.</li><li>Нажмите карту, затем место назначения.</li></ul>',freecell:'<ul><li>Все карты открыты с начала партии.</li><li>В столбцах чередуйте цвета и уменьшайте ранг.</li><li>Четыре свободные ячейки хранят по одной карте.</li><li>Базовые стопки собираются по мастям от туза до короля.</li></ul>'};$('#modalEyebrow').textContent='ПРАВИЛА И ПОДСКАЗКИ';$('#modalTitle').textContent='Как играть';$('#modalBody').innerHTML=content[currentGame];$('#modalPrev').style.display='none';$('#modalNext').textContent='Понятно';$('#modal').classList.add('open')}
$$('[data-game]').forEach(el=>el.onclick=()=>setupGame(el.dataset.game));
$('#homeBtn').onclick=()=>showScreen('lobby');$('#setupBack').onclick=()=>showScreen('lobby');$('#startBtn').onclick=startGame;
$('#botChoices').onclick=e=>{let b=e.target.closest('[data-bots]');if(!b)return;bots=+b.dataset.bots;$$('[data-bots]').forEach(x=>x.classList.toggle('selected',x===b))};
$('#botChoices').querySelector('[data-bots="3"]').classList.add('selected');
$$('[data-level]').forEach(el=>el.onclick=()=>{level=el.dataset.level;$$('[data-level]').forEach(x=>x.classList.toggle('selected',x===el));$('#setupHint').textContent={easy:'Новичок — боты чаще рискуют и иногда пропускают сильные ходы.',normal:'Тактик — сбалансированная игра с разумными решениями.',hard:'Мастер — боты экономят козыри и выбирают более сильные ответы.'}[level]});
$('#leaveGame').onclick=()=>showScreen('lobby');$('#restartBtn').onclick=()=>{if(confirm('Начать эту игру заново?'))startGame()};$('#hintBtn').onclick=hint;$('#helpBtn').onclick=()=>{if(!state){setupGame(currentGame);return}help()};
$('#soundBtn').onclick=()=>{sound=!sound;$('#soundBtn').style.color=sound?'var(--gold)':'var(--muted)';toast(sound?'Звук включён':'Звук выключен')};
$('#modalClose').onclick=closeModal;$('#modalNext').onclick=()=>{if(tutorialStep<2&&$('#modalEyebrow').textContent.startsWith('ОБУЧЕНИЕ')){tutorialStep++;showTutorial()}else closeModal()};$('#modalPrev').onclick=()=>{tutorialStep=Math.max(0,tutorialStep-1);showTutorial()};
if('serviceWorker'in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
