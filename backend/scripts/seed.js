// Seeds MongoDB with the same sample data that was in 370finalproject.sql
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
  ]);

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  console.log("Creating sites...");
  const [mahasthangarh, somapura, mainamati, shabnam] = await Site.create([
    { name: "Mahasthangarh", era: "Pala Period", s_thana: "Badalgachhi", s_district: "Naogaon", s_street: "Main Road", description: "Ancient city ruins of the Pala dynasty.", architecture: "Brick walls and fortifications.", pictures: "mahasthangarh.jpg" },
    { name: "Somapura Mahavihara", era: "Pala Period", s_thana: "Paharpur Thana", s_district: "Naogaon", s_street: "Vihara Road", description: "Famous Buddhist monastery and UNESCO World Heritage Site.", architecture: "Brick monastery with central stupa.", pictures: "somapura.jpg" },
    { name: "Mainamati", era: "8th-12th Century", s_thana: "Comilla Sadar", s_district: "Comilla", s_street: "Temple Street", description: "Archaeological site with Buddhist and Hindu ruins.", architecture: "Temples and stupas scattered across the site.", pictures: "mainamati.jpg" },
    { name: "shabnam", era: "mandattar amol", description: "ajobbbbbb", architecture: "niceeeee" },
  ]);

  console.log("Creating users...");
  const [alice, bob, charlie, dina, adcd, fatima, tariq, nusrat, rahim, sultana, jamal] = await User.create([
    { nid: "A001", role: "archaeologist", status: "approved", name: "Alice Rahman", email: "alice@g.bracu.ac.bd", phone: "+8801712345678", password: hash, roleProfile: { affiliation: "BRAC University", biography: "Expert in ancient South Asian sites." } },
    { nid: "A002", role: "archaeologist", status: "approved", name: "Bob Karim", email: "bob@g.bracu.ac.bd", phone: "+8801723456789", password: hash, roleProfile: { affiliation: "BRAC University", biography: "Specialist in Mughal architecture." } },
    { nid: "A003", role: "archaeologist", status: "approved", name: "Charlie Hasan", email: "charlie@g.bracu.ac.bd", phone: "+8801734567890", password: hash, roleProfile: { affiliation: "BRAC University", biography: "Focus on archaeological excavation methods." } },
    { nid: "AD001", role: "admin", status: "approved", name: "System Administrator", email: "admin@gov.bd", phone: "+8801745678901", password: hash, roleProfile: { administration: "Department of Archaeology" } },
    { nid: "adcd", role: "manager", status: "approved", name: "adcd", email: "adcd@kisuekta.com", phone: "34567", password: hash },
    { nid: "MM001", role: "museum_manager", status: "approved", name: "Fatima Begum", email: "fatima.begum@bracu.ac.bd", phone: "+8801789012345", password: hash, roleProfile: { museum_name: "National Museum of Bangladesh", m_city: "Dhaka", m_street: "Shahbag Avenue" } },
    { nid: "MM002", role: "museum_manager", status: "approved", name: "Tariq Islam", email: "tariq.islam@bracu.ac.bd", phone: "+8801790123456", password: hash, roleProfile: { museum_name: "Bangladesh Folk Art Museum", m_city: "Dhaka", m_street: "Sonargaon Road" } },
    { nid: "MM003", role: "museum_manager", status: "approved", name: "Nusrat Jahan", email: "nusrat.jahan@bracu.ac.bd", phone: "+8801801234567", password: hash, roleProfile: { museum_name: "Varendra Research Museum", m_city: "Rajshahi", m_street: "University Road" } },
    { nid: "SC001", role: "site_caretaker", status: "approved", name: "Rahim Khan", email: "rahim.khan@outlook.com", phone: "+8801756789012", password: hash, roleProfile: { site: mahasthangarh._id, budget: 50000 } },
    { nid: "SC002", role: "site_caretaker", status: "approved", name: "Sultana Ahmed", email: "sultana.ahmed@outlook.com", phone: "+8801767890123", password: hash, roleProfile: { site: somapura._id, budget: 75000 } },
    { nid: "SC003", role: "site_caretaker", status: "approved", name: "Jamal Uddin", email: "jamal.uddin@outlook.com", phone: "+8801778901234", password: hash, roleProfile: { site: mainamati._id, budget: 60000 } },
  ]);

  console.log("Creating excavation project + request...");
  const project = await ExcavationProject.create({
    p_name: "Project Mahasthangarh",
    organization: "Government",
    start_date: new Date("2025-09-05"),
    end_date: null,
    progress: "Just Started",
    lead_archaeologist: alice._id,
    site: mahasthangarh._id,
    budget: 20000,
  });

  await ExcavationRequest.create({
    site: shabnam._id,
    archaeologist: alice._id,
    proposal: "Proposal to investigate the shabnam site further.",
    budget: 12000,
  });

  await ETeam.create({
    project: project._id,
    teamNo: 1,
    role: "Painting Walls",
    manager: adcd._id,
    member_list: "Aslam, Alice, Sharif",
  });

  console.log("Creating items + specializations...");
  const itemDefs = [
    { site: mahasthangarh, name: "Clay Pot", description: "Ancient clay storage pot", discovery_date: "2022-05-10", Type: "Pottery", specialization: { utility_pottery: "Storage", material_type: "Terracotta" } },
    { site: mahasthangarh, name: "Cooking Vessel", description: "Pottery vessel used for cooking", discovery_date: "2021-11-15", Type: "Pottery", specialization: { utility_pottery: "Cooking", material_type: "Terracotta" } },
    { site: somapura, name: "Decorated Jar", description: "Jar with geometric patterns", discovery_date: "2020-03-20", Type: "Pottery", specialization: { utility_pottery: "Storage", material_type: "Ceramic" } },
    { site: mainamati, name: "Small Cup", description: "Cup used for rituals", discovery_date: "2019-07-18", Type: "Pottery", specialization: { utility_pottery: "Ritual", material_type: "Terracotta" } },
    { site: mahasthangarh, name: "Bronze Sword", description: "Bronze weapon used in warfare", discovery_date: "2018-09-25", Type: "Metal_Object", specialization: { utility_metal: "Weapon", alloy: "Bronze Alloy" } },
    { site: somapura, name: "Iron Spearhead", description: "Iron spearhead used in hunting", discovery_date: "2017-04-12", Type: "Metal_Object", specialization: { utility_metal: "Weapon", alloy: "Iron" } },
    { site: somapura, name: "Copper Bracelet", description: "Jewelry made of copper", discovery_date: "2020-08-22", Type: "Metal_Object", specialization: { utility_metal: "Adornment", alloy: "Copper" } },
    { site: mainamati, name: "Silver Coin", description: "Ancient currency coin", discovery_date: "2016-01-05", Type: "Metal_Object", specialization: { utility_metal: "Currency", alloy: "Silver" } },
    { site: mahasthangarh, name: "Village Scene", description: "Painting depicting rural life", discovery_date: "2021-06-14", Type: "Paintings", specialization: { painter: "Unknown Artist", canvas_material: "Cloth Canvas", paint_type: "Natural Pigments" } },
    { site: somapura, name: "Battlefield", description: "Historical war painting", discovery_date: "2019-09-09", Type: "Paintings", specialization: { painter: "Warrior Monk", canvas_material: "Cotton Canvas", paint_type: "Oil Paint" } },
    { site: mainamati, name: "Royal Portrait", description: "Portrait of a king", discovery_date: "2018-12-02", Type: "Paintings", specialization: { painter: "Royal Artisan", canvas_material: "Silk Canvas", paint_type: "Watercolor" } },
    { site: mahasthangarh, name: "Skeleton A", description: "Human skeletal remains", discovery_date: "2015-04-01", Type: "Human_Remains", specialization: { cause_of_death: "Natural Causes", gender: "Male", ethnicity: "Dravidian", age: 35, decay_percentage: 70.5, ornaments: "Beads" } },
    { site: somapura, name: "Skull Fragment", description: "Part of human skull", discovery_date: "2017-11-11", Type: "Human_Remains", specialization: { cause_of_death: "Head Injury", gender: "Female", ethnicity: "Aryan", age: 25, decay_percentage: 50, ornaments: "None" } },
    { site: mainamati, name: "Burial Remains", description: "Remains found in burial site", discovery_date: "2016-07-21", Type: "Human_Remains", specialization: { cause_of_death: "Ritual Burial", gender: "Male", ethnicity: "Mixed", age: 40, decay_percentage: 90, ornaments: "Bronze Ring" } },
    { site: somapura, name: "Mummified Body", description: "Partially preserved remains", discovery_date: "2014-02-17", Type: "Human_Remains", specialization: { cause_of_death: "Disease", gender: "Female", ethnicity: "Indus Valley", age: 30, decay_percentage: 30.5, ornaments: "Gold Necklace" } },
    { site: mahasthangarh, name: "Crown", description: "Crown of hason raja", discovery_date: "2025-09-02", Type: "Metal_Object", specialization: { utility_metal: "Adornment", alloy: "Gold" } },
  ];
  const items = await Item.create(
    itemDefs.map((i) => ({ ...i, site: i.site._id }))
  );
  const itemByName = Object.fromEntries(items.map((i) => [i.name, i]));

  console.log("Creating tools...");
  const tools = await Tool.create([
    { model_no: "BRH-3003", type: "Brush Set", owner: "Dept. of Archaeology", insurance_info: "Not insured", hazard: "Low hazard" },
    { model_no: "CMP-4004", type: "Portable Compressor", owner: "Private Supplier Ltd", insurance_info: "Covered till 2025", hazard: "Noise hazard" },
    { model_no: "DRL-1001", type: "Drilling Machine", owner: "Dept. of Archaeology", insurance_info: "Covered till 2026", hazard: "Wear safety goggles" },
    { model_no: "EXC-2002", type: "Excavator", owner: "Govt Contractor", insurance_info: "Full insurance", hazard: "High accident risk" },
    { model_no: "GEN-6006", type: "Power Generator", owner: "Govt Contractor", insurance_info: "Covered till 2027", hazard: "Fire hazard" },
    { model_no: "LTN-5005", type: "Laser Scanner", owner: "BRAC University Lab", insurance_info: "Premium insurance", hazard: "Eye hazard, handle with care" },
    { model_no: "TNT-7007", type: "Trowel Set", owner: "Dept. of Archaeology", insurance_info: "Not insured", hazard: "Low hazard" },
  ]);
  const toolByModel = Object.fromEntries(tools.map((t) => [t.model_no, t]));

  console.log("Creating tool rental requests...");
  await ToolRentalRequest.create([
    { user: alice._id, tool: toolByModel["BRH-3003"]._id, project: project._id, start_date: "2025-09-06", end_date: "2025-09-11", approval_status: "Pending", purpose: "Painting of outer wall" },
    { user: alice._id, tool: toolByModel["DRL-1001"]._id, project: project._id, start_date: "2025-09-06", end_date: "2025-09-11", approval_status: "Pending", purpose: "Painting of outer wall" },
    { user: alice._id, tool: toolByModel["EXC-2002"]._id, project: project._id, start_date: "2025-09-06", end_date: "2025-09-11", approval_status: "Approved", purpose: "Painting of outer wall", admin: dina._id },
  ]);

  console.log("Creating item requests...");
  await ItemRequest.create([
    { museum_manager: fatima._id, item: itemByName["Clay Pot"]._id, purpose: "Temporary exhibition on ancient pottery techniques", approval_status: "Pending", start_date: "2024-03-01", end_date: "2024-06-01", insurance_info: "Insured for $5000 against damage and theft" },
    { museum_manager: tariq._id, item: itemByName["Bronze Sword"]._id, purpose: "Educational display about ancient weaponry", approval_status: "Approved", start_date: "2024-02-15", end_date: "2024-05-15", insurance_info: "Full insurance coverage up to $8000", admin: dina._id },
    { museum_manager: nusrat._id, item: itemByName["Village Scene"]._id, purpose: "Special exhibition on historical artwork", approval_status: "Pending", start_date: "2024-04-01", end_date: "2024-07-01", insurance_info: "Comprehensive insurance policy for artwork" },
    { museum_manager: fatima._id, item: itemByName["Decorated Jar"]._id, purpose: "Research study on decorative patterns", approval_status: "Denied", start_date: "2024-01-10", end_date: "2024-02-10", insurance_info: "Standard research insurance", admin: dina._id },
    { museum_manager: tariq._id, item: itemByName["Copper Bracelet"]._id, purpose: "Cultural heritage display", approval_status: "Approved", start_date: "2024-03-15", end_date: "2024-06-15", insurance_info: "Premium insurance coverage for jewelry items", admin: dina._id },
  ]);

  console.log("Creating maintenance requests...");
  await RequestMaintenance.create([
    { site: mahasthangarh._id, caretaker: rahim._id, damage: "Heavy rainfall caused erosion on the northern wall of the excavation site. Bricks are becoming loose and need reinforcement.", repair_cost: 15000, status: "Pending" },
    { site: somapura._id, caretaker: sultana._id, damage: "Main stupa structure has developed cracks due to soil settlement. Needs professional structural assessment and repair.", approved_budget: 22000, repair_cost: 25000, status: "Approved" },
    { site: mainamati._id, caretaker: jamal._id, damage: "Visitor pathway has deteriorated and become unsafe. Needs resurfacing and safety railings installed.", approved_budget: 10000, repair_cost: 12000, status: "Approved" },
    { site: mahasthangarh._id, caretaker: rahim._id, damage: "Drainage system around the site is clogged and causing water accumulation during rains. Needs cleaning and repair.", approved_budget: 8000, repair_cost: 8000, status: "Approved", admin: dina._id },
    { site: somapura._id, caretaker: sultana._id, damage: "Security fencing has been damaged in several sections. Needs replacement to prevent unauthorized access.", repair_cost: 18000, status: "Pending" },
  ]);

  console.log("\nDone! Every seeded user's password is:", DEFAULT_PASSWORD);
  console.log("Log in with any nid or email, e.g. nid 'A001' (archaeologist), 'AD001' (admin), 'MM001' (museum manager), 'SC001' (site caretaker).");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
