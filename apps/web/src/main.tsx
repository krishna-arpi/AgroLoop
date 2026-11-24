import React, { createContext, useContext, useEffect, useState } from "react";
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

type Language = "en" | "hi";

const hindiTranslations: Record<string, string> = {
  "Research": "अनुसंधान",
  "Materials": "सामग्री",
  "Sell residue": "अवशेष बेचें",
  "Request material": "सामग्री का अनुरोध",
  "Procurement": "खरीद",
  "Sales": "बिक्री",
  "Inventory": "भंडार",
  "Circular rural bioeconomy": "चक्रीय ग्रामीण जैव-अर्थव्यवस्था",
  "Turning residue into industrial value": "कृषि अवशेषों को औद्योगिक मूल्य में बदलना",
  "A traceable platform proposed for farmers, village processing hubs and industrial fuel buyers.": "किसानों, गांव के प्रसंस्करण केंद्रों और औद्योगिक ईंधन खरीदारों के लिए प्रस्तावित एक पता लगाने योग्य मंच।",
  "Explore the data": "आंकड़े देखें",
  "Read the research": "अनुसंधान पढ़ें",
  "Farmers & FPOs": "किसान और किसान उत्पादक संगठन",
  "Register residue, schedule collection and track earnings.": "अवशेष दर्ज करें, संग्रह तय करें और कमाई देखें।",
  "Processing hubs": "प्रसंस्करण केंद्र",
  "Verify intake, batches, laboratory quality and published lots.": "आवक, बैच, प्रयोगशाला गुणवत्ता और प्रकाशित खेपों की पुष्टि करें।",
  "Industrial buyers": "औद्योगिक खरीदार",
  "Browse quality-verified lots and manage delivery acceptance.": "गुणवत्ता-जाँची खेपें देखें और डिलीवरी की स्वीकृति प्रबंधित करें।",
  "Institutional research framework": "संस्थागत अनुसंधान रूपरेखा",
  "A circular platform for residue valorization": "अवशेषों के मूल्यवर्धन के लिए एक चक्रीय मंच",
  "AgroLoop studies how decentralized thermochemical conversion and a traceable three-sided marketplace can reduce open-burning pressure while supplying engineered industrial fuel.": "AgroLoop यह अध्ययन करता है कि विकेन्द्रीकृत ताप-रासायनिक रूपांतरण और पता लगाने योग्य त्रिपक्षीय बाज़ार खुले में अवशेष जलाने के दबाव को कम करते हुए तैयार औद्योगिक ईंधन की आपूर्ति कैसे कर सकते हैं।",
  "3 research objectives": "3 अनुसंधान उद्देश्य",
  "5 tonne/day reference hub": "5 टन/दिन का संदर्भ केंद्र",
  "350–500°C calibration range": "350–500°C अंशांकन सीमा",
  "Potential SDG contributions": "संभावित सतत विकास लक्ष्य योगदान",
  "Potential target alignment:": "संभावित लक्ष्य संरेखण:",
  "View official UN SDG targets": "संयुक्त राष्ट्र के आधिकारिक SDG लक्ष्य देखें",
  "Research page sections": "अनुसंधान पृष्ठ के अनुभाग",
  "Potential contributions only": "केवल संभावित योगदान",
  "These links describe the project's intended contribution. They are not verified SDG outcomes or certification; measured lifecycle and social data are required.": "ये संबंध परियोजना के अपेक्षित योगदान बताते हैं। ये सत्यापित SDG परिणाम या प्रमाणन नहीं हैं; इनके लिए मापे गए जीवन-चक्र और सामाजिक आंकड़े आवश्यक हैं।",
  "SDG 7": "SDG 7",
  "Affordable and clean energy": "सस्ती और स्वच्छ ऊर्जा",
  "Potential link: locally produced bio-coal may provide an alternative fuel when biomass is sustainably sourced and lifecycle emissions are demonstrated.": "संभावित संबंध: टिकाऊ स्रोत से प्राप्त बायोमास और प्रमाणित जीवन-चक्र उत्सर्जन की स्थिति में स्थानीय बायो-कोल वैकल्पिक ईंधन दे सकता है।",
  "SDG 8": "SDG 8",
  "Decent work and economic growth": "सम्मानजनक कार्य और आर्थिक विकास",
  "Potential link: organized residue collection and village processing could create rural market access and livelihood opportunities.": "संभावित संबंध: व्यवस्थित अवशेष संग्रह और गांवों में प्रसंस्करण से ग्रामीण बाजार पहुंच और आजीविका के अवसर बन सकते हैं।",
  "SDG 9": "SDG 9",
  "Industry, innovation and infrastructure": "उद्योग, नवाचार और बुनियादी ढांचा",
  "Potential link: modular retorts and traceable processing infrastructure apply local innovation to small-scale industrial supply.": "संभावित संबंध: मॉड्यूलर रिटॉर्ट और पता लगाने योग्य प्रसंस्करण ढांचा छोटे स्तर की औद्योगिक आपूर्ति में स्थानीय नवाचार लागू करते हैं।",
  "SDG 12": "SDG 12",
  "Responsible consumption and production": "जिम्मेदार उपभोग और उत्पादन",
  "Potential link: converting agricultural residues into useful products may improve resource use and reduce unmanaged residue disposal.": "संभावित संबंध: कृषि अवशेषों को उपयोगी उत्पादों में बदलने से संसाधनों का बेहतर उपयोग और अव्यवस्थित निपटान में कमी आ सकती है।",
  "SDG 13": "SDG 13",
  "Climate action": "जलवायु कार्रवाई",
  "Potential link: avoiding open burning may reduce some emissions, subject to field measurement and full lifecycle accounting.": "संभावित संबंध: खुले में जलाने से बचने पर कुछ उत्सर्जन घट सकते हैं; इसकी पुष्टि के लिए क्षेत्रीय मापन और पूर्ण जीवन-चक्र लेखांकन आवश्यक है।",
  "Context": "संदर्भ",
  "Objectives": "उद्देश्य",
  "Methodology": "कार्यप्रणाली",
  "Data": "आंकड़े",
  "Economics": "अर्थशास्त्र",
  "Literature": "साहित्य",
  "Problem and response": "समस्या और समाधान",
  "Closing the residue-to-industrial-fuel loop": "अवशेष से औद्योगिक ईंधन तक का चक्र पूरा करना",
  "The ecological constraint": "पारिस्थितिक चुनौती",
  "Seasonal residue burning contributes aerosol loading, smog episodes and soil organic-carbon loss. Untreated residue also retains volatile alkali salts and chlorine that can accelerate slagging, fouling and corrosion in demanding thermal equipment.": "मौसमी अवशेष जलाने से वायुमंडलीय कण, धुंध और मिट्टी के जैविक कार्बन की हानि बढ़ती है। अनुपचारित अवशेषों में वाष्पशील क्षार लवण और क्लोरीन भी रह सकते हैं, जो उच्च तापीय उपकरणों में जमाव, परत बनने और क्षरण को तेज कर सकते हैं।",
  "The proposed system": "प्रस्तावित प्रणाली",
  "AgroLoop proposes village-cluster retorts that convert heterogeneous residues into bio-coal and pyroligneous acid. A digital supply chain coordinates farmers or FPOs, processing hubs and industrial buyers while preserving batch evidence.": "AgroLoop गांव-समूहों में ऐसे रिटॉर्ट प्रस्तावित करता है जो विभिन्न अवशेषों को बायो-कोल और पाइरोलिग्नियस एसिड में बदलते हैं। डिजिटल आपूर्ति श्रृंखला बैच का रिकॉर्ड सुरक्षित रखते हुए किसानों या FPO, प्रसंस्करण केंद्रों और औद्योगिक खरीदारों का समन्वय करती है।",
  "Village hub": "ग्राम केंद्र",
  "Supply and trace residue": "अवशेष की आपूर्ति और ट्रेसिंग",
  "Process and characterize": "प्रसंस्करण और विश्लेषण",
  "Require and accept fuel": "ईंधन की मांग और स्वीकृति",
  "Three coordinated objectives": "तीन समन्वित उद्देश्य",
  "Research design": "अनुसंधान रूपरेखा",
  "Thermochemical optimization": "ताप-रासायनिक अनुकूलन",
  "Calibrate mixed-residue devolatilization across 350–500°C to target bio-coal above 5,800 kcal/kg HHV while characterizing volatile alkali and chlorine behavior.": "350–500°C पर मिश्रित अवशेषों के वाष्पीकरण का अंशांकन करें; 5,800 kcal/kg से अधिक HHV वाले बायो-कोल का लक्ष्य रखें और वाष्पशील क्षार तथा क्लोरीन के व्यवहार का विश्लेषण करें।",
  "Experimental output: HHV, yield and ash chemistry": "प्रायोगिक परिणाम: HHV, उपज और राख की रासायनिक संरचना",
  "Decentralized retort design": "विकेन्द्रीकृत रिटॉर्ट डिज़ाइन",
  "Engineer a modular sealed batch retort with integrated syngas recirculation and condensate recovery, designed for low external fuel use during steady operation.": "एक मॉड्यूलर, बंद बैच रिटॉर्ट तैयार करें जिसमें सिं गैस पुनःपरिसंचरण और संघनित द्रव पुनर्प्राप्ति हो, ताकि स्थिर संचालन में बाहरी ईंधन कम लगे।",
  "Engineering output: 350–500°C operating envelope": "इंजीनियरिंग परिणाम: 350–500°C संचालन सीमा",
  "Supply-chain platform validation": "आपूर्ति-श्रृंखला मंच का सत्यापन",
  "Test batch verification, dynamic procurement, pricing, quality acceptance and MRV-style carbon estimation across the three participating groups.": "तीनों सहभागी समूहों में बैच सत्यापन, गतिशील खरीद, मूल्य निर्धारण, गुणवत्ता स्वीकृति और MRV-आधारित कार्बन अनुमान की जांच करें।",
  "Digital output: traceable lot and order records": "डिजिटल परिणाम: ट्रेस करने योग्य खेप और ऑर्डर रिकॉर्ड",
  "Technical methodology": "तकनीकी कार्यप्रणाली",
  "From residue collection to industrial lot": "अवशेष संग्रह से औद्योगिक खेप तक",
  "Feed moisture": "कच्चे माल की नमी",
  "Shred size": "कटे पदार्थ का आकार",
  "Ignition transition": "प्रज्वलन संक्रमण",
  "Residence time": "प्रक्रिया में रहने का समय",
  "Target HHV": "लक्ष्य HHV",
  "Analytical protocol": "विश्लेषण प्रोटोकॉल",
  "Data collection and candidate output profile": "आंकड़ा संग्रह और संभावित उत्पाद प्रोफ़ाइल",
  "Proximate composition, HHV, ash fusion, alkali and chlorine behavior, moisture and digital throughput are proposed for ASTM/ISO characterization.": "ASTM/ISO विश्लेषण के लिए निकटस्थ संरचना, HHV, राख गलन, क्षार और क्लोरीन व्यवहार, नमी तथा डिजिटल उत्पादन मापन प्रस्तावित हैं।",
  "Residue": "अवशेष",
  "Raw kcal/kg": "कच्चा kcal/kg",
  "Bio-coal HHV": "बायो-कोल HHV",
  "Char yield": "चार उपज",
  "Indicative slag/alkali note": "जमाव/क्षार संबंधी संकेत",
  "Energy density benchmark": "ऊर्जा घनत्व मानक",
  "Raw biomass average": "कच्चे बायोमास का औसत",
  "Densified pellets": "सघन पेलेट",
  "Fossil coal G12": "जीवाश्म कोयला G12",
  "AgroLoop bio-coal": "AgroLoop बायो-कोल",
  "Primary characterization methods": "प्रमुख विश्लेषण विधियां",
  "Solid fuel:": "ठोस ईंधन:",
  "proximate analysis, ultimate analysis, bomb-calorimeter HHV and ash fusion": "निकटस्थ और अंतिम विश्लेषण, बम कैलोरीमीटर HHV तथा राख गलन",
  "Fouling risk:": "जमाव का जोखिम:",
  "alkali index, chlorine and major ash chemistry": "क्षार सूचकांक, क्लोरीन और राख की प्रमुख रासायनिक संरचना",
  "Condensate:": "संघनित द्रव:",
  "pyroligneous acid yield and preliminary biostimulant evaluation": "पाइरोलिग्नियस एसिड उपज और प्रारंभिक जैव-उत्तेजक मूल्यांकन",
  "System evidence:": "प्रणाली साक्ष्य:",
  "input/output mass balance, temperature profile and residence time": "इनपुट/आउटपुट द्रव्यमान संतुलन, तापमान प्रोफ़ाइल और प्रक्रिया समय",
  "Techno-economic framework": "तकनीकी-आर्थिक रूपरेखा",
  "Reference 5 tonne/day hub": "5 टन/दिन का संदर्भ केंद्र",
  "Annual operating EBITDA": "वार्षिक परिचालन EBITDA",
  "Proposal assumption; to be recalculated from measured inputs and operating data.": "प्रस्ताव की धारणा; मापे गए इनपुट और संचालन आंकड़ों से दोबारा गणना आवश्यक।",
  "Capital payback": "पूंजी वापसी अवधि",
  "Reference model figure pending validation against capex, utilization and downtime.": "संदर्भ मॉडल का आंकड़ा; पूंजीगत लागत, उपयोग और बंद रहने के समय के आधार पर सत्यापन बाकी है।",
  "Net annual abatement": "वार्षिक शुद्ध उत्सर्जन कमी",
  "Estimated value only; not verified credits or an audited inventory result.": "केवल अनुमानित मूल्य; सत्यापित क्रेडिट या लेखापरीक्षित सूची परिणाम नहीं।",
  "ESTIMATED, NOT VERIFIED": "अनुमानित, सत्यापित नहीं",
  "Farmer economics": "किसान अर्थशास्त्र",
  "Proposed floor price:": "प्रस्तावित न्यूनतम मूल्य:",
  "of baled residue delivered to the local hub.": "स्थानीय केंद्र पर पहुंचाए गए गांठबद्ध अवशेष का।",
  "Pyroligneous acid": "पाइरोलिग्नियस एसिड",
  "Target co-condensate yield:": "लक्ष्य सह-संघनित द्रव उपज:",
  "of processed residue. Agricultural benefit remains to be evaluated experimentally.": "प्रसंस्कृत अवशेष का। कृषि लाभ का प्रयोगात्मक मूल्यांकन अभी बाकी है।",
  "State of the art": "वर्तमान शोध स्थिति",
  "Literature review and identified gaps": "साहित्य समीक्षा और पहचानी गई कमियां",
  "Autothermal carbonization and volatile alkali/chlorine removal from high-silica residues.": "उच्च-सिलिका अवशेषों से वाष्पशील क्षार/क्लोरीन हटाने के लिए ऑटोथर्मल कार्बनीकरण।",
  "Decentralized versus centralized biomass processing economics and logistics.": "विकेन्द्रीकृत और केंद्रीकृत बायोमास प्रसंस्करण की अर्थव्यवस्था और लॉजिस्टिक्स।",
  "Digital marketplace architectures for agricultural residue in emerging circular economies.": "उभरती चक्रीय अर्थव्यवस्थाओं में कृषि अवशेषों के लिए डिजिटल बाज़ार संरचनाएं।",
  "Operational research gap": "संचालन अनुसंधान की कमी",
  "Current literature lacks an integrated, low-capital thermal upgrading model combining in-situ alkali volatilization, modular retort operation and a digitally coordinated procurement system for fragmented smallholders and continuous industrial demand.": "वर्तमान साहित्य में ऐसा एकीकृत, कम-पूंजी वाला तापीय उन्नयन मॉडल नहीं है जो स्थल पर क्षार वाष्पीकरण, मॉड्यूलर रिटॉर्ट संचालन और छोटे किसानों तथा निरंतर औद्योगिक मांग के लिए डिजिटल खरीद प्रणाली को जोड़े।",
  "References": "संदर्भ",
  "Verification note:": "सत्यापन टिप्पणी:",
  "Verify citations and DOIs before academic submission.": "शैक्षणिक प्रस्तुति से पहले उद्धरणों और DOI की पुष्टि करें।",
  "Residue data and benchmarks": "अवशेष आंकड़े और मानक",
  "Raw biomass": "कच्चा बायोमास",
  "Hub economics calculator": "केंद्र अर्थशास्त्र कैलकुलेटर",
  "Processing": "प्रसंस्करण",
  "Farmer payout/day": "किसान भुगतान/दिन",
  "Bio-coal/day": "बायो-कोल/दिन",
  "Acid target/day": "एसिड लक्ष्य/दिन",
  "Outputs use ₹1,800–₹2,200 per tonne, the selected residue char yield and a 21 litres/tonne acid target.": "परिणामों में ₹1,800–₹2,200 प्रति टन, चुने गए अवशेष की चार उपज और 21 लीटर/टन एसिड लक्ष्य का उपयोग किया गया है।",
  "The five residues have a dynamically calculated raw-biomass mean of": "पांच अवशेषों का कच्चे बायोमास का गतिशील रूप से गणना किया गया औसत है",
  "kcal/kg. The separate proposal average of 3,450 kcal/kg is inconsistent and is not used here. Values are proposal-reported or targeted pending experimental verification.": "kcal/kg। प्रस्ताव में दिया गया 3,450 kcal/kg का अलग औसत इससे मेल नहीं खाता, इसलिए यहां उसका उपयोग नहीं है। प्रयोगात्मक सत्यापन तक मान प्रस्तावित या लक्ष्यित हैं।",
  "Marketplace": "बाज़ार",
  "Verified supply marketplace": "सत्यापित आपूर्ति बाज़ार",
  "Compare published bio-coal and pyroligneous-acid lots by quality, quantity and offer price.": "प्रकाशित बायो-कोल और पाइरोलिग्नियस एसिड खेपों की गुणवत्ता, मात्रा और प्रस्तावित कीमत की तुलना करें।",
  "Add or publish a lot": "खेप जोड़ें या प्रकाशित करें",
  "All products": "सभी उत्पाद",
  "Maximum price ₹/tonne": "अधिकतम कीमत ₹/टन",
  "No limit": "कोई सीमा नहीं",
  "Clear filters": "फ़िल्टर हटाएं",
  "published lots": "प्रकाशित खेपें",
  "All grades": "सभी ग्रेड",
  "Loading published lots…": "प्रकाशित खेपें लोड हो रही हैं…",
  "Offer price": "प्रस्तावित कीमत",
  "Available": "उपलब्ध",
  "Not applicable": "लागू नहीं",
  "Not reported": "रिपोर्ट नहीं किया गया",
  "View traceability": "ट्रेस विवरण देखें",
  "No published lots match": "कोई प्रकाशित खेप मेल नहीं खाती",
  "Clear one or more filters or publish a lot from the hub portal.": "एक या अधिक फ़िल्टर हटाएं या केंद्र पोर्टल से खेप प्रकाशित करें।",
  "Farmer residue offer": "किसान अवशेष प्रस्ताव",
  "Add the residue you want to sell. The hub will review quantity, moisture and collection details before confirming a purchase.": "बेचने के लिए अवशेष जोड़ें। खरीद की पुष्टि से पहले केंद्र मात्रा, नमी और संग्रह विवरण की समीक्षा करेगा।",
  "Profile": "प्रोफ़ाइल",
  "Save profile": "प्रोफ़ाइल सहेजें",
  "Nearest hubs": "निकटतम केंद्र",
  "No approved hubs have coordinates yet.": "अभी तक किसी स्वीकृत केंद्र के निर्देशांक उपलब्ध नहीं हैं।",
  "Create residue listing": "अवशेष सूची बनाएं",
  "Quantity (t)": "मात्रा (टन)",
  "Moisture %": "नमी %",
  "Bale or loose": "गांठबद्ध या खुला",
  "Baled": "गांठबद्ध",
  "Loose": "खुला",
  "Location": "स्थान",
  "Available from": "से उपलब्ध",
  "Available to": "तक उपलब्ध",
  "Create listing": "सूची बनाएं",
  "Listings": "सूचियां",
  "Quantity": "मात्रा",
  "Status": "स्थिति",
  "Action": "कार्रवाई",
  "Request pickup": "उठाव का अनुरोध",
  "No listings yet.": "अभी कोई सूची नहीं है।",
  "Hub operator portal": "केंद्र संचालक पोर्टल",
  "Intake": "आवक",
  "Batches": "बैच",
  "Residue intakes": "अवशेष आवक",
  "Farmer": "किसान",
  "Actions": "कार्रवाइयां",
  "Accept": "स्वीकार करें",
  "Reject": "अस्वीकार करें",
  "Schedule pickup": "उठाव तय करें",
  "Collected": "एकत्र किया",
  "Record weighed": "तौला हुआ दर्ज करें",
  "Mark paid": "भुगतान किया चिह्नित करें",
  "No intake listings.": "आवक की कोई सूची नहीं है।",
  "Peak temperature °C": "अधिकतम तापमान °C",
  "Autothermal transition °C": "ऑटोथर्मल संक्रमण °C",
  "Residence minutes": "प्रक्रिया अवधि (मिनट)",
  "Input kg": "इनपुट kg",
  "Bio-coal kg": "बायो-कोल kg",
  "Pyroligneous acid L": "पाइरोलिग्नियस एसिड L",
  "Create batch": "बैच बनाएं",
  "HHV kcal/kg": "HHV kcal/kg",
  "Ash %": "राख %",
  "Volatile matter %": "वाष्पशील पदार्थ %",
  "Fixed carbon %": "स्थिर कार्बन %",
  "Standard": "मानक",
  "Save quality test": "गुणवत्ता जांच सहेजें",
  "Publish lot": "खेप प्रकाशित करें",
  "Product": "उत्पाद",
  "Quantity kg": "मात्रा kg",
  "Price/tonne": "कीमत/टन",
  "Grade": "ग्रेड",
  "Industrial buyer portal": "औद्योगिक खरीदार पोर्टल",
  "Request a product quantity": "उत्पाद की मात्रा का अनुरोध करें",
  "Product lot": "उत्पाद खेप",
  "Select product": "उत्पाद चुनें",
  "Required quantity": "आवश्यक मात्रा",
  "Listed rate: ₹": "सूचीबद्ध दर: ₹",
  "Indicative value: ₹": "संकेतात्मक मूल्य: ₹",
  "Final price and taxes are confirmed by the hub after review.": "समीक्षा के बाद केंद्र अंतिम कीमत और करों की पुष्टि करेगा।",
  "Submit purchase request": "खरीद अनुरोध भेजें",
  "Send RFQ": "RFQ भेजें",
  "Orders": "ऑर्डर",
  "Lot": "खेप",
  "Place order": "ऑर्डर दें",
  "Mark delivered": "डिलीवर किया चिह्नित करें",
  "Accept delivery": "डिलीवरी स्वीकार करें",
  "No orders yet.": "अभी कोई ऑर्डर नहीं है।",
  "Public lot lookup": "सार्वजनिक खेप खोज",
  "Batch quality": "बैच गुणवत्ता",
  "Administration": "प्रशासन",
  "Users": "उपयोगकर्ता",
  "Role": "भूमिका",
  "Verify": "सत्यापित करें",
  "Reference data": "संदर्भ आंकड़े",
  "Save": "सहेजें",
  "Enquiries": "पूछताछ",
  "No enquiries.": "कोई पूछताछ नहीं है।",
  "Audit log": "ऑडिट लॉग",
  "Export CSV": "CSV निर्यात करें",
  "Procurement ledger": "खरीद बही",
  "Farmer purchases": "किसान खरीद",
  "Export Excel": "Excel निर्यात करें",
  "Total tonnes": "कुल टन",
  "Total payable": "कुल देय",
  "Paid": "भुगतान किया",
  "Balance due": "शेष देय",
  "Search": "खोजें",
  "Purchase no or farmer": "खरीद संख्या या किसान",
  "Payment": "भुगतान",
  "All statuses": "सभी स्थितियां",
  "New purchase": "नई खरीद",
  "Select farmer": "किसान चुनें",
  "Form": "रूप",
  "Gross kg": "कुल वजन kg",
  "Tare kg": "खाली वजन kg",
  "Impurity %": "अशुद्धि %",
  "Rate ₹/tonne": "दर ₹/टन",
  "Transport mode": "परिवहन का तरीका",
  "Hub pickup": "केंद्र से उठाव",
  "Farmer delivery": "किसान द्वारा डिलीवरी",
  "Distance km": "दूरी km",
  "Transport cost ₹": "परिवहन लागत ₹",
  "Loading cost ₹": "लोडिंग लागत ₹",
  "Tax %": "कर %",
  "Create draft": "मसौदा बनाएं",
  "Purchase records": "खरीद रिकॉर्ड",
  "Purchase": "खरीद",
  "Date": "तारीख",
  "Payable kg": "देय kg",
  "Net payable": "शुद्ध देय",
  "Confirm": "पुष्टि करें",
  "Pay": "भुगतान करें",
  "Receipt": "रसीद",
  "No purchase records match this view.": "इस दृश्य से मेल खाता कोई खरीद रिकॉर्ड नहीं है।",
  "Sales ledger": "बिक्री बही",
  "Customer sales": "ग्राहक बिक्री",
  "Sales value": "बिक्री मूल्य",
  "Receivable": "प्राप्य",
  "New customer": "नया ग्राहक",
  "Name": "नाम",
  "Industry": "उद्योग",
  "GSTIN": "GSTIN",
  "Address": "पता",
  "State": "राज्य",
  "Contact person": "संपर्क व्यक्ति",
  "Phone": "फोन",
  "Credit terms days": "उधार अवधि दिन",
  "Credit limit ₹": "उधार सीमा ₹",
  "Create customer": "ग्राहक बनाएं",
  "New sale": "नई बिक्री",
  "Select customer": "ग्राहक चुनें",
  "Select lot": "खेप चुनें",
  "Unit": "इकाई",
  "Litres": "लीटर",
  "Discount ₹": "छूट ₹",
  "Freight ₹": "माल ढुलाई ₹",
  "Other charges ₹": "अन्य शुल्क ₹",
  "Create sale draft": "बिक्री मसौदा बनाएं",
  "Sales records": "बिक्री रिकॉर्ड",
  "Sale": "बिक्री",
  "Customer": "ग्राहक",
  "Total": "कुल",
  "Balance": "शेष",
  "Invoice": "चालान",
  "No sales records match this view.": "इस दृश्य से मेल खाता कोई बिक्री रिकॉर्ड नहीं है।",
  "Inventory and reports": "भंडार और रिपोर्ट",
  "Residue stock": "अवशेष भंडार",
  "Stock kg": "भंडार kg",
  "No residue movements.": "अवशेष की कोई आवाजाही नहीं है।",
  "Product lot stock": "उत्पाद खेप भंडार",
  "Stock kg/L": "भंडार kg/L",
  "No product movements.": "उत्पाद की कोई आवाजाही नहीं है।",
  "Mass-balance report": "द्रव्यमान संतुलन रिपोर्ट",
  "Residue purchased": "खरीदे गए अवशेष",
  "Residue consumed": "उपयोग किए गए अवशेष",
  "Bio-coal produced": "बनाया गया बायो-कोल",
  "Yield": "उपज",
  "Bio-coal sold": "बेचा गया बायो-कोल",
  "Anomaly: delivered bio-coal exceeds recorded production.": "असंगति: डिलीवर किया गया बायो-कोल दर्ज उत्पादन से अधिक है।",
  "Management estimate": "प्रबंधन अनुमान",
  "Sales revenue: ₹": "बिक्री राजस्व: ₹",
  "Purchase cost: ₹": "खरीद लागत: ₹",
  "Gross margin: ₹": "सकल मार्जिन: ₹",
  "Receivables ageing": "प्राप्य राशि की आयु",
  "days": "दिन",
  "No ageing data.": "आयु संबंधी आंकड़े नहीं हैं।",
  "Loading…": "लोड हो रहा है…",
  "Toggle dark mode": "डार्क मोड बदलें",
  "Loading": "लोड हो रहा है",
  "SDG": "SDG",
  "SDGs": "SDG",
  "Sign in": "साइन इन करें",
  "Email": "ईमेल",
  "Password": "पासवर्ड",
  "Create account": "खाता बनाएं",
  "New account?": "नया खाता?",
  "Go to login": "लॉगिन पर जाएं",
  "Account created. Complete mock OTP verification after login.": "खाता बन गया। लॉगिन के बाद डेमो OTP सत्यापन पूरा करें।",
  "Demo accounts": "डेमो खाते",
  "FARMER": "किसान",
  "HUB_OPERATOR": "केंद्र संचालक",
  "INDUSTRIAL_BUYER": "औद्योगिक खरीदार",
  "Hub": "केंद्र",
  "Industrial buyer": "औद्योगिक खरीदार",
  "Farmer lots": "किसान खेप",
  "Ash": "राख",
  "HHV": "HHV",
  "Moisture": "नमी",
  "Batch:": "बैच:",
  "Hub:": "केंद्र:",
  "Quantity:": "मात्रा:",
  "GST %": "GST %",
  "PAN": "PAN",
  "A": "A",
  "B": "B",
  "C": "C",
  "BIO_COAL": "बायो-कोल",
  "PYROLIGNEOUS_ACID": "पाइरोलिग्नियस एसिड",
  "PENDING": "लंबित",
  "PARTIAL": "आंशिक",
  "PAID": "भुगतान किया",
  "DRAFT": "मसौदा",
  "CONFIRMED": "पुष्टि की गई",
  "QUOTED": "कोटेशन दिया गया",
  "ORDERED": "ऑर्डर किया गया",
  "DISPATCHED": "भेज दिया गया",
  "DELIVERED": "डिलीवर किया गया",
  "ACCEPTED": "स्वीकृत",
  "DISPUTED": "विवादित",
  "LISTED": "सूचीबद्ध",
  "HUB_ACCEPTED": "केंद्र ने स्वीकार किया",
  "REJECTED": "अस्वीकृत",
  "PICKUP_SCHEDULED": "उठाव तय किया गया",
  "COLLECTED": "एकत्र किया",
  "WEIGHED": "तौला गया",
  "Farmer 1": "किसान 1",
  "Farmer 2": "किसान 2",
  "Farmer 3": "किसान 3",
  "Paddy straw": "धान का पुआल",
  "Rice husk": "धान की भूसी",
  "Sugarcane bagasse": "गन्ने की खोई",
  "Arhar / gram stalks": "अरहर / चने के डंठल",
  "Arhar/gram stalks": "अरहर / चने के डंठल",
  "Corn cobs": "मक्के के भुट्टे",
  "Wheat straw": "गेहूं का पुआल",
  "sponge iron": "स्पंज आयरन",
  "cement": "सीमेंट",
  "steel re-rolling": "स्टील री-रोलिंग",
  "boiler": "बॉयलर",
  "captive power": "कैप्टिव पावर",
  "other": "अन्य",
  "Error": "त्रुटि",
  "Select an available product": "उपलब्ध उत्पाद चुनें",
  "Request failed": "अनुरोध विफल हुआ",
  "Bio-coal": "बायो-कोल",
  "kg / litres": "kg / लीटर",
  "Market": "बाज़ार",
  "PROPOSAL_REPORTED": "प्रस्ताव में बताया गया",
  "MODELLED": "मॉडल आधारित",
  "MEASURED": "मापा गया",
  "LITERATURE": "साहित्य स्रोत",
  "name": "नाम",
  "village": "गांव",
  "district": "जिला",
  "state": "राज्य",
  "landArea": "भूमि क्षेत्र",
  "fpoName": "FPO का नाम",
  "High volatile K vaporized; safe < 950°C": "अस्थिर K वाष्पीकृत; 950°C से कम सुरक्षित",
  "SiO₂ matrix stabilized; no ash sintering": "SiO₂ मैट्रिक्स स्थिर; राख का सिंटरिंग नहीं",
  "Low ash (< 3.5%)": "कम राख (< 3.5%)",
  "Dense fixed carbon": "सघन स्थिर कार्बन",
  "High mechanical strength": "उच्च यांत्रिक मजबूती",
  "Data pending": "आंकड़े लंबित",
  "Processing tonnes per day": "प्रतिदिन प्रसंस्करण टन",
  "No orders linked to this lot.": "इस खेप से कोई ऑर्डर जुड़ा नहीं है।",
  "UNPAID": "अवैतनिक",
  "DEMO": "डेमो",
  "Register": "पंजीकरण",
  "baled": "गांठबद्ध",
  "loose": "खुला",
  "t": "टन",
  "t/day": "टन/दिन",
  "km": "किमी",
  "per tonne": "प्रति टन",
  "/tonne": "/टन",
  "kcal/kg": "kcal/kg",
  "kg": "kg",
  "kg · ₹": "kg · ₹",
  "L": "L",
  "— char yield": "— चार उपज",
  "20–40 mm": "20–40 मिमी",
  "<15%": "<15%",
  ">5,800 kcal/kg": ">5,800 kcal/kg",
  "~280°C": "~280°C",
  "30–60 min": "30–60 मिनट",
  "₹22.0 lakh": "₹22.0 लाख",
  "1.4 years": "1.4 वर्ष",
  "1,850 t": "1,850 टन",
  "18–25 litres per tonne": "18–25 लीटर प्रति टन",
  "3,450*": "3,450*",
  "3,800": "3,800",
  "4,200": "4,200",
  "6,100": "6,100",
  "OBJ-1": "उद्देश्य-1",
  "OBJ-2": "उद्देश्य-2",
  "OBJ-3": "उद्देश्य-3",
  "Request submitted. Estimated purchase value: ₹": "अनुरोध भेजा गया। अनुमानित खरीद मूल्य: ₹",
  "High volatile K release; proposed safe condition <950°C": "उच्च वाष्पशील K उत्सर्जन; प्रस्तावित सुरक्षित स्थिति <950°C",
  "SiO₂ matrix stabilization; no ash sintering proposed": "SiO₂ मैट्रिक्स स्थिरीकरण; राख सिंटरिंग प्रस्तावित नहीं",
  "Low ash target <3.5%": "कम राख का लक्ष्य <3.5%",
  "Dense fixed-carbon target": "सघन स्थिर-कार्बन लक्ष्य",
  "High mechanical-strength target": "उच्च यांत्रिक मजबूती का लक्ष्य",
  "Source & aggregate": "स्रोत और एकत्रीकरण",
  "Rural residue clusters": "ग्रामीण अवशेष समूह",
  "Collect paddy or wheat straw, sugarcane bagasse, pulse stalks and corn cobs through farmers and FPO aggregation nodes.": "किसानों और FPO संग्रह केंद्रों के माध्यम से धान या गेहूं का पुआल, गन्ने की खोई, दलहन के डंठल और मक्के के भुट्टे एकत्र करें।",
  "Transparent origin and availability records": "पारदर्शी स्रोत और उपलब्धता रिकॉर्ड",
  "Precondition": "पूर्व-तैयारी",
  "Dry & size": "सुखाना और आकार देना",
  "Air-dry residue below 15% moisture and shred it to an approximately 20–40 mm particulate size.": "अवशेष को हवा में सुखाकर नमी 15% से कम करें और लगभग 20–40 मिमी आकार में काटें।",
  "Feedstock consistency before carbonization": "कार्बनीकरण से पहले कच्चे माल में एकरूपता",
  "Carbonize": "कार्बनीकरण",
  "Sealed batch retort": "बंद बैच रिटॉर्ट",
  "Use a sealed, double-jacketed retort. Initial ignition transitions to an autothermal stage at about 280°C.": "बंद, दोहरी परत वाले रिटॉर्ट का उपयोग करें। प्रारंभिक प्रज्वलन लगभग 280°C पर ऑटोथर्मल चरण में बदलता है।",
  "Calibration range: 350–500°C": "अंशांकन सीमा: 350–500°C",
  "Recirculate": "पुनःपरिसंचरण",
  "Syngas energy loop": "सिं गैस ऊर्जा चक्र",
  "Recirculate combustible CO, H₂ and CH₄ off-gases through the outer annulus to sustain the process without a continuous external fuel input.": "बाहरी ईंधन की निरंतर आपूर्ति के बिना प्रक्रिया चलाने के लिए ज्वलनशील CO, H₂ और CH₄ गैसों को बाहरी कुंडलाकार मार्ग से पुनःपरिसंचारित करें।",
  "30–60 minute residence window": "30–60 मिनट की प्रक्रिया अवधि",
  "Verify & trade": "सत्यापन और व्यापार",
  "Lot-based marketplace": "खेप-आधारित बाज़ार",
  "Characterize the solid and liquid outputs, assign batch quality data, generate a traceable lot code and publish the product to buyers.": "ठोस और तरल उत्पादों का विश्लेषण करें, बैच गुणवत्ता आंकड़े जोड़ें, ट्रेस करने योग्य खेप कोड बनाएं और उत्पाद खरीदारों के लिए प्रकाशित करें।",
  "Traceability from farmer lot to order": "किसान की खेप से ऑर्डर तक ट्रेसिंग",
  "Buyer request for quotation": "खरीदार द्वारा मूल्य प्रस्ताव अनुरोध",
  "Marketplace filters": "बाज़ार फ़िल्टर",
  "Payment amount in rupees": "भुगतान राशि (रुपये में)",
  "₹1,800–₹2,200 per tonne": "₹1,800–₹2,200 प्रति टन",
  "kcal/kg · Grade": "kcal/kg · ग्रेड",
  "VERIFIED": "सत्यापित",
  "VERIFICATION_PENDING": "सत्यापन लंबित",
  "REQUESTED": "अनुरोध किया गया",
  "PROCESSING": "प्रसंस्करण जारी",
  "Admin": "व्यवस्थापक",
  "Hub operator": "केंद्र संचालक",
  "Buyer": "खरीदार",
  "Profile saved": "प्रोफ़ाइल सहेजी गई",
  "Listing created": "सूची बनाई गई",
  "Pickup requested": "उठाव का अनुरोध भेजा गया",
  "Listing updated": "सूची अपडेट की गई",
  "Batch created": "बैच बनाया गया",
  "Quality test saved": "गुणवत्ता जांच सहेजी गई",
  "Lot published": "खेप प्रकाशित की गई",
  "Purchase draft created": "खरीद मसौदा बनाया गया",
  "Purchase confirmed and residue stock updated": "खरीद की पुष्टि हुई और अवशेष भंडार अपडेट हुआ",
  "Mock payment recorded": "डेमो भुगतान दर्ज हुआ",
  "Customer created": "ग्राहक बनाया गया",
  "Sale draft created": "बिक्री मसौदा बनाया गया",
  "Sale confirmed and lot stock updated": "बिक्री की पुष्टि हुई और खेप भंडार अपडेट हुआ",
  "RFQ sent": "RFQ भेजा गया",
};

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void }>({
  language: "en",
  setLanguage: () => undefined,
});
function useTranslation() {
  const { language } = useContext(LanguageContext);
  return (text: string): string => language === "hi" ? hindiTranslations[text] ?? text : text;
}
async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(API + path, { credentials: "include", headers: { "Content-Type": "application/json", ...options.headers }, ...options });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message ?? "Request failed");
  return body;
}

function Provenance({ value = "PROPOSAL_REPORTED" }: { value?: string }) {
  const t = useTranslation();

  return <span className={`badge provenance ${value.toLowerCase()}`}>{t(value)}</span>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const t = useTranslation();

  const [dark, setDark] = useState(false);
  const { language, setLanguage } = useContext(LanguageContext);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);
  return <><header className="header"><Link className="brand" to="/">{t("AgroLoop")}</Link><nav>
    <Link to="/research">{t("Research")}</Link><Link to="/data">{t("Materials")}</Link><Link to="/marketplace">{t("Marketplace")}</Link>
    <Link to="/farmer">{t("Sell residue")}</Link><Link to="/buyer">{t("Request material")}</Link>
    <Link to="/hub">{t("Hub")}</Link><Link to="/procurement">{t("Procurement")}</Link><Link to="/sales">{t("Sales")}</Link><Link to="/inventory">{t("Inventory")}</Link>
  </nav><button className="language-button" type="button" onClick={() => setLanguage(language === "en" ? "hi" : "en")} aria-label={language === "en" ? "Switch to Hindi" : "हिंदी में बदलें"}>{language === "en" ? "हिन्दी" : "English"}</button><button className="icon-button" onClick={() => setDark(v => !v)} aria-label={t("Toggle dark mode")}>{dark ? "☀" : "◐"}</button></header>{children}</>;
}

function Home() {
  const t = useTranslation();

  return <Layout><main><section className="hero"><p className="eyebrow">{t("Circular rural bioeconomy")}</p><h1>{t("Turning residue into industrial value")}</h1><p>{t("A traceable platform proposed for farmers, village processing hubs and industrial fuel buyers.")}</p><div className="hero-actions"><Link className="button" to="/data">{t("Explore the data")}</Link><Link className="button secondary" to="/research">{t("Read the research")}</Link></div></section><section className="grid-three cards"><article><h2>{t("Farmers & FPOs")}</h2><p>{t("Register residue, schedule collection and track earnings.")}</p></article><article><h2>{t("Processing hubs")}</h2><p>{t("Verify intake, batches, laboratory quality and published lots.")}</p></article><article><h2>{t("Industrial buyers")}</h2><p>{t("Browse quality-verified lots and manage delivery acceptance.")}</p></article></section></main></Layout>;
}

function Research() {
  const t = useTranslation();

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
    <section className="research-hero"><div><p className="eyebrow">{t("Institutional research framework")}</p><h1>{t("A circular platform for residue valorization")}</h1><p>{t("AgroLoop studies how decentralized thermochemical conversion and a traceable three-sided marketplace can reduce open-burning pressure while supplying engineered industrial fuel.")}</p></div><aside className="research-summary"><span>{t("3 research objectives")}</span><span>{t("5 tonne/day reference hub")}</span><span>{t("350–500°C calibration range")}</span></aside></section>

    <nav className="research-nav" aria-label={t("Research page sections")}><a href="#sdgs">{t("SDGs")}</a><a href="#context">{t("Context")}</a><a href="#objectives">{t("Objectives")}</a><a href="#methodology">{t("Methodology")}</a><a href="#data">{t("Data")}</a><a href="#economics">{t("Economics")}</a><a href="#literature">{t("Literature")}</a></nav>

    <section className="research-section sdg-section" id="sdgs"><div className="section-heading"><span>{t("SDG")}</span><div><p className="eyebrow">{t("Potential SDG contributions")}</p><h2>{t("Potential SDG contributions")}</h2></div></div><p className="sdg-disclaimer">{t("These links describe the project's intended contribution. They are not verified SDG outcomes or certification; measured lifecycle and social data are required.")}</p><p className="sdg-source"><a href="https://sdgs.un.org/goals" target="_blank" rel="noreferrer">{t("View official UN SDG targets")}</a></p><div className="sdg-grid">
      <article className="sdg-card sdg-7"><b>{t("7")}</b><div><h3>{t("SDG 7")}{t(":")}{" "}{t("Affordable and clean energy")}</h3><small className="sdg-targets">{t("Potential target alignment:")} 7.2</small><p>{t("Potential link: locally produced bio-coal may provide an alternative fuel when biomass is sustainably sourced and lifecycle emissions are demonstrated.")}</p></div></article>
      <article className="sdg-card sdg-8"><b>{t("8")}</b><div><h3>{t("SDG 8")}{t(":")}{" "}{t("Decent work and economic growth")}</h3><small className="sdg-targets">{t("Potential target alignment:")} 8.3</small><p>{t("Potential link: organized residue collection and village processing could create rural market access and livelihood opportunities.")}</p></div></article>
      <article className="sdg-card sdg-9"><b>{t("9")}</b><div><h3>{t("SDG 9")}{t(":")}{" "}{t("Industry, innovation and infrastructure")}</h3><small className="sdg-targets">{t("Potential target alignment:")} 9.4, 9.5</small><p>{t("Potential link: modular retorts and traceable processing infrastructure apply local innovation to small-scale industrial supply.")}</p></div></article>
      <article className="sdg-card sdg-12"><b>{t("12")}</b><div><h3>{t("SDG 12")}{t(":")}{" "}{t("Responsible consumption and production")}</h3><small className="sdg-targets">{t("Potential target alignment:")} 12.2, 12.5</small><p>{t("Potential link: converting agricultural residues into useful products may improve resource use and reduce unmanaged residue disposal.")}</p></div></article>
      <article className="sdg-card sdg-13"><b>{t("13")}</b><div><h3>{t("SDG 13")}{t(":")}{" "}{t("Climate action")}</h3><small className="sdg-targets">{t("Potential target alignment:")} 13.2</small><p>{t("Potential link: avoiding open burning may reduce some emissions, subject to field measurement and full lifecycle accounting.")}</p></div></article>
    </div></section>

    <section className="research-section" id="context"><div className="section-heading"><span>{t("01")}</span><div><p className="eyebrow">{t("Problem and response")}</p><h2>{t("Closing the residue-to-industrial-fuel loop")}</h2></div></div><div className="grid-two"><article className="panel"><h3>{t("The ecological constraint")}</h3><p>{t("Seasonal residue burning contributes aerosol loading, smog episodes and soil organic-carbon loss. Untreated residue also retains volatile alkali salts and chlorine that can accelerate slagging, fouling and corrosion in demanding thermal equipment.")}</p></article><article className="panel"><h3>{t("The proposed system")}</h3><p>{t("AgroLoop proposes village-cluster retorts that convert heterogeneous residues into bio-coal and pyroligneous acid. A digital supply chain coordinates farmers or FPOs, processing hubs and industrial buyers while preserving batch evidence.")}</p></article></div><div className="supply-chain"><div><b>{t("Farmers & FPOs")}</b><small>{t("Supply and trace residue")}</small></div><i>{t("→")}</i><div><b>{t("Village hub")}</b><small>{t("Process and characterize")}</small></div><i>{t("→")}</i><div><b>{t("Industrial buyer")}</b><small>{t("Require and accept fuel")}</small></div></div></section>

    <section className="research-section" id="objectives"><div className="section-heading"><span>{t("02")}</span><div><p className="eyebrow">{t("Three coordinated objectives")}</p><h2>{t("Research design")}</h2></div></div><div className="objective-grid"><article><b>{t("OBJ-1")}</b><h3>{t("Thermochemical optimization")}</h3><p>{t("Calibrate mixed-residue devolatilization across 350–500°C to target bio-coal above 5,800 kcal/kg HHV while characterizing volatile alkali and chlorine behavior.")}</p><span>{t("Experimental output: HHV, yield and ash chemistry")}</span></article><article><b>{t("OBJ-2")}</b><h3>{t("Decentralized retort design")}</h3><p>{t("Engineer a modular sealed batch retort with integrated syngas recirculation and condensate recovery, designed for low external fuel use during steady operation.")}</p><span>{t("Engineering output: 350–500°C operating envelope")}</span></article><article><b>{t("OBJ-3")}</b><h3>{t("Supply-chain platform validation")}</h3><p>{t("Test batch verification, dynamic procurement, pricing, quality acceptance and MRV-style carbon estimation across the three participating groups.")}</p><span>{t("Digital output: traceable lot and order records")}</span></article></div></section>

    <section className="research-section" id="methodology"><div className="section-heading"><span>{t("03")}</span><div><p className="eyebrow">{t("Technical methodology")}</p><h2>{t("From residue collection to industrial lot")}</h2></div></div><div className="process-explorer"><div className="steps research-steps">{processSteps.map((item,index)=><button className={step===index?"active":""} onClick={()=>setStep(index)} key={item.title}><b>0{index+1}</b><span>{t(item.title)}</span></button>)}</div><article className="process-detail"><p className="eyebrow">{t(processSteps[step].subtitle)}</p><h3>{t(processSteps[step].title)}</h3><p>{t(processSteps[step].detail)}</p><div className="target-chip">{t(processSteps[step].target)}</div></article></div><div className="parameter-strip"><div><span>{t("Feed moisture")}</span><strong>{t("<15%")}</strong></div><div><span>{t("Shred size")}</span><strong>{t("20–40 mm")}</strong></div><div><span>{t("Ignition transition")}</span><strong>{t("~280°C")}</strong></div><div><span>{t("Residence time")}</span><strong>{t("30–60 min")}</strong></div><div><span>{t("Target HHV")}</span><strong>{t(">5,800 kcal/kg")}</strong></div></div></section>

    <section className="research-section" id="data"><div className="section-heading"><span>{t("04")}</span><div><p className="eyebrow">{t("Analytical protocol")}</p><h2>{t("Data collection and candidate output profile")}</h2></div></div><p className="section-intro">{t("Proximate composition, HHV, ash fusion, alkali and chlorine behavior, moisture and digital throughput are proposed for ASTM/ISO characterization.")}{" "}<Provenance value="PROPOSAL_REPORTED"/></p><div className="table-wrap"><table className="research-table"><thead><tr><th>{t("Residue")}</th><th>{t("Raw kcal/kg")}</th><th>{t("Bio-coal HHV")}</th><th>{t("Char yield")}</th><th>{t("Indicative slag/alkali note")}</th></tr></thead><tbody>{residueRows.map(row=><tr key={row[0]}>{row.map((cell,index)=><td key={cell} className={index===0?"residue-name":""}>{t(cell)}</td>)}</tr>)}</tbody></table></div><div className="grid-two evidence-grid"><article className="panel"><h3>{t("Energy density benchmark")}</h3><div className="research-bar"><span>{t("Raw biomass average")}</span><div><i style={{width:"53%"}} /></div><b>{t("3,450*")}</b></div><div className="research-bar"><span>{t("Densified pellets")}</span><div><i style={{width:"59%"}} /></div><b>{t("3,800")}</b></div><div className="research-bar"><span>{t("Fossil coal G12")}</span><div><i style={{width:"65%"}} /></div><b>{t("4,200")}</b></div><div className="research-bar"><span>{t("AgroLoop bio-coal")}</span><div><i style={{width:"94%"}} /></div><b>{t("6,100")}</b></div><p className="footnote">{t("*The proposal average differs from the mean of the five listed residue values (approximately 3,670 kcal/kg). The website calculates the residue mean dynamically rather than presenting 3,450 as a measured mean.")}</p></article><article className="panel"><h3>{t("Primary characterization methods")}</h3><ul className="method-list"><li><b>{t("Solid fuel:")}</b> {" "}{t("proximate analysis, ultimate analysis, bomb-calorimeter HHV and ash fusion")}</li><li><b>{t("Fouling risk:")}</b> {" "}{t("alkali index, chlorine and major ash chemistry")}</li><li><b>{t("Condensate:")}</b> {" "}{t("pyroligneous acid yield and preliminary biostimulant evaluation")}</li><li><b>{t("System evidence:")}</b> {" "}{t("input/output mass balance, temperature profile and residence time")}</li></ul></article></div></section>

    <section className="research-section" id="economics"><div className="section-heading"><span>{t("05")}</span><div><p className="eyebrow">{t("Techno-economic framework")}</p><h2>{t("Reference 5 tonne/day hub")}</h2></div></div><div className="economics-grid"><article><b>{t("₹22.0 lakh")}</b><h3>{t("Annual operating EBITDA")}</h3><p>{t("Proposal assumption; to be recalculated from measured inputs and operating data.")}</p><Provenance value="PROPOSAL_REPORTED"/></article><article><b>{t("1.4 years")}</b><h3>{t("Capital payback")}</h3><p>{t("Reference model figure pending validation against capex, utilization and downtime.")}</p><Provenance value="MODELLED"/></article><article><b>{t("1,850 t")}</b><h3>{t("Net annual abatement")}</h3><p>{t("Estimated value only; not verified credits or an audited inventory result.")}</p><span className="badge modelled">{t("ESTIMATED, NOT VERIFIED")}</span></article></div><div className="grid-two"><article className="panel"><h3>{t("Farmer economics")}</h3><p>{t("Proposed floor price:")}{" "}<strong>{t("₹1,800–₹2,200 per tonne")}</strong> {" "}{t("of baled residue delivered to the local hub.")}</p></article><article className="panel"><h3>{t("Pyroligneous acid")}</h3><p>{t("Target co-condensate yield:")}{" "}<strong>{t("18–25 litres per tonne")}</strong> {" "}{t("of processed residue. Agricultural benefit remains to be evaluated experimentally.")}</p></article></div></section>

    <section className="research-section" id="literature"><div className="section-heading"><span>{t("06")}</span><div><p className="eyebrow">{t("State of the art")}</p><h2>{t("Literature review and identified gaps")}</h2></div></div><div className="literature-grid"><article><span className="lit-year">{t("2021")}</span><h3>{t("Tripathi et al.")}</h3><p>{t("Autothermal carbonization and volatile alkali/chlorine removal from high-silica residues.")}</p><small>{t("Bioresource Technology")}</small></article><article><span className="lit-year">{t("2022")}</span><h3>{t("Kumar & Patel")}</h3><p>{t("Decentralized versus centralized biomass processing economics and logistics.")}</p><small>{t("Renewable and Sustainable Energy Reviews")}</small></article><article><span className="lit-year">{t("2023")}</span><h3>{t("Singh, Sharma & Verma")}</h3><p>{t("Digital marketplace architectures for agricultural residue in emerging circular economies.")}</p><small>{t("Journal of Cleaner Production")}</small></article></div><div className="gap-panel"><h3>{t("Operational research gap")}</h3><p>{t("Current literature lacks an integrated, low-capital thermal upgrading model combining in-situ alkali volatilization, modular retort operation and a digitally coordinated procurement system for fragmented smallholders and continuous industrial demand.")}</p></div><div className="references"><h3>{t("References")}</h3><ol><li>{t("Kumar, R., & Patel, V. (2022). “Logistics modeling and techno-economic optimization of decentralized versus centralized biomass processing units.”")}{" "}<em>{t("Renewable and Sustainable Energy Reviews")}</em>{t(", 154, 111832.")}</li><li>{t("Singh, A., Sharma, M., & Verma, P. (2023). “Digital marketplace architectures for agricultural residue valorization in emerging circular economies.”")}{" "}<em>{t("Journal of Cleaner Production")}</em>{t(", 388, 135980.")}</li><li>{t("Tripathi, M., Sahu, J. N., & Ganesan, P. (2021). “Effect of autothermal carbonization on the removal of volatile alkali salts and chlorine from high-silica rice residues.”")}{" "}<em>{t("Bioresource Technology")}</em>{t(", 321, 124485.")}</li><li>{t("Ministry of Power, Government of India. (2023).")}{" "}<em>{t("Revised Policy for Biomass Utilization for Power Generation through Co-firing in Coal Based Thermal Power Plants")}</em>{t(". SAMARTH Mission.")}</li></ol><p className="footnote"><strong>{t("Verification note:")}</strong> {" "}{t("Verify citations and DOIs before academic submission.")}</p></div></section>
  </main></Layout>;
}

function DataPage() {
  const t = useTranslation();

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
  return <Layout><main className="page"><h1>{t("Residue data and benchmarks")}</h1><div className="toolbar"><label>{t("Residue")}<select value={selected} onChange={e=>setSelected(e.target.value)}>{rows.map(r=><option value={r.id} key={r.id}>{t(r.name)}</option>)}</select></label></div>{residue && <div className="grid-two"><section className="panel"><h2>{t(residue.name)} <Provenance value={residue.provenance}/></h2><div className="bar-row"><span>{t("Raw biomass")}</span><div className="bar"><i style={{width:`${(residue.rawHhv??0)/6500*100}%`}} /></div><strong>{residue.rawHhv??t("Data pending")} {" "}{t("kcal/kg")}</strong></div>{benchmarks.map(b=><div className="bar-row" key={b.id}><span>{t(b.name)}</span><div className="bar"><i style={{width:`${b.hhvKcalKg/6500*100}%`}} /></div><strong>{b.hhvKcalKg} {" "}{t("kcal/kg")}</strong></div>)}{residue.note && <p>{t(residue.note)}</p>}</section><section className="panel"><h2>{t("Hub economics calculator")}</h2>  <label>{t("Processing")}{" "}<strong>{tpd} {" "}{t("t/day")}</strong><input aria-label={t("Processing tonnes per day")} type="range" min="1" max="10" value={tpd} onChange={e=>setTpd(Number(e.target.value))} onInput={e=>setTpd(Number((e.target as HTMLInputElement).value))}/></label><div className="metrics"><p>{t("Farmer payout/day")}<strong>{t("₹")}{payoutLow.toLocaleString("en-IN")}{t("–₹")}{payoutHigh.toLocaleString("en-IN")}</strong></p><p>{t("Bio-coal/day")}<strong data-testid="bio-coal-output">{Math.round(tpd*1000*yieldPct/100).toLocaleString("en-IN")} {" "}{t("kg")}</strong></p><p>{t("Acid target/day")}<strong>{Math.round(tpd*1000*0.021).toLocaleString()} {" "}{t("L")}</strong></p></div><p className="footnote">{t("Outputs use ₹1,800–₹2,200 per tonne, the selected residue char yield and a 21 litres/tonne acid target.")}</p></section></div>}<p className="footnote">{t("The five residues have a dynamically calculated raw-biomass mean of")}{" "}{Math.round(mean).toLocaleString()} {" "}{t("kcal/kg. The separate proposal average of 3,450 kcal/kg is inconsistent and is not used here. Values are proposal-reported or targeted pending experimental verification.")}</p></main></Layout>;
}

function Login() {
  const t = useTranslation();

  const [email,setEmail]=useState("admin@agroloop.local"); const [password,setPassword]=useState("AgroLoop123!"); const [error,setError]=useState("");
  const nav=useNavigate();
  async function submit(e:React.FormEvent){e.preventDefault();setError("");try{const me=await api("/auth/login",{method:"POST",body:JSON.stringify({email,password})});nav(me.user.role==="FARMER"?"/farmer":me.user.role==="HUB_OPERATOR"?"/hub":me.user.role==="INDUSTRIAL_BUYER"?"/buyer":"/admin")}catch(e:any){setError(e.message)}}
  const demoAccounts = [
    ["Admin","admin@agroloop.local","AgroLoop123!"],
    ["Hub operator","hub1@agroloop.local","AgroLoop123!"],
    ["Farmer","farmer1@agroloop.local","AgroLoop123!"],
    ["Buyer","buyer1@agroloop.local","AgroLoop123!"],
  ];
  return <Layout><main className="narrow"><form className="panel" onSubmit={submit}><h1>{t("Sign in")}</h1>{error&&<p className="error">{t(error)}</p>}<label>{t("Email")}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>{t("Password")}<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="button" type="submit">{t("Sign in")}</button><p>{t("New account?")}{" "}<Link to="/register">{t("Register")}</Link></p></form><section className="panel demo-logins"><h2>{t("Demo accounts")}</h2>{demoAccounts.map(([role,email,password])=><button type="button" key={email} onClick={()=>{setEmail(email);setPassword(password)}}><b>{role}</b><span>{email}</span><small>{password}</small></button>)}</section></main></Layout>;
}

function Register() {
  const t = useTranslation();

  const [form,setForm]=useState({email:"",password:"",role:"FARMER",phone:""}); const [done,setDone]=useState(false); const [error,setError]=useState("");
  async function submit(e:React.FormEvent){e.preventDefault();try{await api("/auth/register",{method:"POST",body:JSON.stringify(form)});setDone(true)}catch(e:any){setError(e.message)}}
  return <Layout><main className="narrow"><form className="panel" onSubmit={submit}><h1>{t("Register")}</h1>{done?<><p>{t("Account created. Complete mock OTP verification after login.")}</p><Link className="button" to="/login">{t("Go to login")}</Link></>:<> {error&&<p className="error">{t(error)}</p>}<label>{t("Email")}<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label><label>{t("Phone")}<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>{t("Password")}<input type="password" minLength={8} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></label><label>{t("Role")}<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="FARMER">{t("FARMER")}</option><option value="HUB_OPERATOR">{t("HUB_OPERATOR")}</option><option value="INDUSTRIAL_BUYER">{t("INDUSTRIAL_BUYER")}</option></select></label><button className="button">{t("Create account")}</button></>}</form></main></Layout>;
}

function useMe() {
  const [me,setMe]=useState<any>(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{api("/auth/me").then(setMe).catch(()=>setMe(null)).finally(()=>setLoading(false))},[]);
  return {me,loading};
}
function Guard({role,children}:{role:string,children:React.ReactNode}) {
  const t = useTranslation();
  const {me,loading}=useMe();if(loading)return <Layout><main className="page">{t("Loading…")}</main></Layout>;if(!me)return <Navigate to="/login" replace/>;if(me.role!==role&&me.role!=="ADMIN")return <Navigate to="/" replace/>;return <Layout>{children}</Layout>}

function Farmer() {
  const t = useTranslation();

  const [profile,setProfile]=useState<any>(null); const [listings,setListings]=useState<any[]>([]);const [types,setTypes]=useState<any[]>([]);const [hubs,setHubs]=useState<any[]>([]);const [msg,setMsg]=useState("");const [form,setForm]=useState({residueTypeId:"",quantityT:"",moisturePct:"",baleOrLoose:"baled",locationText:"",availableFrom:"",availableTo:""});
  function load(){Promise.all([api("/farmer/profile").catch(()=>null),api("/farmer/listings"),api("/public/residue-types"),api("/farmer/hubs").catch(()=>[])]).then(([p,l,t,h])=>{setProfile(p);setListings(l);setTypes(t);setHubs(h);setForm(f=>({...f,residueTypeId:f.residueTypeId||t[0]?.id||""}))}).catch(e=>setMsg(t(e.message)))}
  useEffect(load,[]);
  async function saveProfile(e:React.FormEvent){e.preventDefault();const fd=new FormData(e.target as HTMLFormElement);try{await api("/farmer/profile",{method:"PUT",body:JSON.stringify(Object.fromEntries(fd.entries()))});setMsg("Profile saved")}catch(e:any){setMsg(t(e.message))}}
  async function createListing(e:React.FormEvent){e.preventDefault();try{await api("/farmer/listings",{method:"POST",body:JSON.stringify({...form,quantityT:Number(form.quantityT),moisturePct:Number(form.moisturePct),availableFrom:new Date(form.availableFrom).toISOString(),availableTo:new Date(form.availableTo).toISOString()})});setMsg("Listing created");load()}catch(e:any){setMsg(t(e.message))}}
  async function pickup(id:string){try{await api(`/farmer/listings/${id}/pickup`,{method:"POST",body:JSON.stringify({mode:"PICKUP"})});setMsg("Pickup requested");load()}catch(e:any){setMsg(t(e.message))}}
  return <main className="page"><h1>{t("Farmer residue offer")}</h1><p>{t("Add the residue you want to sell. The hub will review quantity, moisture and collection details before confirming a purchase.")}</p>{msg&&<p className="notice">{t(msg)}</p>}<div className="grid-two"><form className="panel" onSubmit={saveProfile}><h2>{t("Profile")}</h2>{["name","village","district","state","landArea","fpoName"].map(name=><label key={name}>{t(name)}<input name={name} defaultValue={(profile&&profile[name])??""} type={name==="landArea"?"number":"text"} step="0.1"/></label>)}<button className="button">{t("Save profile")}</button></form><section className="panel"><h2>{t("Nearest hubs")}</h2>{hubs.length?hubs.map(h=><p key={h.id}>{t(h.name)} {" "}{t("—")}{" "}{h.distanceKm.toFixed(1)} {" "}{t("km")}</p>):<p>{t("No approved hubs have coordinates yet.")}</p>}</section></div><form className="panel" onSubmit={createListing}><h2>{t("Create residue listing")}</h2><div className="grid-three"><label>{t("Residue")}<select value={form.residueTypeId} onChange={e=>setForm({...form,residueTypeId:e.target.value})}>{types.map(type=><option key={type.id} value={type.id}>{t(type.name)}</option>)}</select></label><label>{t("Quantity (t)")}<input type="number" step="0.1" value={form.quantityT} onChange={e=>setForm({...form,quantityT:e.target.value})} required/></label><label>{t("Moisture %")}<input type="number" value={form.moisturePct} onChange={e=>setForm({...form,moisturePct:e.target.value})} required/></label><label>{t("Bale or loose")}<select value={form.baleOrLoose} onChange={e=>setForm({...form,baleOrLoose:e.target.value})}><option value="baled">{t("baled")}</option><option value="loose">{t("loose")}</option></select></label><label>{t("Location")}<input value={form.locationText} onChange={e=>setForm({...form,locationText:e.target.value})} required/></label><label>{t("Available from")}<input type="date" value={form.availableFrom} onChange={e=>setForm({...form,availableFrom:e.target.value})} required/></label><label>{t("Available to")}<input type="date" value={form.availableTo} onChange={e=>setForm({...form,availableTo:e.target.value})} required/></label></div><button className="button">{t("Create listing")}</button></form><section className="panel"><h2>{t("Listings")}</h2>{listings.length?<table><thead><tr><th>{t("Residue")}</th><th>{t("Quantity")}</th><th>{t("Status")}</th><th>{t("Action")}</th></tr></thead><tbody>{listings.map(l=><tr key={l.id}><td>{t(l.residueType?.name)}</td><td>{l.quantityT} {" "}{t("t")}</td><td>{t(l.status)}</td><td>{l.status==="LISTED"&&<button onClick={()=>pickup(l.id)}>{t("Request pickup")}</button>}</td></tr>)}</tbody></table>:<p>{t("No listings yet.")}</p>}</section></main>;
}

function Hub() {
  const t = useTranslation();

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
  ]).then(([l,b,d])=>{setListings(l);setBatches(b);setDashboard(d)}).catch(e=>setMsg(t(e.message)))}
  useEffect(load,[]);
  async function status(id:string,next:string){try{await api(`/hub/listings/${id}/status`,{method:"POST",body:JSON.stringify({status:next})});setMsg("Listing updated");load()}catch(e:any){setMsg(t(e.message))}}
  async function createBatch(e:React.FormEvent){e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const body:any=Object.fromEntries(f.entries());for(const k of ["peakTemperatureC","autothermalTempC","residenceMin","inputKg","outputBioCoalKg","pyroligneousAcidL"])body[k]=Number(body[k]);try{await api("/batches",{method:"POST",body:JSON.stringify(body)});setMsg("Batch created");load()}catch(e:any){setMsg(t(e.message))}}
  async function quality(id:string,e:React.FormEvent){e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const body:any=Object.fromEntries(f.entries());for(const k of ["hhvKcalKg","moisturePct","ashPct","volatileMatterPct","fixedCarbonPct"])if(body[k])body[k]=Number(body[k]);try{await api(`/batches/${id}/quality`,{method:"POST",body:JSON.stringify(body)});setMsg("Quality test saved");load()}catch(e:any){setMsg(t(e.message))}}
  async function publish(id:string,e:React.FormEvent){e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const body:any=Object.fromEntries(f.entries());body.quantityKg=Number(body.quantityKg);body.pricePerT=Number(body.pricePerT);if(body.hhvKcalKg)body.hhvKcalKg=Number(body.hhvKcalKg);try{await api(`/batches/${id}/lot`,{method:"POST",body:JSON.stringify(body)});setMsg("Lot published");load()}catch(e:any){setMsg(t(e.message))}}
  return <main className="page"><h1>{t("Hub operator portal")}</h1>{msg&&<p className="notice">{t(msg)}</p>}{dashboard&&<div className="metrics"><p>{t("Intake")}<strong>{dashboard.intakeKg} {" "}{t("kg")}</strong></p><p>{t("Batches")}<strong>{dashboard.batches}</strong></p><p>{t("Inventory")}<strong>{dashboard.inventoryKg} {" "}{t("kg")}</strong></p></div>}<section className="panel"><h2>{t("Residue intakes")}</h2>{listings.length?<table><thead><tr><th>{t("Farmer")}</th><th>{t("Residue")}</th><th>{t("Status")}</th><th>{t("Actions")}</th></tr></thead><tbody>{listings.map(l=><tr key={l.id}><td>{t(l.farmer?.name)}</td><td>{t(l.residueType?.name)}</td><td>{t(l.status)}</td><td>{l.status==="LISTED"&&<><button onClick={()=>status(l.id,"HUB_ACCEPTED")}>{t("Accept")}</button> <button onClick={()=>status(l.id,"REJECTED")}>{t("Reject")}</button></>}{l.status==="HUB_ACCEPTED"&&<button onClick={()=>status(l.id,"PICKUP_SCHEDULED")}>{t("Schedule pickup")}</button>}{l.status==="PICKUP_SCHEDULED"&&<button onClick={()=>status(l.id,"COLLECTED")}>{t("Collected")}</button>}{l.status==="COLLECTED"&&<button onClick={()=>status(l.id,"WEIGHED")}>{t("Record weighed")}</button>}{l.status==="WEIGHED"&&<button onClick={()=>status(l.id,"PAID")}>{t("Mark paid")}</button>}</td></tr>)}</tbody></table>:<p>{t("No intake listings.")}</p>}</section><form className="panel" onSubmit={createBatch}><h2>{t("Create batch")}</h2><div className="grid-three">{[["peakTemperatureC","Peak temperature °C"],["autothermalTempC","Autothermal transition °C"],["residenceMin","Residence minutes"],["inputKg","Input kg"],["outputBioCoalKg","Bio-coal kg"],["pyroligneousAcidL","Pyroligneous acid L"]].map(([n,label])=><label key={n}>{t(label)}<input name={n} type="number" required/></label>)}</div><button className="button">{t("Create batch")}</button></form><section className="panel"><h2>{t("Batches")}</h2>{batches.map(b=><details key={b.id}><summary>{b.code} {" "}{t("— char yield")}{" "}{b.charYieldPct?.toFixed?.(1)??"pending"}{t("%")}</summary><form onSubmit={e=>quality(b.id,e)}><div className="grid-three">{[["hhvKcalKg","HHV kcal/kg"],["moisturePct","Moisture %"],["ashPct","Ash %"],["volatileMatterPct","Volatile matter %"],["fixedCarbonPct","Fixed carbon %"]].map(([n,l])=><label key={n}>{l}<input name={n} type="number" step="0.01" required/></label>)}<label>{t("Standard")}<input name="testStandard"/></label></div><button className="button">{t("Save quality test")}</button></form><form onSubmit={e=>publish(b.id,e)}><h3>{t("Publish lot")}</h3><div className="grid-three"><label>{t("Product")}<select name="productType"><option value="BIO_COAL">{t("BIO_COAL")}</option><option value="PYROLIGNEOUS_ACID">{t("PYROLIGNEOUS_ACID")}</option></select></label><label>{t("Quantity kg")}<input name="quantityKg" type="number" required/></label><label>{t("Price/tonne")}<input name="pricePerT" type="number" required/></label><label>{t("HHV")}<input name="hhvKcalKg" type="number"/></label><label>{t("Grade")}<input name="grade"/></label></div><button className="button">{t("Publish lot")}</button></form></details>)}</section></main>;
}

function Procurement() {
  const t = useTranslation();

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
  ]).then(([data,residueTypes,users])=>{setRows(data.rows);setTotals(data.totals);setTypes(residueTypes);const dbFarmers=users.filter((u:any)=>u.role==="FARMER").map((u:any)=>u.farmerProfile).filter(Boolean);setFarmers(dbFarmers.length?dbFarmers:[{id:"demo-farmer-1",name:"Farmer 1"},{id:"demo-farmer-2",name:"Farmer 2"},{id:"demo-farmer-3",name:"Farmer 3"}])}).catch(e=>setMsg(t(e.message)))}
  useEffect(load,[search,paymentStatus]);
  async function createPurchase(e:React.FormEvent){e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const data:any=Object.fromEntries(f.entries());for(const key of ["grossWeightKg","tareWeightKg","moisturePct","impurityPct","ratePerTonne","distanceKm","transportCost","loadingCost","taxPercent"])data[key]=Number(data[key]);try{await api("/procurement/purchases",{method:"POST",body:JSON.stringify(data)});setMsg("Purchase draft created");load()}catch(e:any){setMsg(t(e.message))}}
  async function confirm(id:string){try{await api(`/procurement/purchases/${id}/confirm`,{method:"POST"});setMsg("Purchase confirmed and residue stock updated");load()}catch(e:any){setMsg(t(e.message))}}
  async function pay(id:string){const amount=window.prompt(t("Payment amount in rupees"),"");if(!amount)return;try{await api(`/procurement/purchases/${id}/payments`,{method:"POST",body:JSON.stringify({amount:Number(amount),method:"UPI",referenceNo:"MOCK-"+Date.now()})});setMsg("Mock payment recorded");load()}catch(e:any){setMsg(t(e.message))}}
  return <main className="page ledger-page"><div className="ledger-header"><div><p className="eyebrow">{t("Procurement ledger")}</p><h1>{t("Farmer purchases")}</h1></div><a className="button" href={`${API}/procurement/export?format=xls`} target="_blank">{t("Export Excel")}</a></div>{msg&&<p className="notice">{t(msg)}</p>}<div className="metrics ledger-totals"><p>{t("Total tonnes")}<strong>{(totals.tonnes??0).toFixed(3)}</strong></p><p>{t("Total payable")}<strong>{t("₹")}{((totals.amountPaisa??0)/100).toLocaleString("en-IN")}</strong></p><p>{t("Paid")}<strong>{t("₹")}{((totals.paidPaisa??0)/100).toLocaleString("en-IN")}</strong></p><p>{t("Balance due")}<strong>{t("₹")}{((totals.duePaisa??0)/100).toLocaleString("en-IN")}</strong></p></div><section className="ledger-toolbar"><label>{t("Search")}<input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("Purchase no or farmer")}/></label><label>{t("Payment")}<select value={paymentStatus} onChange={e=>setPaymentStatus(e.target.value)}><option value="">{t("All statuses")}</option><option value="PENDING">{t("PENDING")}</option><option value="PARTIAL">{t("PARTIAL")}</option><option value="PAID">{t("PAID")}</option></select></label></section><details className="panel new-ledger-record"><summary>{t("New purchase")}</summary><form onSubmit={createPurchase}><div className="grid-three"><label>{t("Farmer")}<select name="farmerId" required><option value="">{t("Select farmer")}</option>{farmers.map((farmer:any)=><option key={farmer.id} value={farmer.id}>{t(farmer.name)}</option>)}</select></label><label>{t("Residue")}<select name="residueTypeId" required>{types.map((type:any)=><option key={type.id} value={type.id}>{t(type.name)}</option>)}</select></label><label>{t("Form")}<select name="form"><option value="baled">{t("Baled")}</option><option value="loose">{t("Loose")}</option></select></label><label>{t("Gross kg")}<input name="grossWeightKg" type="number" required/></label><label>{t("Tare kg")}<input name="tareWeightKg" type="number" required/></label><label>{t("Moisture %")}<input name="moisturePct" type="number" step="0.01" required/></label><label>{t("Impurity %")}<input name="impurityPct" type="number" step="0.01" required/></label><label>{t("Rate ₹/tonne")}<input name="ratePerTonne" type="number" step="0.01" required/></label><label>{t("Transport mode")}<select name="transportMode"><option value="HUB_PICKUP">{t("Hub pickup")}</option><option value="FARMER_DELIVERY">{t("Farmer delivery")}</option></select></label><label>{t("Distance km")}<input name="distanceKm" type="number" defaultValue="0"/></label><label>{t("Transport cost ₹")}<input name="transportCost" type="number" defaultValue="0"/></label><label>{t("Loading cost ₹")}<input name="loadingCost" type="number" defaultValue="0"/></label><label>{t("Tax %")}<input name="taxPercent" type="number" defaultValue="0"/></label></div><button className="button">{t("Create draft")}</button></form></details><section className="panel ledger-table"><h2>{t("Purchase records")}</h2>{rows.length?<table><thead><tr><th>{t("Purchase")}</th><th>{t("Date")}</th><th>{t("Farmer")}</th><th>{t("Residue")}</th><th>{t("Payable kg")}</th><th>{t("Net payable")}</th><th>{t("Status")}</th><th>{t("Actions")}</th></tr></thead><tbody>{rows.map((row:any)=><tr key={row.id}><td>{row.purchaseNo}</td><td>{new Date(row.purchaseDate).toLocaleDateString("en-IN")}</td><td>{t(row.farmerNameSnapshot)}</td><td>{t(row.residueType?.name)}</td><td>{Number(row.payableWeightKg).toLocaleString("en-IN")}</td><td>{t("₹")}{(row.netPayablePaisa/100).toLocaleString("en-IN")}</td><td>{t(row.status)} {" "}{t("/")}{" "}{t(row.paymentStatus)}</td><td>{row.status==="DRAFT"&&<button onClick={()=>confirm(row.id)}>{t("Confirm")}</button>} {row.status==="CONFIRMED"&&row.balanceDuePaisa>0&&<button onClick={()=>pay(row.id)}>{t("Pay")}</button>} <a href={`${API}/procurement/purchases/${row.id}/receipt`} target="_blank">{t("Receipt")}</a></td></tr>)}</tbody></table>:<p>{t("No purchase records match this view.")}</p>}</section></main>;
}

function SalesLedger() {
  const t = useTranslation();

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
  ]).then(([sales,customerRows,lotRows])=>{setRows(sales.rows);setTotals(sales.totals);setCustomers(customerRows);setLots(lotRows)}).catch(e=>setMsg(t(e.message)))}
  useEffect(load,[]);
  async function createCustomer(e:React.FormEvent){e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const data:any=Object.fromEntries(f.entries());data.creditTermsDays=Number(data.creditTermsDays||30);data.creditLimit=Number(data.creditLimit||0);try{await api("/sales/customers",{method:"POST",body:JSON.stringify(data)});setMsg("Customer created");load()}catch(e:any){setMsg(t(e.message))}}
  async function createSale(e:React.FormEvent){e.preventDefault();const f=new FormData(e.target as HTMLFormElement);const data:any=Object.fromEntries(f.entries());const quantity=Number(data.quantity);const ratePerTonne=Number(data.ratePerTonne);try{await api("/sales",{method:"POST",body:JSON.stringify({customerId:data.customerId,gstPercent:Number(data.gstPercent||5),discount:Number(data.discount||0),freight:Number(data.freight||0),otherCharges:Number(data.otherCharges||0),items:[{lotId:data.lotId,quantity,unit:data.unit,ratePerTonne}]})});setMsg("Sale draft created");load()}catch(e:any){setMsg(t(e.message))}}
  async function confirm(id:string){try{await api(`/sales/${id}/confirm`,{method:"POST"});setMsg("Sale confirmed and lot stock updated");load()}catch(e:any){setMsg(t(e.message))}}
  async function payment(id:string){const amount=window.prompt(t("Payment amount in rupees"),"");if(!amount)return;try{await api(`/sales/${id}/payments`,{method:"POST",body:JSON.stringify({amount:Number(amount),method:"UPI",referenceNo:"MOCK-"+Date.now()})});setMsg("Mock payment recorded");load()}catch(e:any){setMsg(t(e.message))}}
  return <main className="page ledger-page"><div className="ledger-header"><div><p className="eyebrow">{t("Sales ledger")}</p><h1>{t("Customer sales")}</h1></div><a className="button" href={`${API}/sales/export?format=xls`} target="_blank">{t("Export Excel")}</a></div>{msg&&<p className="notice">{t(msg)}</p>}<div className="metrics ledger-totals"><p>{t("Sales value")}<strong>{t("₹")}{((totals.amountPaisa??0)/100).toLocaleString("en-IN")}</strong></p><p>{t("Paid")}<strong>{t("₹")}{((totals.paidPaisa??0)/100).toLocaleString("en-IN")}</strong></p><p>{t("Receivable")}<strong>{t("₹")}{((totals.duePaisa??0)/100).toLocaleString("en-IN")}</strong></p></div><div className="grid-two"><details className="panel new-ledger-record"><summary>{t("New customer")}</summary><form onSubmit={createCustomer}><label>{t("Name")}<input name="name" required/></label><label>{t("Industry")}<select name="industryType"><option value="sponge iron">{t("sponge iron")}</option><option value="cement">{t("cement")}</option><option value="steel re-rolling">{t("steel re-rolling")}</option><option value="boiler">{t("boiler")}</option><option value="captive power">{t("captive power")}</option><option value="other">{t("other")}</option></select></label><label>{t("GSTIN")}<input name="gstin"/></label><label>{t("PAN")}<input name="pan"/></label><label>{t("Address")}<input name="address"/></label><label>{t("State")}<input name="state"/></label><label>{t("Contact person")}<input name="contactPerson"/></label><label>{t("Phone")}<input name="phone"/></label><label>{t("Email")}<input name="email" type="email"/></label><label>{t("Credit terms days")}<input name="creditTermsDays" type="number" defaultValue="30"/></label><label>{t("Credit limit ₹")}<input name="creditLimit" type="number" defaultValue="0"/></label><button className="button">{t("Create customer")}</button></form></details><details className="panel new-ledger-record"><summary>{t("New sale")}</summary><form onSubmit={createSale}><label>{t("Customer")}<select name="customerId" required><option value="">{t("Select customer")}</option>{customers.map((customer:any)=><option key={customer.id} value={customer.id}>{t(customer.name)}</option>)}</select></label><label>{t("Product lot")}<select name="lotId" required><option value="">{t("Select lot")}</option>{lots.map((lot:any)=><option key={lot.id} value={lot.id}>{lot.code} {" "}{t("—")}{" "}{lot.quantityKg} {" "}{t("kg")}</option>)}</select></label><label>{t("Unit")}<select name="unit"><option value="kg">{t("kg")}</option><option value="L">{t("Litres")}</option></select></label><label>{t("Quantity")}<input name="quantity" type="number" required/></label><label>{t("Rate ₹/tonne")}<input name="ratePerTonne" type="number" required/></label><label>{t("GST %")}<input name="gstPercent" type="number" defaultValue="5"/></label><label>{t("Discount ₹")}<input name="discount" type="number" defaultValue="0"/></label><label>{t("Freight ₹")}<input name="freight" type="number" defaultValue="0"/></label><label>{t("Other charges ₹")}<input name="otherCharges" type="number" defaultValue="0"/></label><button className="button">{t("Create sale draft")}</button></form></details></div><section className="panel ledger-table"><h2>{t("Sales records")}</h2>{rows.length?<table><thead><tr><th>{t("Sale")}</th><th>{t("Customer")}</th><th>{t("Date")}</th><th>{t("Total")}</th><th>{t("Paid")}</th><th>{t("Balance")}</th><th>{t("Status")}</th><th>{t("Actions")}</th></tr></thead><tbody>{rows.map((row:any)=><tr key={row.id}><td>{row.saleNo}</td><td>{t(row.customer?.name)}</td><td>{new Date(row.saleDate).toLocaleDateString("en-IN")}</td><td>{t("₹")}{(row.totalAmountPaisa/100).toLocaleString("en-IN")}</td><td>{t("₹")}{(row.amountPaidPaisa/100).toLocaleString("en-IN")}</td><td>{t("₹")}{(row.balanceDuePaisa/100).toLocaleString("en-IN")}</td><td>{t(row.status)} {" "}{t("/")}{" "}{t(row.deliveryStatus)} {" "}{t("/")}{" "}{t(row.paymentStatus)}</td><td>{row.status==="DRAFT"&&<button onClick={()=>confirm(row.id)}>{t("Confirm")}</button>} {row.status==="CONFIRMED"&&row.balanceDuePaisa>0&&<button onClick={()=>payment(row.id)}>{t("Pay")}</button>} <a href={`${API}/sales/${row.id}/invoice`} target="_blank">{t("Invoice")}</a></td></tr>)}</tbody></table>:<p>{t("No sales records match this view.")}</p>}</section></main>;
}

function InventoryAndReports() {
  const t = useTranslation();

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
  ]).then(([i,m,p,a])=>{setInventory(i);setMass(m);setProfit(p);setAgeing(a)}).catch(e=>setMsg(t(e.message)))},[]);
  return <main className="page"><h1>{t("Inventory and reports")}</h1>{msg&&<p className="notice">{t(msg)}</p>}<div className="grid-two"><section className="panel"><h2>{t("Residue stock")}</h2>{inventory.residue.length?<table><thead><tr><th>{t("Residue")}</th><th>{t("Stock kg")}</th></tr></thead><tbody>{inventory.residue.map((row:any)=><tr key={row.residueTypeId}><td>{t(row.name)}</td><td>{row.quantityKg.toLocaleString("en-IN")}</td></tr>)}</tbody></table>:<p>{t("No residue movements.")}</p>}</section><section className="panel"><h2>{t("Product lot stock")}</h2>{inventory.productLots.length?<table><thead><tr><th>{t("Lot")}</th><th>{t("Stock kg/L")}</th></tr></thead><tbody>{inventory.productLots.map((row:any)=><tr key={row.lotId}><td>{row.code}</td><td>{row.quantityKg.toLocaleString("en-IN")}</td></tr>)}</tbody></table>:<p>{t("No product movements.")}</p>}</section></div>{mass&&<section className="panel"><h2>{t("Mass-balance report")}</h2><div className="metrics"><p>{t("Residue purchased")}<strong>{(mass.residuePurchasedKg/1000).toFixed(3)} {" "}{t("t")}</strong></p><p>{t("Residue consumed")}<strong>{(mass.residueConsumedKg/1000).toFixed(3)} {" "}{t("t")}</strong></p><p>{t("Bio-coal produced")}<strong>{(mass.bioCoalProducedKg/1000).toFixed(3)} {" "}{t("t")}</strong></p><p>{t("Yield")}<strong>{mass.yieldPct.toFixed(1)}{t("%")}</strong></p><p>{t("Bio-coal sold")}<strong>{(mass.bioCoalSoldKg/1000).toFixed(3)} {" "}{t("t")}</strong></p></div>{mass.anomaly&&<p className="error">{t("Anomaly: delivered bio-coal exceeds recorded production.")}</p>}</section>}<div className="grid-two">{profit&&<section className="panel"><h2>{t("Management estimate")}</h2><p>{t("Sales revenue: ₹")}{(profit.salesRevenuePaisa/100).toLocaleString("en-IN")}</p><p>{t("Purchase cost: ₹")}{(profit.purchaseCostPaisa/100).toLocaleString("en-IN")}</p><p><strong>{t("Gross margin: ₹")}{(profit.grossMarginPaisa/100).toLocaleString("en-IN")}</strong></p></section>}<section className="panel"><h2>{t("Receivables ageing")}</h2>{ageing?<div className="metrics">{Object.entries(ageing.buckets).map(([bucket,value])=><p key={bucket}>{bucket} {" "}{t("days")}<strong>{t("₹")}{(Number(value)/100).toLocaleString("en-IN")}</strong></p>)}</div>:<p>{t("No ageing data.")}</p>}</section></div></main>;
}

function Marketplace() {
  const t = useTranslation();

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
    <section className="marketplace-header"><div><p className="eyebrow">{t("Verified supply marketplace")}</p><h1>{t("Marketplace")}</h1><p>{t("Compare published bio-coal and pyroligneous-acid lots by quality, quantity and offer price.")}</p></div><Link className="button" to="/hub">{t("Add or publish a lot")}</Link></section>
    <section className="marketplace-filters" aria-label={t("Marketplace filters")}>
      <label>{t("Grade")}<select value={grade} onChange={e=>setGrade(e.target.value)}><option value="">{t("All grades")}</option><option>{t("A")}</option><option>{t("B")}</option><option>{t("C")}</option></select></label>
      <label>{t("Product")}<select value={productType} onChange={e=>setProductType(e.target.value)}><option value="">{t("All products")}</option><option value="BIO_COAL">{t("Bio-coal")}</option><option value="PYROLIGNEOUS_ACID">{t("Pyroligneous acid")}</option></select></label>
      <label>{t("Maximum price ₹/tonne")}<input type="number" min="0" step="100" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder={t("No limit")}/></label>
      <button type="button" className="filter-clear" onClick={clearFilters}>{t("Clear filters")}</button>
    </section>
    <div className="marketplace-meta"><strong>{lots.length} {" "}{t("published lots")}</strong><span>{grade?`${t("Grade")} ${grade}`:t("All grades")} {" "}{t("·")}{" "}{productType?t(productType):t("All products")}</span></div>
    {loading?<p className="loading-card">{t("Loading published lots…")}</p>:<div className="lot-grid">{lots.map(l=><article className="lot-card" key={l.id}>
      <div className="lot-card-top"><span className={`grade-chip grade-${l.grade?.toLowerCase()}`}>{t("Grade")}{" "}{l.grade}</span><Provenance value={l.provenance}/></div>
      <p className="lot-code">{l.code}</p>
      <h2>{t(l.productType==="PYROLIGNEOUS_ACID"?"Pyroligneous acid":"Bio-coal")}</h2>
      <div className="lot-price"><span>{t("Offer price")}</span><strong>{t("₹")}{l.pricePerT.toLocaleString("en-IN")}<small>{t("/tonne")}</small></strong></div>
      <dl className="lot-specs"><div><dt>{t("Available")}</dt><dd>{l.quantityKg.toLocaleString("en-IN")} {" "}{t("kg")}</dd></div><div><dt>{t("HHV")}</dt><dd>{l.hhvKcalKg?`${l.hhvKcalKg} ${t("kcal/kg")}`:t("Not applicable")}</dd></div><div><dt>{t("Ash")}</dt><dd>{l.ashPct!==null&&l.ashPct!==undefined?`${l.ashPct}%`:t("Not reported")}</dd></div><div><dt>{t("Moisture")}</dt><dd>{l.moisturePct!==null&&l.moisturePct!==undefined?`${l.moisturePct}%`:t("Not reported")}</dd></div></dl>
      <Link className="lot-action" to={`/lot/${l.code}`}>{t("View traceability")}{" "}<span aria-hidden="true">{t("→")}</span></Link>
    </article>)}</div>}
    {!loading&&!lots.length&&<section className="empty-state"><h2>{t("No published lots match")}</h2><p>{t("Clear one or more filters or publish a lot from the hub portal.")}</p><button className="button" onClick={clearFilters}>{t("Clear filters")}</button></section>}
  </main></Layout>;
}

function Buyer() {
  const t = useTranslation();

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
    ]).then(([l,o])=>{setLots(l);setOrders(o)}).catch(e=>setMsg(t(e.message)));
  }
  useEffect(load,[]);
  async function enquiry(code:string){try{await api("/buyer/enquiries",{method:"POST",body:JSON.stringify({lotCode:code,message:"Buyer request for quotation"})});setMsg("RFQ sent");load()}catch(e:any){setMsg(t(e.message))}}
  async function status(id:string,next:string){try{await api(`/orders/${id}/status`,{method:"POST",body:JSON.stringify({status:next})});load()}catch(e:any){setMsg(t(e.message))}}
  const selectedLot = lots.find((lot:any)=>lot.id===request.lotId);
  const estimatedAmount = selectedLot ? Number(request.quantityKg||0)/1000*Number(selectedLot.pricePerT||0) : 0;
  async function createRequest(e:React.FormEvent){e.preventDefault();if(!selectedLot){setMsg(t("Select an available product"));return;}try{await enquiry(selectedLot.code);setMsg(`${t("Request submitted. Estimated purchase value: ₹")}${estimatedAmount.toLocaleString("en-IN")}`)}catch(e:any){setMsg(t(e.message))}}
  return <main className="page"><h1>{t("Industrial buyer portal")}</h1>{msg&&<p className="notice">{t(msg)}</p>}<section className="panel buyer-request"><h2>{t("Request a product quantity")}</h2><form onSubmit={createRequest}><div className="grid-three"><label>{t("Product lot")}<select value={request.lotId} onChange={e=>setRequest({...request,lotId:e.target.value})} required><option value="">{t("Select product")}</option>{lots.map((lot:any)=><option key={lot.id} value={lot.id}>{lot.code} {" "}{t("—")}{" "}{t(lot.productType==="PYROLIGNEOUS_ACID"?"Pyroligneous acid":"Bio-coal")}</option>)}</select></label><label>{t("Quantity")}<select name="unit" disabled><option>{t("kg / litres")}</option></select></label><label>{t("Required quantity")}<input type="number" min="1" value={request.quantityKg} onChange={e=>setRequest({...request,quantityKg:e.target.value})} required/></label></div>{selectedLot&&<div className="request-estimate"><span>{t("Listed rate: ₹")}{selectedLot.pricePerT.toLocaleString("en-IN")} {" "}{t("per tonne")}</span><strong>{t("Indicative value: ₹")}{estimatedAmount.toLocaleString("en-IN")}</strong><small>{t("Final price and taxes are confirmed by the hub after review.")}</small></div>}<button className="button">{t("Submit purchase request")}</button></form></section><section className="grid-three cards">{lots.map(l=><article key={l.id}><h2>{l.code}</h2><p>{l.quantityKg} {" "}{t("kg · ₹")}{l.pricePerT}{t("/t")}</p><button className="button" onClick={()=>enquiry(l.code)}>{t("Send RFQ")}</button></article>)}</section><section className="panel"><h2>{t("Orders")}</h2>{orders.length?<table><thead><tr><th>{t("Lot")}</th><th>{t("Status")}</th><th>{t("Action")}</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>{o.lot?.code}</td><td>{t(o.status)}</td><td>{o.status==="QUOTED"&&<button onClick={()=>status(o.id,"ORDERED")}>{t("Place order")}</button>}{o.status==="DISPATCHED"&&<button onClick={()=>status(o.id,"DELIVERED")}>{t("Mark delivered")}</button>}{o.status==="DELIVERED"&&<button onClick={()=>status(o.id,"ACCEPTED")}>{t("Accept delivery")}</button>}</td></tr>)}</tbody></table>:<p>{t("No orders yet.")}</p>}</section></main>;
}

function LotLookup() {
  const t = useTranslation();
  const {code}=useParams();const [lot,setLot]=useState<any>(null);const [error,setError]=useState("");
  useEffect(()=>{api(`/public/lots/${code}`).then(setLot).catch(e=>setError(e.message))},[code]);
  return <Layout><main className="page"><h1>{t("Public lot lookup")}</h1>{error&&<p className="error">{t(error)}</p>}{lot&&<div className="panel"><h2>{lot.code}</h2><p>{t("Hub:")}{" "}{t(lot.hub.name)}</p><p>{t("Batch:")}{" "}{lot.batch.code}</p><p>{t("Quantity:")}{" "}{lot.quantityKg} {" "}{t("kg")}</p><h3>{t("Farmer lots")}</h3>{lot.batch.inputs.map((x:any)=><p key={x.id}>{t(x.intake.listing.locationText)} {" "}{t("—")}{" "}{x.intake.weighedKg} {" "}{t("kg")}</p>)}<h3>{t("Batch quality")}</h3>{lot.batch.qualityTests.map((q:any)=><p key={q.id}>{t("HHV")}{" "}{q.hhvKcalKg} {" "}{t("kcal/kg · Grade")}{" "}{q.grade} <Provenance value={q.provenance}/></p>)}<h3>{t("Orders")}</h3>{lot.orders.length?lot.orders.map((o:any)=><p key={o.id}>{t(o.status)}</p>):<p>{t("No orders linked to this lot.")}</p>}</div>}</main></Layout>;
}

function Admin() {
  const t = useTranslation();

  const [analytics,setAnalytics]=useState<any>(null);const [users,setUsers]=useState<any[]>([]);const [audit,setAudit]=useState<any[]>([]);const [enquiries,setEnquiries]=useState<any[]>([]);const [residues,setResidues]=useState<any[]>([]);const [msg,setMsg]=useState("");
  function load(){Promise.all([api("/admin/analytics"),api("/admin/users"),api("/admin/audit"),api("/admin/enquiries"),api("/public/residue-types")]).then(([a,u,l,e,r])=>{setAnalytics(a);setUsers(u);setAudit(l);setEnquiries(e);setResidues(r)}).catch(e=>setMsg(t(e.message)))}
  useEffect(load,[]);
  async function verify(id:string,status:string){await api(`/admin/users/${id}/verify`,{method:"POST",body:JSON.stringify({verified:status})});load()}
  async function saveResidue(r:any){await api(`/admin/residue-types/${r.id}`,{method:"PUT",body:JSON.stringify(r)});setMsg("Reference data saved")}
  return <main className="page"><h1>{t("Administration")}</h1>{msg&&<p className="notice">{t(msg)}</p>}<div className="metrics">{analytics&&Object.entries(analytics).map(([k,v])=><p key={k}>{k}<strong>{String(v)}</strong></p>)}</div><section className="panel"><h2>{t("Users")}</h2><table><thead><tr><th>{t("Email")}</th><th>{t("Role")}</th><th>{t("Status")}</th><th>{t("Action")}</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.email}</td><td>{u.role}</td><td>{u.verified}</td><td>{u.verified!=="VERIFIED"&&<button onClick={()=>verify(u.id,"VERIFIED")}>{t("Verify")}</button>}</td></tr>)}</tbody></table></section><section className="panel"><h2>{t("Reference data")}</h2>{residues.map(r=><div className="reference-row" key={r.id}><strong>{r.name}</strong><Provenance value={r.provenance}/><label>{t("Bio-coal HHV")}<input type="number" defaultValue={r.bioCoalHhv??""} onBlur={e=>{r.bioCoalHhv=e.target.value?Number(e.target.value):null}}/></label><button onClick={()=>saveResidue(r)}>{t("Save")}</button></div>)}</section><section className="panel"><h2>{t("Enquiries")}</h2>{enquiries.length?enquiries.map(e=><p key={e.id}><strong>{e.name}</strong>{t(":")}{" "}{e.message}</p>):<p>{t("No enquiries.")}</p>}</section><section className="panel"><h2>{t("Audit log")}</h2>{audit.slice(0,20).map(a=><p key={a.id}>{a.action} {" "}{t("·")}{" "}{a.entity} {" "}{t("·")}{" "}{a.createdAt}</p>)}</section><a className="button" href={`${API}/admin/export?format=csv`} target="_blank">{t("Export CSV")}</a></main>;
}

function App() {
  const [language, setLanguage] = useState<Language>(() => window.localStorage.getItem("agroloop-language") === "hi" ? "hi" : "en");
  useEffect(() => {
    window.localStorage.setItem("agroloop-language", language);
    document.documentElement.lang = language;
  }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage }}><BrowserRouter><Routes>
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
  </Routes></BrowserRouter></LanguageContext.Provider>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
