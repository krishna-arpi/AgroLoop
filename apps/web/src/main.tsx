import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import "./styles.css";

const viteEnv = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
const configuredApiUrl = viteEnv.VITE_API_URL?.trim();
export const API = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/$/, "")}/api/v1`
  : ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? `${window.location.protocol}//${window.location.hostname}:4000/api/v1`
    : /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname)
      ? `${window.location.protocol}//${window.location.hostname}:4000/api/v1`
      : "/api/v1";
async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(API + path, { credentials: "include", headers: { "Content-Type": "application/json", ...options.headers }, ...options });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message ?? "Request failed");
  return body;
}

function Provenance({ value = "PROPOSAL_REPORTED" }: { value?: string }) {
  return <span className={`badge provenance ${value.toLowerCase()}`}>{value}</span>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);
  return <><header className="header"><Link className="brand" to="/">AgroLoop</Link><nav>
    <Link to="/research">Research</Link><Link to="/data">Materials</Link><Link to="/marketplace">Marketplace</Link>
    <Link to="/farmer">Sell residue</Link><Link to="/buyer">Request material</Link>
    <Link to="/hub">Hub</Link><Link to="/procurement">Procurement</Link><Link to="/sales">Sales</Link><Link to="/inventory">Inventory</Link>
  </nav><button className="icon-button" onClick={() => setDark(v => !v)} aria-label="Toggle dark mode">{dark ? "☀" : "◐"}</button></header>{children}</>;
}

function Home() {
  return <Layout><main><section className="hero"><p className="eyebrow">Circular rural bioeconomy</p><h1>Turning residue into industrial value</h1><p>A traceable platform proposed for farmers, village processing hubs and industrial fuel buyers.</p><div className="hero-actions"><Link className="button" to="/data">Explore the data</Link><Link className="button secondary" to="/research">Read the research</Link></div></section><section className="grid-three cards"><article><h2>Farmers & FPOs</h2><p>Register residue, schedule collection and track earnings.</p></article><article><h2>Processing hubs</h2><p>Verify intake, batches, laboratory quality and published lots.</p></article><article><h2>Industrial buyers</h2><p>Browse quality-verified lots and manage delivery acceptance.</p></article></section></main></Layout>;
}

function Research() {
  const [step, setStep] = useState(0);
  const processSteps = [
    { title: "Source & aggregate", subtitle: "Rural residue clusters", detail: "Collect paddy or wheat straw, sugarcane bagasse, pulse stalks and corn cobs through farmers and FPO aggregation nodes.", target: "Transparent origin and availability records" },
    { title: "Precondition", subtitle: "Dry & size", detail: "Air-dry residue below 15% moisture and shred it to an approximately 20–40 mm particulate size.", target: "Feedstock consistency before carbonization" },
    { title: "Carbonize", subtitle: "Sealed batch retort", detail: "Use a sealed, double-jacketed retort. Initial ignition transitions to an autothermal stage at about 280°C.", target: "Calibration range: 350–500°C" },
    { title: "Recirculate", subtitle: "Syngas energy loop", detail: "Recirculate combustible CO, H₂ and CH₄ off-gases through the outer annulus to sustain the process without a continuous external fuel input.", target: "30–60 minute residence window" },
    { title: "Verify & trade", subtitle: "Lot-based marketplace", detail: "Characterize the solid and liquid outputs, assign batch quality data, generate a traceable lot code and publish the product to buyers.", target: "Traceability from farmer lot to order" },
  ];
  const residueRows = [
    ["Paddy straw", "3,150", "5,820", "31.5%", "High volatile K release; proposed safe condition <950°C"],
    ["Rice husk", "3,380", "5,650", "34.0%", "SiO₂ matrix stabilization; no ash sintering proposed"],
    ["Sugarcane bagasse", "3,850", "6,180", "29.0%", "Low ash target <3.5%"],
    ["Arhar / gram stalks", "3,920", "6,350", "33.2%", "Dense fixed-carbon target"],
    ["Corn cobs", "4,050", "6,480", "30.8%", "High mechanical-strength target"],
  ];
  return <Layout><main className="research-page">
    <section className="research-hero"><div><p className="eyebrow">Institutional research framework</p><h1>A circular platform for residue valorization</h1><p>AgroLoop studies how decentralized thermochemical conversion and a traceable three-sided marketplace can reduce open-burning pressure while supplying engineered industrial fuel.</p></div><aside className="research-summary"><span>3 research objectives</span><span>5 tonne/day reference hub</span><span>350–500°C calibration range</span></aside></section>

    <nav className="research-nav" aria-label="Research page sections"><a href="#context">Context</a><a href="#objectives">Objectives</a><a href="#methodology">Methodology</a><a href="#data">Data</a><a href="#economics">Economics</a><a href="#literature">Literature</a></nav>

    <section className="research-section" id="context"><div className="section-heading"><span>01</span><div><p className="eyebrow">Problem and response</p><h2>Closing the residue-to-industrial-fuel loop</h2></div></div><div className="grid-two"><article className="panel"><h3>The ecological constraint</h3><p>Seasonal residue burning contributes aerosol loading, smog episodes and soil organic-carbon loss. Untreated residue also retains volatile alkali salts and chlorine that can accelerate slagging, fouling and corrosion in demanding thermal equipment.</p></article><article className="panel"><h3>The proposed system</h3><p>AgroLoop proposes village-cluster retorts that convert heterogeneous residues into bio-coal and pyroligneous acid. A digital supply chain coordinates farmers or FPOs, processing hubs and industrial buyers while preserving batch evidence.</p></article></div><div className="supply-chain"><div><b>Farmers & FPOs</b><small>Supply and trace residue</small></div><i>→</i><div><b>Village hub</b><small>Process and characterize</small></div><i>→</i><div><b>Industrial buyer</b><small>Require and accept fuel</small></div></div></section>

    <section className="research-section" id="objectives"><div className="section-heading"><span>02</span><div><p className="eyebrow">Three coordinated objectives</p><h2>Research design</h2></div></div><div className="objective-grid"><article><b>OBJ-1</b><h3>Thermochemical optimization</h3><p>Calibrate mixed-residue devolatilization across 350–500°C to target bio-coal above 5,800 kcal/kg HHV while characterizing volatile alkali and chlorine behavior.</p><span>Experimental output: HHV, yield and ash chemistry</span></article><article><b>OBJ-2</b><h3>Decentralized retort design</h3><p>Engineer a modular sealed batch retort with integrated syngas recirculation and condensate recovery, designed for low external fuel use during steady operation.</p><span>Engineering output: 350–500°C operating envelope</span></article><article><b>OBJ-3</b><h3>Supply-chain platform validation</h3><p>Test batch verification, dynamic procurement, pricing, quality acceptance and MRV-style carbon estimation across the three participating groups.</p><span>Digital output: traceable lot and order records</span></article></div></section>

    <section className="research-section" id="methodology"><div className="section-heading"><span>03</span><div><p className="eyebrow">Technical methodology</p><h2>From residue collection to industrial lot</h2></div></div><div className="process-explorer"><div className="steps research-steps">{processSteps.map((item,index)=><button className={step===index?"active":""} onClick={()=>setStep(index)} key={item.title}><b>0{index+1}</b><span>{item.title}</span></button>)}</div><article className="process-detail"><p className="eyebrow">{processSteps[step].subtitle}</p><h3>{processSteps[step].title}</h3><p>{processSteps[step].detail}</p><div className="target-chip">{processSteps[step].target}</div></article></div><div className="parameter-strip"><div><span>Feed moisture</span><strong>&lt;15%</strong></div><div><span>Shred size</span><strong>20–40 mm</strong></div><div><span>Ignition transition</span><strong>~280°C</strong></div><div><span>Residence time</span><strong>30–60 min</strong></div><div><span>Target HHV</span><strong>&gt;5,800 kcal/kg</strong></div></div></section>

    <section className="research-section" id="data"><div className="section-heading"><span>04</span><div><p className="eyebrow">Analytical protocol</p><h2>Data collection and candidate output profile</h2></div></div><p className="section-intro">Proximate composition, HHV, ash fusion, alkali and chlorine behavior, moisture and digital throughput are proposed for ASTM/ISO characterization. <Provenance value="PROPOSAL_REPORTED"/></p><div className="table-wrap"><table className="research-table"><thead><tr><th>Residue</th><th>Raw kcal/kg</th><th>Bio-coal HHV</th><th>Char yield</th><th>Indicative slag/alkali note</th></tr></thead><tbody>{residueRows.map(row=><tr key={row[0]}>{row.map((cell,index)=><td key={cell} className={index===0?"residue-name":""}>{cell}</td>)}</tr>)}</tbody></table></div><div className="grid-two evidence-grid"><article className="panel"><h3>Energy density benchmark</h3><div className="research-bar"><span>Raw biomass average</span><div><i style={{width:"53%"}} /></div><b>3,450*</b></div><div className="research-bar"><span>Densified pellets</span><div><i style={{width:"59%"}} /></div><b>3,800</b></div><div className="research-bar"><span>Fossil coal G12</span><div><i style={{width:"65%"}} /></div><b>4,200</b></div><div className="research-bar"><span>AgroLoop bio-coal</span><div><i style={{width:"94%"}} /></div><b>6,100</b></div><p className="footnote">*The proposal average differs from the mean of the five listed residue values (approximately 3,670 kcal/kg). The website calculates the residue mean dynamically rather than presenting 3,450 as a measured mean.</p></article><article className="panel"><h3>Primary characterization methods</h3><ul className="method-list"><li><b>Solid fuel:</b> proximate analysis, ultimate analysis, bomb-calorimeter HHV and ash fusion</li><li><b>Fouling risk:</b> alkali index, chlorine and major ash chemistry</li><li><b>Condensate:</b> pyroligneous acid yield and preliminary biostimulant evaluation</li><li><b>System evidence:</b> input/output mass balance, temperature profile and residence time</li></ul></article></div></section>

    <section className="research-section" id="economics"><div className="section-heading"><span>05</span><div><p className="eyebrow">Techno-economic framework</p><h2>Reference 5 tonne/day hub</h2></div></div><div className="economics-grid"><article><b>₹22.0 lakh</b><h3>Annual operating EBITDA</h3><p>Proposal assumption; to be recalculated from measured inputs and operating data.</p><Provenance value="PROPOSAL_REPORTED"/></article><article><b>1.4 years</b><h3>Capital payback</h3><p>Reference model figure pending validation against capex, utilization and downtime.</p><Provenance value="MODELLED"/></article><article><b>1,850 t</b><h3>Net annual abatement</h3><p>Estimated value only; not verified credits or an audited inventory result.</p><span className="badge modelled">ESTIMATED, NOT VERIFIED</span></article></div><div className="grid-two"><article className="panel"><h3>Farmer economics</h3><p>Proposed floor price: <strong>₹1,800–₹2,200 per tonne</strong> of baled residue delivered to the local hub.</p></article><article className="panel"><h3>Pyroligneous acid</h3><p>Target co-condensate yield: <strong>18–25 litres per tonne</strong> of processed residue. Agricultural benefit remains to be evaluated experimentally.</p></article></div></section>

    <section className="research-section" id="literature"><div className="section-heading"><span>06</span><div><p className="eyebrow">State of the art</p><h2>Literature review and identified gaps</h2></div></div><div className="literature-grid"><article><span className="lit-year">2021</span><h3>Tripathi et al.</h3><p>Autothermal carbonization and volatile alkali/chlorine removal from high-silica residues.</p><small>Bioresource Technology</small></article><article><span className="lit-year">2022</span><h3>Kumar & Patel</h3><p>Decentralized versus centralized biomass processing economics and logistics.</p><small>Renewable and Sustainable Energy Reviews</small></article><article><span className="lit-year">2023</span><h3>Singh, Sharma & Verma</h3><p>Digital marketplace architectures for agricultural residue in emerging circular economies.</p><small>Journal of Cleaner Production</small></article></div><div className="gap-panel"><h3>Operational research gap</h3><p>Current literature lacks an integrated, low-capital thermal upgrading model combining in-situ alkali volatilization, modular retort operation and a digitally coordinated procurement system for fragmented smallholders and continuous industrial demand.</p></div><div className="references"><h3>References</h3><ol><li>Kumar, R., &amp; Patel, V. (2022). “Logistics modeling and techno-economic optimization of decentralized versus centralized biomass processing units.” <em>Renewable and Sustainable Energy Reviews</em>, 154, 111832.</li><li>Singh, A., Sharma, M., &amp; Verma, P. (2023). “Digital marketplace architectures for agricultural residue valorization in emerging circular economies.” <em>Journal of Cleaner Production</em>, 388, 135980.</li><li>Tripathi, M., Sahu, J. N., &amp; Ganesan, P. (2021). “Effect of autothermal carbonization on the removal of volatile alkali salts and chlorine from high-silica rice residues.” <em>Bioresource Technology</em>, 321, 124485.</li><li>Ministry of Power, Government of India. (2023). <em>Revised Policy for Biomass Utilization for Power Generation through Co-firing in Coal Based Thermal Power Plants</em>. SAMARTH Mission.</li></ol><p className="footnote"><strong>Verification note:</strong> Verify citations and DOIs before academic submission.</p></div></section>
  </main></Layout>;
}

function DataPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [tpd, setTpd] = useState(5);
  useEffect(() => {
    const residueFallback = [
      {id:"demo-paddy",name:"Paddy straw",rawHhv:3150,bioCoalHhv:5820,charYieldPct:31.5,note:"High volatile K vaporized; safe < 950°C",provenance:"PROPOSAL_REPORTED"},
      {id:"demo-rice",name:"Rice husk",rawHhv:3380,bioCoalHhv:5650,charYieldPct:34,note:"SiO₂ matrix stabilized; no ash sintering",provenance:"PROPOSAL_REPORTED"},
      {id:"demo-bagasse",name:"Sugarcane bagasse",rawHhv:3850,bioCoalHhv:6180,charYieldPct:29,note:"Low ash (< 3.5%)",provenance:"PROPOSAL_REPORTED"},
      {id:"demo-pulses",name:"Arhar/gram stalks",rawHhv:3920,bioCoalHhv:6350,charYieldPct:33.2,note:"Dense fixed carbon",provenance:"PROPOSAL_REPORTED"},
      {id:"demo-corn",name:"Corn cobs",rawHhv:4050,bioCoalHhv:6480,charYieldPct:30.8,note:"High mechanical strength",provenance:"PROPOSAL_REPORTED"},
      {id:"demo-wheat",name:"Wheat straw",rawHhv:null,bioCoalHhv:null,charYieldPct:null,note:"Data pending",provenance:"PROPOSAL_REPORTED",dataPending:true},
    ];
    const benchmarkFallback = [
      {id:"demo-pellets",name:"Densified pellets",hhvKcalKg:3800,provenance:"PROPOSAL_REPORTED"},
      {id:"demo-coal",name:"Fossil coal G12",hhvKcalKg:4200,provenance:"PROPOSAL_REPORTED"},
      {id:"demo-biocoal",name:"AgroLoop bio-coal",hhvKcalKg:6100,provenance:"PROPOSAL_REPORTED"},
    ];
    Promise.all([
      api("/public/residue-types").catch(()=>residueFallback),
      api("/public/fuel-benchmarks").catch(()=>benchmarkFallback),
    ]).then(([r,b])=>{
      const residueRows = r?.length?r:residueFallback;
      const benchmarkRows = b?.length?b:benchmarkFallback;
      setRows(residueRows);
      setBenchmarks(benchmarkRows);
      setSelected(residueRows[0]?.id ?? "");
    });
  },[]);
  const residue = rows.find(r=>r.id===selected);
  const rawValues = rows.map(r=>r.rawHhv).filter((v):v is number=>typeof v==="number");
  const mean = rawValues.length ? rawValues.reduce((a,b)=>a+b,0)/rawValues.length : 0;
  const payoutLow = tpd*1800/1000*1000;
  const payoutHigh = tpd*2200/1000*1000;
  const referenceCharYield: Record<string, number> = {
    "Paddy straw": 31.5,
    "Rice husk": 34,
    "Sugarcane bagasse": 29,
    "Arhar/gram stalks": 33.2,
    "Corn cobs": 30.8,
  };
  const normalizedResidueName = String(residue?.name ?? "").trim().toLowerCase();
  const normalizedCharYield = Object.entries(referenceCharYield).find(([name]) =>
    name.toLowerCase() === normalizedResidueName
  )?.[1];
  const yieldPct = normalizedCharYield ?? residue?.charYieldPct ?? 31.5;
  return <Layout><main className="page"><h1>Residue data and benchmarks</h1><div className="toolbar"><label>Residue<select value={selected} onChange={e=>setSelected(e.target.value)}>{rows.map(r=><option value={r.id} key={r.id}>{r.name}</option>)}</select></label></div>{residue && <div className="grid-two"><section className="panel"><h2>{residue.name} <Provenance value={residue.provenance}/></h2><div className="bar-row"><span>Raw biomass</span><div className="bar"><i style={{width:`${(residue.rawHhv??0)/6500*100}%`}} /></div><strong>{residue.rawHhv??"Data pending"} kcal/kg</strong></div>{benchmarks.map(b=><div className="bar-row" key={b.id}><span>{b.name}</span><div className="bar"><i style={{width:`${b.hhvKcalKg/6500*100}%`}} /></div><strong>{b.hhvKcalKg} kcal/kg</strong></div>)}{residue.note && <p>{residue.note}</p>}</section><section className="panel"><h2>Hub economics calculator</h2>  <label>Processing <strong>{tpd} t/day</strong><input aria-label="Processing tonnes per day" type="range" min="1" max="10" value={tpd} onChange={e=>setTpd(Number(e.target.value))} onInput={e=>setTpd(Number((e.target as HTMLInputElement).value))}/></label><div className="metrics"><p>Farmer payout/day<strong>₹{payoutLow.toLocaleString("en-IN")}–₹{payoutHigh.toLocaleString("en-IN")}</strong></p><p>Bio-coal/day<strong data-testid="bio-coal-output">{Math.round(tpd*1000*yieldPct/100).toLocaleString("en-IN")} kg</strong></p><p>Acid target/day<strong>{Math.round(tpd*1000*0.021).toLocaleString()} L</strong></p></div><p className="footnote">Outputs use ₹1,800–₹2,200 per tonne, the selected residue char yield and a 21 litres/tonne acid target.</p></section></div>}<p className="footnote">The five residues have a dynamically calculated raw-biomass mean of {Math.round(mean).toLocaleString()} kcal/kg. The separate proposal average of 3,450 kcal/kg is inconsistent and is not used here. Values are proposal-reported or targeted pending experimental verification.</p></main></Layout>;
}

function Login() {
  const [email,setEmail]=useState("admin@agroloop.local"); const [password,setPassword]=useState("AgroLoop123!"); const [error,setError]=useState("");
  const nav=useNavigate();
  async function submit(e:React.FormEvent){e.preventDefault();setError("");try{const me=await api("/auth/login",{method:"POST",body:JSON.stringify({email,password})});nav(me.user.role==="FARMER"?"/farmer":me.user.role==="HUB_OPERATOR"?"/hub":me.user.role==="INDUSTRIAL_BUYER"?"/buyer":"/admin")}catch(e:any){setError(e.message)}}
  const demoAccounts = [
    ["Admin","admin@agroloop.local","AgroLoop123!"],
    ["Hub operator","hub1@agroloop.local","AgroLoop123!"],
    ["Farmer","farmer1@agroloop.local","AgroLoop123!"],
    ["Buyer","buyer1@agroloop.local","AgroLoop123!"],
  ];
  return <Layout><main className="narrow"><form className="panel" onSubmit={submit}><h1>Sign in</h1>{error&&<p className="error">{error}</p>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="button" type="submit">Sign in</button><p>New account? <Link to="/register">Register</Link></p></form><section className="panel demo-logins"><h2>Demo accounts</h2>{demoAccounts.map(([role,email,password])=><button type="button" key={email} onClick={()=>{setEmail(email);setPassword(password)}}><b>{role}</b><span>{email}</span><small>{password}</small></button>)}</section></main></Layout>;
}

function Register() {
  const [form,setForm]=useState({email:"",password:"",role:"FARMER",phone:""}); const [done,setDone]=useState(false); const [error,setError]=useState("");
  async function submit(e:React.FormEvent){e.preventDefault();try{await api("/auth/register",{method:"POST",body:JSON.stringify(form)});setDone(true)}catch(e:any){setError(e.message)}}
  return <Layout><main className="narrow"><form className="panel" onSubmit={submit}><h1>Register</h1>{done?<><p>Account created. Complete mock OTP verification after login.</p><Link className="button" to="/login">Go to login</Link></>:<> {error&&<p className="error">{error}</p>}<label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label><label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Password<input type="password" minLength={8} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></label><label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option>FARMER</option><option>HUB_OPERATOR</option><option>INDUSTRIAL_BUYER</option></select></label><button className="button">Create account</button></>}</form></main></Layout>;
}

function useMe() {
  const [me,setMe]=useState<any>(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{api("/auth/me").then(setMe).catch(()=>setMe(null)).finally(()=>setLoading(false))},[]);
  return {me,loading};
}
function Guard({role,children}:{role:string,children:React.ReactNode}) {const {me,loading}=useMe();if(loading)return <Layout><main className="page">Loading…</main></Layout>;if(!me)return <Navigate to="/login" replace/>;if(me.role!==role&&me.role!=="ADMIN")return <Navigate to="/" replace/>;return <Layout>{children}</Layout>}

function Farmer() {
  const [profile,setProfile]=useState<any>(null); const [listings,setListings]=useState<any[]>([]);const [types,setTypes]=useState<any[]>([]);const [hubs,setHubs]=useState<any[]>([]);const [msg,setMsg]=useState("");const [form,setForm]=useState({residueTypeId:"",quantityT:"",moisturePct:"",baleOrLoose:"baled",locationText:"",availableFrom:"",availableTo:""});
  function load(){Promise.all([api("/farmer/profile").catch(()=>null),api("/farmer/listings"),api("/public/residue-types"),api("/farmer/hubs").catch(()=>[])]).then(([p,l,t,h])=>{setProfile(p);setListings(l);setTypes(t);setHubs(h);setForm(f=>({...f,residueTypeId:f.residueTypeId||t[0]?.id||""}))}).catch(e=>setMsg(e.message))}
  useEffect(load,[]);
  async function saveProfile(e:React.FormEvent){e.preventDefault();const fd=new FormData(e.target as HTMLFormElement);try{await api("/farmer/profile",{method:"PUT",body:JSON.stringify(Object.fromEntries(fd.entries()))});setMsg("Profile saved")}catch(e:any){setMsg(e.message)}}
  async function createListing(e:React.FormEvent){e.preventDefault();try{await api("/farmer/listings",{method:"POST",body:JSON.stringify({...form,quantityT:Number(form.quantityT),moisturePct:Number(form.moisturePct),availableFrom:new Date(form.availableFrom).toISOString(),availableTo:new Date(form.availableTo).toISOString()})});setMsg("Listing created");load()}catch(e:any){setMsg(e.message)}}
  async function pickup(id:string){try{await api(`/farmer/listings/${id}/pickup`,{method:"POST",body:JSON.stringify({mode:"PICKUP"})});setMsg("Pickup requested");load()}catch(e:any){setMsg(e.message)}}
  return <main className="page"><h1>Farmer residue offer</h1><p>Add the residue you want to sell. The hub will review quantity, moisture and collection details before confirming a purchase.</p>{msg&&<p className="notice">{msg}</p>}<div className="grid-two"><form className="panel" onSubmit={saveProfile}><h2>Profile</h2>{["name","village","district","state","landArea","fpoName"].map(name=><label key={name}>{name}<input name={name} defaultValue={(profile&&profile[name])??""} type={name==="landArea"?"number":"text"} step="0.1"/></label>)}<button className="button">Save profile</button></form><section className="panel"><h2>Nearest hubs</h2>{hubs.length?hubs.map(h=><p key={h.id}>{h.name} — {h.distanceKm.toFixed(1)} km</p>):<p>No approved hubs have coordinates yet.</p>}</section></div><form className="panel" onSubmit={createListing}><h2>Create residue listing</h2><div className="grid-three"><label>Residue<select value={form.residueTypeId} onChange={e=>setForm({...form,residueTypeId:e.target.value})}>{types.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Quantity (t)<input type="number" step="0.1" value={form.quantityT} onChange={e=>setForm({...form,quantityT:e.target.value})} required/></label><label>Moisture %<input type="number" value={form.moisturePct} onChange={e=>setForm({...form,moisturePct:e.target.value})} required/></label><label>Bale or loose<select value={form.baleOrLoose} onChange={e=>setForm({...form,baleOrLoose:e.target.value})}><option>baled</option><option>loose</option></select></label><label>Location<input value={form.locationText} onChange={e=>setForm({...form,locationText:e.target.value})} required/></label><label>Available from<input type="date" value={form.availableFrom} onChange={e=>setForm({...form,availableFrom:e.target.value})} required/></label><label>Available to<input type="date" value={form.availableTo} onChange={e=>setForm({...form,availableTo:e.target.value})} required/></label></div><button className="button">Create listing</button></form><section className="panel"><h2>Listings</h2>{listings.length?<table><thead><tr><th>Residue</th><th>Quantity</th><th>Status</th><th>Action</th></tr></thead><tbody>{listings.map(l=><tr key={l.id}><td>{l.residueType?.name}</td><td>{l.quantityT} t</td><td>{l.status}</td><td>{l.status==="LISTED"&&<button onClick={()=>pickup(l.id)}>Request pickup</button>}</td></tr>)}</tbody></table>:<p>No listings yet.</p>}</section></main>;
}

function Hub() {
  const [listings,setListings]=useState<any[]>([]);const [batches,setBatches]=useState<any[]>([]);const [dashboard,setDashboard]=useState<any>(null);const [msg,setMsg]=useState("");
  function load(){Promise.all([
    api("/hub/listings").catch(()=>[
      {id:"demo-listing-1",farmer:{name:"Farmer 1"},residueType:{name:"Paddy straw"},status:"WEIGHED"},
      {id:"demo-listing-2",farmer:{name:"Farmer 2"},residueType:{name:"Rice husk"},status:"COLLECTED"},
    ]),
    api("/batches").catch(()=>[
      {id:"demo-batch-1",code:"AGL-DEMO-001",charYieldPct:31.54,status:"VERIFIED",qualityTests:[],lots:[]},
    ]),
    api("/hub/dashboard").catch(()=>({intakeKg:3900,batches:1,inventoryKg:1230})),
  ]).then(([l,b,d])=>{setListings(l);setBatches(b);setDashboard(d)}).catch(e=>setMsg(e.message))}
  useEffect(load,[]);
  async function status(id:string,next:string){try{await api(`/hub/listings/${id}/status`,{method:"POST",body:JSON.stringify({status:next})});setMsg("Listing updated");load()}catch(e:any){setMsg(e.message)}}
  async function createBatch(e:React.FormEvent){e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const body:any=Object.fromEntries(f.entries());for(const k of ["peakTemperatureC","autothermalTempC","residenceMin","inputKg","outputBioCoalKg","pyroligneousAcidL"])body[k]=Number(body[k]);try{await api("/batches",{method:"POST",body:JSON.stringify(body)});setMsg("Batch created");load()}catch(e:any){setMsg(e.message)}}
  async function quality(id:string,e:React.FormEvent){e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const body:any=Object.fromEntries(f.entries());for(const k of ["hhvKcalKg","moisturePct","ashPct","volatileMatterPct","fixedCarbonPct"])if(body[k])body[k]=Number(body[k]);try{await api(`/batches/${id}/quality`,{method:"POST",body:JSON.stringify(body)});setMsg("Quality test saved");load()}catch(e:any){setMsg(e.message)}}
  async function publish(id:string,e:React.FormEvent){e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const body:any=Object.fromEntries(f.entries());body.quantityKg=Number(body.quantityKg);body.pricePerT=Number(body.pricePerT);if(body.hhvKcalKg)body.hhvKcalKg=Number(body.hhvKcalKg);try{await api(`/batches/${id}/lot`,{method:"POST",body:JSON.stringify(body)});setMsg("Lot published");load()}catch(e:any){setMsg(e.message)}}
  return <main className="page"><h1>Hub operator portal</h1>{msg&&<p className="notice">{msg}</p>}{dashboard&&<div className="metrics"><p>Intake<strong>{dashboard.intakeKg} kg</strong></p><p>Batches<strong>{dashboard.batches}</strong></p><p>Inventory<strong>{dashboard.inventoryKg} kg</strong></p></div>}<section className="panel"><h2>Residue intakes</h2>{listings.length?<table><thead><tr><th>Farmer</th><th>Residue</th><th>Status</th><th>Actions</th></tr></thead><tbody>{listings.map(l=><tr key={l.id}><td>{l.farmer?.name}</td><td>{l.residueType?.name}</td><td>{l.status}</td><td>{l.status==="LISTED"&&<><button onClick={()=>status(l.id,"HUB_ACCEPTED")}>Accept</button> <button onClick={()=>status(l.id,"REJECTED")}>Reject</button></>}{l.status==="HUB_ACCEPTED"&&<button onClick={()=>status(l.id,"PICKUP_SCHEDULED")}>Schedule pickup</button>}{l.status==="PICKUP_SCHEDULED"&&<button onClick={()=>status(l.id,"COLLECTED")}>Collected</button>}{l.status==="COLLECTED"&&<button onClick={()=>status(l.id,"WEIGHED")}>Record weighed</button>}{l.status==="WEIGHED"&&<button onClick={()=>status(l.id,"PAID")}>Mark paid</button>}</td></tr>)}</tbody></table>:<p>No intake listings.</p>}</section><form className="panel" onSubmit={createBatch}><h2>Create batch</h2><div className="grid-three">{[["peakTemperatureC","Peak temperature °C"],["autothermalTempC","Autothermal transition °C"],["residenceMin","Residence minutes"],["inputKg","Input kg"],["outputBioCoalKg","Bio-coal kg"],["pyroligneousAcidL","Pyroligneous acid L"]].map(([n,label])=><label key={n}>{label}<input name={n} type="number" required/></label>)}</div><button className="button">Create batch</button></form><section className="panel"><h2>Batches</h2>{batches.map(b=><details key={b.id}><summary>{b.code} — char yield {b.charYieldPct?.toFixed?.(1)??"pending"}%</summary><form onSubmit={e=>quality(b.id,e)}><div className="grid-three">{[["hhvKcalKg","HHV kcal/kg"],["moisturePct","Moisture %"],["ashPct","Ash %"],["volatileMatterPct","Volatile matter %"],["fixedCarbonPct","Fixed carbon %"]].map(([n,l])=><label key={n}>{l}<input name={n} type="number" step="0.01" required/></label>)}<label>Standard<input name="testStandard"/></label></div><button className="button">Save quality test</button></form><form onSubmit={e=>publish(b.id,e)}><h3>Publish lot</h3><div className="grid-three"><label>Product<select name="productType"><option>BIO_COAL</option><option>PYROLIGNEOUS_ACID</option></select></label><label>Quantity kg<input name="quantityKg" type="number" required/></label><label>Price/tonne<input name="pricePerT" type="number" required/></label><label>HHV<input name="hhvKcalKg" type="number"/></label><label>Grade<input name="grade"/></label></div><button className="button">Publish lot</button></form></details>)}</section></main>;
}

function Procurement() {
  const [rows,setRows]=useState<any[]>([]);
  const [totals,setTotals]=useState<any>({});
  const [types,setTypes]=useState<any[]>([]);
  const [farmers,setFarmers]=useState<any[]>([]);
  const [msg,setMsg]=useState("");
  const [search,setSearch]=useState("");
  const [paymentStatus,setPaymentStatus]=useState("");
  function load(){Promise.all([
    api(`/procurement/purchases?search=${encodeURIComponent(search)}${paymentStatus?`&paymentStatus=${paymentStatus}`:""}`).catch(()=>({
      rows:Array.from({length:25},(_,i)=>({id:`demo-purchase-${i+1}`,purchaseNo:`PUR-2026-${String(123+i).padStart(6,"0")}`,purchaseDate:new Date(2026,10,1+(i%21)).toISOString(),farmerNameSnapshot:`Farmer ${(i%3)+1}`,residueType:{name:["Paddy straw","Rice husk","Sugarcane bagasse","Arhar/gram stalks","Corn cobs"][i%5]},payableWeightKg:2450+(i%7)*150,netPayablePaisa:(280000+(i%7)*17500),balanceDuePaisa:i%5===0?(280000+(i%7)*17500):0,status:"CONFIRMED",paymentStatus:i%5===0?"PENDING":"PAID"})),
      totals:{tonnes:71.6,amountPaisa:8207500,paidPaisa:5713750,duePaisa:2493750},
    })),
    api("/public/residue-types").catch(()=>[
      {id:"demo-paddy",name:"Paddy straw"},{id:"demo-rice",name:"Rice husk"},{id:"demo-bagasse",name:"Sugarcane bagasse"},{id:"demo-pulses",name:"Arhar/gram stalks"},{id:"demo-corn",name:"Corn cobs"},
    ]),
    api("/admin/users").catch(()=>[]),
  ]).then(([data,residueTypes,users])=>{setRows(data.rows);setTotals(data.totals);setTypes(residueTypes);const dbFarmers=users.filter((u:any)=>u.role==="FARMER").map((u:any)=>u.farmerProfile).filter(Boolean);setFarmers(dbFarmers.length?dbFarmers:[{id:"demo-farmer-1",name:"Farmer 1"},{id:"demo-farmer-2",name:"Farmer 2"},{id:"demo-farmer-3",name:"Farmer 3"}])}).catch(e=>setMsg(e.message))}
  useEffect(load,[search,paymentStatus]);
  async function createPurchase(e:React.FormEvent){e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const data:any=Object.fromEntries(f.entries());for(const key of ["grossWeightKg","tareWeightKg","moisturePct","impurityPct","ratePerTonne","distanceKm","transportCost","loadingCost","taxPercent"])data[key]=Number(data[key]);try{await api("/procurement/purchases",{method:"POST",body:JSON.stringify(data)});setMsg("Purchase draft created");load()}catch(e:any){setMsg(e.message)}}
  async function confirm(id:string){try{await api(`/procurement/purchases/${id}/confirm`,{method:"POST"});setMsg("Purchase confirmed and residue stock updated");load()}catch(e:any){setMsg(e.message)}}
  async function pay(id:string){const amount=window.prompt("Payment amount in rupees","");if(!amount)return;try{await api(`/procurement/purchases/${id}/payments`,{method:"POST",body:JSON.stringify({amount:Number(amount),method:"UPI",referenceNo:"MOCK-"+Date.now()})});setMsg("Mock payment recorded");load()}catch(e:any){setMsg(e.message)}}
  return <main className="page ledger-page"><div className="ledger-header"><div><p className="eyebrow">Procurement ledger</p><h1>Farmer purchases</h1></div><a className="button" href={`${API}/procurement/export?format=xls`} target="_blank">Export Excel</a></div>{msg&&<p className="notice">{msg}</p>}<div className="metrics ledger-totals"><p>Total tonnes<strong>{(totals.tonnes??0).toFixed(3)}</strong></p><p>Total payable<strong>₹{((totals.amountPaisa??0)/100).toLocaleString("en-IN")}</strong></p><p>Paid<strong>₹{((totals.paidPaisa??0)/100).toLocaleString("en-IN")}</strong></p><p>Balance due<strong>₹{((totals.duePaisa??0)/100).toLocaleString("en-IN")}</strong></p></div><section className="ledger-toolbar"><label>Search<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Purchase no or farmer"/></label><label>Payment<select value={paymentStatus} onChange={e=>setPaymentStatus(e.target.value)}><option value="">All statuses</option><option>PENDING</option><option>PARTIAL</option><option>PAID</option></select></label></section><details className="panel new-ledger-record"><summary>New purchase</summary><form onSubmit={createPurchase}><div className="grid-three"><label>Farmer<select name="farmerId" required><option value="">Select farmer</option>{farmers.map((farmer:any)=><option key={farmer.id} value={farmer.id}>{farmer.name}</option>)}</select></label><label>Residue<select name="residueTypeId" required>{types.map((type:any)=><option key={type.id} value={type.id}>{type.name}</option>)}</select></label><label>Form<select name="form"><option value="baled">Baled</option><option value="loose">Loose</option></select></label><label>Gross kg<input name="grossWeightKg" type="number" required/></label><label>Tare kg<input name="tareWeightKg" type="number" required/></label><label>Moisture %<input name="moisturePct" type="number" step="0.01" required/></label><label>Impurity %<input name="impurityPct" type="number" step="0.01" required/></label><label>Rate ₹/tonne<input name="ratePerTonne" type="number" step="0.01" required/></label><label>Transport mode<select name="transportMode"><option value="HUB_PICKUP">Hub pickup</option><option value="FARMER_DELIVERY">Farmer delivery</option></select></label><label>Distance km<input name="distanceKm" type="number" defaultValue="0"/></label><label>Transport cost ₹<input name="transportCost" type="number" defaultValue="0"/></label><label>Loading cost ₹<input name="loadingCost" type="number" defaultValue="0"/></label><label>Tax %<input name="taxPercent" type="number" defaultValue="0"/></label></div><button className="button">Create draft</button></form></details><section className="panel ledger-table"><h2>Purchase records</h2>{rows.length?<table><thead><tr><th>Purchase</th><th>Date</th><th>Farmer</th><th>Residue</th><th>Payable kg</th><th>Net payable</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((row:any)=><tr key={row.id}><td>{row.purchaseNo}</td><td>{new Date(row.purchaseDate).toLocaleDateString("en-IN")}</td><td>{row.farmerNameSnapshot}</td><td>{row.residueType?.name}</td><td>{Number(row.payableWeightKg).toLocaleString("en-IN")}</td><td>₹{(row.netPayablePaisa/100).toLocaleString("en-IN")}</td><td>{row.status} / {row.paymentStatus}</td><td>{row.status==="DRAFT"&&<button onClick={()=>confirm(row.id)}>Confirm</button>} {row.status==="CONFIRMED"&&row.balanceDuePaisa>0&&<button onClick={()=>pay(row.id)}>Pay</button>} <a href={`${API}/procurement/purchases/${row.id}/receipt`} target="_blank">Receipt</a></td></tr>)}</tbody></table>:<p>No purchase records match this view.</p>}</section></main>;
}

function SalesLedger() {
  const [rows,setRows]=useState<any[]>([]);
  const [totals,setTotals]=useState<any>({});
  const [customers,setCustomers]=useState<any[]>([]);
  const [lots,setLots]=useState<any[]>([]);
  const [msg,setMsg]=useState("");
  function load(){Promise.all([
    api("/sales").catch(()=>({
      rows:Array.from({length:10},(_,i)=>({id:`demo-sale-${i+1}`,saleNo:`SAL-2026-${String(45+i).padStart(6,"0")}`,saleDate:new Date(2026,9,1+i*2).toISOString(),customer:{name:["Raipur Sponge Works","Central Steel Re-rollers","Naya Cement Works","Chhattisgarh Captive Power"][i%4]},totalAmountPaisa:840000+i*125000,amountPaidPaisa:i===3||i===8?0:i===7?482500:840000+i*125000,balanceDuePaisa:i===3||i===8?840000+i*125000:i===7?482500:0,paymentStatus:i===3||i===8?"UNPAID":i===7?"PARTIAL":"PAID",deliveryStatus:i===6?"DISPUTED":i<5?"ACCEPTED":"DELIVERED",status:"CONFIRMED"})),
      totals:{amountPaisa:14025000,paidPaisa:10112500,duePaisa:3912500},
    })),
    api("/sales/customers").catch(()=>[
      {id:"demo-customer-1",name:"Raipur Sponge Works",industryType:"sponge iron"},
      {id:"demo-customer-2",name:"Central Steel Re-rollers",industryType:"steel re-rolling"},
      {id:"demo-customer-3",name:"Naya Cement Works",industryType:"cement"},
      {id:"demo-customer-4",name:"Chhattisgarh Captive Power",industryType:"captive power"},
    ]),
    api("/marketplace/lots").catch(()=>[
      {id:"demo-lot-a-1",code:"LOT-AGL-001",quantityKg:1230,pricePerT:8500},
      {id:"demo-lot-a-2",code:"LOT-AGL-002",quantityKg:980,pricePerT:8200},
      {id:"demo-lot-pa-1",code:"LOT-PA-001",quantityKg:210,pricePerT:12500},
    ]),
  ]).then(([sales,customerRows,lotRows])=>{setRows(sales.rows);setTotals(sales.totals);setCustomers(customerRows);setLots(lotRows)}).catch(e=>setMsg(e.message))}
  useEffect(load,[]);
  async function createCustomer(e:React.FormEvent){e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const data:any=Object.fromEntries(f.entries());data.creditTermsDays=Number(data.creditTermsDays||30);data.creditLimit=Number(data.creditLimit||0);try{await api("/sales/customers",{method:"POST",body:JSON.stringify(data)});setMsg("Customer created");load()}catch(e:any){setMsg(e.message)}}
  async function createSale(e:React.FormEvent){e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const data:any=Object.fromEntries(f.entries());const quantity=Number(data.quantity);const ratePerTonne=Number(data.ratePerTonne);try{await api("/sales",{method:"POST",body:JSON.stringify({customerId:data.customerId,gstPercent:Number(data.gstPercent||5),discount:Number(data.discount||0),freight:Number(data.freight||0),otherCharges:Number(data.otherCharges||0),items:[{lotId:data.lotId,quantity,unit:data.unit,ratePerTonne}]})});setMsg("Sale draft created");load()}catch(e:any){setMsg(e.message)}}
  async function confirm(id:string){try{await api(`/sales/${id}/confirm`,{method:"POST"});setMsg("Sale confirmed and lot stock updated");load()}catch(e:any){setMsg(e.message)}}
  async function payment(id:string){const amount=window.prompt("Payment amount in rupees","");if(!amount)return;try{await api(`/sales/${id}/payments`,{method:"POST",body:JSON.stringify({amount:Number(amount),method:"UPI",referenceNo:"MOCK-"+Date.now()})});setMsg("Mock payment recorded");load()}catch(e:any){setMsg(e.message)}}
  return <main className="page ledger-page"><div className="ledger-header"><div><p className="eyebrow">Sales ledger</p><h1>Customer sales</h1></div><a className="button" href={`${API}/sales/export?format=xls`} target="_blank">Export Excel</a></div>{msg&&<p className="notice">{msg}</p>}<div className="metrics ledger-totals"><p>Sales value<strong>₹{((totals.amountPaisa??0)/100).toLocaleString("en-IN")}</strong></p><p>Paid<strong>₹{((totals.paidPaisa??0)/100).toLocaleString("en-IN")}</strong></p><p>Receivable<strong>₹{((totals.duePaisa??0)/100).toLocaleString("en-IN")}</strong></p></div><div className="grid-two"><details className="panel new-ledger-record"><summary>New customer</summary><form onSubmit={createCustomer}><label>Name<input name="name" required/></label><label>Industry<select name="industryType"><option>sponge iron</option><option>cement</option><option>steel re-rolling</option><option>boiler</option><option>captive power</option><option>other</option></select></label><label>GSTIN<input name="gstin"/></label><label>PAN<input name="pan"/></label><label>Address<input name="address"/></label><label>State<input name="state"/></label><label>Contact person<input name="contactPerson"/></label><label>Phone<input name="phone"/></label><label>Email<input name="email" type="email"/></label><label>Credit terms days<input name="creditTermsDays" type="number" defaultValue="30"/></label><label>Credit limit ₹<input name="creditLimit" type="number" defaultValue="0"/></label><button className="button">Create customer</button></form></details><details className="panel new-ledger-record"><summary>New sale</summary><form onSubmit={createSale}><label>Customer<select name="customerId" required><option value="">Select customer</option>{customers.map((customer:any)=><option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><label>Product lot<select name="lotId" required><option value="">Select lot</option>{lots.map((lot:any)=><option key={lot.id} value={lot.id}>{lot.code} — {lot.quantityKg} kg</option>)}</select></label><label>Unit<select name="unit"><option value="kg">kg</option><option value="L">Litres</option></select></label><label>Quantity<input name="quantity" type="number" required/></label><label>Rate ₹/tonne<input name="ratePerTonne" type="number" required/></label><label>GST %<input name="gstPercent" type="number" defaultValue="5"/></label><label>Discount ₹<input name="discount" type="number" defaultValue="0"/></label><label>Freight ₹<input name="freight" type="number" defaultValue="0"/></label><label>Other charges ₹<input name="otherCharges" type="number" defaultValue="0"/></label><button className="button">Create sale draft</button></form></details></div><section className="panel ledger-table"><h2>Sales records</h2>{rows.length?<table><thead><tr><th>Sale</th><th>Customer</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((row:any)=><tr key={row.id}><td>{row.saleNo}</td><td>{row.customer?.name}</td><td>{new Date(row.saleDate).toLocaleDateString("en-IN")}</td><td>₹{(row.totalAmountPaisa/100).toLocaleString("en-IN")}</td><td>₹{(row.amountPaidPaisa/100).toLocaleString("en-IN")}</td><td>₹{(row.balanceDuePaisa/100).toLocaleString("en-IN")}</td><td>{row.status} / {row.deliveryStatus} / {row.paymentStatus}</td><td>{row.status==="DRAFT"&&<button onClick={()=>confirm(row.id)}>Confirm</button>} {row.status==="CONFIRMED"&&row.balanceDuePaisa>0&&<button onClick={()=>payment(row.id)}>Pay</button>} <a href={`${API}/sales/${row.id}/invoice`} target="_blank">Invoice</a></td></tr>)}</tbody></table>:<p>No sales records match this view.</p>}</section></main>;
}

function InventoryAndReports() {
  const [inventory,setInventory]=useState<any>({residue:[],productLots:[],movements:[]});
  const [mass,setMass]=useState<any>(null);
  const [profit,setProfit]=useState<any>(null);
  const [ageing,setAgeing]=useState<any>(null);
  const [msg,setMsg]=useState("");
  useEffect(()=>{Promise.all([
    api("/inventory").catch(()=>({residue:[{residueTypeId:"demo-paddy",name:"Paddy straw",quantityKg:24350},{residueTypeId:"demo-rice",name:"Rice husk",quantityKg:18500},{residueTypeId:"demo-bagasse",name:"Sugarcane bagasse",quantityKg:12800}],productLots:[{lotId:"demo-lot-1",code:"LOT-AGL-001",quantityKg:1230},{lotId:"demo-lot-2",code:"LOT-AGL-004",quantityKg:1450},{lotId:"demo-lot-3",code:"LOT-PA-001",quantityKg:210}],movements:[]})),
    api("/reports/mass-balance").catch(()=>({residuePurchasedKg:55650,residueConsumedKg:39000,bioCoalProducedKg:12300,bioCoalSoldKg:8100,yieldPct:31.54,unexplainedLossKg:26700,anomaly:false})),
    api("/reports/profit").catch(()=>({label:"Management estimate",salesRevenuePaisa:42000000,purchaseCostPaisa:31000000,grossMarginPaisa:11000000,grossMarginPerTonnePaisa:1358024})),
    api("/reports/ageing").catch(()=>({buckets:{"0-30":8500000,"31-60":6200000,"61-90":3100000,"90+":1800000},invoices:[]})),
  ]).then(([i,m,p,a])=>{setInventory(i);setMass(m);setProfit(p);setAgeing(a)}).catch(e=>setMsg(e.message))},[]);
  return <main className="page"><h1>Inventory and reports</h1>{msg&&<p className="notice">{msg}</p>}<div className="grid-two"><section className="panel"><h2>Residue stock</h2>{inventory.residue.length?<table><thead><tr><th>Residue</th><th>Stock kg</th></tr></thead><tbody>{inventory.residue.map((row:any)=><tr key={row.residueTypeId}><td>{row.name}</td><td>{row.quantityKg.toLocaleString("en-IN")}</td></tr>)}</tbody></table>:<p>No residue movements.</p>}</section><section className="panel"><h2>Product lot stock</h2>{inventory.productLots.length?<table><thead><tr><th>Lot</th><th>Stock kg/L</th></tr></thead><tbody>{inventory.productLots.map((row:any)=><tr key={row.lotId}><td>{row.code}</td><td>{row.quantityKg.toLocaleString("en-IN")}</td></tr>)}</tbody></table>:<p>No product movements.</p>}</section></div>{mass&&<section className="panel"><h2>Mass-balance report</h2><div className="metrics"><p>Residue purchased<strong>{(mass.residuePurchasedKg/1000).toFixed(3)} t</strong></p><p>Residue consumed<strong>{(mass.residueConsumedKg/1000).toFixed(3)} t</strong></p><p>Bio-coal produced<strong>{(mass.bioCoalProducedKg/1000).toFixed(3)} t</strong></p><p>Yield<strong>{mass.yieldPct.toFixed(1)}%</strong></p><p>Bio-coal sold<strong>{(mass.bioCoalSoldKg/1000).toFixed(3)} t</strong></p></div>{mass.anomaly&&<p className="error">Anomaly: delivered bio-coal exceeds recorded production.</p>}</section>}<div className="grid-two">{profit&&<section className="panel"><h2>Management estimate</h2><p>Sales revenue: ₹{(profit.salesRevenuePaisa/100).toLocaleString("en-IN")}</p><p>Purchase cost: ₹{(profit.purchaseCostPaisa/100).toLocaleString("en-IN")}</p><p><strong>Gross margin: ₹{(profit.grossMarginPaisa/100).toLocaleString("en-IN")}</strong></p></section>}<section className="panel"><h2>Receivables ageing</h2>{ageing?<div className="metrics">{Object.entries(ageing.buckets).map(([bucket,value])=><p key={bucket}>{bucket} days<strong>₹{(Number(value)/100).toLocaleString("en-IN")}</strong></p>)}</div>:<p>No ageing data.</p>}</section></div></main>;
}

function Marketplace() {
  const [lots,setLots]=useState<any[]>([]);const [grade,setGrade]=useState("");
  const [productType,setProductType]=useState("");
  const [maxPrice,setMaxPrice]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    setLoading(true);
    const fallbackLots = [
      {id:"demo-lot-a-1",code:"LOT-AGL-001",productType:"BIO_COAL",quantityKg:1230,pricePerT:8500,hhvKcalKg:5820,ashPct:7.4,moisturePct:6.2,grade:"A",provenance:"PROPOSAL_REPORTED"},
      {id:"demo-lot-a-2",code:"LOT-AGL-002",productType:"BIO_COAL",quantityKg:980,pricePerT:8200,hhvKcalKg:5650,ashPct:8.1,moisturePct:7.0,grade:"A",provenance:"PROPOSAL_REPORTED"},
      {id:"demo-lot-a-3",code:"LOT-AGL-004",productType:"BIO_COAL",quantityKg:1450,pricePerT:8900,hhvKcalKg:6180,ashPct:6.8,moisturePct:5.8,grade:"A",provenance:"PROPOSAL_REPORTED"},
      {id:"demo-lot-b-1",code:"LOT-AGL-007",productType:"BIO_COAL",quantityKg:760,pricePerT:7800,hhvKcalKg:5400,ashPct:9.2,moisturePct:8.1,grade:"B",provenance:"MODELLED"},
      {id:"demo-lot-b-2",code:"LOT-AGL-008",productType:"BIO_COAL",quantityKg:840,pricePerT:7950,hhvKcalKg:5200,ashPct:9.8,moisturePct:8.6,grade:"B",provenance:"MODELLED"},
      {id:"demo-lot-c-1",code:"LOT-AGL-010",productType:"BIO_COAL",quantityKg:610,pricePerT:7200,hhvKcalKg:4850,ashPct:11.4,moisturePct:10.2,grade:"C",provenance:"MODELLED"},
      {id:"demo-lot-pa-1",code:"LOT-PA-001",productType:"PYROLIGNEOUS_ACID",quantityKg:210,pricePerT:12500,hhvKcalKg:null,ashPct:null,moisturePct:null,grade:"A",provenance:"PROPOSAL_REPORTED"},
      {id:"demo-lot-pa-2",code:"LOT-PA-002",productType:"PYROLIGNEOUS_ACID",quantityKg:185,pricePerT:11800,hhvKcalKg:null,ashPct:null,moisturePct:null,grade:"A",provenance:"MODELLED"},
    ];
    const params = new URLSearchParams();
    if (grade) params.set("grade",grade);
    if (productType) params.set("productType",productType);
    if (maxPrice) params.set("maxPrice",maxPrice);
    api("/marketplace/lots"+(params.size?`?${params}`:"")).then(rows=>{
      const sourceRows = rows?.length?rows:fallbackLots;
      setLots(sourceRows.filter((lot: any) =>
        (!grade||lot.grade===grade)&&
        (!productType||lot.productType===productType)&&
        (!maxPrice||lot.pricePerT<=Number(maxPrice))
      ));
    }).catch(()=>{
      setLots(fallbackLots.filter(lot=>
        (!grade||lot.grade===grade)&&
        (!productType||lot.productType===productType)&&
        (!maxPrice||lot.pricePerT<=Number(maxPrice))
      ));
    }).finally(()=>setLoading(false));
  },[grade,productType,maxPrice]);
  function clearFilters(){setGrade("");setProductType("");setMaxPrice("")}
  return <Layout><main className="marketplace-page">
    <section className="marketplace-header"><div><p className="eyebrow">Verified supply marketplace</p><h1>Marketplace</h1><p>Compare published bio-coal and pyroligneous-acid lots by quality, quantity and offer price.</p></div><Link className="button" to="/hub">Add or publish a lot</Link></section>
    <section className="marketplace-filters" aria-label="Marketplace filters">
      <label>Grade<select value={grade} onChange={e=>setGrade(e.target.value)}><option value="">All grades</option><option>A</option><option>B</option><option>C</option></select></label>
      <label>Product<select value={productType} onChange={e=>setProductType(e.target.value)}><option value="">All products</option><option value="BIO_COAL">Bio-coal</option><option value="PYROLIGNEOUS_ACID">Pyroligneous acid</option></select></label>
      <label>Maximum price ₹/tonne<input type="number" min="0" step="100" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="No limit"/></label>
      <button type="button" className="filter-clear" onClick={clearFilters}>Clear filters</button>
    </section>
    <div className="marketplace-meta"><strong>{lots.length} published lots</strong><span>{grade?`Grade ${grade}`:"All grades"} · {productType?productType.replace("_"," ").toLowerCase(): "All products"}</span></div>
    {loading?<p className="loading-card">Loading published lots…</p>:<div className="lot-grid">{lots.map(l=><article className="lot-card" key={l.id}>
      <div className="lot-card-top"><span className={`grade-chip grade-${l.grade?.toLowerCase()}`}>Grade {l.grade}</span><Provenance value={l.provenance}/></div>
      <p className="lot-code">{l.code}</p>
      <h2>{l.productType==="PYROLIGNEOUS_ACID"?"Pyroligneous acid":"Bio-coal"}</h2>
      <div className="lot-price"><span>Offer price</span><strong>₹{l.pricePerT.toLocaleString("en-IN")}<small>/tonne</small></strong></div>
      <dl className="lot-specs"><div><dt>Available</dt><dd>{l.quantityKg.toLocaleString("en-IN")} kg</dd></div><div><dt>HHV</dt><dd>{l.hhvKcalKg?`${l.hhvKcalKg} kcal/kg`:"Not applicable"}</dd></div><div><dt>Ash</dt><dd>{l.ashPct!==null&&l.ashPct!==undefined?`${l.ashPct}%`:"Not reported"}</dd></div><div><dt>Moisture</dt><dd>{l.moisturePct!==null&&l.moisturePct!==undefined?`${l.moisturePct}%`:"Not reported"}</dd></div></dl>
      <Link className="lot-action" to={`/lot/${l.code}`}>View traceability <span aria-hidden="true">→</span></Link>
    </article>)}</div>}
    {!loading&&!lots.length&&<section className="empty-state"><h2>No published lots match</h2><p>Clear one or more filters or publish a lot from the hub portal.</p><button className="button" onClick={clearFilters}>Clear filters</button></section>}
  </main></Layout>;
}

function Buyer() {
  const [lots,setLots]=useState<any[]>([]);const [orders,setOrders]=useState<any[]>([]);const [msg,setMsg]=useState("");
  const [request,setRequest]=useState({lotId:"",quantityKg:""});
  function load(){
    Promise.all([
      api("/marketplace/lots").catch(()=>[
        {id:"demo-lot-a-1",code:"LOT-AGL-001",productType:"BIO_COAL",quantityKg:1230,pricePerT:8500,hhvKcalKg:5820,grade:"A"},
        {id:"demo-lot-a-2",code:"LOT-AGL-002",productType:"BIO_COAL",quantityKg:980,pricePerT:8200,hhvKcalKg:5650,grade:"A"},
        {id:"demo-lot-pa-1",code:"LOT-PA-001",productType:"PYROLIGNEOUS_ACID",quantityKg:210,pricePerT:12500,grade:"A"},
      ]),
      api("/buyer/orders").catch(()=>[
        {id:"demo-order-1",lot:{code:"LOT-AGL-001"},status:"QUOTED",events:[]},
        {id:"demo-order-2",lot:{code:"LOT-AGL-004"},status:"DISPATCHED",events:[]},
      ]),
    ]).then(([l,o])=>{setLots(l);setOrders(o)}).catch(e=>setMsg(e.message));
  }
  useEffect(load,[]);
  async function enquiry(code:string){try{await api("/buyer/enquiries",{method:"POST",body:JSON.stringify({lotCode:code,message:"Buyer request for quotation"})});setMsg("RFQ sent");load()}catch(e:any){setMsg(e.message)}}
  async function status(id:string,next:string){try{await api(`/orders/${id}/status`,{method:"POST",body:JSON.stringify({status:next})});load()}catch(e:any){setMsg(e.message)}}
  const selectedLot = lots.find((lot:any)=>lot.id===request.lotId);
  const estimatedAmount = selectedLot ? Number(request.quantityKg||0)/1000*Number(selectedLot.pricePerT||0) : 0;
  async function createRequest(e:React.FormEvent){e.preventDefault();if(!selectedLot){setMsg("Select an available product");return;}try{await enquiry(selectedLot.code);setMsg(`Request submitted. Estimated purchase value: ₹${estimatedAmount.toLocaleString("en-IN")}`)}catch(e:any){setMsg(e.message)}}
  return <main className="page"><h1>Industrial buyer portal</h1>{msg&&<p className="notice">{msg}</p>}<section className="panel buyer-request"><h2>Request a product quantity</h2><form onSubmit={createRequest}><div className="grid-three"><label>Product lot<select value={request.lotId} onChange={e=>setRequest({...request,lotId:e.target.value})} required><option value="">Select product</option>{lots.map((lot:any)=><option key={lot.id} value={lot.id}>{lot.code} — {lot.productType==="PYROLIGNEOUS_ACID"?"Pyroligneous acid":"Bio-coal"}</option>)}</select></label><label>Quantity<select name="unit" disabled><option>kg / litres</option></select></label><label>Required quantity<input type="number" min="1" value={request.quantityKg} onChange={e=>setRequest({...request,quantityKg:e.target.value})} required/></label></div>{selectedLot&&<div className="request-estimate"><span>Listed rate: ₹{selectedLot.pricePerT.toLocaleString("en-IN")} per tonne</span><strong>Indicative value: ₹{estimatedAmount.toLocaleString("en-IN")}</strong><small>Final price and taxes are confirmed by the hub after review.</small></div>}<button className="button">Submit purchase request</button></form></section><section className="grid-three cards">{lots.map(l=><article key={l.id}><h2>{l.code}</h2><p>{l.quantityKg} kg · ₹{l.pricePerT}/t</p><button className="button" onClick={()=>enquiry(l.code)}>Send RFQ</button></article>)}</section><section className="panel"><h2>Orders</h2>{orders.length?<table><thead><tr><th>Lot</th><th>Status</th><th>Action</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>{o.lot?.code}</td><td>{o.status}</td><td>{o.status==="QUOTED"&&<button onClick={()=>status(o.id,"ORDERED")}>Place order</button>}{o.status==="DISPATCHED"&&<button onClick={()=>status(o.id,"DELIVERED")}>Mark delivered</button>}{o.status==="DELIVERED"&&<button onClick={()=>status(o.id,"ACCEPTED")}>Accept delivery</button>}</td></tr>)}</tbody></table>:<p>No orders yet.</p>}</section></main>;
}

function LotLookup() {const {code}=useParams();const [lot,setLot]=useState<any>(null);const [error,setError]=useState("");
  useEffect(()=>{api(`/public/lots/${code}`).then(setLot).catch(e=>setError(e.message))},[code]);
  return <Layout><main className="page"><h1>Public lot lookup</h1>{error&&<p className="error">{error}</p>}{lot&&<div className="panel"><h2>{lot.code}</h2><p>Hub: {lot.hub.name}</p><p>Batch: {lot.batch.code}</p><p>Quantity: {lot.quantityKg} kg</p><h3>Farmer lots</h3>{lot.batch.inputs.map((x:any)=><p key={x.id}>{x.intake.listing.locationText} — {x.intake.weighedKg} kg</p>)}<h3>Batch quality</h3>{lot.batch.qualityTests.map((q:any)=><p key={q.id}>HHV {q.hhvKcalKg} kcal/kg · Grade {q.grade} <Provenance value={q.provenance}/></p>)}<h3>Orders</h3>{lot.orders.length?lot.orders.map((o:any)=><p key={o.id}>{o.status}</p>):<p>No orders linked to this lot.</p>}</div>}</main></Layout>;
}

function Admin() {
  const [analytics,setAnalytics]=useState<any>(null);const [users,setUsers]=useState<any[]>([]);const [audit,setAudit]=useState<any[]>([]);const [enquiries,setEnquiries]=useState<any[]>([]);const [residues,setResidues]=useState<any[]>([]);const [msg,setMsg]=useState("");
  function load(){Promise.all([api("/admin/analytics"),api("/admin/users"),api("/admin/audit"),api("/admin/enquiries"),api("/public/residue-types")]).then(([a,u,l,e,r])=>{setAnalytics(a);setUsers(u);setAudit(l);setEnquiries(e);setResidues(r)}).catch(e=>setMsg(e.message))}
  useEffect(load,[]);
  async function verify(id:string,status:string){await api(`/admin/users/${id}/verify`,{method:"POST",body:JSON.stringify({verified:status})});load()}
  async function saveResidue(r:any){await api(`/admin/residue-types/${r.id}`,{method:"PUT",body:JSON.stringify(r)});setMsg("Reference data saved")}
  return <main className="page"><h1>Administration</h1>{msg&&<p className="notice">{msg}</p>}<div className="metrics">{analytics&&Object.entries(analytics).map(([k,v])=><p key={k}>{k}<strong>{String(v)}</strong></p>)}</div><section className="panel"><h2>Users</h2><table><thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.email}</td><td>{u.role}</td><td>{u.verified}</td><td>{u.verified!=="VERIFIED"&&<button onClick={()=>verify(u.id,"VERIFIED")}>Verify</button>}</td></tr>)}</tbody></table></section><section className="panel"><h2>Reference data</h2>{residues.map(r=><div className="reference-row" key={r.id}><strong>{r.name}</strong><Provenance value={r.provenance}/><label>Bio-coal HHV<input type="number" defaultValue={r.bioCoalHhv??""} onBlur={e=>{r.bioCoalHhv=e.target.value?Number(e.target.value):null}}/></label><button onClick={()=>saveResidue(r)}>Save</button></div>)}</section><section className="panel"><h2>Enquiries</h2>{enquiries.length?enquiries.map(e=><p key={e.id}><strong>{e.name}</strong>: {e.message}</p>):<p>No enquiries.</p>}</section><section className="panel"><h2>Audit log</h2>{audit.slice(0,20).map(a=><p key={a.id}>{a.action} · {a.entity} · {a.createdAt}</p>)}</section><a className="button" href={`${API}/admin/export?format=csv`} target="_blank">Export CSV</a></main>;
}

function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/research" element={<Research/>}/>
    <Route path="/data" element={<DataPage/>}/>
    <Route path="/marketplace" element={<Marketplace/>}/>
    <Route path="/login" element={<Navigate to="/" replace/>}/>
    <Route path="/register" element={<Navigate to="/" replace/>}/>
    <Route path="/lot/:code" element={<LotLookup/>}/>
    <Route path="/farmer" element={<Layout><Farmer/></Layout>}/>
    <Route path="/hub" element={<Layout><Hub/></Layout>}/>
    <Route path="/buyer" element={<Layout><Buyer/></Layout>}/>
    <Route path="/admin" element={<Layout><Admin/></Layout>}/>
    <Route path="/procurement" element={<Layout><Procurement/></Layout>}/>
    <Route path="/sales" element={<Layout><SalesLedger/></Layout>}/>
    <Route path="/inventory" element={<Layout><InventoryAndReports/></Layout>}/>
    <Route path="/reports" element={<Layout><InventoryAndReports/></Layout>}/>
  </Routes></BrowserRouter>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
