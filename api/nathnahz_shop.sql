-- phpMyAdmin SQL Dump
-- version 4.9.5
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 30, 2025 at 07:23 AM
-- Server version: 10.6.16-MariaDB-cll-lve
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nyvjzrsb_shopmgmt`
--

-- --------------------------------------------------------

--
-- Table structure for table `carwash_transactions`
--

CREATE TABLE `carwash_transactions` (
  `id` int(11) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL,
  `worker_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`worker_ids`)),
  `vehicle_id` int(11) NOT NULL,
  `tariff` decimal(10,2) NOT NULL,
  `commission_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `transaction_date` datetime NOT NULL,
  `payment_method` varchar(40) NOT NULL,
  `bank_name` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `carwash_transactions`
--

INSERT INTO `carwash_transactions` (`id`, `organization_id`, `user_id`, `worker_id`, `worker_ids`, `vehicle_id`, `tariff`, `commission_amount`, `transaction_date`, `payment_method`, `bank_name`, `status`) VALUES
(27, 1, 1, 3, '[\"3\",\"4\",\"5\"]', 4, '500.00', '175.00', '2025-07-09 15:09:35', 'Bank', 'Awash', ''),
(28, 1, 1, 3, '[\"3\",\"4\"]', 5, '600.00', '210.00', '2025-07-11 12:52:29', 'Cash', '', ''),
(29, 1, 3, 3, '[\"3\",\"5\",\"6\"]', 4, '500.00', '175.00', '2025-07-18 10:52:00', 'Bank', 'CBE', ''),
(30, 1, 3, 3, '[\"3\",\"4\"]', 5, '600.00', '210.00', '2025-07-18 10:55:06', 'Cash', '', ''),
(31, 1, 3, 3, '[\"3\",\"4\",\"7\"]', 4, '500.00', '175.00', '2025-07-18 10:55:35', 'Cash', '', ''),
(32, 1, 2, 3, '[\"3\",\"4\"]', 4, '500.00', '175.00', '2025-07-28 05:38:52', 'Cash', '', ''),
(33, 1, 2, 4, '[\"4\",\"5\"]', 4, '500.00', '175.00', '2025-07-28 05:40:31', 'Cash', '', ''),
(34, 1, 2, 7, '[\"7\",\"8\"]', 7, '700.00', '245.00', '2025-07-28 05:41:42', 'Cash', '', ''),
(35, 1, 3, 14, '[\"14\"]', 19, '600.00', '210.00', '2025-07-29 10:53:06', 'Cash', '', ''),
(36, 1, 3, 13, '[\"13\"]', 17, '80.00', '28.00', '2025-07-29 10:53:51', 'Cash', '', ''),
(37, 1, 3, 13, '[\"13\"]', 16, '200.00', '70.00', '2025-07-29 11:02:23', 'Cash', '', ''),
(38, 1, 3, 13, '[\"13\"]', 17, '80.00', '28.00', '2025-07-29 11:02:56', 'Cash', '', ''),
(39, 1, 3, 13, '[\"13\"]', 17, '80.00', '28.00', '2025-07-29 11:03:30', 'Cash', '', ''),
(40, 1, 3, 13, '[\"13\"]', 17, '80.00', '28.00', '2025-07-29 11:03:39', 'Cash', '', ''),
(41, 1, 3, 13, '[\"13\"]', 17, '80.00', '28.00', '2025-07-29 11:04:07', 'Cash', '', ''),
(42, 1, 3, 4, '[\"4\"]', 9, '400.00', '140.00', '2025-07-29 11:05:41', 'Cash', '', ''),
(43, 1, 3, 4, '[\"4\"]', 9, '400.00', '140.00', '2025-07-29 11:05:57', 'Cash', '', ''),
(44, 1, 3, 16, '[\"16\"]', 17, '80.00', '28.00', '2025-07-29 11:06:37', 'Cash', '', ''),
(45, 1, 3, 16, '[\"16\"]', 17, '80.00', '28.00', '2025-07-29 11:06:50', 'Cash', '', ''),
(46, 1, 3, 16, '[\"16\"]', 17, '80.00', '28.00', '2025-07-29 11:07:05', 'Cash', '', ''),
(47, 1, 3, 6, '[\"6\",\"10\"]', 19, '600.00', '210.00', '2025-07-29 11:08:20', 'Cash', '', ''),
(48, 1, 3, 6, '[\"6\",\"10\"]', 17, '80.00', '28.00', '2025-07-29 11:08:55', 'Cash', '', ''),
(49, 1, 3, 10, '[\"10\",\"6\"]', 17, '80.00', '28.00', '2025-07-29 11:09:09', 'Cash', '', ''),
(50, 1, 3, 13, '[\"13\"]', 17, '80.00', '28.00', '2025-07-29 11:18:14', 'Cash', '', '');

-- --------------------------------------------------------

--
-- Table structure for table `car_spendings`
--

CREATE TABLE `car_spendings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `category` enum('purchase','logistics','consumption') NOT NULL,
  `reason` varchar(255) NOT NULL,
  `comment` text DEFAULT NULL,
  `transaction_date` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `car_spendings`
--

INSERT INTO `car_spendings` (`id`, `user_id`, `organization_id`, `amount`, `category`, `reason`, `comment`, `transaction_date`) VALUES
(9, 2, 1, '200.00', 'purchase', 'La amchi dube', '', '2025-07-01 17:45:19');

-- --------------------------------------------------------

--
-- Table structure for table `organizations`
--

CREATE TABLE `organizations` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `owner_user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `organizations`
--

INSERT INTO `organizations` (`id`, `name`, `created_at`, `owner_user_id`) VALUES
(1, 'Betse Spare Parts', '2025-06-10 13:10:12', 1),
(2, 'habte_coca', '2025-06-23 14:40:38', 5);

-- --------------------------------------------------------

--
-- Table structure for table `paid_commissions`
--

CREATE TABLE `paid_commissions` (
  `id` int(11) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paid_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `paid_commissions`
--

INSERT INTO `paid_commissions` (`id`, `organization_id`, `worker_id`, `amount`, `paid_at`) VALUES
(21, 1, 4, '58.33', '2025-07-09 15:09:40'),
(22, 1, 3, '163.33', '2025-07-18 10:51:25'),
(23, 1, 4, '105.00', '2025-07-18 10:51:26'),
(24, 1, 5, '58.33', '2025-07-18 10:51:28'),
(25, 1, 3, '58.33', '2025-07-18 10:52:32'),
(26, 1, 5, '58.33', '2025-07-18 10:52:34'),
(27, 1, 6, '58.33', '2025-07-18 10:52:36'),
(28, 1, 3, '163.33', '2025-07-18 10:56:02'),
(29, 1, 4, '163.33', '2025-07-18 10:56:03'),
(30, 1, 7, '58.33', '2025-07-18 10:56:05'),
(31, 1, 3, '87.50', '2025-07-29 10:51:51'),
(32, 1, 4, '175.00', '2025-07-29 10:51:53'),
(33, 1, 5, '87.50', '2025-07-29 10:51:55'),
(34, 1, 7, '122.50', '2025-07-29 10:51:57'),
(35, 1, 8, '122.50', '2025-07-29 10:51:59'),
(36, 1, 13, '28.00', '2025-07-29 10:57:29'),
(37, 1, 14, '210.00', '2025-07-29 10:58:21');

-- --------------------------------------------------------

--
-- Table structure for table `paid_commission_transactions`
--

CREATE TABLE `paid_commission_transactions` (
  `id` int(11) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paid_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'user',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `organization_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `is_active`, `organization_id`, `created_at`, `last_login`) VALUES
(1, 'betse', 'degi@gmail.com', '$2y$10$SqHlETU3LvvOe7aZ.D/jneaN8gLQfnmllydkQ2ZnC0Gpgm1Yf4o4y', 'admin', 1, 1, '2025-06-10 13:10:12', '2025-07-28 08:48:14'),
(2, 'bire', 'bire@gmail.com', '$2a$12$i8bihuAQQImbPF86aSLsK.syt3x508PGLpT5oLOlMrxKIv4.GjRm2', 'admin', 1, 1, '2025-06-10 13:59:01', '2025-07-27 07:04:24'),
(3, 'bebe', 'a@d.c', '$2a$12$U1QBp2.ESjfbpTVoHTfwSeySKRFjUjJLXfZ/5Ob781pzfncX1gdsq', 'worker', 1, 1, '2025-06-12 05:28:24', '2025-07-29 14:48:11'),
(4, 'sanbu', 'n@g.c', '$2a$12$U1QBp2.ESjfbpTVoHTfwSeySKRFjUjJLXfZ/5Ob781pzfncX1gdsq', 'user', 1, 1, '2025-06-12 07:43:14', '2025-07-28 09:42:34'),
(5, 'habte', 'habtsh@gmail.com', '$2a$12$5Cl.HwuQJJh/bs1nvUcdo.g/Lj4i5eCNOTa9XViiIPxI2ths.D.dm$2a$12$U1QBp2.ESjfbpTVoHTfwSeySKRFjUjJLXfZ/5Ob781pzfncX1gdsq', 'admin', 1, 1, '2025-06-23 14:40:38', '2025-06-23 15:13:06'),
(6, 'temesgen', 'Stire@gmail.com', '$2y$10$ESWFaKMu89r74Lw.wTB2rO5erX4U1NdUGUBl0BcUbwQlRPUrx.QkK', 'user', 1, 2, '2025-06-23 15:05:24', '2025-06-23 15:05:47');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `tariff` decimal(10,2) NOT NULL,
  `partial_tariff` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `organization_id`, `name`, `tariff`, `partial_tariff`, `created_at`) VALUES
(2, 1, 'Isuzu የህዝብ', '500.00', '400.00', '2025-06-12 06:18:59'),
(4, 1, 'FSR ጭነት', '500.00', '400.00', '2025-06-14 09:28:17'),
(5, 1, 'ሲኖ ትራክ', '600.00', '500.00', '2025-06-14 09:53:47'),
(6, 1, 'አውቶብስ 63 ወንበር', '700.00', '500.00', '2025-06-14 09:54:54'),
(7, 1, 'ትራምፕ (ከሶኒ)', '700.00', '500.00', '2025-06-14 09:55:42'),
(8, 1, 'ማርቼዲስ ገልባጭ', '500.00', '400.00', '2025-06-14 09:56:39'),
(9, 1, 'Isuzu የጭነት', '400.00', '300.00', '2025-06-14 09:57:28'),
(10, 1, 'ዶልፊን', '250.00', '200.00', '2025-06-14 09:58:02'),
(11, 1, 'ሀይሩፍ', '250.00', '200.00', '2025-06-14 09:58:18'),
(12, 1, 'ሚኒባስ', '250.00', '200.00', '2025-06-14 09:58:42'),
(13, 1, 'Hilux', '250.00', '200.00', '2025-06-14 09:59:09'),
(14, 1, 'Land cruizer', '250.00', '200.00', '2025-06-14 09:59:24'),
(15, 1, 'Corolla', '200.00', '150.00', '2025-06-14 09:59:49'),
(16, 1, 'Bajaj', '200.00', '150.00', '2025-06-14 10:00:05'),
(17, 1, 'ሞተር motor', '80.00', '80.00', '2025-06-14 10:00:26'),
(19, 1, 'FSR የህዝብ', '600.00', '500.00', '2025-06-29 15:39:45');

-- --------------------------------------------------------

--
-- Table structure for table `workers`
--

CREATE TABLE `workers` (
  `id` int(11) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `paid_commission` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unpaid_commission` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `workers`
--

INSERT INTO `workers` (`id`, `organization_id`, `name`, `paid_commission`, `unpaid_commission`, `created_at`) VALUES
(3, 1, 'NIGUSE', '472.49', '0.00', '2025-06-14 09:48:10'),
(4, 1, 'Alex', '501.66', '280.00', '2025-06-14 09:48:25'),
(5, 1, 'Barich achiru', '204.16', '0.00', '2025-06-14 09:48:44'),
(6, 1, 'Amanchi', '58.33', '133.00', '2025-06-14 09:48:53'),
(7, 1, 'Misge boss', '180.83', '0.00', '2025-06-14 09:49:06'),
(8, 1, 'Abeni', '122.50', '0.00', '2025-06-14 09:49:18'),
(10, 1, 'Barich binyam', '0.00', '133.00', '2025-06-14 09:51:27'),
(11, 1, 'Israel', '0.00', '0.00', '2025-06-14 09:51:37'),
(12, 1, 'Bayu', '0.00', '0.00', '2025-07-18 18:27:51'),
(13, 1, 'Sisaye', '28.00', '210.00', '2025-07-18 18:28:48'),
(14, 1, 'በዩ (የጥንቱ)', '210.00', '0.00', '2025-07-29 14:49:25'),
(15, 1, 'ብን (boss)', '0.00', '0.00', '2025-07-29 14:50:11'),
(16, 1, 'ቴድ (ፈላ)', '0.00', '84.00', '2025-07-29 14:50:37');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `carwash_transactions`
--
ALTER TABLE `carwash_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cwt_organization` (`organization_id`),
  ADD KEY `fk_cwt_user` (`user_id`),
  ADD KEY `fk_cwt_worker` (`worker_id`),
  ADD KEY `fk_cwt_vehicle` (`vehicle_id`);

--
-- Indexes for table `car_spendings`
--
ALTER TABLE `car_spendings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_car_spendings_organization` (`organization_id`);

--
-- Indexes for table `organizations`
--
ALTER TABLE `organizations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name_UNIQUE` (`name`),
  ADD KEY `owner_user_id` (`owner_user_id`);

--
-- Indexes for table `paid_commissions`
--
ALTER TABLE `paid_commissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pc_organization` (`organization_id`),
  ADD KEY `fk_pc_worker` (`worker_id`);

--
-- Indexes for table `paid_commission_transactions`
--
ALTER TABLE `paid_commission_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `organization_id` (`organization_id`),
  ADD KEY `worker_id` (`worker_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_organization` (`organization_id`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_vehicles_organization` (`organization_id`);

--
-- Indexes for table `workers`
--
ALTER TABLE `workers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_workers_organization` (`organization_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `carwash_transactions`
--
ALTER TABLE `carwash_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `car_spendings`
--
ALTER TABLE `car_spendings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `organizations`
--
ALTER TABLE `organizations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `paid_commissions`
--
ALTER TABLE `paid_commissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `paid_commission_transactions`
--
ALTER TABLE `paid_commission_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `workers`
--
ALTER TABLE `workers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `carwash_transactions`
--
ALTER TABLE `carwash_transactions`
  ADD CONSTRAINT `fk_cwt_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cwt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cwt_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
  ADD CONSTRAINT `fk_cwt_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `car_spendings`
--
ALTER TABLE `car_spendings`
  ADD CONSTRAINT `car_spendings_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_car_spendings_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `organizations`
--
ALTER TABLE `organizations`
  ADD CONSTRAINT `organizations_ibfk_1` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `paid_commissions`
--
ALTER TABLE `paid_commissions`
  ADD CONSTRAINT `fk_pc_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pc_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `paid_commission_transactions`
--
ALTER TABLE `paid_commission_transactions`
  ADD CONSTRAINT `paid_commission_transactions_ibfk_1` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `paid_commission_transactions_ibfk_2` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `paid_commission_transactions_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `fk_vehicles_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `workers`
--
ALTER TABLE `workers`
  ADD CONSTRAINT `fk_workers_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
