CREATE TABLE IF NOT EXISTS `privy_users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `citizenid` VARCHAR(50) NOT NULL UNIQUE,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `display_name` VARCHAR(100) NOT NULL,
    `avatar` TEXT DEFAULT NULL,
    `banner` TEXT DEFAULT NULL,
    `bio` TEXT DEFAULT NULL,
    `is_premium` TINYINT(1) NOT NULL DEFAULT 0,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `payment_currency` VARCHAR(10) NOT NULL DEFAULT 'cash',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `privy_posts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `image` TEXT DEFAULT NULL,
    `images` TEXT DEFAULT NULL,
    `visibility` ENUM('free', 'premium') NOT NULL DEFAULT 'free',
    `likes` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `privy_likes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    UNIQUE KEY `unique_like` (`post_id`, `user_id`),
    FOREIGN KEY (`post_id`) REFERENCES `privy_posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `privy_comments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`post_id`) REFERENCES `privy_posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `privy_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `sender_id` INT NOT NULL,
    `receiver_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `type` ENUM('text', 'image', 'video', 'payment') NOT NULL DEFAULT 'text',
    `media_url` TEXT DEFAULT NULL,
    `amount` DECIMAL(10, 2) DEFAULT NULL,
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`sender_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`receiver_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `privy_followers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `follower_id` INT NOT NULL,
    `following_id` INT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_follow` (`follower_id`, `following_id`),
    FOREIGN KEY (`follower_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`following_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `privy_tips` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `from_user_id` INT NOT NULL,
    `to_user_id` INT NOT NULL,
    `post_id` INT DEFAULT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`from_user_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`to_user_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`post_id`) REFERENCES `privy_posts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `privy_stories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `media_url` TEXT NOT NULL,
    `caption` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 24 HOUR),
    FOREIGN KEY (`user_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `privy_blocks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `blocker_id` INT NOT NULL,
    `blocked_id` INT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_block` (`blocker_id`, `blocked_id`),
    FOREIGN KEY (`blocker_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`blocked_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `privy_reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `reporter_id` INT NOT NULL,
    `reported_user_id` INT DEFAULT NULL,
    `post_id` INT DEFAULT NULL,
    `reason` TEXT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`reporter_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reported_user_id`) REFERENCES `privy_users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`post_id`) REFERENCES `privy_posts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `privy_wallet` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `cash_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `prisma_balance` INT NOT NULL DEFAULT 0,
    FOREIGN KEY (`user_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `privy_notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `from_user_id` INT NOT NULL,
    `type` ENUM('like', 'comment', 'follow', 'tip', 'message') NOT NULL,
    `text` VARCHAR(255) NOT NULL,
    `post_id` INT DEFAULT NULL,
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`from_user_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`post_id`) REFERENCES `privy_posts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `privy_subscriptions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `subscriber_id` INT NOT NULL,
    `creator_id` INT NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'cash',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 7 DAY),
    UNIQUE KEY `unique_subscription` (`subscriber_id`, `creator_id`),
    FOREIGN KEY (`subscriber_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`creator_id`) REFERENCES `privy_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
