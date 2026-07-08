-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 06, 2025 at 06:43 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `370finalproject`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `nid` varchar(30) NOT NULL,
  `administration` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`nid`, `administration`) VALUES
('AD001', 'Department of Archaeology');

-- --------------------------------------------------------

--
-- Table structure for table `archeologist`
--

CREATE TABLE `archeologist` (
  `nid` varchar(30) NOT NULL,
  `affiliation` varchar(100) DEFAULT NULL,
  `biography` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `archeologist`
--

INSERT INTO `archeologist` (`nid`, `affiliation`, `biography`) VALUES
('A001', 'BRAC University', 'Expert in ancient South Asian sites.'),
('A002', 'BRAC University', 'Specialist in Mughal architecture.'),
('A003', 'BRAC University', 'Focus on archaeological excavation methods.');

-- --------------------------------------------------------

--
-- Table structure for table `excavation_project`
--

CREATE TABLE `excavation_project` (
  `project_id` int(11) NOT NULL,
  `p_name` varchar(150) NOT NULL,
  `organization` varchar(150) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `progress` varchar(50) DEFAULT NULL,
  `lead_archeologist` varchar(30) DEFAULT NULL,
  `site_id` int(11) DEFAULT NULL,
  `budget` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `excavation_project`
--

INSERT INTO `excavation_project` (`project_id`, `p_name`, `organization`, `start_date`, `end_date`, `progress`, `lead_archeologist`, `site_id`, `budget`) VALUES
(2, 'Project Mahasthangarh', 'Government', '2025-09-05', NULL, 'Just Started', 'A001', 1, 20000.00);

-- --------------------------------------------------------

--
-- Table structure for table `excavation_request`
--

CREATE TABLE `excavation_request` (
  `site_id` int(11) NOT NULL,
  `archeologist` varchar(30) NOT NULL,
  `proposal` text NOT NULL,
  `budget` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `excavation_request`
--

INSERT INTO `excavation_request` (`site_id`, `archeologist`, `proposal`, `budget`) VALUES
(4, 'A001', 'moja lageeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 12000.00);

-- --------------------------------------------------------

--
-- Table structure for table `e_team`
--

CREATE TABLE `e_team` (
  `project_id` int(11) NOT NULL,
  `teamNo` int(11) NOT NULL,
  `role` varchar(100) DEFAULT NULL,
  `manager` varchar(30) DEFAULT NULL,
  `member_list` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `e_team`
--

INSERT INTO `e_team` (`project_id`, `teamNo`, `role`, `manager`, `member_list`) VALUES
(2, 1, 'Painting Walls', 'adcd', 'Aslam, Alice, Sharif');

-- --------------------------------------------------------

--
-- Table structure for table `human_remains`
--

CREATE TABLE `human_remains` (
  `item_id` int(11) NOT NULL,
  `cause_of_death` varchar(150) DEFAULT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `ethnicity` varchar(100) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `decay_percentage` decimal(5,2) DEFAULT NULL,
  `ornaments` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `human_remains`
--

INSERT INTO `human_remains` (`item_id`, `cause_of_death`, `gender`, `ethnicity`, `age`, `decay_percentage`, `ornaments`) VALUES
(12, 'Natural Causes', 'Male', 'Dravidian', 35, 70.50, 'Beads'),
(13, 'Head Injury', 'Female', 'Aryan', 25, 50.00, 'None'),
(14, 'Ritual Burial', 'Male', 'Mixed', 40, 90.00, 'Bronze Ring'),
(15, 'Disease', 'Female', 'Indus Valley', 30, 30.50, 'Gold Necklace');

-- --------------------------------------------------------

--
-- Table structure for table `itemrequests`
--

CREATE TABLE `itemrequests` (
  `request_id` int(11) NOT NULL,
  `Museum_manager` varchar(30) NOT NULL,
  `item_id` int(11) NOT NULL,
  `purpose` text NOT NULL,
  `approval_status` enum('Pending','Approved','Denied') DEFAULT 'Pending',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `insurance_info` text NOT NULL,
  `admin` varchar(30) DEFAULT NULL,
  `request_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `itemrequests`
--

INSERT INTO `itemrequests` (`request_id`, `Museum_manager`, `item_id`, `purpose`, `approval_status`, `start_date`, `end_date`, `insurance_info`, `admin`, `request_date`) VALUES
(1, 'MM001', 1, 'Temporary exhibition on ancient pottery techniques', 'Pending', '2024-03-01', '2024-06-01', 'Insured for $5000 against damage and theft', NULL, '2025-09-06 11:29:52'),
(2, 'MM002', 5, 'Educational display about ancient weaponry', 'Approved', '2024-02-15', '2024-05-15', 'Full insurance coverage up to $8000', 'AD001', '2025-09-06 11:29:52'),
(3, 'MM003', 9, 'Special exhibition on historical artwork', 'Pending', '2024-04-01', '2024-07-01', 'Comprehensive insurance policy for artwork', NULL, '2025-09-06 11:29:52'),
(4, 'MM001', 3, 'Research study on decorative patterns', 'Denied', '2024-01-10', '2024-02-10', 'Standard research insurance', 'AD001', '2025-09-06 11:29:52'),
(5, 'MM002', 7, 'Cultural heritage display', 'Approved', '2024-03-15', '2024-06-15', 'Premium insurance coverage for jewelry items', 'AD001', '2025-09-06 11:29:52');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `item_id` int(11) NOT NULL,
  `site` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `picture` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `discovery_date` date DEFAULT NULL,
  `location` varchar(255) DEFAULT 'Govt. repository',
  `A_flag` enum('yes','no') DEFAULT 'yes',
  `Type` enum('Pottery','Metal_Object','Paintings','Human_Remains','other') DEFAULT 'other'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`item_id`, `site`, `name`, `picture`, `description`, `discovery_date`, `location`, `A_flag`, `Type`) VALUES
(1, 1, 'Clay Pot', NULL, 'Ancient clay storage pot', '2022-05-10', 'Govt. repository', 'yes', 'Pottery'),
(2, 1, 'Cooking Vessel', NULL, 'Pottery vessel used for cooking', '2021-11-15', 'Govt. repository', 'yes', 'Pottery'),
(3, 2, 'Decorated Jar', NULL, 'Jar with geometric patterns', '2020-03-20', 'Govt. repository', 'yes', 'Pottery'),
(4, 3, 'Small Cup', NULL, 'Cup used for rituals', '2019-07-18', 'Govt. repository', 'yes', 'Pottery'),
(5, 1, 'Bronze Sword', NULL, 'Bronze weapon used in warfare', '2018-09-25', 'Govt. repository', 'yes', 'Metal_Object'),
(6, 2, 'Iron Spearhead', NULL, 'Iron spearhead used in hunting', '2017-04-12', 'Govt. repository', 'yes', 'Metal_Object'),
(7, 2, 'Copper Bracelet', NULL, 'Jewelry made of copper', '2020-08-22', 'Govt. repository', 'yes', 'Metal_Object'),
(8, 3, 'Silver Coin', NULL, 'Ancient currency coin', '2016-01-05', 'Govt. repository', 'yes', 'Metal_Object'),
(9, 1, 'Village Scene', NULL, 'Painting depicting rural life', '2021-06-14', 'Govt. repository', 'yes', 'Paintings'),
(10, 2, 'Battlefield', NULL, 'Historical war painting', '2019-09-09', 'Govt. repository', 'yes', 'Paintings'),
(11, 3, 'Royal Portrait', NULL, 'Portrait of a king', '2018-12-02', 'Govt. repository', 'yes', 'Paintings'),
(12, 1, 'Skeleton A', NULL, 'Human skeletal remains', '2015-04-01', 'Govt. repository', 'yes', 'Human_Remains'),
(13, 2, 'Skull Fragment', NULL, 'Part of human skull', '2017-11-11', 'Govt. repository', 'yes', 'Human_Remains'),
(14, 3, 'Burial Remains', NULL, 'Remains found in burial site', '2016-07-21', 'Govt. repository', 'yes', 'Human_Remains'),
(15, 2, 'Mummified Body', NULL, 'Partially preserved remains', '2014-02-17', 'Govt. repository', 'yes', 'Human_Remains'),
(16, 1, 'Crown ', NULL, 'Crown of hason raja', '2025-09-02', 'Govt. repository', 'yes', 'Metal_Object');

-- --------------------------------------------------------

--
-- Table structure for table `metal_object`
--

CREATE TABLE `metal_object` (
  `item_id` int(11) NOT NULL,
  `utility` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `metal_object`
--

INSERT INTO `metal_object` (`item_id`, `utility`) VALUES
(5, 'Weapon'),
(6, 'Weapon'),
(7, 'Adornment'),
(8, 'Currency');

-- --------------------------------------------------------

--
-- Table structure for table `metal_object_2`
--

CREATE TABLE `metal_object_2` (
  `item_id` int(11) NOT NULL,
  `alloy` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `metal_object_2`
--

INSERT INTO `metal_object_2` (`item_id`, `alloy`) VALUES
(5, 'Bronze Alloy'),
(6, 'Iron'),
(7, 'Copper'),
(8, 'Silver');

-- --------------------------------------------------------

--
-- Table structure for table `museum_manager`
--

CREATE TABLE `museum_manager` (
  `nid` varchar(30) NOT NULL,
  `museum_name` varchar(100) NOT NULL,
  `m_city` varchar(100) NOT NULL,
  `m_street` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `museum_manager`
--

INSERT INTO `museum_manager` (`nid`, `museum_name`, `m_city`, `m_street`) VALUES
('MM001', 'National Museum of Bangladesh', 'Dhaka', 'Shahbag Avenue'),
('MM002', 'Bangladesh Folk Art Museum', 'Dhaka', 'Sonargaon Road'),
('MM003', 'Varendra Research Museum', 'Rajshahi', 'University Road');

-- --------------------------------------------------------

--
-- Table structure for table `paintings`
--

CREATE TABLE `paintings` (
  `item_id` int(11) NOT NULL,
  `painter` varchar(150) DEFAULT NULL,
  `canvas_material` varchar(100) DEFAULT NULL,
  `paint_type` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `paintings`
--

INSERT INTO `paintings` (`item_id`, `painter`, `canvas_material`, `paint_type`) VALUES
(9, 'Unknown Artist', 'Cloth Canvas', 'Natural Pigments'),
(10, 'Warrior Monk', 'Cotton Canvas', 'Oil Paint'),
(11, 'Royal Artisan', 'Silk Canvas', 'Watercolor');

-- --------------------------------------------------------

--
-- Table structure for table `pottery`
--

CREATE TABLE `pottery` (
  `item_id` int(11) NOT NULL,
  `utility` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pottery`
--

INSERT INTO `pottery` (`item_id`, `utility`) VALUES
(1, 'Storage'),
(2, 'Cooking'),
(3, 'Storage'),
(4, 'Ritual');

-- --------------------------------------------------------

--
-- Table structure for table `pottery_2`
--

CREATE TABLE `pottery_2` (
  `item_id` int(11) NOT NULL,
  `material_type` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pottery_2`
--

INSERT INTO `pottery_2` (`item_id`, `material_type`) VALUES
(1, 'Terracotta'),
(2, 'Terracotta'),
(3, 'Ceramic'),
(4, 'Terracotta');

-- --------------------------------------------------------

--
-- Table structure for table `request_maintenance`
--

CREATE TABLE `request_maintenance` (
  `request_id` int(11) NOT NULL,
  `site_id` int(11) DEFAULT NULL,
  `caretaker` varchar(30) DEFAULT NULL,
  `damage` text NOT NULL,
  `approved_budget` decimal(12,2) DEFAULT NULL,
  `repair_cost` decimal(12,2) NOT NULL,
  `request_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `admin` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `request_maintenance`
--

INSERT INTO `request_maintenance` (`request_id`, `site_id`, `caretaker`, `damage`, `approved_budget`, `repair_cost`, `request_date`, `status`, `admin`) VALUES
(1, 1, 'SC001', 'Heavy rainfall caused erosion on the northern wall of the excavation site. Bricks are becoming loose and need reinforcement.', NULL, 15000.00, '2025-09-06 11:05:28', 'Pending', NULL),
(2, 2, 'SC002', 'Main stupa structure has developed cracks due to soil settlement. Needs professional structural assessment and repair.', 22000.00, 25000.00, '2025-09-06 11:05:28', 'Approved', NULL),
(3, 3, 'SC003', 'Visitor pathway has deteriorated and become unsafe. Needs resurfacing and safety railings installed.', 10000.00, 12000.00, '2025-09-06 11:05:28', 'Approved', NULL),
(4, 1, 'SC001', 'Drainage system around the site is clogged and causing water accumulation during rains. Needs cleaning and repair.', 8000.00, 8000.00, '2025-09-06 11:05:28', 'Approved', 'AD001'),
(5, 2, 'SC002', 'Security fencing has been damaged in several sections. Needs replacement to prevent unauthorized access.', NULL, 18000.00, '2025-09-06 11:05:28', 'Pending', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sites`
--

CREATE TABLE `sites` (
  `site_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `era` varchar(100) DEFAULT NULL,
  `s_thana` varchar(100) DEFAULT NULL,
  `s_district` varchar(100) DEFAULT NULL,
  `s_street` varchar(150) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `architecture` text DEFAULT NULL,
  `pictures` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sites`
--

INSERT INTO `sites` (`site_id`, `name`, `era`, `s_thana`, `s_district`, `s_street`, `description`, `architecture`, `pictures`) VALUES
(1, 'Mahasthangarh', 'Pala Period', 'Badalgachhi', 'Naogaon', 'Main Road', 'Ancient city ruins of the Pala dynasty.', 'Brick walls and fortifications.', 'mahasthangarh.jpg'),
(2, 'Somapura Mahavihara', 'Pala Period', 'Paharpur Thana', 'Naogaon', 'Vihara Road', 'Famous Buddhist monastery and UNESCO World Heritage Site.', 'Brick monastery with central stupa.', 'somapura.jpg'),
(3, 'Mainamati', '8th-12th Century', 'Comilla Sadar', 'Comilla', 'Temple Street', 'Archaeological site with Buddhist and Hindu ruins.', 'Temples and stupas scattered across the site.', 'mainamati.jpg'),
(4, 'shabnam', 'mandattar amol', NULL, NULL, NULL, 'ajobbbbbb', 'niceeeee', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `site_caretaker`
--

CREATE TABLE `site_caretaker` (
  `nid` varchar(30) NOT NULL,
  `site_id` int(11) NOT NULL,
  `budget` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `site_caretaker`
--

INSERT INTO `site_caretaker` (`nid`, `site_id`, `budget`) VALUES
('SC001', 1, 50000.00),
('SC002', 2, 75000.00),
('SC003', 3, 60000.00);

-- --------------------------------------------------------

--
-- Table structure for table `team_manager`
--

CREATE TABLE `team_manager` (
  `nid` varchar(30) NOT NULL,
  `project_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `team_manager`
--

INSERT INTO `team_manager` (`nid`, `project_id`) VALUES
('adcd', 2);

-- --------------------------------------------------------

--
-- Table structure for table `tools`
--

CREATE TABLE `tools` (
  `Model_no` varchar(50) NOT NULL,
  `type` varchar(100) NOT NULL,
  `owner` varchar(100) NOT NULL,
  `insurance_info` text DEFAULT NULL,
  `hazard` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tools`
--

INSERT INTO `tools` (`Model_no`, `type`, `owner`, `insurance_info`, `hazard`) VALUES
('BRH-3003', 'Brush Set', 'Dept. of Archaeology', 'Not insured', 'Low hazard'),
('CMP-4004', 'Portable Compressor', 'Private Supplier Ltd', 'Covered till 2025', 'Noise hazard'),
('DRL-1001', 'Drilling Machine', 'Dept. of Archaeology', 'Covered till 2026', 'Wear safety goggles'),
('EXC-2002', 'Excavator', 'Govt Contractor', 'Full insurance', 'High accident risk'),
('GEN-6006', 'Power Generator', 'Govt Contractor', 'Covered till 2027', 'Fire hazard'),
('LTN-5005', 'Laser Scanner', 'BRAC University Lab', 'Premium insurance', 'Eye hazard, handle with care'),
('TNT-7007', 'Trowel Set', 'Dept. of Archaeology', 'Not insured', 'Low hazard');

-- --------------------------------------------------------

--
-- Table structure for table `toolsrentalrequest`
--

CREATE TABLE `toolsrentalrequest` (
  `NID` varchar(30) NOT NULL,
  `Model_no` varchar(50) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `approval_status` enum('Pending','Approved','Denied') DEFAULT 'Pending',
  `purpose` text NOT NULL,
  `admin` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `toolsrentalrequest`
--

INSERT INTO `toolsrentalrequest` (`NID`, `Model_no`, `start_date`, `end_date`, `approval_status`, `purpose`, `admin`) VALUES
('A001', 'BRH-3003', '2025-09-06', '2025-09-11', 'Pending', 'Painting of outer wall', NULL),
('A001', 'DRL-1001', '2025-09-06', '2025-09-11', 'Pending', 'Painting of outer wall', NULL),
('A001', 'EXC-2002', '2025-09-06', '2025-09-11', 'Approved', 'Painting of outer wall', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `nid` varchar(30) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'other',
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `profile_pic` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`nid`, `role`, `name`, `email`, `phone`, `password`, `profile_pic`) VALUES
('A001', 'archaeologist', 'Alice Rahman', 'alice@g.bracu.ac.bd', '+8801712345678', 'hashed_password1', 'alice.jpg'),
('A002', 'archaeologist', 'Bob Karim', 'bob@g.bracu.ac.bd', '+8801723456789', 'hashed_password2', 'bob.jpg'),
('A003', 'archaeologist', 'Charlie Hasan', 'charlie@g.bracu.ac.bd', '+8801734567890', 'hashed_password3', 'charlie.jpg'),
('AD001', 'admin', 'Dina Chowdhury', 'dina@gov.bd', '+8801745678901', 'hashed_password_admin', 'dina.jpg'),
('adcd', 'manager', 'adcd', 'adcd@kisuekta.com', '34567', 'defaultpass', NULL),
('MM001', 'museum_manager', 'Fatima Begum', 'fatima.begum@bracu.ac.bd', '+8801789012345', 'hashed_password_mm1', 'fatima.jpg'),
('MM002', 'museum_manager', 'Tariq Islam', 'tariq.islam@bracu.ac.bd', '+8801790123456', 'hashed_password_mm2', 'tariq.jpg'),
('MM003', 'museum_manager', 'Nusrat Jahan', 'nusrat.jahan@bracu.ac.bd', '+8801801234567', 'hashed_password_mm3', 'nusrat.jpg'),
('SC001', 'site_caretaker', 'Rahim Khan', 'rahim.khan@outlook.com', '+8801756789012', 'hashed_password_sc1', 'rahim.jpg'),
('SC002', 'site_caretaker', 'Sultana Ahmed', 'sultana.ahmed@outlook.com', '+8801767890123', 'hashed_password_sc2', 'sultana.jpg'),
('SC003', 'site_caretaker', 'Jamal Uddin', 'jamal.uddin@outlook.com', '+8801778901234', 'hashed_password_sc3', 'jamal.jpg');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`nid`);

--
-- Indexes for table `archeologist`
--
ALTER TABLE `archeologist`
  ADD PRIMARY KEY (`nid`);

--
-- Indexes for table `excavation_project`
--
ALTER TABLE `excavation_project`
  ADD PRIMARY KEY (`project_id`),
  ADD UNIQUE KEY `p_name` (`p_name`),
  ADD KEY `lead_archeologist` (`lead_archeologist`),
  ADD KEY `site_id` (`site_id`);

--
-- Indexes for table `excavation_request`
--
ALTER TABLE `excavation_request`
  ADD PRIMARY KEY (`site_id`,`archeologist`),
  ADD KEY `archeologist` (`archeologist`);

--
-- Indexes for table `e_team`
--
ALTER TABLE `e_team`
  ADD PRIMARY KEY (`project_id`,`teamNo`),
  ADD KEY `manager` (`manager`);

--
-- Indexes for table `human_remains`
--
ALTER TABLE `human_remains`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `itemrequests`
--
ALTER TABLE `itemrequests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `Museum_manager` (`Museum_manager`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `admin` (`admin`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `metal_object`
--
ALTER TABLE `metal_object`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `metal_object_2`
--
ALTER TABLE `metal_object_2`
  ADD PRIMARY KEY (`item_id`,`alloy`);

--
-- Indexes for table `museum_manager`
--
ALTER TABLE `museum_manager`
  ADD PRIMARY KEY (`nid`);

--
-- Indexes for table `paintings`
--
ALTER TABLE `paintings`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `pottery`
--
ALTER TABLE `pottery`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `pottery_2`
--
ALTER TABLE `pottery_2`
  ADD PRIMARY KEY (`item_id`,`material_type`);

--
-- Indexes for table `request_maintenance`
--
ALTER TABLE `request_maintenance`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `site_id` (`site_id`),
  ADD KEY `caretaker` (`caretaker`),
  ADD KEY `admin` (`admin`);

--
-- Indexes for table `sites`
--
ALTER TABLE `sites`
  ADD PRIMARY KEY (`site_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `site_caretaker`
--
ALTER TABLE `site_caretaker`
  ADD PRIMARY KEY (`nid`,`site_id`),
  ADD KEY `site_id` (`site_id`);

--
-- Indexes for table `team_manager`
--
ALTER TABLE `team_manager`
  ADD PRIMARY KEY (`nid`,`project_id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `tools`
--
ALTER TABLE `tools`
  ADD PRIMARY KEY (`Model_no`);

--
-- Indexes for table `toolsrentalrequest`
--
ALTER TABLE `toolsrentalrequest`
  ADD PRIMARY KEY (`NID`,`Model_no`),
  ADD KEY `Model_no` (`Model_no`),
  ADD KEY `admin` (`admin`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`nid`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `excavation_project`
--
ALTER TABLE `excavation_project`
  MODIFY `project_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `itemrequests`
--
ALTER TABLE `itemrequests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `request_maintenance`
--
ALTER TABLE `request_maintenance`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `sites`
--
ALTER TABLE `sites`
  MODIFY `site_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin`
--
ALTER TABLE `admin`
  ADD CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`nid`) REFERENCES `users` (`nid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `archeologist`
--
ALTER TABLE `archeologist`
  ADD CONSTRAINT `archeologist_ibfk_1` FOREIGN KEY (`nid`) REFERENCES `users` (`nid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `excavation_project`
--
ALTER TABLE `excavation_project`
  ADD CONSTRAINT `excavation_project_ibfk_1` FOREIGN KEY (`lead_archeologist`) REFERENCES `archeologist` (`nid`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `excavation_project_ibfk_2` FOREIGN KEY (`site_id`) REFERENCES `sites` (`site_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `excavation_request`
--
ALTER TABLE `excavation_request`
  ADD CONSTRAINT `excavation_request_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `sites` (`site_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `excavation_request_ibfk_2` FOREIGN KEY (`archeologist`) REFERENCES `archeologist` (`nid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `e_team`
--
ALTER TABLE `e_team`
  ADD CONSTRAINT `e_team_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `excavation_project` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `e_team_ibfk_2` FOREIGN KEY (`manager`) REFERENCES `users` (`nid`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `human_remains`
--
ALTER TABLE `human_remains`
  ADD CONSTRAINT `human_remains_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE;

--
-- Constraints for table `itemrequests`
--
ALTER TABLE `itemrequests`
  ADD CONSTRAINT `itemrequests_ibfk_1` FOREIGN KEY (`Museum_manager`) REFERENCES `museum_manager` (`nid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `itemrequests_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `itemrequests_ibfk_3` FOREIGN KEY (`admin`) REFERENCES `admin` (`nid`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `metal_object`
--
ALTER TABLE `metal_object`
  ADD CONSTRAINT `metal_object_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE;

--
-- Constraints for table `metal_object_2`
--
ALTER TABLE `metal_object_2`
  ADD CONSTRAINT `metal_object_2_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE;

--
-- Constraints for table `museum_manager`
--
ALTER TABLE `museum_manager`
  ADD CONSTRAINT `museum_manager_ibfk_1` FOREIGN KEY (`nid`) REFERENCES `users` (`nid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `paintings`
--
ALTER TABLE `paintings`
  ADD CONSTRAINT `paintings_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE;

--
-- Constraints for table `pottery`
--
ALTER TABLE `pottery`
  ADD CONSTRAINT `pottery_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE;

--
-- Constraints for table `pottery_2`
--
ALTER TABLE `pottery_2`
  ADD CONSTRAINT `pottery_2_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE;

--
-- Constraints for table `request_maintenance`
--
ALTER TABLE `request_maintenance`
  ADD CONSTRAINT `request_maintenance_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `sites` (`site_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `request_maintenance_ibfk_2` FOREIGN KEY (`caretaker`) REFERENCES `site_caretaker` (`nid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `request_maintenance_ibfk_3` FOREIGN KEY (`admin`) REFERENCES `admin` (`nid`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `site_caretaker`
--
ALTER TABLE `site_caretaker`
  ADD CONSTRAINT `site_caretaker_ibfk_1` FOREIGN KEY (`nid`) REFERENCES `users` (`nid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `site_caretaker_ibfk_2` FOREIGN KEY (`site_id`) REFERENCES `sites` (`site_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `team_manager`
--
ALTER TABLE `team_manager`
  ADD CONSTRAINT `team_manager_ibfk_1` FOREIGN KEY (`nid`) REFERENCES `users` (`nid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `team_manager_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `excavation_project` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `toolsrentalrequest`
--
ALTER TABLE `toolsrentalrequest`
  ADD CONSTRAINT `toolsrentalrequest_ibfk_1` FOREIGN KEY (`NID`) REFERENCES `users` (`nid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `toolsrentalrequest_ibfk_2` FOREIGN KEY (`Model_no`) REFERENCES `tools` (`Model_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `toolsrentalrequest_ibfk_3` FOREIGN KEY (`admin`) REFERENCES `admin` (`nid`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
