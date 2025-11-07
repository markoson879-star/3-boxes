(() => {
  const $ = (s) => document.querySelector(s);
  const t = (id) => document.getElementById(id);
  const storeKey = "threeJars.v5";

  const defaultState = {
    jars: [
      {
        name: "Главная цель",
        free: 0,
        subgoals: [
          { 
            name: "Invest", children: [
              { name: "Акция Microsoft", target: 0, saved: 0 },
              { name: "Meitav", target: 0, saved: 0 },
              { name: "2 портфель", target: 0, saved: 0 },
            ]
          },
          { name: "Резерв", target: 0, saved: 0 },
          { name: "Дом", target: 0, saved: 0 },
          { 
            name: "Travel 2025–2027", children: [
              { name: "Большое путешествие", target: 0, saved: 0 },
              { name: "Мини‑путешествие", target: 0, saved: 0 },
            ]
          },
          { name: "Car", target: 0, saved: 0 },
          { name: "Фонд развития", target: 0, saved: 0 },
        ]
      },
      {
        name: "Фонд радости",
        free: 0,
        subgoals: [
          { name: "Билет: кино/выставка/мини‑путешествие", target: 0, saved: 0 },
          { name: "Подарок другу", target: 0, saved: 0 },
          { name: "Концерт или музей", target: 0, saved: 0 },
          { name: "Новые наушники", target: 0, saved: 0 },
          { name: "Хобби/турнир (шахматы, настолки)", target: 0, saved: 0 },
          { name: "Онлайн‑курс", target: 0, saved: 0 },
          { name: "Подарок кому-то", target: 0, saved: 0 },
          { name: "Подписка", target: 0, saved: 0 },
          { name: "Аксессуары для путешествий (сумка, powerbank)", target: 0, saved: 0 },
        ]
      },
      {
        name: "Копилка добра",
        free: 0,
        subgoals: [
          { name: "Еда для нуждающихся", target: 0, saved: 0 },
          { name: "Фонд поддержки детей", target: 0, saved: 0 },
          { name: "Приют для животных", target: 0, saved: 0 },
          { name: "Посадка деревьев / эко‑проекты", target: 0, saved: 0 },
          { name: "Yad Sarah", target: 0, saved: 0 },
          { name: "Fahlo Track", target: 0, saved: 0 },
        ]
      }
    ],
    history: [] // {ts, type:'alloc'|'spend_free'|'assign'|'spend_sub', jar, subIdx?, childIdx?, amount, extra?}
  };

  let state = load();

  function load(){
    try{
      const raw = localStorage.getItem(storeKey);
      if(!raw) return structuredClone(defaultState);
      const data = JSON.parse(raw);
      return Object.assign(structuredClone(defaultState), data);
    }catch(e){ console.warn("load err", e); return structuredClone(defaultState); }
  }
  function save(){ localStorage.setItem(storeKey, JSON.stringify(state)); }
  function fmt(v){ return (Math.round((v + Number.EPSILON)*100)/100).toLocaleString('ru-RU', {maximumFractionDigits:2}); }
  function pct(a,b){ return b>0 ? Math.min(100, (a/b)*100) : 0; }

  // Allocate to selected jar
  t("allocateBtn").addEventListener("click", ()=>{
    const income = Number(t("incomeInput").value);
    const jarIdx = Number(t("jarSelect").value);
    if(!Number.isFinite(income) || income<=0){ t("incomeInput").focus(); return; }
    state.jars[jarIdx].free += income;
    state.history.push({ts:Date.now(), type:'alloc', jar:jarIdx, amount:income, extra:`+ в «${state.jars[jarIdx].name}»`});
    t("incomeInput").value="";
    save(); render();
  });

  // Spend from free
  ["0","1","2"].forEach(i=>{
    t("spend"+i+"Btn").addEventListener("click", ()=>{
      const amtInput = t("spend"+i+"Amt");
      const noteInput = t("spend"+i+"Note");
      const amt = Number(amtInput.value);
      if(!Number.isFinite(amt) || amt<=0){ amtInput.focus(); return; }
      if(amt > state.jars[i].free){ alert("Недостаточно свободных средств."); return; }
      state.jars[i].free -= amt;
      state.history.push({ts:Date.now(), type:'spend_free', jar:Number(i), amount:amt, extra:(noteInput.value||'').trim()});
      amtInput.value=""; noteInput.value="";
      save(); render();
    });
  });

  const groupTpl = t("subgoalGroupTpl");
  const leafTpl = t("subgoalLeafTpl");
  const rowTpl = t("rowTpl");

  function aggregateGroup(g){
    if(!g.children) return {saved:g.saved||0, target:g.target||0};
    const saved = g.children.reduce((s,c)=> s+(c.saved||0), 0);
    const target = g.children.reduce((s,c)=> s+(c.target||0), 0);
    return {saved, target};
  }

  function makeLeafNode(jarIdx, subIdx, childIdx, sg){
    const node = leafTpl.content.firstElementChild.cloneNode(true);
    if(childIdx !== null && childIdx !== undefined){ node.classList.add("child"); }
    node.querySelector(".sg-name").textContent = sg.name;
    node.querySelector(".sg-target").textContent = fmt(sg.target||0);
    node.querySelector(".sg-saved").textContent = fmt(sg.saved||0);
    const p = pct(sg.saved, sg.target);
    node.querySelector(".sg-pct").textContent = (Math.round(p*10)/10)+"%";
    node.querySelector(".progress-bar").style.width = p+"%";

    const targetInput = node.querySelector(".sg-target-input");
    targetInput.value = sg.target || "";
    targetInput.addEventListener("input", ()=>{
      sg.target = Number(targetInput.value||0);
      save(); render();
    });

    const addAmt = node.querySelector(".sg-add-amt");
    node.querySelector(".sg-add-btn").addEventListener("click", ()=>{
      const v = Number(addAmt.value);
      if(!Number.isFinite(v) || v<=0){ addAmt.focus(); return; }
      const jar = state.jars[jarIdx];
      if(v > jar.free){ alert("Недостаточно свободных средств в баночке."); return; }
      jar.free -= v; sg.saved += v;
      state.history.push({ts:Date.now(), type:'assign', jar:jarIdx, subIdx, childIdx, amount:v, extra: sg.name});
      addAmt.value=""; save(); render();
    });

    const spendAmt = node.querySelector(".sg-spend-amt");
    node.querySelector(".sg-spend-btn").addEventListener("click", ()=>{
      const v = Number(spendAmt.value);
      if(!Number.isFinite(v) || v<=0){ spendAmt.focus(); return; }
      if(v > sg.saved){ alert("Недостаточно средств в подцели."); return; }
      sg.saved -= v;
      state.history.push({ts:Date.now(), type:'spend_sub', jar:jarIdx, subIdx, childIdx, amount:v, extra: sg.name});
      spendAmt.value=""; save(); render();
    });

    return node;
  }

  function makeGroupNode(jarIdx, subIdx, g){
    const node = groupTpl.content.firstElementChild.cloneNode(true);
    node.querySelector(".sg-name").textContent = g.name;

    const aggr = aggregateGroup(g);
    node.querySelector(".sg-target").textContent = fmt(aggr.target);
    node.querySelector(".sg-saved").textContent = fmt(aggr.saved);
    const p = pct(aggr.saved, aggr.target);
    node.querySelector(".sg-pct").textContent = (Math.round(p*10)/10)+"%";
    node.querySelector(".progress-bar").style.width = p+"%";

    const childrenBox = node.querySelector(".children");
    g.children.forEach((child, cIdx)=>{
      const childNode = makeLeafNode(jarIdx, subIdx, cIdx, child);
      childrenBox.appendChild(childNode);
    });

    return node;
  }

  function renderJar0(){
    const box0 = t("subgoals0"); box0.innerHTML="";
    state.jars[0].subgoals.forEach((sg, idx)=>{
      if(sg.children && Array.isArray(sg.children)){
        box0.appendChild(makeGroupNode(0, idx, sg));
      } else {
        box0.appendChild(makeLeafNode(0, idx, null, sg));
      }
    });
  }

  function renderJar1(){
    const box1a = t("subgoals1a"); box1a.innerHTML="";
    const box1b = t("subgoals1b"); box1b.innerHTML="";
    state.jars[1].subgoals.forEach((sg, idx)=>{
      (idx<=2 ? box1a : box1b).appendChild(makeLeafNode(1, idx, null, sg));
    });
  }

  function renderJar2(){
    const box2 = t("subgoals2"); box2.innerHTML="";
    state.jars[2].subgoals.forEach((sg, idx)=>{
      box2.appendChild(makeLeafNode(2, idx, null, sg));
    });
  }

  function render(){
    t("jar0Free").textContent = fmt(state.jars[0].free);
    t("jar1Free").textContent = fmt(state.jars[1].free);
    t("jar2Free").textContent = fmt(state.jars[2].free);

    renderJar0();
    renderJar1();
    renderJar2();

    // History
    const box = t("history"); box.innerHTML="";
    if(state.history.length===0){
      const empty = document.createElement("div");
      empty.className="muted"; empty.textContent="Пока пусто. Пополняйте баночки и распределяйте по подцелям.";
      box.appendChild(empty);
    } else {
      [...state.history].reverse().forEach(h=>{
        const n = rowTpl.content.firstElementChild.cloneNode(true);
        n.querySelector(".when").textContent = new Date(h.ts).toLocaleString("ru-RU");
        if(h.type==='alloc'){
          n.querySelector(".amount").textContent = "+"+fmt(h.amount)+" ₪";
          n.querySelector(".amount").style.color = "#065f46";
          n.querySelector(".split-detail").textContent = ["Главная цель","Фонд радости","Копилка добра"][h.jar] + " — пополнение свободных • " + (h.extra||"");
        } else if(h.type==='spend_free'){
          n.querySelector(".amount").textContent = "−"+fmt(h.amount)+" ₪";
          n.querySelector(".amount").style.color = "#b91c1c";
          n.querySelector(".split-detail").textContent = ["Главная цель","Фонд радости","Копилка добра"][h.jar] + " — свободные • " + (h.extra||"");
        } else if(h.type==='assign'){
          n.querySelector(".amount").textContent = "→ "+fmt(h.amount)+" ₪";
          n.querySelector(".amount").style.color = "#1d4ed8";
          n.querySelector(".split-detail").textContent = ["Главная цель","Фонд радости","Копилка добра"][h.jar] + " → подцель: " + (h.extra||"");
        } else if(h.type==='spend_sub'){
          n.querySelector(".amount").textContent = "−"+fmt(h.amount)+" ₪";
          n.querySelector(".amount").style.color = "#b91c1c";
          n.querySelector(".split-detail").textContent = ["Главная цель","Фонд радости","Копилка добра"][h.jar] + " — подцель: " + (h.extra||"");
        }
        box.appendChild(n);
      });
    }
  }

  // Undo
  t("undoBtn").addEventListener("click", ()=>{
    const h = state.history.pop();
    if(!h){ return; }
    if(h.type==='alloc'){
      state.jars[h.jar].free = Math.max(0, state.jars[h.jar].free - h.amount);
    } else if(h.type==='spend_free'){
      state.jars[h.jar].free += h.amount;
    } else if(h.type==='assign'){
      const sg = state.jars[h.jar].subgoals[h.subIdx];
      if(sg?.children && h.childIdx !== null && h.childIdx !== undefined){
        const child = sg.children[h.childIdx];
        if(child){ child.saved -= h.amount; state.jars[h.jar].free += h.amount; }
      } else if(sg){
        sg.saved -= h.amount; state.jars[h.jar].free += h.amount;
      }
    } else if(h.type==='spend_sub'){
      const sg = state.jars[h.jar].subgoals[h.subIdx];
      if(sg?.children && h.childIdx !== null && h.childIdx !== undefined){
        const child = sg.children[h.childIdx];
        if(child){ child.saved += h.amount; }
      } else if(sg){
        sg.saved += h.amount;
      }
    }
    save(); render();
  });

  // Export/Import/Reset
  t("resetBtn").addEventListener("click", ()=>{
    if(confirm("Сбросить все данные?")){
      state = structuredClone(defaultState);
      save(); render();
    }
  });
  t("exportBtn").addEventListener("click", ()=>{
    const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "three-jars-v5-export.json"; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
  });
  t("importInput").addEventListener("change", async (e)=>{
    const file = e.target.files[0]; if(!file) return;
    try{
      const text = await file.text();
      const data = JSON.parse(text);
      if(!Array.isArray(data.jars)) throw new Error("bad shape");
      state = Object.assign(structuredClone(defaultState), data);
      save(); render(); alert("Импорт выполнен.");
    }catch(err){ alert("Ошибка импорта файла."); }
    finally{ e.target.value=""; }
  });

  render();
})();