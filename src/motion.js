/* Motion thesis: the same words persist through the journey. Feedback is brief;
   the only repeating signature is the closing name, paused when not visible. */
(()=>{
 const gs=window.gsap;if(!gs||!window.ScrollToPlugin)return;
 gs.registerPlugin(window.ScrollToPlugin);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const app=document.getElementById('app');
 let context=null,visibleObserver=null,errorObserver=null,loopObserver=null,loop=null,paused=false,loopVisible=false;
 const seconds=name=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))/1000;
 function syncLoop(){if(loop)loop.paused(paused||!loopVisible||document.hidden||reduced.matches)}
 function clean(){gs.killTweensOf(app.querySelectorAll('*'));context?.revert();context=null;visibleObserver?.disconnect();errorObserver?.disconnect();loopObserver?.disconnect();loop=null;gs.killTweensOf(window);}
 function enter(targets,duration=.4){if(!targets?.length||reduced.matches)return;gs.fromTo(targets,{y:12,opacity:.65},{y:0,opacity:1,duration,stagger:.04,ease:'power3.out',clearProps:'transform,opacity,willChange',onStart(){gs.set(targets,{willChange:'transform,opacity'})}})}
 function feedback(){
  const error=document.getElementById('error');if(!error)return;
  errorObserver=new MutationObserver(()=>{
   if(!error.textContent.trim())return;
   const field=app.querySelector('input:not([readonly]),textarea');if(!field)return;
   field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby','error');field.focus({preventScroll:true});
   if(!reduced.matches)gs.fromTo(field,{x:0},{keyframes:[{x:6},{x:-6},{x:4},{x:0}],duration:.28,ease:'power2.out',overwrite:true,clearProps:'transform'});
  });errorObserver.observe(error,{childList:true,characterData:true,subtree:true});
 }
 function refresh(){
  clean();
  context=gs.context(()=>{
   if(document.body.dataset.screen==='landing'){
    // Arabic stays intact: animate whole words/elements, never split joined letters.
    enter(app.querySelectorAll('.name-band h1,.hero h1,.hero-links>*,.hero-description,.hero>div>p,#start,.portrait,.hero-rail>.rail-cell,.hero-demo>.ui-fragment'),.5);
    visibleObserver=new IntersectionObserver(entries=>{
     for(const entry of entries)if(entry.isIntersecting){enter(entry.target.querySelectorAll('h2,article>p,.ui-fragment,.showcase-copy>p,.close-bottom>*'));visibleObserver.unobserve(entry.target)}
    },{threshold:.08});app.querySelectorAll('.landing-section').forEach(el=>visibleObserver.observe(el));
    const track=app.querySelector('.marquee-inner');
    if(track&&!reduced.matches){
     loop=gs.to(track,{xPercent:-25,duration:24,repeat:-1,ease:'none',paused:true});
     loopObserver=new IntersectionObserver(entries=>{loopVisible=entries[0].isIntersecting;syncLoop()});loopObserver.observe(track.parentElement);
    }
    const toggle=document.getElementById('motion-toggle');if(toggle){toggle.setAttribute('aria-pressed',String(paused));toggle.textContent=paused?'تشغيل الحركة':'إيقاف الحركة';toggle.onclick=()=>{paused=!paused;toggle.setAttribute('aria-pressed',String(paused));toggle.textContent=paused?'تشغيل الحركة':'إيقاف الحركة';syncLoop()}}
   }else{enter(app.querySelectorAll('.flow>h1,.preview-intro,.flow>label,.flow>.field,.flow>.options,.professional-page'),seconds('--duration-fast'));feedback()}
  },app);
 }
 const baseRender=render;
 render=function(){clean();baseRender();refresh()};
 // One delegated listener survives every render; scrolling remains interruptible.
 document.addEventListener('click',event=>{
  const anchor=event.target.closest('a[href^="#"]');if(!anchor||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
  const hash=anchor.getAttribute('href');if(hash.length<2)return;
  const target=document.getElementById(hash.slice(1));if(!target)return;
  event.preventDefault();gs.killTweensOf(window);
  const focus=()=>{if(!target.matches('input,button,a,textarea,select'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true})};
  if(reduced.matches){target.scrollIntoView();focus()}else gs.to(window,{scrollTo:{y:target,offsetY:24,autoKill:true},duration:seconds('--duration-slow'),ease:'power3.out',onComplete:focus});
 });
 app.addEventListener('input',event=>{if(event.target.matches('input,textarea')){event.target.removeAttribute('aria-invalid');if(event.target.getAttribute('aria-describedby')==='error')event.target.removeAttribute('aria-describedby');const error=document.getElementById('error');if(error)error.textContent=''}});
 document.addEventListener('visibilitychange',syncLoop);
 reduced.addEventListener('change',refresh);
 window.addEventListener('pagehide',clean);
 window.addEventListener('pageshow',event=>{if(event.persisted)refresh()});
 window.atharMotion={refresh,beforeExample(){gs.killTweensOf('#demo-text')},afterExample(){const el=document.getElementById('demo-text');if(!reduced.matches)gs.fromTo(el,{opacity:.35,y:4},{opacity:1,y:0,duration:seconds('--duration-quick'),ease:'power2.out',clearProps:'transform,opacity'})}};
 refresh();
})();
