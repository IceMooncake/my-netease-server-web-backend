/*
  Warnings:

  - The primary key for the `oauth_access_tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `owner_id` on the `territories` table. All the data in the column will be lost.
  - You are about to drop the column `plots_limit` on the `territories` table. All the data in the column will be lost.
  - You are about to drop the column `pool_credits` on the `territories` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `territories` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `Enum(EnumId(1))`.
  - You are about to drop the `proposal_votes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `proposals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `territory_applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `territory_members` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `area` to the `territories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cost` to the `territories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `team_id` to the `territories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `x1` to the `territories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `x2` to the `territories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `z1` to the `territories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `z2` to the `territories` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `proposal_votes` DROP FOREIGN KEY `proposal_votes_ibfk_1`;

-- DropForeignKey
ALTER TABLE `proposals` DROP FOREIGN KEY `proposals_ibfk_1`;

-- DropForeignKey
ALTER TABLE `territories` DROP FOREIGN KEY `territories_ibfk_1`;

-- DropForeignKey
ALTER TABLE `territory_members` DROP FOREIGN KEY `territory_members_ibfk_1`;

-- DropForeignKey
ALTER TABLE `territory_members` DROP FOREIGN KEY `territory_members_ibfk_2`;

-- DropIndex
DROP INDEX `owner_id` ON `territories`;

-- AlterTable
ALTER TABLE `oauth_access_tokens` DROP PRIMARY KEY,
    MODIFY `access_token` VARCHAR(500) NOT NULL,
    ADD PRIMARY KEY (`access_token`);

-- AlterTable
ALTER TABLE `oauth_refresh_tokens` MODIFY `access_token` VARCHAR(500) NOT NULL;

-- AlterTable
ALTER TABLE `territories` DROP COLUMN `owner_id`,
    DROP COLUMN `plots_limit`,
    DROP COLUMN `pool_credits`,
    ADD COLUMN `area` INTEGER NOT NULL,
    ADD COLUMN `cost` INTEGER NOT NULL,
    ADD COLUMN `status` ENUM('PENDING_CREATE', 'ACTIVE', 'PENDING_DELETE', 'PENDING_UPDATE') NOT NULL DEFAULT 'PENDING_CREATE',
    ADD COLUMN `team_id` BIGINT NOT NULL,
    ADD COLUMN `x1` INTEGER NOT NULL,
    ADD COLUMN `x2` INTEGER NOT NULL,
    ADD COLUMN `z1` INTEGER NOT NULL,
    ADD COLUMN `z2` INTEGER NOT NULL,
    MODIFY `type` ENUM('NO_ENTRY', 'NO_BREAK') NOT NULL DEFAULT 'NO_ENTRY';

-- AlterTable
ALTER TABLE `users` ADD COLUMN `last_daily_check_in` DATE NULL,
    ADD COLUMN `left_group_at` DATETIME(0) NULL,
    ADD COLUMN `status` ENUM('ACTIVE', 'FROZEN', 'DELETED') NOT NULL DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE `proposal_votes`;

-- DropTable
DROP TABLE `proposals`;

-- DropTable
DROP TABLE `territory_applications`;

-- DropTable
DROP TABLE `territory_members`;

-- CreateTable
CREATE TABLE `teams` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `owner_id` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `team_credits` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `teams_owner_id_key`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `team_members` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `qq` VARCHAR(255) NOT NULL,
    `team_id` BIGINT NOT NULL,
    `joined_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `team_members_team_id_idx`(`team_id`),
    UNIQUE INDEX `uq_user_team`(`qq`, `team_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `votes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `team_id` BIGINT NOT NULL,
    `creator_qq` VARCHAR(191) NOT NULL,
    `type` ENUM('DISBAND_TEAM', 'CREATE_TERRITORY', 'DELETE_TERRITORY', 'UPDATE_TERRITORY', 'KICK_MEMBER') NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `title` VARCHAR(255) NULL,
    `payload` JSON NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deadline` TIMESTAMP(0) NOT NULL,
    `territory_id` BIGINT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vote_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `vote_id` BIGINT NOT NULL,
    `voter_qq` VARCHAR(191) NOT NULL,
    `decision` BOOLEAN NOT NULL,
    `vote_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `vote_records_vote_id_voter_qq_key`(`vote_id`, `voter_qq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_tasks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` ENUM('REVIEW_TERRITORY_CREATE', 'REVIEW_TERRITORY_DELETE', 'REVIEW_TERRITORY_UPDATE', 'CLEANUP_USER', 'RECYCLE_TERRITORY_SIZE') NOT NULL,
    `status` ENUM('PENDING', 'DONE', 'IGNORED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `payload` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,
    `processed_by` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedbacks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_qq` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`qq`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_qq_fkey` FOREIGN KEY (`qq`) REFERENCES `users`(`qq`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `territories` ADD CONSTRAINT `territories_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `votes` ADD CONSTRAINT `votes_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `votes` ADD CONSTRAINT `votes_territory_id_fkey` FOREIGN KEY (`territory_id`) REFERENCES `territories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vote_records` ADD CONSTRAINT `vote_records_vote_id_fkey` FOREIGN KEY (`vote_id`) REFERENCES `votes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vote_records` ADD CONSTRAINT `vote_records_voter_qq_fkey` FOREIGN KEY (`voter_qq`) REFERENCES `users`(`qq`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_tasks` ADD CONSTRAINT `admin_tasks_processed_by_fkey` FOREIGN KEY (`processed_by`) REFERENCES `users`(`qq`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_user_qq_fkey` FOREIGN KEY (`user_qq`) REFERENCES `users`(`qq`) ON DELETE RESTRICT ON UPDATE CASCADE;
