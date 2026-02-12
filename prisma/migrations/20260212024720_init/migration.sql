-- CreateTable
CREATE TABLE `group_members` (
    `qq` VARCHAR(255) NOT NULL,
    `status` TINYINT NOT NULL,
    `joined_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`qq`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proposal_votes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `proposal_id` BIGINT NOT NULL,
    `voter_qq` VARCHAR(255) NOT NULL,
    `decision` ENUM('approve', 'reject') NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_vote`(`proposal_id`, `voter_qq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proposals` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `territory_id` BIGINT NOT NULL,
    `type` ENUM('spend', 'join', 'expel') NOT NULL,
    `payload` JSON NOT NULL,
    `created_by` VARCHAR(255) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `required_votes` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `territory_id`(`territory_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `territories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `owner_id` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `type` ENUM('overworld', 'nether', 'end') NOT NULL DEFAULT 'overworld',
    `pool_credits` INTEGER NOT NULL DEFAULT 0,
    `plots_limit` INTEGER NOT NULL DEFAULT 3,

    UNIQUE INDEX `owner_id`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `territory_applications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `applicant_qq` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('overworld', 'nether', 'end') NOT NULL,
    `cost` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `decision_message` VARCHAR(255) NULL,
    `processed_by` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `processed_at` TIMESTAMP(0) NULL,

    INDEX `applicant_qq`(`applicant_qq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `territory_members` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `qq` VARCHAR(255) NOT NULL,
    `territory_id` BIGINT NOT NULL,
    `role` ENUM('owner', 'member') NULL DEFAULT 'member',
    `joined_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `user_id`(`qq`),
    INDEX `territory_id`(`territory_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `qq` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NULL,
    `create_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `nick_name` VARCHAR(255) NULL,
    `personal_credits` INTEGER NOT NULL DEFAULT 0,
    `is_admin` TINYINT NOT NULL DEFAULT 0,

    PRIMARY KEY (`qq`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_codes` (
    `qq` VARCHAR(255) NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `verified` BOOLEAN NULL DEFAULT false,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `password` VARCHAR(255) NULL,

    PRIMARY KEY (`qq`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_clients` (
    `client_id` VARCHAR(80) NOT NULL,
    `client_secret` VARCHAR(80) NULL,
    `redirect_uri` VARCHAR(2000) NOT NULL,
    `grant_types` VARCHAR(80) NULL,
    `scope` VARCHAR(2000) NULL,
    `user_id` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`client_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_access_tokens` (
    `access_token` VARCHAR(100) NOT NULL,
    `client_id` VARCHAR(80) NOT NULL,
    `user_qq` VARCHAR(255) NOT NULL,
    `expires_at` TIMESTAMP(0) NULL,
    `scope` VARCHAR(2000) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `oauth_access_tokens_client_id_fkey`(`client_id`),
    INDEX `oauth_access_tokens_user_qq_fkey`(`user_qq`),
    PRIMARY KEY (`access_token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_refresh_tokens` (
    `refresh_token` VARCHAR(100) NOT NULL,
    `access_token` VARCHAR(100) NOT NULL,
    `client_id` VARCHAR(80) NOT NULL,
    `user_qq` VARCHAR(255) NOT NULL,
    `expires_at` TIMESTAMP(0) NULL,
    `scope` VARCHAR(2000) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `oauth_refresh_tokens_client_id_fkey`(`client_id`),
    INDEX `oauth_refresh_tokens_user_qq_fkey`(`user_qq`),
    PRIMARY KEY (`refresh_token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_authorization_codes` (
    `authorization_code` VARCHAR(100) NOT NULL,
    `expires_at` TIMESTAMP(0) NULL,
    `redirect_uri` VARCHAR(2000) NULL,
    `scope` VARCHAR(2000) NULL,
    `client_id` VARCHAR(80) NOT NULL,
    `user_qq` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `oauth_authorization_codes_client_id_fkey`(`client_id`),
    INDEX `oauth_authorization_codes_user_qq_fkey`(`user_qq`),
    PRIMARY KEY (`authorization_code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `proposal_votes` ADD CONSTRAINT `proposal_votes_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_ibfk_1` FOREIGN KEY (`territory_id`) REFERENCES `territories`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `territories` ADD CONSTRAINT `territories_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users`(`qq`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `territory_members` ADD CONSTRAINT `territory_members_ibfk_1` FOREIGN KEY (`qq`) REFERENCES `users`(`qq`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `territory_members` ADD CONSTRAINT `territory_members_ibfk_2` FOREIGN KEY (`territory_id`) REFERENCES `territories`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `oauth_access_tokens` ADD CONSTRAINT `oauth_access_tokens_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`client_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oauth_access_tokens` ADD CONSTRAINT `oauth_access_tokens_user_qq_fkey` FOREIGN KEY (`user_qq`) REFERENCES `users`(`qq`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oauth_refresh_tokens` ADD CONSTRAINT `oauth_refresh_tokens_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`client_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oauth_refresh_tokens` ADD CONSTRAINT `oauth_refresh_tokens_user_qq_fkey` FOREIGN KEY (`user_qq`) REFERENCES `users`(`qq`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oauth_authorization_codes` ADD CONSTRAINT `oauth_authorization_codes_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`client_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oauth_authorization_codes` ADD CONSTRAINT `oauth_authorization_codes_user_qq_fkey` FOREIGN KEY (`user_qq`) REFERENCES `users`(`qq`) ON DELETE CASCADE ON UPDATE CASCADE;
