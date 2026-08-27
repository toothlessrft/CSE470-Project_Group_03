// Real photographs for the seeded catalogue artifacts.
//
// Every image is a freely licensed photograph from Wikimedia Commons (public
// domain, CC0, CC BY or CC BY-SA), chosen to match the object class - a real
// Northern Black Polished Ware sherd for the NBPW sherd, a Nalanda bronze
// Buddha for the bronze Buddha, and so on.
//
// These are representative museum photographs of the same kind of object, not
// photographs of the specific (fictional) seeded find. `credit` and `source`
// record where each one came from so the attribution stays with the data.
//
// Artifacts with no genuinely matching photograph are deliberately absent
// rather than given a misleading picture; they simply render without an image.
const ARTIFACT_IMAGES = {
  "Terracotta Plaque": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Terracotta_Plaques_%2827433726423%29.jpg/960px-Terracotta_Plaques_%2827433726423%29.jpg",
    credit: "Terracotta Plaques (27433726423).jpg - CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Terracotta_Plaques_(27433726423).jpg",
  },
  "Punch-marked Silver Coin": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Punch-Marked_Coin_LACMA_M.75.89.2_%282_of_2%29.jpg/960px-Punch-Marked_Coin_LACMA_M.75.89.2_%282_of_2%29.jpg",
    credit: "Punch-Marked Coin LACMA M.75.89.2 (2 of 2).jpg - Public domain",
    source: "https://commons.wikimedia.org/wiki/File:Punch-Marked_Coin_LACMA_M.75.89.2_(2_of_2).jpg",
  },
  "NBPW Sherd": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Fragment_-_Northern_Black_Polished_Ware_-_500-100_BCE_-_Sonkh_-_Showcase_6-15_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6458.JPG/960px-thumbnail.jpg",
    credit: "Fragment - Northern Black Polished Ware - 500-100 BCE - Sonkh - Showcase 6-15 - Prehistory and Terracotta Gallery - Government Museum - Mathura 2013-02-24 6458.JPG - CC BY 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Fragment_-_Northern_Black_Polished_Ware_-_500-100_BCE_-_Sonkh_-_Showcase_6-15_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6458.JPG",
  },
  "Bronze Buddha": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Indian_Museum_Sculpture_-_Buddha_calling_Earth%2C_Bronze%2C_Nalanda_%289217887083%29.jpg/960px-Indian_Museum_Sculpture_-_Buddha_calling_Earth%2C_Bronze%2C_Nalanda_%289217887083%29.jpg",
    credit: "Indian Museum Sculpture - Buddha calling Earth, Bronze, Nalanda (9217887083).jpg - CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Indian_Museum_Sculpture_-_Buddha_calling_Earth,_Bronze,_Nalanda_(9217887083).jpg",
  },
  "Copper Plate Grant": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/11th_century_Shilahara_Copper_plate_Devanagari_script_inscription_in_Sanskrit%2C_Maharashtra.jpg/960px-11th_century_Shilahara_Copper_plate_Devanagari_script_inscription_in_Sanskrit%2C_Maharashtra.jpg",
    credit: "11th century Shilahara Copper plate Devanagari script inscription in Sanskrit, Maharashtra.jpg - Public domain",
    source: "https://commons.wikimedia.org/wiki/File:11th_century_Shilahara_Copper_plate_Devanagari_script_inscription_in_Sanskrit,_Maharashtra.jpg",
  },
  "Spouted Vessel": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Terracotta_Bichrome_Spouted_Jug%2C_Cyprus%2C_650-600_BCE%2C_HAA.JPG/960px-Terracotta_Bichrome_Spouted_Jug%2C_Cyprus%2C_650-600_BCE%2C_HAA.JPG",
    credit: "Terracotta Bichrome Spouted Jug, Cyprus, 650-600 BCE, HAA.JPG - CC0",
    source: "https://commons.wikimedia.org/wiki/File:Terracotta_Bichrome_Spouted_Jug,_Cyprus,_650-600_BCE,_HAA.JPG",
  },
  "Semi-precious Stone Beads": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/7/70/Carnelian_Beads%2C_Yale_University_Art_Gallery%2C_inv._1938.4392_-_YDEA_-_64424.jpg",
    credit: "Carnelian Beads, Yale University Art Gallery, inv. 1938.4392 - YDEA - 64424.jpg - CC0",
    source: "https://commons.wikimedia.org/wiki/File:Carnelian_Beads,_Yale_University_Art_Gallery,_inv._1938.4392_-_YDEA_-_64424.jpg",
  },
  "Iron Axe Head": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Early_Iron_Age_socketed_axe_head_of_Sompting_Type_%28FindID_559893%29.jpg/960px-Early_Iron_Age_socketed_axe_head_of_Sompting_Type_%28FindID_559893%29.jpg",
    credit: "Early Iron Age socketed axe head of Sompting Type (FindID 559893).jpg - CC BY-SA 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Early_Iron_Age_socketed_axe_head_of_Sompting_Type_(FindID_559893).jpg",
  },
  "Rouletted Ware Sherd": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Base_of_Rouletted_Ware%2C_Terracotta.jpg",
    credit: "Base of Rouletted Ware, Terracotta.jpg - CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Base_of_Rouletted_Ware,_Terracotta.jpg",
  },
  "Gold Earring": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Gold_earring_with_pendant_MET_sf74513773.jpg/960px-Gold_earring_with_pendant_MET_sf74513773.jpg",
    credit: "Gold earring with pendant MET sf74513773.jpg - CC0",
    source: "https://commons.wikimedia.org/wiki/File:Gold_earring_with_pendant_MET_sf74513773.jpg",
  },
  "Vishnu Sculpture Fragment": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Vishnu_-_Nalanda_Museum_%285%29.jpg/960px-Vishnu_-_Nalanda_Museum_%285%29.jpg",
    credit: "Vishnu - Nalanda Museum (5).jpg - CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Vishnu_-_Nalanda_Museum_(5).jpg",
  },
  "Skeletal Remains - Child": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Burial_6_Nyaung%27gan.jpg/960px-Burial_6_Nyaung%27gan.jpg",
    credit: "Burial 6 Nyaung'gan.jpg - CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Burial_6_Nyaung%27gan.jpg",
  },
  "Bronze Bell": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Korea%2C_Goryeo_period_-_Buddhist_Ritual_Bell_-_1998.123_-_Cleveland_Museum_of_Art.tif/lossy-page1-960px-Korea%2C_Goryeo_period_-_Buddhist_Ritual_Bell_-_1998.123_-_Cleveland_Museum_of_Art.tif.jpg",
    credit: "Korea, Goryeo period - Buddhist Ritual Bell - 1998.123 - Cleveland Museum of Art.tif - CC0",
    source: "https://commons.wikimedia.org/wiki/File:Korea,_Goryeo_period_-_Buddhist_Ritual_Bell_-_1998.123_-_Cleveland_Museum_of_Art.tif",
  },
  "Glass Beads": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Glass_beads_%28FindID_440339%29.jpg/960px-Glass_beads_%28FindID_440339%29.jpg",
    credit: "Glass beads (FindID 440339).jpg - CC BY-SA 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Glass_beads_(FindID_440339).jpg",
  },
  "Brahmi Inscription Fragment": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Asokan_brahmi_pillar_edict.jpg/960px-Asokan_brahmi_pillar_edict.jpg",
    credit: "Asokan brahmi pillar edict.jpg - CC SA 1.0",
    source: "https://commons.wikimedia.org/wiki/File:Asokan_brahmi_pillar_edict.jpg",
  },
  "Fortification Brick Stamp": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/0/03/Tile_stamp_fragment_found_in_Nijmegen_Netherlands_from_the_Roman_period.jpg",
    credit: "Tile stamp fragment found in Nijmegen Netherlands from the Roman period.jpg - CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Tile_stamp_fragment_found_in_Nijmegen_Netherlands_from_the_Roman_period.jpg",
  },
  "Copper Alloy Ring": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Finger_ring_%28bezel%29_%28FindID_608659%29.jpg/960px-Finger_ring_%28bezel%29_%28FindID_608659%29.jpg",
    credit: "Finger ring (bezel) (FindID 608659).jpg - CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Finger_ring_(bezel)_(FindID_608659).jpg",
  },
  "Grey Ware Bowl": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Painted_Grey_Ware_-_Sonkh_-_1000-600_BCE_-_Showcase_6-15_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6461.JPG/960px-Painted_Grey_Ware_-_Sonkh_-_1000-600_BCE_-_Showcase_6-15_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6461.JPG",
    credit: "Painted Grey Ware - Sonkh - 1000-600 BCE - Showcase 6-15 - Prehistory and Terracotta Gallery - Government Museum - Mathura 2013-02-24 6461.JPG - CC BY 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Painted_Grey_Ware_-_Sonkh_-_1000-600_BCE_-_Showcase_6-15_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6461.JPG",
  },
  "Bronze Vajra": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/%E4%B8%89%E9%88%B7%E6%9D%B5-Three-Pronged_Vajra_Ritual_Implement_%28Sankosho%29_MET_DT5689.jpg/960px-%E4%B8%89%E9%88%B7%E6%9D%B5-Three-Pronged_Vajra_Ritual_Implement_%28Sankosho%29_MET_DT5689.jpg",
    credit: "三鈷杵-Three-Pronged Vajra Ritual Implement (Sankosho) MET DT5689.jpg - CC0",
    source: "https://commons.wikimedia.org/wiki/File:%E4%B8%89%E9%88%B7%E6%9D%B5-Three-Pronged_Vajra_Ritual_Implement_(Sankosho)_MET_DT5689.jpg",
  },
  "Silver Dinars": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Silver_dirham_of_Abbasids_minted_in_Muhammadiyya.jpg",
    credit: "Silver dirham of Abbasids minted in Muhammadiyya.jpg - CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Silver_dirham_of_Abbasids_minted_in_Muhammadiyya.jpg",
  },
  "Northern Black Polished Ware Bowl": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Fragment_-_Northern_Black_Polished_Ware_-_500-100_BCE_-_Sonkh_-_Showcase_6-15_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6458.JPG/960px-thumbnail.jpg",
    credit: "Fragment - Northern Black Polished Ware - 500-100 BCE - Sonkh - Showcase 6-15 - Prehistory and Terracotta Gallery - Government Museum - Mathura 2013-02-24 6458.JPG - CC BY 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Fragment_-_Northern_Black_Polished_Ware_-_500-100_BCE_-_Sonkh_-_Showcase_6-15_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6458.JPG",
  },
  "Terracotta Plaque - Monkey": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Terracotta_Plaques_%2827433726423%29.jpg/960px-Terracotta_Plaques_%2827433726423%29.jpg",
    credit: "Terracotta Plaques (27433726423).jpg - CC BY 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Terracotta_Plaques_(27433726423).jpg",
  },
  "Stone Reliquary": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Pakistan%2C_Gandhara%2C_probably_Sirkap%2C_early_Kushan_Period_-_Miniature_Stone_Reliquary_or_Toilette_Casket_-_1977.64_-_Cleveland_Museum_of_Art.tif/lossy-page1-960px-Pakistan%2C_Gandhara%2C_probably_Sirkap%2C_early_Kushan_Period_-_Miniature_Stone_Reliquary_or_Toilette_Casket_-_1977.64_-_Cleveland_Museum_of_Art.tif.jpg",
    credit: "Pakistan, Gandhara, probably Sirkap, early Kushan Period - Miniature Stone Reliquary or Toilette Casket - 1977.64 - Cleveland Museum of Art.tif - CC0",
    source: "https://commons.wikimedia.org/wiki/File:Pakistan,_Gandhara,_probably_Sirkap,_early_Kushan_Period_-_Miniature_Stone_Reliquary_or_Toilette_Casket_-_1977.64_-_Cleveland_Museum_of_Art.tif",
  },
  "Sunga Terracotta Female Figurine": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Fragment_of_a_terracotta_female_figurine%2C_Shunga_Period%2C_Sugh%2C_Jagadhri%2C_Haryana%2C_Government_Museum_and_Art_Gallery%2C_Chandigarh.jpg/960px-Fragment_of_a_terracotta_female_figurine%2C_Shunga_Period%2C_Sugh%2C_Jagadhri%2C_Haryana%2C_Government_Museum_and_Art_Gallery%2C_Chandigarh.jpg",
    credit: "Fragment of a terracotta female figurine, Shunga Period, Sugh, Jagadhri, Haryana, Government Museum and Art Gallery, Chandigarh.jpg - CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Fragment_of_a_terracotta_female_figurine,_Shunga_Period,_Sugh,_Jagadhri,_Haryana,_Government_Museum_and_Art_Gallery,_Chandigarh.jpg",
  },
  "Iron Slag and Crucible Fragments": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Iron_Age_to_Medieval%2C_Iron_bloomery_slag_%28FindID_284407%29.jpg/960px-Iron_Age_to_Medieval%2C_Iron_bloomery_slag_%28FindID_284407%29.jpg",
    credit: "Iron Age to Medieval, Iron bloomery slag (FindID 284407).jpg - CC BY-SA 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Iron_Age_to_Medieval,_Iron_bloomery_slag_(FindID_284407).jpg",
  },
  "Gold Amulet": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Gold_Cylinder_Amulet%2C_Late_Middle_Kingdom%2C_Egypt%2C_housed_at_Petrie_Museum%2C_London.jpg",
    credit: "Gold Cylinder Amulet, Late Middle Kingdom, Egypt, housed at Petrie Museum, London.jpg - CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Gold_Cylinder_Amulet,_Late_Middle_Kingdom,_Egypt,_housed_at_Petrie_Museum,_London.jpg",
  },
  "Banded Agate Bead": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Beads_MET_sp74513303.jpg/960px-Beads_MET_sp74513303.jpg",
    credit: "Beads MET sp74513303.jpg - CC0",
    source: "https://commons.wikimedia.org/wiki/File:Beads_MET_sp74513303.jpg",
  },
  "Bronze Tara Statue": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Standing_Tara%2C_Bronze_Statue_from_9th_Century_CE%2C_Nalanda%2C_Bihar.jpg/960px-Standing_Tara%2C_Bronze_Statue_from_9th_Century_CE%2C_Nalanda%2C_Bihar.jpg",
    credit: "Standing Tara, Bronze Statue from 9th Century CE, Nalanda, Bihar.jpg - CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Standing_Tara,_Bronze_Statue_from_9th_Century_CE,_Nalanda,_Bihar.jpg",
  },
  "Candra Dynasty Copper Plate": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Copper_plate_inscription_of_Mahendra_Pala-_State_Archaeological_Museum_in_West_Bengal-_1%2C_Satyen_Roy_Rd%2C_Auddy_Bagan_Basti%2C_Behala%2C_Kolkata%2C_West_Bengal_700034-_First_Floor-_Nandadirghi_Vihara%2C_Jagjivanpur_Gallery.jpg/960px-thumbnail.jpg",
    credit: "Copper plate inscription of Mahendra Pala- State Archaeological Museum in West Bengal- 1, Satyen Roy Rd, Auddy Bagan Basti, Behala, Kolkata, West Bengal 700034- First Floor- Nandadirghi Vihara, Jagjivanpur Gallery.jpg - CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Copper_plate_inscription_of_Mahendra_Pala-_State_Archaeological_Museum_in_West_Bengal-_1,_Satyen_Roy_Rd,_Auddy_Bagan_Basti,_Behala,_Kolkata,_West_Bengal_700034-_First_Floor-_Nandadirghi_Vihara,_Jagjivanpur_Gallery.jpg",
  },
  "Stucco Head Fragment": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Stucco_Head_from_Gandhara%2C_2nd-3rd_century_CE%2C_National_Museum%2C_Delhi.jpg",
    credit: "Stucco Head from Gandhara, 2nd-3rd century CE, National Museum, Delhi.jpg - CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Stucco_Head_from_Gandhara,_2nd-3rd_century_CE,_National_Museum,_Delhi.jpg",
  },
  "Black and Red Ware Sherd": {
    picture: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Red_and_Black_Ware_-_Sonkh_-_Showcase_6-15_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6467.JPG/960px-Red_and_Black_Ware_-_Sonkh_-_Showcase_6-15_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6467.JPG",
    credit: "Red and Black Ware - Sonkh - Showcase 6-15 - Prehistory and Terracotta Gallery - Government Museum - Mathura 2013-02-24 6467.JPG - CC BY 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Red_and_Black_Ware_-_Sonkh_-_Showcase_6-15_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6467.JPG",
  },};

module.exports = { ARTIFACT_IMAGES };
