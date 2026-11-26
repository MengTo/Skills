const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function setType(root) {
  // Keep each heading's natural ink width, line breaks, and accessible name.
  const headings=[...root.querySelectorAll("h1,h2,.ap-caption h3")].filter(el=>!el.closest("[hidden]") && el.textContent.trim());
  for(const heading of headings){
    const tree=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(tree.nextNode())nodes.push(tree.currentNode);
    const label=heading.textContent.trim().replace(/\s+/g," ");
    const count=nodes.reduce((n,t)=>n+Array.from(t.data.trim()).filter(c=>c.trim()).length,0);
    let index=0;
    heading.setAttribute("aria-label",heading.getAttribute("aria-label") || label);
    for(const text of nodes){
      const frag=document.createDocumentFragment();
      for(const word of text.data.split(/(\s+)/)){
        if(!word.trim()){frag.append(word);continue}
        const group=document.createElement("span");group.className="ink-word";group.setAttribute("aria-hidden","true");
        for(const char of Array.from(word)){
          const letter=document.createElement("span");letter.className="ink-letter";
          letter.style.setProperty("--order",(index++ / Math.max(1,count-1)*.66).toFixed(4));letter.textContent=char;group.append(letter);
        }
        frag.append(group);
      }
      text.replaceWith(frag);
    }
    heading.classList.add("letterpress");
  }
  return headings;
}

export function startEngraving(page,story) {
  const spread=story.querySelector(".hf-spread");
  const field=page.querySelector(".testimonial-art");
  const paper=spread.querySelector(".hf-paper-print");
  const controls=new AbortController(), reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const hover=matchMedia("(hover: hover) and (pointer: fine)");
  const titles=setType(page);
  const scrollTitles=titles.filter(el=>!el.closest(".hf-stage"));
  const visible=new Set();
  const roots=field?[spread,field]:[spread];
  let active=null,pointerFrame=0,scrollFrame=0,smoothX=0,smoothY=0,goalX=0,goalY=0,spotX=.5,spotY=.5;
  const eventOpts={passive:true,signal:controls.signal};
  const observer=new IntersectionObserver(entries=>{
    for(const e of entries){
      if(e.isIntersecting)visible.add(e.target);
      else {
        visible.delete(e.target);
        if(e.target.classList.contains("letterpress")) e.target.style.setProperty("--type-progress",e.boundingClientRect.top<0?"1":"0");
      }
    }
    scroll();
  },{root:page,rootMargin:"14% 0px"});
  scrollTitles.forEach(el=>observer.observe(el));if(field)observer.observe(field);

  function drawScroll(){
    scrollFrame=0;
    if(reduced.matches)return;
    const height=page.clientHeight,rootTop=page.getBoundingClientRect().top;
    for(const el of visible){
      const box=el.getBoundingClientRect(),y=box.top-rootTop;
      if(el===field){
        const weight=clamp((height*.5-y-box.height*.5)/((height+box.height)*.5),-1,1);
        el.style.setProperty("--field-travel",weight.toFixed(4));
      }else{
        // The reveal finishes early enough to read a title from the bottom of a laptop.
        const amount=clamp((height*.975-y)/Math.min(height*.25,Math.max(106,box.height*.88)));
        el.style.setProperty("--type-progress",amount.toFixed(4));
      }
    }
  }
  function scroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(drawScroll)}

  function drawPointer(){
    pointerFrame=0;
    if(!active || reduced.matches || !hover.matches)return;
    smoothX+=(goalX-smoothX)*.33;smoothY+=(goalY-smoothY)*.33;
    active.style.setProperty("--relief-x",smoothX.toFixed(3));
    active.style.setProperty("--relief-y",smoothY.toFixed(3));
    active.style.setProperty("--foil-x",(spotX*100).toFixed(2)+"%");
    active.style.setProperty("--foil-y",(spotY*100).toFixed(2)+"%");
    if(Math.abs(goalX-smoothX)+Math.abs(goalY-smoothY)>.008)pointerFrame=requestAnimationFrame(drawPointer);
  }
  function release(){
    if(active) {
      active.removeAttribute("data-lit");
      active.style.setProperty("--relief-x","0");active.style.setProperty("--relief-y","0");
    }
    active=null;smoothX=smoothY=0;cancelAnimationFrame(pointerFrame);pointerFrame=0;
  }
  function point(event){
    if(!hover.matches || reduced.matches || event.pointerType==="touch")return;
    const el=event.currentTarget;
    if(active!==el){release();active=el;el.setAttribute("data-lit","");}
    const box=el.getBoundingClientRect();spotX=clamp((event.clientX-box.left)/Math.max(box.width,1));spotY=clamp((event.clientY-box.top)/Math.max(box.height,1));
    goalX=spotX*2-1;goalY=spotY*2-1;
    if(!pointerFrame)pointerFrame=requestAnimationFrame(drawPointer);
  }
  roots.forEach(el=>{el.addEventListener("pointermove",point,eventOpts);el.addEventListener("pointerleave",release,eventOpts);el.addEventListener("pointercancel",release,eventOpts)});
  // A single scan on entering each plate. Hover and keyboard refocus can replay it.
  const scanTargets=[...page.querySelectorAll(".hf-register-list li,.demo-window,.testimonial-art")];
  const scanObserver=new IntersectionObserver(entries=>{
    for(const e of entries) e.target.toggleAttribute("data-impressed",e.isIntersecting);
  },{root:page,threshold:.22});
  scanTargets.forEach(el=>scanObserver.observe(el));
  function preferences(){release();scroll()}
  hover.addEventListener("change",preferences,{signal:controls.signal});
  reduced.addEventListener("change",preferences,{signal:controls.signal});
  page.addEventListener("scroll",scroll,eventOpts);window.addEventListener("resize",scroll,eventOpts);
  page.classList.add("engraved-edition");paper.setAttribute("data-printed","");
  drawScroll();
  return ()=>{release();controls.abort();observer.disconnect();scanObserver.disconnect();cancelAnimationFrame(scrollFrame)};
}
