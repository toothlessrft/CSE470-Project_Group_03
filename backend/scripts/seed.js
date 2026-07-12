// Seeds MongoDB with the same sample data that was in 370finalproject.sql + 10/15 more items
// Run with: npm run seed  (make sure MONGO_URI in .env is set first)
require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");

const User = require("../models/User");
const Site = require("../models/Site");
const ExcavationRequest = require("../models/ExcavationRequest");
const ExcavationProject = require("../models/ExcavationProject");
const ETeam = require("../models/ETeam");
const Item = require("../models/Item");
const ItemRequest = require("../models/ItemRequest");
const Tool = require("../models/Tool");
const ToolRentalRequest = require("../models/ToolRentalRequest");
const RequestMaintenance = require("../models/RequestMaintenance");
const KnowledgeResource = require("../models/KnowledgeResource");
const DiscoveryReport = require("../models/DiscoveryReport");
const ResearcherReport = require("../models/ResearcherReport");

const DEFAULT_PASSWORD = "password123"; // every seeded user gets this password

async function run() {
  await connectDB();

  console.log("Clearing existing collections...");
  await Promise.all([
    User.deleteMany({}),
    Site.deleteMany({}),
    ExcavationRequest.deleteMany({}),
    ExcavationProject.deleteMany({}),
    ETeam.deleteMany({}),
    Item.deleteMany({}),
    ItemRequest.deleteMany({}),
    Tool.deleteMany({}),
    ToolRentalRequest.deleteMany({}),
    RequestMaintenance.deleteMany({}),
    KnowledgeResource.deleteMany({}),
    DiscoveryReport.deleteMany({}),
    ResearcherReport.deleteMany({}),
  ]);

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  console.log("Creating sites...");
  const [mahasthangarh, somapura, mainamati, shabnam, wari_bateshwar, paundra] = await Site.create([
    { name: "Mahasthangarh", era: "3rd Century BCE to 15th Century CE", s_thana: "Shibganj", s_district: "Bogra", s_street: "Mahasthan Garh Road", description: "One of the earliest urban archaeological sites in Bangladesh.", architecture: "Mud and brick fortress, citadels.", pictures: "mahasthangarh.jpg", latitude: 24.9646, longitude: 89.3379 },
    { name: "Somapura Mahavihara", era: "8th Century CE", s_thana: "Badalgachhi", s_district: "Naogaon", s_street: "Paharpur Road", description: "Famous Buddhist monastery and UNESCO World Heritage Site.", architecture: "Brick monastery with central cruciform stupa.", pictures: "somapura.jpg", latitude: 25.0311, longitude: 88.9767 },
    { name: "Mainamati", era: "8th-12th Century CE", s_thana: "Comilla Sadar", s_district: "Comilla", s_street: "Cantonment Road", description: "Archaeological site with numerous Buddhist and Hindu ruins like Shalban Vihara.", architecture: "Terracotta decorated temples and stupas.", pictures: "mainamati.jpg", latitude: 23.4472, longitude: 91.135 },
    { name: "Wari-Bateshwar", era: "450 BCE", s_thana: "Belabo", s_district: "Narsingdi", s_street: "Bateshwar Village", description: "Ancient fort city believed to be Ptolemy's Sounagoura.", architecture: "Mud-walled fortress and brick paved roads.", pictures: "wari.jpg", latitude: 24.0898, longitude: 90.8143 },
    { name: "Paundra Vardhana", era: "Mauryan Era", s_thana: "Mohasthan", s_district: "Bogra", s_street: "River Karatoya Bend", description: "Provincial capital of multiple empires.", architecture: "Massive defense walls.", pictures: "paundra.jpg", latitude: 24.9620, longitude: 89.3400 },
    { name: "Unknown Cave", era: "Prehistoric", description: "Recently discovered cave with paleolithic tools.", architecture: "Natural cave formation" },
  ]);

  // --- Additional dummy site ---
  const bhitagarh = await Site.create({
    name: "Bhitagarh Fort City",
    era: "3rd Century BCE to 6th Century CE",
    s_thana: "Panchagarh Sadar",
    s_district: "Panchagarh",
    s_street: "Amarkhana Road",
    description: "A large fortified ancient city with concentric moats in northern Bangladesh.",
    architecture: "Quadruple defensive walls and water reservoirs.",
    pictures: "bhitagarh.jpg",
    latitude: 26.3667,
    longitude: 88.5500,
  });

  console.log("Creating users...");
  const [alice, bob, charlie, dina, elias, fatima, tariq, nusrat, rahim, sultana, jamal, kamal, layla, publicUser, mizan, shirin] = await User.create([
    { nid: "A001", role: "archaeologist", status: "approved", name: "Alice Rahman", email: "alice@bracu.ac.bd", phone: "+8801712345678", password: hash, roleProfile: { affiliation: "BRAC University", biography: "Expert in ancient South Asian sites." } },
    { nid: "A002", role: "archaeologist", status: "approved", name: "Bob Karim", email: "bob@bracu.ac.bd", phone: "+8801723456789", password: hash, roleProfile: { affiliation: "BRAC University", biography: "Specialist in Mughal architecture." } },
    { nid: "A003", role: "archaeologist", status: "approved", name: "Charlie Hasan", email: "charlie@bracu.ac.bd", phone: "+8801734567890", password: hash, roleProfile: { affiliation: "Dhaka University", biography: "Focus on archaeological excavation methods." } },
    { nid: "AD001", role: "admin", status: "approved", name: "Dina Admin", email: "admin@gov.bd", phone: "+8801745678901", password: hash, roleProfile: { administration: "Department of Archaeology" } },
    { nid: "AD002", role: "admin", status: "approved", name: "Elias Director", email: "elias@gov.bd", phone: "+8801745678902", password: hash, roleProfile: { administration: "Ministry of Cultural Affairs" } },
    { nid: "MM001", role: "museum_manager", status: "approved", name: "Fatima Begum", email: "fatima@museum.bd", phone: "+8801789012345", password: hash, roleProfile: { museum_name: "National Museum of Bangladesh", m_city: "Dhaka", m_street: "Shahbag Avenue" } },
    { nid: "MM002", role: "museum_manager", status: "approved", name: "Tariq Islam", email: "tariq@museum.bd", phone: "+8801790123456", password: hash, roleProfile: { museum_name: "Folk Art Museum", m_city: "Narayanganj", m_street: "Sonargaon" } },
    { nid: "MM003", role: "museum_manager", status: "approved", name: "Nusrat Jahan", email: "nusrat@museum.bd", phone: "+8801801234567", password: hash, roleProfile: { museum_name: "Varendra Research Museum", m_city: "Rajshahi", m_street: "University Road" } },
    { nid: "SC001", role: "site_caretaker", status: "approved", name: "Rahim Khan", email: "rahim@caretaker.bd", phone: "+8801756789012", password: hash, roleProfile: { site: mahasthangarh._id, budget: 150000 } },
    { nid: "SC002", role: "site_caretaker", status: "approved", name: "Sultana Ahmed", email: "sultana@caretaker.bd", phone: "+8801767890123", password: hash, roleProfile: { site: somapura._id, budget: 175000 } },
    { nid: "SC003", role: "site_caretaker", status: "approved", name: "Jamal Uddin", email: "jamal@caretaker.bd", phone: "+8801778901234", password: hash, roleProfile: { site: mainamati._id, budget: 160000 } },
    { nid: "MNG001", role: "manager", status: "approved", name: "Kamal Hossain", email: "kamal@eng.bd", phone: "+8801511111111", password: hash },
    { nid: "MNG002", role: "manager", status: "approved", name: "Layla Khan", email: "layla@eng.bd", phone: "+8801522222222", password: hash },
    { nid: "PUB001", role: "public", status: "approved", name: "Javed Public", email: "javed@gmail.com", phone: "+8801999999999", password: hash },
    { nid: "A004", role: "archaeologist", status: "approved", name: "Mizanur Rahman", email: "mizan@bracu.ac.bd", phone: "+8801611223344", password: hash, roleProfile: { affiliation: "Jahangirnagar University", biography: "Researches early historic trade networks of Bengal." } },
    { nid: "PUB002", role: "public", status: "approved", name: "Shirin Akter", email: "shirin@gmail.com", phone: "+8801744556677", password: hash }
  ]);

  console.log("Creating excavation projects + requests...");
  const project1 = await ExcavationProject.create({
    p_name: "Mahasthangarh Citadel Dig",
    organization: "Dept of Archaeology",
    start_date: new Date("2024-01-15"),
    end_date: null,
    progress: "In Progress",
    lead_archaeologist: alice._id,
    site: mahasthangarh._id,
    budget: 500000,
  });

  const project2 = await ExcavationProject.create({
    p_name: "Somapura Vihara Structural Survey",
    organization: "UNESCO / Govt",
    start_date: new Date("2023-11-01"),
    end_date: new Date("2024-05-20"),
    progress: "Almost Done",
    lead_archaeologist: bob._id,
    site: somapura._id,
    budget: 750000,
  });

  const project3 = await ExcavationProject.create({
    p_name: "Wari-Bateshwar Phase II",
    organization: "Jahangirnagar University",
    start_date: new Date("2024-06-10"),
    end_date: null,
    progress: "Just Started",
    lead_archaeologist: charlie._id,
    site: wari_bateshwar._id,
    budget: 350000,
  });

  await ExcavationRequest.create([
    { site: mainamati._id, archaeologist: alice._id, proposal: "Proposal to investigate unexcavated mounds north of Shalban Vihara.", budget: 400000 },
    { site: paundra._id, archaeologist: bob._id, proposal: "Test trenches along the eastern riverbed.", budget: 120000 },
  ]);

  await ETeam.create([
    { project: project1._id, teamNo: 1, role: "Trench Diggers", manager: kamal._id, member_list: "Asif, Belal, Chanchal, Dipu" },
    { project: project1._id, teamNo: 2, role: "Survey Mapping", manager: layla._id, member_list: "Nadia, Farzana, Rina" },
    { project: project3._id, teamNo: 1, role: "Surface Collection", manager: kamal._id, member_list: "Tariq, Jamil" }
  ]);

  console.log("Creating items (20+ artifacts)...");
  const itemDefs = [
    { site: mahasthangarh, name: "Terracotta Plaque", description: "Plaque depicting a flying gandharva", discovery_date: "2024-02-10", Type: "Pottery", civilization: "Pala", era: "8th Century", region: "Bogra", material: "Terracotta", usage: "Decorative Architecture" },
    { site: mahasthangarh, name: "Punch-marked Silver Coin", description: "Early currency from Mauryan era", discovery_date: "2024-03-05", Type: "Metal_Object", civilization: "Mauryan", era: "3rd Century BCE", region: "Bogra", material: "Silver", usage: "Currency" },
    { site: mahasthangarh, name: "NBPW Sherd", description: "Fragment of Northern Black Polished Ware", discovery_date: "2024-01-20", Type: "Pottery", civilization: "Mauryan", era: "3rd Century BCE", region: "Bogra", material: "Ceramic", usage: "Household Vessel" },
    { site: somapura, name: "Bronze Buddha", description: "Medium-sized statue of seated Buddha", discovery_date: "2023-12-15", Type: "Metal_Object", civilization: "Pala", era: "9th Century", region: "Naogaon", material: "Bronze", usage: "Religious Icon" },
    { site: somapura, name: "Inscribed Brick", description: "Brick with proto-Bengali script", discovery_date: "2023-11-20", Type: "Pottery", civilization: "Pala", era: "8th Century", region: "Naogaon", material: "Terracotta", usage: "Structural" },
    { site: somapura, name: "Stone Lotus Finial", description: "Carved stone piece from stupa top", discovery_date: "2024-04-10", Type: "Rock", civilization: "Pala", era: "8th Century", region: "Naogaon", material: "Sandstone", usage: "Architecture" },
    { site: mainamati, name: "Copper Plate Grant", description: "Royal charter of King Bhavadeva", discovery_date: "2019-07-18", Type: "Metal_Object", civilization: "Deva Dynasty", era: "7th-8th Century", region: "Comilla", material: "Copper", usage: "Royal Edict" },
    { site: mainamati, name: "Spouted Vessel", description: "Water jug used by monks", discovery_date: "2020-02-25", Type: "Pottery", civilization: "Samata", era: "11th Century", region: "Comilla", material: "Terracotta", usage: "Domestic" },
    { site: wari_bateshwar, name: "Semi-precious Stone Beads", description: "Collection of carnelian and agate beads", discovery_date: "2024-06-15", Type: "Jewelry", civilization: "Early Historic Bengal", era: "450 BCE", region: "Narsingdi", material: "Carnelian/Agate", usage: "Ornament" },
    { site: wari_bateshwar, name: "Iron Axe Head", description: "Corroded ancient axe", discovery_date: "2024-06-20", Type: "Metal_Object", civilization: "Early Historic Bengal", era: "450 BCE", region: "Narsingdi", material: "Iron", usage: "Tool/Weapon" },
    { site: wari_bateshwar, name: "Rouletted Ware Sherd", description: "Pottery fragment showing Roman trade", discovery_date: "2024-06-25", Type: "Pottery", civilization: "Early Historic Bengal", era: "1st Century CE", region: "Narsingdi", material: "Ceramic", usage: "Imported Good" },
    { site: paundra, name: "Gold Earring", description: "Intricate floral designed gold earring", discovery_date: "2022-09-10", Type: "Jewelry", civilization: "Gupta", era: "5th Century", region: "Bogra", material: "Gold", usage: "Ornament" },
    { site: paundra, name: "Vishnu Sculpture Fragment", description: "Lower torso of a deity statue", discovery_date: "2021-08-05", Type: "Rock", civilization: "Sena", era: "12th Century", region: "Bogra", material: "Black Basalt", usage: "Religious" },
    { site: mahasthangarh, name: "Skeletal Remains - Child", description: "Fragmented bones near eastern gate", discovery_date: "2015-04-01", Type: "Human_Remains", civilization: "Pundravardhana", era: "Migration Period", region: "Bogra", material: "Bone", usage: "Burial" },
    { site: somapura, name: "Monastic Seal", description: "Terracotta seal of the Mahavihara", discovery_date: "2017-11-11", Type: "Pottery", civilization: "Pala", era: "9th Century", region: "Naogaon", material: "Terracotta", usage: "Administrative" },
    { site: mainamati, name: "Bronze Bell", description: "Ritual bell from a shrine", discovery_date: "2016-07-21", Type: "Metal_Object", civilization: "Candra Dynasty", era: "10th Century", region: "Comilla", material: "Bronze", usage: "Ritual" },
    { site: wari_bateshwar, name: "Glass Beads", description: "Indo-Pacific glass beads", discovery_date: "2014-02-17", Type: "Jewelry", civilization: "Early Historic", era: "2nd Century BCE", region: "Narsingdi", material: "Glass", usage: "Trade Good" },
    { site: paundra, name: "Ivory Comb", description: "Finely carved cosmetic object", discovery_date: "2023-01-12", Type: "Bone/Ivory", civilization: "Gupta", era: "4th Century", region: "Bogra", material: "Ivory", usage: "Cosmetic" },
    { site: mahasthangarh, name: "Brahmi Inscription Fragment", description: "Limestone piece with Brahmi script", discovery_date: "2023-05-22", Type: "Rock", civilization: "Mauryan", era: "3rd Century BCE", region: "Bogra", material: "Limestone", usage: "Record" },
    { site: paundra, name: "Terracotta Animal Figurine", description: "Small horse figure", discovery_date: "2022-11-08", Type: "Pottery", civilization: "Sunga", era: "2nd Century BCE", region: "Bogra", material: "Terracotta", usage: "Toy/Votive" },
    { site: bhitagarh, name: "Fortification Brick Stamp", description: "Kiln-stamped brick from the outer rampart", discovery_date: "2024-08-14", Type: "Pottery", civilization: "Pundravardhana", era: "4th Century CE", region: "Panchagarh", material: "Terracotta", usage: "Structural" },
    { site: bhitagarh, name: "Copper Alloy Ring", description: "Plain finger ring recovered from the moat silt", discovery_date: "2024-08-19", Type: "Metal_Object", civilization: "Early Historic Bengal", era: "5th Century CE", region: "Panchagarh", material: "Copper Alloy", usage: "Ornament" },
    { site: bhitagarh, name: "Grey Ware Bowl", description: "Wheel-thrown grey ware serving bowl", discovery_date: "2024-09-02", Type: "Pottery", civilization: "Early Historic Bengal", era: "3rd Century CE", region: "Panchagarh", material: "Ceramic", usage: "Household Vessel" },
  ];

  const items = await Item.create(itemDefs.map((i) => ({ ...i, site: i.site._id })));
  const itemByName = Object.fromEntries(items.map((i) => [i.name, i]));

  console.log("Creating tools...");
  const tools = await Tool.create([
    { model_no: "TRW-100", type: "Marshalltown Trowel", owner: "Dept. of Archaeology", insurance_info: "Standard", hazard: "Low hazard" },
    { model_no: "GNSS-500", type: "RTK Handheld GPS", owner: "BRAC University", insurance_info: "Premium insurance", hazard: "Fragile electronic" },
    { model_no: "TS-200", type: "Total Station", owner: "Dhaka University Lab", insurance_info: "Fully Insured", hazard: "Laser hazard" },
    { model_no: "DRN-350", type: "DJI Mapping Drone", owner: "Dept. of Archaeology", insurance_info: "Drone coverage active", hazard: "Aviation hazard" },
    { model_no: "SFT-880", type: "Sifting Screen (Large)", owner: "Govt Contractor", insurance_info: "Not insured", hazard: "Pinch points" },
    { model_no: "GEN-5KW", type: "5kW Diesel Generator", owner: "Govt Contractor", insurance_info: "Covered till 2027", hazard: "Fuel/exhaust hazard" },
    { model_no: "GPR-720", type: "Ground Penetrating Radar", owner: "Jahangirnagar University", insurance_info: "Premium insurance", hazard: "Fragile electronic" },
  ]);
  const toolByModel = Object.fromEntries(tools.map((t) => [t.model_no, t]));

  console.log("Creating tool rental requests...");
  await ToolRentalRequest.create([
    { user: alice._id, tool: toolByModel["DRN-350"]._id, project: project1._id, start_date: "2024-07-01", end_date: "2024-07-15", approval_status: "Approved", purpose: "Aerial mapping of Mahasthan", admin: dina._id },
    { user: alice._id, tool: toolByModel["GEN-5KW"]._id, project: project1._id, start_date: "2024-07-05", end_date: "2024-08-05", approval_status: "Pending", purpose: "Power water pumps for deep trench" },
    { user: charlie._id, tool: toolByModel["GNSS-500"]._id, project: project3._id, start_date: "2024-06-12", end_date: "2024-06-30", approval_status: "Approved", purpose: "Grid layout", admin: elias._id },
  ]);

  console.log("Creating item requests (Museum Loans)...");
  await ItemRequest.create([
    { museum_manager: fatima._id, item: itemByName["Bronze Buddha"]._id, purpose: "Pala Era Masterpieces Exhibition", approval_status: "Approved", start_date: "2024-10-01", end_date: "2025-01-01", insurance_info: "Insured for 5M BDT", admin: dina._id },
    { museum_manager: tariq._id, item: itemByName["Punch-marked Silver Coin"]._id, purpose: "Economic History Display", approval_status: "Approved", start_date: "2024-08-15", end_date: "2024-11-15", insurance_info: "Insured for 1M BDT", admin: elias._id },
    { museum_manager: nusrat._id, item: itemByName["Terracotta Plaque"]._id, purpose: "Northern Architecture Exhibit", approval_status: "Pending", start_date: "2024-09-01", end_date: "2024-12-01", insurance_info: "Museum general policy matches value" },
    { museum_manager: fatima._id, item: itemByName["Copper Plate Grant"]._id, purpose: "Epigraphy display", approval_status: "Denied", start_date: "2024-01-10", end_date: "2024-02-10", insurance_info: "Insufficient transit coverage", admin: dina._id },
  ]);

  console.log("Creating maintenance requests...");
  await RequestMaintenance.create([
    { site: mahasthangarh._id, caretaker: rahim._id, damage: "Monsoon rains washed away part of the northern citadel brickwork.", repair_cost: 35000, status: "Pending" },
    { site: somapura._id, caretaker: sultana._id, damage: "Dampness causing moss growth on central shrine terracottas.", approved_budget: 45000, repair_cost: 45000, status: "Approved", admin: elias._id },
    { site: mainamati._id, caretaker: jamal._id, damage: "Boundary wall collapsed near Salban Vihara entrance.", approved_budget: 85000, repair_cost: 85000, status: "Approved", admin: dina._id },
    { site: wari_bateshwar._id, caretaker: jamal._id, damage: "Illegal digging detected near southern mounds, need fencing.", repair_cost: 150000, status: "Pending" },
  ]);

  console.log("Creating discovery and researcher reports...");
  const dr1 = await DiscoveryReport.create({
    reporter: publicUser._id,
    location: { lat: 24.9650, lng: 89.3385, address: "Bhasu Vihara Village" },
    material: "Large carved stone block",
    contact_email: "javed@gmail.com",
    contact_phone: "+8801999999999",
    status: "Verified",
    assignment: { researcher: alice._id, budget: 15000, assigned_by: dina._id, assigned_at: new Date("2024-05-10") },
    verification: { result: "true", notes: "A genuine limestone architectural block, likely Guptan.", submitted_at: new Date("2024-05-15") },
  });

  await ResearcherReport.create({
    discoveryReport: dr1._id,
    researcher: alice._id,
    possibleArtifact: true,
    notes: "Detailed structural analysis of the stone shows it belongs to a heavily destroyed temple base. We recovered the piece to the lab.",
    budgetRequested: 25000,
    requestExcavationTeam: false,
    status: "Submitted",
  });

  const dr2 = await DiscoveryReport.create({
    reporter: publicUser._id,
    location: { lat: 24.100, lng: 90.820, address: "Sonargaon riverbank" },
    material: "Shiny metal objects in mud",
    contact_email: "javed@gmail.com",
    contact_phone: "+8801999999999",
    status: "Assigned",
    assignment: { researcher: charlie._id, budget: 5000, assigned_by: elias._id, assigned_at: new Date("2024-07-10") },
  });

  const dr3 = await DiscoveryReport.create({
    reporter: publicUser._id,
    location: { lat: 25.040, lng: 88.980, address: "Farmer field near Paharpur" },
    material: "Broken pottery handles",
    contact_email: "javed@gmail.com",
    contact_phone: "+8801999999999",
    status: "Rejected",
    assignment: { researcher: bob._id, budget: 2000, assigned_by: dina._id, assigned_at: new Date("2024-02-10") },
    verification: { result: "false", notes: "These are modern discarded water pots. No archaeological value.", submitted_at: new Date("2024-02-14") },
  });


  console.log("Creating knowledge resources...");
  await KnowledgeResource.create([
    { title: "Excavation and Analysis of Somapura Mahavihara", type: "research_paper", author: "Dr. Alice Rahman", content: "A comprehensive archaeological study documenting the architectural evolution.", url: "https://example.com/papers/somapura.pdf", addedBy: alice._id },
    { title: "Pala Period Art and Iconography", type: "book", author: "Bob Karim", content: "An extensive book describing the rich iconographic patterns.", addedBy: bob._id },
    { title: "Wari-Bateshwar: An Early Historic City", type: "article", author: "Charlie Hasan", content: "Discussing urbanization in Bengal during 500 BCE.", url: "https://example.com/wari.html", addedBy: charlie._id },
    { title: "Epigraphic Records of Mainamati", type: "historical_reference", author: "National Museum", content: "Reference guide detailing copperplate inscriptions.", addedBy: dina._id },
    { title: "Walking Through Mahasthan: Vlog", type: "vlog_audio", author: "Dr. Alice Rahman", content: "Video tour of the citadel walls.", url: "https://youtube.com", addedBy: alice._id },
    // --- Restored from the knowledge hub dataset (originally seeded before the merge) ---
    { title: "Discovering Pundravardhana: The Mahasthan Chronicles", type: "article", author: "Alice Rahman", content: "A detailed article exploring the history of Mahasthangarh, one of the earliest urban archaeological sites in Bangladesh, tracing its roots to the 3rd century BCE.", url: "https://example.com/articles/mahasthan-chronicles.html", addedBy: alice._id },
    { title: "The Epigraphic Records of Mainamati Sites", type: "historical_reference", author: "National Museum Archives", content: "A reference guide detailing the copperplate inscriptions and royal charters discovered across Mainamati temples, verifying land grants of the Chandra and Deva dynasties.", url: "https://example.com/references/mainamati-epigraphy.pdf", addedBy: dina._id },
    { title: "Walking Through Somapura: A Video Tour", type: "vlog_audio", author: "Dr. Alice Rahman", content: "A vlog showcasing the spatial layout of Paharpur Buddhist Vihara, with narration detailing the structural significance of the central temple tower.", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", addedBy: alice._id },
    { title: "Audio Diary: Day 42 at Mahasthangarh Dig Site", type: "vlog_audio", author: "Bob Karim", content: "An audio journal recording the exciting discovery of a new bronze sword and associated pottery shards near the eastern ramparts.", url: "https://example.com/audio/mahasthan-day42.mp3", addedBy: bob._id },
    { title: "Concentric Moats of Bhitagarh: A Survey", type: "research_paper", author: "Mizanur Rahman", content: "Field survey documenting the hydraulic defensive design of the Bhitagarh fort city.", url: "https://example.com/papers/bhitagarh.pdf", addedBy: mizan._id },
    { title: "Trade Beads of Ancient Bengal", type: "article", author: "Mizanur Rahman", content: "Overview of glass and semi-precious stone beads as evidence of long-distance trade.", url: "https://example.com/beads.html", addedBy: mizan._id },
  ]);

  console.log("\nDone! Database seeded with 20+ artifacts, 3 ongoing projects, 5+ users per role.");
  console.log("Log in with any nid or email, e.g. nid 'A001' (archaeologist), 'AD001' (admin), 'MM001' (museum).");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
