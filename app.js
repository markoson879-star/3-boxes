(() => {
  const t = (id) => document.getElementById(id);
  const storeKey = "threeJars.githubPages.v7e";

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
              { name: "Мини-путешествие", target: 0, saved: 0 },
              { name: "master", target: 0, saved: 0 },
              { name: "мечта (mondial)", target: 0, saved: 0 },
              { name: "Илья", target: 0, saved: 0 },
              { name: "Эйлат 2026", target: 0, saved: 0 },
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
          { name: "Билет: концерт/выставка/мини-путешествие", target: 0, saved: 0 },
          { name: "gifts", target: 0, saved: 0 },
          { 
            name: "Apple", children: [
              { name: "iphone 17", target: 0, saved: 0 },
              { name: "ipad", target: 0, saved: 0 },
              { name: "macbook", target: 0, saved: 0 },
              { name: "apple watch", target: 0, saved: 0 },
              { name: "airpods", target: 0, saved: 0 },
            ]
          },
          { name: "Хобби/турнир (шахматы, настолки)", target: 0, saved: 0 },
          { name: "Онлайн-курс", target: 0, saved: 0 },
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
          { name: "Посадка деревьев / эко-проекты", target: 0, saved: 0 },
          { name: "Yad Sarah", target: 0, saved: 0 },
          { name: "Fahlo Track", target: 0, saved: 0 },
        ]
      }
    ]
  };

  let state = load();
  function load(){
    try{
      const raw = localStorage.getItem(storeKey);
      if(!raw) return structuredClone(defaultState);
      const data = JSON.parse(raw);
      return Object.assign(structuredClone(defaultState), data);
    }catch(e){ return structuredClone(defaultState); }
  }
  function save(){ localStorage.setItem(storeKey, JSON.stringify(state)); }
  function fmt(v){ return (Math.round((v + Number.EPSILON)*100)/100).toLocaleString('ru-RU', {maximumFractionDigits:2}); }
  function pct(a,b){ return b>0 ? Math.min(100, (a/b)*100) : 0; }

  // Allocate to selected jar (free funds)
  t("allocateBtn").addEventListener("click", ()=>{
    const income = Number(t("incomeInput").value);
    const jarIdx = Number(t("jarSelect").value);
    if(!Number.isFinite(income) || income<=0){ t("incomeInput").focus(); return; }
    state.jars[jarIdx].free += income;
    t("incomeInput").value = "";
    save(); render();
  });

  // Spend from free per jar
  ["0","1","2"].forEach(i=>{
    const btn = document.getElementById("spend"+i+"Btn");
    if(btn){
      btn.addEventListener("click", ()=>{
        const amtInput = document.getElementById("spend"+i+"Amt");
        const noteInput = document.getElementById("spend"+i+"Note");
        const amt = Number(amtInput.value);
        if(!Number.isFinite(amt) || amt<=0){ amtInput.focus(); return; }
        if(amt > state.jars[i].free){ alert("Недостаточно свободных средств."); return; }
        state.jars[i].free -= amt;
        amtInput.value=""; if(noteInput) noteInput.value="";
        save(); render();
      });
    }
  });

  const groupTpl = document.getElementById("subgoalGroupTpl");
  const leafTpl = document.getElementById("subgoalLeafTpl");

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
      addAmt.value=""; save(); render();
    });

    const spendAmt = node.querySelector(".sg-spend-amt");
    node.querySelector(".sg-spend-btn").addEventListener("click", ()=>{
      const v = Number(spendAmt.value);
      if(!Number.isFinite(v) || v<=0){ spendAmt.focus(); return; }
      if(v > sg.saved){ alert("Недостаточно средств в подцели."); return; }
      sg.saved -= v;
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
    const box0 = t("subgoals0"); if(!box0) return;
    box0.innerHTML="";
    state.jars[0].subgoals.forEach((sg, idx)=>{
      if(sg.children && Array.isArray(sg.children)){
        box0.appendChild(makeGroupNode(0, idx, sg));
      } else {
        box0.appendChild(makeLeafNode(0, idx, null, sg));
      }
    });
  }

  function renderJar1(){
    const box1a = t("subgoals1a"); const box1b = t("subgoals1b");
    if(!box1a || !box1b) return;
    box1a.innerHTML=""; box1b.innerHTML="";
    state.jars[1].subgoals.forEach((sg, idx)=>{
      (idx<=1 ? box1a : box1b).appendChild(
        sg.children ? makeGroupNode(1, idx, sg) : makeLeafNode(1, idx, null, sg)
      );
    });
  }

  function renderJar2(){
    const box2 = t("subgoals2"); if(!box2) return;
    box2.innerHTML="";
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
  }

  // Reset / Export / Import
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
    a.href = url; a.download = "three-jars-export.json"; document.body.appendChild(a); a.click();
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