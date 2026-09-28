import './feedback.js';
// Move existing controls without replacing their handlers or stored preferences.
const settings=document.getElementById('stSettings');
const css=document.createElement('link');css.rel='stylesheet';css.href='/styles-options.css';document.head.append(css);
function arrange(){if(!settings||settings.dataset.polished)return;const log=document.getElementById('stGameLogSetting'),audio=document.getElementById('csAudioOptions');if(!log||!audio)return;settings.dataset.polished='true';settings.querySelector('.st-settings-title').textContent='OPTIONS';
const section=title=>{const s=document.createElement('section'),h=document.createElement('h3');h.textContent=title;s.append(h);return s;};const general=section('GENERAL'),support=section('SUPPORT');general.className='cs-options-general';support.className='cs-options-support';for(const id of ['stGameLogSetting','stAimAssist','stPopups'])general.append(document.getElementById(id).closest('.st-setting-row'));support.append(document.getElementById('stBugReport').closest('.st-setting-row'));settings.append(general,audio,support,document.getElementById('stMainMenuFromSettings').closest('.st-setting-row'));observer.disconnect();}
const observer=new MutationObserver(arrange);if(settings)observer.observe(settings,{childList:true,subtree:true});arrange();
