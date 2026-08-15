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
const Tender = require("../models/Tender"); // Ahad_23201016
const TenderBid = require("../models/TenderBid"); // Ahad_23201016
const KnowledgeResource = require("../models/KnowledgeResource");
const DiscoveryReport = require("../models/DiscoveryReport");
const ResearcherReport = require("../models/ResearcherReport");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Wishlist = require("../models/Wishlist");
const { MUSEUMS } = require("../config/museums");

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
    Tender.deleteMany({}), // Ahad_23201016
    TenderBid.deleteMany({}), // Ahad_23201016
    KnowledgeResource.deleteMany({}),
    DiscoveryReport.deleteMany({}),
    ResearcherReport.deleteMany({}),
    Auction.deleteMany({}),
    Wishlist.deleteMany({}),
  ]);

  // Some older seed runs left stale unique indexes on the bids collection.
  // Dropping the collection ensures the current schema can be recreated cleanly.
  try {
    await Bid.collection.drop();
  } catch (err) {
    if (err.code !== 26) {
      throw err;
    }
  }

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
    // Ahad_23201016 - Excavation Team accounts. Each one is a company, and
    // `name` is that company's representative. Log in with nid E001/E002/E003.
    { nid: "E001", role: "excavation_team", status: "approved", name: "Rahim Khan", email: "rahim@bengalexcavation.bd", phone: "+8801756789012", password: hash, roleProfile: { company_name: "Bengal Excavation Works Ltd.", representative_designation: "Site Operations Manager", team_size: 24, organization: "Bengal Excavation Works Ltd.", team_leader: "Rahim Khan" } },
    { nid: "E002", role: "excavation_team", status: "approved", name: "Sultana Ahmed", email: "sultana@heritagedigs.bd", phone: "+8801767890123", password: hash, roleProfile: { company_name: "Heritage Digs & Conservation", representative_designation: "Managing Director", team_size: 16, organization: "Heritage Digs & Conservation", team_leader: "Sultana Ahmed" } },
    { nid: "E003", role: "excavation_team", status: "approved", name: "Jamal Uddin", email: "jamal@padmagroundworks.bd", phone: "+8801778901234", password: hash, roleProfile: { company_name: "Padma Groundworks", representative_designation: "Field Supervisor", team_size: 31, organization: "Padma Groundworks", team_leader: "Jamal Uddin" } },
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
    { site: mainamati, name: "Bronze Vajra", description: "Ritual thunderbolt used in Vajrayana Buddhism worship", discovery_date: "2018-05-12", Type: "Metal_Object", civilization: "Candra Dynasty", era: "10th Century CE", region: "Comilla", material: "Bronze", usage: "Ritual" },
    { site: mainamati, name: "Silver Dinars", description: "Hoard of Abbasid and local silver coins indicating trade", discovery_date: "2019-11-20", Type: "Metal_Object", civilization: "Harikela", era: "8th Century CE", region: "Comilla", material: "Silver", usage: "Currency" },
    { site: mahasthangarh, name: "Northern Black Polished Ware Bowl", description: "Highly lustrous fine pottery from early urbanization period", discovery_date: "2020-03-14", Type: "Pottery", civilization: "Mauryan", era: "3rd Century BCE", region: "Bogra", material: "Ceramic", usage: "Luxury Goods" },
    { site: somapura, name: "Terracotta Plaque - Monkey", description: "Detailed plaque showing a monkey holding a fruit", discovery_date: "2021-01-22", Type: "Pottery", civilization: "Pala", era: "8th Century CE", region: "Naogaon", material: "Terracotta", usage: "Decorative Architecture" },
    { site: somapura, name: "Stone Reliquary", description: "Carved stone casket containing small ashes and beads", discovery_date: "2017-09-05", Type: "Rock", civilization: "Pala", era: "9th Century CE", region: "Naogaon", material: "Sandstone", usage: "Religious Container" },
    { site: wari_bateshwar, name: "Knobbed Vessel Fragment", description: "Base of a high-tin bronze knobbed vessel", discovery_date: "2015-02-18", Type: "Metal_Object", civilization: "Early Historic Bengal", era: "3rd Century BCE", region: "Narsingdi", material: "Bronze", usage: "Ritual/Luxury" },
    { site: paundra, name: "Sunga Terracotta Female Figurine", description: "Exquisitely molded figurine with elaborate headdress", discovery_date: "2022-06-11", Type: "Pottery", civilization: "Sunga", era: "2nd Century BCE", region: "Bogra", material: "Terracotta", usage: "Votive/Decorative" },
    { site: paundra, name: "Carved Ivory Dice", description: "Elongated cubical dice with circled dot markings", discovery_date: "2023-08-30", Type: "Bone/Ivory", civilization: "Gupta", era: "5th Century CE", region: "Bogra", material: "Ivory", usage: "Gaming" },
    { site: bhitagarh, name: "Iron Slag and Crucible Fragments", description: "Evidence of local iron smelting and forging", discovery_date: "2024-08-25", Type: "Metal_Object", civilization: "Pundravardhana", era: "4th Century CE", region: "Panchagarh", material: "Iron/Ceramic", usage: "Industrial" },
    { site: mahasthangarh, name: "Gold Amulet", description: "Small cylindrical gold case with repousse motifs", discovery_date: "2016-12-04", Type: "Jewelry", civilization: "Gupta", era: "4th Century CE", region: "Bogra", material: "Gold", usage: "Ornament/Religious" },
    { site: wari_bateshwar, name: "Banded Agate Bead", description: "Barrel-shaped bead with distinct white bands", discovery_date: "2019-04-19", Type: "Jewelry", civilization: "Early Historic Bengal", era: "400 BCE", region: "Narsingdi", material: "Agate", usage: "Ornament" },
    { site: somapura, name: "Bronze Tara Statue", description: "Miniature standing figure of Buddhist goddess Tara", discovery_date: "2020-11-28", Type: "Metal_Object", civilization: "Pala", era: "10th Century CE", region: "Naogaon", material: "Bronze", usage: "Religious Icon" },
    { site: mainamati, name: "Candra Dynasty Copper Plate", description: "Land grant inscription of Śrīcandra", discovery_date: "2014-10-15", Type: "Metal_Object", civilization: "Candra Dynasty", era: "10th Century CE", region: "Comilla", material: "Copper", usage: "Royal Record" },
    { site: bhitagarh, name: "Stucco Head Fragment", description: "Molded stucco face showing Hellenistic influence", discovery_date: "2024-09-05", Type: "Rock", civilization: "Kushan influence", era: "2nd Century CE", region: "Panchagarh", material: "Stucco", usage: "Sculptural" },
    { site: paundra, name: "Black and Red Ware Sherd", description: "Ceramic fragment typical of the early iron age levels", discovery_date: "2021-03-25", Type: "Pottery", civilization: "Pre-Mauryan", era: "5th Century BCE", region: "Bogra", material: "Ceramic", usage: "Household Vessel" }
  ];

  const baseMuseumItems = itemDefs.map((item, index) => ({
    ...item,
    site: item.site._id,
    allocation: "Museum",
    museumName: MUSEUMS[index % MUSEUMS.length],
    location: MUSEUMS[index % MUSEUMS.length],
  }));

  const items = await Item.create(baseMuseumItems);
  const itemByName = Object.fromEntries(items.map((i) => [i.name, i]));

  const museumAssignments = [
    { name: "Bronze Buddha", museumName: "National Museum of Bangladesh" },
    { name: "Punch-marked Silver Coin", museumName: "Folk Art Museum" },
    { name: "Terracotta Plaque", museumName: "Varendra Research Museum" },
    { name: "Copper Plate Grant", museumName: "National Museum of Bangladesh" },
    { name: "Gold Earring", museumName: "Folk Art Museum" },
  ];

  const extraMuseumItems = [
    { name: "Buddhist Miniature Manuscript Fragment", description: "Part of a palm-leaf manuscript from the Pala period.", Type: "Rock", civilization: "Pala", era: "10th Century", region: "Dhaka", material: "Palm Leaf", usage: "Manuscript", museumName: "Bangladesh National Museum", site: mahasthangarh },
    { name: "Copper Bell Fragment", description: "Hand bell fragment with embossed lotus pattern.", Type: "Metal_Object", civilization: "Gupta", era: "5th Century", region: "Comilla", material: "Bronze", usage: "Ritual", museumName: "Ahsan Manzil Museum", site: mainamati },
    { name: "Terracotta Female Figurine", description: "Votive figurine of a female deity from a local shrine.", Type: "Pottery", civilization: "Sena", era: "12th Century", region: "Bogra", material: "Terracotta", usage: "Religious", museumName: "Mainamati Museum", site: mainamati },
    { name: "Silver Headdress Pin", description: "Decorative pin used on ceremonial headwear.", Type: "Jewelry", civilization: "Early Historic Bengal", era: "3rd Century BCE", region: "Narsingdi", material: "Silver", usage: "Adornment", museumName: "Liberation War Museum", site: wari_bateshwar },
    { name: "Stone Doorjamb Fragment", description: "Carved architectural fragment used in a temple doorway.", Type: "Rock", civilization: "Chandra Dynasty", era: "10th Century", region: "Comilla", material: "Sandstone", usage: "Architecture", museumName: "Chittagong University Museum", site: mainamati },
    { name: "Bronze Censer Stand", description: "Portable incense burner with decorative lotus feet.", Type: "Metal_Object", civilization: "Pala", era: "9th Century CE", region: "Naogaon", material: "Bronze", usage: "Religious", museumName: "Paharpur Museum", site: somapura },
    { name: "Painted Pottery Jar", description: "Decorated jar from a domestic storage context.", Type: "Pottery", civilization: "Mauryan", era: "3rd Century BCE", region: "Bogra", material: "Ceramic", usage: "Domestic", museumName: "Mahasthangarh Museum", site: mahasthangarh },
    { name: "Shell Inlay Plaque", description: "Shell inlay work from a ceremonial object.", Type: "Jewelry", civilization: "Early Historic Bengal", era: "1st Century CE", region: "Narsingdi", material: "Shell", usage: "Adornment", museumName: "Rangpur Museum", site: wari_bateshwar },
    { name: "Stone Tablet with Script", description: "Fragment of a memorial tablet with early writing.", Type: "Rock", civilization: "Mauryan", era: "3rd Century BCE", region: "Bogra", material: "Limestone", usage: "Record", museumName: "Varendra Research Museum", site: mahasthangarh },
    { name: "Ancient Mirror Fragment", description: "Polished bronze mirror with a surviving handle.", Type: "Metal_Object", civilization: "Gupta", era: "5th Century CE", region: "Bogra", material: "Bronze", usage: "Personal Item", museumName: "Rajshahi Museum", site: paundra },
    { name: "Bone Hairpin", description: "Decorative hairpin from a burial context.", Type: "Bone/Ivory", civilization: "Early Historic Bengal", era: "450 BCE", region: "Narsingdi", material: "Bone", usage: "Adornment", museumName: "Narayanganj Heritage Museum", site: wari_bateshwar },
    { name: "Copper Alloy Bowl", description: "Ritual or ceremonial serving basin.", Type: "Metal_Object", civilization: "Candra Dynasty", era: "10th Century", region: "Comilla", material: "Copper Alloy", usage: "Ceremonial", museumName: "Dhaka City Museum", site: mainamati },
    { name: "Miniature Stone Idol Fragment", description: "Fragment of a small devotional stone image.", Type: "Rock", civilization: "Pala", era: "8th Century CE", region: "Naogaon", material: "Sandstone", usage: "Religious", museumName: "Bangladesh Heritage Museum", site: somapura },
    { name: "Glass Bead Necklace", description: "String of colourful beads used in adornment.", Type: "Jewelry", civilization: "Early Historic Bengal", era: "2nd Century BCE", region: "Narsingdi", material: "Glass", usage: "Adornment", museumName: "Chattogram Museum", site: wari_bateshwar },
    { name: "Iron Tool Fragment", description: "Part of a working agricultural or craft tool.", Type: "Metal_Object", civilization: "Pre-Mauryan", era: "5th Century BCE", region: "Bogra", material: "Iron", usage: "Tool", museumName: "Bogura Museum", site: mahasthangarh },
    { name: "Pottery Lamp Stand", description: "Lamp refractory stand from a temple setting.", Type: "Pottery", civilization: "Pala", era: "9th Century CE", region: "Naogaon", material: "Terracotta", usage: "Religious", museumName: "Sundarbans Museum", site: somapura },
    { name: "Ivory Carving Fragment", description: "Decorative ivory carving from a composite object.", Type: "Bone/Ivory", civilization: "Gupta", era: "5th Century", region: "Bogra", material: "Ivory", usage: "Adornment", museumName: "Khulna Museum", site: paundra },
    { name: "Copper Seal Impression", description: "Stamp seal used in administration or trade.", Type: "Metal_Object", civilization: "Harikela", era: "8th Century CE", region: "Comilla", material: "Copper", usage: "Administrative", museumName: "Barishal Museum", site: mainamati },
    { name: "Terracotta Stamp Seal", description: "Small circular seal with geometric motifs.", Type: "Pottery", civilization: "Pala", era: "9th Century", region: "Naogaon", material: "Terracotta", usage: "Administrative", museumName: "Coxs Bazar Discovery Museum", site: somapura },
    { name: "Stone Weight Fragment", description: "Fragment of a balanced measuring weight.", Type: "Rock", civilization: "Early Historic Bengal", era: "1st Century CE", region: "Narsingdi", material: "Stone", usage: "Trade", museumName: "Bogra District Museum", site: wari_bateshwar },
  ];

  const additionalMuseumArtifacts = [
    { name: "Bronze Offering Bowl", description: "Ceremonial bowl recovered near the temple courtyard.", site: somapura, Type: "Metal_Object", civilization: "Pala", era: "9th Century CE", region: "Naogaon", material: "Bronze", usage: "Religious", museumName: "Paharpur Museum" },
    { name: "Stone Sculpture Fragment", description: "Ancient temple sculpture fragment from the eastern wall.", site: mainamati, Type: "Rock", civilization: "Candra Dynasty", era: "10th Century", region: "Comilla", material: "Sandstone", usage: "Religious", museumName: "Mainamati Museum" },
    { name: "Copper Hooked Pin", description: "Decorative hooked pin used in ceremonial dress.", site: wari_bateshwar, Type: "Metal_Object", civilization: "Early Historic Bengal", era: "450 BCE", region: "Narsingdi", material: "Copper", usage: "Adornment", museumName: "Narsingdi Museum" },
    { name: "Terracotta Gaming Token", description: "Game token or marked piece from a domestic setting.", site: mahasthangarh, Type: "Pottery", civilization: "Mauryan", era: "3rd Century BCE", region: "Bogra", material: "Terracotta", usage: "Gaming", museumName: "Mahasthangarh Museum" },
    { name: "Gold Coin Hoard Fragment", description: "Fragment of a gold coin cache found near the western trench.", site: paundra, Type: "Metal_Object", civilization: "Gupta", era: "5th Century", region: "Bogra", material: "Gold", usage: "Currency", museumName: "Bogura Museum" },
    { name: "Bone Needle", description: "Long bone needle used in textile or ritual activity.", site: mainamati, Type: "Bone/Ivory", civilization: "Candra Dynasty", era: "10th Century", region: "Comilla", material: "Bone", usage: "Tool", museumName: "Cumilla Museum" },
    { name: "Terracotta Stupa Plaque", description: "Decorative plaque from a shrine or monastery wall.", site: somapura, Type: "Pottery", civilization: "Pala", era: "8th Century CE", region: "Naogaon", material: "Terracotta", usage: "Decorative Architecture", museumName: "Bangladesh National Museum" },
    { name: "Bronze Mirror Fragment", description: "Broken ceremonial bronze mirror with a decorated back.", site: bhitagarh, Type: "Metal_Object", civilization: "Pundravardhana", era: "4th Century CE", region: "Panchagarh", material: "Bronze", usage: "Personal Item", museumName: "Panchagarh Museum" },
    { name: "Stone Weight Set", description: "Balance weight used in trade or taxation.", site: wari_bateshwar, Type: "Rock", civilization: "Early Historic Bengal", era: "1st Century CE", region: "Narsingdi", material: "Stone", usage: "Trade", museumName: "Rangpur Museum" },
    { name: "Silver Armlet Fragment", description: "Decorative silver armlet from a high-status burial.", site: mahasthangarh, Type: "Jewelry", civilization: "Gupta", era: "4th Century CE", region: "Bogra", material: "Silver", usage: "Adornment", museumName: "Varendra Research Museum" },
    { name: "Painted Ceramic Dish", description: "Fine painted dish from a ritual or domestic context.", site: somapura, Type: "Pottery", civilization: "Pala", era: "9th Century CE", region: "Naogaon", material: "Ceramic", usage: "Domestic", museumName: "Bangladesh Heritage Museum" },
    { name: "Ivory Inlay Piece", description: "Decorative ivory inlay from a jeweled object or casket.", site: paundra, Type: "Bone/Ivory", civilization: "Gupta", era: "5th Century", region: "Bogra", material: "Ivory", usage: "Adornment", museumName: "Rajshahi Museum" },
  ];

  const createdExtraMuseumItems = await Item.create(
    [...extraMuseumItems, ...additionalMuseumArtifacts].map((item) => ({
      ...item,
      site: item.site?._id || null,
      location: item.museumName,
      allocation: "Museum",
      museumName: item.museumName,
      description: item.description || "Museum-assigned archaeological object.",
      discovery_date: item.discovery_date || new Date("2024-01-01"),
    }))
  );

  for (const assignment of museumAssignments) {
    const item = itemByName[assignment.name];
    if (!item) continue;
    item.allocation = "Museum";
    item.museumName = assignment.museumName;
    item.location = assignment.museumName;
    await item.save();
  }

  for (const item of createdExtraMuseumItems) {
    item.location = item.museumName;
    item.allocation = "Museum";
    await item.save();
  }

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

  // Report Approval & Artifact Allocation demo: an already-approved report
  // whose artifacts have been added to the catalogue - one sent to a museum,
  // one sent to auction - so Smart Artifact Search reflects both outcomes.
  const approvedArtifactItems = await Item.create([
    {
      name: "Carved Stone Deity Fragment",
      description: "Lower portion of a Gupta-era deity sculpture recovered near Bhasu Vihara.",
      Type: "Rock",
      civilization: "Gupta",
      era: "5th Century CE",
      region: "Bogra",
      material: "Sandstone",
      usage: "Religious",
      discovery_date: new Date("2024-05-15"),
      allocation: "Museum",
      museumName: "Varendra Research Museum",
      location: "Varendra Research Museum",
    },
    {
      name: "Fragmentary Inscribed Tablet",
      description: "Limestone tablet fragment with worn Brahmi-derived script, non-diagnostic.",
      Type: "Rock",
      civilization: "Gupta",
      era: "5th Century CE",
      region: "Bogra",
      material: "Limestone",
      usage: "Record",
      discovery_date: new Date("2024-05-15"),
      allocation: "Auction",
      museumName: "",
      location: "Scheduled for Auction",
    },
  ]);

  const additionalAuctionItems = await Item.create([
    {
      name: "Ancient Mirror Fragment",
      description: "Broken bronze mirror with a polished back and decorative edge pattern.",
      Type: "Metal_Object",
      civilization: "Gupta",
      era: "5th Century CE",
      region: "Bogra",
      material: "Bronze",
      usage: "Personal Item",
      discovery_date: new Date("2024-05-17"),
      allocation: "Auction",
      museumName: "",
      location: "Scheduled for Auction",
    },
    {
      name: "Banded Agate Bead",
      description: "Striated agate bead recovered in a trade context near the riverbank.",
      Type: "Jewelry",
      civilization: "Early Historic Bengal",
      era: "400 BCE",
      region: "Narsingdi",
      material: "Agate",
      usage: "Adornment",
      discovery_date: new Date("2024-05-22"),
      allocation: "Auction",
      museumName: "",
      location: "Scheduled for Auction",
    },
    {
      name: "Black and Red Ware Sherd",
      description: "Fine black-and-red pottery fragment from a storage jar or service vessel.",
      Type: "Pottery",
      civilization: "Pre-Mauryan",
      era: "5th Century BCE",
      region: "Bogra",
      material: "Ceramic",
      usage: "Household Vessel",
      discovery_date: new Date("2024-05-29"),
      allocation: "Auction",
      museumName: "",
      location: "Scheduled for Auction",
    },
    {
      name: "Bone Hairpin",
      description: "A slender bone hairpin from a burial or domestic assemblage.",
      Type: "Bone/Ivory",
      civilization: "Early Historic Bengal",
      era: "3rd Century BCE",
      region: "Narsingdi",
      material: "Bone",
      usage: "Adornment",
      discovery_date: new Date("2024-06-03"),
      allocation: "Auction",
      museumName: "",
      location: "Scheduled for Auction",
    },
    {
      name: "Bone Needle",
      description: "Long bone needle used in sewing or textile work.",
      Type: "Bone/Ivory",
      civilization: "Candra Dynasty",
      era: "10th Century",
      region: "Comilla",
      material: "Bone",
      usage: "Tool",
      discovery_date: new Date("2024-06-08"),
      allocation: "Auction",
      museumName: "",
      location: "Scheduled for Auction",
    },
  ]);

  await ResearcherReport.create({
    discoveryReport: dr1._id,
    researcher: alice._id,
    possibleArtifact: true,
    notes: "Detailed structural analysis of the stone shows it belongs to a heavily destroyed temple base. We recovered the piece to the lab.",
    budgetRequested: 25000,
    requestExcavationTeam: false,
    artifacts: [
      { name: "Carved Stone Deity Fragment", description: "Lower portion of a Gupta-era deity sculpture recovered near Bhasu Vihara.", Type: "Rock", civilization: "Gupta", era: "5th Century CE", region: "Bogra", material: "Sandstone", usage: "Religious" },
      { name: "Fragmentary Inscribed Tablet", description: "Limestone tablet fragment with worn Brahmi-derived script, non-diagnostic.", Type: "Rock", civilization: "Gupta", era: "5th Century CE", region: "Bogra", material: "Limestone", usage: "Record" },
    ],
    status: "Approved",
    adminReview: { reviewedBy: dina._id, reviewedAt: new Date("2024-05-20"), notes: "Approved after site cross-check." },
    allocatedItems: approvedArtifactItems.map((i) => i._id),
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
    { title: "Walking Through Mahasthan: Vlog", type: "vlog_audio", author: "Dr. Alice Rahman", content: "Video tour of the citadel walls.", url: "https://youtube.com", mediaType: "video", addedBy: alice._id },
    // --- Restored from the knowledge hub dataset (originally seeded before the merge) ---
    { title: "Discovering Pundravardhana: The Mahasthan Chronicles", type: "article", author: "Alice Rahman", content: "A detailed article exploring the history of Mahasthangarh, one of the earliest urban archaeological sites in Bangladesh, tracing its roots to the 3rd century BCE.", url: "https://example.com/articles/mahasthan-chronicles.html", addedBy: alice._id },
    { title: "The Epigraphic Records of Mainamati Sites", type: "historical_reference", author: "National Museum Archives", content: "A reference guide detailing the copperplate inscriptions and royal charters discovered across Mainamati temples, verifying land grants of the Chandra and Deva dynasties.", url: "https://example.com/references/mainamati-epigraphy.pdf", addedBy: dina._id },
    { title: "Walking Through Somapura: A Video Tour", type: "vlog_audio", author: "Dr. Alice Rahman", content: "A vlog showcasing the spatial layout of Paharpur Buddhist Vihara, with narration detailing the structural significance of the central temple tower.", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", mediaType: "video", addedBy: alice._id },
    { title: "Audio Diary: Day 42 at Mahasthangarh Dig Site", type: "vlog_audio", author: "Bob Karim", content: "An audio journal recording the exciting discovery of a new bronze sword and associated pottery shards near the eastern ramparts.", url: "https://example.com/audio/mahasthan-day42.mp3", mediaType: "video", addedBy: bob._id },
    { title: "Concentric Moats of Bhitagarh: A Survey", type: "research_paper", author: "Mizanur Rahman", content: "Field survey documenting the hydraulic defensive design of the Bhitagarh fort city.", url: "https://example.com/papers/bhitagarh.pdf", addedBy: mizan._id },
    { title: "Trade Beads of Ancient Bengal", type: "article", author: "Mizanur Rahman", content: "Overview of glass and semi-precious stone beads as evidence of long-distance trade.", url: "https://example.com/beads.html", addedBy: mizan._id },
    { title: "Lalbagh Fort Architectural Survey", type: "research_paper", author: "Bob Karim", content: "Comprehensive analysis of Mughal architectural features at Lalbagh Fort.", url: "https://example.com/papers/lalbagh.pdf", addedBy: bob._id },
    { title: "Kantajew Temple Terracotta Art", type: "historical_reference", author: "National Museum Archives", content: "Catalogue of mythological terracotta panels at Kantajew Temple.", addedBy: dina._id },
    { title: "Sixty Dome Mosque Virtual Tour", type: "vlog_audio", author: "Dr. Alice Rahman", content: "Audio tour covering the Bagerhat UNESCO site.", url: "https://example.com/audio/sixty-dome-tour.mp3", mediaType: "video", addedBy: alice._id },
  ]);

  console.log("Adding additional discovery reports...");
  const dr_lalbagh = await DiscoveryReport.create({
    reporter: publicUser._id,
    location: { lat: 23.718, lng: 90.388, address: "Old Dhaka Lalbagh Area" },
    material: "Old Mughal period coins found during drainage digging",
    contact_email: "javed@gmail.com",
    contact_phone: "+8801999999999",
    status: "Verified",
    assignment: { researcher: bob._id, budget: 10000, assigned_by: dina._id, assigned_at: new Date("2024-08-01") },
    verification: { result: "true", notes: "Identified as authentic rupees from Emperor Aurangzeb's reign.", submitted_at: new Date("2024-08-05") },
  });

  // Report Approval & Artifact Allocation demo: a final report already
  // submitted by the researcher and sitting Pending, waiting on the admin to
  // approve it (test the "Approve Final Report" button on this one).
  await ResearcherReport.create({
    discoveryReport: dr_lalbagh._id,
    researcher: bob._id,
    possibleArtifact: true,
    notes: "The coins belong to the provincial mint at Jahangirnagar. We need to secure the site to check for more hoards.",
    budgetRequested: 15000,
    requestExcavationTeam: true,
    artifacts: [
      { name: "Mughal Silver Rupee Hoard", description: "Cache of silver rupees from Emperor Aurangzeb's reign found together in a clay pot.", Type: "Metal_Object", civilization: "Mughal", era: "17th Century CE", region: "Dhaka", material: "Silver", usage: "Currency" },
      { name: "Provincial Mint Die Fragment", description: "Broken iron die used for striking coins at the Jahangirnagar mint.", Type: "Metal_Object", civilization: "Mughal", era: "17th Century CE", region: "Dhaka", material: "Iron", usage: "Minting Tool" },
    ],
    status: "Pending",
  });

  console.log("Creating sample auctions and bids...");
  
  // Rebuild itemByName to include all items created after the initial batch
  const allItems = await Item.find({});
  const itemByNameUpdated = Object.fromEntries(allItems.map((i) => [i.name, i]));
  
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // --- 1. Active, several bids already placed ---
  const auctionGoldEarring = await Auction.create({
    item: itemByNameUpdated["Gold Earring"]._id,
    created_by: dina._id,
    starting_bid: 5000,
    min_increment: 500,
    deadline: new Date(now + 3 * day),
    source_percentage: 10,
    source_name: "Alice Rahman (excavation lead)",
    current_bid: 7000,
    current_bidder: publicUser._id,
    bid_count: 3,
  });
  await Bid.create([
    { auction: auctionGoldEarring._id, bidder: bob._id, amount: 5000, placed_at: new Date(now - 2 * day) },
    { auction: auctionGoldEarring._id, bidder: shirin._id, amount: 6000, placed_at: new Date(now - 1 * day) },
    { auction: auctionGoldEarring._id, bidder: publicUser._id, amount: 7000, placed_at: new Date(now - 3 * 60 * 60 * 1000) },
  ]);

  // --- 2. Active, nobody has bid yet ---
  await Auction.create({
    item: itemByNameUpdated["Bronze Bell"]._id,
    created_by: dina._id,
    starting_bid: 3000,
    min_increment: 300,
    deadline: new Date(now + 5 * day),
    source_percentage: 15,
    source_name: "Somapura Excavation Team",
  });

  // --- 3. Active, deadline coming up soon (demoes the countdown/urgency UI) ---
  const auctionSilverDinars = await Auction.create({
    item: itemByNameUpdated["Silver Dinars"]._id,
    created_by: dina._id,
    starting_bid: 8000,
    min_increment: 1000,
    deadline: new Date(now + 30 * 60 * 1000),
    reserve_price: 9500,
    extend_trigger_minutes: 5,
    extend_by_minutes: 5,
    source_percentage: 8,
    source_name: "Mainamati Excavation Team",
    current_bid: 10000,
    current_bidder: tariq._id,
    bid_count: 3,
  });
  await Bid.create([
    { auction: auctionSilverDinars._id, bidder: mizan._id, amount: 8000, placed_at: new Date(now - 3 * 60 * 60 * 1000) },
    { auction: auctionSilverDinars._id, bidder: charlie._id, amount: 9000, placed_at: new Date(now - 90 * 60 * 1000) },
    { auction: auctionSilverDinars._id, bidder: tariq._id, amount: 10000, placed_at: new Date(now - 20 * 60 * 1000) },
  ]);

  // --- 4. Active - the artifact allocated straight to "Auction" during Report Approval ---
  const auctionInscribedTablet = await Auction.create({
    item: approvedArtifactItems[1]._id, // "Fragmentary Inscribed Tablet"
    created_by: dina._id,
    starting_bid: 4000,
    min_increment: 400,
    deadline: new Date(now + 7 * day),
    reserve_price: 4000,
    source_percentage: 20,
    source_name: "Javed Public (original reporter)",
    current_bid: 4400,
    current_bidder: nusrat._id,
    bid_count: 2,
  });
  await Bid.create([
    { auction: auctionInscribedTablet._id, bidder: fatima._id, amount: 4000, placed_at: new Date(now - 2 * day) },
    { auction: auctionInscribedTablet._id, bidder: nusrat._id, amount: 4400, placed_at: new Date(now - 1 * day) },
  ]);

  // --- 5. Closed-Sold ---
  const auctionIvoryComb = await Auction.create({
    item: itemByNameUpdated["Ivory Comb"]._id,
    created_by: dina._id,
    starting_bid: 2000,
    min_increment: 200,
    deadline: new Date(now - 2 * day),
    reserve_price: 2500,
    source_percentage: 12,
    source_name: "Bob Karim (field researcher)",
    current_bid: 3000,
    current_bidder: jamal._id,
    bid_count: 4,
    status: "Closed-Sold",
    winner: jamal._id,
    final_price: 3000,
    closed_at: new Date(now - 2 * day),
  });
  await Bid.create([
    { auction: auctionIvoryComb._id, bidder: shirin._id, amount: 2000, placed_at: new Date(now - 6 * day) },
    { auction: auctionIvoryComb._id, bidder: bob._id, amount: 2200, placed_at: new Date(now - 5 * day) },
    { auction: auctionIvoryComb._id, bidder: publicUser._id, amount: 2600, placed_at: new Date(now - 3 * day) },
    { auction: auctionIvoryComb._id, bidder: jamal._id, amount: 3000, placed_at: new Date(now - 2.1 * day) },
  ]);

  // --- 6. Closed-Unsold (bids came in, but never reached the hidden reserve) ---
  const auctionTaraStatue = await Auction.create({
    item: itemByNameUpdated["Bronze Tara Statue"]._id,
    created_by: dina._id,
    starting_bid: 15000,
    min_increment: 1000,
    deadline: new Date(now - 1 * day),
    reserve_price: 20000,
    source_percentage: 10,
    source_name: "Wari-Bateshwar Excavation Team",
    current_bid: 16000,
    current_bidder: charlie._id,
    bid_count: 2,
    status: "Closed-Unsold",
    closed_at: new Date(now - 1 * day),
  });
  await Bid.create([
    { auction: auctionTaraStatue._id, bidder: mizan._id, amount: 15000, placed_at: new Date(now - 4 * day) },
    { auction: auctionTaraStatue._id, bidder: charlie._id, amount: 16000, placed_at: new Date(now - 2 * day) },
  ]);

  // --- 7. Cancelled by admin ---
  const auctionStoneReliquary = await Auction.create({
    item: itemByNameUpdated["Stone Reliquary"]._id,
    created_by: dina._id,
    starting_bid: 6000,
    min_increment: 500,
    deadline: new Date(now + 4 * day),
    source_percentage: 10,
    source_name: "Somapura Excavation Team",
    current_bid: 6000,
    current_bidder: rahim._id,
    bid_count: 1,
    status: "Cancelled",
    cancel_reason: "Artifact flagged for further conservation study before it can be sold.",
    closed_at: new Date(now - 12 * 60 * 60 * 1000),
  });
  await Bid.create({ auction: auctionStoneReliquary._id, bidder: rahim._id, amount: 6000, placed_at: new Date(now - 1 * day) });

  // --- 8. Active auction with user bids (user winning position) ---
  const auctionMirrorFragment = await Auction.create({
    item: itemByNameUpdated["Ancient Mirror Fragment"]._id,
    created_by: elias._id,
    starting_bid: 3500,
    min_increment: 250,
    deadline: new Date(now + 1.5 * day), // ends in 1.5 days
    reserve_price: 4000,
    source_percentage: 8,
    source_name: "Gupta Era Research Project",
    current_bid: 4250,
    current_bidder: publicUser._id, // User in winning position
    bid_count: 5,
    status: "Active",
  });
  await Bid.create([
    { auction: auctionMirrorFragment._id, bidder: bob._id, amount: 3500, placed_at: new Date(now - 8 * 60 * 60 * 1000) },
    { auction: auctionMirrorFragment._id, bidder: mizan._id, amount: 3750, placed_at: new Date(now - 6 * 60 * 60 * 1000) },
    { auction: auctionMirrorFragment._id, bidder: rahim._id, amount: 4000, placed_at: new Date(now - 4 * 60 * 60 * 1000) },
    { auction: auctionMirrorFragment._id, bidder: publicUser._id, amount: 4250, placed_at: new Date(now - 2 * 60 * 60 * 1000) }, // Last bid by user
  ]);

  // --- 9. Closed auction where user won (secured) ---
  const auctionBeadNecklace = await Auction.create({
    item: itemByNameUpdated["Banded Agate Bead"]._id,
    created_by: elias._id,
    starting_bid: 2000,
    min_increment: 150,
    deadline: new Date(now - 6 * 60 * 60 * 1000), // closed 6 hours ago
    reserve_price: 2200,
    source_percentage: 7,
    source_name: "Narsingdi Excavation Team",
    current_bid: 2650,
    current_bidder: publicUser._id,
    bid_count: 4,
    status: "Closed-Sold",
    winner: publicUser._id,
    final_price: 2650,
    closed_at: new Date(now - 6 * 60 * 60 * 1000),
  });
  await Bid.create([
    { auction: auctionBeadNecklace._id, bidder: charlie._id, amount: 2000, placed_at: new Date(now - 24 * 60 * 60 * 1000) },
    { auction: auctionBeadNecklace._id, bidder: mizan._id, amount: 2150, placed_at: new Date(now - 18 * 60 * 60 * 1000) },
    { auction: auctionBeadNecklace._id, bidder: shirin._id, amount: 2450, placed_at: new Date(now - 12 * 60 * 60 * 1000) },
    { auction: auctionBeadNecklace._id, bidder: publicUser._id, amount: 2650, placed_at: new Date(now - 8 * 60 * 60 * 1000) }, // Won by user
  ]);


  // =========================================================================
  // Ahad_23201016 - Tender Publication & Bidding demo data
  //
  // Four scenarios are seeded so every screen has something to show:
  //   1. An approved field report requesting a team, with NO tender yet
  //      -> appears in the admin's "Create Tender" source dropdown.
  //   2. An Open tender with three competing bids
  //      -> the admin can evaluate and award; E001-E003 can edit/withdraw.
  //   3. An Awarded tender with a live project + unallocated artifacts
  //      -> shows in Manage Projects (archaeologist) and My Projects (team).
  //   4. A completed project handed over to the Government
  //      -> shows in admin "Excavation Projects" awaiting artifact allocation.
  // =========================================================================
  console.log("Creating excavation tenders, bids, and projects...");

  const tDay = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();

  // ---- Scenario 1: approved field report, awaiting a tender ---------------
  const drNarsingdi = await DiscoveryReport.create({
    reporter: shirin._id,
    location: { lat: 24.0898, lng: 90.8143, address: "Bateshwar Village, Belabo, Narsingdi" },
    material: "Buried brick wall exposed after canal digging",
    contact_email: "shirin@gmail.com",
    contact_phone: "+8801744556677",
    status: "Verified",
    assignment: { researcher: charlie._id, budget: 12000, assigned_by: dina._id, assigned_at: new Date(nowMs - 30 * tDay) },
    verification: { result: "true", notes: "Genuine early historic brickwork continuing below the cut.", submitted_at: new Date(nowMs - 25 * tDay) },
  });

  await ResearcherReport.create({
    discoveryReport: drNarsingdi._id,
    researcher: charlie._id,
    possibleArtifact: true,
    notes: "The wall runs at least 12m and matches the Wari-Bateshwar fortification alignment. A full excavation crew is needed before the monsoon.",
    budgetRequested: 320000,
    requestExcavationTeam: true,
    status: "Approved",
    adminReview: { reviewedBy: dina._id, reviewedAt: new Date(nowMs - 20 * tDay), notes: "Approved. Proceed to tender." },
  });

  // ---- Scenario 2: an Open tender with three competing bids ---------------
  const drBogra = await DiscoveryReport.create({
    reporter: publicUser._id,
    location: { lat: 24.9646, lng: 89.3379, address: "Mahasthan Garh Road, Shibganj, Bogra" },
    material: "Stone slab with carved motifs found while digging a well",
    contact_email: "javed@gmail.com",
    contact_phone: "+8801999999999",
    status: "Verified",
    assignment: { researcher: alice._id, budget: 18000, assigned_by: dina._id, assigned_at: new Date(nowMs - 40 * tDay) },
    verification: { result: "true", notes: "Confirmed Pala-period carved slab, in situ.", submitted_at: new Date(nowMs - 35 * tDay) },
  });

  const frBogra = await ResearcherReport.create({
    discoveryReport: drBogra._id,
    researcher: alice._id,
    possibleArtifact: true,
    notes: "Carved slab appears to cap a larger structure. Ground survey suggests a buried chamber roughly 3m below the present surface.",
    budgetRequested: 450000,
    requestExcavationTeam: true,
    status: "Approved",
    adminReview: { reviewedBy: dina._id, reviewedAt: new Date(nowMs - 30 * tDay), notes: "Approved for tender." },
  });

  const openTender = await Tender.create({
    title: "Mahasthangarh Carved Slab Chamber Excavation",
    discoveryReport: drBogra._id,
    fieldReport: frBogra._id,
    archaeologist: alice._id,
    project_details:
      "Controlled excavation of a suspected buried chamber beneath a verified Pala-period carved slab at Mahasthan Garh Road, Shibganj, Bogra. Expected depth 3-4m across a 10m x 10m grid, with full stratigraphic recording.",
    requirements:
      "Minimum 15 trained crew. Experience with masonry-bearing strata required. Must supply shoring, dewatering pumps, and on-site conservation storage. Daily photographic logs shared with the lead archaeologist.",
    location: { lat: 24.9646, lng: 89.3379, address: "Mahasthan Garh Road, Shibganj, Bogra" },
    deadline: new Date(nowMs + 6 * tDay),
    estimated_budget: 450000,
    created_by: dina._id,
    status: "Open",
  });

  await TenderBid.create([
    {
      tender: openTender._id,
      team: rahim._id,
      company_name: "Bengal Excavation Works Ltd.",
      cost: 428000,
      timeline_days: 75,
      proposal:
        "24-person crew with two certified conservators on rotation. We will shore the trench in week one, then work in 20cm spits with daily context sheets. Dewatering pumps and a lockable finds container are included in the quoted price.",
      status: "Pending",
      submitted_at: new Date(nowMs - 4 * tDay),
    },
    {
      tender: openTender._id,
      team: sultana._id,
      company_name: "Heritage Digs & Conservation",
      cost: 465000,
      timeline_days: 60,
      proposal:
        "Faster schedule using a 16-person crew on extended shifts. Quote includes 3D photogrammetric recording of every context and a post-excavation archive report delivered within 30 days of completion.",
      status: "Pending",
      submitted_at: new Date(nowMs - 3 * tDay),
    },
    {
      tender: openTender._id,
      team: jamal._id,
      company_name: "Padma Groundworks",
      cost: 399000,
      timeline_days: 95,
      proposal:
        "Lowest quoted cost using our own plant and a 31-person crew. Longer timeline reflects a cautious hand-excavation approach around the masonry. We have completed four comparable Government contracts in Bogra district.",
      status: "Pending",
      submitted_at: new Date(nowMs - 2 * tDay),
    },
  ]);

  // ---- Scenario 3: an Awarded tender with a live project ------------------
  const drComilla = await DiscoveryReport.create({
    reporter: publicUser._id,
    location: { lat: 23.4472, lng: 91.135, address: "Cantonment Road, Comilla Sadar, Comilla" },
    material: "Terracotta fragments turned up by ploughing",
    contact_email: "javed@gmail.com",
    contact_phone: "+8801999999999",
    status: "Verified",
    assignment: { researcher: bob._id, budget: 14000, assigned_by: dina._id, assigned_at: new Date(nowMs - 90 * tDay) },
    verification: { result: "true", notes: "Dense scatter of Candra-period terracotta. Warrants excavation.", submitted_at: new Date(nowMs - 85 * tDay) },
  });

  const frComilla = await ResearcherReport.create({
    discoveryReport: drComilla._id,
    researcher: bob._id,
    possibleArtifact: true,
    notes: "Plough-damaged occupation layer with a very high find density. Needs a full crew to excavate before further agricultural damage.",
    budgetRequested: 280000,
    requestExcavationTeam: true,
    status: "Approved",
    adminReview: { reviewedBy: elias._id, reviewedAt: new Date(nowMs - 80 * tDay), notes: "Approved, urgent." },
  });

  const activeSite = await Site.create({
    name: "Cantonment Road Excavation Site, Comilla",
    era: "10th Century CE",
    s_thana: "Comilla Sadar",
    s_district: "Comilla",
    description: "Candra-period occupation layer under excavation following a public discovery report.",
    architecture: "Under excavation",
    latitude: 23.4472,
    longitude: 91.135,
  });

  const awardedTender = await Tender.create({
    title: "Comilla Terracotta Scatter Rescue Excavation",
    discoveryReport: drComilla._id,
    fieldReport: frComilla._id,
    archaeologist: bob._id,
    project_details:
      "Rescue excavation of a plough-damaged Candra-period occupation layer on Cantonment Road, Comilla Sadar. Priority is recovering the terracotta assemblage before the next ploughing season.",
    requirements: "Minimum 12 crew. Rapid recovery methodology with on-site finds processing and secure overnight storage.",
    location: { lat: 23.4472, lng: 91.135, address: "Cantonment Road, Comilla Sadar, Comilla" },
    deadline: new Date(nowMs - 70 * tDay),
    estimated_budget: 280000,
    created_by: elias._id,
    status: "Awarded",
    awarded_at: new Date(nowMs - 68 * tDay),
  });

  const winningBidComilla = await TenderBid.create({
    tender: awardedTender._id,
    team: rahim._id,
    company_name: "Bengal Excavation Works Ltd.",
    cost: 265000,
    timeline_days: 55,
    proposal:
      "Rapid-response crew of 24 mobilised within five days. On-site finds processing tent and a sealed storage container included. Two conservators assigned full time for the terracotta.",
    status: "Accepted",
    reviewed_by: elias._id,
    reviewed_at: new Date(nowMs - 68 * tDay),
    review_notes: "Strongest mobilisation timeline and prior rescue excavation experience.",
    submitted_at: new Date(nowMs - 72 * tDay),
  });

  await TenderBid.create({
    tender: awardedTender._id,
    team: jamal._id,
    company_name: "Padma Groundworks",
    cost: 258000,
    timeline_days: 80,
    proposal: "Slightly lower cost but a longer schedule, using a 31-person crew working in two shifts.",
    status: "Rejected",
    reviewed_by: elias._id,
    reviewed_at: new Date(nowMs - 68 * tDay),
    review_notes: "Another team was awarded this tender.",
    submitted_at: new Date(nowMs - 71 * tDay),
  });

  const activeProject = await ExcavationProject.create({
    p_name: "Comilla Terracotta Scatter Rescue Excavation",
    organization: "Bengal Excavation Works Ltd.",
    start_date: new Date(nowMs - 68 * tDay),
    end_date: null,
    progress: "In Progress",
    lead_archaeologist: bob._id,
    site: activeSite._id,
    budget: 265000,
    excavation_team: rahim._id,
    tender: awardedTender._id,
    discoveryReport: drComilla._id,
    location: { lat: 23.4472, lng: 91.135, address: "Cantonment Road, Comilla Sadar, Comilla" },
    agreed_timeline_days: 55,
  });

  // Finds logged on the active dig - held back from Smart Artifact Search
  // until the Government allocates them after the project is handed over.
  const activeFinds = await Item.create([
    {
      site: activeSite._id,
      name: "Terracotta Votive Plaque",
      description: "Near-complete moulded plaque showing a seated figure, recovered from context 104.",
      Type: "Pottery",
      civilization: "Candra Dynasty",
      era: "10th Century CE",
      region: "Comilla",
      material: "Terracotta",
      usage: "Votive",
      discovery_date: new Date(nowMs - 40 * tDay),
      location: "Pending Allocation",
      allocation: "Unallocated",
      pending_allocation: true,
      excavationProject: activeProject._id,
    },
    {
      site: activeSite._id,
      name: "Glazed Storage Jar Rim",
      description: "Thick rim sherd from a large storage vessel with a partial green glaze.",
      Type: "Pottery",
      civilization: "Candra Dynasty",
      era: "10th Century CE",
      region: "Comilla",
      material: "Ceramic",
      usage: "Household Vessel",
      discovery_date: new Date(nowMs - 22 * tDay),
      location: "Pending Allocation",
      allocation: "Unallocated",
      pending_allocation: true,
      excavationProject: activeProject._id,
    },
  ]);

  activeProject.artifacts = activeFinds.map((i) => i._id);
  await activeProject.save();

  awardedTender.awarded_bid = winningBidComilla._id;
  awardedTender.awarded_team = rahim._id;
  awardedTender.project = activeProject._id;
  await awardedTender.save();

  // ---- Scenario 4: a completed dig awaiting artifact allocation -----------
  const drNaogaon = await DiscoveryReport.create({
    reporter: shirin._id,
    location: { lat: 25.0311, lng: 88.9767, address: "Paharpur Road, Badalgachhi, Naogaon" },
    material: "Bronze objects found while clearing a drainage channel",
    contact_email: "shirin@gmail.com",
    contact_phone: "+8801744556677",
    status: "Verified",
    assignment: { researcher: alice._id, budget: 16000, assigned_by: dina._id, assigned_at: new Date(nowMs - 200 * tDay) },
    verification: { result: "true", notes: "Pala-period bronze assemblage, undisturbed context.", submitted_at: new Date(nowMs - 195 * tDay) },
  });

  const frNaogaon = await ResearcherReport.create({
    discoveryReport: drNaogaon._id,
    researcher: alice._id,
    possibleArtifact: true,
    notes: "A small but rich bronze deposit next to the Somapura precinct wall. Full excavation recommended.",
    budgetRequested: 210000,
    requestExcavationTeam: true,
    status: "Approved",
    adminReview: { reviewedBy: dina._id, reviewedAt: new Date(nowMs - 190 * tDay), notes: "Approved for tender." },
  });

  const completedSite = await Site.create({
    name: "Paharpur Road Excavation Site, Naogaon",
    era: "9th Century CE",
    s_thana: "Badalgachhi",
    s_district: "Naogaon",
    description: "Completed excavation of a Pala-period bronze deposit beside the Somapura precinct wall.",
    architecture: "Excavated and backfilled",
    latitude: 25.0311,
    longitude: 88.9767,
  });

  const completedTender = await Tender.create({
    title: "Somapura Precinct Bronze Deposit Excavation",
    discoveryReport: drNaogaon._id,
    fieldReport: frNaogaon._id,
    archaeologist: alice._id,
    project_details:
      "Excavation of a Pala-period bronze deposit beside the Somapura Mahavihara precinct wall at Paharpur Road, Badalgachhi, Naogaon.",
    requirements: "Metal-detecting survey before excavation, plus conservation-grade lifting and packing of all metalwork.",
    location: { lat: 25.0311, lng: 88.9767, address: "Paharpur Road, Badalgachhi, Naogaon" },
    deadline: new Date(nowMs - 180 * tDay),
    estimated_budget: 210000,
    created_by: dina._id,
    status: "Awarded",
    awarded_at: new Date(nowMs - 178 * tDay),
  });

  const winningBidNaogaon = await TenderBid.create({
    tender: completedTender._id,
    team: sultana._id,
    company_name: "Heritage Digs & Conservation",
    cost: 198000,
    timeline_days: 45,
    proposal:
      "In-house conservation lab handles all lifted metalwork. Quote covers a full metal-detecting survey, block-lifting where needed, and a conservation report per object.",
    status: "Accepted",
    reviewed_by: dina._id,
    reviewed_at: new Date(nowMs - 178 * tDay),
    review_notes: "Best conservation capability for a metal assemblage.",
    submitted_at: new Date(nowMs - 182 * tDay),
  });

  const completedProject = await ExcavationProject.create({
    p_name: "Somapura Precinct Bronze Deposit Excavation",
    organization: "Heritage Digs & Conservation",
    start_date: new Date(nowMs - 178 * tDay),
    end_date: new Date(nowMs - 6 * tDay),
    progress: "Almost Done",
    lead_archaeologist: alice._id,
    site: completedSite._id,
    budget: 198000,
    excavation_team: sultana._id,
    tender: completedTender._id,
    discoveryReport: drNaogaon._id,
    location: { lat: 25.0311, lng: 88.9767, address: "Paharpur Road, Badalgachhi, Naogaon" },
    agreed_timeline_days: 45,
    submitted_to_admin: true,
    completed_at: new Date(nowMs - 6 * tDay),
    completion_notes:
      "Excavation complete and the trench backfilled. Three objects recovered, conserved, and ready for Government allocation.",
    allocation_done: false,
  });

  const completedFinds = await Item.create([
    {
      site: completedSite._id,
      name: "Pala Bronze Avalokitesvara",
      description: "Standing bronze figure of Avalokitesvara with traces of gilding, recovered intact.",
      Type: "Metal_Object",
      civilization: "Pala",
      era: "9th Century CE",
      region: "Naogaon",
      material: "Bronze",
      usage: "Religious Icon",
      discovery_date: new Date(nowMs - 120 * tDay),
      location: "Pending Allocation",
      allocation: "Unallocated",
      pending_allocation: true,
      excavationProject: completedProject._id,
    },
    {
      site: completedSite._id,
      name: "Bronze Ritual Ladle",
      description: "Long-handled ritual ladle with an incised lotus motif on the bowl.",
      Type: "Metal_Object",
      civilization: "Pala",
      era: "9th Century CE",
      region: "Naogaon",
      material: "Bronze",
      usage: "Ritual",
      discovery_date: new Date(nowMs - 100 * tDay),
      location: "Pending Allocation",
      allocation: "Unallocated",
      pending_allocation: true,
      excavationProject: completedProject._id,
    },
    {
      site: completedSite._id,
      name: "Copper Alloy Votive Stupa",
      description: "Miniature votive stupa, slightly crushed on one side but structurally sound.",
      Type: "Metal_Object",
      civilization: "Pala",
      era: "9th Century CE",
      region: "Naogaon",
      material: "Copper Alloy",
      usage: "Votive",
      discovery_date: new Date(nowMs - 90 * tDay),
      location: "Pending Allocation",
      allocation: "Unallocated",
      pending_allocation: true,
      excavationProject: completedProject._id,
    },
  ]);

  completedProject.artifacts = completedFinds.map((i) => i._id);
  await completedProject.save();

  completedTender.awarded_bid = winningBidNaogaon._id;
  completedTender.awarded_team = sultana._id;
  completedTender.project = completedProject._id;
  await completedTender.save();

  // A tender the Government pulled before awarding it
  await Tender.create({
    title: "Wari-Bateshwar Southern Mound Survey Trench",
    project_details: "Evaluation trenching across the southern mound at Wari-Bateshwar, Belabo, Narsingdi.",
    requirements: "Small crew, evaluation trenching only, no deep excavation.",
    location: { lat: 24.0898, lng: 90.8143, address: "Bateshwar Village, Belabo, Narsingdi" },
    deadline: new Date(nowMs + 12 * tDay),
    estimated_budget: 90000,
    created_by: dina._id,
    status: "Cancelled",
    cancel_reason: "Land access dispute with the current occupier is unresolved.",
  });

  console.log("Creating sample wishlist entries...");
  await Wishlist.create([
    { user: shirin._id, item: itemByNameUpdated["Gold Amulet"]._id }, // not currently up for auction
    { user: publicUser._id, item: itemByNameUpdated["Bronze Bell"]._id }, // is currently up for auction
    { user: publicUser._id, item: itemByNameUpdated["Ancient Mirror Fragment"]._id }, // active auction user is winning
    { user: rahim._id, item: itemByNameUpdated["Gold Earring"]._id },
  ]);

  console.log("\nDone! Database seeded.");
  console.log("");
  console.log("Every account uses the password: " + DEFAULT_PASSWORD);
  console.log("  Admin / Government   -> AD001 (Dina Admin), AD002 (Elias Director)");
  console.log("  Archaeologist        -> A001 (Alice), A002 (Bob), A003 (Charlie)");
  console.log("  Museum Manager       -> MM001, MM002, MM003");
  console.log("  General Public       -> PUB001, PUB002");
  console.log("");
  console.log("Ahad_23201016 - Excavation Team logins (company accounts):");
  console.log("  E001 -> Bengal Excavation Works Ltd.  (rep: Rahim Khan)");
  console.log("  E002 -> Heritage Digs & Conservation  (rep: Sultana Ahmed)");
  console.log("  E003 -> Padma Groundworks             (rep: Jamal Uddin)");
  console.log("");
  console.log("Tender demo data: 1 open tender with 3 bids, 1 active project (E001),");
  console.log("1 completed project awaiting allocation (E002), 1 cancelled tender,");
  console.log("and 1 approved field report still waiting for a tender to be published.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
