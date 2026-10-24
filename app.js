const $=id=>document.getElementById(id), synth=window.speechSynthesis;
let current=0, mode='both', active=-1, running=false, runId=0, timer=null, voices=[], utterance=null, audioWatchdog=null;
function setStatus(s){$('status').textContent=s}
function render(){
 $('sectionTitle').textContent=sections[current][0];$('count').textContent=String(current+1).padStart(2,'0')+' / 14';$('progress').value=current+1;
 $('prev').disabled=current===0;$('next').disabled=current===13;
 $('play').innerHTML=running?'■ <span>停止</span>':'▶ <span>再開</span>'; $('play').disabled=false; $('displayMode').value=mode;
 document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('selected',b.dataset.mode===mode);b.setAttribute('aria-pressed',b.dataset.mode===mode)});
 $('phrases').replaceChildren();
 if(mode==='none'){$('phrases').innerHTML='<div class="hidden-sub"><b>声に、集中する。</b>字幕は非表示です。<br>意味を思い浮かべて話しましょう。</div>'}
 else sections[current][1].forEach((row,i)=>{let b=document.createElement('button');b.className='phrase'+(i===active?' active':'');b.setAttribute('aria-label','このフレーズを再生：'+(mode==='jaOnly'?row[2]:row[0]));if(['both','all'].includes(mode)){let p=document.createElement('div');p.className='pinyin';p.textContent=row[1];b.append(p)}if(mode!=='jaOnly'){let z=document.createElement('div');z.className='chinese';z.lang='zh-CN';z.textContent=row[0];b.append(z)}if(['ja','all','jaOnly'].includes(mode)){let j=document.createElement('div');j.className='japanese'+(mode==='jaOnly'?' japanese-only':'');j.textContent=row[2];b.append(j)}b.onclick=()=>start(false,i);$('phrases').append(b)});
 $('sections').replaceChildren();sections.forEach((s,i)=>{let b=document.createElement('button');b.className=i===current?'selected':'';b.setAttribute('aria-current',i===current?'step':'false');let n=document.createElement('span');n.className='num';n.textContent=String(i+1).padStart(2,'0');let t=document.createElement('span');t.textContent=s[0];b.append(n,t);b.onclick=()=>{document.querySelector('.block-picker').open=false;stop();current=i;start();if(window.innerWidth<761)$('sectionTitle').scrollIntoView({behavior:'smooth',block:'start'})};$('sections').append(b)});
}
function stop(message='再生を停止しました'){runId++;clearTimeout(timer);clearTimeout(audioWatchdog);if(synth)synth.cancel();running=false;active=-1;utterance=null;render();setStatus(message)}
function loadVoices(){if(!synth){setStatus('このブラウザは音声読み上げに対応していません。');return}let old=$('voice').value;voices=synth.getVoices().filter(v=>/^zh(-|_)/i.test(v.lang)&&!/(HK|yue)/i.test(v.lang+' '+v.name));$('voice').replaceChildren();voices.forEach((v,i)=>{let o=document.createElement('option');o.value=String(i);o.textContent=v.name+' · '+v.lang;$('voice').append(o)});if(voices.length){if(old&&voices[Number(old)])$('voice').value=old;else{let i=voices.findIndex(v=>/zh[-_]CN/i.test(v.lang));$('voice').value=String(Math.max(0,i))}}else{let o=document.createElement('option');o.textContent='中国語音声を読み込み中／未搭載';$('voice').append(o)}}
function start(all=false,only=null){$('enableAudio').hidden=true;stop('');if(!synth){setStatus('音声読み上げに対応したブラウザで開いてください。');return}loadVoices();if(!voices.length){setStatus('中国語の音声が見つかりません。端末の音声設定を確認し、SafariやChromeで開き直してください。');return}running=true;const id=runId;let queue=[];for(let s=current;s<(all?sections.length:current+1);s++)sections[s][1].forEach((r,p)=>{if(only===null||p===only)queue.push([s,p,r[0]])});let pos=0;function next(){if(id!==runId)return;if(pos===queue.length){if(!all&&$('loop').checked){pos=0;active=-1;render();setStatus('区間リピート · もう一度聞きましょう');timer=setTimeout(next,700);return}if(!all&&only===null&&current<sections.length-1){const following=current+1;queue=sections[following][1].map((r,p)=>[following,p,r[0]]);pos=0;next();return}running=false;active=-1;render();setStatus((all||only===null)?'最後まで再生しました。おつかれさまでした。':'このフレーズの練習が終わりました。');return}let [s,p,text]=queue[pos++];current=s;active=p;render();setStatus('参考音声を再生中 · フレーズ '+(p+1)+' / '+sections[s][1].length);let u=new SpeechSynthesisUtterance(text.replace(/…+/g,''));utterance=u;u.lang=voices[Number($('voice').value)].lang;u.voice=voices[Number($('voice').value)];u.rate=Number($('speed').value)*0.85;let started=performance.now();u.onstart=()=>{clearTimeout(audioWatchdog);started=performance.now()};u.onerror=e=>{if(id===runId&&e.error!=='canceled'&&e.error!=='interrupted'){stop('音声を開始できませんでした。下のボタンをタップしてください。');$('enableAudio').hidden=false}};u.onend=()=>{if(id!==runId)return;clearTimeout(audioWatchdog);if($('gap').checked){let duration=Math.max(1800,performance.now()-started)*Number($('gapLength').value);let until=Date.now()+duration;function tick(){if(id!==runId)return;let left=Math.ceil((until-Date.now())/1000);if(left<=0){next();return}setStatus('あなたの番です · 残り '+left+' 秒');timer=setTimeout(tick,200)}tick()}else if(text.includes('爸爸、妈妈')){setStatus('余韻 · 1秒');timer=setTimeout(next,1000)}else next()};audioWatchdog=setTimeout(()=>{if(id===runId){stop('自動再生が始まらない場合は、タップして開始してください。');$('enableAudio').hidden=false}},4000);synth.speak(u)}next()}
$('play').onclick=()=>running?stop():start();$('prev').onclick=()=>{stop();current=Math.max(0,current-1);start()};$('next').onclick=()=>{stop();current=Math.min(13,current+1);start()};document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render()});$('voice').onchange=()=>{start()};$('speed').onchange=()=>{start()};if(synth)synth.addEventListener('voiceschanged',loadVoices);window.addEventListener('pagehide',()=>stop());render();loadVoices();

function shuffleBlock(){
 stop('');
 current=Math.floor(Math.random()*sections.length);
 start();
}
$('shuffle').onclick=shuffleBlock;

$('enableAudio').onclick=()=>start();
let initialPlaybackAttempted=false;
function initialPlayback(){
 if(initialPlaybackAttempted||running)return;
 loadVoices();
 if(voices.length){initialPlaybackAttempted=true;start()}
}
if(synth)synth.addEventListener('voiceschanged',initialPlayback);
initialPlayback();

$('displayMode').onchange=()=>{mode=$('displayMode').value;render()};
function setPlaybackMode(repeat){
 $('loop').checked=repeat;
 $('continuousMode').classList.toggle('selected',!repeat);
 $('repeatMode').classList.toggle('selected',repeat);
 $('continuousMode').setAttribute('aria-pressed',String(!repeat));
 $('repeatMode').setAttribute('aria-pressed',String(repeat));
}
$('continuousMode').onclick=()=>setPlaybackMode(false);
$('repeatMode').onclick=()=>setPlaybackMode(true);
